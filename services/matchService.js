import mongoose from 'mongoose';
import { MatchCore } from '../models/Match.js';
import { OutboxEvent } from '../models/OutboxEvent.js';
import { redisClient } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { ValidationError, ConflictError, SystemError } from '../utils/errors.js';
import { metrics } from '../utils/metrics.js'; // 🚨 ACTIVE: Prometheus/StatsD hooks

const EVENT_SCHEMA_VERSION = 1;

export const updateScoreIdempotent = async (matchId, home, away, adminId, requestTimestamp) => {
  // 🚨 FINAL FIX 1: Time Consistency. The controller dictates the exact millisecond 
  // the request entered the system. This guarantees all downstream microservices 
  // agree on the absolute timeline, ignoring clock skew between worker nodes.
  const timestamp = requestTimestamp || new Date(); 
  
  const MAX_RETRIES = 3;
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < MAX_RETRIES) {
    attempts++;
    const session = await mongoose.startSession();
    
    session.startTransaction({
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' }
    });

    try {
      const match = await MatchCore.findOne({ matchId })
        .maxTimeMS(2000)
        .session(session);
        
      if (!match) throw new ValidationError("Match not found");

      if (!['upcoming', 'live'].includes(match.status)) {
          throw new ValidationError(`Cannot update score. Match is ${match.status}.`);
      }

      const oldScore = { home: match.score.home, away: match.score.away };

      if (home < oldScore.home || away < oldScore.away) {
          throw new ValidationError(`Scores cannot decrease. Current: ${oldScore.home}-${oldScore.away}`);
      }

      if (Math.abs(oldScore.home - home) > 10 || Math.abs(oldScore.away - away) > 10) {
          throw new ValidationError("Score delta exceeds maximum allowed limits (Anti-Fraud).");
      }

      await match.updateScore(home, away, adminId);
      await match.save({ session }); 

      await OutboxEvent.create([{
        eventType: 'SCORE_UPDATED',
        entityType: 'Match',
        entityId: matchId,
        version: EVENT_SCHEMA_VERSION, 
        priority: 'HIGH',
        payload: { 
          matchId, 
          oldScore, 
          newScore: { home, away }, 
          status: match.status, 
          updatedBy: adminId,
          timestamp // Consistent cluster-wide timeline
        }
      }], { session });

      // 🚨 FINAL FIX 5: Transaction Commit Timeout
      // Ensures that if the replica set is struggling to reach majority write consensus, 
      // we fail fast instead of holding the OCC lock hostage.
      await session.commitTransaction({ maxTimeMS: 2000 });

      // 🚨 FINAL FIX 3: Metrics Activated
      const latencyMs = Date.now() - startTime;
      metrics.histogram('db_score_update_latency_ms', latencyMs);
      metrics.increment('db_score_update_success', 1, { attempts });

      Promise.allSettled([
        redisClient.del('matches:active'),
        redisClient.del(`match:${matchId}`)
      ]).then(results => {
        results.forEach(res => {
          if (res.status === 'rejected') logger.warn({ err: res.reason, matchId }, "Partial Redis invalidation failure");
        });
      });

      return match;

    } catch (error) {
      await session.abortTransaction();
      
      const isTransient = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
      const isOCC = error.name === 'VersionError';

      if ((isTransient || isOCC) && attempts < MAX_RETRIES) {
        metrics.increment('db_transaction_retry', 1, { type: isOCC ? 'occ' : 'transient' });
        const backoffMs = 100 * Math.pow(2, attempts); 
        logger.warn({ matchId, attempts, isOCC }, `Transaction failed, retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue; 
      }

      if (attempts === MAX_RETRIES && (isTransient || isOCC)) {
        logger.error({ matchId, attempts, error: error.message }, "Max retry attempts reached for score update");
        metrics.increment('db_transaction_exhausted', 1);
      }

      if (isOCC) {
        throw new ConflictError("Concurrency Conflict: The match was updated by another process. Fetch latest state and retry.");
      }
      
      if (error.statusCode) throw error; 
      
      throw new SystemError(`Score update failed: ${error.message}`);

    } finally {
      session.endSession();
    }
  }
};