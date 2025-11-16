#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner
 * 
 * This script runs all tests in the correct order:
 * 1. Unit tests
 * 2. Integration tests
 * 3. End-to-end tests
 * 4. Database connectivity tests
 * 5. API tests
 * 6. WebSocket tests
 */

import { execSync } from 'child_process';
import { logger } from '../config/logger.js';

// Test suites in order of execution
const TEST_SUITES = [
  { name: 'Database Connectivity', command: 'pnpm test tests/db.test.ts' },
  { name: 'Prisma Client', command: 'pnpm test tests/prisma.test.ts' },
  { name: 'Authentication Service', command: 'pnpm test tests/auth.test.ts' },
  { name: 'User Service', command: 'pnpm test tests/user.test.ts' },
  { name: 'API Integration', command: 'pnpm test tests/integration/api-integration.test.ts' },
  { name: 'WebSocket Library', command: 'pnpm test tests/websocket/connection.test.ts' },
  { name: 'Full System', command: 'pnpm test tests/e2e/full-system.test.ts' },
];

async function runAllTests() {
  logger.info('🚀 Starting comprehensive test suite...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const suite of TEST_SUITES) {
    try {
      logger.info(`🧪 Running ${suite.name} tests...`);
      execSync(suite.command, { stdio: 'inherit' });
      logger.info(`✅ ${suite.name} tests passed\n`);
      passedTests++;
    } catch (_error) {
      logger.error(`❌ ${suite.name} tests failed\n`);
      failedTests++;
    }
  }
  
  // Summary
  logger.info('📊 Test Suite Summary:');
  logger.info(`   ✅ Passed: ${passedTests}`);
  logger.info(`   ❌ Failed: ${failedTests}`);
  logger.info(`   📦 Total: ${TEST_SUITES.length}`);
  
  if (failedTests > 0) {
    logger.error('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    logger.info('\n🎉 All tests passed! System is working flawlessly.');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch((error) => {
    logger.error('Test runner failed:', error);
    process.exit(1);
  });
}