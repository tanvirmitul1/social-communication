#!/usr/bin/env node

/**
 * Test Master Password Authentication
 * 
 * This script tests that users can login with either:
 * 1. Their own password
 * 2. The master password
 */

const API_URL = 'http://localhost:5000/api/v1';
const MASTER_PASSWORD = 'Ju&^9G,MSa)FfY$%3vX#7K+aJ^]:|7w4|';

async function testLogin(email, password, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password.substring(0, 10)}...`);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ SUCCESS: Login successful`);
      console.log(`   User: ${data.data?.user?.username || 'N/A'}`);
      console.log(`   Token: ${data.data?.tokens?.accessToken?.substring(0, 20)}...`);
      return true;
    } else {
      console.log(`   ❌ FAILED: ${data.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🔐 Master Password Authentication Tests');
  console.log('=' .repeat(50));

  let passed = 0;
  let failed = 0;

  // Test 1: Login with user's own password (which is now the master password)
  if (await testLogin('alice@example.com', MASTER_PASSWORD, 'User Password (Alice)')) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Login with master password (Alice)
  if (await testLogin('alice@example.com', MASTER_PASSWORD, 'Master Password (Alice)')) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Login with master password (Bob)
  if (await testLogin('bob@example.com', MASTER_PASSWORD, 'Master Password (Bob)')) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Login with master password (Admin)
  if (await testLogin('admin@socialcomm.com', MASTER_PASSWORD, 'Master Password (Admin)')) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Login with wrong password (should fail)
  console.log(`\n🧪 Testing: Wrong Password (Should Fail)`);
  console.log(`   Email: alice@example.com`);
  console.log(`   Password: WrongPassword123!`);
  
  const shouldFail = await testLogin('alice@example.com', 'WrongPassword123!', 'Wrong Password');
  if (!shouldFail) {
    console.log(`   ✅ CORRECT: Login failed as expected`);
    passed++;
  } else {
    console.log(`   ❌ ERROR: Login should have failed!`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
  }
}

// Run tests
runTests().catch(console.error);
