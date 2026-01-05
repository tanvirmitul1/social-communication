# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an enterprise-level real-time messaging and audio/video calling platform backend built with Express.js, TypeScript, PostgreSQL, and Redis. The codebase follows clean architecture principles with strict separation of concerns across five layers: Core, Domain (Repositories), Application (Services), Infrastructure (Config), and Presentation (Controllers/Routes).

## Documentation Structure

All documentation is organized in the `docs/` directory:

### Getting Started

- `docs/getting-started/quickstart.md` - Quick start guide (Docker & local setup)
- `docs/getting-started/installation.md` - Comprehensive installation instructions
- `docs/getting-started/postgres-setup.md` - PostgreSQL setup guide (Windows-specific)

### API Documentation

- `docs/api/overview.md` - Complete API reference (endpoints, events, formats)
- `docs/api/examples.md` - Practical API usage examples
- Interactive Swagger docs at: http://localhost:3000/api/docs

### Development

- `docs/development/architecture.md` - Detailed architecture documentation
- `docs/development/setup.md` - Development environment setup
- `docs/development/docker-workflow.md` - Docker development workflow (recommended)

### Guides

- `docs/guides/troubleshooting.md` - Common issues and solutions

**Note**: The README.md contains quick links to all documentation. Always refer users to specific docs rather than duplicating information.

## Essential Commands

### Recommended: Docker Development Workflow

```bash
# Initial setup (after cloning)
cp .env.example .env

# Start everything (Postgres, Redis, App with hot reload)
pnpm docker:dev:up          # Start all services in Docker

# View logs
pnpm docker:dev:logs        # View all service logs

# Stop everything
pnpm docker:dev:down        # Stop all services

# Run commands inside container
docker compose -f docker-compose.dev.yml exec app sh
pnpm prisma:studio          # Inside container
pnpm test                   # Inside container

# Code changes auto-reload (volume mounted)
# Just edit files and save - no rebuild needed!
```

### Alternative: Local Development Workflow

```bash
# Initial setup (after cloning)
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate

# Start only database & Redis
pnpm docker:dev:up postgres redis

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

### Folder Structure

```
├── application/          # Application initialization & DI
│   ├── app.ts           # Express app configuration
│   ├── server.ts        # Server startup & graceful shutdown
│   └── container.ts     # Dependency injection registration
├── common/              # Shared utilities & types
│   ├── errors.ts        # Custom error classes
│   ├── constants.ts     # Application constants
│   ├── utils.ts         # Helper functions
│   ├── response.ts      # ResponseHandler
│   └── async-handler.ts # Async error wrapper
├── config/              # Configuration (DB, Redis, Swagger)
│   ├── env.ts           # Environment variable validation
│   ├── prisma.ts        # Prisma client singleton
│   ├── redis.ts         # Redis client singleton
│   ├── logger.ts        # Pino logger
│   ├── rate-limiter.ts  # Rate limiting configuration
│   └── swagger.ts       # OpenAPI specification
├── infrastructure/      # Base repositories & external services
│   ├── base.repository.ts  # Base repository with Prisma client
│   ├── cache.service.ts    # Redis caching abstraction
│   ├── jitsi.service.ts    # Jitsi integration
│   └── socket.manager.ts   # Socket.IO + Redis adapter
├── middlewares/         # Express middlewares
│   ├── auth-guard.ts    # JWT authentication
│   ├── validation.ts    # Request validation
│   └── error-handler.ts # Global error handler
├── modules/            # Feature modules
│   ├── auth/          # Authentication & authorization
│   ├── user/          # User management & friends
│   ├── message/       # Real-time messaging
│   ├── group/         # Group chat management
│   ├── call/          # Audio/video calls (Jitsi)
│   └── health/        # Health check endpoints
├── prisma/            # Database schema & migrations
├── main.ts            # Application entry point
└── docker-compose.yml # Docker services
```

### Module Structure

Each module in `modules/` follows this pattern:

```
modules/[feature]/
├── [feature].controller.ts  # HTTP request handlers
├── [feature].service.ts     # Business logic
├── [feature].repository.ts  # Database access
├── [feature].routes.ts      # Route definitions
├── [feature].validation.ts  # Zod validation schemas
└── [feature].gateway.ts     # Socket.IO handlers (if needed)
```

### Key Design Patterns

**Dependency Injection (tsyringe)**

- All services and repositories are registered as singletons in `application/container.ts`
- Use `@inject('ServiceName')` decorator in constructors
- Controllers resolve dependencies via `container.resolve(ControllerClass)`

**Repository Pattern**

- All database access goes through repositories
- Each repository extends `BaseRepository` which provides access to Prisma client
- Keeps Prisma queries isolated and testable
- Example: `UserRepository.findById()` instead of `prisma.user.findUnique()`

**Service Layer Pattern**

- Business logic stays in services, not controllers
- Services consume repositories via dependency injection
- Services handle transactions, caching, and complex workflows

**WebSocket Architecture** (`infrastructure/socket.manager.ts`)

- `SocketManager` - Initializes Socket.IO server with Redis adapter for horizontal scaling
- `ChatSocketHandler` - Handles messaging events (in `modules/message/message.gateway.ts`)
- `CallSocketHandler` - Handles call events (in `modules/call/call.gateway.ts`)
- Authentication middleware validates JWT tokens on socket connection
- Users join rooms: `user:${userId}` for direct messages, `group:${groupId}` for groups
- **Critical**: Redis adapter (pub/sub) enables WebSocket communication across multiple server instances

## TypeScript Path Aliases

The project uses path aliases (defined in `tsconfig.json`). Always use these imports:

```typescript
import { UserService } from '@modules/user/user.service.js'; // Correct
import { NotFoundError } from '@common/errors.js'; // Correct
import { CONSTANTS } from '@common/constants.js'; // Correct

