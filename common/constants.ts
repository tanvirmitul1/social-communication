export const CONSTANTS = {
  // JWT
  JWT: {
    ACCESS_TOKEN_HEADER: 'authorization',
    REFRESH_TOKEN_HEADER: 'x-refresh-token',
    BEARER_PREFIX: 'Bearer ',
  },

  // Redis Keys
  REDIS_KEYS: {
    USER_PRESENCE: (userId: string) => `presence:${userId}`,
    TYPING_INDICATOR: (groupId: string, userId: string) => `typing:${groupId}:${userId}`,
    CACHED_MESSAGE: (messageId: string) => `message:${messageId}`,
    CACHED_USER: (userId: string) => `user:${userId}`,
    RATE_LIMIT: (identifier: string) => `ratelimit:${identifier}`,
    ACTIVE_CALL: (callId: string) => `call:${callId}`,
    BLACKLISTED_TOKEN: (token: string) => `blacklist:${token}`,
  },

  // WebSocket Events
  SOCKET_EVENTS: {
    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',

    // Authentication
    AUTHENTICATE: 'authenticate',
    AUTHENTICATED: 'authenticated',

    // Messaging
    MESSAGE_SEND: 'message:send',
    MESSAGE_SENT: 'message:sent',
    MESSAGE_RECEIVED: 'message:received',
    MESSAGE_EDIT: 'message:edit',
    MESSAGE_DELETE: 'message:delete',
    MESSAGE_REACTION: 'message:reaction',
    TYPING_START: 'typing:start',
    TYPING_STOP: 'typing:stop',

    // Calls
    CALL_INITIATE: 'call:initiate',
    CALL_RINGING: 'call:ringing',
    CALL_ANSWER: 'call:answer',
    CALL_REJECT: 'call:reject',
    CALL_END: 'call:end',
    CALL_PARTICIPANT_JOIN: 'call:participant:join',
    CALL_PARTICIPANT_LEAVE: 'call:participant:leave',

    // Presence
    PRESENCE_UPDATE: 'presence:update',
    USER_ONLINE: 'user:online',
    USER_OFFLINE: 'user:offline',

    // Notifications
    NOTIFICATION: 'notification',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_FILE_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    USER: 3600, // 1 hour
    MESSAGE: 1800, // 30 minutes
    PRESENCE: 300, // 5 minutes
    TYPING: 10, // 10 seconds
  },
} as const;
