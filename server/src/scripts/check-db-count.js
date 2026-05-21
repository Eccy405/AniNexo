const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.anime.count();
  console.log(`Total animes in DB: ${count}`);
  const trending = await prisma.anime.findMany({ take: 5 });
  console.log('Sample animes:', JSON.stringify(trending, null, 2));
  process.exit(0);
}

check();
