import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@aninexo.com';
  const adminPassword = 'adminpassword'; // User should change this
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      isPremium: true
    }
  });

  console.log('Admin user created:', admin.email);

  // Default system settings
  await prisma.systemSettings.upsert({
    where: { key: 'MAINTENANCE_MODE' },
    update: {},
    create: { key: 'MAINTENANCE_MODE', value: 'false' }
  });

  await prisma.systemSettings.upsert({
    where: { key: 'NEXO_ENABLED' },
    update: {},
    create: { key: 'NEXO_ENABLED', value: 'true' }
  });

  console.log('Default settings created.');
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
