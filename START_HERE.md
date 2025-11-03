# 🚀 START HERE - Complete Setup Guide

Welcome! This guide will help you set up and run the Social Communication backend **without any prior database or Docker configuration**.

## ⚡ Quick Start (5 Minutes)

### Prerequisites

You only need:

1. **Docker Desktop** - [Download Here](https://www.docker.com/products/docker-desktop/)
2. **Node.js 20+** - [Download Here](https://nodejs.org/)
3. **pnpm** - Install with: `npm install -g pnpm`

That's it! No PostgreSQL or Redis installation needed.

### Setup Steps

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker services (PostgreSQL + Redis)
pnpm docker:dev:up

# 3. Setup database
pnpm prisma:generate
pnpm prisma:migrate

# 4. (Optional) Add test data
pnpm prisma:seed

# 5. Start development server
pnpm dev
```

**Or use the quick setup command:**

```bash
pnpm install
pnpm docker:dev:up
pnpm setup:dev  # Runs generate + migrate
pnpm dev
```

### Verify It Works

Open your browser:

1. **Health Check**: http://localhost:3000/health
   - Should show: `{"status":"ok",...}`

2. **API Documentation**: http://localhost:3000/api/docs
   - Interactive Swagger UI

3. **Test Registration**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Test@123\"}"
   ```

🎉 **Done!** Your backend is running!

## 📁 What's Running?

When you run the startup script:

- ✅ **PostgreSQL Database** - Running in Docker on port 5432
- ✅ **Redis Cache** - Running in Docker on port 6379
- ✅ **pgAdmin4** - Database GUI in Docker on port 5050
- ✅ **Your App** - Running locally on port 3000

You don't need to configure anything - it just works!

## 🛑 Stop Services

```bash
pnpm docker:dev:down
```

## 📚 Next Steps

### For Development

1. **Read the Development Guide**
   - [docs/guides/development-setup.md](docs/guides/development-setup.md)
   - Learn about the development workflow
   - Understand the project structure

2. **Explore the API**
   - [docs/api/overview.md](docs/api/overview.md)
   - [docs/api/examples.md](docs/api/examples.md)
   - Interactive docs: http://localhost:3000/api/docs

3. **Understand the Architecture**
   - [docs/development/architecture.md](docs/development/architecture.md)
   - Learn about the 5-layer clean architecture

### For Production Deployment

1. **Read the Deployment Guide**
   - [docs/guides/production-deployment.md](docs/guides/production-deployment.md)
   - Complete guide for Oracle Cloud VM
   - Includes SSL, Nginx, security hardening

## 🔧 Common Tasks

### View Database

You have two options for viewing your database:

**Option 1: pgAdmin4 (Recommended for PostgreSQL)**

- URL: http://localhost:5050
- Login: `admin@localhost.com` / `admin`
- Connect to server:
  - Host: `postgres`
  - Port: `5432`
  - Database: `social_communication`
  - Username: `postgres`
  - Password: `postgres`

**Option 2: Prisma Studio (Prisma ORM GUI)**

```bash
pnpm prisma:studio
# Opens at: http://localhost:5555
```

### Reset Database

```bash
# WARNING: Deletes all data and resets to initial state
pnpm prisma migrate reset
```

### View Logs

```bash
# Docker services
docker-compose -f docker-compose.dev.yml logs -f

# Just PostgreSQL
docker-compose -f docker-compose.dev.yml logs -f postgres

# Just Redis
docker-compose -f docker-compose.dev.yml logs -f redis
```

### Run Tests

```bash
pnpm test
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## 🐛 Troubleshooting

### "Docker is not running"

**Solution**: Start Docker Desktop application

### "Port 3000 is already in use"

**Solution**:

```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Or change port in .env
PORT=4000
```

### "Module not found" errors

**Solution**:

```bash
rm -rf node_modules dist
pnpm install
pnpm prisma:generate
```

### More Issues?

Check the [Troubleshooting Guide](docs/guides/troubleshooting.md)

## 📖 Documentation Structure

```
docs/
├── getting-started/
│   ├── quickstart.md          # Fast setup guide
│   ├── installation.md        # Detailed installation
│   └── postgres-setup.md      # PostgreSQL setup (if needed)
├── api/
│   ├── overview.md            # Complete API reference
│   └── examples.md            # Practical examples
├── development/
│   ├── architecture.md        # System architecture
│   └── setup.md               # Development setup
└── guides/
    ├── development-setup.md   # Complete dev guide
    ├── production-deployment.md  # Oracle Cloud deployment
    └── troubleshooting.md     # Common issues
```

## 🔐 Environment Files

- `.env.development` - Pre-configured for local development
- `.env.production.example` - Template for production
- `.env.example` - General template

The `.env` file is automatically created from `.env.development` when you run the startup script.

## 🐳 Docker Compose Files

- `docker-compose.dev.yml` - Development (PostgreSQL + Redis only)
- `docker-compose.prod.yml` - Production (full stack with security)
- `docker-compose.yml` - Legacy (being replaced)

## 📝 Available Scripts

```bash
# Development
pnpm dev                # Start dev server with hot reload
pnpm build              # Build for production
pnpm start              # Start production server

# Database
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run migrations
pnpm prisma:studio      # Open database GUI
pnpm prisma:seed        # Seed database with test data

# Testing
pnpm test               # Run tests
pnpm test:coverage      # Run tests with coverage
pnpm test:ui            # Open test UI

# Code Quality
pnpm lint               # Run ESLint
pnpm lint:fix           # Fix ESLint issues
pnpm format             # Format with Prettier

# Docker
pnpm docker:build       # Build Docker image
pnpm docker:up          # Start Docker containers
pnpm docker:down        # Stop Docker containers
pnpm docker:logs        # View Docker logs
```

## 🎯 Development Workflow

### Daily Development

```bash
# Morning: Start services
pnpm docker:dev:up

# Start coding
pnpm dev

# Evening: Stop services
pnpm docker:dev:down
```

### Making Database Changes

1. Edit `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name your_change_name`
3. Prisma client auto-updates
4. Restart dev server if needed

### Before Committing

```bash
pnpm lint
pnpm format
pnpm test
```

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Generate strong JWT secrets: `openssl rand -base64 64`
- [ ] Set strong database passwords
- [ ] Configure Redis password
- [ ] Update CORS_ORIGINS with your domain
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Set up backups
- [ ] Configure monitoring

See [Production Deployment Guide](docs/guides/production-deployment.md) for details.

## 🆘 Need Help?

1. **Check Documentation**
   - Start with this file
   - Read [Development Setup](docs/guides/development-setup.md)
   - Check [Troubleshooting](docs/guides/troubleshooting.md)

2. **Common Issues**
   - Docker not running → Start Docker Desktop
   - Port in use → Change PORT in .env
   - Module errors → Delete node_modules, run pnpm install

3. **Still Stuck?**
   - Check error logs
   - Review GitHub issues
   - Open a new issue with error details

## 🌟 Features

- ✅ Real-time messaging (WebSocket)
- ✅ Audio/video calls (Jitsi)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ Rate limiting
- ✅ API documentation (Swagger)
- ✅ Docker support
- ✅ Clean architecture
- ✅ TypeScript
- ✅ Comprehensive tests

## 📊 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Video**: Jitsi Meet
- **Auth**: JWT + Argon2
- **Validation**: Zod
- **Testing**: Vitest
- **Docs**: Swagger/OpenAPI

## 🎓 Learning Resources

- **Architecture**: [docs/development/architecture.md](docs/development/architecture.md)
- **API Reference**: http://localhost:3000/api/docs (when running)
- **Code Examples**: [docs/api/examples.md](docs/api/examples.md)

## ✨ What Makes This Project Special?

1. **Zero Configuration** - Works out of the box with Docker
2. **Production Ready** - Security, monitoring, backups included
3. **Clean Architecture** - 5-layer separation of concerns
4. **Type Safe** - Full TypeScript coverage
5. **Well Documented** - Comprehensive guides for everything
6. **Easy Deployment** - One-command Docker deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT

---

**Ready to build something awesome? Start coding! 🚀**
