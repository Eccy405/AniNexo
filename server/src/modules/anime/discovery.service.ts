import prisma from '../../lib/prisma';
import axios from 'axios';
import { logger } from '../../lib/logger';
import { AnimeService } from './anime.service';

const ANILIST_URL = 'https://graphql.anilist.co';

export class DiscoveryService {
  private animeService: AnimeService;

  constructor() {
    this.animeService = new AnimeService();
  }

  /**
   * Búsqueda Avanzada Híbrida (API + Local)
   */
  async advancedSearch(filters: any, page: number = 1, perPage: number = 50) {
    const { query: search, genres, year, season, status, format, sort } = filters;

    // 1. Intentar AniList primero para datos frescos
    const query = `
      query ($page: Int, $perPage: Int, $search: String, $genres: [String], $seasonYear: Int, $season: MediaSeason, $status: MediaStatus, $format: MediaFormat, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, search: $search, genre_in: $genres, seasonYear: $seasonYear, season: $season, status: $status, format: $format, sort: $sort) {
            id
            title { romaji english }
            coverImage { extraLarge }
            averageScore
            episodes
            status
            genres
            format
            season
            seasonYear
          }
        }
      }
    `;

    const variables: any = {
      page,
      perPage,
      search: search || undefined,
      genres: genres && genres.length > 0 ? genres : undefined,
      seasonYear: year ? Number(year) : undefined,
      season: season || undefined,
      status: status || undefined,
      format: format || undefined,
      sort: sort || ['POPULARITY_DESC']
    };

    try {
      const response = await axios.post(ANILIST_URL, { query, variables });
      const animes = response.data.data.Page.media;
      
      if (animes && animes.length > 0) {
        this.persistMany(animes);
        return animes;
      }
    } catch (error: any) {
      logger.error('[DiscoveryService]: API search error or rate limit', error.message);
    }

    // 2. FALLBACK LOCAL: Si la API no devuelve nada o falla, buscamos en nuestra DB de 1000+ animes
    logger.info('[DiscoveryService]: Falling back to local database for advanced search');
    const skip = (page - 1) * perPage;
    
    // Construir el 'where' dinámicamente para Prisma
    const where: any = {};
    if (search) {
      where.OR = [
        { titleRomaji: { contains: search } },
        { titleEnglish: { contains: search } }
      ];
    }
    if (genres && genres.length > 0) {
      where.genres = { some: { name: { in: genres } } };
    }
    if (year) {
      where.seasonYear = Number(year);
    }
    if (status) {
      where.status = status;
    }

    const localAnimes = await prisma.anime.findMany({
      where,
      orderBy: { popularity: 'desc' },
      skip,
      take: perPage,
      include: { genres: true }
    });

    return localAnimes.map(a => this.mapLocalToExternal(a));
  }

  /**
   * Obtiene animes para el Hero Carousel
   */
  async getHeroSlides() {
    const query = `
      query {
        Page(page: 1, perPage: 12) {
          media(type: ANIME, sort: TRENDING_DESC, status_in: [RELEASING, FINISHED]) {
            id
            title { romaji english native }
            description
            bannerImage
            coverImage { extraLarge }
            averageScore
            genres
            status
            season
            seasonYear
            studios(isMain: true) {
              nodes { name }
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post(ANILIST_URL, { query });
      const animes = response.data.data.Page.media;
      this.persistMany(animes);
      return animes;
    } catch (error) {
      logger.error('[DiscoveryService]: Error fetching hero slides, falling back to local DB', error);
      
      // Fallback Local: Obtener animes con banner y buena puntuación
      const localAnimes = await prisma.anime.findMany({
        where: { bannerImage: { not: null } },
        orderBy: { popularity: 'desc' },
        take: 12,
        include: { genres: true }
      });
      
      return localAnimes.map(a => this.mapLocalToExternal(a));
    }
  }

  /**
   * Obtiene múltiples filas de categorías populares (Home)
   */
  async getHomeRows() {
    const query = `
      query {
        trending: Page(page: 1, perPage: 30) { media(type: ANIME, sort: TRENDING_DESC) { ...AnimeFields } }
        popular: Page(page: 1, perPage: 30) { media(type: ANIME, sort: POPULARITY_DESC) { ...AnimeFields } }
        topRated: Page(page: 1, perPage: 30) { media(type: ANIME, sort: SCORE_DESC) { ...AnimeFields } }
        upcoming: Page(page: 1, perPage: 30) { media(type: ANIME, sort: POPULARITY_DESC, status: NOT_YET_RELEASED) { ...AnimeFields } }
      }
      fragment AnimeFields on Media {
        id
        title { romaji english }
        coverImage { extraLarge }
        averageScore
        episodes
        status
        genres
      }
    `;

    try {
      const response = await axios.post(ANILIST_URL, { query });
      const data = response.data.data;
      Object.values(data).forEach((page: any) => this.persistMany(page.media));

      return [
        { title: '🔥 Tendencias Globales', data: data.trending.media },
        { title: '💎 Los Más Populares', data: data.popular.media },
        { title: '🏆 Mejor Valorados', data: data.topRated.media },
        { title: '📅 Próximos Estrenos', data: data.upcoming.media },
      ];
    } catch (error) {
      logger.error('[DiscoveryService]: Error fetching home rows, falling back to local DB', error);
      
      // Fallback Local: Dividir nuestros animes en categorías
      const [trending, popular, topRated] = await Promise.all([
        prisma.anime.findMany({ orderBy: { updatedAt: 'desc' }, take: 30, include: { genres: true } }),
        prisma.anime.findMany({ orderBy: { popularity: 'desc' }, take: 30, include: { genres: true } }),
        prisma.anime.findMany({ orderBy: { averageScore: 'desc' }, take: 30, include: { genres: true } })
      ]);

      return [
        { title: '🔥 Tendencias Globales', data: trending.map(a => this.mapLocalToExternal(a)) },
        { title: '💎 Los Más Populares', data: popular.map(a => this.mapLocalToExternal(a)) },
        { title: '🏆 Mejor Valorados', data: topRated.map(a => this.mapLocalToExternal(a)) }
      ];
    }
  }

  /**
   * Obtiene animes por GÉNERO con paginación y lógica Local-First AGRESIVA
   */
  async getByGenre(genre: string, page: number = 1, perPage: number = 50) {
    const skip = (page - 1) * perPage;
    const localAnimes = await prisma.anime.findMany({
      where: { genres: { some: { name: { contains: genre } } } },
      orderBy: { popularity: 'desc' },
      skip: skip,
      take: perPage,
      include: { genres: true }
    });

    if (localAnimes.length < perPage) {
      const apiAnimes = await this.fetchAndPersistGenre(genre, page, perPage);
      
      if (apiAnimes.length > 0) {
        const localIds = new Set(localAnimes.map(a => a.id));
        const combined = [...localAnimes.map(a => this.mapLocalToExternal(a))];
        
        for (const apiAnime of apiAnimes) {
           if (!localIds.has(apiAnime.id)) {
             combined.push(apiAnime);
           }
        }
        return combined.slice(0, perPage);
      }
    }

    return localAnimes.map(a => this.mapLocalToExternal(a));
  }

  /**
   * Obtiene animes por CATEGORÍA (trending, popular, etc.) con paginación
   */
  async getByCategory(category: string, page: number = 1, perPage: number = 50) {
    const sortMap: any = {
      'trending': 'TRENDING_DESC',
      'popular': 'POPULARITY_DESC',
      'top-rated': 'SCORE_DESC',
      'upcoming': 'POPULARITY_DESC'
    };
    
    const sort = sortMap[category] || 'TRENDING_DESC';
    const statusFilter = category === 'upcoming' ? ', status: NOT_YET_RELEASED' : '';

    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: ${sort}${statusFilter}) {
            id
            title { romaji english }
            coverImage { extraLarge }
            averageScore
            episodes
            status
            genres
          }
        }
      }
    `;

    try {
      const response = await axios.post(ANILIST_URL, { 
        query, 
        variables: { page, perPage } 
      });
      const animes = response.data.data.Page.media;
      this.persistMany(animes);
      return animes;
    } catch (error) {
      logger.error(`[DiscoveryService]: Error fetching category ${category}`, error);
      const skip = (page - 1) * perPage;
      const localAnimes = await prisma.anime.findMany({
        orderBy: { popularity: 'desc' },
        skip: skip,
        take: perPage,
        include: { genres: true }
      });
      return localAnimes.map(a => this.mapLocalToExternal(a));
    }
  }

