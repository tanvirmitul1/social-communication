# Getting Started

Welcome to the Social Communication Backend! This guide will help you get up and running quickly.

## Prerequisites

- **Node.js** 20 or higher
- **pnpm** 8 or higher (we'll install this for you)
- **PostgreSQL** 16 or higher
- **Redis** 7 or higher

## Quick Start (Automated Setup)

### Windows (PowerShell)

\`\`\`powershell
.\scripts\setup.ps1
\`\`\`

### Linux/macOS (Bash)

\`\`\`bash
chmod +x scripts/setup.sh
./scripts/setup.sh
\`\`\`

The setup script will:

- Install pnpm if needed
- Create .env file with secure secrets
- Install dependencies
- Generate Prisma client
- Run database migrations
- Seed database with test data

## Manual Setup

If you prefer to set up manually:

### 1. Install pnpm

\`\`\`bash
npm install -g pnpm
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and set:

- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Random secret (generate with: `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET` - Another random secret

### 4. Set Up Database

\`\`\`bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed # Optional: adds test data
\`\`\`

### 5. Start Development Server

\`\`\`bash
pnpm dev
\`\`\`

The server will start at `http://localhost:3000`

## Docker Setup (Easiest!)

If you have Docker installed:

\`\`\`bash

# Copy environment file

cp .env.example .env

# Edit .env and set JWT secrets (the rest will work with defaults)

# Start everything

docker-compose up -d

# View logs

docker-compose logs -f app
\`\`\`

This starts:

- PostgreSQL database
- Redis cache
- The application

## Verify Installation

### 1. Check Health

\`\`\`bash
curl http://localhost:3000/health
\`\`\`

Expected response:
\`\`\`json
{
"status": "ok",
"timestamp": "2024-01-01T00:00:00.000Z",
"uptime": 123.45,
"environment": "development"
}
\`\`\`

### 2. View API Documentation

Open in browser: `http://localhost:3000/api/docs`

### 3. Test API

#### Register a User

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/auth/register \\
-H "Content-Type: application/json" \\
-d '{
"username": "testuser",
"email": "test@example.com",
"password": "Test1234"
}'
\`\`\`

#### Login

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/auth/login \\
-H "Content-Type: application/json" \\
-d '{
"email": "test@example.com",
"password": "Test1234"
}'
\`\`\`

Save the `accessToken` from the response!

#### Get Profile

\`\`\`bash
curl http://localhost:3000/api/v1/auth/profile \\
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

## Test Credentials (After Seeding)

If you ran `pnpm prisma:seed`, you have these test accounts:

| Email             | Password  | Role  |
| ----------------- | --------- | ----- |
| admin@example.com | Admin1234 | ADMIN |
| john@example.com  | User1234  | USER  |
| jane@example.com  | User1234  | USER  |
| bob@example.com   | User1234  | USER  |

## Common Commands

### Development

\`\`\`bash
pnpm dev # Start dev server with hot reload
pnpm build # Build for production
pnpm start # Start production server
\`\`\`

### Database

\`\`\`bash
pnpm prisma:generate # Generate Prisma client
pnpm prisma:migrate # Run migrations
pnpm prisma:studio # Open database GUI
pnpm prisma:seed # Seed database
\`\`\`

### Code Quality

\`\`\`bash
pnpm lint # Lint code
pnpm lint:fix # Fix linting issues
pnpm format # Format code
pnpm test # Run tests
pnpm test:coverage # Run tests with coverage
\`\`\`

### Docker

\`\`\`bash
pnpm docker:build # Build Docker image
pnpm docker:up # Start containers
pnpm docker:down # Stop containers
pnpm docker:logs # View logs
\`\`\`

## Project Structure

\`\`\`
social-communication/
├── app/ # Application code
│ ├── config/ # Configuration
│ ├── controllers/ # HTTP handlers
│ ├── services/ # Business logic
│ ├── repositories/ # Data access
│ ├── routes/ # API routes
│ ├── sockets/ # WebSocket handlers
│ └── middlewares/ # Express middleware
├── core/ # Core utilities
│ ├── utils/
│ ├── errors/
│ ├── logger/
│ ├── validations/
│ └── constants/
├── docs/ # Documentation
├── prisma/ # Database schema
├── tests/ # Test files
└── main.ts # Entry point
\`\`\`

## Next Steps

1. **Explore the API**
   - Visit http://localhost:3000/api/docs
   - Try the interactive API documentation

2. **Read the Documentation**
   - [Setup Guide](docs/SETUP_GUIDE.md)
   - [Architecture](docs/ARCHITECTURE.md)
   - [API Examples](docs/API_EXAMPLES.md)

3. **Build a Frontend**
   - Connect to REST API
   - Connect to WebSocket
   - Integrate Jitsi for video calls

4. **Customize**
   - Add more features
   - Modify existing functionality
   - Deploy to production

## Troubleshooting

### Port 3000 already in use

Change `PORT` in `.env`:
\`\`\`env
PORT=4000
\`\`\`

### Can't connect to database

1. Make sure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Verify database exists

### Can't connect to Redis

1. Make sure Redis is running
2. Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### TypeScript errors

\`\`\`bash
pnpm prisma:generate # Regenerate Prisma client
rm -rf node_modules # Delete and reinstall
pnpm install
\`\`\`

## Need Help?

- Check the [Setup Guide](docs/SETUP_GUIDE.md)
- Review [API Examples](docs/API_EXAMPLES.md)
- Open an issue on GitHub

## What's Included

✅ Complete REST API with 39 endpoints
✅ Real-time WebSocket messaging
✅ Video/audio calling (Jitsi)
✅ User authentication (JWT)
✅ Group chat with permissions
✅ Message reactions and threading
✅ Typing indicators
✅ Online presence
✅ Redis caching
✅ Rate limiting
✅ API documentation (Swagger)
✅ Docker support
✅ CI/CD pipeline
✅ Test framework
✅ Production-ready

Happy coding! 🚀
