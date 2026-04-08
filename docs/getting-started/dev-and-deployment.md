# Development & Deployment Guide

Two clean approaches — one for local development, one for production on a server.

---

## Part 1 — Local Development

### How it works

Your TypeScript code runs directly on your machine with instant hot reload.
Only the database (PostgreSQL) and cache (Redis) run in Docker.

```
Your Machine                     Docker
────────────────                 ──────────────────────────
pnpm dev (Node.js + tsx)   →     PostgreSQL :5432
  ↕ connects to                  Redis      :6379
                                 pgAdmin    :5050
```

---

### First-time setup

**Prerequisites:** Node.js 20+, pnpm 10+, Docker Desktop

```bash
# 1. Clone and enter the project
git clone <your-repo-url>
cd social-communication-backend

# 2. Install dependencies
pnpm install

# 3. Copy the dev environment file
cp .env.example .env
# Edit .env and fill in your real values (Cloudinary, Firebase, JWT secrets, etc.)
# DATABASE_URL and REDIS_HOST should point to localhost for local dev

# 4. Start PostgreSQL + Redis + pgAdmin in Docker
docker compose -f docker-compose.dev.yml up postgres redis pgadmin -d

# 5. Generate Prisma client
pnpm prisma:generate

# 6. Run database migrations (creates all tables)
pnpm prisma:migrate

# 7. (Optional) Seed the database with test data
pnpm prisma:seed

# 8. Start the development server
pnpm dev
```

Server is now running at **http://localhost:3000**

---

### .env for local development

Key values that must match for local dev:

```env
NODE_ENV=development
PORT=3000

# Postgres running in Docker, accessible on localhost
DATABASE_URL="postgresql://postgres:141532@localhost:5432/social_communication?schema=public"

# Redis running in Docker, accessible on localhost
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Generate strong secrets (run: openssl rand -base64 64)
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cloudinary (optional — upload features disabled if empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Firebase (optional — push notifications disabled if empty)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Jitsi (video calls)
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=your-app-id
JITSI_APP_SECRET=your-app-secret
```

---

### Daily development workflow

```bash
# Start Docker services (if not already running)
docker compose -f docker-compose.dev.yml up postgres redis pgadmin -d

# Start the server
pnpm dev
```

That's it. Edit any `.ts` file → server restarts automatically in ~1 second.

---

### Viewing the database

You have two options — use whichever you prefer:

**Option 1 — Prisma Studio** (recommended, knows your schema)
```bash
pnpm prisma:studio
# Opens at http://localhost:5555
# Browse tables, edit rows, follow relations — all in the browser
```

**Option 2 — pgAdmin** (already running in Docker)
```
URL:      http://localhost:5050
Email:    admin@localhost.com
Password: admin
```
Add a server in pgAdmin:
- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `141532`
- Database: `social_communication`

---

### Changing the database schema

```bash
# 1. Edit prisma/schema.prisma

# 2. Create and apply the migration
pnpm prisma:migrate
# Prisma will prompt you to name the migration (e.g. "add_user_bio_field")
# This also regenerates the Prisma client automatically

# If you only need to regenerate the client without a migration:
pnpm prisma:generate
```

---

### All development commands

```bash
pnpm dev                  # Start server with hot reload
pnpm dev:watch            # Alternative: tsx watch (slightly faster)
pnpm prisma:studio        # Open database GUI at :5555
pnpm prisma:migrate       # Apply schema changes + regenerate client
pnpm prisma:generate      # Regenerate Prisma client only
pnpm prisma:seed          # Seed test data
pnpm prisma:reset         # ⚠️  Drop + recreate database (dev only)
pnpm lint                 # Check for TypeScript + ESLint errors
pnpm lint:fix             # Auto-fix lint errors
pnpm format               # Format all files with Prettier
pnpm build                # Verify production build compiles (no errors)
pnpm test                 # Run all tests
pnpm test:coverage        # Run tests with coverage report
```

---

### What's running in development

| Service | URL | Notes |
|---|---|---|
| API | http://localhost:3000 | Your Express server |
| Swagger Docs | http://localhost:3000/api/docs | Interactive API reference |
| Health Check | http://localhost:3000/health | Server + DB + Redis status |
| Prisma Studio | http://localhost:5555 | Run `pnpm prisma:studio` first |
| pgAdmin | http://localhost:5050 | Always on (Docker) |
| PostgreSQL | localhost:5432 | Docker container |
| Redis | localhost:6379 | Docker container |

---

### Stopping everything

```bash
# Stop the Node server
Ctrl + C

# Stop Docker services
docker compose -f docker-compose.dev.yml down

# Stop Docker AND delete all data (full reset)
docker compose -f docker-compose.dev.yml down -v
```

---

---

## Part 2 — Production Deployment (VPS Server)

### How it works

Everything runs inside Docker on the server. Your TypeScript is compiled to JavaScript first, then packaged into a Docker image. Nginx sits in front and handles HTTPS.

```
Internet
   ↓
Nginx (port 80/443, SSL, reverse proxy)
   ↓
Docker: Node.js app (compiled JS, port 3000)
   ↓
Docker: PostgreSQL + Redis (internal network only)
```

---

### Server requirements

