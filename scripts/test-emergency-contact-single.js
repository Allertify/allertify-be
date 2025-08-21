const axios = require('axios');

const BASE_URL = 'http://localhost:3109/api/v1';
let authToken = '';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testContact = {
  name: 'John Doe',
  phone_number: '+6281234567890',
  relationship: 'Father'
};

const updatedContact = {
  name: 'John Doe Updated',
  phone_number: '+6281234567891',
  relationship: 'Father'
};

async function testSingleEmergencyContact() {
  try {
    console.log('🚀 Testing Single Emergency Contact API (1:1 relationship)...\n');

    // 1. Login untuk dapat token
    console.log('1️⃣ Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login berhasil, token:', authToken.substring(0, 20) + '...\n');

    // 2. Cek apakah sudah ada contact
    console.log('2️⃣ Cek existing contact...');
    const existingContact = await axios.get(`${BASE_URL}/users/me/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('📋 Existing contact:', existingContact.data.data ? 'Ada' : 'Tidak ada');

    // 3. Buat emergency contact pertama
    console.log('\n3️⃣ Buat emergency contact pertama...');
    const createResponse = await axios.post(`${BASE_URL}/users/me/contacts`, testContact, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Contact dibuat:', createResponse.data.data.name);
    console.log('📱 Phone:', createResponse.data.data.phone_number);
    console.log('👥 Relationship:', createResponse.data.data.relationship);

    // 4. Coba buat contact kedua (harusnya error)
    console.log('\n4️⃣ Coba buat contact kedua (harusnya error)...');
    try {
      const secondContact = await axios.post(`${BASE_URL}/users/me/contacts`, {
        ...testContact,
        name: 'Jane Doe',
        phone_number: '+6281234567891',
        relationship: 'Mother'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ Seharusnya error, tapi berhasil:', secondContact.data);
    } catch (error) {
      console.log('✅ Error expected:', error.response.data.message);
    }

    // 5. Get contact yang sudah ada
    console.log('\n5️⃣ Get existing contact...');
    const getContact = await axios.get(`${BASE_URL}/users/me/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('📋 Contact data:', getContact.data.data);

    // 6. Update contact
    console.log('\n6️⃣ Update contact...');
    const updateResponse = await axios.put(`${BASE_URL}/users/me/contacts/${getContact.data.data.id}`, updatedContact, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Contact updated:', updateResponse.data.data.name);
    console.log('📱 New phone:', updateResponse.data.data.phone_number);

    // 7. Get updated contact
    console.log('\n7️⃣ Get updated contact...');
    const finalContact = await axios.get(`${BASE_URL}/users/me/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('📋 Final contact:', finalContact.data.data);

    // 8. Cleanup - hapus contact
    console.log('\n8️⃣ Cleanup - hapus contact...');
    await axios.delete(`${BASE_URL}/users/me/contacts/${finalContact.data.data.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Contact berhasil dihapus');

    // 9. Verifikasi contact sudah terhapus
    console.log('\n9️⃣ Verifikasi contact sudah terhapus...');
    const emptyContact = await axios.get(`${BASE_URL}/users/me/contacts`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('📋 Contact after delete:', emptyContact.data.data ? 'Masih ada' : 'Sudah terhapus');

    console.log('\n🎉 Test berhasil! Emergency contact 1:1 relationship berfungsi dengan baik.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 Tips: Pastikan database sudah jalan dan migration sudah dijalankan');
      console.log('   - docker-compose up -d');
      console.log('   - npx prisma migrate dev');
    }
  }
}

// Jalankan test
testSingleEmergencyContact();
