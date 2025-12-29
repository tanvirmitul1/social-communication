# Social Communication Backend

Enterprise-level real-time messaging and audio/video calling platform built with Express.js, TypeScript, PostgreSQL, Redis, and Socket.IO.

## Features

- 💬 Real-time messaging (direct & group)
- 📞 Audio/Video calls (Jitsi integration)
- 👥 User management & friend requests
- 🔔 Real-time notifications
- 📎 File uploads
- 🔒 JWT authentication
- 🚀 WebSocket support
- 📊 PostgreSQL database
- ⚡ Redis caching

---

## 📖 Documentation

### For Developers

- **[LOCAL_SETUP.md](LOCAL_SETUP.md)** - Step-by-step guide to run locally with Docker
- **[PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md)** - Step-by-step Oracle Cloud deployment guide
- **[CLAUDE.md](CLAUDE.md)** - Developer guide for working with this codebase

---

## 🚀 Quick Start

### Development (Recommended - All in Docker)

```bash
# 1. Start all services (Postgres, Redis, App with hot reload)
pnpm docker:dev:up

# 2. Open browser
http://localhost:3000/api/docs

# View logs
pnpm docker:dev:logs
```

**✅ Benefits**: Dev/prod parity, no local Node.js needed, hot reload works!

### Alternative: Local Development (Manual)

```bash
# 1. Start only database & Redis
pnpm docker:dev:up postgres redis

# 2. Install dependencies
pnpm install

# 3. Run migrations
pnpm prisma:generate
pnpm prisma:migrate

# 4. Start app locally
pnpm dev
```

**See [LOCAL_SETUP.md](LOCAL_SETUP.md) for details.**

### Production Deployment (Oracle Cloud)

```bash
# 1. Copy production environment file
cp .env.production .env

# 2. Edit with your settings
nano .env

# 3. Start all services
docker compose up -d
```

**Done!** See [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md) for full instructions.

---

## 🛠 Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **WebSocket**: Socket.IO
- **Video Calls**: Jitsi Meet API
- **Deployment**: Docker & Docker Compose
- **Reverse Proxy**: Nginx

---

## 📂 Project Structure

```
├── application/          # Application initialization & DI
├── common/              # Shared utilities & types
├── config/              # Configuration (DB, Redis, Swagger)
├── infrastructure/      # Base repositories & external services
├── middlewares/         # Express middlewares
├── modules/            # Feature modules
│   ├── auth/          # Authentication & authorization
│   ├── user/          # User management & friends
│   ├── message/       # Real-time messaging
│   ├── group/         # Group chat management
│   └── call/          # Audio/video calls (Jitsi)
├── prisma/            # Database schema & migrations
├── main.ts            # Application entry point
└── docker-compose.yml # Docker services
```

---

## 🌐 API Documentation

After starting the application:

- **Swagger UI**: http://localhost/api/docs
- **Health Check**: http://localhost/health
- **API Base**: http://localhost/api/v1

### Main Endpoints

**Authentication**
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

**Messages**
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/direct/:userId` - Get direct messages
- `GET /api/v1/messages/group/:groupId` - Get group messages

**Calls**
- `POST /api/v1/calls` - Initiate call
- `POST /api/v1/calls/:id/join` - Join call
- `POST /api/v1/calls/:id/end` - End call

### WebSocket Events

**Messaging**
- `message:send` - Send message
- `message:received` - Receive message
- `typing:start` / `typing:stop` - Typing indicators

**Calls**
- `call:initiate` - Initiate call
- `call:answer` - Answer call
- `call:reject` - Reject call
- `call:end` - End call

---

## 🔧 Common Commands

### Development Mode (Docker)

```bash
# Start dev environment (hot reload enabled)
pnpm docker:dev:up

# View logs (all services)
pnpm docker:dev:logs

# Stop dev environment
pnpm docker:dev:down

# Rebuild app (after dependency changes)
docker compose -f docker-compose.dev.yml up -d --build app

# Check status
docker compose -f docker-compose.dev.yml ps

# Run migrations inside container
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# Access app shell
docker compose -f docker-compose.dev.yml exec app sh

# Access database GUI
http://localhost:5050  # pgAdmin (admin@localhost.com / admin)
```

### Production Mode (Docker)

```bash
# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down

# Restart app
docker compose restart app

# Backup database
docker compose exec -T postgres pg_dump -U postgres social_communication > backup.sql
```

### Database Commands

```bash
# Access PostgreSQL CLI
docker compose exec postgres psql -U postgres -d social_communication

# Seed test data
docker compose exec app pnpm prisma:seed

# Reset database (WARNING: deletes all data)
docker compose exec app pnpm prisma:reset
```

---

## 🔒 Environment Variables

Key variables in `.env`:

```bash
NODE_ENV=development|production
DATABASE_URL=postgresql://postgres:password@postgres:5432/social_communication
REDIS_HOST=redis
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGINS=http://localhost
JITSI_DOMAIN=meet.jit.si
```

---

## 📋 Requirements

- **Docker Desktop** (for local development)
- **Docker & Docker Compose** (for production)
- **Minimum**: 2GB RAM, 10GB disk space

---

## 🐛 Troubleshooting

### Check container status
```bash
docker compose ps
```

### View error logs
```bash
docker compose logs app
```

### Restart services
```bash
docker compose restart
```

### Fresh start (deletes data)
```bash
docker compose down -v
docker compose up -d
```

---

## 📄 License

MIT

---

## 💬 Support

- Check logs: `docker compose logs -f`
- See documentation: [LOCAL_SETUP.md](LOCAL_SETUP.md) or [PRODUCTION_DEPLOY.md](PRODUCTION_DEPLOY.md)
- Review [CLAUDE.md](CLAUDE.md) for development guidelines
