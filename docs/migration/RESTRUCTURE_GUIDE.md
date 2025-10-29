# Project Restructure Guide

This guide provides a step-by-step approach to restructure the Social Communication Platform into a scalable, modular architecture.

## 🎯 Goals

1. **Modular Organization**: Group related files by feature/domain
2. **Clear Separation of Concerns**: Distinct layers (application, config, modules, common, infrastructure)
3. **Scalable Structure**: Easy to add new features without cluttering
4. **Consistent Naming**: Use kebab-case for files and folders

## 📋 Current vs New Structure

### Current Structure (Problematic)
```
.
├── app/
│   ├── config/          # Mixed concerns
│   ├── controllers/     # All controllers in one folder
│   ├── services/        # All services in one folder
│   ├── repositories/    # All repositories in one folder
│   ├── routes/          # All routes in one folder
│   ├── middlewares/     # OK
│   └── sockets/         # Socket handlers separate from modules
├── core/
│   ├── constants/
│   ├── errors/
│   ├── logger/
│   ├── utils/
│   └── validations/
└── main.ts
```

### New Structure (Scalable)
```
src/
├── application/          # App initialization & DI
│   ├── app.ts
│   ├── server.ts
│   └── container.ts
├── config/               # All configuration
│   ├── env.ts
│   ├── logger.ts
│   ├── redis.ts
│   ├── prisma.ts
│   ├── swagger.ts
│   └── rate-limiter.ts
├── modules/              # Feature modules (vertical slices)
│   ├── auth/
│   ├── user/
│   ├── message/
│   ├── group/
│   ├── call/
│   └── health/
├── common/               # Shared utilities
│   ├── types.ts
│   ├── constants.ts
│   ├── errors.ts
│   ├── utils.ts
│   └── response.ts
├── infrastructure/       # Technical services
│   ├── cache.service.ts
│   ├── jitsi.service.ts
│   ├── socket.manager.ts
│   └── base.repository.ts
├── middlewares/          # Express middlewares
│   ├── error-handler.ts
│   ├── auth-guard.ts
│   ├── validation.ts
│   └── async-handler.ts
└── main.ts              # Entry point
```

## 🔄 Migration Steps

### Phase 1: Prepare New Structure

```bash
# Create new directory structure
mkdir -p src/{application,config,modules/{auth,user,message,group,call,health},common,infrastructure,middlewares}

# Keep docs in root for now
```

### Phase 2: Move Config Files

```bash
# Move config files
cp app/config/env.ts src/config/env.ts
cp app/config/redis.ts src/config/redis.ts
cp app/config/database.ts src/config/prisma.ts
cp app/config/swagger.ts src/config/swagger.ts
cp app/config/container.ts src/application/container.ts
cp core/logger/index.ts src/config/logger.ts
```

### Phase 3: Move Common Files

```bash
# Move core utilities to common
cp core/constants/index.ts src/common/constants.ts
cp core/utils/helpers.ts src/common/utils.ts
cp core/utils/responseHandler.ts src/common/response.ts
cp core/utils/asyncHandler.ts src/middlewares/async-handler.ts

# Merge all error classes into one file
# Manual step: Create src/common/errors.ts with all error classes
```

### Phase 4: Move Middlewares

```bash
cp app/middlewares/auth.middleware.ts src/middlewares/auth-guard.ts
cp app/middlewares/error.middleware.ts src/middlewares/error-handler.ts
cp app/middlewares/validation.middleware.ts src/middlewares/validation.ts
cp app/middlewares/rateLimit.middleware.ts src/config/rate-limiter.ts
```

### Phase 5: Move Infrastructure

```bash
cp app/services/CacheService.ts src/infrastructure/cache.service.ts
cp app/services/JitsiService.ts src/infrastructure/jitsi.service.ts
cp app/sockets/SocketManager.ts src/infrastructure/socket.manager.ts
cp app/repositories/BaseRepository.ts src/infrastructure/base.repository.ts
```

### Phase 6: Move Module Files

#### Auth Module
```bash
cp app/controllers/AuthController.ts src/modules/auth/auth.controller.ts
cp app/services/AuthService.ts src/modules/auth/auth.service.ts
cp app/routes/auth.routes.ts src/modules/auth/auth.routes.ts
cp core/validations/authValidation.ts src/modules/auth/auth.validation.ts
# Create auth.repository.ts (extract from UserRepository)
# Create auth.types.ts (extract types from service)
```

#### User Module
```bash
cp app/controllers/UserController.ts src/modules/user/user.controller.ts
cp app/services/UserService.ts src/modules/user/user.service.ts
cp app/repositories/UserRepository.ts src/modules/user/user.repository.ts
cp app/routes/user.routes.ts src/modules/user/user.routes.ts
# Create user.validation.ts
# Create user.types.ts
```

