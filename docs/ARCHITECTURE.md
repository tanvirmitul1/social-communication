# Architecture Documentation

## Overview

This application follows Clean Architecture principles with clear separation of concerns across multiple layers.

## Architecture Layers

### 1. Controllers Layer
**Location**: `app/controllers/`

Responsibilities:
- Handle HTTP requests and responses
- Request validation
- Call appropriate service methods
- Format responses using ResponseHandler

Example:
\`\`\`typescript
class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    return ResponseHandler.success(res, result);
  }
}
\`\`\`

### 2. Services Layer
**Location**: `app/services/`

Responsibilities:
- Business logic implementation
- Orchestrate operations across repositories
- Cache management
- Transaction handling

Example:
\`\`\`typescript
class AuthService {
  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    // Business logic here
    return { user, tokens };
  }
}
\`\`\`

### 3. Repository Layer
**Location**: `app/repositories/`

Responsibilities:
- Database operations
- Data access abstraction
- Query optimization

Example:
\`\`\`typescript
class UserRepository extends BaseRepository {
  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }
}
\`\`\`

### 4. Middleware Layer
**Location**: `app/middlewares/`

Responsibilities:
- Request preprocessing
- Authentication/Authorization
- Validation
- Error handling
- Rate limiting

## Design Patterns

### 1. Repository Pattern
Abstracts data access logic from business logic.

### 2. Dependency Injection
Using `tsyringe` for IoC container management.

\`\`\`typescript
@injectable()
class AuthService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository
  ) {}
}
\`\`\`

### 3. Factory Pattern
Used for creating complex objects like WebSocket connections.

### 4. Observer Pattern
Implemented in WebSocket event handling.

## Data Flow

\`\`\`
Client Request
    ↓
Middleware (Auth, Validation, Rate Limit)
    ↓
Routes
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Repository (Database)
    ↓
Database/Cache
\`\`\`

## Security Architecture

### Authentication Flow
1. User provides credentials
2. Server validates credentials
3. Server generates JWT access + refresh tokens
4. Client stores tokens
5. Client sends access token in Authorization header
6. Server validates token via middleware
7. Request proceeds to controller

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- Group-level permissions

## Caching Strategy

### User Data
- TTL: 1 hour
- Invalidation: On update/delete

### Messages
- TTL: 30 minutes
- Invalidation: On edit/delete

### Presence
- TTL: 5 minutes
- Auto-refresh on activity

## WebSocket Architecture

### Connection Flow
1. Client connects with JWT token
2. Server authenticates via middleware
3. User joins personal room (`user:{userId}`)
4. User can join group rooms (`group:{groupId}`)

### Event Handling
- Namespace-based routing
- Event-specific handlers
- Automatic error handling
- Broadcast to specific rooms

## Database Schema Design

### Key Relationships
- User → Messages (One-to-Many)
- User → Groups (Many-to-Many via GroupMember)
- Message → Reactions (One-to-Many)
- Call → Participants (One-to-Many)

### Indexes
Optimized for:
- User lookups (email, username)
- Message queries (groupId, receiverId, createdAt)
- Call history (initiatorId, status)

## Error Handling

### Error Hierarchy
\`\`\`
AppError (Base)
  ├── ValidationError
  ├── UnauthorizedError
  ├── ForbiddenError
  ├── NotFoundError
  └── ConflictError
\`\`\`

### Error Flow
1. Error thrown in service/repository
2. Caught by async handler wrapper
3. Passed to global error middleware
4. Formatted and returned to client

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Session data in Redis
- WebSocket scaling via Redis adapter

### Database Optimization
- Connection pooling
- Query optimization
- Proper indexing
- Read replicas (future)

### Caching
- Redis for frequently accessed data
- Cache invalidation strategy
- Cache warming

## Testing Strategy

### Unit Tests
- Service layer logic
- Utility functions
- Validation schemas

### Integration Tests
- API endpoints
- Database operations
- WebSocket events

### E2E Tests
- User flows
- Real-time features
- Call functionality

## Monitoring & Observability

### Health Checks
- Database connectivity
- Redis connectivity
- API availability

### Metrics
- Request rate
- Response time
- Error rate
- Active connections
- Database query performance

### Logging
- Structured logging with Pino
- Different log levels
- Request/Response logging
- Error stack traces

## Deployment Architecture

### Docker Containers
1. App container (Node.js)
2. PostgreSQL container
3. Redis container

### Environment Configuration
- Development
- Staging
- Production

### CI/CD Pipeline
1. Lint & Format check
2. Type checking
3. Unit tests
4. Integration tests
5. Build
6. Docker image creation
7. Deployment

## Future Enhancements

1. **Microservices**: Split into auth, messaging, and calling services
2. **Message Queue**: Add RabbitMQ/Kafka for async processing
3. **CDN**: For static assets and media files
4. **GraphQL**: Alternative API for flexible queries
5. **gRPC**: For service-to-service communication
6. **Kubernetes**: Container orchestration
7. **Read Replicas**: Database scaling
8. **ElasticSearch**: Advanced search capabilities
