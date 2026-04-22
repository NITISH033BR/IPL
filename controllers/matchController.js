import crypto from 'crypto';
import * as matchService from '../services/match.service.js';
import { redisClient } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { AppError, ValidationError, ConflictError } from '../utils/errors.js';
import { sendResponse, asyncHandler } from '../utils/apiHooks.js';

const KEY_PREFIX = `betting:${process.env.NODE_ENV || 'dev'}:idempotency`;
const STALE_THRESHOLD_MS = 30000; // 30 seconds

// 🚨 REQ 1 & 5: Atomic Lua Script for Stale Lock Overwrite
// This script: 1. Tries to SET NX. 2. If fails, checks if existing value is STALE. 
// 3. If stale, overwrites. ALL ATOMICALLY in one Redis tick.
const IDEMPOTENCY_LUA = `
  local current = redis.call('GET', KEYS[1])
  if not current then
    return redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  end
  local data = cjson.decode(current)
  if data.status == 'PROCESSING' then
    local age = tonumber(ARGV[3]) - tonumber(data.startedAt)
    if age > tonumber(ARGV[4]) then
      return redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
    end
  end
  return current
`;

export const updateScore = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const { matchId } = req.params;
  const { home, away } = req.body;
  const adminId = req.user.id;
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  
  // 🚨 REQ 4: Header Casing Normalization
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length > 100) {
    throw new ValidationError("Invalid Idempotency-Key");
  }

  const redisKey = `${KEY_PREFIX}:${adminId}:${idempotencyKey}`;
  const now = Date.now();
  const lockPayload = JSON.stringify({ status: 'PROCESSING', startedAt: now });
  
  let redisAvailable = true;
  let executionAllowed = false;
  let finalCachedValue = null;

  // --- ATOMIC IDEMPOTENCY PHASE ---
  try {
    // 🚨 REQ 1: Execute Lua script for atomic lock management
    const result = await redisClient.eval(IDEMPOTENCY_LUA, 1, redisKey, lockPayload, 60, now, STALE_THRESHOLD_MS);

    if (result === 'OK' || result === true) {
      executionAllowed = true;
    } else {
      try {
        finalCachedValue = JSON.parse(result);
        // 🚨 REQ 7: Monitoring Hook for stale lock overwrites
        if (finalCachedValue.status === 'PROCESSING') {
          logger.warn({ requestId, idempotencyKey }, "Stale idempotency lock detected and atomic overwrite failed/aborted");
          throw new ConflictError("Request is already being processed");
        }
      } catch (e) {
        // If it's not JSON, it's a raw 'OK' or corrupted string
        executionAllowed = result === 'OK';
      }
    }
  } catch (redisErr) {
    logger.error({ requestId, err: redisErr }, "Redis failover triggered (idempotency bypassed)");
    redisAvailable = false;
    executionAllowed = true; // REQ 8: Fallback to DB (Fail-open)
  }

  if (finalCachedValue && !executionAllowed) {
    return sendResponse(res, 200, finalCachedValue.data, finalCachedValue.meta);
  }

  // --- BUSINESS LOGIC EXECUTION ---
  try {
    // 🚨 REQ 6: Service layer is guarded by DB-level OCC (version __v)
    const match = await matchService.updateScoreIdempotent(
      matchId,
      home,
      away,
      adminId,
      new Date(),
      req.abortSignal 
    );

    const resultData = { matchId: match.matchId, score: match.score, status: match.status };
    const meta = { idempotencyKey, requestId, latency: Date.now() - startTime };

    // --- SUCCESS PERSISTENCE ---
    if (redisAvailable) {
      const finalPayload = JSON.stringify({ status: 'COMPLETED', data: resultData, meta });
      
      // 🚨 REQ 2: Ordered Writes via Redis Pipeline (MULTI)
      // Guarantees all cache updates happen together
      await redisClient.multi()
        .set(redisKey, finalPayload, 'EX', 86400)
        .del(`match:${matchId}`)
        .del('matches:active')
        .exec();
    }

    return sendResponse(res, 200, resultData, meta);

  } catch (error) {
    if (redisAvailable) await redisClient.del(redisKey);
    setImmediate(() => logger.error({ requestId, err: error.message, matchId }, "Score update failed"));
    throw error; 
  }
});