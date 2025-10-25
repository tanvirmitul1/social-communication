# Installation Guide

## Prerequisites Check

Before starting, verify you have the required tools installed:

```bash
# Check Node.js version (should be 20+)
node --version

# Check pnpm (should be 8+)
pnpm --version

# Check Docker (if using Docker)
docker --version
docker-compose --version
```

If any are missing, install them:
- **Node.js**: https://nodejs.org/
- **pnpm**: `npm install -g pnpm`
- **Docker**: https://docs.docker.com/get-docker/

## Installation Steps

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project directory
cd social-communication

# Install dependencies
pnpm install
```

This will install all required packages including:
- Express.js and middleware
- Prisma ORM
- Socket.IO
- Redis client
- JWT and Argon2
- And many more...

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000

# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_communication?schema=public"

# Redis - Update with your Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT - Generate secure secrets for production
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-in-production

# CORS - Add your frontend URLs
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Jitsi (optional for video calls)
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=
JITSI_APP_SECRET=
```

### Step 3: Database Setup

#### Option A: Using Docker

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d postgres redis

# Wait for services to be ready (check logs)
docker-compose logs -f postgres redis
```

#### Option B: Local Installation

Install PostgreSQL and Redis locally, then create the database:

```bash
# PostgreSQL
createdb social_communication

# Or using psql
psql -U postgres
CREATE DATABASE social_communication;
\q

# Start Redis
redis-server
```

### Step 4: Run Database Migrations

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations to create tables
pnpm prisma:migrate

# Seed database with test data (optional)
pnpm prisma:seed
```

### Step 5: Verify Installation

```bash
# Run linter
pnpm lint

# Run tests
pnpm test

# Build the application
pnpm build
```

### Step 6: Start the Server

#### Development Mode

```bash
pnpm dev
```

The server will start with hot-reload at http://localhost:3000

#### Production Mode

```bash
# Build first
pnpm build

# Then start
pnpm start
```

### Step 7: Verify Installation

Visit these URLs to confirm everything is working:

- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api/docs
- **Metrics**: http://localhost:3000/metrics

You should see JSON responses indicating the services are healthy.

## Docker Installation (Alternative)

For a completely containerized setup:

```bash
# Build and start all services
docker-compose up -d --build

# Run migrations inside container
docker-compose exec app pnpm prisma:migrate

# Seed database
docker-compose exec app pnpm prisma:seed

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d social_communication

# If using Docker
docker-compose ps postgres
docker-compose logs postgres
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# If using Docker
docker-compose ps redis
docker-compose logs redis
```

### Prisma Migration Errors

```bash
# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Or manually drop and recreate
dropdb social_communication
createdb social_communication
pnpm prisma:migrate
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Regenerate Prisma client
pnpm prisma:generate
```

### Build Errors

```bash
# Clear build cache
rm -rf dist

# Rebuild
pnpm build
```

## Post-Installation

### 1. Test API Endpoints

```bash
# Register a user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test@123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

### 2. Explore API Documentation

Visit http://localhost:3000/api/docs and try out the endpoints using Swagger UI.

### 3. Monitor Logs

```bash
# View application logs
tail -f logs/app.log

# Docker logs
docker-compose logs -f app
```

### 4. Access Database

```bash
# Using Prisma Studio (GUI)
pnpm prisma:studio

# Using psql
psql -h localhost -U postgres -d social_communication

# Docker exec
docker-compose exec postgres psql -U postgres -d social_communication
```

## Development Workflow

```bash
# Start development server with hot reload
pnpm dev

# In separate terminals:
# Run tests in watch mode
pnpm test:watch

# Run linter
pnpm lint

# Format code
pnpm format
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use strong secrets for JWT tokens
3. Configure proper CORS origins
4. Set up PostgreSQL with backups
5. Configure Redis persistence
6. Use a process manager (PM2, systemd)
7. Set up reverse proxy (Nginx, Caddy)
8. Enable HTTPS
9. Configure logging and monitoring
10. Set up CI/CD pipeline

## Next Steps

- Read [QUICKSTART.md](QUICKSTART.md) for quick usage examples
- Review [README.md](README.md) for detailed documentation
- Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture overview
- Explore the API at http://localhost:3000/api/docs

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review error logs
3. Ensure all services are running
4. Verify environment variables
5. Check GitHub issues
