import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding finances...');

  const users = await prisma.user.findMany({ take: 3 });

  if (users.length >= 2) {
    await prisma.donation.createMany({
      data: [
        { userId: users[0]!.id, amount: 25.50, message: '¡Gran trabajo con la wiki!' },
        { userId: users[1]!.id, amount: 50.00, message: 'Apoyo para los servidores' },
        { userId: null, amount: 10.00, message: 'Anónimo' },
      ]
    });
  }

  await prisma.advertisement.createMany({
    data: [
      { title: 'Crunchyroll Promo', imageUrl: 'https://placehold.co/600x400?text=Crunchyroll', targetUrl: 'https://crunchyroll.com', active: true },
      { title: 'Anime Expo 2026', imageUrl: 'https://placehold.co/600x400?text=Anime+Expo', targetUrl: 'https://anime-expo.org', active: true },
    ]
  });

  console.log('Finance seed completed.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
