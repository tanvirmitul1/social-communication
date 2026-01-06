# PostgreSQL Database Management Guide

This guide covers how to work with PostgreSQL databases across different environments (server, local Docker) and perform common database operations.

## Table of Contents

1. [Understanding the Setup](#understanding-the-setup)
2. [Option 1: Local Database (Recommended for Development)](#option-1-local-database-recommended-for-development)
3. [Option 2: Connect to Server Database](#option-2-connect-to-server-database)
4. [Migrating Data Between Environments](#migrating-data-between-environments)
5. [Database GUI Tools](#database-gui-tools)
6. [Common Operations](#common-operations)
7. [Best Practices](#best-practices)

---

## Understanding the Setup

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Project                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Option 1: Local Docker Database (RECOMMENDED)             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Docker Container: PostgreSQL                │          │
│  │  - Database: social_communication            │          │
│  │  - Port: 5432                                │          │
│  │  - User: postgres                            │          │
│  │  - Password: 141532                          │          │
│  └──────────────────────────────────────────────┘          │
│                        ↕                                    │
│  ┌──────────────────────────────────────────────┐          │
│  │  Docker Container: pgAdmin (GUI)             │          │
│  │  - Access: http://localhost:5050             │          │
│  │  - Email: admin@localhost.com                │          │
│  │  - Password: admin                           │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│                        OR                                   │
│                                                             │
│  Option 2: Server Database (NOT RECOMMENDED for dev)       │
│  ┌──────────────────────────────────────────────┐          │
│  │  Remote Server: PostgreSQL                   │          │
│  │  - Host: your-server-ip:5432                 │          │
│  │  - Requires internet connection              │          │
│  │  - Slower performance                        │          │
│  │  - Risk of affecting production data         │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Option 1: Local Database (Recommended for Development)

### Why Use Local Database?

✅ **Advantages:**
- **Fast**: No network latency
- **Safe**: Can't accidentally affect production data
- **Offline**: Works without internet
- **Free to experiment**: Break things without consequences
- **Easy reset**: Fresh database anytime

❌ **Server Database Issues:**
- Slow due to network latency
- Risk of corrupting production data
- Requires constant internet connection
- Multiple developers can conflict

### Step 1: Start Local Database

Your Docker Compose setup already includes PostgreSQL and pgAdmin!

```bash
# Start all services (PostgreSQL + Redis + App + pgAdmin)
pnpm docker:dev:up

# Verify services are running
docker compose -f docker-compose.dev.yml ps
```

You should see:
```
NAME                       STATUS      PORTS
social-comm-postgres-dev   running     0.0.0.0:5432->5432/tcp
social-comm-redis-dev      running     0.0.0.0:6379->6379/tcp
social-comm-app-dev        running     0.0.0.0:3000->3000/tcp
social-comm-pgadmin-dev    running     0.0.0.0:5050->80/tcp
```

### Step 2: Access pgAdmin (Like phpMyAdmin)

1. **Open pgAdmin in browser:**
   ```
   http://localhost:5050
   ```

2. **Login credentials:**
   - Email: `admin@localhost.com`
   - Password: `admin`

3. **First-time setup - Add server:**
   - Right-click "Servers" → Create → Server
   - **General Tab:**
     - Name: `Local Development`
   - **Connection Tab:**
     - Host: `postgres` (Docker container name)
     - Port: `5432`
     - Maintenance database: `social_communication`
     - Username: `postgres`
     - Password: `141532`
     - Save password: ✓ (check)
   - Click "Save"

4. **Navigate to your database:**
   - Servers → Local Development → Databases → social_communication → Schemas → public → Tables

Now you can browse, query, and manage your database just like phpMyAdmin!

### Step 3: Verify Database Connection

```bash
# Check app logs to confirm database connection
pnpm docker:dev:logs

# You should see:
# ✓ Connected to PostgreSQL
# 🔌 Database: Connected
```

---

## Option 2: Connect to Server Database

⚠️ **Warning**: Only use this for read-only operations or when you need production data temporarily.

### Method A: Update .env File (Temporary)

```bash
# Open .env file
notepad .env

# Change DATABASE_URL from:
DATABASE_URL="postgresql://postgres:141532@postgres:5432/social_communication?schema=public"

# To your server URL:
DATABASE_URL="postgresql://username:password@your-server-ip:5432/database_name?schema=public"

# Example:
DATABASE_URL="postgresql://admin:secretpass@123.456.789.10:5432/social_communication?schema=public"

# Restart app
pnpm docker:dev:down
pnpm docker:dev:up
```

### Method B: Create Separate Environment File

```bash
# Create a new file for server connection
cp .env .env.server

# Edit .env.server with server credentials
notepad .env.server

# Use it when needed
docker compose -f docker-compose.dev.yml --env-file .env.server up
```

---

## Migrating Data Between Environments

This is equivalent to downloading/uploading database in phpMyAdmin!

### Scenario 1: Download Production Data to Local

#### Step 1: Export from Server (Dump)

```bash
# Method 1: Using pg_dump (SSH into your server first)
pg_dump -h localhost -U postgres -d social_communication -F c -f backup.dump

# Method 2: Using pgAdmin on server
# 1. Right-click database → Backup
# 2. Format: Custom
# 3. Save as backup.dump

# Method 3: Using Docker (if server uses Docker)
docker compose exec postgres pg_dump -U postgres -d social_communication -F c -f /tmp/backup.dump
docker compose cp postgres:/tmp/backup.dump ./backup.dump
```

#### Step 2: Transfer to Your Local Machine

```bash
# Download from server using SCP
scp user@your-server:/path/to/backup.dump D:/backups/

# Or use WinSCP, FileZilla, or any FTP client
```

#### Step 3: Import to Local Database

```bash
# Stop app to avoid conflicts
docker compose -f docker-compose.dev.yml stop app

# Import using pg_restore
docker compose -f docker-compose.dev.yml exec postgres pg_restore -U postgres -d social_communication -c /tmp/backup.dump

# Or copy file into container first
docker compose -f docker-compose.dev.yml cp ./backup.dump postgres:/tmp/backup.dump
docker compose -f docker-compose.dev.yml exec postgres pg_restore -U postgres -d social_communication -c /tmp/backup.dump

# Restart app
docker compose -f docker-compose.dev.yml start app
```

#### Alternative: Import Using pgAdmin GUI

1. Open pgAdmin: http://localhost:5050
2. Navigate to: Servers → Local Development → Databases → social_communication
3. Right-click database → Restore
4. **Format**: Custom or tar
5. **Filename**: Browse and select `backup.dump`
6. **Role name**: postgres
7. Click "Restore"

### Scenario 2: Create Fresh Local Database with Sample Data

```bash
# Your project has a seed script!
docker compose -f docker-compose.dev.yml exec app pnpm prisma:seed

# This will create sample users, messages, etc.
```

### Scenario 3: Upload Local Data to Server (BE CAREFUL!)

⚠️ **DANGER**: This will overwrite production data!

```bash
# 1. Export from local
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres -d social_communication -F c -f /tmp/local-backup.dump
docker compose -f docker-compose.dev.yml cp postgres:/tmp/local-backup.dump ./local-backup.dump

# 2. Upload to server
scp ./local-backup.dump user@your-server:/tmp/

# 3. Import on server (SSH into server)
pg_restore -U postgres -d social_communication -c /tmp/local-backup.dump

# Or if server uses Docker
docker compose exec postgres pg_restore -U postgres -d social_communication -c /tmp/local-backup.dump
```

---

## Database GUI Tools

### 1. pgAdmin (Already Included!)

**Access**: http://localhost:5050

**Features**:
- ✅ Web-based, no installation needed
- ✅ Browse tables, view data
- ✅ Run SQL queries
- ✅ Import/Export data
- ✅ Backup/Restore databases
- ✅ Visual query builder

**Usage**:
```sql
-- Example: View all users
SELECT * FROM users LIMIT 10;

-- Example: Count messages
SELECT COUNT(*) FROM messages;

-- Example: Find user by email
SELECT * FROM users WHERE email = 'user@example.com';
```

### 2. Prisma Studio (Built-in to Your Project!)

```bash
# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio

# Access in browser
http://localhost:5555
```

**Features**:
- ✅ Beautiful UI
- ✅ Edit records directly
- ✅ Filter and search
- ✅ Relationship visualization
- ✅ No SQL knowledge needed!

### 3. DBeaver (Optional - Desktop App)

Download: https://dbeaver.io/download/

**Connection Settings**:
- Host: `localhost`
- Port: `5432`
- Database: `social_communication`
- Username: `postgres`
- Password: `141532`

### 4. TablePlus (Optional - Premium)

Download: https://tableplus.com/

Great UI, supports multiple databases.

---

## Common Operations

### 1. Reset Database Completely

```bash
# Method 1: Using Prisma
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset

# This will:
# - Drop all tables
# - Run all migrations
# - Run seed script

# Method 2: Drop database and recreate
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "DROP DATABASE social_communication;"
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "CREATE DATABASE social_communication;"
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate
docker compose -f docker-compose.dev.yml exec app pnpm prisma:seed
```

### 2. Access PostgreSQL CLI (Like MySQL CLI)

```bash
# Open PostgreSQL interactive terminal
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication

# Now you can run SQL commands:
# \dt              - List all tables
# \d users         - Describe users table
# \l               - List all databases
# \q               - Quit

# Example queries:
SELECT * FROM users;
SELECT COUNT(*) FROM messages;
```

### 3. View Database Logs

```bash
# PostgreSQL logs
docker compose -f docker-compose.dev.yml logs postgres

# App database queries (in Prisma)
# Set LOG_LEVEL=debug in .env to see queries
```

### 4. Backup Database Automatically

Create a script: `scripts/backup-db.sh`

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.dump"

mkdir -p $BACKUP_DIR

echo "Backing up database..."
docker compose -f docker-compose.dev.yml exec -T postgres pg_dump -U postgres -d social_communication -F c > $BACKUP_FILE

echo "Backup saved to: $BACKUP_FILE"
```

Run it:
```bash
# Make executable (Git Bash)
chmod +x scripts/backup-db.sh

# Run backup
./scripts/backup-db.sh
```

### 5. Apply Database Migrations

```bash
# Generate Prisma client after schema changes
docker compose -f docker-compose.dev.yml exec app pnpm prisma:generate

# Create and apply migration
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# View migration status
docker compose -f docker-compose.dev.yml exec app pnpm exec prisma migrate status
```

### 6. Clone Production Data for Testing

```bash
# 1. Backup production
ssh user@server "docker compose exec postgres pg_dump -U postgres -d social_communication -F c" > prod-backup.dump

# 2. Create test database locally
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -c "CREATE DATABASE social_communication_test;"

# 3. Restore to test database
docker compose -f docker-compose.dev.yml exec postgres pg_restore -U postgres -d social_communication_test -c prod-backup.dump

# 4. Update .env.test
DATABASE_URL="postgresql://postgres:141532@postgres:5432/social_communication_test"
```

---

## Best Practices

### Development Workflow

1. **Always use local database for development**
   ```bash
   # .env should have:
   DATABASE_URL="postgresql://postgres:141532@postgres:5432/social_communication?schema=public"
   ```

2. **Use separate databases for different purposes**
   ```
   social_communication        # Development
   social_communication_test   # Testing
   social_communication_prod   # Production (on server)
   ```

3. **Never test destructive operations on production**
   - Always test migrations locally first
   - Use transactions for data modifications
   - Keep backups before major changes

4. **Use migrations for schema changes**
   ```bash
   # Don't manually ALTER tables in production!
   # Always create migrations:
   pnpm prisma:migrate
   ```

5. **Seed database with realistic data**
   ```bash
   # Create seed script with production-like data
   pnpm prisma:seed
   ```

### Security Best Practices

1. **Use environment-specific credentials**
   ```bash
   # .env (local)
   DATABASE_URL="postgresql://postgres:141532@postgres:5432/..."

   # .env.production (server)
   DATABASE_URL="postgresql://secure_user:complex_password@localhost:5432/..."
   ```

2. **Never commit credentials to Git**
   ```bash
   # .gitignore should include:
   .env
   .env.*
   !.env.example
   ```

3. **Use read-only user for analytics/reports**
   ```sql
   -- Create read-only user
   CREATE USER readonly WITH PASSWORD 'readonly_password';
   GRANT CONNECT ON DATABASE social_communication TO readonly;
   GRANT USAGE ON SCHEMA public TO readonly;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
   ```

4. **Restrict production database access**
   - Use firewall rules
   - Allow only specific IP addresses
   - Use SSH tunnels for remote access

### Backup Strategy

1. **Automated daily backups**
   ```bash
   # Add to crontab (Linux/Mac) or Task Scheduler (Windows)
   0 2 * * * /path/to/backup-db.sh
   ```

2. **Keep multiple backup versions**
   ```bash
   # Rotate backups (keep last 7 days)
   find ./backups -name "backup_*.dump" -mtime +7 -delete
   ```

3. **Test restore periodically**
   ```bash
   # Monthly: Verify backups can be restored
   pg_restore -U postgres -d test_restore backup.dump
   ```

### Performance Tips

1. **Use connection pooling** (already configured in Prisma)

2. **Add indexes for frequently queried fields**
   ```prisma
   // In prisma/schema.prisma
   model User {
     @@index([email])
     @@index([username])
   }
   ```

3. **Monitor slow queries**
   ```bash
   # Enable query logging in PostgreSQL
   # Set in docker-compose.dev.yml:
   command: postgres -c log_statement=all
   ```

---

## Quick Reference Commands

```bash
# === Docker Database Management ===

# Start database
pnpm docker:dev:up

# Stop database
pnpm docker:dev:down

# View database logs
pnpm docker:dev:logs postgres

# Access PostgreSQL CLI
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication

# === Prisma Commands ===

# Generate client
docker compose -f docker-compose.dev.yml exec app pnpm prisma:generate

# Create migration
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# Reset database
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset

# Seed database
docker compose -f docker-compose.dev.yml exec app pnpm prisma:seed

# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio

# === Backup & Restore ===

# Backup database
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres -d social_communication -F c -f /tmp/backup.dump
docker compose -f docker-compose.dev.yml cp postgres:/tmp/backup.dump ./backup.dump

# Restore database
docker compose -f docker-compose.dev.yml cp ./backup.dump postgres:/tmp/backup.dump
docker compose -f docker-compose.dev.yml exec postgres pg_restore -U postgres -d social_communication -c /tmp/backup.dump

# === pgAdmin ===

# Access pgAdmin
http://localhost:5050
# Email: admin@localhost.com
# Password: admin
```

---

## Troubleshooting

### Problem: Can't connect to database

```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Check logs for errors
docker compose -f docker-compose.dev.yml logs postgres

# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres
```

### Problem: Port 5432 already in use

```bash
# Check what's using the port
netstat -ano | findstr :5432

# Option 1: Stop conflicting service
# Stop local PostgreSQL if installed

# Option 2: Change port in docker-compose.dev.yml
ports:
  - "5433:5432"  # Use 5433 on host instead
```

### Problem: Lost database data

```bash
# Check if volume exists
docker volume ls | grep postgres

# Restore from backup
docker compose -f docker-compose.dev.yml exec postgres pg_restore -U postgres -d social_communication backup.dump
```

### Problem: Migration failed

```bash
# View migration status
docker compose -f docker-compose.dev.yml exec app pnpm exec prisma migrate status

# Reset and reapply
docker compose -f docker-compose.dev.yml exec app pnpm prisma:reset
```

---

## Summary: Recommended Workflow

### Daily Development

1. **Start Docker services**
   ```bash
   pnpm docker:dev:up
   ```

2. **Use local database** (`postgres` container)

3. **View/edit data in pgAdmin** (http://localhost:5050) or Prisma Studio

4. **Make schema changes in** `prisma/schema.prisma`

5. **Apply migrations**
   ```bash
   docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate
   ```

6. **Code normally** - hot reload will handle the rest!

### When You Need Production Data

1. **Export from server**
   ```bash
   ssh user@server "pg_dump -U postgres social_communication" > prod-backup.sql
   ```

2. **Import to local**
   ```bash
   docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d social_communication < prod-backup.sql
   ```

3. **Work safely on local copy**

### Before Deploying Changes

1. **Test migrations locally first**
2. **Backup production database**
3. **Apply migrations to production**
4. **Verify everything works**

---

**Remember**: Development database = playground. Production database = precious data. Never mix them up!
