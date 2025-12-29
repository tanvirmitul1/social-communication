# Production Deployment on Oracle Cloud (Docker)

Simple step-by-step guide to deploy on Oracle Cloud Ubuntu server.

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
# Copy production template
cp .env.production .env

# Edit the file
nano .env
```

**Update these critical values:**

```bash
# Line 1: Set to production
NODE_ENV=production

# Line 11-12: Set a strong password
POSTGRES_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD

# Line 9: Update DATABASE_URL with same password
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@postgres:5432/social_communication?schema=public"
#                                    ^^^^^^^^^^^
#                                    Must match POSTGRES_PASSWORD

# Line 22-23: Generate secure secrets (see below)
JWT_ACCESS_SECRET=PASTE_GENERATED_SECRET_1
JWT_REFRESH_SECRET=PASTE_GENERATED_SECRET_2

# Line 28: Add your server IP/domain
CORS_ORIGINS=http://YOUR_SERVER_IP,https://yourdomain.com
```

**Generate JWT Secrets:**

```bash
# Run these commands to generate secrets
openssl rand -base64 64
openssl rand -base64 64

# Copy the output and paste into .env file
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Step 3: Verify .env File

```bash
# Double-check these match
cat .env | grep POSTGRES_PASSWORD
cat .env | grep DATABASE_URL

# Make sure the password in both lines is the same!
```

### Step 4: Create Required Directories

```bash
mkdir -p uploads logs logs/nginx backups
```

### Step 5: Start All Services

```bash
# Start everything
docker compose up -d

# View logs to check progress
docker compose logs -f
```

Wait 1-2 minutes for all services to start.

### Step 6: Verify Deployment

```bash
# Check all containers are running
docker compose ps

# Should see 4 containers: postgres, redis, app, nginx
# All should show "Up" and "(healthy)"

# Test health endpoint
curl http://localhost/health

# You should see: {"status":"ok"}
```

### Step 7: Access Your Application

Open browser and visit:

- **Health**: `http://YOUR_SERVER_IP/health`
- **API Docs**: `http://YOUR_SERVER_IP/api/docs`
- **API**: `http://YOUR_SERVER_IP/api/v1`

---

## Part 3: Common Operations

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f nginx
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart app
```

### Stop Services

```bash
docker compose down
```

### Update Application (After Code Changes)

```bash
# Pull latest code
git pull

# Rebuild and restart app
docker compose up -d --build app

# Check logs
docker compose logs -f app
```

### Backup Database

```bash
# Create backup
docker compose exec -T postgres pg_dump -U postgres social_communication > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20250129.sql | docker compose exec -T postgres psql -U postgres -d social_communication
```

---

## Troubleshooting

### Issue: Can't connect to application

```bash
# Check container status
docker compose ps

# Check logs for errors
docker compose logs app

# Verify firewall
sudo ufw status
```

### Issue: Password authentication failed

```bash
# This means .env passwords don't match
# Fix: Edit .env and make sure POSTGRES_PASSWORD and DATABASE_URL have same password

nano .env

# Then restart
docker compose down
docker compose up -d
```

### Issue: Redis connection failed

```bash
# Check Redis is running
docker compose ps redis

# Make sure .env has:
# REDIS_HOST=redis (not localhost)

# Restart app
docker compose restart app
```

### Nuclear Option: Fresh Start

```bash
# Stop everything
docker compose down -v

# Remove all Docker data
docker system prune -a

# Start fresh
docker compose up -d
```

---

## Security Checklist

- ✅ Changed `POSTGRES_PASSWORD` from default
- ✅ Generated secure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- ✅ Set proper `CORS_ORIGINS` (not `*`)
- ✅ Opened ports 80, 443, 3000 in Oracle Cloud Security Lists
- ✅ Enabled Ubuntu firewall (`sudo ufw enable`)
- ✅ Using Docker (isolated environment)

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

## Your Application URLs

After successful deployment:

- **API**: `http://YOUR_SERVER_IP/api/v1`
- **Docs**: `http://YOUR_SERVER_IP/api/docs`
- **Health**: `http://YOUR_SERVER_IP/health`
- **WebSocket**: `ws://YOUR_SERVER_IP`

Replace `YOUR_SERVER_IP` with your actual Oracle Cloud server IP address.

---

## Need Help?

1. Check logs: `docker compose logs -f`
2. Check container status: `docker compose ps`
3. Verify `.env` file: `cat .env`
4. Check firewall: `sudo ufw status`
