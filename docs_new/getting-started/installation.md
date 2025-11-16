# Installation Guide

Complete installation instructions for the Social Communication Platform.

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk Space**: 10 GB free space
- **Operating System**: Linux, macOS, or Windows 10+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Disk Space**: 20 GB free space
- **Operating System**: Linux (Ubuntu 20.04+ recommended)

## Prerequisites

### Required Software

1. **Node.js**: Version 18+ or 20+
   ```bash
   # Check version
   node --version
   npm --version
   ```

2. **PostgreSQL**: Version 13+
   ```bash
   # Check version
   psql --version
   ```

3. **Redis**: Version 6+
   ```bash
   # Check version
   redis-server --version
   ```

4. **Package Manager**: pnpm (recommended), npm, or yarn
   ```bash
   # Install pnpm
   npm install -g pnpm
   ```

### Optional Software

1. **Docker**: For containerized deployment
2. **Docker Compose**: For multi-container setup
3. **Git**: For version control

## Installation Methods

### Method 1: Manual Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd social-communication
```

#### 2. Install Dependencies
```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

#### 3. Configure Environment Variables
```bash
# Copy example configuration
cp .env.example .env

# Edit the configuration file
nano .env
```

Key environment variables to configure:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_ACCESS_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `PORT`: Server port (default: 3000)

#### 4. Database Setup

##### Generate Prisma Client
```bash
pnpm prisma:generate
```

##### Run Migrations
```bash
pnpm prisma:migrate
```

##### Seed Database (Optional)
```bash
pnpm prisma:seed
```

#### 5. Start the Application

##### Development Mode
```bash
# Start with hot reload
pnpm dev
```

##### Production Mode
```bash
# Build the application
pnpm build

# Start the built application
pnpm start
```

### Method 2: Docker Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd social-communication
```

#### 2. Configure Environment Variables
```bash
# Copy example configuration
cp .env.example .env.docker

# Edit the Docker configuration file
nano .env.docker
```

#### 3. Start with Docker Compose
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up -d

# Production environment
docker-compose -f docker-compose.prod.yml up -d

# Or default environment
docker-compose up -d
```

#### 4. Run Migrations (if not using init container)
```bash
# Run migrations in the app container
docker-compose exec app pnpm prisma:migrate
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/social_comm

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Database Setup

#### PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (with Homebrew)
   brew install postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database and User**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql

   # Create database
   CREATE DATABASE social_comm;

   # Create user
   CREATE USER social_comm_user WITH ENCRYPTED PASSWORD 'your-password';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE social_comm TO social_comm_user;

   # Exit
   \q
   ```

#### Redis

1. **Install Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install redis-server

   # macOS (with Homebrew)
   brew install redis

   # Windows
   # Download from https://redis.io/download/
   ```

2. **Start Redis**
   ```bash
   # Start Redis server
   redis-server

   # Or start as service
   sudo systemctl start redis
   ```

## Verification

### Check Services

1. **Database Connection**
   ```bash
   # Test PostgreSQL connection
   psql -h localhost -p 5432 -U social_comm_user -d social_comm

   # Test Redis connection
   redis-cli ping
   ```

2. **Application Health Check**
   ```bash
   # Check if server is running
   curl http://localhost:3000/health

   # Check readiness
   curl http://localhost:3000/health/ready
   ```

3. **API Documentation**
   Open `http://localhost:3000/api/docs` in your browser

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Change PORT in .env file
PORT=3001
```

#### 2. Database Connection Failed
```bash
# Check database URL in .env
DATABASE_URL=postgresql://user:password@host:port/database

# Test connection
psql $DATABASE_URL
```

#### 3. Redis Connection Failed
```bash
# Check Redis URL in .env
REDIS_URL=redis://localhost:6379

# Test connection
redis-cli -u $REDIS_URL ping
```

#### 4. Prisma Migration Errors
```bash
# Reset database (development only)
pnpm prisma:migrate:reset

# Or create fresh migration
pnpm prisma:migrate dev --name init
```

### Logs

Check application logs for debugging:
```bash
# Development logs
pnpm dev

# Or check log files if configured
tail -f logs/app.log
```

## Next Steps

After successful installation:

1. **Explore API**: Visit `http://localhost:3000/api/docs`
2. **Run Tests**: `pnpm test`
3. **Review Documentation**: Check the [Complete API Documentation](../API_COMPLETE.md)
4. **Build Frontend**: Use the API documentation to create your frontend