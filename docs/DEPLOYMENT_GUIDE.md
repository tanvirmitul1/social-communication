# Social Communication Backend - Deployment Guide

## Table of Contents
- [Development Setup](#development-setup)
- [Production Deployment (Oracle Cloud)](#production-deployment-oracle-cloud)
- [CI/CD Pipeline](#cicd-pipeline)
- [Update Deployment](#update-deployment)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

---

## Development Setup

### Prerequisites
- Node.js 20+
- pnpm 10+
- Docker Desktop
- Git

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/social-communication.git
cd social-communication
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
```bash
# Copy environment file
cp .env.example .env

# The .env file is already configured for development with:
# - DATABASE_URL pointing to localhost:5432
# - REDIS_HOST pointing to localhost:6379
# - Development JWT secrets
```

### 4. Start Database Services
```bash
# Start PostgreSQL and Redis in Docker
docker compose up postgres redis -d

# Verify services are running
docker compose ps
```

### 5. Database Setup
```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Seed database with test data
pnpm prisma:seed
```

### 6. Start Development Server
```bash
# Start development server with hot reload
pnpm dev

# Server runs at: http://localhost:3000
# API docs at: http://localhost:3000/api/docs
```

### 7. Database Management
```bash
# Open Prisma Studio (GUI for database)
pnpm prisma:studio
# Opens at: http://localhost:5555

# Or use pgAdmin with:
# Host: localhost, Port: 5432
# Username: postgres, Password: 141532
# Database: social_communication
```

---

## Production Deployment (Oracle Cloud)

### Prerequisites
- Oracle Cloud Ubuntu VM with root access
- Domain name (optional)
- GitHub repository

### 1. Server Initial Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm@10.18.2

# Logout and login to apply docker group
exit
```

### 2. Clone and Setup Project
```bash
# Clone repository
git clone https://github.com/yourusername/social-communication.git
cd social-communication

# Install dependencies
pnpm install
```

### 3. Production Environment
```bash
# Copy environment file
cp .env.example .env

# Edit for production
nano .env
```

**Production .env configuration:**
```env
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database (Docker internal network)
DATABASE_URL="postgresql://postgres:your-strong-password@postgres:5432/social_communication?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-strong-password
POSTGRES_DB=social_communication

# Redis (Docker internal network)
REDIS_HOST=redis
REDIS_PORT=6379

# Strong JWT secrets (generate new ones)
JWT_ACCESS_SECRET=your-super-strong-access-secret-key-here
JWT_REFRESH_SECRET=your-super-strong-refresh-secret-key-here

# Production CORS (your domain)
CORS_ORIGINS=http://your-server-ip:3000,https://yourdomain.com

# Production settings
LOG_LEVEL=info
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Update Docker Compose for Production
```bash
# Update docker-compose.yml passwords to match .env
nano docker-compose.yml

# Change postgres password from 141532 to your-strong-password
```

### 5. Build and Deploy
```bash
# Build Docker image
pnpm docker:build

# Start all services
docker compose up -d

# Verify all containers are running
docker compose ps
```

### 6. Database Setup
```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations from host (not inside container)
pnpm prisma:migrate

# Seed database (optional)
pnpm prisma:seed
```

### 7. Firewall Configuration
```bash
# Configure Ubuntu firewall
sudo ufw allow ssh
sudo ufw allow 3000/tcp
sudo ufw enable

# Check firewall status
sudo ufw status
```

### 8. Oracle Cloud Security List
1. Go to **Oracle Cloud Console**
2. **Networking** → **Virtual Cloud Networks**
3. Click your VCN → **Security Lists**
4. Click **Default Security List**
5. **Add Ingress Rules**:
   - Source: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `3000`

### 9. Verify Deployment
```bash
# Test locally on server
curl http://localhost:3000/health

# Test externally (replace with your server IP)
curl http://your-server-ip:3000/health

# Check logs
docker compose logs app
```

---

## CI/CD Pipeline

### Current Status
Your project has **GitHub Actions CI/CD** configured but **manual deployment**:

✅ **Automated Testing**: Runs on every push/PR to `main` and `develop`
✅ **Code Quality**: Linting and formatting checks
✅ **Docker Build**: Validates Docker image builds
❌ **Auto Deployment**: Manual deployment required

### CI/CD Workflow
```yaml
# Triggers on:
- Push to main/develop branches
- Pull requests to main/develop

# Pipeline steps:
1. Lint and format check
2. Run tests with PostgreSQL/Redis
3. Generate Prisma client
4. Build application
5. Build Docker image
```

### View CI/CD Status
- **GitHub Actions**: `https://github.com/yourusername/social-communication/actions`
- **Build Status**: Check green ✅ before deploying

---

## Update Deployment

### Method 1: Quick Update (Recommended)
```bash
# Navigate to project directory
cd ~/project/social-communication

# Pull latest code from GitHub
git pull origin main

# Install any new dependencies
pnpm install

# Generate Prisma client (if schema changed)
pnpm prisma:generate

# Run new migrations (if any)
pnpm prisma:migrate

# Rebuild and restart services
docker compose down
docker compose up --build -d

# Verify deployment
curl http://localhost:3000/health
```

### Method 2: Zero-Downtime Update
```bash
# Pull latest code
git pull origin main
pnpm install

# Build new image with different tag
docker build -t social-communication-backend:new .

# Update docker-compose.yml to use new image
# Then restart
docker compose up -d

# Remove old image after verification
docker image prune -f
```

### Method 3: Complete Rebuild
```bash
# Stop all services
docker compose down

# Pull latest code
git pull origin main
pnpm install

# Remove old images and rebuild
docker system prune -f
pnpm docker:build

# Start services
docker compose up -d

# Run migrations if needed
pnpm prisma:migrate
```

### Automated Update Script
Create `update.sh` for easy updates:
```bash
#!/bin/bash
echo "🔄 Updating Social Communication Backend..."

# Pull latest code
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed"
    exit 1
fi

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Rebuild and restart
docker compose down
docker compose up --build -d

# Verify
sleep 10
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Update successful!"
else
    echo "❌ Update failed - check logs"
    docker compose logs app
fi
```

**Make it executable:**
```bash
chmod +x update.sh
./update.sh
```

### Pre-Update Checklist
- [ ] Check GitHub Actions build status (must be ✅)
- [ ] Backup database: `docker compose exec postgres pg_dump -U postgres social_communication > backup.sql`
- [ ] Note current version: `git log --oneline -1`
- [ ] Verify disk space: `df -h`

### Post-Update Verification
```bash
# Check all services are running
docker compose ps

# Test API endpoints
curl http://localhost:3000/health
curl http://your-server-ip:3000/health

# Check logs for errors
docker compose logs app --tail 50

# Verify database connection
docker compose exec postgres psql -U postgres -d social_communication -c "SELECT COUNT(*) FROM users;"
```

### Rollback (if needed)
```bash
# Find previous commit
git log --oneline -5

# Rollback to previous version
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose down
docker compose up --build -d

# Or restore from backup
docker compose exec postgres psql -U postgres -d social_communication < backup.sql
```

---

## Available Scripts

### Development Scripts
```bash
pnpm dev              # Start development server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server
pnpm test             # Run tests
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
```

### Database Scripts
```bash
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run database migrations
pnpm prisma:studio    # Open Prisma Studio GUI
pnpm prisma:seed      # Seed database with test data
```

### Docker Scripts
```bash
pnpm docker:build     # Build Docker image
pnpm docker:up        # Start Docker containers
pnpm docker:down      # Stop Docker containers
pnpm docker:logs      # View container logs
```

---

## API Endpoints

### Base URLs
- **Development**: `http://localhost:3000`
- **Production**: `http://your-server-ip:3000`

### Health Checks
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe

### API Documentation
- `GET /api/docs` - Swagger UI documentation
- `GET /api/docs/openapi.json` - OpenAPI specification

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Users
- `GET /api/v1/users` - Search users
- `GET /api/v1/users/:id` - Get user by ID

### Messages
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/group/:groupId` - Get group messages

### Groups
- `POST /api/v1/groups` - Create group
- `GET /api/v1/groups` - Get user's groups

---

## Troubleshooting

### Common Development Issues

**1. Prisma Client Import Error**
```bash
# Solution: Generate Prisma client
pnpm prisma:generate
```

**2. Database Connection Error**
```bash
# Check if PostgreSQL container is running
docker compose ps

# Restart database services
docker compose restart postgres redis
```

**3. Port Already in Use**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Common Production Issues

**1. External Access Not Working**
- Check Ubuntu firewall: `sudo ufw status`
- Check Oracle Cloud Security List ingress rules
- Verify correct port in URL: `http://ip:3000/health`

**2. Container Permission Issues**
```bash
# Run Prisma commands from host, not inside container
pnpm prisma:migrate  # ✅ Correct
docker compose exec app pnpm prisma:migrate  # ❌ May fail
```

**3. Database Migration Fails**
```bash
# Check database connection
docker compose exec postgres psql -U postgres -l

# Check environment variables
docker compose exec app env | grep DATABASE_URL
```

### Monitoring Commands

```bash
# View application logs
docker compose logs -f app

# Check container health
docker compose ps

# Monitor resource usage
docker stats

# Restart specific service
docker compose restart app

# Update application
git pull
docker compose up --build -d
```

### Database Management in Production

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d social_communication

# Backup database
docker compose exec postgres pg_dump -U postgres social_communication > backup.sql

# View database with Prisma Studio (development only)
pnpm prisma:studio
```

---

## Security Considerations

### Production Checklist
- [ ] Change default passwords in docker-compose.yml
- [ ] Generate strong JWT secrets
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up proper logging and monitoring
- [ ] Regular security updates
- [ ] Database backups

### Environment Variables Security
- Never commit `.env` files to Git
- Use strong, unique passwords
- Rotate JWT secrets regularly
- Limit CORS origins to your domains only

---

## Maintenance

### Regular Updates
```bash
# Update dependencies
pnpm update

# Rebuild and restart
docker compose down
docker compose up --build -d

# Run new migrations if any
pnpm prisma:migrate
```

### Backup Strategy
```bash
# Database backup
docker compose exec postgres pg_dump -U postgres social_communication > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/social-communication
```

This documentation covers the complete setup process for both development and production environments based on your working configuration.