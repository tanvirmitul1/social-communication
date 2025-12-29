# Production Deployment on Oracle Cloud

Step-by-step guide to deploy the application on Oracle Cloud Ubuntu server using Docker.

**Note**: This deployment uses Docker for all services (App, PostgreSQL, Redis, Nginx), ensuring consistency with the development environment.

---

## Part 1: Prepare Oracle Cloud Server (One-Time Setup)

### Step 1: Open Firewall Ports in Oracle Cloud Console

1. Login to Oracle Cloud Console
2. Go to **Networking** → **Virtual Cloud Networks**
3. Click your VCN → **Security Lists** → **Default Security List**
4. Click **Add Ingress Rules** and add these:

| Port | Description |
|------|-------------|
| 80   | HTTP        |
| 443  | HTTPS       |
| 3000 | Application |

**Source CIDR**: `0.0.0.0/0` for all of them

### Step 2: SSH into Your Server

```bash
ssh ubuntu@YOUR_SERVER_IP
```

### Step 3: Install Docker (First Time Only)

```bash
# Quick install
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker compose version
```

### Step 4: Configure Ubuntu Firewall

```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # App

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Part 2: Deploy Application

### Step 1: Upload Project to Server

**From your local machine:**

```bash
# Compress project
tar -czf social-communication.tar.gz social-communication-backend/

# Upload to server
scp social-communication.tar.gz ubuntu@YOUR_SERVER_IP:~/

# SSH into server
ssh ubuntu@YOUR_SERVER_IP

# Extract
cd ~
tar -xzf social-communication.tar.gz
cd social-communication-backend
```

**OR use Git:**

```bash
# On the server
cd ~
git clone <your-repo-url> social-communication-backend
cd social-communication-backend
```

### Step 2: Create Production Environment File

```bash
# Option 1: If you have .env.production template
cp .env.production .env

# Option 2: If you don't have the template
cp .env.example .env

# Edit the file
nano .env
```

**Update these critical values:**

```bash
# 1. Set environment to production
NODE_ENV=production

# 2. Set a strong database password
POSTGRES_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD

# 3. Update DATABASE_URL with the SAME password
DATABASE_URL="postgresql://postgres:YOUR_STRONG_PASSWORD@postgres:5432/social_communication?schema=public"
#                                    ^^^^^^^^^^^^^^^^^^^^
#                                    Must match POSTGRES_PASSWORD above

# 4. Generate and set secure JWT secrets (see commands below)
JWT_ACCESS_SECRET=PASTE_GENERATED_SECRET_1_HERE
JWT_REFRESH_SECRET=PASTE_GENERATED_SECRET_2_HERE

# 5. Set CORS origins (your server IP or domain)
CORS_ORIGINS=http://YOUR_SERVER_IP,https://yourdomain.com

# 6. Configure Jitsi (if using video calls)
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=your-jitsi-app-id
JITSI_APP_SECRET=your-jitsi-app-secret

# 7. Set stronger bcrypt rounds for production
BCRYPT_ROUNDS=12

# 8. Set production log level
LOG_LEVEL=info
```

**Generate JWT Secrets:**

```bash
# Run these commands to generate strong random secrets
openssl rand -base64 64
openssl rand -base64 64

# Copy each output and paste into JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
```

**Save and exit** (Press `Ctrl+X`, then `Y`, then `Enter`)

### Step 3: Verify .env File

```bash
# Double-check database passwords match
grep POSTGRES_PASSWORD .env
grep DATABASE_URL .env

# Verify JWT secrets are not default values
grep JWT_ACCESS_SECRET .env
grep JWT_REFRESH_SECRET .env

# Check CORS is set to your domain (not *)
grep CORS_ORIGINS .env
```

### Step 4: Create Required Directories

```bash
mkdir -p uploads logs logs/nginx backups
```

### Step 5: Start All Services

```bash
# Start all services (Postgres, Redis, App, Nginx)
docker compose up -d

# View logs to monitor startup
docker compose logs -f
```

**Wait 1-2 minutes** for all services to initialize. You should see:
- PostgreSQL initializing database
- Redis starting cache server
- App connecting to database and Redis
- Nginx starting reverse proxy

Press `Ctrl+C` to exit log view (containers keep running).

### Step 6: Verify Deployment

```bash
# Check all containers are running and healthy
docker compose ps

