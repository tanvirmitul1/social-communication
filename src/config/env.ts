import { config as dotenvConfig } from 'dotenv';
import { envsafe, str, port, num, bool, url } from 'envsafe';

dotenvConfig();

export const config = envsafe({
  // Application
  NODE_ENV: str({
    choices: ['development', 'production', 'test'],
    default: 'development',
  }),
  PORT: port({ default: 3000 }),
  API_VERSION: str({ default: 'v1' }),

  // Database
  DATABASE_URL: url(),

  // Redis
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '', allowEmpty: true }),
  REDIS_DB: num({ default: 0 }),

  // JWT
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRATION: str({ default: '15m' }),
  JWT_REFRESH_EXPIRATION: str({ default: '7d' }),

  // Security
  BCRYPT_ROUNDS: num({ default: 12 }),
  CORS_ORIGINS: str({ default: 'http://localhost:3000' }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),

  // Jitsi
  JITSI_DOMAIN: str({ default: 'meet.jit.si' }),
  JITSI_APP_ID: str({ default: '', allowEmpty: true }),
  JITSI_APP_SECRET: str({ default: '', allowEmpty: true }),
  JITSI_ROOM_PREFIX: str({ default: 'social-comm-' }),

  // File Upload
  MAX_FILE_SIZE: num({ default: 10485760 }),
  UPLOAD_DIR: str({ default: './uploads' }),

  // Logging
  LOG_LEVEL: str({
    choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
    default: 'info',
  }),
  LOG_DIR: str({ default: './logs' }),

  // Monitoring
  SENTRY_DSN: str({ default: '', allowEmpty: true }),
  METRICS_ENABLED: bool({ default: true }),

  // Feature Flags
  ENABLE_EMAIL_NOTIFICATIONS: bool({ default: false }),
  ENABLE_PUSH_NOTIFICATIONS: bool({ default: false }),
  ENABLE_ANALYTICS: bool({ default: true }),
});
