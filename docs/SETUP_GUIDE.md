# Setup Guide

## Quick Start

### Option 1: Docker (Recommended)

1. **Prerequisites**
   - Docker Desktop installed
   - Docker Compose installed

2. **Setup**
   \`\`\`bash
   # Clone and navigate to project
   cd social-communication

   # Copy environment file
   cp .env.example .env

   # Edit .env and set required variables:
   # JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JITSI_APP_ID, JITSI_APP_SECRET

   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f app
   \`\`\`

3. **Access**
   - API: http://localhost:3000
   - Swagger Docs: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/health

### Option 2: Local Development

1. **Prerequisites**
   - Node.js 20+
   - pnpm 8+
   - PostgreSQL 16
   - Redis 7

2. **Install pnpm (if not installed)**
   \`\`\`bash
   npm install -g pnpm
   \`\`\`

3. **Install Dependencies**
   \`\`\`bash
   pnpm install
   \`\`\`

4. **Database Setup**

   Create PostgreSQL database:
   \`\`\`bash
   createdb social_communication
   \`\`\`

   Or using psql:
   \`\`\`sql
   CREATE DATABASE social_communication;
   \`\`\`

5. **Environment Configuration**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit \`.env\` with your configuration:
   \`\`\`env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/social_communication?schema=public"
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_ACCESS_SECRET=your-secret-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   \`\`\`

   **Generate secure secrets:**
   \`\`\`bash
   # On Linux/Mac
   openssl rand -base64 32

   # On Windows (PowerShell)
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   \`\`\`

6. **Database Migration**
   \`\`\`bash
   # Generate Prisma Client
   pnpm prisma:generate

   # Run migrations
   pnpm prisma:migrate

   # Seed database (optional)
   pnpm prisma:seed
   \`\`\`

7. **Start Development Server**
   \`\`\`bash
   pnpm dev
   \`\`\`

## Configuration

### Required Environment Variables

- \`JWT_ACCESS_SECRET\` - Secret for access token signing
- \`JWT_REFRESH_SECRET\` - Secret for refresh token signing
- \`DATABASE_URL\` - PostgreSQL connection string

### Optional Environment Variables

- \`PORT\` - Server port (default: 3000)
- \`NODE_ENV\` - Environment (development/production)
- \`REDIS_HOST\` - Redis host (default: localhost)
- \`REDIS_PORT\` - Redis port (default: 6379)
- \`JITSI_APP_ID\` - Jitsi Meet App ID
- \`JITSI_APP_SECRET\` - Jitsi Meet App Secret
- \`CORS_ORIGINS\` - Allowed CORS origins (comma-separated)

### Jitsi Configuration

For video calling features, you need to configure Jitsi:

1. **Use Public Jitsi Server** (for testing)
   \`\`\`env
   JITSI_DOMAIN=meet.jit.si
   JITSI_APP_ID=
   JITSI_APP_SECRET=
   \`\`\`

2. **Use Self-Hosted Jitsi** (for production)
   - Set up your own Jitsi server
   - Configure JWT authentication
   - Set domain, app ID, and secret in \`.env\`

## Development Workflow

### Running the App

\`\`\`bash
# Development with hot reload
pnpm dev

# Production build
pnpm build
pnpm start
\`\`\`

### Database Operations

\`\`\`bash
# Create migration
pnpm prisma:migrate

# Reset database
pnpm prisma migrate reset

# Open Prisma Studio
pnpm prisma:studio

# Seed database
pnpm prisma:seed
\`\`\`

### Code Quality

\`\`\`bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
\`\`\`

### Testing

\`\`\`bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in UI mode
pnpm test:ui
\`\`\`

## API Testing

### Using cURL

**Register User:**
\`\`\`bash
curl -X POST http://localhost:3000/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
\`\`\`

**Login:**
\`\`\`bash
curl -X POST http://localhost:3000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
\`\`\`

**Get Profile:**
\`\`\`bash
curl -X GET http://localhost:3000/api/v1/auth/profile \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

### Using Swagger UI

1. Navigate to http://localhost:3000/api/docs
2. Click "Authorize" button
3. Enter your JWT token
4. Test endpoints interactively

### Using Postman

1. Import the API collection from Swagger JSON
2. Set up environment variables
3. Use pre-request scripts for token management

## WebSocket Testing

### Using JavaScript Client

\`\`\`javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.emit('message:send', {
  content: 'Hello!',
  receiverId: 'user-id-here'
});

socket.on('message:received', (message) => {
  console.log('New message:', message);
});
\`\`\`

## Production Deployment

### Environment Preparation

1. **Set Production Environment Variables**
   \`\`\`env
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@prod-host:5432/db
   REDIS_HOST=prod-redis-host
   JWT_ACCESS_SECRET=strong-production-secret
   JWT_REFRESH_SECRET=strong-production-refresh-secret
   \`\`\`

2. **Build Application**
   \`\`\`bash
   pnpm build
   \`\`\`

3. **Run Migrations**
   \`\`\`bash
   pnpm prisma:migrate deploy
   \`\`\`

### Docker Deployment

1. **Build Image**
   \`\`\`bash
   docker build -t social-communication-backend .
   \`\`\`

2. **Run Container**
   \`\`\`bash
   docker run -d \\
     -p 3000:3000 \\
     -e DATABASE_URL="postgresql://..." \\
     -e REDIS_HOST="..." \\
     -e JWT_ACCESS_SECRET="..." \\
     -e JWT_REFRESH_SECRET="..." \\
     social-communication-backend
   \`\`\`

3. **Or use Docker Compose**
   \`\`\`bash
   docker-compose -f docker-compose.yml up -d
   \`\`\`

## Troubleshooting

### Database Connection Issues

**Problem**: Can't connect to PostgreSQL

**Solutions**:
- Verify PostgreSQL is running: \`pg_isready\`
- Check DATABASE_URL is correct
- Verify database exists
- Check firewall settings

### Redis Connection Issues

**Problem**: Can't connect to Redis

**Solutions**:
- Verify Redis is running: \`redis-cli ping\`
- Check REDIS_HOST and REDIS_PORT
- Verify Redis password if set
- Check firewall settings

### Port Already in Use

**Problem**: Port 3000 already in use

**Solutions**:
- Change PORT in .env
- Kill process using port: \`lsof -ti:3000 | xargs kill\`

### TypeScript Errors

**Problem**: Type errors during build

**Solutions**:
- Run \`pnpm prisma:generate\` to regenerate Prisma Client
- Delete node_modules and reinstall: \`pnpm install\`
- Clear TypeScript cache: \`rm -rf dist\`

### WebSocket Not Connecting

**Problem**: WebSocket connection fails

**Solutions**:
- Verify JWT token is valid
- Check CORS configuration
- Ensure WebSocket port is accessible
- Check browser console for errors

## Performance Optimization

### Database

- Add indexes for frequently queried columns
- Use connection pooling
- Implement query result caching
- Consider read replicas for scaling

### Caching

- Adjust Redis TTL values based on usage
- Implement cache warming for hot data
- Use cache tags for batch invalidation

### API

- Enable compression
- Implement API response caching
- Use pagination for large datasets
- Optimize database queries

## Monitoring

### Health Checks

\`\`\`bash
# Application health
curl http://localhost:3000/health

# Metrics
curl http://localhost:3000/metrics
\`\`\`

### Logs

\`\`\`bash
# View logs (development)
pnpm dev

# View Docker logs
docker-compose logs -f app

# View production logs
pm2 logs
\`\`\`

## Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS for specific origins
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Regular dependency updates
- [ ] Database backup strategy
- [ ] Implement monitoring/alerting

## Support

For issues and questions:
- Check documentation
- Review error logs
- Open GitHub issue
- Contact support team

## Next Steps

1. Explore API documentation at /api/docs
2. Run tests: \`pnpm test\`
3. Review architecture docs
4. Start building your frontend!
