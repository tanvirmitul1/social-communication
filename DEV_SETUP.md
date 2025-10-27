# Development Setup

## Quick Start (Without Docker)

The application can run without PostgreSQL and Redis for basic development:

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
copy .env.example .env

# 3. Start development server
pnpm dev
```

The server will start at http://localhost:3002 with warnings about missing services.

## Full Setup (With Services)

### Option 1: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

### Option 2: Local Installation

Install PostgreSQL and Redis locally, then:

```bash
# Create database
createdb social_communication

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

## Available Endpoints

- API Documentation: http://localhost:3002/api/docs
- Health Check: http://localhost:3002/health
- API Base: http://localhost:3002/api/v1

## Troubleshooting

- **Database errors**: The app will warn but continue without database
- **Redis errors**: Caching and real-time features will be disabled
- **Port conflicts**: Change PORT in .env file
