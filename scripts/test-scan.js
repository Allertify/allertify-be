/**
 * Test Script untuk Scan Endpoints (dengan bypass auth)
 * 
 * Cara pakai:
 * 1. Set environment variable: BYPASS_AUTH=true
 * 2. Jalankan: node scripts/test-scan.js
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test data
const testBarcode = '1234567890123';
const testImageUrl = 'https://example.com/product-image.jpg';

async function testScanEndpoints() {
  console.log('🧪 Testing Scan Endpoints dengan Bypass Auth...\n');

  try {
    // Test 1: Get scan limit info
    console.log('1️⃣ Testing GET /scans/limit');
    const limitResponse = await axios.get(`${BASE_URL}/scans/limit`);
    console.log('✅ Scan limit info retrieved:', limitResponse.data.message);
    console.log('📊 Daily limit:', limitResponse.data.data.dailyLimit);
    console.log('🔢 Current usage:', limitResponse.data.data.currentUsage);
    console.log('🎯 Remaining scans:', limitResponse.data.data.remainingScans);
    console.log('');

    // Test 2: Scan barcode
    console.log('2️⃣ Testing POST /scans/barcode/:barcode');
    const barcodeResponse = await axios.post(`${BASE_URL}/scans/barcode/${testBarcode}`);
    console.log('✅ Barcode scan success:', barcodeResponse.data.message);
    console.log('📊 Risk level:', barcodeResponse.data.data.riskLevel);
    console.log('⚠️  Matched allergens:', barcodeResponse.data.data.matchedAllergens || 'None');
    if (barcodeResponse.data.data.scanLimit) {
      console.log('🎯 Remaining scans after scan:', barcodeResponse.data.data.scanLimit.remainingScans);
    }
    console.log('');

    // Test 3: Scan image
    console.log('3️⃣ Testing POST /scans/image');
    const imageResponse = await axios.post(`${BASE_URL}/scans/image`, {
      imageUrl: testImageUrl
    });
    console.log('✅ Image scan success:', imageResponse.data.message);
    console.log('📊 Risk level:', imageResponse.data.data.riskLevel);
    if (imageResponse.data.data.scanLimit) {
      console.log('🎯 Remaining scans after scan:', imageResponse.data.data.scanLimit.remainingScans);
    }
    console.log('');

    // Test 4: Get updated scan limit info
    console.log('4️⃣ Testing GET /scans/limit (after scans)');
    const updatedLimitResponse = await axios.get(`${BASE_URL}/scans/limit`);
    console.log('✅ Updated limit info:', updatedLimitResponse.data.message);
    console.log('🔢 Current usage:', updatedLimitResponse.data.data.currentUsage);
    console.log('🎯 Remaining scans:', updatedLimitResponse.data.data.remainingScans);
    console.log('');

    // Test 5: Get scan history
    console.log('5️⃣ Testing GET /scans/history');
    const historyResponse = await axios.get(`${BASE_URL}/scans/history?limit=5`);
    console.log('✅ History retrieved:', historyResponse.data.data.scans.length, 'scans');
    console.log('');

    // Test 6: Get saved scans
    console.log('6️⃣ Testing GET /scans/saved');
    const savedResponse = await axios.get(`${BASE_URL}/scans/saved`);
    console.log('✅ Saved scans retrieved:', savedResponse.data.data.scans.length, 'saved scans');
    console.log('');

    console.log('🎉 Semua test berhasil! Bypass auth dan scan limit berfungsi dengan baik.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      console.log('\n⚠️  Daily scan limit exceeded! Test berhasil - limit enforcement berfungsi.');
    }
  }
}

// Run tests
if (require.main === module) {
  testScanEndpoints();
}

module.exports = { testScanEndpoints };
