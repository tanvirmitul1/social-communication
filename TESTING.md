# Comprehensive Testing Guide

This document explains how to test all components of the Social Communication application to ensure everything is working flawlessly.

## Test Categories

1. **Unit Tests** - Test individual components in isolation
2. **Integration Tests** - Test how components work together
3. **End-to-End Tests** - Test complete user workflows
4. **Database Tests** - Test database connectivity and operations
5. **API Tests** - Test REST API endpoints
6. **WebSocket Tests** - Test real-time communication features

## Running Tests

### Run All Tests

To run all tests in the correct order:

```bash
pnpm test:all
```

This command executes:
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
pnpm test tests/db.test.ts

# Run authentication tests
pnpm test tests/auth.test.ts

# Run user tests
pnpm test tests/user.test.ts

# Run API integration tests
pnpm test tests/integration/api-integration.test.ts
```

## Test Results

After running tests, you'll see output like:

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

## Continuous Integration

For CI/CD pipelines, use:

```bash
pnpm test:all
```

This ensures all components are tested before deployment.

## Troubleshooting

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

The current WebSocket tests verify library imports. For complete integration testing, you would need to:
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
5. Update `scripts/test-all.ts` to include new test suites