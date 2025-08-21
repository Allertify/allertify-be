import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

module.exports = async () => {
  // Clean up and close database connection
  await prisma.$disconnect();
};
