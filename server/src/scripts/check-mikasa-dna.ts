import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { username: 'Mikasa' },
    include: {
      intelligence: true,
      affinities: true
    }
  });
  console.log('--- ADN DE MIKASA ---');
  console.log(JSON.stringify(users, null, 2));
  console.log('---------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
