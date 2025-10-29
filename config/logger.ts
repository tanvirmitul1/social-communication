import pino from 'pino';
import { config } from '@config/env.js';

const logLevel = config.LOG_LEVEL || 'info';

const logger = pino({
  level: logLevel,
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export { logger };
