import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty', // Use this in dev, remove in prod for raw JSON
    options: { colorize: true }
  }
});