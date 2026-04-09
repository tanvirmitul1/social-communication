# Database Guide

PostgreSQL management — local development, data transfer, backup, and restore.

---

## Local Database Setup

The Docker Compose dev config includes PostgreSQL + pgAdmin. Start with:

```bash
pnpm docker:dev:up
# or for local Node dev:
docker compose -f docker-compose.dev.yml up postgres redis pgadmin -d
```

**Local credentials:**

| Setting | Value |
|---|---|
| Host (from app) | `postgres` (Docker) or `localhost` (local Node) |
| Port | `5432` |
| Database | `social_communication` |
| User | `postgres` |
| Password | `141532` |

---

## Viewing the Database

### Prisma Studio (Recommended)

```bash
pnpm prisma:studio
# Opens at http://localhost:5555
```

Browse tables, edit rows, follow relations — no SQL needed.

### pgAdmin (Web GUI)

```
URL:      http://localhost:5050
Email:    admin@localhost.com
Password: admin
```

First-time setup — add a server connection:
- Right-click "Servers" → Create → Server
- **General** tab → Name: `Local Development`
- **Connection** tab:
  - Host: `postgres` (Docker container name)
  - Port: `5432`
  - Database: `social_communication`
  - Username: `postgres`
  - Password: `141532` → check "Save password"

### PostgreSQL CLI

```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication

# Useful commands:
# \dt          — list tables
# \d users     — describe table
# \l           — list databases
# \q           — quit
```

### Redis Commander

```
URL: http://localhost:8081
```

Browse cached keys, TTLs, and values in a visual UI.

---

## Common Operations

### Apply Schema Changes

```bash
# Edit prisma/schema.prisma, then:
pnpm prisma:migrate       # creates migration + regenerates client
pnpm prisma:generate      # regenerate client only (no migration)
```

### Reset Database (Dev Only)

```bash
# Method 1 — Prisma reset (drops all, reruns migrations + seed)
pnpm prisma:reset

# Method 2 — Manual
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "DROP DATABASE social_communication;"
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "CREATE DATABASE social_communication;"
pnpm prisma:migrate
pnpm prisma:seed
```

### Seed Test Data

```bash
pnpm prisma:seed
```

### Check Migration Status

```bash
docker compose -f docker-compose.dev.yml exec app pnpm exec prisma migrate status
```

### Useful SQL Queries

```sql
-- Count all tables and rows
SELECT tablename, n_live_tup as row_count
FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

-- Database size
SELECT pg_size_pretty(pg_database_size('social_communication'));

-- Recent users
SELECT id, username, email, "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 10;

-- Data integrity check
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM groups) as groups,
  (SELECT COUNT(*) FROM calls) as calls;
```

---

## Backup & Restore

### Create a Backup

```bash
# Local database → backup.dump
docker compose -f docker-compose.dev.yml exec -T postgres \
  pg_dump -U postgres -d social_communication -F c \
  > backups/backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore from Backup

```bash
# 1. Stop app to avoid conflicts
docker compose -f docker-compose.dev.yml stop app

# 2. Copy backup into container
docker cp backups/backup.dump social-comm-postgres-dev:/tmp/backup.dump

# 3. Restore
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres -d social_communication --clean --if-exists /tmp/backup.dump

# 4. Restart app
docker compose -f docker-compose.dev.yml start app
```

> Warnings like `errors ignored on restore: N` are normal (tables already exist, ownership differences). Only `ERROR:` lines are problems.

---

## Syncing Production Data to Local

Use this to test with real data or debug production issues.

### Step 1 — Export from Production Server

```bash
# SSH into server and create backup
ssh -i ~/your-key.pem ubuntu@YOUR_SERVER_IP \
  "cd /opt/social-comm && docker compose exec -T postgres pg_dump -U postgres -d social_communication -F c > backup.dump"
```

### Step 2 — Download Backup

```bash
# SCP to local machine
scp -i ~/your-key.pem ubuntu@YOUR_SERVER_IP:/opt/social-comm/backup.dump ./backups/

# Or use WinSCP / FileZilla for a GUI approach
```

### Step 3 — Restore Locally

```bash
docker compose -f docker-compose.dev.yml stop app

docker cp backups/backup.dump social-comm-postgres-dev:/tmp/backup.dump

docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres -d social_communication --clean --if-exists /tmp/backup.dump

docker compose -f docker-compose.dev.yml start app
```

### Step 4 — Verify

```bash
# Check data counts
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication \
  -c "SELECT COUNT(*) FROM users;"
```

---

## Production Backups

### Manual Backup

```bash
docker exec social-comm-postgres-prod \
  pg_dump -U postgres social_communication \
  > backups/backup-$(date +%Y%m%d).sql
```

### Restore Production

```bash
docker exec -i social-comm-postgres-prod \
  psql -U postgres social_communication \
  < backups/backup-20240101.sql
```

### Automated Daily Backup (Cron)

```bash
crontab -e
# Add (runs every day at 2am):
0 2 * * * cd /opt/social-comm && docker exec social-comm-postgres-prod pg_dump -U postgres social_communication > backups/backup-$(date +\%Y\%m\%d).sql

# Clean up old backups (keep last 7 days)
0 3 * * * find /opt/social-comm/backups -name "backup-*.sql" -mtime +7 -delete
```

---

## Best Practices

1. **Always use local DB for development** — never connect dev app to production database
2. **Test migrations locally first**, then apply to production
3. **Backup before destructive operations** — migrations, restores, resets
4. **Use transactions** in code for multi-step writes (`prisma.$transaction`)
5. **Never commit credentials** — `.env` is in `.gitignore`
6. **Add indexes** on all foreign keys and `WHERE`/`ORDER BY` columns:
   ```prisma
   model User {
     @@index([email])
     @@index([createdAt])
   }
   ```

---

## Troubleshooting

**Can't connect to database**

```bash
docker compose -f docker-compose.dev.yml ps postgres
docker compose -f docker-compose.dev.yml logs postgres
docker compose -f docker-compose.dev.yml restart postgres
```

**Port 5432 already in use**

```bash
netstat -ano | findstr :5432   # Windows — find PID
# Change port in docker-compose.dev.yml if needed:
# ports: ["5433:5432"]
```

**Migration failed**

```bash
docker compose -f docker-compose.dev.yml exec app pnpm exec prisma migrate status
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset
```

**App won't start after restore**

```bash
# Schema may have changed — run generate + migrate
docker compose -f docker-compose.dev.yml exec app pnpm prisma:generate
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate
```

**SCP permission denied**

```bash
# Fix key permissions
chmod 600 ~/your-key.pem

# Test SSH first
ssh -i ~/your-key.pem ubuntu@YOUR_SERVER_IP
```
