# PowerShell Setup Script for Windows

Write-Host "======================================" -ForegroundColor Green
Write-Host "Social Communication Backend Setup" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if pnpm is installed
try {
    $null = Get-Command pnpm -ErrorAction Stop
    Write-Host "pnpm is already installed" -ForegroundColor Green
} catch {
    Write-Host "pnpm is not installed" -ForegroundColor Red
    Write-Host "Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install pnpm" -ForegroundColor Red
        exit 1
    }
    Write-Host "pnpm installed successfully" -ForegroundColor Green
}

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env

    # Generate secrets
    Write-Host "Generating JWT secrets..." -ForegroundColor Yellow
    $ACCESS_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    $REFRESH_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

    # Update .env with generated secrets
    (Get-Content .env) | ForEach-Object {
        $_ -replace 'JWT_ACCESS_SECRET=.*', "JWT_ACCESS_SECRET=$ACCESS_SECRET" `
           -replace 'JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=$REFRESH_SECRET"
    } | Set-Content .env

    Write-Host ".env file created with generated secrets" -ForegroundColor Green
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Yellow
pnpm prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "Prisma client generated" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
try {
    $null = & pg_isready 2>&1
    Write-Host "PostgreSQL is running" -ForegroundColor Green

    # Run migrations
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    pnpm prisma:migrate

    # Seed database
    Write-Host "Seeding database..." -ForegroundColor Yellow
    pnpm prisma:seed

    Write-Host "Database setup complete" -ForegroundColor Green
} catch {
    Write-Host "PostgreSQL is not running or not accessible" -ForegroundColor Yellow
    Write-Host "You'll need to:" -ForegroundColor Yellow
    Write-Host "1. Start PostgreSQL" -ForegroundColor White
    Write-Host "2. Run: pnpm prisma:migrate" -ForegroundColor White
    Write-Host "3. Run: pnpm prisma:seed (optional)" -ForegroundColor White
}

# Check if Redis is running
Write-Host "Checking Redis connection..." -ForegroundColor Yellow
try {
    $redisCheck = & redis-cli ping 2>&1
    if ($redisCheck -eq "PONG") {
        Write-Host "Redis is running" -ForegroundColor Green
    } else {
        throw "Redis not responding"
    }
} catch {
    Write-Host "Redis is not running or not accessible" -ForegroundColor Yellow
    Write-Host "Please start Redis before running the application" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure PostgreSQL and Redis are running" -ForegroundColor White
Write-Host "2. Run: " -NoNewline -ForegroundColor White
Write-Host "pnpm dev" -ForegroundColor Green -NoNewline
Write-Host " to start the development server" -ForegroundColor White
Write-Host "3. Visit: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000/api/docs" -ForegroundColor Green -NoNewline
Write-Host " for API documentation" -ForegroundColor White
Write-Host ""
Write-Host "Test credentials (after seeding):" -ForegroundColor Yellow
Write-Host "Email: " -NoNewline -ForegroundColor White
Write-Host "admin@example.com" -ForegroundColor Green -NoNewline
Write-Host " | Password: " -NoNewline -ForegroundColor White
Write-Host "Admin1234" -ForegroundColor Green
Write-Host "Email: " -NoNewline -ForegroundColor White
Write-Host "john@example.com" -ForegroundColor Green -NoNewline
Write-Host " | Password: " -NoNewline -ForegroundColor White
Write-Host "User1234" -ForegroundColor Green
Write-Host ""
