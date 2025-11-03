# 🎯 HOW TO START YOUR PROJECT - Complete Guide

## ✅ What We Fixed & Improved

### 1. **Environment Configuration** ✨
- Created `.env.development` - Pre-configured for local development
- Created `.env.production.example` - Template for production
- Improved `.env.example` with better security notes
- **No manual configuration needed for development!**

### 2. **Docker Setup** 🐳
- **docker-compose.dev.yml** - Development (PostgreSQL + Redis only)
- **docker-compose.prod.yml** - Production (full stack with security)
- Improved **Dockerfile** with security (non-root user, health checks)

### 3. **Documentation** 📚
- **START_HERE.md** - Quick 5-minute setup guide
- **docs/guides/development-setup.md** - Complete development guide
- **docs/guides/production-deployment.md** - Oracle Cloud deployment guide
- All reorganized and consolidated

### 4. **Package.json Scripts** 🚀
Added 15+ new scripts for easier workflow (see below)

---

## 🚀 QUICK START (First Time Setup)

### Prerequisites
1. **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
2. **Node.js 20+** - [Download](https://nodejs.org/)
3. **pnpm** - Run: `npm install -g pnpm`

### Setup (5 Minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp .env.development .env

# 3. Start Docker services (PostgreSQL + Redis)
pnpm docker:dev:up

# 4. Setup database
pnpm setup:dev

# 5. Start development server
pnpm dev
```

### Verify It Works

Open browser:
- **Health**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/api/docs

**✅ Done! You're ready to develop!**

---

## 📋 All Available Commands

### Development Commands
```bash
pnpm dev                  # Start development server (hot reload)
pnpm dev:watch            # Alternative dev server with tsx watch
pnpm build                # Build for production
pnpm start                # Start production server
```

### Docker Commands (Development)
```bash
pnpm docker:dev:up        # Start PostgreSQL + Redis
pnpm docker:dev:down      # Stop services
pnpm docker:dev:logs      # View logs
```

### Docker Commands (Production)
```bash
pnpm docker:prod:up       # Start production stack
pnpm docker:prod:down     # Stop production stack
pnpm docker:prod:logs     # View production logs
```

### Database Commands
```bash
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations (dev)
pnpm prisma:migrate:deploy # Run migrations (production)
pnpm prisma:studio        # Open database GUI
pnpm prisma:seed          # Seed test data
pnpm prisma:reset         # Reset database (WARNING: deletes data!)
```

### Testing Commands
```bash
pnpm test                 # Run tests
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Run tests with coverage
pnpm test:ui              # Open Vitest UI
```

### Code Quality Commands
```bash
pnpm lint                 # Run ESLint
pnpm lint:fix             # Fix ESLint issues
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting
```

### Utility Commands
```bash
pnpm setup:dev            # Quick setup (install + generate + migrate)
pnpm setup:check          # Check if prerequisites are installed
pnpm docs:generate        # Generate API documentation
pnpm clean                # Remove dist and node_modules
pnpm clean:all            # Remove dist, node_modules, .env, logs, uploads
```

---

## 🎯 Daily Development Workflow

### Morning - Start Work
```bash
pnpm docker:dev:up        # Start Docker services
pnpm dev                  # Start development server
```

### During Development
```bash
# Make code changes
# Server auto-reloads

# View database
pnpm prisma:studio        # Opens GUI at localhost:5555

# View logs
pnpm docker:dev:logs

# Run tests
pnpm test:watch
```

### Evening - Stop Work
```bash
# Press Ctrl+C to stop dev server

pnpm docker:dev:down      # Stop Docker services
```

---

## 📊 What's Running?

When you use `pnpm docker:dev:up`:

| Service | Port | Container Name | Purpose |
|---------|------|----------------|---------|
| PostgreSQL | 5432 | social-comm-postgres-dev | Database |
| Redis | 6379 | social-comm-redis-dev | Cache |
| pgAdmin4 | 5050 | social-comm-pgadmin-dev | Database GUI |
| Your App | 3000 | (runs locally) | Backend API |

**Important**:
- Database, cache & pgAdmin run in Docker
- Your app runs locally (for hot reload)
- No local PostgreSQL/Redis installation needed!

---

## 🗂️ Project Structure

```
social-communication/
├── app/                           # Application code
│   ├── config/                   # Configuration
│   ├── controllers/              # HTTP handlers
│   ├── services/                 # Business logic
│   ├── repositories/             # Data access
│   ├── routes/                   # API routes
│   ├── sockets/                  # WebSocket handlers
│   └── middlewares/              # Express middleware
├── core/                          # Core utilities
│   ├── constants/
│   ├── errors/
│   ├── logger/
│   ├── utils/
│   └── validations/
├── docs/                          # Documentation
│   ├── getting-started/          # Setup guides
│   ├── api/                      # API documentation
│   ├── development/              # Dev guides
│   └── guides/                   # How-to guides
├── prisma/                        # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
├── tests/                         # Test files
├── .env.development              # Dev environment (pre-configured)
├── .env.production.example       # Prod environment template
├── docker-compose.dev.yml        # Development Docker
├── docker-compose.prod.yml       # Production Docker
├── Dockerfile                     # Production container
├── START_HERE.md                  # Quick start guide
└── HOW_TO_START.md               # This file
```

---

## 🗄️ Using pgAdmin4 (Database GUI)

### Access pgAdmin4

1. **Start Docker services** (if not already running):
   ```bash
   pnpm docker:dev:up
   ```

2. **Open pgAdmin4** in your browser:
   - URL: http://localhost:5050
   - Email: `admin@localhost.com`
   - Password: `admin`

### Connect to PostgreSQL Database

After logging into pgAdmin4:

1. **Right-click "Servers"** → **Register** → **Server**

2. **General Tab**:
   - Name: `Local Development` (or any name you prefer)

3. **Connection Tab**:
   - Host: `postgres` (this is the Docker container name)
   - Port: `5432`
   - Database: `social_communication`
   - Username: `postgres`
   - Password: `postgres`

4. **Click "Save"**

Now you can browse your database, run SQL queries, view tables, and manage data visually!

**Useful pgAdmin4 Features**:
- View all tables and relationships
- Run custom SQL queries
- Export/import data
- View query execution plans
- Monitor database activity

---

## 🐛 Troubleshooting

### "Docker is not running"
**Solution**: Start Docker Desktop

### "Cannot access pgAdmin4"
**Solution**:
```bash
# Check if pgAdmin4 container is running
docker ps | findstr pgadmin

# Restart services
pnpm docker:dev:down
pnpm docker:dev:up

# Check logs
pnpm docker:dev:logs
```

### "Port 3000 already in use"
```bash
# Find what's using it
netstat -ano | findstr :3000

# Or change port in .env
PORT=4000
```

### "Cannot connect to database"
```bash
# Restart Docker services
pnpm docker:dev:down
pnpm docker:dev:up

# Check logs
pnpm docker:dev:logs
```

### "Module not found" errors
```bash
rm -rf node_modules dist
pnpm install
pnpm prisma:generate
```

### More Issues?
Check [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md)

---

## 🚀 Production Deployment

### For Oracle Cloud VM

Follow the complete guide: [docs/guides/production-deployment.md](docs/guides/production-deployment.md)

**Quick Overview:**
1. Create Oracle Cloud VM (Ubuntu 22.04)
2. Install Docker on VM
3. Clone repository
4. Create `.env.prod` with secrets
5. Run: `pnpm docker:prod:up`
6. Configure Nginx + SSL
7. Set up backups

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [START_HERE.md](START_HERE.md) | Quick 5-minute setup |
| [docs/getting-started/quickstart.md](docs/getting-started/quickstart.md) | Fast setup with Docker |
| [docs/getting-started/installation.md](docs/getting-started/installation.md) | Detailed installation |
| [docs/guides/development-setup.md](docs/guides/development-setup.md) | Complete dev guide |
| [docs/guides/production-deployment.md](docs/guides/production-deployment.md) | Production deployment |
| [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md) | Common issues |
| [docs/api/overview.md](docs/api/overview.md) | API reference |
| [docs/api/examples.md](docs/api/examples.md) | Code examples |
| [docs/development/architecture.md](docs/development/architecture.md) | System architecture |

---

## 🔐 Environment Files Explained

### .env.development (Use this for local dev)
- ✅ Pre-configured for Docker
- ✅ Uses localhost for database/Redis
- ✅ Development-friendly settings
- ⚠️ NOT secure for production

### .env.production.example (Template for production)
- 📝 Copy to `.env.prod`
- 🔐 Requires strong secrets
- 🌐 Configure with your domain
- 🛡️ Production security settings

### .env.example (General template)
- 📚 Documentation purposes
- 💡 Shows all available options
- ⚙️ Default values

---

## 🎓 Learning Path

1. **Day 1: Setup**
   - Follow this guide
   - Get app running
   - Explore API docs at /api/docs

2. **Day 2: Understand**
   - Read [docs/development/architecture.md](docs/development/architecture.md)
   - Explore project structure
   - Try API examples

3. **Day 3: Develop**
   - Make your first feature
   - Run tests
   - Use Prisma Studio

4. **Week 2: Deploy**
   - Follow production guide
   - Deploy to Oracle Cloud
   - Set up monitoring

---

## ✅ Security Checklist

### Development
- [x] Use `.env.development` (not `.env.example`)
- [x] Never commit `.env` to git
- [x] Use Docker for isolation

### Production
- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Set strong database password
- [ ] Configure Redis password
- [ ] Update CORS_ORIGINS with your domain
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure firewall
- [ ] Set up backups
- [ ] Enable monitoring

---

## 🆘 Need Help?

1. **Check Docs**: Start with [START_HERE.md](START_HERE.md)
2. **Troubleshooting**: [docs/guides/troubleshooting.md](docs/guides/troubleshooting.md)
3. **API Reference**: http://localhost:3000/api/docs (when running)
4. **GitHub Issues**: Search or open new issue

---

## 🌟 Key Features

- ✅ Real-time messaging (WebSocket)
- ✅ Audio/video calls (Jitsi)
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ Clean architecture
- ✅ Full TypeScript
- ✅ Comprehensive tests
- ✅ API documentation
- ✅ Docker support
- ✅ Production ready

---

## 📝 Summary

**To start developing RIGHT NOW:**

```bash
pnpm install
pnpm docker:dev:up
pnpm setup:dev
pnpm dev
```

**Open**: http://localhost:3000/api/docs

**That's it! Happy coding! 🚀**

---

*Last updated: 2025-11-01*
*For latest documentation, check the /docs folder*
