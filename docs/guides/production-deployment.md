# Production Deployment Guide - Oracle Cloud VM

Complete guide for deploying the Social Communication backend to Oracle Cloud VM.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Oracle Cloud VM Setup](#oracle-cloud-vm-setup)
- [Server Preparation](#server-preparation)
- [Application Deployment](#application-deployment)
- [Security Hardening](#security-hardening)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Backup Strategy](#backup-strategy)

## Prerequisites

### What You Need

1. **Oracle Cloud Account**
   - Free tier is sufficient to start
   - Sign up: https://www.oracle.com/cloud/free/

2. **Domain Name** (recommended)
   - Purchase from: Namecheap, GoDaddy, Cloudflare, etc.
   - Point to your VM's IP address

3. **SSL Certificate** (for HTTPS)
   - Free: Let's Encrypt (recommended)
   - Or use Cloudflare for free SSL

4. **Local Tools**
   - SSH client (Windows: PuTTY or PowerShell, Mac/Linux: built-in)
   - Git
   - Text editor

## Oracle Cloud VM Setup

### Step 1: Create a Compute Instance

1. **Log in to Oracle Cloud Console**
   - Navigate to: Compute → Instances

2. **Create Instance**
   - Click "Create Instance"
   - Name: `social-comm-prod`
   - Image: **Ubuntu 22.04 LTS** (recommended)
   - Shape:
     - Free tier: VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM)
     - Recommended: VM.Standard.E2.1 (1 OCPU, 8GB RAM)
     - Production: VM.Standard.E4.Flex (2-4 OCPUs, 16-32GB RAM)

3. **Networking**
   - VCN: Use default or create new
   - Public IP: Assign a public IPv4 address
   - Download SSH key pair (save it safely!)

4. **Boot Volume**
   - Size: 50-100 GB (free tier allows up to 200GB total)

5. **Create** and wait for instance to provision

### Step 2: Configure Firewall Rules

1. **In Oracle Cloud Console:**
   - Navigate to: Networking → Virtual Cloud Networks
   - Click your VCN → Security Lists → Default Security List

2. **Add Ingress Rules:**

   ```
   Source: 0.0.0.0/0
   Protocol: TCP
   Destination Port: 22 (SSH)
   Description: SSH access

   Source: 0.0.0.0/0
   Protocol: TCP
   Destination Port: 80 (HTTP)
   Description: HTTP

   Source: 0.0.0.0/0
   Protocol: TCP
   Destination Port: 443 (HTTPS)
   Description: HTTPS
   ```

3. **Note:** Don't expose PostgreSQL (5432) or Redis (6379) to the internet!

## Server Preparation

### Step 1: Connect to Your VM

```bash
# Windows (PowerShell) or Linux/Mac
ssh -i path/to/your-key.pem ubuntu@YOUR_VM_IP

# Example:
ssh -i ~/Downloads/ssh-key.pem ubuntu@129.159.xxx.xxx
```

### Step 2: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (no need for sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
# Then reconnect via SSH
```

### Step 4: Configure Ubuntu Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT: do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status

# Should show:
# 22/tcp     ALLOW       Anywhere
# 80/tcp     ALLOW       Anywhere
# 443/tcp    ALLOW       Anywhere
```

### Step 5: Install Git and Tools

```bash
sudo apt install -y git curl wget htop nano
```

### Step 6: Create App Directory

```bash
# Create directory
sudo mkdir -p /opt/social-communication
sudo chown $USER:$USER /opt/social-communication
cd /opt/social-communication
```

## Application Deployment

### Step 1: Clone Repository

```bash
cd /opt/social-communication
git clone <your-repository-url> .

# Or if private repo:
git clone https://YOUR_TOKEN@github.com/username/repo.git .
```

### Step 2: Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 64  # Use for JWT_ACCESS_SECRET
openssl rand -base64 64  # Use for JWT_REFRESH_SECRET

# Generate database password
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32
```

**IMPORTANT:** Save these secrets securely!

### Step 3: Create Production Environment File

```bash
# Create .env file
nano .env

# Or copy from template
cp .env.production.example .env
nano .env
```

Add this configuration:

```env
# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DB_USER=postgres
DB_PASSWORD=PASTE_YOUR_GENERATED_DB_PASSWORD_HERE
DB_NAME=social_communication
DATABASE_URL="postgresql://postgres:PASTE_DB_PASSWORD@postgres:5432/social_communication?schema=public&connection_limit=10"

# Redis
REDIS_PASSWORD=PASTE_YOUR_GENERATED_REDIS_PASSWORD_HERE

# JWT Secrets
JWT_ACCESS_SECRET=PASTE_YOUR_GENERATED_JWT_ACCESS_SECRET_HERE
JWT_REFRESH_SECRET=PASTE_YOUR_GENERATED_JWT_REFRESH_SECRET_HERE
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Jitsi (optional)
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=
JITSI_APP_SECRET=
JITSI_ROOM_PREFIX=social-comm-

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs

# Monitoring
SENTRY_DSN=
METRICS_ENABLED=true
```

**Save:** Ctrl+O, Enter, Ctrl+X

### Step 4: Create Production Environment File for Docker

```bash
# Create .env.prod for docker-compose
nano .env.prod
```

Add:

```env
DB_USER=postgres
DB_PASSWORD=PASTE_YOUR_DB_PASSWORD_HERE
DB_NAME=social_communication
REDIS_PASSWORD=PASTE_YOUR_REDIS_PASSWORD_HERE
JWT_ACCESS_SECRET=PASTE_YOUR_JWT_ACCESS_SECRET_HERE
JWT_REFRESH_SECRET=PASTE_YOUR_JWT_REFRESH_SECRET_HERE
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info
SENTRY_DSN=
```

### Step 5: Deploy with Docker Compose

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Wait for all services to be healthy
docker-compose -f docker-compose.prod.yml ps
```

### Step 6: Run Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec app pnpm prisma migrate deploy

# (Optional) Seed database
docker-compose -f docker-compose.prod.yml exec app pnpm prisma:seed
```

### Step 7: Verify Deployment

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"ok",...}

# Test from external IP
curl http://YOUR_VM_IP:3000/health
```

## Security Hardening

### Step 1: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/social-comm
```

Add this configuration:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (update paths after getting certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client upload size
    client_max_body_size 10M;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/social-comm /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# DON'T restart yet - we need SSL certificates first
```

### Step 2: Get SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Create directory for Let's Encrypt verification
sudo mkdir -p /var/www/certbot

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Certificate will be auto-configured
```

Auto-renewal is set up automatically. Test it:

```bash
sudo certbot renew --dry-run
```

### Step 3: Restart Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 4: Set Up Automatic Container Restart

```bash
# Create systemd service
sudo nano /etc/systemd/system/social-comm.service
```

Add:

```ini
[Unit]
Description=Social Communication App
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/social-communication
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable social-comm
sudo systemctl start social-comm
```

## Monitoring & Maintenance

### View Logs

```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f app

# All services
docker-compose -f docker-compose.prod.yml logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitor Resources

```bash
# System resources
htop

# Docker resources
docker stats

# Disk usage
df -h

# Check service status
docker-compose -f docker-compose.prod.yml ps
sudo systemctl status social-comm
sudo systemctl status nginx
```

### Update Application

```bash
cd /opt/social-communication

# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec app pnpm prisma migrate deploy

# Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## Backup Strategy

### Database Backups

Create backup script:

```bash
# Create backup script
nano /opt/social-communication/backup-db.sh
```

Add:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/social-communication/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f /opt/social-communication/docker-compose.prod.yml exec -T postgres \
    pg_dump -U postgres social_communication > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make executable:

```bash
chmod +x /opt/social-communication/backup-db.sh
```

Schedule daily backups:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /opt/social-communication/backup-db.sh >> /opt/social-communication/backup.log 2>&1
```

### Restore from Backup

```bash
# List backups
ls -lh /opt/social-communication/backups/

# Restore backup
gunzip < /opt/social-communication/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
    docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U postgres -d social_communication
```

## Troubleshooting

See the main [Troubleshooting Guide](./troubleshooting.md) for common issues.

### Production-Specific Issues

**Can't access from domain:**

- Check DNS settings (may take 24-48 hours to propagate)
- Verify Nginx configuration: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

**SSL certificate issues:**

- Renew manually: `sudo certbot renew`
- Check expiry: `sudo certbot certificates`

**Out of memory:**

- Check with: `free -h`
- Increase VM memory or optimize Docker resource limits

**High CPU usage:**

- Check with: `htop`
- Review application logs for issues
- Consider scaling up VM or optimizing code

## Next Steps

- Set up monitoring (e.g., UptimeRobot, New Relic)
- Configure log aggregation (e.g., Papertrail, Loggly)
- Set up error tracking (Sentry)
- Implement CI/CD pipeline
- Scale horizontally with load balancer if needed

## Security Checklist

- [ ] Strong passwords for all services
- [ ] SSH key-based authentication only
- [ ] Firewall configured (UFW)
- [ ] SSL/TLS enabled (HTTPS)
- [ ] Security headers configured
- [ ] Regular backups automated
- [ ] Monitoring and alerting set up
- [ ] Log rotation configured
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Review logs regularly for suspicious activity
