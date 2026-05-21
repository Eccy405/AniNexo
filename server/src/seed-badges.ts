import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const badges = [
    {
      name: 'Pionero',
      description: 'Usuario de la fase alpha de AniNexo.',
      iconUrl: '🚀'
    },
    {
      name: 'Primer Post',
      description: 'Tu voz ha sido escuchada por primera vez.',
      iconUrl: '🎤'
    },
    {
      name: 'Coleccionista',
      description: 'Has completado más de 10 animes en tu lista.',
      iconUrl: '📚'
    },
    {
      name: 'Socialite',
      description: 'Has seguido a más de 5 personas.',
      iconUrl: '🤝'
    },
    {
      name: 'Amante del Nexo',
      description: 'Has interactuado más de 20 veces con la IA Nexo.',
      iconUrl: '🤖'
    },
    {
      name: 'Premium Member',
      description: 'Suscripción activa a AniNexo Premium.',
      iconUrl: '💎'
    }
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge
    });
  }

  console.log('✅ Medallas base generadas exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