#### Message Module
```bash
cp app/controllers/MessageController.ts src/modules/message/message.controller.ts
cp app/services/MessageService.ts src/modules/message/message.service.ts
cp app/repositories/MessageRepository.ts src/modules/message/message.repository.ts
cp app/routes/message.routes.ts src/modules/message/message.routes.ts
cp app/sockets/ChatSocketHandler.ts src/modules/message/message.gateway.ts
cp core/validations/messageValidation.ts src/modules/message/message.validation.ts
# Create message.types.ts
```

#### Group Module
```bash
cp app/controllers/GroupController.ts src/modules/group/group.controller.ts
cp app/services/GroupService.ts src/modules/group/group.service.ts
cp app/repositories/GroupRepository.ts src/modules/group/group.repository.ts
cp app/routes/group.routes.ts src/modules/group/group.routes.ts
cp core/validations/groupValidation.ts src/modules/group/group.validation.ts
# Create group.types.ts
```

#### Call Module
```bash
cp app/controllers/CallController.ts src/modules/call/call.controller.ts
cp app/services/CallService.ts src/modules/call/call.service.ts
cp app/repositories/CallRepository.ts src/modules/call/call.repository.ts
cp app/routes/call.routes.ts src/modules/call/call.routes.ts
cp app/sockets/CallSocketHandler.ts src/modules/call/call.gateway.ts
# Create call.validation.ts
# Create call.types.ts
```

#### Health Module
```bash
cp app/controllers/HealthController.ts src/modules/health/health.controller.ts
# Create health.routes.ts (extract from routes/index.ts)
```

### Phase 7: Create Application Layer

Create new files:
- `src/application/app.ts` - Express app setup (extract from main.ts)
- `src/application/server.ts` - HTTP + Socket server startup
- `src/main.ts` - Entry point (minimal, just calls server.ts)

### Phase 8: Update tsconfig.json

Update path mappings:
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@application/*": ["src/application/*"],
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@middlewares/*": ["src/middlewares/*"]
    }
  }
}
```

### Phase 9: Update All Import Paths

This is the most tedious part. Use find and replace:

**Old → New Mappings:**
- `@config/database` → `@config/prisma`
- `@config/container` → `@application/container`
- `@logger/` → `@config/logger`
- `@errors/` → `@common/errors`
- `@constants/` → `@common/constants`
- `@utils/` → `@common/utils`
- `@middlewares/auth.middleware` → `@middlewares/auth-guard`
- `@middlewares/error.middleware` → `@middlewares/error-handler`
- `@controllers/XxxController` → `@modules/xxx/xxx.controller`
- `@services/XxxService` → `@modules/xxx/xxx.service`
- `@repositories/XxxRepository` → `@modules/xxx/xxx.repository`
- `@routes/xxx.routes` → `@modules/xxx/xxx.routes`
- `@validations/` → `@modules/xxx/xxx.validation`
- `@sockets/SocketManager` → `@infrastructure/socket.manager`
- `@sockets/ChatSocketHandler` → `@modules/message/message.gateway`
- `@sockets/CallSocketHandler` → `@modules/call/call.gateway`
- `@services/CacheService` → `@infrastructure/cache.service`
- `@services/JitsiService` → `@infrastructure/jitsi.service`

### Phase 10: Update Container Registration

Update `src/application/container.ts` to reflect new paths:
```typescript
import { CacheService } from '@infrastructure/cache.service.js';
import { JitsiService } from '@infrastructure/jitsi.service.js';
import { AuthService } from '@modules/auth/auth.service.js';
// ... etc
```

### Phase 11: Update package.json Scripts

Update build paths if needed:
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/main.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/main.js"
  }
}
```

### Phase 12: Clean Up

After successful migration:
```bash
# Remove old directories
rm -rf app/
rm -rf core/

# Keep prisma, tests, docs, uploads, logs
```

## 🔧 Automated Migration Script

I can create a Node.js script that:
1. Creates the new structure
2. Copies files to new locations
3. Updates all import paths automatically
4. Updates tsconfig.json
5. Validates the migration

Would you like me to create this automated script?

## ⚠️ Important Considerations

1. **Backup First**: Create a git branch before starting
   ```bash
   git checkout -b refactor/modular-structure
   ```

2. **Incremental Migration**: Consider migrating one module at a time

3. **Test After Each Phase**: Run `pnpm build` after major changes

4. **Update Documentation**: Update CLAUDE.md and README.md with new structure

5. **Team Communication**: Inform team members about the restructure

## 📊 Benefits After Migration

1. **Easier Navigation**: Related code is grouped together
2. **Better Scalability**: Adding new features is straightforward
3. **Clear Dependencies**: Module boundaries are explicit
4. **Improved Testing**: Each module can be tested independently
5. **Onboarding**: New developers can understand structure quickly
6. **Code Reviews**: Changes are localized to specific modules

## 🚀 Next Steps

1. Review this guide
2. Create a backup branch
3. Decide: Manual migration or automated script?
4. Execute migration
5. Test thoroughly
6. Update documentation
7. Merge to main

---

**Question**: Would you like me to create an automated migration script that handles all the file movements and import path updates? This would be safer and faster than manual migration.
