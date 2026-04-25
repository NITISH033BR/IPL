import client from 'prom-client';
import { logger } from './logger.js';

const register = new client.Registry();

// 🚨 REQ 9: Global Service Labels
register.setDefaultLabels({
    app: 'betting-backend',
    version: 'v1.0.0'
});

// 🚨 REQ 4: Cardinality Guard - Helper to sanitize labels
const sanitizeLabels = (labels) => {
    const ALLOWED_LABELS = ['method', 'route', 'status_code', 'operation', 'type', 'result'];
    return Object.fromEntries(
        Object.entries(labels)
            .filter(([k, v]) => ALLOWED_LABELS.includes(k) && v !== undefined)
    );
};

// 🚨 REQ 5: API-Tuned Histogram Buckets
const API_BUCKETS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5];

client.collectDefaultMetrics({ register, prefix: 'app_' });

// --- METRIC DEFINITIONS ---

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    buckets: API_BUCKETS,
});

// 🚨 REQ 6: Redis Latency Tracking
const redisOperationDuration = new client.Histogram({
    name: 'redis_operation_duration_seconds',
    help: 'Duration of Redis operations',
    labelNames: ['operation', 'result'],
    buckets: API_BUCKETS,
});

const errorCounter = new client.Counter({
    name: 'app_errors_total',
    help: 'Total errors',
    labelNames: ['type'],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(redisOperationDuration);
register.registerMetric(errorCounter);

// --- EXPORTED UTILS ---

export const metrics = {
    // 🚨 REQ 2: HTTP Auto-Instrumentation Middleware
    middleware: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            httpRequestDuration.labels(
                req.method, 
                req.route?.path || req.path, 
                res.statusCode.toString()
            ).observe(duration);
        });
        next();
    },

    // 🚨 REQ 6: Redis Timer
    startRedisTimer: (operation) => {
        const start = Date.now();
        return (result = 'success') => {
            const duration = (Date.now() - start) / 1000;
            redisOperationDuration.labels(operation, result).observe(duration);
        };
    },

    incrementError: (type) => errorCounter.labels(type).inc(),

    getRawMetrics: () => register.metrics(),
    contentType: register.contentType,
};

// 🚨 REQ 1: Global Crash Tracking
process.on('uncaughtException', (err) => {
    metrics.incrementError('uncaught_exception');
    logger.error({ err }, 'Uncaught Exception detected');
    process.exit(1); // Standard practice: crash and let PM2/K8s restart
});

process.on('unhandledRejection', (reason) => {
    metrics.incrementError('unhandled_rejection');
    logger.error({ reason }, 'Unhandled Rejection detected');
});