# Expected output:
# NAME                   STATUS
# social-comm-app        Up (healthy)
# social-comm-postgres   Up (healthy)
# social-comm-redis      Up (healthy)
# social-comm-nginx      Up (healthy)

# Test health endpoint locally on the server
curl http://localhost/health

# Expected output: {"status":"ok"}

# Check app logs for any errors
docker compose logs app --tail=50
```

### Step 7: Access Your Application

From your local computer, open a browser and visit:

- **Health Check**: `http://YOUR_SERVER_IP/health`
- **API Documentation**: `http://YOUR_SERVER_IP/api/docs`
- **API Base URL**: `http://YOUR_SERVER_IP/api/v1`
- **WebSocket**: `ws://YOUR_SERVER_IP`

Replace `YOUR_SERVER_IP` with your Oracle Cloud instance's public IP address.

**Example**: If your server IP is `123.45.67.89`:
- Health: http://123.45.67.89/health
- Docs: http://123.45.67.89/api/docs

---

## Part 3: Common Operations

### View Logs

```bash
# View all service logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx
docker compose logs -f redis

# View last 100 lines of app logs
docker compose logs app --tail=100

# Save logs to file
docker compose logs app > app-logs.txt
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service (e.g., after code changes)
docker compose restart app

# Restart with rebuild (after code changes)
docker compose up -d --build app
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose down

# Stop all services and remove volumes (deletes all data!)
docker compose down -v
```

### Update Application (After Code Changes)

```bash
# Method 1: Git pull (recommended)
git pull origin main
docker compose up -d --build app
docker compose logs -f app

# Method 2: Manual file upload
# Upload files via SCP, then:
docker compose up -d --build app

# Verify new version is running
docker compose ps app
docker compose logs app --tail=20
```

### Database Operations

#### Backup Database

```bash
# Create timestamped backup
docker compose exec -T postgres pg_dump -U postgres social_communication > backup_$(date +%Y%m%d_%H%M%S).sql

# Create backup with custom name
docker compose exec -T postgres pg_dump -U postgres social_communication > backup_before_migration.sql

# Verify backup file
ls -lh backup_*.sql
```

#### Restore Database

```bash
# Restore from backup file
cat backup_20250129_143022.sql | docker compose exec -T postgres psql -U postgres -d social_communication

# Alternative method
docker compose exec -T postgres psql -U postgres -d social_communication < backup_20250129_143022.sql
```

#### Run Migrations

```bash
# Run database migrations
docker compose exec app pnpm prisma:migrate:deploy

# Generate Prisma client (after schema changes)
docker compose exec app pnpm prisma:generate

# Seed database with test data
docker compose exec app pnpm prisma:seed
```

### Monitor Resources

```bash
# Check Docker resource usage
docker stats

# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a
```

---

## Troubleshooting

### Issue: Can't connect to application from browser

**Symptoms**: Cannot access http://YOUR_SERVER_IP/health

**Solutions**:

```bash
# 1. Check if containers are running
docker compose ps
# All should show "Up" and "(healthy)"

# 2. Check if app is listening
curl http://localhost/health
# Should return: {"status":"ok"}

# 3. Check Oracle Cloud Security List
# Make sure ports 80, 443 are open in Oracle Cloud Console
# Networking → VCN → Security Lists → Ingress Rules

# 4. Check Ubuntu firewall
sudo ufw status
# Port 80/tcp should be ALLOW

# 5. Check nginx logs
docker compose logs nginx --tail=50

# 6. Check app logs
docker compose logs app --tail=50
```

### Issue: Password authentication failed

**Symptoms**: App logs show "password authentication failed for user postgres"

**Cause**: Mismatch between `POSTGRES_PASSWORD` and password in `DATABASE_URL`

**Solution**:

```bash
# 1. Check current values
grep POSTGRES_PASSWORD .env
grep DATABASE_URL .env

# 2. Edit .env and make passwords match
nano .env

# Example:
# POSTGRES_PASSWORD=MyStrongPassword123
# DATABASE_URL=postgresql://postgres:MyStrongPassword123@postgres:5432/...
#                                     ^^^^^^^^^^^^^^^^^^^ same password

# 3. Restart services
docker compose down
docker compose up -d

# 4. Verify connection
docker compose logs app | grep -i "database"
```

