import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const animeId = 21; // One Piece para la prueba
  const anime = await prisma.anime.findUnique({
    where: { id: animeId },
    select: {
      id: true,
      titleRomaji: true,
      relationsData: true,
      recommendationsData: true,
      trailerYoutubeId: true,
      isComplete: true
    }
  });

  if (!anime) {
    console.log('Anime no encontrado en la DB');
  } else {
    console.log('--- DATOS DEL ANIME ---');
    console.log('ID:', anime.id);
    console.log('Título:', anime.titleRomaji);
    console.log('Trailer ID:', anime.trailerYoutubeId);
    console.log('Relaciones:', (anime.relationsData as any)?.length);
    console.log('Recomendaciones:', (anime.recommendationsData as any)?.length);
    console.log('Completo:', anime.isComplete);
    
    if ((anime.relationsData as any)?.length > 0) {
      console.log('Ejemplo Relación:', JSON.stringify((anime.relationsData as any)[0], null, 2));
    }
  }
  
  await prisma.$disconnect();
}

check();
