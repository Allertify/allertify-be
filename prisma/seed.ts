import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default allergens
  const allergens = [
    { name: 'Milk', description: 'Dairy products', category: 'dairy' },
    { name: 'Eggs', description: 'Chicken eggs and egg products', category: 'eggs' },
    { name: 'Fish', description: 'Fish and fish products', category: 'seafood' },
    { name: 'Shellfish', description: 'Crustaceans and mollusks', category: 'seafood' },
    { name: 'Tree Nuts', description: 'Almonds, walnuts, cashews, etc.', category: 'nuts' },
    { name: 'Peanuts', description: 'Peanuts and peanut products', category: 'nuts' },
    { name: 'Wheat', description: 'Wheat and wheat products', category: 'grains' },
    { name: 'Soybeans', description: 'Soy and soy products', category: 'legumes' },
    { name: 'Sesame', description: 'Sesame seeds and products', category: 'seeds' },
  ];

  console.log('Creating allergens...');
  for (const allergen of allergens) {
    await prisma.allergen.upsert({
      where: { name: allergen.name },
      update: {},
      create: allergen,
    });
  }

  // Create admin user
  const adminPassword = await argon2.hash('AdminPassword123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@allertify.com' },
    update: {},
    create: {
      email: 'admin@allertify.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
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