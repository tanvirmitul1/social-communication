# Setup Guide

Development and production setup for the Social Communication Backend.

---

## Development

Two options. Pick one — they produce identical API behavior.

| | Option A: Full Docker | Option B: Local Node |
|---|---|---|
| **Requirements** | Docker Desktop only | Node.js 20+, pnpm 10+, Docker |
| **Setup** | `pnpm docker:dev:up` | 8-step first-time setup |
| **Hot reload** | Yes (volume-mounted) | Yes (nodemon) |
| **Best for** | Onboarding, teams | Faster IDE integration |

---

### Option A — Full Docker (Recommended)

Everything runs in Docker. Only Docker Desktop required.

```bash
# Clone and enter the project
git clone <your-repo-url>
cd social-communication-backend

# Copy env file
cp .env.example .env

# Start everything (Postgres, Redis, pgAdmin, App)
pnpm docker:dev:up
```

That's it. Edit any `.ts` file → hot reload triggers automatically via volume mount.

**Running commands inside the container:**

```bash
# Open a shell
docker compose -f docker-compose.dev.yml exec app sh

# Run commands inside:
pnpm prisma:migrate
pnpm prisma:studio
pnpm test
pnpm lint
```

**Installing new packages:**

```bash
# 1. Add locally (updates package.json)
pnpm add some-package

# 2. Rebuild app container to pick it up
docker compose -f docker-compose.dev.yml up -d --build app
```

---

### Option B — Local Node + Docker DB

Your TypeScript runs natively on your machine. Only Postgres and Redis run in Docker.

**First-time setup:**

```bash
# 1. Clone and enter
git clone <your-repo-url>
cd social-communication-backend

# 2. Install dependencies
pnpm install

# 3. Copy env file (DATABASE_URL and REDIS_HOST must point to localhost)
cp .env.example .env

# 4. Start Postgres + Redis + pgAdmin in Docker
docker compose -f docker-compose.dev.yml up postgres redis pgadmin -d

# 5. Generate Prisma client
pnpm prisma:generate

# 6. Run migrations (creates all tables)
pnpm prisma:migrate

# 7. (Optional) Seed test data
pnpm prisma:seed

# 8. Start the server
pnpm dev
```

**Daily workflow:**

```bash
# Start DB services (if not running)
docker compose -f docker-compose.dev.yml up postgres redis pgadmin -d

# Start server
pnpm dev
```

---

### Environment Variables

Copy `.env.example` to `.env` and fill in the values. Key settings for local dev:

```env
NODE_ENV=development
PORT=3000

# Postgres in Docker → localhost
DATABASE_URL="postgresql://postgres:141532@localhost:5432/social_communication?schema=public"

# Redis in Docker → localhost
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Generate with: openssl rand -base64 64
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Optional — features gracefully disabled if empty
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Jitsi (video calls)
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=your-app-id
JITSI_APP_SECRET=your-app-secret

# Admin panel
ADMIN_COOKIE_SECRET=change-this-to-a-long-random-string
```

> For **Option A (Full Docker)**, use `postgres` as the hostname (the Docker container name).
> For **Option B (Local Node)**, use `localhost`.

---

### Services Reference

| Service | URL | Notes |
|---|---|---|
| API | http://localhost:3000 | Express server |
| Swagger Docs | http://localhost:3000/api/docs | Interactive API reference |
| Admin Panel | http://localhost:3000/admin | Login with ADMIN role user |
| Health Check | http://localhost:3000/health | DB + Redis status |
| Prisma Studio | http://localhost:5555 | Run `pnpm prisma:studio` first |
| pgAdmin | http://localhost:5050 | `admin@localhost.com` / `admin` |
| Redis Commander | http://localhost:8081 | Browse Redis cache |
| PostgreSQL | localhost:5432 | Docker container |
| Redis | localhost:6379 | Docker container |

---

### Dev Commands

```bash
# Server
pnpm dev                  # Start with hot reload
pnpm dev:watch            # Alternative: tsx watch

# Database
pnpm prisma:studio        # Open DB GUI at :5555
pnpm prisma:migrate       # Apply schema changes + regenerate client
pnpm prisma:generate      # Regenerate Prisma client only
pnpm prisma:seed          # Seed test data
pnpm prisma:reset         # ⚠️  Drop + recreate DB (dev only)

# Code quality
pnpm lint                 # ESLint check
pnpm lint:fix             # Auto-fix lint errors
pnpm format               # Format with Prettier
pnpm build                # Verify production build compiles

# Tests
pnpm test                 # Run all tests
pnpm test:coverage        # Coverage report

# Docker (Option A / services)
pnpm docker:dev:up        # Start all services
pnpm docker:dev:down      # Stop all services
pnpm docker:dev:logs      # View all logs
```

