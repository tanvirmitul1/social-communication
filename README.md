# Social Communication Backend

Enterprise-level real-time messaging and audio/video calling platform built with Express.js, TypeScript, PostgreSQL, Redis, and Socket.IO.

## Features

- Real-time messaging (direct & group)
- Audio/video calls (Jitsi integration)
- Social features (friends, follows, feeds, posts)
- Real-time notifications
- File uploads (Cloudinary)
- Push notifications (Firebase)
- JWT authentication + 2FA
- AI agent integration
- Admin panel (AdminJS)

---

## Quick Start

```bash
# Clone
git clone <your-repo-url>
cd social-communication-backend

# Copy env
cp .env.example .env

# Start everything (Postgres, Redis, App — hot reload)
pnpm docker:dev:up
```

API: <http://localhost:3000> · Swagger: <http://localhost:3000/api/docs> · Admin: <http://localhost:3000/admin>

---

## Documentation

| Doc | Description |
| --- | --- |
| [docs/setup.md](docs/setup.md) | Dev setup (Docker & local) + production deployment |
| [docs/database.md](docs/database.md) | Database management, backup & restore |
| [docs/api/frontend.md](docs/api/frontend.md) | Full API + WebSocket reference for frontend devs |
| [docs/api/admin.md](docs/api/admin.md) | Admin panel usage and security |
| [docs/api/ai-agent.md](docs/api/ai-agent.md) | AI agent API reference |
| [docs/api/profile-preview.md](docs/api/profile-preview.md) | Profile hover preview API |
| [docs/timeline-feed/architecture.md](docs/timeline-feed/architecture.md) | Timeline/feed system design |
| [docs/timeline-feed/api.md](docs/timeline-feed/api.md) | Timeline/feed API reference |
| [docs/timeline-feed/implementation.md](docs/timeline-feed/implementation.md) | Timeline/feed frontend integration guide |
| [CLAUDE.md](CLAUDE.md) | Codebase conventions for AI-assisted development |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 22 |
| Framework | Express.js |
| Language | TypeScript |
| Database | PostgreSQL 16 (Prisma ORM) |
| Cache | Redis 7 |
| WebSocket | Socket.IO |
| Video Calls | Jitsi Meet API |
| Admin Panel | AdminJS |
| Deployment | Docker + Nginx |

---

## Project Structure

```text
├── application/       # App init, DI container
├── common/            # Errors, constants, utils, response helpers
├── config/            # DB, Redis, Swagger, env validation
├── infrastructure/    # Base repository, cache, socket, Jitsi
├── middlewares/       # Auth, validation, error handler
├── modules/           # Feature modules (auth, user, message, group, call, post, ...)
│   └── [feature]/
│       ├── [feature].controller.ts
│       ├── [feature].service.ts
│       ├── [feature].repository.ts
│       ├── [feature].routes.ts
│       ├── [feature].validation.ts
│       └── [feature].gateway.ts   (if WebSocket)
├── prisma/            # Schema + migrations
└── main.ts            # Entry point
```
