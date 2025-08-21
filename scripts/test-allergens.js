const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPublicAllergens() {
  try {
    console.log('🧪 Testing public allergens endpoint...\n');

    // Test 1: Get all allergens (default)
    console.log('1️⃣ Testing GET /api/v1/auth/allergens (default)');
    const response1 = await axios.get(`${BASE_URL}/api/v1/auth/allergens`);
    console.log('✅ Status:', response1.status);
    console.log('📊 Data:', JSON.stringify(response1.data, null, 2));
    console.log('');

    // Test 2: Search allergens
    console.log('2️⃣ Testing GET /api/v1/auth/allergens?search=milk');
    const response2 = await axios.get(`${BASE_URL}/api/v1/auth/allergens?search=milk`);
    console.log('✅ Status:', response2.status);
    console.log('📊 Data:', JSON.stringify(response2.data, null, 2));
    console.log('');

    // Test 3: Pagination
    console.log('3️⃣ Testing GET /api/v1/auth/allergens?limit=3&offset=0');
    const response3 = await axios.get(`${BASE_URL}/api/v1/auth/allergens?limit=3&offset=0`);
    console.log('✅ Status:', response3.status);
    console.log('📊 Data:', JSON.stringify(response3.data, null, 2));
    console.log('');

    // Test 4: Invalid limit (should default to 50)
    console.log('4️⃣ Testing GET /api/v1/auth/allergens?limit=999');
    const response4 = await axios.get(`${BASE_URL}/api/v1/auth/allergens?limit=999`);
    console.log('✅ Status:', response4.status);
    console.log('📊 Data:', JSON.stringify(response4.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing allergens endpoint:', error.response?.data || error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testPublicAllergens();
}

module.exports = { testPublicAllergens };
