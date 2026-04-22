import mongoose from "mongoose";
import crypto from "crypto";
import { EventEmitter } from "events";

// 🚨 REQ 8: Lightweight logging/event hook system
export const matchEvents = new EventEmitter();

// Sub-schema for Audit Trail
const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String }
}, { _id: false });

const matchCoreSchema = new mongoose.Schema({
  // 1. Core Identifiers
  matchId: {
    type: String,
    unique: true,
    index: true,
    immutable: true,
    default: () => crypto.randomUUID()
  },
  // 🚨 REQ 2: Index is implicitly created via `index: true` + `unique: true`
  displayId: {
    type: String,
    unique: true,
    index: true,
    immutable: true,
    default: () => `M-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
  },

  // 2. Team Data
  homeTeam: { name: { type: String, required: true, trim: true } },
  awayTeam: { name: { type: String, required: true, trim: true } },

  // 3. State & Score Management
  status: {
    type: String,
    enum: ["upcoming", "live", "completed", "cancelled"],
    default: "upcoming",
    index: true
  },
  statusHistory: [statusHistorySchema],
  
  statusUpdatedAt: { type: Date, default: Date.now },
  resultUpdatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String },

  // 🚨 REQ 4: Strict score validation (finite integers)
  score: {
    home: { 
      type: Number, 
      default: 0, 
      min: 0,
      validate: [{ validator: Number.isInteger, message: "Home score must be an integer." }]
    },
    away: { 
      type: Number, 
      default: 0, 
      min: 0,
      validate: [{ validator: Number.isInteger, message: "Away score must be an integer." }]
    }
  },

  result: {
    type: String,
    enum: ["pending", "homeWin", "awayWin", "draw", "void"],
    default: "pending"
  },

  // 4. Time Management & Betting Controls
  // 🚨 REQ 7: UTC normalization enforced via setters
  startTime: { 
    type: Date, 
    required: true, 
    index: true,
    set: (v) => new Date(v).toISOString() 
  },
  bettingCutoffTime: { 
    type: Date, 
    required: true,
    set: (v) => new Date(v).toISOString()
  },
  
  marketSuspended: { type: Boolean, default: false },

  // 🚨 REQ 6: Soft-delete flag
  isDeleted: { type: Boolean, default: false, index: true }

}, { 
  timestamps: true,
  optimisticConcurrency: true 
});

// Compound Index for performance
matchCoreSchema.index({ status: 1, startTime: 1 });

// ==========================================
// PRE-SAVE HOOK: Validation, State, & Logic
// ==========================================
matchCoreSchema.pre('save', function(next) {
  // Same-team validation
  if (this.homeTeam.name.toLowerCase() === this.awayTeam.name.toLowerCase()) {
    return next(new Error("Away team cannot be the same as Home team."));
  }

  // Betting Cutoff Buffer Logic 
  if (this.bettingCutoffTime && this.startTime) {
    const bufferMs = 5 * 60 * 1000; 
    if (this.bettingCutoffTime.getTime() > (this.startTime.getTime() - bufferMs)) {
      return next(new Error("Betting cutoff must be at least 5 minutes before start time."));
    }
  }

  // State Transition FSM & Audit Trail
  if (this.isModified('status')) {
    const current = this.status;
    const lastStatus = this.statusHistory.length ? this.statusHistory[this.statusHistory.length - 1].status : 'upcoming';

    // 🚨 REQ 5: Prevent unnecessary writes if status hasn't actually changed logically
    if (!this.isNew && current === lastStatus) {
      this.unmarkModified('status');
    } else {
      const validTransitions = {
        upcoming: ['live', 'cancelled'],
        live: ['completed', 'cancelled'],
        completed: [], 
        cancelled: []  
      };

      if (!this.isNew && !validTransitions[lastStatus].includes(current)) {
        return next(new Error(`Invalid state transition from ${lastStatus} to ${current}.`));
      }
      
      this.statusHistory.push({ 
        status: current, 
        reason: this.$locals.transitionReason || "System update",
        timestamp: new Date()
      });
      
      if (this.statusHistory.length > 50) this.statusHistory = this.statusHistory.slice(-50);
      this.statusUpdatedAt = new Date();
    }
  }

  // Result Integrity
  if (this.status === 'completed') {
    let calculatedResult = 'draw';
    if (this.score.home > this.score.away) calculatedResult = 'homeWin';
    if (this.score.away > this.score.home) calculatedResult = 'awayWin';

    if (this.isModified('result') && this.result !== calculatedResult && this.result !== 'pending') {
       return next(new Error(`Data integrity violation: Score does not match provided result.`));
    }
    
    if (this.result !== calculatedResult) {
      this.result = calculatedResult;
      this.resultUpdatedAt = new Date();
    }
  } else if (this.status === 'cancelled') {
    if (this.result !== 'void') {
      this.result = 'void';
      this.resultUpdatedAt = new Date();
    }
  } else if (['upcoming', 'live'].includes(this.status)) {
    this.result = 'pending';
  }

  next();
});

// ==========================================
// POST-SAVE HOOK: Lightweight Event Logging
// ==========================================
matchCoreSchema.post('save', function(doc) {
  // 🚨 REQ 8: Emit system events on successful save
  if (doc.$isDefault('status') === false) { // Skip on initialization fetch
    matchEvents.emit('matchUpdated', {
      matchId: doc.matchId,
      status: doc.status,
      result: doc.result,
      score: doc.score
    });
  }
});

// ==========================================
// PRE-UPDATE HOOK: 🚨 REQ 3: Fortified Bypass Protection
// ==========================================
matchCoreSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (!update) return next();

  const forbiddenKeys = ['status', 'result', 'score', 'score.home', 'score.away'];
  
  // Helper to scan deeply nested update operators
  const scanOp = (opObj) => opObj ? Object.keys(opObj).some(key => 
    forbiddenKeys.includes(key) || key.startsWith('score.') || key === 'statusHistory'
  ) : false;

  // Catch $set, $inc, $push, $unset, and root-level direct updates
  const rootViolation = Object.keys(update).filter(k => !k.startsWith('$')).some(k => forbiddenKeys.includes(k));
  
  if (scanOp(update.$set) || scanOp(update.$inc) || scanOp(update.$push) || scanOp(update.$unset) || rootViolation) {
    return next(new Error("STRICT POLICY: Direct database queries cannot mutate core state. Use document.save() to ensure FSM logs are executed."));
  }
  next();
});

// ==========================================
// GLOBAL QUERY MIDDLEWARE: Soft Deletes
// ==========================================
matchCoreSchema.pre(/^find/, function(next) {
  // Automatically exclude soft-deleted documents unless explicitly requested
  if (this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// ==========================================
// VIRTUALS & INSTANCE METHODS
// ==========================================
matchCoreSchema.virtual('isBettingOpen').get(function() {
  if (this.marketSuspended) return false;
  if (!this.bettingCutoffTime || !this.bettingCutoffTime.getTime) return false;
  if (['completed', 'cancelled', 'live'].includes(this.status)) return false;
  return Date.now() < this.bettingCutoffTime.getTime();
});

matchCoreSchema.methods.updateScore = async function(homePoints, awayPoints, adminId = "system") {
  if (['completed', 'cancelled'].includes(this.status)) throw new Error("Cannot update score of a terminal match.");
  this.score.home = homePoints;
  this.score.away = awayPoints;
  this.updatedBy = adminId;
  return this.save();
};

matchCoreSchema.methods.changeStatus = async function(newStatus, reason = "Manual transition", adminId = "system") {
  this.status = newStatus;
  this.updatedBy = adminId;
  this.$locals.transitionReason = reason; 
  if (['live', 'completed', 'cancelled'].includes(newStatus)) this.marketSuspended = true;
  return this.save();
};

matchCoreSchema.methods.softDelete = async function(adminId = "system") {
  this.isDeleted = true;
  this.updatedBy = adminId;
  return this.save();
};

// ==========================================
// STATIC METHODS: 🚨 REQ 1: Collision Retry Mechanism
// ==========================================
matchCoreSchema.statics.createWithRetry = async function(matchData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const match = new this(matchData);
      return await match.save();
    } catch (error) {
      // E11000 duplicate key error collection & targets displayId
      if (error.code === 11000 && error.message.includes('displayId')) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to generate unique displayId after ${maxRetries} attempts.`);
        }
        // Regenerate the displayId on the payload and loop again
        matchData.displayId = `M-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
        continue;
      }
      // If it's not a collision on displayId, throw immediately
      throw error;
    }
  }
};

export const MatchCore = mongoose.model("MatchCore", matchCoreSchema);
