# Local Development Setup

This guide covers two approaches: **Full Docker (Recommended)** and **Manual Local Development**.

---

## Approach 1: Full Docker Development (Recommended)

**✅ Best for:**
- New developers joining the team
- Matching production environment exactly
- Quick setup without installing Node.js

### Prerequisites

- Docker Desktop installed
- Git installed

### Step-by-Step Setup

#### Step 1: Clone the Project

```bash
git clone <your-repo-url>
cd social-communication-backend
```

#### Step 2: Start Docker Desktop

Make sure Docker Desktop is running on your machine.

#### Step 3: Create Environment File

```bash
# Copy the development example file
cp .env.dev.example .env
```

**That's it!** The `.env.dev.example` file has everything configured for Docker development.

#### Step 4: Start All Services

```bash
# Start PostgreSQL, Redis, and App (with hot reload)
pnpm docker:dev:up

# View logs (optional)
pnpm docker:dev:logs
```

Wait 30-60 seconds for all services to start.

#### Step 5: Verify Setup

Open your browser and visit:

- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health
- **pgAdmin**: http://localhost:5050 (admin@localhost.com / admin)

### Available URLs

- **API Base**: `http://localhost:3000/api/v1`
- **API Documentation**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`
- **WebSocket**: `ws://localhost:3000`
- **pgAdmin GUI**: `http://localhost:5050`

### Common Commands

```bash
# View logs (all services)
pnpm docker:dev:logs

# View logs for specific service
docker compose -f docker-compose.dev.yml logs -f app
docker compose -f docker-compose.dev.yml logs -f postgres

# Stop all services
pnpm docker:dev:down

# Restart after dependency changes
docker compose -f docker-compose.dev.yml up -d --build app

# Check container status
docker compose -f docker-compose.dev.yml ps

# Access app shell (run commands inside container)
docker compose -f docker-compose.dev.yml exec app sh

# Run migrations
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# Seed test data
docker compose -f docker-compose.dev.yml exec app pnpm prisma:seed

# Run tests
docker compose -f docker-compose.dev.yml exec app pnpm test

# Fresh start (deletes all data)
docker compose -f docker-compose.dev.yml down -v
pnpm docker:dev:up
```

### Hot Reload

**Your code changes auto-reload!** Just edit any file and save:

- TypeScript files are recompiled automatically
- Server restarts on file changes
- No rebuild needed (source code is volume-mounted)

### Troubleshooting

#### Containers won't start

```bash
# Check what's running
docker compose -f docker-compose.dev.yml ps

# View error logs
pnpm docker:dev:logs

# Common fix: rebuild app
docker compose -f docker-compose.dev.yml up -d --build app
```

#### Port already in use

```bash
# Default ports: 3000 (app), 5432 (postgres), 6379 (redis), 5050 (pgAdmin)
# Check what's using the port (Windows)
netstat -ano | findstr :3000

# Stop the conflicting service or change ports in docker-compose.dev.yml
```

#### Changes not reflecting

```bash
# After package.json changes, rebuild:
docker compose -f docker-compose.dev.yml up -d --build app

# Check if volume is mounted correctly:
docker compose -f docker-compose.dev.yml config
```

#### Reset everything

```bash
# Delete all data and start fresh
pnpm docker:dev:down
docker compose -f docker-compose.dev.yml down -v
pnpm docker:dev:up
```

---

## Approach 2: Manual Local Development

**⚠️ Use this if:**
- You already have Node.js 20 installed
- You prefer running the app directly on your machine
- You need faster startup times for the app itself

### Prerequisites

- Node.js 20+ installed
- pnpm 10+ installed (`npm install -g pnpm`)
- Docker Desktop (for database & Redis only)
- Git installed

### Step-by-Step Setup

#### Step 1: Clone the Project

```bash
git clone <your-repo-url>
cd social-communication-backend
```

#### Step 2: Install Dependencies

```bash
pnpm install
```

#### Step 3: Create Environment File

```bash
# Copy the example file
cp .env.example .env
```

**Edit `.env`** and ensure database/Redis point to localhost:

```bash
DATABASE_URL=postgresql://postgres:141532@localhost:5432/social_communication?schema=public
REDIS_HOST=localhost
```

#### Step 4: Start Database & Redis

```bash
# Start only Postgres and Redis in Docker
pnpm docker:dev:up postgres redis

# OR use docker compose directly:
docker compose -f docker-compose.dev.yml up postgres redis -d
```

#### Step 5: Generate Prisma Client & Run Migrations

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

#### Step 6: Start the App Locally

```bash
pnpm dev
```

The app will start at http://localhost:3000

### Common Commands

```bash
# Development
pnpm dev                    # Start with hot reload
pnpm lint                   # Run ESLint
pnpm format                 # Format with Prettier

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run migrations
pnpm prisma:studio          # Open Prisma Studio GUI
pnpm prisma:seed            # Seed database

# Testing
pnpm test                   # Run tests
pnpm test:coverage          # Run tests with coverage

# Build
pnpm build                  # Build for production
```

---

## Production-like Testing (Full Docker with Nginx)

To test the full production setup locally:

```bash
# Start everything (app, database, Redis, Nginx)
pnpm docker:up

# Access via Nginx at http://localhost
# API Docs: http://localhost/api/docs
```

This uses [docker-compose.yml](docker-compose.yml) (production config) instead of [docker-compose.dev.yml](docker-compose.dev.yml).

---

## Comparison

| Feature | Full Docker | Manual Local |
|---------|-------------|--------------|
| Setup time | 5 min | 15-30 min |
| Requirements | Docker only | Node.js + pnpm + Docker |
| Hot reload | ✅ Yes | ✅ Yes |
| Prod parity | ✅ 100% | ⚠️ ~70% |
| Startup time | ~15 sec | ~3 sec |
| Recommended | ✅ **Yes** | For experienced devs |

---

## Need More Info?

- **Docker workflow guide**: [docs/development/docker-workflow.md](docs/development/docker-workflow.md)
- **Architecture details**: [docs/development/architecture.md](docs/development/architecture.md)
- **Developer guide**: [CLAUDE.md](CLAUDE.md)
- **Migration guide**: [DOCKER_MIGRATION.md](DOCKER_MIGRATION.md)
