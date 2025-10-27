# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an enterprise-level real-time messaging and audio/video calling platform backend built with Express.js, TypeScript, PostgreSQL, and Redis. The codebase follows clean architecture principles with strict separation of concerns across five layers: Core, Domain (Repositories), Application (Services), Infrastructure (Config), and Presentation (Controllers/Routes).

## Essential Commands

### Development Workflow

```bash
# Initial setup (after cloning)
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate

# Development
pnpm dev                    # Start with hot reload (uses tsx watch)
pnpm lint                   # Run ESLint
pnpm format                 # Format with Prettier

# Database
pnpm prisma:generate        # Generate Prisma client (required after schema changes)
pnpm prisma:migrate         # Run migrations in dev mode
pnpm prisma:studio          # Open Prisma Studio GUI
pnpm prisma:seed            # Seed database with test data

# Testing
pnpm test                   # Run all tests
pnpm test:coverage          # Run tests with coverage
pnpm test:ui                # Open Vitest UI

# Production
pnpm build                  # Build TypeScript (tsc + tsc-alias for path mapping)
pnpm start                  # Start production server

# Docker
pnpm docker:up              # Start all services (Postgres, Redis, App)
pnpm docker:down            # Stop all services
pnpm docker:logs            # View logs
```

## Architecture & Design Patterns

### Layer Architecture (Bottom-Up)

**1. Core Layer** (`core/`)

- Independent utilities, no dependencies on other layers
- `errors/` - Custom error classes (AppError, ValidationError, UnauthorizedError, etc.)
- `logger/` - Pino logger configuration
- `utils/` - Helper functions (asyncHandler, ResponseHandler, Helpers)
- `validations/` - Zod schemas for request validation
- `constants/` - Application constants including WebSocket event names

**2. Domain Layer** (`app/repositories/`)

- Data access abstraction using Repository Pattern
- Each repository extends `BaseRepository` which provides access to Prisma client
- Repositories are responsible for ALL database operations
- Never query Prisma directly from services - always use repositories

**3. Application Layer** (`app/services/`)

- Business logic implementation
- Services consume repositories via dependency injection
- Each service handles a specific domain (Auth, User, Message, Group, Call, Cache, Jitsi)
- Services orchestrate complex operations across multiple repositories

**4. Infrastructure Layer** (`app/config/`)

- `container.ts` - Dependency injection configuration (tsyringe)
- `database.ts` - Prisma client singleton
- `redis.ts` - Redis client singleton
- `env.ts` - Environment variable validation (envsafe)
- `swagger.ts` - OpenAPI specification

**5. Presentation Layer** (`app/controllers/` + `app/routes/`)

- Controllers handle HTTP requests/responses
- Controllers are thin - delegate to services immediately
- Routes define endpoint structure and apply middleware

### Key Design Patterns

**Dependency Injection (tsyringe)**

- All services and repositories are registered as singletons in `app/config/container.ts`
- Use `@inject('ServiceName')` decorator in constructors
- Controllers resolve dependencies via `container.resolve(ControllerClass)`

**Repository Pattern**

- All database access goes through repositories
- Keeps Prisma queries isolated and testable
- Example: `UserRepository.findById()` instead of `prisma.user.findUnique()`

**Service Layer Pattern**

- Business logic stays in services, not controllers
- Services can call multiple repositories
- Services handle transactions, caching, and complex workflows

**WebSocket Architecture** (`app/sockets/`)

- `SocketManager` - Initializes Socket.IO server with Redis adapter for horizontal scaling
- `ChatSocketHandler` - Handles messaging events
- `CallSocketHandler` - Handles call events
- Authentication middleware validates JWT tokens on socket connection
- Users join rooms: `user:${userId}` for direct messages, `group:${groupId}` for groups
- **Critical**: Redis adapter (pub/sub) enables WebSocket communication across multiple server instances

## TypeScript Path Aliases

The project uses path aliases (defined in `tsconfig.json`). Always use these imports:

```typescript
import { UserService } from '@services/UserService.js'; // Correct
import { NotFoundError } from '@errors/index.js'; // Correct
import { CONSTANTS } from '@constants/index.js'; // Correct

// NOT:
import { UserService } from '../services/UserService.js'; // Wrong
```

**Critical**: All imports MUST include `.js` extension (ES modules requirement).

Available aliases:

- `@app/*` → `app/*`
- `@core/*` → `core/*`
- `@config/*` → `app/config/*`
- `@controllers/*` → `app/controllers/*`
- `@services/*` → `app/services/*`
- `@repositories/*` → `app/repositories/*`
- `@routes/*` → `app/routes/*`
- `@sockets/*` → `app/sockets/*`
- `@middlewares/*` → `app/middlewares/*`
- `@utils/*` → `core/utils/*`
- `@errors/*` → `core/errors/*`
- `@logger/*` → `core/logger/*`
- `@validations/*` → `core/validations/*`
- `@constants/*` → `core/constants/*`

