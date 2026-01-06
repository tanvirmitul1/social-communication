# Database Quick Start Guide

## 🚀 Recommended: Use Local Database

Your Docker setup includes PostgreSQL + pgAdmin (like phpMyAdmin for MySQL).

### Start Everything

```bash
pnpm docker:dev:up
```

This starts:
- ✅ PostgreSQL database (port 5432)
- ✅ pgAdmin GUI (port 5050)
- ✅ Redis cache
- ✅ Your application

### Access Database GUI (pgAdmin)

1. **Open**: http://localhost:5050
2. **Login**:
   - Email: `admin@localhost.com`
   - Password: `admin`

3. **First-time setup**:
   - Right-click "Servers" → Create → Server
   - **Name**: `Local Development`
   - **Connection**:
     - Host: `postgres`
     - Port: `5432`
     - Username: `postgres`
     - Password: `141532`
     - Database: `social_communication`
   - Click "Save"

Now you can browse tables, run queries, export/import data just like phpMyAdmin!

### Alternative: Prisma Studio (Prettier UI)

```bash
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio
```

Then open: http://localhost:5555

---

## 📦 Download Production Database

### Option 1: Using Scripts (Easy)

```bash
# Windows
scripts\download-server-db.bat

# Then restore it
scripts\restore-db.bat
```

### Option 2: Manual (SSH Access Required)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Export database
docker compose exec postgres pg_dump -U postgres -d social_communication -F c > backup.dump

# 3. Download to your computer (from your local machine)
scp user@your-server-ip:/path/to/backup.dump ./backups/

# 4. Restore to local database
docker compose -f docker-compose.dev.yml cp ./backups/backup.dump postgres:/tmp/backup.dump
docker compose -f docker-compose.dev.yml exec postgres pg_restore -U postgres -d social_communication -c /tmp/backup.dump
```

### Option 3: Using pgAdmin (GUI)

**Export from server:**
1. Install pgAdmin on your computer
2. Connect to server database
3. Right-click database → Backup
4. Save file

**Import to local:**
1. Open local pgAdmin: http://localhost:5050
2. Right-click `social_communication` → Restore
3. Select backup file
4. Click "Restore"

---

## 🔧 Common Operations

### Backup Local Database

```bash
# Windows
scripts\backup-db.bat

# Or use npm script (Git Bash)
pnpm db:backup
```

Backups saved to `backups/` folder.

### Restore Database

```bash
# Windows
scripts\restore-db.bat

# Choose from available backups
```

### Reset Database (Fresh Start)

```bash
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset
```

This will:
- Drop all tables
- Run all migrations
- Seed with sample data

### View Data with SQL

```bash
# Access PostgreSQL CLI
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication

# Example queries:
SELECT * FROM users;
SELECT COUNT(*) FROM messages;
\dt    # List all tables
\q     # Quit
```

---

## ⚙️ Environment Setup

### Use Local Database (Recommended)

Your `.env` should have:

```env
DATABASE_URL="postgresql://postgres:141532@postgres:5432/social_communication?schema=public"
```

This is already configured! No changes needed.

### Connect to Server Database (Not Recommended)

Only for reading production data temporarily:

```env
# .env
DATABASE_URL="postgresql://username:password@your-server-ip:5432/social_communication?schema=public"
```

Then restart:
```bash
pnpm docker:dev:down
pnpm docker:dev:up
```

⚠️ **Warning**: This connects to live production data. Any changes affect production!

---

## 📚 Full Documentation

For detailed information, see:
- **[Database Management Guide](docs/guides/database-management.md)** - Complete guide with all scenarios
- **[Local Setup Guide](LOCAL_SETUP.md)** - Full project setup
- **[Docker Workflow](docs/development/docker-workflow.md)** - Docker development guide

---

## 🆘 Troubleshooting

### Can't access pgAdmin?

```bash
# Check if running
docker compose -f docker-compose.dev.yml ps pgadmin

# Restart it
docker compose -f docker-compose.dev.yml restart pgadmin

# Check logs
docker compose -f docker-compose.dev.yml logs pgadmin
```

### Database connection failed?

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.dev.yml logs postgres

# Restart database
docker compose -f docker-compose.dev.yml restart postgres
```

### Lost all data?

```bash
# Check if volume exists
docker volume ls | grep postgres

# Restore from backup
scripts\restore-db.bat
```

### Port 5432 in use?

```bash
# Check what's using it
netstat -ano | findstr :5432

# Stop local PostgreSQL service if installed
# Or change port in docker-compose.dev.yml to 5433
```

---

## 💡 Pro Tips

1. **Always develop on local database** - Fast, safe, and works offline
2. **Backup before major changes** - Use `scripts\backup-db.bat`
3. **Use Prisma Studio for editing** - Prettier than pgAdmin
4. **Test migrations locally first** - Never test on production
5. **Keep production credentials secure** - Never commit `.env` files

---

## 🎯 Quick Commands

```bash
# Start database
pnpm docker:dev:up

# Open pgAdmin
start http://localhost:5050

# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio

# Backup database
scripts\backup-db.bat

# Restore database
scripts\restore-db.bat

# Reset database
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset
```

---

**Summary**: You have PostgreSQL in Docker + pgAdmin GUI. Use it exactly like you used phpMyAdmin with MySQL! 🎉
