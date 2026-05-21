const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Obtiene los detalles de un anime desde la DB local de AniNexo (Persistencia Progresiva)
 */
export async function getAnimeDetails(id: string, forceSync: boolean = false) {
  try {
    const response = await fetch(`${API_BASE}/anime/${id}${forceSync ? '?forceSync=true' : ''}`, {
      next: { revalidate: forceSync ? 0 : 3600 } // Si forzamos, no usamos cache
    });

    const json = await response.json();
    
    if (!json.success) {
      throw new Error(json.message);
    }

    // Normalizar data: Mapear campos de DB local (Prisma) a los esperados por la UI (formato AniList)
    const anime = json.data;
    if (!anime) return null;

    return {
      ...anime,
      title: {
        romaji: anime.titleRomaji,
        english: anime.titleEnglish,
        native: anime.titleNative
      },
      coverImage: {
        extraLarge: anime.coverImage
      },
      // Normalización de Géneros (de [{name: '...'}] a ['...'])
      genres: anime.genres?.map((g: any) => g.name || g) || [],
      // Normalización de Estudios (de [{name: '...'}] a {nodes: [{name: '...'}]})
      studios: {
        nodes: anime.studios?.map((s: any) => ({ name: s.name || s })) || []
      },
      // Normalización de Personajes
      characters: {
        nodes: anime.characters?.map((c: any) => ({
          ...c.character,
          role: c.role,
          voiceActors: c.voiceActorsData || []
        })) || []
      },
      trailerYoutubeId: anime.trailerYoutubeId,
      relations: anime.relationsData || [],
      recommendations: anime.recommendationsData || [],
      staff: anime.staffData || [],
      stats: anime.statsData || {},
      externalLinks: anime.externalLinksData || [],
      tags: anime.tagsData || []
    };
  } catch (error) {
    console.error('[AniNexo API]: Error fetching anime details', error);
    return null;
  }
}

/**
 * Obtiene animes populares.
 * Nota: Por ahora sigue consultando AniList directamente para rankings globales en tiempo real,
 * pero pronto se migrará a un endpoint de rankings locales optimizados.
 */
export async function getPopularAnimes(page = 1, perPage = 10) {
  const ANILIST_API = 'https://graphql.anilist.co';
  const query = `
    query ($page: Int, $perPage: Int) {
      Page (page: $page, perPage: $perPage) {
        media (type: ANIME, sort: TRENDING_DESC) {
          id
          title { romaji english }
          coverImage { large extraLarge }
          averageScore
          episodes
          seasonYear
          genres
        }
      }
    }
  `;

  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { page, perPage } }),
      next: { revalidate: 3600 }
    });

    const json = await response.json();
    return json.data?.Page.media;
  } catch (error) {
    console.error('[AniList API]: Error fetching popular animes', error);
    return [];
  }
}