// NOT:
import { UserService } from '../user/user.service.js'; // Wrong
```

**Critical**: All imports MUST include `.js` extension (ES modules requirement).

Available aliases:

- `@application/*` → `application/*`
- `@config/*` → `config/*`
- `@modules/*` → `modules/*`
- `@common/*` → `common/*`
- `@infrastructure/*` → `infrastructure/*`
- `@middlewares/*` → `middlewares/*`

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

1. **Define validation schema** in module's `[feature].validation.ts` using Zod
2. **Add repository method** in module's `[feature].repository.ts`
3. **Add service method** in module's `[feature].service.ts`
4. **Add controller method** in module's `[feature].controller.ts` with JSDoc Swagger annotations
5. **Add route** in module's `[feature].routes.ts` with middleware (auth, validation, rate limiting)
6. **Register in dependency injection** in `application/container.ts` if new service/repository created

Example flow for "Get User's Friends":

```typescript
// 1. modules/user/user.validation.ts
export const getUserFriendsSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional()
});

// 2. modules/user/user.repository.ts
async getFriends(userId: string, skip: number, take: number) {
  // Prisma query to get friends
}

// 3. modules/user/user.service.ts
async getUserFriends(userId: string, page: number, limit: number) {
  const { skip, take } = Helpers.paginate(page, limit);
  return this.userRepository.getFriends(userId, skip, take);
}

// 4. modules/user/user.controller.ts
getUserFriends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const friends = await this.userService.getUserFriends(...);
  return ResponseHandler.success(res, friends);
});

// 5. modules/user/user.routes.ts
router.get('/:id/friends', userController.getUserFriends);
```

### Adding WebSocket Events

1. Add event name to `CONSTANTS.SOCKET_EVENTS` in `common/constants.ts`
2. Add handler in `modules/message/message.gateway.ts` or `modules/call/call.gateway.ts`
3. Emit to appropriate rooms using `socket.to('room:id').emit()`

## Redis Caching Strategy

The `CacheService` (in `infrastructure/cache.service.ts`) provides a standard interface. Redis keys are defined in `CONSTANTS.REDIS_KEYS`:

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

- `authenticate` (in `middlewares/auth-guard.ts`) - Validates JWT, populates `req.user`
- `authorize(...roles)` - Checks user role (USER, MODERATOR, ADMIN)

**Controllers using auth**:

```typescript
import { AuthRequest } from '@middlewares/auth-guard.js';

someMethod = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id; // Safe after authenticate middleware
});
```

## Error Handling

Use custom error classes from `common/errors.ts`:

- `ValidationError` - 400 Bad Request
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `AppError` - Generic error with custom status code

Errors are automatically caught by `express-async-errors` and handled by `errorHandler` middleware in `middlewares/error-handler.ts`.

## Important Conventions

1. **Always use asyncHandler** for controller methods (handles promise rejections)
2. **Always sanitize user objects** before sending responses (use `Helpers.sanitizeUser()`)
3. **All file imports need .js extension** (ES modules requirement)
4. **Use ResponseHandler** for consistent API responses
5. **Register new services/repositories** in `application/container.ts`
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

All env vars are validated in `config/env.ts` using envsafe. If adding new vars:

1. Add to `.env.example`
2. Add validation in `config/env.ts`
3. Update `docker-compose.yml` if needed

## Jitsi Video Calling Integration

The `JitsiService` (in `infrastructure/jitsi.service.ts`) handles video/audio call room creation and JWT token generation:

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

Rate limiters are defined in `config/rate-limiter.ts`:

- Uses Redis to track request counts per IP
- Configured in routes with middleware
- Custom limiters can be created using the rate limiter factory

**How it works**:

- Express rate limit with Redis store
- Tracks requests per IP address
- Returns 429 Too Many Requests when limit exceeded

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

Import from `@common/constants.js` to access:

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

Swagger configuration is in `config/swagger.ts`.

## Application Startup & Graceful Shutdown

**Startup sequence** (in `main.ts` → `application/server.ts`):

1. Import `reflect-metadata` and `express-async-errors` first
2. Import and execute `application/container.ts` to register DI
3. Initialize Express app with middleware (via `application/app.ts`)
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
