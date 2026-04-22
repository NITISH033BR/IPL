import mongoose from 'mongoose';

const outboxEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  
  // 🚨 ELITE UPGRADES: Versioning & Priority
  version: { type: Number, default: 1 },
  priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH'], default: 'NORMAL', index: true },
  
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER'], 
    default: 'PENDING',
    index: true 
  },
  
  lockedBy: { type: String, index: true }, 
  lockedAt: { type: Date },
  retries: { type: Number, default: 0 },
  lastAttemptedAt: { type: Date },
  processedAt: { type: Date },
  error: { type: String }
}, { timestamps: true });

// Compound index for optimal fetching
outboxEventSchema.index({ status: 1, priority: -1, createdAt: 1 });

// 🚨 ELITE UPGRADE: TTL Index for automatic cleanup (Deletes PROCESSED events after 7 days)
outboxEventSchema.index(
  { processedAt: 1 }, 
  { expireAfterSeconds: 604800, partialFilterExpression: { status: 'PROCESSED' } }
);

export const OutboxEvent = mongoose.model('OutboxEvent', outboxEventSchema);