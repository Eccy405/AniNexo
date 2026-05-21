
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.anime.count();
  const topAnimes = await prisma.anime.findMany({ take: 5 });
  console.log('Total animes in DB:', count);
  console.log('Top animes:', JSON.stringify(topAnimes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
