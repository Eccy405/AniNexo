import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ANILIST_URL = 'https://graphql.anilist.co';

async function seedMassive() {
  console.log('🚀 Iniciando Operación "Multiverso Infinito" - Seeding Masivo de AniNexo...');
  
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 50) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description
          bannerImage
          coverImage { extraLarge }
          averageScore
          popularity
          episodes
          duration
          status
          season
          seasonYear
          genres
          studios(isMain: true) {
            nodes { name }
          }
        }
      }
    }
  `;

  let totalSeeded = 0;
  
  // Vamos a traer las primeras 20 páginas (1000 animes)
  for (let page = 1; page <= 20; page++) {
    try {
      console.log(`📦 Procesando página ${page}/20...`);
      const response = await axios.post(ANILIST_URL, { query, variables: { page } });
      const animes = response.data.data.Page.media;

      for (const anime of animes) {
        try {
          await prisma.anime.upsert({
            where: { id: anime.id },
            update: {
              popularity: anime.popularity,
              averageScore: anime.averageScore,
              status: anime.status,
              coverImage: anime.coverImage.extraLarge,
              bannerImage: anime.bannerImage,
              lastSyncAt: new Date()
            },
            create: {
              id: anime.id,
              titleRomaji: anime.title.romaji,
              titleEnglish: anime.title.english || '',
              titleNative: anime.title.native || '',
              description: anime.description || '',
              status: anime.status,
              episodes: anime.episodes,
              duration: anime.duration,
              season: anime.season,
              seasonYear: anime.seasonYear,
              averageScore: anime.averageScore,
              popularity: anime.popularity,
              coverImage: anime.coverImage.extraLarge,
              bannerImage: anime.bannerImage,
              isComplete: true,
              genres: {
                connectOrCreate: anime.genres.map((g: string) => ({
                  where: { name: g },
                  create: { name: g }
                }))
              },
              studios: {
                connectOrCreate: anime.studios.nodes.map((s: any) => ({
                  where: { name: s.name },
                  create: { name: s.name }
                }))
              }
            }
          });
          totalSeeded++;
        } catch (e) {
          // Ignorar errores individuales para no detener el proceso
        }
      }
      
      console.log(`✅ Página ${page} completada. Total: ${totalSeeded} animes.`);
      
      // Respetar Rate Limit de AniList (esperar 1s entre páginas)
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error: any) {
      console.error(`❌ Error en página ${page}:`, error.message);
      if (error.response?.status === 429) {
        console.log('⏳ Rate limit alcanzado. Esperando 30 segundos...');
        await new Promise(r => setTimeout(r, 30000));
        page--; // Reintentar página
      }
    }
  }

  console.log(`\n🎉 ¡OPERACIÓN COMPLETADA! Se han sincronizado ${totalSeeded} animes en el catálogo local de AniNexo.`);
}

seedMassive()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
