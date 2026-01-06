# PostgreSQL Database Backup & Restore Guide

Complete step-by-step guide for downloading production database and uploading to local development environment.

## Table of Contents

1. [Overview](#overview)
2. [Download Production Database](#download-production-database)
3. [Upload to Local Development](#upload-to-local-development)
4. [Verify Database](#verify-database)
5. [Troubleshooting](#troubleshooting)
6. [Quick Reference](#quick-reference)

---

## Overview

### What This Guide Covers

```
┌──────────────────────────────────────────────────────────────┐
│                     Database Migration Flow                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Production Server (Oracle Cloud)                           │
│  ┌────────────────────────────────────┐                     │
│  │  PostgreSQL Container              │                     │
│  │  Database: social_communication    │                     │
│  └────────────────────────────────────┘                     │
│                    │                                         │
│                    │ Step 1: Download                        │
│                    ↓                                         │
│  ┌────────────────────────────────────┐                     │
│  │  backup.dump (local file)          │                     │
│  └────────────────────────────────────┘                     │
│                    │                                         │
│                    │ Step 2: Upload & Restore                │
│                    ↓                                         │
│  Local Docker Container                                     │
│  ┌────────────────────────────────────┐                     │
│  │  PostgreSQL Container              │                     │
│  │  Database: social_communication    │                     │
│  └────────────────────────────────────┘                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Prerequisites

- ✅ Docker running locally
- ✅ SSH access to production server
- ✅ SSH key file (e.g., `key.key`)
- ✅ Git Bash installed (for Windows)
- ✅ Local containers running (`pnpm docker:dev:up`)

---

## Download Production Database

### Step 1: Create Backup on Server

**Method A: SSH into server and create backup**

```bash
# SSH into your Oracle Cloud server
ssh -i C:\Users\User\Downloads\oracle\key.key ubuntu@40.233.122.142

# Navigate to project directory
cd /home/ubuntu/project/social-communication

# Create backup using Docker
docker compose cp postgres:/tmp/backup.dump backup.dump

# Or create fresh backup
docker compose exec postgres pg_dump -U postgres -d social_communication -F c > backup.dump

# Verify backup was created
ls -lh backup.dump

# Exit SSH
exit
```

**Method B: Create backup remotely (one command)**

```bash
# From your local machine (Git Bash or PowerShell)
ssh -i C:\Users\User\Downloads\oracle\key.key ubuntu@40.233.122.142 \
  "cd /home/ubuntu/project/social-communication && \
   docker compose exec -T postgres pg_dump -U postgres -d social_communication -F c > backup.dump"
```

### Step 2: Download Backup to Local Machine

**Using SCP (Secure Copy)**

Open PowerShell or Git Bash and run:

```bash
# Download from server to local Downloads folder
scp -i C:\Users\User\Downloads\oracle\key.key \
  ubuntu@40.233.122.142:/home/ubuntu/project/social-communication/backup.dump \
  C:\Users\User\Downloads\
```

**Alternative: Using WinSCP (GUI Method)**

1. Open WinSCP
2. **Connection Settings:**
   - File protocol: `SFTP`
   - Host: `40.233.122.142`
   - Port: `22`
   - Username: `ubuntu`
   - Password: (leave blank, use key file instead)
3. **Advanced → SSH → Authentication:**
   - Private key file: `C:\Users\User\Downloads\oracle\key.key`
4. Click "Login"
5. Navigate to: `/home/ubuntu/project/social-communication/`
6. Download `backup.dump` to your local machine

### Step 3: Verify Download

```bash
# Check file exists and size (Git Bash or PowerShell)
ls -lh C:\Users\User\Downloads\backup.dump

# Should show file size (e.g., 10M, 50M, etc.)
# If size is 0 bytes or very small, download failed!
```

---

## Upload to Local Development

### Prerequisites Check

```bash
# Ensure local Docker containers are running
pnpm docker:dev:up

# Verify PostgreSQL container is running
docker compose -f docker-compose.dev.yml ps postgres

# Should show:
# NAME                      STATUS
# social-comm-postgres-dev  running
```

### Step 1: Copy Backup to Docker Container

**From your project folder** (where `docker-compose.dev.yml` is located):

```bash
# Navigate to project folder (Git Bash)
cd /d/projects/social-communication/social-communication-backend

# Copy backup from Downloads to container
docker cp C:\Users\User\Downloads\backup.dump social-comm-postgres-dev:/tmp/backup.dump
```

**Alternative: If backup is already in project folder**

```bash
# If you moved backup.dump to project/backups/ folder
docker cp backups/backup.dump social-comm-postgres-dev:/tmp/backup.dump
```

### Step 2: Verify File in Container

```bash
# Check file exists in container
docker exec -it social-comm-postgres-dev ls -lh /tmp/backup.dump

# Should show file size and permissions
# Example output:
# -rw-r--r-- 1 root root 15M Jan 5 10:30 /tmp/backup.dump
```

If you get "No such file or directory", the copy failed. Check the path and try again.

### Step 3: Stop Application Container

⚠️ **Important**: Stop the app to prevent database connection conflicts

```bash
docker compose -f docker-compose.dev.yml stop app
```

### Step 4: Restore Database

```bash
# Restore using pg_restore (Git Bash)
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  --clean \
  --if-exists \
  /tmp/backup.dump
```

**Expected Output:**

You may see warnings like:
```
pg_restore: warning: errors ignored on restore: 5
```

This is **NORMAL**! These warnings occur because:
- Some tables didn't exist (first time restore)
- Certain sequences already exist
- Ownership issues (different users)

As long as you don't see **ERROR** messages, the restore was successful.

**Alternative: Verbose mode to see progress**

```bash
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  --clean \
  --if-exists \
  --verbose \
  /tmp/backup.dump
```

### Step 5: Restart Application

```bash
# Restart the app container
docker compose -f docker-compose.dev.yml start app

# Or restart everything
docker compose -f docker-compose.dev.yml restart
```

### Step 6: Check Logs

```bash
# Verify app connected to database successfully
docker compose -f docker-compose.dev.yml logs app --tail 20

# Should see:
# ✓ Connected to PostgreSQL
# 🔌 Database: Connected
```

---

## Verify Database

### Method 1: PostgreSQL CLI

```bash
# Access PostgreSQL interactive terminal
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication
```

**Run verification queries:**

```sql
-- Check users table
SELECT * FROM users LIMIT 10;

-- Count total users
SELECT COUNT(*) FROM users;

-- Check messages
SELECT COUNT(*) FROM messages;

-- List all tables
\dt

-- Describe users table structure
\d users

-- Exit
\q
```

### Method 2: pgAdmin GUI

1. **Open pgAdmin**: http://localhost:5050
2. **Login**:
   - Email: `admin@localhost.com`
   - Password: `admin`
3. **Navigate**: Servers → Local Development → Databases → social_communication → Schemas → public → Tables
4. **Right-click** `users` → View/Edit Data → All Rows
5. **Verify** data is present

### Method 3: Prisma Studio

```bash
# Open Prisma Studio
docker compose -f docker-compose.dev.yml exec app pnpm prisma:studio

# Access in browser
# http://localhost:5555
```

Browse through tables and verify data.

### Method 4: API Test

```bash
# Test API endpoint (after starting app)
curl http://localhost:3000/health

# Should return:
# {"status":"ok","database":"connected","redis":"connected"}
```

---

## Troubleshooting

### Problem: "No such file or directory" when copying to container

**Solution:**

```bash
# Check container name
docker compose -f docker-compose.dev.yml ps

# Use exact container name
docker cp backup.dump <EXACT_CONTAINER_NAME>:/tmp/backup.dump

# Or use this format
docker compose -f docker-compose.dev.yml cp backup.dump postgres:/tmp/backup.dump
```

### Problem: "Connection refused" when restoring

**Solution:**

```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.dev.yml ps postgres

# Restart PostgreSQL
docker compose -f docker-compose.dev.yml restart postgres

# Wait 10 seconds, then try restore again
```

### Problem: "Database does not exist"

**Solution:**

```bash
# Create database first
docker exec -it social-comm-postgres-dev psql -U postgres -c "CREATE DATABASE social_communication;"

# Then restore
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  --clean \
  --if-exists \
  /tmp/backup.dump
```

### Problem: "Permission denied" errors during restore

**Solution:**

```bash
# Restore as superuser (already using postgres)
# Ignore permission warnings, they're normal

# If still issues, try without --clean flag
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  /tmp/backup.dump
```

### Problem: Restore hangs or takes very long

**Solution:**

```bash
# Check backup file size
docker exec -it social-comm-postgres-dev ls -lh /tmp/backup.dump

# Large files (>100MB) take longer
# Wait patiently, or run in background:

docker exec -d social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  --clean \
  --if-exists \
  /tmp/backup.dump

# Monitor logs
docker compose -f docker-compose.dev.yml logs postgres -f
```

### Problem: App won't start after restore

**Solution:**

```bash
# Check app logs
docker compose -f docker-compose.dev.yml logs app

# Run Prisma migrations (in case schema changed)
docker compose -f docker-compose.dev.yml exec app pnpm prisma:generate
docker compose -f docker-compose.dev.yml exec app pnpm prisma:migrate

# Restart app
docker compose -f docker-compose.dev.yml restart app
```

### Problem: SCP download fails with "Permission denied"

**Solution:**

```bash
# Verify SSH key permissions (Git Bash)
chmod 600 /c/Users/User/Downloads/oracle/key.key

# Test SSH connection first
ssh -i C:\Users\User\Downloads\oracle\key.key ubuntu@40.233.122.142

# If SSH works, try SCP again
```

### Problem: Backup file is 0 bytes or very small

**Solution:**

```bash
# Backup creation failed
# SSH into server and create manually
ssh -i C:\Users\User\Downloads\oracle\key.key ubuntu@40.233.122.142

# Create backup correctly
cd /home/ubuntu/project/social-communication
docker compose exec -T postgres pg_dump -U postgres -d social_communication -F c > backup.dump

# Verify size
ls -lh backup.dump

# Should be several MB or more
```

---

## Quick Reference

### Complete Download & Upload Process (Copy-Paste Ready)

**Step 1: Download from Server**

```bash
# Download backup from Oracle Cloud to local
scp -i C:\Users\User\Downloads\oracle\key.key \
  ubuntu@40.233.122.142:/home/ubuntu/project/social-communication/backup.dump \
  C:\Users\User\Downloads\
```

**Step 2: Upload to Local Docker**

```bash
# Navigate to project
cd /d/projects/social-communication/social-communication-backend

# Stop app
docker compose -f docker-compose.dev.yml stop app

# Copy to container
docker cp C:\Users\User\Downloads\backup.dump social-comm-postgres-dev:/tmp/backup.dump

# Verify copy
docker exec -it social-comm-postgres-dev ls -lh /tmp/backup.dump

# Restore database
docker exec -it social-comm-postgres-dev pg_restore \
  -U postgres \
  -d social_communication \
  --clean \
  --if-exists \
  /tmp/backup.dump

# Restart app
docker compose -f docker-compose.dev.yml start app
```

**Step 3: Verify**

```bash
# Check database
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication -c "SELECT COUNT(*) FROM users;"

# Expected: (some number of users)
```

### One-Liner Scripts

**Quick Backup & Download:**

```bash
ssh -i C:\Users\User\Downloads\oracle\key.key ubuntu@40.233.122.142 \
  "cd /home/ubuntu/project/social-communication && \
   docker compose exec -T postgres pg_dump -U postgres -d social_communication -F c > backup_$(date +%Y%m%d_%H%M%S).dump"
```

**Quick Upload & Restore:**

```bash
# Save this as restore-prod-db.sh
cd /d/projects/social-communication/social-communication-backend && \
docker compose -f docker-compose.dev.yml stop app && \
docker cp C:\Users\User\Downloads\backup.dump social-comm-postgres-dev:/tmp/backup.dump && \
docker exec -it social-comm-postgres-dev pg_restore -U postgres -d social_communication --clean --if-exists /tmp/backup.dump && \
docker compose -f docker-compose.dev.yml start app
```

### Important Commands

```bash
# Check PostgreSQL logs
docker compose -f docker-compose.dev.yml logs postgres

# Access PostgreSQL CLI
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication

# List all databases
docker exec -it social-comm-postgres-dev psql -U postgres -c "\l"

# Check table count
docker exec -it social-comm-postgres-dev psql -U postgres -d social_communication -c "\dt"

# Drop database (DANGEROUS!)
docker exec -it social-comm-postgres-dev psql -U postgres -c "DROP DATABASE social_communication;"

# Create database
docker exec -it social-comm-postgres-dev psql -U postgres -c "CREATE DATABASE social_communication;"
```

---

## Best Practices

### 1. Always Backup Before Restore

```bash
# Backup current local database before importing production
docker compose -f docker-compose.dev.yml exec postgres pg_dump \
  -U postgres -d social_communication -F c > backups/local_backup_$(date +%Y%m%d).dump
```

### 2. Use Descriptive Backup Names

```bash
# Include date and environment in filename
backup_production_20260105.dump
backup_local_before_restore_20260105.dump
backup_dev_20260105_1430.dump
```

### 3. Store Backups Safely

```bash
# Create backups directory
mkdir -p backups

# Move downloads there
mv C:\Users\User\Downloads\backup.dump backups/backup_prod_20260105.dump
```

### 4. Verify After Restore

Always run these checks:

```sql
-- Check row counts
SELECT
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM messages) as messages_count,
  (SELECT COUNT(*) FROM groups) as groups_count;

-- Check latest data
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 5;
SELECT * FROM messages ORDER BY "createdAt" DESC LIMIT 5;
```

### 5. Document Your Process

Keep a log of backups:

```
backups/
  ├── backup_prod_20260105.dump (15MB)
  ├── backup_prod_20260104.dump (14MB)
  └── backup_local_20260105.dump (10MB)

README.txt:
- 2026-01-05: Restored production DB from Jan 5
- 2026-01-04: Tested with production data
```

---

## Server Information

### Production Server (Oracle Cloud)

```
IP: 40.233.122.142
User: ubuntu
SSH Key: C:\Users\User\Downloads\oracle\key.key
Project Path: /home/ubuntu/project/social-communication
Container Name: (varies - use docker compose ps)
Database: social_communication
DB User: postgres
```

### Local Development

```
Container Name: social-comm-postgres-dev
Database: social_communication
DB User: postgres
DB Password: 141532
Port: 5432 (mapped to localhost:5432)
pgAdmin: http://localhost:5050
Prisma Studio: http://localhost:5555
```

---

## Common SQL Queries for Verification

```sql
-- Count all tables and their rows
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check database size
SELECT pg_size_pretty(pg_database_size('social_communication'));

-- List all users
SELECT id, username, email, "createdAt" FROM users LIMIT 10;

-- Check recent messages
SELECT id, "senderId", content, "createdAt"
FROM messages
ORDER BY "createdAt" DESC
LIMIT 10;

-- Verify relationships work
SELECT
  u.username,
  COUNT(m.id) as message_count
FROM users u
LEFT JOIN messages m ON u.id = m."senderId"
GROUP BY u.id, u.username
LIMIT 10;

-- Check for data integrity
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM messages) as total_messages,
  (SELECT COUNT(*) FROM groups) as total_groups,
  (SELECT COUNT(*) FROM calls) as total_calls;
```

---

## Automated Backup Script (Windows)

Save as `download-prod-backup.bat`:

```batch
@echo off
echo ========================================
echo  Download Production Database
echo ========================================
echo.

REM Set variables
set SSH_KEY=C:\Users\User\Downloads\oracle\key.key
set SERVER=ubuntu@40.233.122.142
set SERVER_PATH=/home/ubuntu/project/social-communication
set LOCAL_PATH=C:\Users\User\Downloads

REM Generate timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

echo Creating backup on server...
ssh -i %SSH_KEY% %SERVER% "cd %SERVER_PATH% && docker compose exec -T postgres pg_dump -U postgres -d social_communication -F c > backup_%TIMESTAMP%.dump"

echo.
echo Downloading backup...
scp -i %SSH_KEY% %SERVER%:%SERVER_PATH%/backup_%TIMESTAMP%.dump %LOCAL_PATH%/

echo.
echo ========================================
echo  Download Complete!
echo ========================================
echo  File: %LOCAL_PATH%\backup_%TIMESTAMP%.dump
echo.

pause
```

---

## Summary

### The Process in 3 Steps:

1. **Download**: `scp` from server to local machine
2. **Upload**: `docker cp` to PostgreSQL container
3. **Restore**: `pg_restore` inside container

### Key Files:

- **Backup file**: `backup.dump` (custom PostgreSQL format)
- **SSH Key**: `C:\Users\User\Downloads\oracle\key.key`
- **Container**: `social-comm-postgres-dev`

### Safety Tips:

- ✅ Always backup before restore
- ✅ Stop app during restore
- ✅ Verify data after restore
- ✅ Keep multiple backup versions
- ❌ Never restore to production by accident!

---

**Need Help?** Check [database-management.md](database-management.md) for more detailed information.
