# PostgreSQL Setup Guide for Windows

## Current Status

- ✅ PostgreSQL 18 is installed at: `C:\Program Files\PostgreSQL\18`
- ✅ PostgreSQL service is running: `postgresql-x64-18`
- ❌ Database connection failing: Authentication error

## Steps to Fix Database Connection

### Option 1: Reset PostgreSQL Password (Recommended)

1. **Find your PostgreSQL password**:
   - Check the password you set during PostgreSQL installation
   - If you don't remember it, you'll need to reset it

2. **Reset password using pgAdmin**:
   - Open pgAdmin (search for "pgAdmin 4" in Windows Start Menu)
   - Right-click on "PostgreSQL 18" server → Properties → Connection tab
   - Or change password via SQL:
     ```sql
     ALTER USER postgres WITH PASSWORD 'your-new-password';
     ```

3. **Update .env file**:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/social_communication?schema=public"
   ```

### Option 2: Use Environment Authentication

If PostgreSQL is configured for "trust" authentication on localhost:

1. **Connect without password to create user**:

   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```

2. **Create database**:

   ```sql
   CREATE DATABASE social_communication;
   ```

3. **Verify connection**:
   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d social_communication -c "SELECT version();"
   ```

### Option 3: Create New Database User

1. **Connect as postgres superuser**:

   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```

2. **Create new user and database**:

   ```sql
   CREATE USER social_app WITH PASSWORD 'secure_password_here';
   CREATE DATABASE social_communication OWNER social_app;
   GRANT ALL PRIVILEGES ON DATABASE social_communication TO social_app;
   ```

3. **Update .env file**:
   ```env
   DATABASE_URL="postgresql://social_app:secure_password_here@localhost:5432/social_communication?schema=public"
   ```

## After Fixing Password

Once you've updated the DATABASE_URL in .env with the correct password:

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations to create tables
pnpm prisma:migrate

# Optionally seed database with test data
pnpm prisma:seed
```

## Add PostgreSQL to PATH (Optional)

To use `psql` command directly without full path:

```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File scripts/setup-postgres-path.ps1
```

Then restart your terminal and you can use:

```bash
psql --version
```

## Verify Setup

After configuration, test the connection:

```bash
# Test with psql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d social_communication -c "SELECT version();"

# Or test via Prisma
pnpm prisma:studio
```

## Common Issues

### Authentication Failed

- **Cause**: Wrong password in DATABASE_URL
- **Fix**: Update password in .env file

### Database Does Not Exist

- **Cause**: Database not created yet
- **Fix**: Create database using psql or pgAdmin

### Connection Refused

- **Cause**: PostgreSQL service not running
- **Fix**: Start service via Services app or:
  ```bash
  net start postgresql-x64-18
  ```

## Quick Test Command

Test your database connection string:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres" -c "SELECT version();"
```

If this works, your password is correct and you just need to create the `social_communication` database.
