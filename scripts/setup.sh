#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Social Communication Backend Setup${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}pnpm is not installed${NC}"
    echo -e "${YELLOW}Installing pnpm...${NC}"
    npm install -g pnpm
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install pnpm${NC}"
        exit 1
    fi
    echo -e "${GREEN}pnpm installed successfully${NC}"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env

    # Generate secrets
    echo -e "${YELLOW}Generating JWT secrets...${NC}"
    ACCESS_SECRET=$(openssl rand -base64 32)
    REFRESH_SECRET=$(openssl rand -base64 32)

    # Update .env with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$ACCESS_SECRET|" .env
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$REFRESH_SECRET|" .env
    else
        # Linux
        sed -i "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$ACCESS_SECRET|" .env
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$REFRESH_SECRET|" .env
    fi

    echo -e "${GREEN}.env file created with generated secrets${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies installed${NC}"

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
pnpm prisma:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate Prisma client${NC}"
    exit 1
fi
echo -e "${GREEN}Prisma client generated${NC}"

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if pg_isready &> /dev/null; then
    echo -e "${GREEN}PostgreSQL is running${NC}"

    # Run migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    pnpm prisma:migrate

    # Seed database
    echo -e "${YELLOW}Seeding database...${NC}"
    pnpm prisma:seed

    echo -e "${GREEN}Database setup complete${NC}"
else
    echo -e "${YELLOW}PostgreSQL is not running or not accessible${NC}"
    echo -e "${YELLOW}You'll need to:${NC}"
    echo -e "1. Start PostgreSQL"
    echo -e "2. Run: pnpm prisma:migrate"
    echo -e "3. Run: pnpm prisma:seed (optional)"
fi

# Check if Redis is running
echo -e "${YELLOW}Checking Redis connection...${NC}"
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}Redis is running${NC}"
else
    echo -e "${YELLOW}Redis is not running or not accessible${NC}"
    echo -e "${YELLOW}Please start Redis before running the application${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Make sure PostgreSQL and Redis are running"
echo -e "2. Run: ${GREEN}pnpm dev${NC} to start the development server"
echo -e "3. Visit: ${GREEN}http://localhost:3000/api/docs${NC} for API documentation"
echo ""
echo -e "${YELLOW}Test credentials (after seeding):${NC}"
echo -e "Email: ${GREEN}admin@example.com${NC} | Password: ${GREEN}Admin1234${NC}"
echo -e "Email: ${GREEN}john@example.com${NC} | Password: ${GREEN}User1234${NC}"
echo ""
