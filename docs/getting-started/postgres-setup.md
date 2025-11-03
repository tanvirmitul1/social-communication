# PostgreSQL Setup Guide for Windows

## Current Status

This guide helps you set up PostgreSQL on Windows for the Social Communication backend.

## Prerequisites

- Windows 10 or higher
- PostgreSQL 16+ installed

## Installation

### Download and Install PostgreSQL

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set a password for the `postgres` user (remember this!)
   - Default port: 5432
   - Default locale: English, United States
4. Complete the installation

## Configuration

### Option 1: Reset PostgreSQL Password (Recommended)

If you forgot your PostgreSQL password or need to reset it:

1. **Using pgAdmin**:
   - Open pgAdmin (search for "pgAdmin 4" in Windows Start Menu)
   - Right-click on "PostgreSQL 18" server → Properties → Connection tab
   - Or change password via SQL:
     ```sql
     ALTER USER postgres WITH PASSWORD 'your-new-password';
     ```

2. **Update .env file**:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/social_communication?schema=public"
   ```

### Option 2: Create New Database User

For better security, create a dedicated user for the application:

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

### Option 3: Use Environment Authentication

If PostgreSQL is configured for "trust" authentication on localhost:

1. **Connect without password to create database**:

   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```

2. **Create database**:

   ```sql
   CREATE DATABASE social_communication;
   \q
   ```

3. **Verify connection**:
   ```bash
   "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d social_communication -c "SELECT version();"
   ```

## Setup Steps

### 1. Create the Database

```bash
# Using psql
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Then in psql:
CREATE DATABASE social_communication;
\l  # List databases to verify
\q  # Quit
```

### 2. Verify Connection

Test your DATABASE_URL connection string:

```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" "postgresql://postgres:YOUR_PASSWORD@localhost:5432/social_communication" -c "SELECT version();"
```

If this works, your connection string is correct!

### 3. Run Migrations

Once the database is created and connection verified:

```bash
# From project root
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed  # Optional: add test data
```

## Add PostgreSQL to PATH (Optional)

To use `psql` command directly without full path:

### Manual Method

1. Open "Environment Variables":
   - Right-click "This PC" → Properties
   - Advanced system settings → Environment Variables
2. Under "System variables", find "Path" and click Edit
3. Click "New" and add:
   ```
   C:\Program Files\PostgreSQL\18\bin
   ```
4. Click OK on all dialogs
5. Restart your terminal

### PowerShell Script Method

```powershell
# Run as Administrator
$pgPath = "C:\Program Files\PostgreSQL\18\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$pgPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgPath", "Machine")
    Write-Host "PostgreSQL added to PATH. Please restart your terminal."
} else {
    Write-Host "PostgreSQL is already in PATH."
}
```

After adding to PATH, restart your terminal and test:

```bash
psql --version
```

## Docker Alternative

If you prefer not to install PostgreSQL locally, use Docker:

```bash
# Start PostgreSQL in Docker
docker-compose up -d postgres

# The connection string is already configured in .env.example
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/social_communication?schema=public"
```

## Verify Setup

### Check PostgreSQL Service

```bash
# Check if service is running
net start | findstr postgres

# Start service if not running
net start postgresql-x64-18
```

### Test Connection with psql

```bash
# List all databases
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -l

# Connect to database
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d social_communication

# In psql, run:
\dt  # List tables (should be empty before migrations)
\q   # Quit
```

### Test with Prisma Studio

```bash
pnpm prisma:studio
```

This will open a GUI at http://localhost:5555 to view your database.

## Common Issues

### Authentication Failed

- **Cause**: Wrong password in DATABASE_URL
- **Fix**:
  1. Reset password using pgAdmin
  2. Update `.env` file with correct password
  3. Verify with test connection

### Database Does Not Exist

- **Cause**: Database not created yet
- **Fix**:
  ```bash
  "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
  CREATE DATABASE social_communication;
  ```

### Connection Refused

- **Cause**: PostgreSQL service not running
- **Fix**: Start the service
  ```bash
  net start postgresql-x64-18
  ```

### Port 5432 Already in Use

- **Cause**: Another PostgreSQL instance or service using the port
- **Fix**:
  1. Check running services: `netstat -ano | findstr :5432`
  2. Either stop the other service or change PostgreSQL port in `postgresql.conf`

### pg_hba.conf Authentication Issues

If you get authentication errors even with correct password:

1. Find `pg_hba.conf`:

   ```
   C:\Program Files\PostgreSQL\18\data\pg_hba.conf
   ```

2. Edit the file (as Administrator) and ensure this line exists:

   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```

3. Restart PostgreSQL service:
   ```bash
   net stop postgresql-x64-18
   net start postgresql-x64-18
   ```

## Quick Test Command

After setup, test everything works:

```bash
# Test connection
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d social_communication -c "SELECT current_database(), current_user, version();"
```

You should see output showing the database name, user, and PostgreSQL version.

## Using Docker Instead

If Windows PostgreSQL setup is problematic, use Docker:

```bash
# Start only PostgreSQL
docker-compose up -d postgres

# Check logs
docker-compose logs postgres

# Access psql in Docker
docker-compose exec postgres psql -U postgres -d social_communication
```

## Next Steps

Once PostgreSQL is set up:

1. ✅ Verify `DATABASE_URL` in `.env` is correct
2. ✅ Run `pnpm prisma:generate` to generate Prisma client
3. ✅ Run `pnpm prisma:migrate` to create tables
4. ✅ Run `pnpm prisma:seed` to add test data (optional)
5. ✅ Start the development server with `pnpm dev`

## Support

For PostgreSQL-specific issues:

- Check official docs: https://www.postgresql.org/docs/
- Stack Overflow: https://stackoverflow.com/questions/tagged/postgresql
- Project issues: Open a GitHub issue with your error details
