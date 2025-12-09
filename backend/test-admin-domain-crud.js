/**
 * Test script for Admin Domain CRUD operations
 * Tests both domain creation and deletion functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';
let authToken = '';

// Test user credentials (make sure this admin user exists)
const testAdmin = {
  email: 'admin@test.com',
  password: 'admin123'
};

// Test domain data
const testDomain = {
  name: 'Test Domain - CRUD Operations',
  description: 'A test domain created for testing CRUD operations including creation and deletion',
  targetAudience: 'testers and developers'
};

async function login() {
  console.log('🔐 Logging in as admin...');
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, testAdmin);
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createDomain() {
  console.log('\n📝 Testing Domain Creation...');
  try {
    const response = await axios.post(
      `${API_BASE}/api/admin/domains`,
      testDomain,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.data.success) {
      console.log('✅ Domain created successfully!');
      console.log(`   - Domain ID: ${response.data.data.domain.id}`);
      console.log(`   - Questions Count: ${response.data.data.domain.questionsCount}`);
      console.log(`   - Message: ${response.data.message}`);
      return response.data.data.domain.id;
    } else {
      console.log('❌ Domain creation failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Create domain error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function listDomains() {
  console.log('\n📋 Fetching all domains...');
  try {
    const response = await axios.get(`${API_BASE}/api/admin/domains`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const domains = response.data.data.domains;
      console.log(`✅ Found ${domains.length} domains:`);
      domains.forEach(domain => {
        console.log(`   - ${domain.name} (ID: ${domain.id}) - ${domain.questionsCount} questions`);
      });
      return domains;
    } else {
      console.log('❌ Failed to fetch domains:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ Fetch domains error:', error.response?.data?.message || error.message);
    return [];
  }
}

async function deleteDomain(domainId) {
  console.log(`\n🗑️ Testing Domain Deletion (ID: ${domainId})...`);
  try {
    const response = await axios.delete(`${API_BASE}/api/admin/domains/${domainId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Domain deleted successfully!');
      console.log(`   - Message: ${response.data.message}`);
      if (response.data.deletedData) {
        const data = response.data.deletedData;
        console.log(`   - Domain Name: ${data.domainName}`);
        console.log(`   - Questions Deleted: ${data.questionsDeleted}`);
        console.log(`   - Rules Deleted: ${data.rulesDeleted}`);
        console.log(`   - Sessions Deleted: ${data.sessionsDeleted}`);
      }
      return true;
    } else {
      console.log('❌ Domain deletion failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Delete domain error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Domain CRUD Tests...\n');

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    return;
  }

  // Step 2: List existing domains (before)
  console.log('\n=== BEFORE TESTS ===');
  const beforeDomains = await listDomains();

  // Step 3: Create test domain
  const domainId = await createDomain();
  if (!domainId) {
    console.log('❌ Cannot proceed without successful domain creation');
    return;
  }

  // Step 4: List domains (after creation)
  console.log('\n=== AFTER CREATION ===');
  const afterCreateDomains = await listDomains();

  // Step 5: Wait a moment and then delete
  console.log('\n⏳ Waiting 2 seconds before deletion...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  const deleteSuccess = await deleteDomain(domainId);
  
  // Step 6: List domains (after deletion)
  console.log('\n=== AFTER DELETION ===');
  const afterDeleteDomains = await listDomains();

  // Summary
  console.log('\n🏁 TEST SUMMARY:');
  console.log(`   - Domains before: ${beforeDomains.length}`);
  console.log(`   - Domains after creation: ${afterCreateDomains.length}`);
  console.log(`   - Domains after deletion: ${afterDeleteDomains.length}`);
  console.log(`   - Creation test: ${domainId ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   - Deletion test: ${deleteSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (beforeDomains.length === afterDeleteDomains.length) {
    console.log('   - Full CRUD cycle: ✅ PASSED');
  } else {
    console.log('   - Full CRUD cycle: ⚠️ INCONSISTENT');
  }
}

// Run the tests
runTests().catch(console.error);