## Database Schema (Prisma)

### Key Models & Relationships

**User** - Central entity

- Has many: devices, refreshTokens, messages, calls, groupMemberships
- Relations: sentFriendRequests, receivedFriendRequests, followers, following

**Message** - Supports group and direct messaging

- Belongs to: sender (User), group (optional), receiver (optional)
- Self-referential: parent/replies for threading
- Has many: reactions

**Group** - Chat groups with role-based permissions

- Has many: members (GroupMember), messages
- GroupMember roles: OWNER, ADMIN, MEMBER

**Call** - Jitsi integration

- Belongs to: initiator (User)
- Has many: participants (CallParticipant)
- Stores roomId for Jitsi room

**Important**: After modifying `prisma/schema.prisma`, always run:

```bash
pnpm prisma:generate  # Regenerate Prisma client
pnpm prisma:migrate   # Create and apply migration
```

## Adding New Features

### Adding a New API Endpoint

1. **Define validation schema** in `core/validations/` using Zod
2. **Add repository method** in appropriate repository (e.g., `UserRepository`)
3. **Add service method** in appropriate service (e.g., `UserService`)
4. **Add controller method** with JSDoc Swagger annotations
5. **Add route** in `app/routes/` with middleware (auth, validation, rate limiting)
6. **Register in dependency injection** if new service/repository created

Example flow for "Get User's Friends":

```typescript
// 1. core/validations/userValidation.ts
export const getUserFriendsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional()
});

// 2. app/repositories/UserRepository.ts
async getFriends(userId: string, skip: number, take: number) {
  // Prisma query to get friends
}

// 3. app/services/UserService.ts
async getUserFriends(userId: string, page: number, limit: number) {
  const { skip, take } = Helpers.paginate(page, limit);
  return this.userRepository.getFriends(userId, skip, take);
}

// 4. app/controllers/UserController.ts
getUserFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const friends = await this.userService.getUserFriends(...);
  return ResponseHandler.success(res, friends);
});

// 5. app/routes/user.routes.ts
router.get('/:id/friends', userController.getUserFriends);
```

### Adding WebSocket Events

1. Add event name to `CONSTANTS.SOCKET_EVENTS` in `core/constants/index.ts`
2. Add handler in `ChatSocketHandler` or `CallSocketHandler`
3. Emit to appropriate rooms using `socket.to('room:id').emit()`

## Redis Caching Strategy

The `CacheService` provides a standard interface. Redis keys are defined in `CONSTANTS.REDIS_KEYS`:

- User presence: `presence:${userId}`
- Typing indicators: `typing:${groupId}:${userId}`
- Cached messages: `message:${messageId}`
- Active calls: `call:${callId}`
- Blacklisted tokens: `blacklist:${token}`

Always use `CacheService` methods, never access Redis directly:

```typescript
await this.cacheService.get(CONSTANTS.REDIS_KEYS.CACHED_USER(userId));
await this.cacheService.setWithExpiry(key, value, CONSTANTS.CACHE_TTL.USER);
```

## Authentication & Authorization

**JWT Flow**:

- Access tokens: 15 minutes (default)
- Refresh tokens: 7 days (default), stored in database
- Tokens contain: `{ id, email, role }`

**Middleware**:

- `authenticate` - Validates JWT, populates `req.user`
- `authorize(...roles)` - Checks user role (USER, MODERATOR, ADMIN)

**Controllers using auth**:

```typescript
import { AuthRequest } from '@middlewares/auth.middleware.js';

someMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id; // Safe after authenticate middleware
});
```

## Error Handling

Use custom error classes from `core/errors/`:

- `ValidationError` - 400 Bad Request
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `AppError` - Generic error with custom status code

Errors are automatically caught by `express-async-errors` and handled by `errorHandler` middleware.

## Important Conventions

1. **Always use asyncHandler** for controller methods (handles promise rejections)
2. **Always sanitize user objects** before sending responses (use `Helpers.sanitizeUser()`)
3. **All file imports need .js extension** (ES modules requirement)
4. **Use ResponseHandler** for consistent API responses
5. **Register new services/repositories** in `app/config/container.ts`
6. **Invalidate cache** when updating entities
7. **Use logger, not console.log** (`logger.info()`, `logger.error()`, etc.)

## WebSocket Event Naming

All WebSocket events follow pattern: `category:action`

- Messaging: `message:send`, `message:received`, `message:edit`, `message:delete`
- Calls: `call:initiate`, `call:answer`, `call:reject`, `call:end`
- Typing: `typing:start`, `typing:stop`
- Presence: `user:online`, `user:offline`

## Testing

Tests use Vitest. Test files go in `tests/` directory:

