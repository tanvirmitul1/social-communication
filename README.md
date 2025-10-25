# Social Communication Backend

A production-ready, enterprise-level backend for a real-time messaging and audio/video calling platform built with Express.js, TypeScript, PostgreSQL, and Redis.

## Features

- **Real-time Messaging**: WebSocket-based messaging using Socket.IO
- **Audio/Video Calls**: Jitsi Meet API integration for voice/video calling
- **JWT Authentication**: Access and refresh token-based authentication
- **Role-Based Access Control**: Admin, Moderator, and User roles
- **Scalable Architecture**: Modular, clean architecture following SOLID principles
- **PostgreSQL Database**: Type-safe database access with Prisma ORM
- **Redis Caching**: Caching layer for improved performance
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Docker Support**: Complete containerized deployment
- **CI/CD Ready**: GitHub Actions workflow included

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis 7
- **Real-time**: Socket.IO
- **Video Calls**: Jitsi Meet API
- **Authentication**: JWT (jsonwebtoken + argon2)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI 3
- **Testing**: Vitest
- **Package Manager**: pnpm

## Project Structure

```
.
├── app/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic layer
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── sockets/         # WebSocket handlers
│   └── middlewares/     # Express middlewares
├── core/
│   ├── utils/           # Utility functions
│   ├── errors/          # Custom error classes
│   ├── logger/          # Logging configuration
│   ├── validations/     # Validation schemas
│   └── constants/       # Application constants
├── docs/                # Documentation
├── tests/               # Test files
├── prisma/              # Database schema and migrations
├── main.ts              # Application entry point
├── Dockerfile           # Docker configuration
└── docker-compose.yml   # Docker Compose configuration
```

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 8 or higher
- PostgreSQL 16
- Redis 7

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd social-communication
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_communication"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
# ... other variables
```

5. Run database migrations:
```bash
pnpm prisma:migrate
```

6. Generate Prisma client:
```bash
pnpm prisma:generate
```

### Development

Start the development server:
```bash
pnpm dev
```

The server will start at `http://localhost:3000`

### Running with Docker

Start all services using Docker Compose:
```bash
pnpm docker:up
```

Stop services:
```bash
pnpm docker:down
```

View logs:
```bash
pnpm docker:logs
```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI Spec: `http://localhost:3000/api/docs/openapi.json`

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm prisma:generate` - Generate Prisma client
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm docs:generate` - Generate API documentation
- `pnpm docker:build` - Build Docker image
- `pnpm docker:up` - Start Docker containers
- `pnpm docker:down` - Stop Docker containers

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - Search users
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Messages
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/:id` - Get message
- `GET /api/v1/messages/group/:groupId` - Get group messages
- `GET /api/v1/messages/direct/:userId` - Get direct messages
- `PATCH /api/v1/messages/:id` - Edit message
- `DELETE /api/v1/messages/:id` - Delete message

### Groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups` - Get user's groups
- `GET /api/v1/groups/:id` - Get group
- `PATCH /api/v1/groups/:id` - Update group
- `DELETE /api/v1/groups/:id` - Delete group

### Calls
- `POST /api/v1/calls` - Initiate call
- `POST /api/v1/calls/:id/join` - Join call
- `POST /api/v1/calls/:id/end` - End call
- `POST /api/v1/calls/:id/reject` - Reject call

## WebSocket Events

### Messaging
- `message:send` - Send a message
- `message:received` - Receive a message
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Calls
- `call:initiate` - Initiate a call
- `call:ringing` - Incoming call
- `call:answer` - Answer a call
- `call:reject` - Reject a call
- `call:end` - Call ended

## Security Features

- JWT-based authentication with access and refresh tokens
- Argon2 password hashing
- Helmet for HTTP security headers
- CORS configuration
- Rate limiting per route and per IP
- Input validation using Zod
- SQL injection protection via Prisma
- XSS protection

## Testing

Run tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:coverage
```

Run tests with UI:
```bash
pnpm test:ui
```

## Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t social-communication-backend .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
```bash
pnpm build
```

2. Run database migrations:
```bash
pnpm prisma:migrate
```

3. Start the application:
```bash
pnpm start
```

## Environment Variables

See `.env.example` for all available environment variables.

## Health Checks

- `/health` - Basic health check
- `/health/ready` - Readiness probe (checks database and Redis)
- `/metrics` - Metrics endpoint

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
