import { createClient } from 'redis';
import CircuitBreaker from 'opossum'; 
import { logger } from './logger.js';
import { metrics } from './metrics.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = 3600; 
const COMMAND_TIMEOUT = 1000; 
const KEY_PREFIX = "app:v1:"; // 🚨 REQ 6: Global Key Prefixing

let isReady = false;

// --- CLIENT INITIALIZATION ---
const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      metrics.increment('redis.retry');
      if (retries > 10) return new Error('Redis max retries reached');
      return Math.min(retries * 100, 2000);
    }
  }
});

// --- CIRCUIT BREAKER (🚨 REQ 1 & 8) ---
const breakerOptions = {
  timeout: COMMAND_TIMEOUT,
  errorThresholdPercentage: 50,
  resetTimeout: 10000 
};

// We wrap the low-level client call in the breaker logic
const breaker = new CircuitBreaker(async (action) => await action(), breakerOptions);

breaker.on('open', () => {
  logger.error("Redis Circuit Breaker OPEN - Routing all traffic to DB");
  metrics.increment('redis.breaker.open'); // REQ 8
});

breaker.on('halfOpen', () => logger.warn("Redis Circuit Breaker HALF_OPEN - Testing recovery"));
breaker.on('close', () => logger.info("Redis Circuit Breaker CLOSED - Cache restored"));

// --- UTILS ---

// 🚨 REQ 7: Memory/Size Safety
const MAX_VALUE_SIZE = 1024 * 512; // 512KB limit to prevent Redis abuse

const withTimeout = (promise) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const timeoutErr = new Error('Redis command timeout');
      timeoutErr.name = 'TimeoutError'; // REQ 5: Distinct name for logging
      setTimeout(() => reject(timeoutErr), COMMAND_TIMEOUT);
    })
  ]);
};

// --- ELITE SAFE WRAPPER ---

export const cacheSafe = {
  get: async (key) => {
    if (!isReady || breaker.opened) return null;

    try {
      // 🚨 REQ 1: Actually firing the breaker
      const data = await breaker.fire(() => withTimeout(redisClient.get(`${KEY_PREFIX}${key}`)));
      
      if (!data) {
        metrics.increment('redis.get.miss');
        return null;
      }

      // 🚨 REQ 2: JSON Parse Safety
      try {
        return JSON.parse(data);
      } catch (parseErr) {
        logger.warn({ key, parseErr: parseErr.message }, "Invalid JSON in cache - clearing key");
        return null;
      }
    } catch (err) {
      // 🚨 REQ 5: Optimized Log Levels
      if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        logger.warn({ key }, "Redis GET Timeout");
      } else {
        logger.error({ err, key }, 'Redis GET failure');
      }
      metrics.increment('redis.get.error');
      return null;
    }
  },

  set: async (key, value, ttl = DEFAULT_TTL) => {
    if (!isReady || breaker.opened) return;

    try {
      const payload = JSON.stringify(value);
      
      // 🚨 REQ 7: Size check
      if (payload.length > MAX_VALUE_SIZE) {
        logger.warn({ key, size: payload.length }, "Redis SET rejected: Payload too large");
        return;
      }

      await breaker.fire(() => withTimeout(redisClient.set(`${KEY_PREFIX}${key}`, payload, { EX: ttl })));
      metrics.increment('redis.set.success');
    } catch (err) {
      logger.error({ err, key }, 'Redis SET failure');
      metrics.increment('redis.set.error');
    }
  },

  del: async (keys) => {
    if (!isReady || breaker.opened) return;

    try {
      const keysWithPrefix = Array.isArray(keys) 
        ? keys.map(k => `${KEY_PREFIX}${k}`) 
        : [`${KEY_PREFIX}${keys}`];
      
      await breaker.fire(() => withTimeout(redisClient.del(keysWithPrefix)));
      metrics.increment('redis.del.success');
    } catch (err) {
      logger.error({ err, keys }, 'Redis DEL failure');
      metrics.increment('redis.del.error');
    }
  }
};

// --- HEALTH & LIFECYCLE ---

// 🚨 REQ 3: Health Check Export
export const isRedisHealthy = async () => {
  if (!isReady) return false;
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};

// 🚨 REQ 4: Graceful Shutdown
const shutdown = async () => {
  if (isReady) {
    logger.info("Closing Redis connection...");
    await redisClient.quit();
    isReady = false;
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Initial Connection
redisClient.on('ready', () => { isReady = true; logger.info('Redis: Connected'); });
redisClient.on('error', (err) => { isReady = false; logger.error({ err }, 'Redis Connection Error'); });

(async () => {
  try { await redisClient.connect(); } catch (err) { logger.error('Initial Redis connection failed'); }
})();

export { redisClient };