import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default allergens
  const allergens = [
    { name: 'Milk', description: 'Dairy products' },
    { name: 'Eggs', description: 'Chicken eggs and egg products' },
    { name: 'Fish', description: 'Fish and fish products' },
    { name: 'Shellfish', description: 'Crustaceans and mollusks' },
    { name: 'Tree Nuts', description: 'Almonds, walnuts, cashews, etc.' },
    { name: 'Peanuts', description: 'Peanuts and peanut products' },
    { name: 'Wheat', description: 'Wheat and wheat products' },
    { name: 'Soybeans', description: 'Soy and soy products' },
    { name: 'Sesame', description: 'Sesame seeds and products' },
  ];

  console.log('Creating allergens...');
  for (const allergen of allergens) {
    await prisma.allergen.upsert({
      where: { name: allergen.name },
      update: {},
      create: {
        ...allergen,
        is_custom: false,
      },
    });
  }

  // Create admin user
  const adminPassword = await argon2.hash('AdminPassword123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@allertify.com' },
    update: {},
    create: {
      email: 'admin@allertify.com',
      full_name: 'Admin User',
      password: adminPassword,
      phone_number: '+6281234567890', // Default phone number for admin
      is_verified: true, // Admin should be verified by default
      role: 1,
    },
  });

  console.log('✅ Database seeding completed!');
  console.log(`👤 Admin user created: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });