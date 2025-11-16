# Quick Start Guide

Get up and running with the Social Communication Platform in 5 minutes.

## Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 13+
- Redis 6+
- pnpm (recommended) or npm/yarn
- Docker (optional, for containerized deployment)

## Installation Options

### Option 1: Manual Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-communication
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Generate Prisma client**
   ```bash
   pnpm prisma:generate
   ```

5. **Run database migrations**
   ```bash
   pnpm prisma:migrate
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

### Option 2: Docker Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-communication
   ```

2. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

## First Steps

1. **Access the API**: `http://localhost:3000`
2. **View API Documentation**: `http://localhost:3000/api/docs`
3. **Check Health**: `http://localhost:3000/health`

## API Testing

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

## WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-access-token',
  },
});

socket.on('connect', () => {
  console.log('Connected to server');
});
```

## Next Steps

- Read the [Complete API Documentation](../API_COMPLETE.md) for detailed API usage
- Check the [Authentication Guide](../guides/authentication.md) for implementation details
- Review the [Architecture Overview](../architecture/overview.md) to understand the system design