---

### Schema Changes

```bash
# 1. Edit prisma/schema.prisma

# 2. Apply migration (creates migration file + regenerates client)
pnpm prisma:migrate
# Prisma prompts for a migration name, e.g. "add_user_bio"

# If you only need to regenerate the client:
pnpm prisma:generate
```

---

### Stopping Everything

```bash
# Option A (Full Docker)
pnpm docker:dev:down

# Option B (Local Node)
Ctrl+C                                              # Stop Node server
docker compose -f docker-compose.dev.yml down       # Stop Docker services

# Full reset (delete all data)
docker compose -f docker-compose.dev.yml down -v
```

---

### Troubleshooting

**App container keeps restarting**

```bash
docker compose -f docker-compose.dev.yml logs app
# Common causes:
# - Prisma client not generated → docker compose exec app pnpm prisma:generate
# - Missing .env file → cp .env.example .env
# - DB not ready yet → wait a few seconds and retry
```

**Port already in use**

```bash
# Find what's using the port (Windows)
netstat -ano | findstr :5432

# Permanently stop old containers that auto-restart
docker update --restart=no <container-name>
docker stop <container-name>
```

**Changes not reflected (Option A)**

```bash
docker compose -f docker-compose.dev.yml up -d --build app
```

---

---

## Production Deployment

### Architecture

```
Internet
   ↓
Nginx (port 80/443 — SSL + reverse proxy + WebSocket)
   ↓
Docker: Node.js app (compiled JS, port 3000)
   ↓
Docker: PostgreSQL + Redis (internal network, not exposed)
```

---

### Server Requirements

- Ubuntu 22.04 LTS
- 2 vCPU, 2 GB RAM minimum (Hetzner CX22 ~$5/mo, DigitalOcean Basic)
- Docker + Docker Compose
- A domain pointing to your server IP

---

### One-time Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Nginx + Certbot (free SSL)
sudo apt install nginx certbot python3-certbot-nginx git -y
```

---

### Deploy the Application

```bash
# 1. Clone on the server
git clone <your-repo-url> /opt/social-comm
cd /opt/social-comm

# 2. Create production env file
cp .env.example .env.prod
nano .env.prod   # fill in all real values

# 3. Start all services
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. Run migrations
docker exec social-comm-app-prod pnpm prisma:migrate:deploy

# 5. (Optional) Seed initial data
docker exec social-comm-app-prod pnpm prisma:seed
```

---

### Production Environment Variables

```env
NODE_ENV=production
PORT=3000

DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_strong_password_123!
DB_NAME=social_communication

REDIS_PASSWORD=CHANGE_THIS_redis_password_456!

# Generate with: openssl rand -base64 64
JWT_ACCESS_SECRET=CHANGE_THIS_very_long_random_string
JWT_REFRESH_SECRET=CHANGE_THIS_very_long_random_string
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=your-jitsi-app-id
JITSI_APP_SECRET=your-jitsi-app-secret

ADMIN_COOKIE_SECRET=CHANGE_THIS_long_random_string
```

---

### Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/social-comm
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Required for WebSockets (Socket.IO)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable + get SSL
sudo ln -s /etc/nginx/sites-available/social-comm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

API is now live at **https://yourdomain.com**

---

### Deploying Updates

```bash
cd /opt/social-comm
git pull origin main

# Rebuild only the app container (DB/Redis keep running)
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build app

# If schema changed
docker exec social-comm-app-prod pnpm prisma:migrate:deploy
```

---

### Production Commands

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f postgres

# Status
docker compose -f docker-compose.prod.yml ps

# Shell into app
docker exec -it social-comm-app-prod sh

# Health check
curl https://yourdomain.com/health

# Restart app
docker compose -f docker-compose.prod.yml restart app

# Stop everything
docker compose -f docker-compose.prod.yml down
```

---

### Summary

| | Development | Production |
|---|---|---|
| **Node.js** | In Docker or local (hot reload) | Docker (compiled JS) |
| **PostgreSQL** | Docker | Docker |
| **Redis** | Docker | Docker |
| **TypeScript** | Executed via `tsx` | Compiled to JS |
| **Hot reload** | Yes | No |
| **Nginx** | Not needed | Required (HTTPS + WebSocket) |
| **Env file** | `.env` | `.env.prod` |
| **Start** | `pnpm docker:dev:up` or `pnpm dev` | `docker compose ... up -d` |
| **DB changes** | `pnpm prisma:migrate` | `docker exec ... prisma:migrate:deploy` |
