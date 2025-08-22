const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔐 Setting up admin user for Allertify...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 1 }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminData = {
      full_name: 'System Administrator',
      email: 'admin@allertify.com',
      password: 'admin123', // Change this in production!
      phone_number: '+1234567890',
      is_verified: true,
      role: 1, // 1 = admin, 0 = regular user
    };

    const admin = await prisma.user.create({
      data: adminData
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('');
    console.log('🔗 Access AdminJS at: http://localhost:3000/admin');
    console.log('📝 Login with the credentials above');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAdmin();