- Unit tests for services and repositories
- Integration tests for API endpoints (use supertest)
- Setup file at `tests/setup.ts` handles database/Redis connections

Run single test file: `pnpm test path/to/test.test.ts`

## Environment Variables

All env vars are validated in `app/config/env.ts` using envsafe. If adding new vars:

1. Add to `.env.example`
2. Add validation in `app/config/env.ts`
3. Update `docker-compose.yml` if needed

## Jitsi Video Calling Integration

The `JitsiService` handles video/audio call room creation and JWT token generation:

**Key Methods**:

- `generateRoomId()` - Creates unique room ID with configured prefix
- `generateJitsiToken(config)` - Generates secure JWT for Jitsi room access
- `getRoomUrl(roomId, token)` - Constructs full Jitsi meeting URL

**Token Structure**:

- Contains user context (id, name, avatar, email)
- Sets moderator permissions (call initiator is always moderator)
- Expires in 2 hours
- Signed with `JITSI_APP_SECRET` from env vars

**Call Flow**:

1. User initiates call via `/api/v1/calls` endpoint
2. `CallService` uses `JitsiService` to generate room + token
3. Room info stored in PostgreSQL, active session cached in Redis
4. WebSocket events notify participants
5. Frontend receives Jitsi room URL with JWT token
6. Participants join using their own tokens (generated when they accept)

## WebSocket Connection & Authentication

**Client Connection**:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'JWT_ACCESS_TOKEN' },
  // OR
  // headers: { authorization: 'Bearer JWT_ACCESS_TOKEN' }
});
```

**Server-side flow**:

1. `SocketManager.setupAuthentication()` middleware runs on connection
2. Extracts token from `socket.handshake.auth.token` or headers
3. Verifies JWT using `JWT_ACCESS_SECRET`
4. Stores decoded user in `socket.data.user`
5. Rejects connection if token invalid/missing

**Room Management**:

- Users auto-join personal room on connection: `socket.join('user:${userId}')`
- Groups require explicit join: `chatHandler.joinGroupRoom(socket, groupId)`
- Use `socket.to('room-name')` to emit to specific rooms
- Use `io.to('room-name')` to emit from outside socket handlers

## Rate Limiting Strategy

Three rate limiters defined in `app/middlewares/rateLimit.middleware.ts`:

1. **authLimiter** - 5 requests per 15 minutes (login/register)
2. **messageLimiter** - 30 requests per minute (message sending)
3. **apiLimiter** - 100 requests per 15 minutes (general API)

**How it works**:

- Uses Redis to track request counts per IP
- Configured in routes: `router.post('/login', authLimiter, ...)`
- Custom limiters: `createRateLimiter({ windowMs, max, message })`

## Pagination Helpers

All list endpoints use standardized pagination via `Helpers.paginate()`:

```typescript
// In service
const { skip, take } = Helpers.paginate(page, limit);
const items = await repository.find({ skip, take });

// In controller
return ResponseHandler.paginated(res, items, page, limit, total);
```

**Defaults** (from `CONSTANTS.PAGINATION`):

- Default page: 1
- Default limit: 20
- Max limit: 100

## Constants Usage

Import from `@constants/index.js` to access:

- `CONSTANTS.SOCKET_EVENTS` - All WebSocket event names
- `CONSTANTS.REDIS_KEYS` - Redis key generators (functions)
- `CONSTANTS.CACHE_TTL` - Cache expiration times
- `CONSTANTS.PAGINATION` - Pagination defaults
- `CONSTANTS.UPLOAD` - File upload constraints
- `CONSTANTS.JWT` - JWT header names

**Always use constants, never hardcode strings**:

```typescript
socket.emit(CONSTANTS.SOCKET_EVENTS.MESSAGE_RECEIVED, data); // ✓ Correct
socket.emit('message:received', data); // ✗ Wrong
```

## Swagger Documentation

Controller methods include JSDoc annotations for Swagger. Access docs at: `http://localhost:3000/api/docs`

## Application Startup & Graceful Shutdown

**Startup sequence** (in `main.ts`):

1. Import `reflect-metadata` and `express-async-errors` first
2. Import and execute `app/config/container.ts` to register DI
3. Initialize Express app with middleware
4. Connect to PostgreSQL via Prisma
5. Connect to Redis
6. Initialize SocketManager (creates Socket.IO + Redis adapter)
7. Start HTTP server
8. Log success with port, env, and docs URL

**Graceful shutdown** (SIGTERM/SIGINT):

1. Close HTTP server (stops accepting new connections)
2. Disconnect Prisma (`prisma.$disconnect()`)
3. Disconnect Redis (`redis.quit()`)
4. Exit process with code 0

**Error handling**:

- Unhandled rejections logged but don't crash
- Uncaught exceptions logged then process exits
