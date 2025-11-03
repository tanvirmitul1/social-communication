# Project Restructure - Migration Summary

## 📌 Overview

This document provides a quick summary of the project restructuring process.

## 🎯 What Changes?

### Before (Current)

```
project/
├── app/          # All application code mixed together
├── core/         # Utilities and errors
└── main.ts       # Entry point
```

### After (New)

```
project/
├── src/
│   ├── application/      # App initialization
│   ├── config/           # All configuration
│   ├── modules/          # Feature modules (auth, user, message, group, call, health)
│   ├── common/           # Shared utilities
│   ├── infrastructure/   # Technical services
│   └── middlewares/      # Express middlewares
└── main.ts
```

## 🚀 Quick Start - Run Migration

### Option 1: Automated Migration (Recommended)

```bash
# 1. Create backup branch
git checkout -b refactor/modular-structure

# 2. Run migration script
tsx scripts/migrate-structure.ts

# 3. Update tsconfig.json (see below)

# 4. Create application layer files (see below)

# 5. Test build
pnpm build

# 6. Fix any remaining issues

# 7. Delete old directories
rm -rf app/ core/

# 8. Commit
git add .
git commit -m "refactor: migrate to modular architecture"
```

### Option 2: Manual Migration

Follow the detailed steps in [RESTRUCTURE_GUIDE.md](./RESTRUCTURE_GUIDE.md)

## 📝 Required Manual Steps After Script

### 1. Update tsconfig.json

Replace the `paths` section in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist",
    "paths": {
      "@application/*": ["src/application/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@middlewares/*": ["src/middlewares/*"]
    }
  },
  "include": ["src/**/*", "main.ts"]
}
```

### 2. Create src/main.ts

Create the new entry point:

```typescript
import 'reflect-metadata';
import 'express-async-errors';
import { startServer } from '@application/server.js';

startServer();
```

### 3. Create src/application/app.ts

Extract Express app setup from current main.ts:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@config/swagger.js';
import { errorHandler } from '@middlewares/error-handler.js';

// Import module routes
import { authRoutes } from '@modules/auth/auth.routes.js';
import { userRoutes } from '@modules/user/user.routes.js';
import { messageRoutes } from '@modules/message/message.routes.js';
import { groupRoutes } from '@modules/group/group.routes.js';
import { callRoutes } from '@modules/call/call.routes.js';
import { HealthController } from '@modules/health/health.controller.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health checks
  app.get('/health', HealthController.health);
  app.get('/health/ready', HealthController.readiness);
  app.get('/metrics', HealthController.metrics);

  // API Routes
  const API_VERSION = process.env.API_VERSION || 'v1';
  app.use(`/api/${API_VERSION}/auth`, authRoutes);
  app.use(`/api/${API_VERSION}/users`, userRoutes);
  app.use(`/api/${API_VERSION}/messages`, messageRoutes);
  app.use(`/api/${API_VERSION}/groups`, groupRoutes);
  app.use(`/api/${API_VERSION}/calls`, callRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
```

### 4. Create src/application/server.ts

Extract server startup logic:

```typescript
import http from 'http';
import { config } from '@config/env.js';
import { logger } from '@config/logger.js';
import { prisma } from '@config/prisma.js';
import { redis } from '@config/redis.js';
import { SocketManager } from '@infrastructure/socket.manager.js';
import { createApp } from './app.js';
import './container.js'; // Initialize DI container

export async function startServer() {
  try {
    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket
    const socketManager = new SocketManager(server);
    socketManager.initialize();

    // Connect to databases
    await prisma.$connect();
    logger.info('✓ Connected to PostgreSQL');

    await redis.ping();
    logger.info('✓ Connected to Redis');

    // Start server
    const PORT = config.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
      });

      await prisma.$disconnect();
      logger.info('Database connection closed');

      await redis.quit();
      logger.info('Redis connection closed');

      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

### 5. Create Health Routes

Create `src/modules/health/health.routes.ts`:

```typescript
import { Router } from 'express';
import { HealthController } from './health.controller.js';

const router = Router();

router.get('/', HealthController.health);
router.get('/ready', HealthController.readiness);
router.get('/metrics', HealthController.metrics);

export { router as healthRoutes };
```

### 6. Update package.json

Update scripts to point to new entry point:

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/main.ts",
    "dev:watch": "tsx watch src/main.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/main.js"
  }
}
```

## 🧪 Testing

After migration, test:

```bash
# 1. Build
pnpm build

# 2. Run linter
pnpm lint

# 3. Format code
pnpm format

# 4. Run tests
pnpm test

# 5. Start dev server
pnpm dev
```

## 🐛 Common Issues & Fixes

### Issue: Import errors after migration

**Solution**: Make sure all imports end with `.js` extension:

```typescript
// ✅ Correct
import { UserService } from '@modules/user/user.service.js';

// ❌ Wrong
import { UserService } from '@modules/user/user.service';
```

### Issue: Module not found errors

**Solution**:

1. Check tsconfig.json paths are correct
2. Run `pnpm build` to regenerate path aliases
3. Restart your IDE/TypeScript server

### Issue: Circular dependency warnings

**Solution**: Use `import type` for type-only imports:

```typescript
import type { User } from '@prisma/client';
import { type SomeType } from './types.js';
```

## 📊 Migration Checklist

- [ ] Create backup branch
- [ ] Run migration script
- [ ] Update tsconfig.json
- [ ] Create src/main.ts
- [ ] Create src/application/app.ts
- [ ] Create src/application/server.ts
- [ ] Create health.routes.ts
- [ ] Update package.json scripts
- [ ] Run build - fix errors
- [ ] Run linter - fix errors
- [ ] Run tests - fix failures
- [ ] Start dev server - verify works
- [ ] Delete old app/ and core/ directories
- [ ] Update CLAUDE.md with new structure
- [ ] Update README.md if needed
- [ ] Commit changes
- [ ] Test in production-like environment

## 🎉 Benefits

After migration, you'll have:

✅ **Better Organization**: Related code grouped together
✅ **Scalability**: Easy to add new features
✅ **Clear Boundaries**: Module separation
✅ **Improved Testing**: Test modules independently
✅ **Better DX**: Easier navigation and understanding

## 📚 Documentation

- **Detailed Guide**: [RESTRUCTURE_GUIDE.md](./RESTRUCTURE_GUIDE.md)
- **Migration Script**: [scripts/migrate-structure.ts](./scripts/migrate-structure.ts)

## ❓ Need Help?

If you encounter issues:

1. Check the detailed guide
2. Review common issues section
3. Check git diff to see what changed
4. Rollback if needed: `git checkout main`

---

**Ready to migrate?** Run: `tsx scripts/migrate-structure.ts`
