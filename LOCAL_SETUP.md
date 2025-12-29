# Local Development Setup (Docker)

Simple step-by-step guide to run the application locally using Docker.

## Prerequisites

- Docker Desktop installed
- Git installed

## Step-by-Step Setup

### Step 1: Clone the Project

```bash
git clone <your-repo-url>
cd social-communication-backend
```

### Step 2: Start Docker Desktop

Make sure Docker Desktop is running on your machine.

### Step 3: Create Environment File

```bash
# Copy the example file
cp .env.docker .env
```

**That's it!** The `.env.docker` file already has everything configured for local development.

### Step 4: Start All Services

```bash
# Start PostgreSQL, Redis, App, and Nginx
docker compose up -d

# View logs (optional)
docker compose logs -f
```

Wait 30-60 seconds for all services to start.

### Step 5: Verify Setup

Open your browser and visit:

- **API Docs**: http://localhost/api/docs
- **Health Check**: http://localhost/health

## Available URLs

- **API Base**: `http://localhost/api/v1`
- **API Documentation**: `http://localhost/api/docs`
- **Health Check**: `http://localhost/health`
- **WebSocket**: `ws://localhost`

## Common Commands

```bash
# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f app
docker compose logs -f postgres

# Stop all services
docker compose down

# Restart after code changes
docker compose up -d --build app

# Stop and delete everything (fresh start)
docker compose down -v
docker compose up -d
```

## Seed Test Data (Optional)

```bash
# Add sample users, messages, groups
docker compose exec app pnpm prisma:seed
```

## Troubleshooting

### Containers won't start

```bash
# Check what's running
docker compose ps

# View error logs
docker compose logs
```

### Port already in use

```bash
# Stop conflicting services or change ports in docker-compose.yml
# Default ports: 80 (nginx), 5432 (postgres), 6379 (redis), 3000 (app)
```

### Reset everything

```bash
# Nuclear option - delete everything and start fresh
docker compose down -v
docker system prune -a
docker compose up -d
```

## That's It!

Your application is now running locally at http://localhost