  private async fetchAndPersistGenre(genre: string, page: number, perPage: number) {
    const query = `
      query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
            id
            title { romaji english }
            coverImage { extraLarge }
            averageScore
            episodes
            status
            genres
          }
        }
      }
    `;

    try {
      const response = await axios.post(ANILIST_URL, { 
        query, 
        variables: { genre, page, perPage } 
      });
      const animes = response.data.data.Page.media;
      this.persistMany(animes);
      return animes;
    } catch (error) {
      logger.error(`[DiscoveryService]: Error fetching genre ${genre} from API`, error);
      return [];
    }
  }

  /**
   * Obtiene datos personalizados (Dashboard)
   */
  async getPersonalizedData(userId: string) {
    try {
      const [watching, history] = await Promise.all([
        prisma.animeList.findMany({
          where: { userId, status: 'WATCHING' },
          include: { anime: { include: { genres: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 30
        }),
        prisma.viewHistory.findMany({
          where: { userId },
          include: { anime: { include: { genres: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 30
        })
      ]);

      const rows = [];
      if (watching.length > 0) {
        rows.push({ title: '📺 Continuar Viendo', data: watching.map(w => this.mapLocalToExternal(w.anime)) });
      }
      if (history.length > 0) {
        rows.push({ title: '🕒 Vistos Recientemente', data: history.map(h => this.mapLocalToExternal(h.anime)) });
      }
      return rows;
    } catch (error) {
      logger.error('[DiscoveryService]: Error fetching personalized data', error);
      return [];
    }
  }

  async trackView(userId: string, animeId: number) {
    try {
      await prisma.viewHistory.upsert({
        where: { userId_animeId: { userId, animeId } },
        update: { updatedAt: new Date() },
        create: { userId, animeId }
      });
      await prisma.anime.update({ where: { id: animeId }, data: { viewsCount: { increment: 1 } } });
    } catch (error) {
      logger.error('[DiscoveryService]: Error tracking view', error);
    }
  }

  private mapLocalToExternal(anime: any) {
    if (!anime) return null;
    return {
      id: anime.id,
      title: { 
        romaji: anime.titleRomaji || 'Unknown', 
        english: anime.titleEnglish || '',
        native: anime.titleNative || '' 
      },
      description: anime.description || 'No hay descripción disponible para este anime.',
      bannerImage: anime.bannerImage || '',
      coverImage: { extraLarge: anime.coverImage || '' },
      averageScore: anime.averageScore || 0,
      episodes: anime.episodes || 0,
      status: anime.status || 'FINISHED',
      season: anime.season || 'UNKNOWN',
      seasonYear: anime.seasonYear || 0,
      genres: anime.genres ? anime.genres.map((g: any) => g.name) : [],
      studios: { nodes: [] }
    };
  }

  private async persistMany(animes: any[]) {
    if (!animes) return;
    animes.forEach(anime => {
      this.animeService.syncWithExternal(anime.id).catch(() => {});
    });
  }
}
