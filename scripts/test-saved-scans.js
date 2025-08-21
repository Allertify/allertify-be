const axios = require('axios');

const BASE_URL = 'http://localhost:3109';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Ganti dengan token yang valid

async function testSavedScans() {
  try {
    console.log('🧪 Testing saved scans endpoint...\n');

    const headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Get saved scans
    console.log('1️⃣ Testing GET /api/v1/scans/saved');
    const savedResponse = await axios.get(
      `${BASE_URL}/api/v1/scans/saved`,
      { headers }
    );
    console.log('✅ Status:', savedResponse.status);
    console.log('📊 Data:', JSON.stringify(savedResponse.data, null, 2));
    console.log('');

    // Test 2: Get scan history with savedOnly=true
    console.log('2️⃣ Testing GET /api/v1/scans/history?savedOnly=true');
    const historyResponse = await axios.get(
      `${BASE_URL}/api/v1/scans/history?savedOnly=true`,
      { headers }
    );
    console.log('✅ Status:', historyResponse.status);
    console.log('📊 Data:', JSON.stringify(historyResponse.data, null, 2));
    console.log('');

    // Test 3: Get all scan history (savedOnly=false)
    console.log('3️⃣ Testing GET /api/v1/scans/history?savedOnly=false');
    const allHistoryResponse = await axios.get(
      `${BASE_URL}/api/v1/scans/history?savedOnly=false`,
      { headers }
    );
    console.log('✅ Status:', allHistoryResponse.status);
    console.log('📊 Data:', JSON.stringify(allHistoryResponse.data, null, 2));
    console.log('');

    // Test 4: Compare results
    console.log('4️⃣ Comparing results:');
    const savedCount = savedResponse.data.data.scans.length;
    const savedOnlyCount = historyResponse.data.data.scans.length;
    const allCount = allHistoryResponse.data.data.scans.length;
    
    console.log(`- /scans/saved: ${savedCount} scans`);
    console.log(`- /scans/history?savedOnly=true: ${savedOnlyCount} scans`);
    console.log(`- /scans/history?savedOnly=false: ${allCount} scans`);
    
    if (savedCount === savedOnlyCount) {
      console.log('✅ Saved scans count matches savedOnly filter');
    } else {
      console.log('❌ Saved scans count does not match savedOnly filter');
    }
    
    if (savedCount <= allCount) {
      console.log('✅ Saved scans count is less than or equal to total scans');
    } else {
      console.log('❌ Saved scans count is greater than total scans (this should not happen)');
    }

    // Test 5: Verify all saved scans have isSaved=true
    console.log('\n5️⃣ Verifying all returned scans are actually saved:');
    const savedScans = savedResponse.data.data.scans;
    const allSaved = savedScans.every(scan => scan.isSaved === true);
    
    if (allSaved) {
      console.log('✅ All returned scans have isSaved=true');
    } else {
      console.log('❌ Found scans with isSaved=false in saved scans endpoint');
      const notSaved = savedScans.filter(scan => scan.isSaved === false);
      console.log('Scans that should not be here:', notSaved.map(s => ({ id: s.id, name: s.product.name, isSaved: s.isSaved })));
    }

  } catch (error) {
    console.error('❌ Error testing saved scans:', error.response?.data || error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Please update TOKEN variable with a valid JWT token');
    console.log('💡 You can get token from login endpoint');
    process.exit(1);
  }
  testSavedScans();
}

module.exports = { testSavedScans };
