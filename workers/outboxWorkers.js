import { OutboxEvent } from '../models/OutboxEvent.js';
import { logger } from '../utils/logger.js';
import { matchQueue } from '../utils/queue.js';
import os from 'os';

const WORKER_ID = `worker-${os.hostname()}-${process.pid}`;
const MAX_CONCURRENCY = 20; 
let activeJobs = 0;

// The core processing logic for a single event
const processSingleEvent = async (eventId) => {
  if (activeJobs >= MAX_CONCURRENCY) return; // Backpressure control

  // 1. ATOMIC CLAIM: findOneAndUpdate guarantees exactly-once locking per document
  const event = await OutboxEvent.findOneAndUpdate(
    { _id: eventId, status: 'PENDING' },
    { $set: { status: 'PROCESSING', lockedBy: WORKER_ID, lockedAt: new Date() } },
    { new: true }
  );

  if (!event) return; // Claimed by another worker
  activeJobs++;

  try {
    // 2. SEND TO QUEUE (BullMQ / Kafka)
    await matchQueue.add(event.eventType, {
      outboxEventId: event._id,
      entityId: event.entityId,
      payload: event.payload,
      version: event.version
    }, {
      jobId: event._id.toString(),
      priority: event.priority === 'HIGH' ? 1 : 2
    });

    // 3. MARK PROCESSED
    await OutboxEvent.updateOne(
      { _id: event._id },
      { $set: { status: 'PROCESSED', processedAt: new Date() }, $unset: { lockedBy: 1, lockedAt: 1 } }
    );
    logger.info({ eventId: event._id }, "Event processed natively");

  } catch (error) {
    // 4. DEAD LETTER QUEUE & RETRY LOGIC
    const isDeadLetter = event.retries + 1 >= 3;
    await OutboxEvent.updateOne(
      { _id: event._id },
      { 
        $set: { status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED', error: error.message, lastAttemptedAt: new Date() },
        $inc: { retries: 1 },
        $unset: { lockedBy: 1, lockedAt: 1 } 
      }
    );
    logger.error({ err: error, eventId: event._id, isDeadLetter }, "Event failed");
  } finally {
    activeJobs--;
  }
};

export const startChangeStreamWorker = () => {
  logger.info(`Starting event-driven outbox worker [${WORKER_ID}]...`);

  // 🚨 ELITE UPGRADE: Change Streams (Real-time, zero-polling)
  const changeStream = OutboxEvent.watch([
    { $match: { operationType: 'insert', 'fullDocument.status': 'PENDING' } }
  ]);

  changeStream.on('change', (change) => {
    processSingleEvent(change.documentKey._id);
  });

  // Fallback Sweeper: Picks up events that failed or workers crashed while processing
  setInterval(async () => {
    const staleLock = new Date(Date.now() - 60000); // 1 min visibility timeout
    const fallbackEvents = await OutboxEvent.find({
      $or: [
        { status: 'FAILED', retries: { $lt: 3 } },
        { status: 'PROCESSING', lockedAt: { $lt: staleLock } }
      ]
    }).limit(10).select('_id');

    fallbackEvents.forEach(e => processSingleEvent(e._id));
  }, 10000);
};