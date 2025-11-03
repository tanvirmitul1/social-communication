# Troubleshooting Guide

Common issues and their solutions for the Social Communication backend.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Redis Issues](#redis-issues)
- [Server Issues](#server-issues)
- [Docker Issues](#docker-issues)
- [Build & TypeScript Issues](#build--typescript-issues)
- [WebSocket Issues](#websocket-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)

## Installation Issues

### pnpm not found

**Problem**: `pnpm: command not found`

**Solution**:
```bash
npm install -g pnpm

# Verify installation
pnpm --version
```

### Dependencies installation fails

**Problem**: Errors during `pnpm install`

**Solutions**:
```bash
# Clear cache and retry
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Or use force install
pnpm install --force
```

### Node version mismatch

**Problem**: `The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check your Node.js version
node --version

# Install Node.js 20+ from https://nodejs.org/
# Or use nvm to switch versions
nvm install 20
nvm use 20
```

## Database Issues

### Connection refused

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:

1. **Check if PostgreSQL is running**:
   ```bash
   # Linux/Mac
   sudo systemctl status postgresql

   # Windows
   net start | findstr postgres

   # Start if not running (Windows)
   net start postgresql-x64-18
   ```

2. **Verify DATABASE_URL** in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/social_communication?schema=public"
   ```

3. **Test connection**:
   ```bash
   psql -h localhost -U postgres -d social_communication
   ```

### Authentication failed

**Problem**: `Error: password authentication failed for user "postgres"`

**Solutions**:

1. **Reset PostgreSQL password**:
   ```bash
   # Using psql as superuser
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'newpassword';
   ```

2. **Update `.env`** with correct password:
   ```env
   DATABASE_URL="postgresql://postgres:newpassword@localhost:5432/social_communication?schema=public"
   ```

3. **For Windows**: See [postgres-setup.md](../getting-started/postgres-setup.md)

### Database does not exist

**Problem**: `Error: database "social_communication" does not exist`

**Solution**:
```bash
# Create the database
createdb social_communication

# Or using psql
psql -U postgres
CREATE DATABASE social_communication;
\q
```

### Migration errors

**Problem**: Prisma migration fails

**Solutions**:

1. **Reset migrations** (WARNING: deletes all data):
   ```bash
   pnpm prisma migrate reset
   ```

2. **Apply migrations manually**:
   ```bash
   pnpm prisma migrate deploy
   ```

3. **Regenerate Prisma client**:
   ```bash
   pnpm prisma:generate
   ```

4. **Check migration status**:
   ```bash
   pnpm prisma migrate status
   ```

### Prisma Client not generated

**Problem**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
pnpm prisma:generate
```

## Redis Issues

### Connection refused

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solutions**:

1. **Check if Redis is running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Start Redis**:
   ```bash
   # Linux/Mac
   redis-server

   # Windows
   # Download from https://github.com/microsoftarchive/redis/releases
   # Or use Docker: docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Verify Redis connection in `.env`**:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

### Redis authentication failed

**Problem**: `NOAUTH Authentication required`

**Solution**:
```env
# Add Redis password to .env
REDIS_PASSWORD=your-redis-password
```

### Redis out of memory

**Problem**: `OOM command not allowed when used memory > 'maxmemory'`

**Solutions**:

1. **Clear Redis cache**:
   ```bash
   redis-cli FLUSHDB
   ```

2. **Increase maxmemory** in `redis.conf`:
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

## Server Issues

### Port already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:

1. **Find and kill the process**:
   ```bash
   # Linux/Mac
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Change port in `.env`**:
   ```env
   PORT=4000
   ```

### Server crashes on start

**Problem**: Server exits immediately after starting

**Solutions**:

1. **Check logs** for error messages:
   ```bash
   pnpm dev
   # Read the error output
   ```

2. **Common issues**:
   - Missing environment variables
   - Database not running
   - Redis not running
   - Port conflict

3. **Verify `.env` file** has all required variables:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=...
   JWT_ACCESS_SECRET=...
   JWT_REFRESH_SECRET=...
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

### Hot reload not working

**Problem**: Changes not reflected without manual restart

**Solution**:
```bash
# Make sure you're using dev mode
pnpm dev

# Not:
pnpm start  # This doesn't have hot reload
```

## Docker Issues

### Docker containers won't start

**Problem**: `docker-compose up` fails

**Solutions**:

1. **Check Docker is running**:
   ```bash
   docker --version
   docker-compose --version
   ```

2. **View error logs**:
   ```bash
   docker-compose logs
   ```

3. **Clean and rebuild**:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Database container fails

**Problem**: PostgreSQL container exits

**Solutions**:

1. **Check logs**:
   ```bash
   docker-compose logs postgres
   ```

2. **Remove volume and recreate**:
   ```bash
   docker-compose down -v
   docker volume rm social-communication_postgres-data
   docker-compose up -d postgres
   ```

### App container can't connect to database

**Problem**: `getaddrinfo ENOTFOUND postgres`

**Solutions**:

1. **Verify `.env` uses Docker hostname**:
   ```env
   # For Docker, use container name
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/social_communication?schema=public"
   REDIS_HOST=redis
   ```

2. **For local development**:
   ```env
   # For local, use localhost
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_communication?schema=public"
   REDIS_HOST=localhost
   ```

### Permission denied errors

**Problem**: Docker volume permission issues

**Solution**:
```bash
# Linux/Mac
sudo chown -R $USER:$USER .

# Or run Docker as current user
docker-compose up --user $(id -u):$(id -g)
```

## Build & TypeScript Issues

### Build fails with type errors

**Problem**: TypeScript compilation errors

**Solutions**:

1. **Regenerate Prisma client**:
   ```bash
   pnpm prisma:generate
   ```

2. **Clear build cache**:
   ```bash
   rm -rf dist node_modules
   pnpm install
   pnpm build
   ```

3. **Check tsconfig.json** is correct

### Module not found errors

**Problem**: `Cannot find module '@services/...'`

**Solutions**:

1. **Ensure you're using .js extension**:
   ```typescript
   // Correct
   import { UserService } from '@services/UserService.js';

   // Wrong
   import { UserService } from '@services/UserService';
   ```

2. **Check tsconfig.json** has path aliases:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@services/*": ["app/services/*"]
       }
     }
   }
   ```

3. **Rebuild**:
   ```bash
   pnpm build
   ```

### tsc-alias errors

**Problem**: Path aliases not working in build

**Solution**:
```bash
# Make sure tsc-alias runs after tsc
pnpm build
# This runs: tsc && tsc-alias
```

## WebSocket Issues

### WebSocket connection fails

**Problem**: Client can't connect to WebSocket

**Solutions**:

1. **Check JWT token is valid**:
   ```javascript
   const socket = io('http://localhost:3000', {
     auth: {
       token: 'valid-jwt-token-here'
     }
   });
   ```

2. **Check CORS configuration** in `.env`:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

3. **Verify server is running**:
   ```bash
   curl http://localhost:3000/health
   ```

### Events not received

**Problem**: Client emits events but doesn't receive responses

**Solutions**:

1. **Check event names** match server:
   ```javascript
   // Must match CONSTANTS.SOCKET_EVENTS
   socket.emit('message:send', data);
   socket.on('message:received', callback);
   ```

2. **Verify authentication**:
   ```javascript
   socket.on('connect', () => {
     console.log('Connected:', socket.id);
   });

   socket.on('connect_error', (error) => {
     console.error('Connection error:', error);
   });
   ```

3. **Check user is in correct room**:
   - Direct messages: User must be in `user:${userId}` room
   - Group messages: User must be in `group:${groupId}` room

### WebSocket disconnects frequently

**Problem**: Connection drops and reconnects

**Solutions**:

1. **Enable reconnection**:
   ```javascript
   const socket = io('http://localhost:3000', {
     reconnection: true,
     reconnectionAttempts: 5,
     reconnectionDelay: 1000
   });
   ```

2. **Check server resources** (CPU, memory)

3. **Verify Redis is working** (required for WebSocket scaling)

## Authentication Issues

### JWT token expired

**Problem**: `401 Unauthorized - Token expired`

**Solution**:
```javascript
// Use refresh token to get new access token
const response = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    refreshToken: storedRefreshToken
  })
});

const { accessToken, refreshToken } = await response.json();
// Store new tokens
```

### Invalid token

**Problem**: `401 Unauthorized - Invalid token`

**Solutions**:

1. **Check token format**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

2. **Verify JWT secrets** in `.env` match what was used to sign tokens

3. **Clear blacklisted tokens** in Redis:
   ```bash
   redis-cli KEYS "blacklist:*" | xargs redis-cli DEL
   ```

### Password validation fails

**Problem**: Password doesn't meet requirements

**Solution**:
```
Password must:
- Be at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number

Valid example: Password123
```

## Performance Issues

### Slow API responses

**Problems & Solutions**:

1. **Database queries slow**:
   ```bash
   # Check Prisma query performance
   # Enable query logging in .env
   DATABASE_URL="postgresql://...?schema=public&connection_limit=10"
   ```

2. **Redis cache not being used**:
   ```bash
   # Verify Redis is connected
   redis-cli ping

   # Check cache hit rate
   redis-cli INFO stats | grep keyspace
   ```

3. **Too many database connections**:
   ```typescript
   // Check connection pool settings in prisma/schema.prisma
   datasource db {
     url      = env("DATABASE_URL")
     shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
   }
   ```

### High memory usage

**Solutions**:

1. **Check for memory leaks**:
   ```bash
   # Monitor with Node.js
   node --expose-gc --inspect dist/main.js
   ```

2. **Limit connection pools**:
   ```env
   DATABASE_URL="postgresql://...?connection_limit=10"
   ```

3. **Configure Redis memory**:
   ```
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

### Rate limit hit too often

**Problem**: `429 Too Many Requests`

**Solutions**:

1. **Increase rate limits** in `app/middlewares/rateLimit.middleware.ts`

2. **Implement client-side throttling**

3. **Use different API keys** for different clients (if implemented)

## Still Having Issues?

1. **Check logs**:
   ```bash
   # Application logs
   tail -f logs/app.log

   # Docker logs
   docker-compose logs -f
   ```

2. **Enable debug mode**:
   ```env
   NODE_ENV=development
   LOG_LEVEL=debug
   ```

3. **Verify all services are running**:
   ```bash
   # PostgreSQL
   pg_isready -h localhost -p 5432

   # Redis
   redis-cli ping

   # Application
   curl http://localhost:3000/health
   ```

4. **Check GitHub issues**: Search for similar problems

5. **Open a new issue**: Include:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - Relevant logs
