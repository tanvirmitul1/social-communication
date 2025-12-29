# Docker Development Workflow

## Overview

This project uses **Docker for both development and production** to ensure environment parity and eliminate "works on my machine" bugs.

## Why Full Docker Development?

### Previous Setup (Mixed)
- ❌ App runs locally, Postgres/Redis in Docker
- ❌ Different environments = different bugs
- ❌ Developers need Node.js, pnpm installed
- ❌ Version mismatches (Node 20.1 vs 20.5)
- ❌ Complex onboarding

### Current Setup (All Docker)
- ✅ Everything in Docker (app, database, cache)
- ✅ Dev environment = Prod environment
- ✅ Only Docker Desktop needed
- ✅ No version mismatches
- ✅ Simple onboarding: `pnpm docker:dev:up`

## Development Workflow

### Starting Development

```bash
# Start all services (Postgres, Redis, App)
pnpm docker:dev:up

# View logs
pnpm docker:dev:logs

# View only app logs
docker compose -f docker-compose.dev.yml logs -f app
```

Your app will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:5050 (admin@localhost.com / admin)

### Making Code Changes

**Hot reload is enabled!** Just edit your files and save:

```typescript
// Edit any file in app/, core/, etc.
// Changes are reflected immediately (no rebuild needed)
```

The app container mounts your source code as a volume, so TypeScript compilation happens inside the container and restarts automatically.

### Running Commands Inside Container

```bash
# Access app shell
docker compose -f docker-compose.dev.yml exec app sh

# Inside container, run any command:
pnpm test
pnpm lint
pnpm prisma:studio
```

### Database Migrations

```bash
# Create a new migration
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# View database in GUI
# Open http://localhost:5050 and connect to:
# Host: postgres
# Port: 5432
# Username: postgres
# Password: 141532
# Database: social_communication
```

### Installing New Dependencies

When you add a new package:

```bash
# 1. Add to package.json locally
pnpm add express-rate-limit

# 2. Rebuild the app container
docker compose -f docker-compose.dev.yml up -d --build app
```

The rebuild is fast because Docker caches layers.

### Stopping Development

```bash
# Stop all services (keeps data)
pnpm docker:dev:down

# Stop and delete all data (fresh start)
docker compose -f docker-compose.dev.yml down -v
```

## Production Deployment

Production uses the same Docker images, ensuring what you test in dev works in prod:

```bash
# Start production services
pnpm docker:up

# View logs
pnpm docker:logs
```

**Key differences from dev:**
- No source code mounting (uses built `dist/` folder)
- Production Dockerfile (multi-stage build)
- Nginx reverse proxy included
- Optimized Node.js flags
- Health checks enabled

## File Structure

```
.
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── Dockerfile                  # Production multi-stage build
├── Dockerfile.dev              # Development with hot reload
└── .env                        # Environment variables
```

## Environment Variables

Development uses different defaults than production:

**Development** (docker-compose.dev.yml):
- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- `BCRYPT_ROUNDS=10` (faster)
- `JITSI_ROOM_PREFIX=social-comm-dev-`

**Production** (docker-compose.yml):
- `NODE_ENV=production`
- `LOG_LEVEL=info`
- `BCRYPT_ROUNDS=12` (more secure)
- `JITSI_ROOM_PREFIX=social-comm-`

## Troubleshooting

### App container keeps restarting

```bash
# Check logs
docker compose -f docker-compose.dev.yml logs app

# Common issues:
# - Prisma client not generated (run: docker compose exec app pnpm prisma:generate)
# - Database not ready (wait for postgres healthcheck)
# - Missing .env file (copy from .env.example)
```

### Changes not reflected

```bash
# Rebuild app container
docker compose -f docker-compose.dev.yml up -d --build app

# If still not working, check volume mounts:
docker compose -f docker-compose.dev.yml config
```

### Database connection fails

```bash
# Check postgres is running
docker compose -f docker-compose.dev.yml ps postgres

# Check healthcheck
docker compose -f docker-compose.dev.yml ps

# Connect manually to test
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication
```

### Port conflicts

If ports 3000, 5432, 6379, or 5050 are already in use:

```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :3000

# Stop the conflicting service or change ports in docker-compose.dev.yml
```

## Best Practices

1. **Always use `docker:dev:up` for development** (not local pnpm dev)
2. **Commit .env.example** (never commit .env)
3. **Run tests inside container** for consistency
4. **Use pgAdmin** instead of CLI for complex queries
5. **Check logs regularly** during development

## Comparison: Local vs Docker Dev

| Aspect | Local Dev | Docker Dev |
|--------|-----------|------------|
| Setup time | 15-30 min | 2 min |
| Requirements | Node.js, pnpm, Git | Docker Desktop |
| Consistency | Variable | Identical to prod |
| Hot reload | Fast | Fast (with volumes) |
| Debugging | Easy | Easy (attach debugger) |
| CI/CD parity | 70% | 100% |
| Onboarding | Complex | `pnpm docker:dev:up` |

## Debugging in Docker

### Attach VSCode Debugger

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}",
  "protocol": "inspector",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

Update `docker-compose.dev.yml`:

```yaml
app:
  command: node --inspect=0.0.0.0:9229 -r tsx/esm main.ts
  ports:
    - "3000:3000"
    - "9229:9229"  # Debugger port
```

### View Database

```bash
# Option 1: pgAdmin GUI
http://localhost:5050

# Option 2: Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio

# Option 3: CLI
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication
```

## Migration from Local to Docker

If you were running locally before:

```bash
# 1. Stop local app
# (Ctrl+C if running)

# 2. Stop local Postgres/Redis containers
pnpm docker:dev:down

# 3. Start everything in Docker
pnpm docker:dev:up

# 4. Your database data is preserved in volumes!
```

## Summary

**Before (Mixed)**:
```bash
pnpm docker:dev:up postgres redis  # Start DB & Redis
pnpm install                        # Install deps locally
pnpm dev                           # Run app locally
```

**After (All Docker)**:
```bash
pnpm docker:dev:up                 # Start everything
# That's it! Edit code, it hot reloads.
```

**Result**: Simpler, more reliable, production-identical development environment.
