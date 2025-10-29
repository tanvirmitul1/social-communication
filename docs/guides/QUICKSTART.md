# Quick Start Guide

This guide will help you get the Social Communication backend up and running in minutes.

## Option 1: Docker (Recommended)

The fastest way to get started is using Docker Compose, which sets up everything for you.

### Prerequisites

- Docker
- Docker Compose

### Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd social-communication
```

2. **Copy environment file**

```bash
cp .env.example .env
```

3. **Start all services**

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database on port 5432
- Redis cache on port 6379
- Application server on port 3000

4. **Wait for services to be healthy** (about 30 seconds)

```bash
docker-compose ps
```

5. **Run database migrations**

```bash
docker-compose exec app pnpm prisma:migrate
```

6. **Seed the database** (optional)

```bash
docker-compose exec app pnpm prisma:seed
```

7. **Access the application**

- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- Health: http://localhost:3000/health

### Test Credentials (after seeding)

- Admin: `admin@socialcomm.com` / `Admin@123`
- User 1: `alice@example.com` / `User@123`
- User 2: `bob@example.com` / `User@123`

## Option 2: Local Development

If you prefer to run the services locally without Docker.

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 16
- Redis 7

### Steps

1. **Clone and install**

```bash
git clone <repository-url>
cd social-communication
pnpm install
```

2. **Setup PostgreSQL**

```bash
# Create database
createdb social_communication

# Or using psql
psql -U postgres
CREATE DATABASE social_communication;
\q
```

3. **Setup Redis**

```bash
# Start Redis server
redis-server
```

4. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

5. **Run migrations**

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

6. **Seed database** (optional)

```bash
pnpm prisma:seed
```

7. **Start development server**

```bash
pnpm dev
```

The server will start at http://localhost:3000

## Testing the API

### 1. Register a new user

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

Save the `accessToken` from the response.

### 3. Get current user

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Send a message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, World!",
    "receiverId": "RECEIVER_USER_ID"
  }'
```

## WebSocket Testing

You can test WebSocket connections using the Socket.IO client or tools like Postman.

### JavaScript Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN',
  },
});

socket.on('connect', () => {
  console.log('Connected to server');

  // Send a message
  socket.emit('message:send', {
    content: 'Hello via WebSocket!',
    receiverId: 'RECEIVER_USER_ID',
  });
});

socket.on('message:received', (data) => {
  console.log('New message:', data);
});
```

## Next Steps

- Explore the API documentation at http://localhost:3000/api/docs
- Read the main [README.md](README.md) for detailed information
- Check out the [docs/markdown/README.md](docs/markdown/README.md) for API reference
- Review the Prisma schema in [prisma/schema.prisma](prisma/schema.prisma)

## Troubleshooting

### Port already in use

If port 3000 is already in use, change the `PORT` in your `.env` file:

```env
PORT=4000
```

### Database connection error

Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/social_communication"
```

### Redis connection error

Ensure Redis is running:

```bash
redis-cli ping
# Should return: PONG
```

### Docker issues

Reset everything:

```bash
docker-compose down -v
docker-compose up -d --build
```

## Support

For issues and questions, please open an issue in the repository.
