import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding telemetry...');

  let users = await prisma.user.findMany({ take: 5 });
  
  if (users.length < 3) {
    console.log('Creating mock users for telemetry...');
    await prisma.user.createMany({
      data: [
        { email: 'user1@example.com', username: 'KiraFan', passwordHash: 'mock' },
        { email: 'user2@example.com', username: 'LuffyLover', passwordHash: 'mock' },
        { email: 'user3@example.com', username: 'ZoroStan', passwordHash: 'mock' },
      ],
      skipDuplicates: true
    });
    users = await prisma.user.findMany({ take: 5 });
  }

  // Sesiones simuladas
  await prisma.userSession.createMany({
    data: users.map(u => ({
      userId: u.id,
      startTime: new Date(Date.now() - Math.random() * 10000000),
      duration: Math.floor(Math.random() * 3600),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }))
  });

  // Búsquedas simuladas
  await prisma.searchLog.createMany({
    data: [
      { userId: users[0]!.id, query: 'Chainsaw Man', resultsCount: 24 },
      { userId: users[1]!.id, query: 'One Piece', resultsCount: 1100 },
      { userId: users[2]!.id, query: 'Monster', resultsCount: 74 },
      { userId: null, query: 'Solo Leveling', resultsCount: 12 },
      { userId: users[0]!.id, query: 'Chainsaw Man', resultsCount: 24 },
    ]
  });

  // Eventos de telemetría
  await prisma.telemetryEvent.createMany({
    data: [
      { userId: users[0]!.id, type: 'AD_CLICK', payload: JSON.stringify({ adId: 'mock-ad-1' }) },
      { userId: users[1]!.id, type: 'PREMIUM_CONVERSION', payload: JSON.stringify({ plan: 'ANNUAL' }) },
      { userId: null, type: 'UI_ERROR', payload: JSON.stringify({ component: 'AnimeCard', error: 'Image load failed' }) },
    ]
  });

  console.log('Telemetry seed completed.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
