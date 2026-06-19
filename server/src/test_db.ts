import prisma from './lib/prisma';

async function main() {
  console.log('Testing database connection...');
  try {
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users:', users);
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
