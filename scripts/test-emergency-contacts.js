const axios = require('axios');

const BASE_URL = 'http://localhost:3109';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Ganti dengan token yang valid

async function testEmergencyContacts() {
  try {
    console.log('🧪 Testing emergency contacts endpoints...\n');

    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Create emergency contact
    console.log('1️⃣ Testing POST /api/v1/users/me/contacts');
    const createData = {
      name: 'John Doe',
      phone_number: '+6281234567890',
      relationship: 'Father'
    };
    
    const createResponse = await axios.post(
      `${BASE_URL}/api/v1/users/me/contacts`,
      createData,
      { headers }
    );
    console.log('✅ Status:', createResponse.status);
    console.log('📊 Data:', JSON.stringify(createResponse.data, null, 2));
    
    const contactId = createResponse.data.data.id;
    console.log('');

    // Test 2: Update emergency contact
    console.log('2️⃣ Testing PUT /api/v1/users/me/contacts/:id');
    const updateData = {
      name: 'John Doe Updated',
      phone_number: '+6281234567891'
    };
    
    const updateResponse = await axios.put(
      `${BASE_URL}/api/v1/users/me/contacts/${contactId}`,
      updateData,
      { headers }
    );
    console.log('✅ Status:', updateResponse.status);
    console.log('📊 Data:', JSON.stringify(updateResponse.data, null, 2));
    console.log('');

    // Test 3: Get emergency contacts
    console.log('3️⃣ Testing GET /api/v1/users/me/contacts');
    const getResponse = await axios.get(
      `${BASE_URL}/api/v1/users/me/contacts`,
      { headers }
    );
    console.log('✅ Status:', getResponse.status);
    console.log('📊 Data:', JSON.stringify(getResponse.data, null, 2));
    console.log('');

    // Test 4: Update with empty data (should fail)
    console.log('4️⃣ Testing PUT /api/v1/users/me/contacts/:id with empty data');
    try {
      const emptyUpdateResponse = await axios.put(
        `${BASE_URL}/api/v1/users/me/contacts/${contactId}`,
        {},
        { headers }
      );
      console.log('❌ Should have failed but got:', emptyUpdateResponse.status);
    } catch (error) {
      console.log('✅ Correctly failed with status:', error.response?.status);
      console.log('📊 Error:', error.response?.data?.message);
    }
    console.log('');

    // Test 5: Delete emergency contact
    console.log('5️⃣ Testing DELETE /api/v1/users/me/contacts/:id');
    const deleteResponse = await axios.delete(
      `${BASE_URL}/api/v1/users/me/contacts/${contactId}`,
      { headers }
    );
    console.log('✅ Status:', deleteResponse.status);
    console.log('📊 Data:', JSON.stringify(deleteResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error testing emergency contacts:', error.response?.data || error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Please update TOKEN variable with a valid JWT token');
    console.log('💡 You can get token from login endpoint');
    process.exit(1);
  }
  testEmergencyContacts();
}

module.exports = { testEmergencyContacts };
