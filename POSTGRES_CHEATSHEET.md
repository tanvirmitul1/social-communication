# PostgreSQL Quick Reference Cheatsheet

## 🚀 Download Production → Upload Local (Quick Steps)

### 1️⃣ Download from Server

```bash
scp -i C:\Users\User\Downloads\oracle\key.key \
  ubuntu@40.233.122.142:/home/ubuntu/project/social-communication/backup.dump \
  C:\Users\User\Downloads\
```

### 2️⃣ Copy to Docker Container

```bash
cd /d/projects/social-communication/social-communication-backend
docker cp C:\Users\User\Downloads\backup.dump social-comm-postgres-dev:/tmp/backup.dump
```

### 3️⃣ Verify Copy

```bash
docker exec -it social-comm-postgres-dev ls -lh /tmp/backup.dump
```

### 4️⃣ Restore Database

```bash
# Stop app first
docker compose -f docker-compose.dev.yml stop app

# Restore
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  --clean \
  --if-exists \
  /tmp/backup.dump

# Restart app
docker compose -f docker-compose.dev.yml start app
```

### 5️⃣ Verify Data

```bash
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication -c "SELECT * FROM users LIMIT 10;"
```

---

## 📊 Database Access

### PostgreSQL CLI

```bash
# Access database
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication

# Common commands inside psql:
\dt              # List all tables
\d users         # Describe users table
\l               # List all databases
\q               # Quit
```

### pgAdmin (GUI)

```
URL: http://localhost:5050
Email: admin@localhost.com
Password: admin

Connection:
  Host: postgres
  Port: 5432
  Database: social_communication
  Username: postgres
  Password: 141532
```

### Prisma Studio (GUI)

```bash
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio
# Then: http://localhost:5555
```

---

## 🔍 Common SQL Queries

```sql
-- Count users
SELECT COUNT(*) FROM users;

-- View recent users
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 10;

-- Count messages
SELECT COUNT(*) FROM messages;

-- Check user's messages
SELECT u.username, COUNT(m.id) as msg_count
FROM users u
LEFT JOIN messages m ON u.id = m."senderId"
GROUP BY u.id, u.username;

-- Database size
SELECT pg_size_pretty(pg_database_size('social_communication'));

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 💾 Backup & Restore

### Create Backup

```bash
# Backup local database
docker compose -f docker-compose.dev.yml exec postgres pg_dump \
  -U postgres -d social_communication -F c > backup.dump

# Backup production (on server)
ssh -i key.key ubuntu@server "docker compose exec -T postgres pg_dump -U postgres -d social_communication -F c" > backup.dump
```

### Restore Backup

```bash
# Restore to local
docker cp backup.dump social-comm-postgres-dev:/tmp/backup.dump
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres -d social_communication --clean --if-exists /tmp/backup.dump
```

---

## 🛠️ Docker Commands

```bash
# Start services
pnpm docker:dev:up

# Stop services
pnpm docker:dev:down

# View logs
docker compose -f docker-compose.dev.yml logs postgres
docker compose -f docker-compose.dev.yml logs app

# Restart
docker compose -f docker-compose.dev.yml restart postgres
docker compose -f docker-compose.dev.yml restart app

# Check status
docker compose -f docker-compose.dev.yml ps
```

---

## 🔧 Prisma Commands

```bash
# Generate client
docker compose -f docker-compose.dev.yml exec app pnpm prisma:generate

# Run migrations
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# Reset database (drops all data!)
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset

# Seed database
docker compose -f docker-compose.dev.yml exec app pnpm prisma:seed

# Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio
```

---

## 🆘 Troubleshooting

### Container not found?

```bash
# List containers
docker compose -f docker-compose.dev.yml ps

# Use exact name shown
docker exec -it <EXACT_NAME> psql -U postgres -d social_communication
```

### Port already in use?

```bash
# Check what's using port 5432
netstat -ano | findstr :5432

# Stop local PostgreSQL if installed
# Or change port in docker-compose.dev.yml
```

### Database connection failed?

```bash
# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres

# Check logs
docker compose -f docker-compose.dev.yml logs postgres

# Verify DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:141532@postgres:5432/social_communication?schema=public"
```

### Restore shows warnings?

```
pg_restore: warning: errors ignored on restore: 5
```
This is **NORMAL**! Warnings about existing sequences/tables can be ignored. Only worry about **ERROR** messages.

---

## 📝 Environment Variables

```bash
# Local (.env)
DATABASE_URL="postgresql://postgres:141532@postgres:5432/social_communication?schema=public"

# Production (on server)
DATABASE_URL="postgresql://postgres:password@postgres:5432/social_communication?schema=public"
```

---

## 🎯 Daily Workflow

### Morning: Start Everything

```bash
pnpm docker:dev:up
```

### During Development

```bash
# View data in pgAdmin
start http://localhost:5050

# Or Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio
```

### When Schema Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate & migrate
docker compose -f docker-compose.dev.yml exec app pnpm prisma:generate
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate
```

### Evening: Stop Everything

```bash
pnpm docker:dev:down
```

---

## 📦 Server Info

```
IP: 40.233.122.142
User: ubuntu
Key: C:\Users\User\Downloads\oracle\key.key
Path: /home/ubuntu/project/social-communication
```

---

## 🔗 Quick Links

- **Local API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:5050
- **Prisma Studio**: http://localhost:5555 (after running prisma:studio)
- **Health Check**: http://localhost:3000/health

---

## 📚 Full Documentation

- [Complete Database Guide](docs/guides/database-management.md)
- [Backup & Restore Guide](docs/guides/database-backup-restore.md)
- [MySQL to PostgreSQL Guide](docs/guides/mysql-to-postgresql.md)
- [Quick Start](DATABASE_QUICKSTART.md)
