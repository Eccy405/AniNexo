
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const completedAnimes = await prisma.anime.findMany({
    where: { isComplete: true },
    select: { id: true, titleEnglish: true, titleRomaji: true }
  });
  console.log('Total completed animes:', completedAnimes.length);
  console.log('Completed animes list:', completedAnimes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
