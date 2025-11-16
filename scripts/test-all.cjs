#!/usr/bin/env node

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

const { execSync } = require('child_process');

// Test suites in order of execution
const TEST_SUITES = [
  { name: 'Database Connectivity', command: 'pnpm test tests/db.test.ts --run' },
  { name: 'Prisma Client', command: 'pnpm test tests/prisma.test.ts --run' },
  { name: 'Authentication Service', command: 'pnpm test tests/auth.test.ts --run' },
  { name: 'User Service', command: 'pnpm test tests/user.test.ts --run' },
  { name: 'API Integration', command: 'pnpm test tests/integration/api-integration.test.ts --run' },
  { name: 'WebSocket Library', command: 'pnpm test tests/websocket/connection.test.ts --run' },
  { name: 'Full System', command: 'pnpm test tests/e2e/full-system.test.ts --run' },
];

function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const suite of TEST_SUITES) {
    try {
      console.log(`🧪 Running ${suite.name} tests...`);
      execSync(suite.command, { stdio: 'inherit' });
      console.log(`✅ ${suite.name} tests passed\n`);
      passedTests++;
    } catch (_error) {
      console.error(`❌ ${suite.name} tests failed\n`);
      failedTests++;
    }
  }
  
  // Summary
  console.log('📊 Test Suite Summary:');
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   📦 Total: ${TEST_SUITES.length}`);
  
  if (failedTests > 0) {
    console.error('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! System is working flawlessly.');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}