### Issue: Redis connection failed

**Symptoms**: App logs show "Error connecting to Redis" or "ECONNREFUSED"

**Solutions**:

```bash
# 1. Check Redis is running
docker compose ps redis
# Should show "Up (healthy)"

# 2. Check REDIS_HOST in .env
grep REDIS_HOST .env
# Should be: REDIS_HOST=redis (not localhost!)

# 3. Test Redis connection
docker compose exec app sh
# Inside container:
nc -zv redis 6379
# Should show: redis [redis:6379] open

# 4. Check Redis logs
docker compose logs redis --tail=50

# 5. Restart app
docker compose restart app
```

### Issue: Container keeps restarting

**Symptoms**: `docker compose ps` shows container restarting repeatedly

**Solutions**:

```bash
# 1. Check logs for the crashing container
docker compose logs app --tail=100

# 2. Common causes:
# - Missing .env file → Create it from .env.example
# - Invalid DATABASE_URL → Check format and password
# - Port conflict → Check if port 3000 is already in use
# - Missing Prisma client → Run: docker compose exec app pnpm prisma:generate

# 3. Check container health
docker inspect social-comm-app | grep -A 10 Health

# 4. Try running app manually to see error
docker compose run --rm app sh
# Inside container:
pnpm start
```

### Issue: Database migrations fail

**Symptoms**: Error running `pnpm prisma:migrate:deploy`

**Solutions**:

```bash
# 1. Check if database is accessible
docker compose exec postgres psql -U postgres -d social_communication -c "SELECT 1;"

# 2. Check if migrations folder exists
ls -la prisma/migrations/

# 3. Reset migrations (WARNING: deletes data)
docker compose exec app pnpm prisma:migrate:reset

# 4. Or force deploy migrations
docker compose exec app pnpm prisma:migrate:deploy --force
```

### Issue: Out of disk space

**Symptoms**: "No space left on device"

**Solutions**:

```bash
# 1. Check disk usage
df -h

# 2. Check Docker disk usage
docker system df

# 3. Clean up Docker resources
docker system prune -a
# WARNING: This removes all unused containers, images, networks

# 4. Clean old logs
sudo truncate -s 0 logs/*.log

# 5. Remove old backups
rm backup_*.sql
```

### Nuclear Option: Complete Reset

**WARNING**: This deletes ALL data (database, uploads, logs, containers)

```bash
# 1. Stop all containers
docker compose down -v

# 2. Remove all Docker data
docker system prune -a --volumes

# 3. Remove application data
rm -rf uploads/* logs/*.log

# 4. Start fresh
docker compose up -d

# 5. Run migrations
docker compose exec app pnpm prisma:migrate:deploy

# 6. Optionally seed data
docker compose exec app pnpm prisma:seed
```

---

## Security Checklist

Before going live, verify these security measures:

### Environment Variables
- ✅ Changed `POSTGRES_PASSWORD` from default to strong password (16+ characters)
- ✅ Generated secure `JWT_ACCESS_SECRET` using `openssl rand -base64 64`
- ✅ Generated secure `JWT_REFRESH_SECRET` using `openssl rand -base64 64`
- ✅ Set `BCRYPT_ROUNDS=12` for production (not 10)
- ✅ Set proper `CORS_ORIGINS` (specific domains, not `*`)
- ✅ Set `NODE_ENV=production`
- ✅ Set `LOG_LEVEL=info` (not debug)

### Network Security
- ✅ Opened ports 80, 443 in Oracle Cloud Security Lists
- ✅ Enabled Ubuntu firewall: `sudo ufw enable`
- ✅ UFW rules set for ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- ✅ Changed default SSH port (optional but recommended)

### Application Security
- ✅ Using Docker (isolated containers)
- ✅ App runs as non-root user inside container
- ✅ Database not exposed to internet (only internal Docker network)
- ✅ Redis not exposed to internet (only internal Docker network)
- ✅ Nginx reverse proxy in front of app
- ✅ Rate limiting enabled in application

