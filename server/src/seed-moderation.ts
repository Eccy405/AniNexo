import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding moderation data...');

  const admin = await prisma.user.findUnique({ where: { email: 'admin@aninexo.com' } });
  const users = await prisma.user.findMany({ where: { email: { not: 'admin@aninexo.com' } }, take: 3 });

  if (!admin || users.length < 2) {
    console.log('Required users not found. Run main seed first.');
    return;
  }

  // Reportes
  await prisma.report.createMany({
    data: [
      { reporterId: users[0]!.id, reportedUserId: users[1]!.id, reason: 'Spam masivo en el feed de Naruto', status: 'PENDING' },
      { reporterId: users[1]!.id, reportedUserId: users[0]!.id, reason: 'Lenguaje ofensivo en comentarios', status: 'PENDING' },
    ]
  });

  // Logs de auditoría
  await prisma.moderationLog.createMany({
    data: [
      { moderatorId: admin.id, targetUserId: users[0]!.id, action: 'WARNING', reason: 'Primer aviso por spam' },
      { moderatorId: admin.id, targetUserId: users[1]!.id, action: 'RESOLVE_REPORT', reason: 'Reporte 123 marcado como resuelto' },
    ]
  });

  console.log('Moderation seed completed.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
