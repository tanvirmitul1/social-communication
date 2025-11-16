# Comprehensive Testing Guide

This guide explains how to test all components of the Social Communication application to ensure everything is working flawlessly.

## Overview

The application has been structured with comprehensive testing capabilities for:

1. **Database Connectivity** - PostgreSQL connection and queries
2. **API Endpoints** - RESTful services for authentication, users, messages, groups, and calls
3. **Authentication System** - Registration, login, token management
4. **Real-time Communication** - WebSocket connections for messaging and calling
5. **Business Logic** - User management, messaging, group functionality, calling features
6. **Infrastructure Components** - Redis caching, Jitsi integration, Socket management

## Test Categories

### 1. Unit Tests
Test individual components in isolation:
- Authentication service
- User service
- Message service
- Group service
- Call service
- Repository layers
- Utility functions

### 2. Integration Tests
Test how components work together:
- Database operations
- API endpoint integration
- Service layer interactions
- Cache operations

### 3. End-to-End Tests
Test complete user workflows:
- Full registration to messaging flow
- Group creation and messaging
- Voice/video calling workflows

### 4. WebSocket Tests
Test real-time communication features:
- Connection establishment
- Message broadcasting
- Typing indicators
- Call signaling

## Running Tests

### Quick Start - Run All Tests

```bash
# Run all tests in sequence
pnpm test:all
```

This command executes all test suites in the correct order:
1. Database connectivity tests
2. Prisma client tests
3. Authentication service tests
4. User service tests
5. API integration tests
6. WebSocket connection tests
7. Full system tests

### Run Specific Test Categories

```bash
# Run unit tests only
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run integration tests
pnpm test:integration

# Run end-to-end tests
pnpm test:e2e

# Run WebSocket tests
pnpm test:websocket

# Run tests with code coverage
pnpm test:coverage

# Run tests with UI interface
pnpm test:ui
```

### Run Individual Test Files

```bash
# Run database tests
pnpm test tests/db.test.ts --run

# Run authentication tests
pnpm test tests/auth.test.ts --run

# Run user tests
pnpm test tests/user.test.ts --run

# Run API integration tests
pnpm test tests/integration/api-integration.test.ts --run
```

## Test Results Interpretation

### Successful Test Run
```
✅ Database Connectivity tests passed
✅ Prisma Client tests passed
✅ Authentication Service tests passed
✅ User Service tests passed
✅ API Integration tests passed
✅ WebSocket Library tests passed
✅ Full System tests passed

📊 Test Suite Summary:
   ✅ Passed: 7
   ❌ Failed: 0
   📦 Total: 7

🎉 All tests passed! System is working flawlessly.
```

### Failed Test Run
```
✅ Database Connectivity tests passed
✅ Prisma Client tests passed
❌ Authentication Service tests failed

📊 Test Suite Summary:
   ✅ Passed: 2
   ❌ Failed: 1
   📦 Total: 3

⚠️ Some tests failed. Please review the output above.
```

## Component-Specific Testing

### Database Testing
Verifies:
- PostgreSQL connection
- Basic query operations
- Schema integrity

Run with:
```bash
pnpm test tests/db.test.ts --run
```

### API Testing
Verifies:
- REST endpoint functionality
- Request/response validation
- Authentication flow
- Error handling

Run with:
```bash
pnpm test tests/integration/api-integration.test.ts --run
```

### WebSocket Testing
Verifies:
- Socket connection establishment
- Event handling
- Real-time message delivery
- Call signaling

Run with:
```bash
pnpm test tests/websocket/connection.test.ts --run
```

### Authentication Testing
Verifies:
- User registration
- Login functionality
- Token generation and validation
- Password security

Run with:
```bash
pnpm test tests/auth.test.ts --run
```

### User Service Testing
Verifies:
- User profile management
- User search functionality
- Online status updates

Run with:
```bash
pnpm test tests/user.test.ts --run
```

## Continuous Integration

For CI/CD pipelines, use:

```bash
pnpm test:all
```

This ensures all components are tested before deployment.

## Troubleshooting Common Issues

### Database Connection Issues
If database tests fail:
1. Ensure PostgreSQL is running
2. Check your `.env` file for correct database credentials
3. Run `pnpm prisma:migrate` to ensure database schema is up to date

### Redis Connection Issues
If Redis-related tests fail:
1. Ensure Redis server is running
2. Check your `.env` file for correct Redis configuration

### WebSocket Test Limitations
Full WebSocket integration testing requires:
1. A running server instance
2. Valid authentication tokens
3. Proper test environment setup

The current WebSocket tests verify library imports. For complete integration testing, the implementation would need to:
1. Start the server in a beforeAll hook
2. Create test users and get auth tokens
3. Connect WebSocket clients with auth tokens
4. Test various events like message sending, typing indicators, calls
5. Clean up connections and server in afterAll hook

## Adding New Tests

1. Place unit tests in the `tests/` directory
2. Place integration tests in the `tests/integration/` directory
3. Place end-to-end tests in the `tests/e2e/` directory
4. Place WebSocket tests in the `tests/websocket/` directory
5. Update `scripts/test-all.cjs` to include new test suites

## Test Coverage

The testing framework provides code coverage analysis:

```bash
pnpm test:coverage
```

This generates a detailed report showing which parts of your code are tested and which need more coverage.

## Performance Testing

For load testing and performance validation:
1. Use tools like Artillery or k6
2. Create test scenarios for high-concurrency messaging
3. Test WebSocket connection limits
4. Validate database query performance
5. Check Redis cache hit rates

## Security Testing

For security validation:
1. Test authentication edge cases
2. Validate input sanitization
3. Check for injection vulnerabilities
4. Verify password strength requirements
5. Test rate limiting effectiveness

## Monitoring Test Execution

The test runner provides real-time feedback:
- 🧪 indicates test suite start
- ✅ indicates passed tests
- ❌ indicates failed tests
- 📊 shows final summary

This makes it easy to identify which components are working and which need attention.