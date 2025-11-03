# Complete Development Setup Guide

This guide will help you set up your development environment from scratch with Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Recommended)](#quick-start-recommended)
- [Manual Setup](#manual-setup)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Docker Desktop** (includes Docker Compose)
   - Download: https://www.docker.com/products/docker-desktop/
   - Verify installation:
     ```bash
     docker --version
     docker-compose --version
     ```

2. **Node.js 20+** (for local development)
   - Download: https://nodejs.org/
   - Verify installation:
     ```bash
     node --version  # Should be 20+
     ```

3. **pnpm** (package manager)
   - Install: `npm install -g pnpm`
   - Verify installation:
     ```bash
     pnpm --version  # Should be 8+
     ```

4. **Git**
   - Download: https://git-scm.com/
   - Verify installation:
     ```bash
     git --version
     ```

### Optional but Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Docker
  - GitLens

## Quick Start (Recommended)

This is the fastest way to get started with Docker handling all services.

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd social-communication
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Copy Environment File

```bash
# Copy the development environment file
cp .env.development .env
```

The `.env.development` file already has correct settings for Docker.

### Step 4: Start Docker Services

```bash
# Start PostgreSQL and Redis in Docker
pnpm docker:dev:up
```

This starts:

- ✅ PostgreSQL database on port 5432
- ✅ Redis cache on port 6379
- ✅ pgAdmin4 (Database GUI) on port 5050

### Step 5: Wait for Services to be Ready

```bash
# Check service status
pnpm docker:dev:logs

# Or check with Docker directly
docker ps
```

Wait until both services show as "healthy" (about 10-20 seconds).

### Step 6: Run Database Migrations

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations to create tables
pnpm prisma:migrate

# (Optional) Seed database with test data
pnpm prisma:seed
```

### Step 7: Start Development Server

```bash
pnpm dev
```

The server will start at: http://localhost:3000

### Step 8: Verify Everything Works

Open your browser and test:

1. **Health Check**: http://localhost:3000/health
   - Should return: `{"status":"ok",...}`

2. **API Docs**: http://localhost:3000/api/docs
   - Should show Swagger UI

3. **Test Registration**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Test@123\"}"
   ```

🎉 **You're all set!** Your development environment is ready.

## Manual Setup

If you prefer to install PostgreSQL and Redis locally instead of using Docker.

### 1. Install PostgreSQL

**Windows:**

- Download from: https://www.postgresql.org/download/windows/
- Run installer, set password for `postgres` user
- Remember the password!

**Mac:**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Install Redis

**Windows:**

- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL2 with Linux instructions

**Mac:**

```bash
brew install redis
brew services start redis
```

**Linux:**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

### 3. Create Database

```bash
# Using psql
psql -U postgres

# In psql:
CREATE DATABASE social_communication;
\q
```

### 4. Configure Environment

Copy and edit `.env`:

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
# Use localhost for local installations
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/social_communication?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 5. Install Dependencies and Migrate

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed  # Optional
```

### 6. Start Development Server

```bash
pnpm dev
```

## Development Workflow

### Starting Development

```bash
# 1. Start Docker services (if using Docker)
pnpm docker:dev:up

# 2. Start development server
pnpm dev

# The server auto-restarts when you change files
```

### Stopping Development

```bash
# Stop development server
# Press Ctrl+C in the terminal

# Stop Docker services
pnpm docker:dev:down
```

### Database Changes

When you modify `prisma/schema.prisma`:

```bash
# 1. Create migration
pnpm prisma migrate dev --name your_migration_name

# 2. Prisma client is auto-generated
# 3. Restart dev server if needed
```

### Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run tests with UI
pnpm test:ui
```

## Common Tasks

### View Database

You have two options for viewing your database:

**Option 1: pgAdmin4 (Recommended for PostgreSQL)**

1. Open browser: http://localhost:5050
2. Login:
   - Email: `admin@localhost.com`
   - Password: `admin`
3. Add PostgreSQL server:
   - Right-click "Servers" → Register → Server
   - **General**: Name = `Local Development`
   - **Connection**:
     - Host: `postgres`
     - Port: `5432`
     - Database: `social_communication`
     - Username: `postgres`
     - Password: `postgres`
   - Click "Save"

**Option 2: Prisma Studio (Prisma ORM GUI)**

```bash
# Open Prisma Studio
pnpm prisma:studio

# Opens at: http://localhost:5555
```

### Reset Database

```bash
# WARNING: Deletes all data!
pnpm prisma migrate reset

# Recreates database and runs seed
```

### View Logs

```bash
# Application logs (when running pnpm dev)
# Logs appear in console

# Docker service logs
pnpm docker:dev:logs

# Or view specific service with Docker
docker logs social-comm-postgres-dev -f
docker logs social-comm-redis-dev -f
```

### Access Database Directly

```bash
# Using psql (Docker)
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication

# Using psql (local)
psql -U postgres -d social_communication
```

### Access Redis CLI

```bash
# Using Docker
docker exec -it social-comm-redis-dev redis-cli

# Using local Redis
redis-cli
```

### Clean Docker Volumes

```bash
# Stop services and remove volumes (deletes all data!)
pnpm docker:dev:down
docker volume rm social-comm-postgres-dev social-comm-redis-dev

# Start fresh
pnpm docker:dev:up
pnpm prisma:migrate
pnpm prisma:seed
```

### Generate API Documentation

```bash
# Generate markdown docs
pnpm docs:generate

# View Swagger docs (when server is running)
# Open: http://localhost:3000/api/docs
```

## Environment Variables

### Development Environment (.env)

```env
NODE_ENV=development
PORT=3000

# For Docker: use container names
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_communication?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379

# Development secrets (NOT FOR PRODUCTION)
JWT_ACCESS_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# CORS for local frontend development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:4173

# Debug logging
LOG_LEVEL=debug
```

### When Running App in Docker

If you uncomment the `app` service in `docker-compose.dev.yml`, use:

```env
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/social_communication?schema=public"
REDIS_HOST=redis
```

## Project Structure for Development

```
social-communication/
├── app/                    # Application code
│   ├── config/            # Configuration
│   ├── controllers/       # HTTP handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   ├── routes/            # API routes
│   ├── sockets/           # WebSocket handlers
│   └── middlewares/       # Express middleware
├── core/                   # Core utilities
│   ├── constants/
│   ├── errors/
│   ├── logger/
│   ├── utils/
│   └── validations/
├── docs/                   # Documentation
├── prisma/                 # Database
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration history
│   └── seed.ts            # Seed data
├── tests/                  # Test files
├── .env                    # Your local environment
├── .env.development        # Development template
├── docker-compose.dev.yml  # Development Docker config
└── main.ts                 # Entry point
```

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Find process using port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill the process or change port in .env
PORT=4000
```

### Docker Services Won't Start

**Error:** `Cannot connect to Docker daemon`

**Solution:**

1. Make sure Docker Desktop is running
2. Check Docker Desktop settings
3. Restart Docker Desktop

### Database Connection Error

**Error:** `Can't reach database server`

**Solution:**

```bash
# Check if PostgreSQL container is running
docker-compose -f docker-compose.dev.yml ps

# Check logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart services
docker-compose -f docker-compose.dev.yml restart postgres
```

### Redis Connection Error

**Error:** `Error connecting to Redis`

**Solution:**

```bash
# Test Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli ping
# Should return: PONG

# Restart Redis
docker-compose -f docker-compose.dev.yml restart redis
```

### Prisma Client Errors

**Error:** `Cannot find module '@prisma/client'`

**Solution:**

```bash
pnpm prisma:generate
```

### Hot Reload Not Working

**Solution:**

```bash
# Make sure you're using dev mode
pnpm dev

# Not:
pnpm start  # This is for production
```

### Module Not Found Errors

**Error:** `Cannot find module '@services/...'`

**Solution:**

```bash
# Clear and reinstall
rm -rf node_modules dist
pnpm install
pnpm build
```

## Next Steps

- Read the [API Documentation](../api/overview.md)
- Explore the [Architecture Guide](../development/architecture.md)
- Check out [API Examples](../api/examples.md)
- Learn about [Deployment](./production-deployment.md)

## Getting Help

- Check [Troubleshooting Guide](./troubleshooting.md)
- Review error logs
- Open a GitHub issue with details