### Optional but Recommended
- ⬜ Set up HTTPS with SSL certificate (Let's Encrypt)
- ⬜ Configure automated database backups
- ⬜ Set up monitoring (e.g., Uptime Robot, Prometheus)
- ⬜ Configure log rotation
- ⬜ Set up fail2ban for SSH protection
- ⬜ Use a custom domain instead of IP address

---

## Quick Reference

| Task | Command |
|------|---------|
| Start all services | `docker compose up -d` |
| Stop all services | `docker compose down` |
| View logs | `docker compose logs -f` |
| Restart app | `docker compose restart app` |
| Check status | `docker compose ps` |
| Update app | `docker compose up -d --build app` |
| Backup database | `docker compose exec -T postgres pg_dump -U postgres social_communication > backup.sql` |

---

## Environment Comparison

Understanding the difference between development and production setups:

| Aspect | Development | Production |
|--------|-------------|------------|
| Config file | `docker-compose.dev.yml` | `docker-compose.yml` |
| App port | 3000 (direct) | 3000 → 80 (via Nginx) |
| Source code | Volume mounted (hot reload) | Built into image (dist/) |
| Log level | debug | info |
| Bcrypt rounds | 10 (faster) | 12 (more secure) |
| Nginx | Optional | Required (reverse proxy) |
| Secrets | Can use defaults | Must use strong secrets |
| SSL/HTTPS | Not required | Recommended |
| pgAdmin | Included | Not included |

**Key difference**: Development environment mounts your source code for hot reload. Production builds and bundles the app into the Docker image.

---

## Your Application URLs

After successful deployment:

- **API Base**: `http://YOUR_SERVER_IP/api/v1`
- **API Documentation**: `http://YOUR_SERVER_IP/api/docs`
- **Health Check**: `http://YOUR_SERVER_IP/health`
- **WebSocket**: `ws://YOUR_SERVER_IP`

Replace `YOUR_SERVER_IP` with your actual Oracle Cloud server public IP address.

**Example**: If your IP is `123.45.67.89`:
- Health: http://123.45.67.89/health
- Docs: http://123.45.67.89/api/docs
- API: http://123.45.67.89/api/v1/auth/register

---

## Post-Deployment Checklist

After deployment, verify everything works:

```bash
# 1. Check all containers are healthy
docker compose ps

# 2. Test health endpoint
curl http://localhost/health

# 3. Test from your computer (replace with your IP)
curl http://YOUR_SERVER_IP/health

# 4. Check logs for errors
docker compose logs app --tail=50 | grep -i error

# 5. Verify database connection
docker compose exec app sh
# Inside container:
npx prisma db pull
exit

# 6. Test WebSocket connection (use browser console)
# const socket = io('http://YOUR_SERVER_IP');
# socket.on('connect', () => console.log('Connected!'));

# 7. Create a test user via API docs
# Visit: http://YOUR_SERVER_IP/api/docs
# Try POST /api/v1/auth/register
```

---

## Automated Deployment Script

Create a deployment script for easier updates:

```bash
# Create deploy.sh
nano deploy.sh
```

Add this content:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Build new image
echo "🔨 Building Docker image..."
docker compose build app

# Restart app with zero downtime
echo "🔄 Restarting application..."
docker compose up -d app

# Wait for health check
echo "⏳ Waiting for app to be healthy..."
sleep 10

# Verify deployment
echo "✅ Checking health..."
curl -f http://localhost/health || exit 1

echo "✅ Deployment complete!"
docker compose ps
```

Make it executable:

```bash
chmod +x deploy.sh
```

Use it:

```bash
./deploy.sh
```

---

## Need Help?

**Before asking for help, gather this information:**

```bash
# 1. Container status
docker compose ps

# 2. Recent app logs
docker compose logs app --tail=100

# 3. Environment file (hide secrets!)
cat .env | grep -v SECRET | grep -v PASSWORD

# 4. Firewall status
sudo ufw status

# 5. Disk space
df -h

# 6. Docker info
docker system df
```

**Common issues checklist:**
1. ✅ All containers showing "Up (healthy)"?
2. ✅ Can curl http://localhost/health on the server?
3. ✅ Ports 80/443 open in Oracle Cloud Security Lists?
4. ✅ Firewall allows port 80: `sudo ufw status`?
5. ✅ .env passwords match between POSTGRES_PASSWORD and DATABASE_URL?
6. ✅ Enough disk space: `df -h`?

**Additional Resources:**
- Development setup: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- Docker workflow: [docs/development/docker-workflow.md](docs/development/docker-workflow.md)
- Developer guide: [CLAUDE.md](CLAUDE.md)