- Ubuntu 22.04 LTS (recommended)
- Minimum: 2 vCPU, 2 GB RAM (Hetzner CX22 ~$5/mo or DigitalOcean Basic)
- Docker + Docker Compose installed
- A domain name pointing to your server's IP

---

### One-time server setup

SSH into your server and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin (included with modern Docker)
docker compose version   # should print a version

# Install Nginx
sudo apt install nginx -y

# Install Certbot for free SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y
```

---

### Deploy the application

```bash
# 1. Clone your repo on the server
git clone <your-repo-url> /opt/social-comm
cd /opt/social-comm

# 2. Create the production env file
cp .env.example .env.prod
nano .env.prod   # fill in all real production values (see section below)

# 3. Create required directories
mkdir -p uploads logs backups

# 4. Build and start all services
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 5. Run database migrations
docker exec social-comm-app-prod pnpm prisma:migrate:deploy

# 6. (Optional) Seed initial data
docker exec social-comm-app-prod pnpm prisma:seed
```

Your API is now running at **http://your-server-ip:3000**

---

### .env.prod for production

```env
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database — used by both Docker Compose and the app
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_strong_password_123!
DB_NAME=social_communication

# Redis — must set a password in production
REDIS_PASSWORD=CHANGE_THIS_redis_password_456!

# JWT — generate with: openssl rand -base64 64
JWT_ACCESS_SECRET=CHANGE_THIS_very_long_random_string_for_access
JWT_REFRESH_SECRET=CHANGE_THIS_very_long_random_string_for_refresh
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS — your frontend domain(s)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Jitsi
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=your-jitsi-app-id
JITSI_APP_SECRET=your-jitsi-app-secret
JITSI_ROOM_PREFIX=social-comm-

# Security
BCRYPT_ROUNDS=12
```

---

### Configure Nginx as reverse proxy

```bash
sudo nano /etc/nginx/sites-available/social-comm
```

Paste this config (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Proxy all HTTP traffic to the Node app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Required for WebSockets (Socket.IO)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Pass real client info to the app
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/social-comm /etc/nginx/sites-enabled/
sudo nginx -t          # test config — should say "ok"
sudo systemctl reload nginx

# Get free SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Certbot automatically edits the nginx config to add HTTPS
# Auto-renewal is set up automatically
```

Your API is now live at **https://yourdomain.com**

---

### Deploying updates

Every time you push new code:

```bash
cd /opt/social-comm

# Pull latest code
git pull origin main

# Rebuild and restart the app container only (zero downtime for DB/Redis)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build app

# If you changed the database schema, run migrations
docker exec social-comm-app-prod pnpm prisma:migrate:deploy
```

---

### Useful production commands

```bash
# View live logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f redis

# Check container status
docker compose -f docker-compose.prod.yml ps

# Restart a service
docker compose -f docker-compose.prod.yml restart app

# Stop everything
docker compose -f docker-compose.prod.yml down

# Open a shell inside the running app container
docker exec -it social-comm-app-prod sh

# Run Prisma commands inside container
docker exec social-comm-app-prod pnpm prisma:migrate:deploy
docker exec social-comm-app-prod pnpm prisma:generate

# Check health
curl https://yourdomain.com/health
```

---

### Database backup (production)

```bash
# Backup
docker exec social-comm-postgres-prod pg_dump -U postgres social_communication > backups/backup-$(date +%Y%m%d).sql

# Restore
docker exec -i social-comm-postgres-prod psql -U postgres social_communication < backups/backup-20240101.sql
```

Set up a daily cron job:

```bash
crontab -e
# Add this line (runs backup every day at 2am):
0 2 * * * cd /opt/social-comm && docker exec social-comm-postgres-prod pg_dump -U postgres social_communication > backups/backup-$(date +\%Y\%m\%d).sql
```

---

### What's running in production

| Service | Access | Notes |
|---|---|---|
| API | https://yourdomain.com | Via Nginx HTTPS |
| Swagger Docs | https://yourdomain.com/api/docs | Consider restricting in prod |
| Health Check | https://yourdomain.com/health | Use for uptime monitoring |
| PostgreSQL | Internal only (127.0.0.1:5432) | Not exposed to internet |
| Redis | Internal only (127.0.0.1:6379) | Not exposed to internet |

---

---

## Summary

| | Development | Production |
|---|---|---|
| **Node.js** | Runs locally (native, hot reload) | Runs in Docker (compiled JS) |
| **PostgreSQL** | Docker container | Docker container |
| **Redis** | Docker container | Docker container |
| **TypeScript** | Executed directly via `tsx` | Compiled to JS (`pnpm build`) |
| **Hot reload** | Yes (nodemon, ~1s) | No (restart on deploy) |
| **Nginx** | Not needed | Required (HTTPS + WebSocket proxy) |
| **Env file** | `.env` (localhost connections) | `.env.prod` (real secrets) |
| **Start command** | `pnpm dev` | `docker compose -f docker-compose.prod.yml up -d` |
| **DB GUI** | Prisma Studio / pgAdmin | pgAdmin (optional, access via SSH tunnel) |
| **Schema changes** | `pnpm prisma:migrate` | `docker exec ... pnpm prisma:migrate:deploy` |
