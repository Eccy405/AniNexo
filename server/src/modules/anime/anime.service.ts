import prisma from '../../lib/prisma';
import axios from 'axios';
import { addJob, QUEUES } from '../../lib/queue';
import { logger } from '../../lib/logger';
import { translateText } from '../../lib/translate';

const ANILIST_URL = 'https://graphql.anilist.co';
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Cliente AniList con control de ritmo y reintentos ante 429 ───────────────
// AniList limita a ~30 peticiones/minuto. Serializamos las llamadas del proceso
// con un intervalo mínimo y, si llega un 429, esperamos lo que indique Retry-After.
const ANILIST_MIN_INTERVAL_MS = 700;
const ANILIST_MAX_RETRIES = 3;
let anilistChain: Promise<unknown> = Promise.resolve();
let lastAnilistCall = 0;

async function anilistPost(query: string, variables: Record<string, unknown>): Promise<any> {
  const run = async () => {
    for (let attempt = 0; ; attempt++) {
      const wait = lastAnilistCall + ANILIST_MIN_INTERVAL_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastAnilistCall = Date.now();
      try {
        const res = await axios.post(ANILIST_URL, { query, variables }, { timeout: 15000 });
        return res.data;
      } catch (err: any) {
        const status = err.response?.status;
        if (status === 429 && attempt < ANILIST_MAX_RETRIES) {
          const retryAfter = Number(err.response?.headers?.['retry-after']);
          const delay = (Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30) * 1000;
          logger.warn(`[AniList] 429 recibido. Reintentando en ${delay / 1000}s (intento ${attempt + 1}/${ANILIST_MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
  };
  const p = anilistChain.then(run, run);
  anilistChain = p.catch(() => undefined);
  return p;
}

// Ejecuta tareas async con concurrencia limitada (evita miles de round-trips en serie)
async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]!);
    }
  });
  await Promise.all(workers);
}

const BASE_QUERY = `
  query ($id: Int, $pageChar: Int, $pageStaff: Int) {
    Media (id: $id, type: ANIME) {
      id
      title { romaji english native }
      description
      type status episodes duration season seasonYear averageScore popularity
      coverImage { extraLarge }
      bannerImage
      genres
      tags { name description category rank isGeneralSpoiler isMediaSpoiler }
      source
      synonyms
      trailer { id site }
      studios(isMain: true) { nodes { id name } }
      characters(sort: [ROLE, RELEVANCE], perPage: 50, page: $pageChar) {
        pageInfo { hasNextPage }
        edges {
          role
          node { id name { full } image { large } description }
          voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
            id name { full } image { large }
          }
        }
      }
      relations {
        nodes { id type status title { romaji english } coverImage { large } }
      }
      recommendations(perPage: 20, sort: [RATING_DESC]) {
        nodes {
          mediaRecommendation { id title { romaji english } coverImage { large } averageScore }
        }
      }
      staff(perPage: 50, page: $pageStaff) {
        pageInfo { hasNextPage }
        nodes { id name { full } image { large } primaryOccupations }
      }
      stats {
        scoreDistribution { score amount }
        statusDistribution { status amount }
      }
      externalLinks { site url icon }
    }
  }
`;

const CHAR_PAGE_QUERY = `query($id: Int, $page: Int){ Media(id:$id){ characters(sort: [ROLE, RELEVANCE], perPage:50, page:$page){ pageInfo{hasNextPage} edges{ role node{ id name{full} image{large} description } voiceActors(language: JAPANESE, sort: [RELEVANCE]) { id name { full } image { large } } } } } }`;
const STAFF_PAGE_QUERY = `query($id: Int, $page: Int){ Media(id:$id){ staff(perPage:50, page:$page){ pageInfo{hasNextPage} nodes{ id name{full} image{large} primaryOccupations } } } }`;

const ANIME_INCLUDE = { genres: true, studios: true, characters: { include: { character: true } } } as const;

export class AnimeService {
  // Sincronizaciones en curso por ID (evita descargas duplicadas en paralelo)
  private static inFlight = new Map<number, Promise<any>>();
  // IDs cuyo resto de páginas (personajes/staff) se descarga en segundo plano
  private static backgroundSyncs = new Set<number>();

  /**
   * Obtiene un anime por ID con persistencia progresiva o forzada.
   */
  async getAnimeById(id: number, forceSync: boolean = false) {
    let anime: any = null;
    try {
      anime = await prisma.anime.findUnique({ where: { id }, include: ANIME_INCLUDE });

      const hasCoreData = anime && anime.relationsData && anime.staffData && anime.statsData;

      // Si ya tenemos los datos base y el resto se está completando en segundo plano, responder ya.
      if (!forceSync && hasCoreData && AnimeService.backgroundSyncs.has(id)) {
        return anime;
      }

      if (forceSync || !anime || !anime.isComplete || !hasCoreData) {
        logger.info(`[AnimeService]: Sincronización ${forceSync ? 'FORZADA' : 'INCOMPLETA'} para ID ${id}...`);
        return await this.syncWithExternal(id, forceSync);
      }

      const isStale = new Date().getTime() - anime.lastSyncAt.getTime() > 24 * 60 * 60 * 1000;
      if (isStale) {
        logger.info(`[AnimeService]: Anime ${id} está desactualizado. Encolando sincronización...`);
        await addJob(QUEUES.ANIME_SYNC, 'sync-anime', { animeId: id });
      }

      return anime;
    } catch (error: any) {
      logger.error(`[AnimeService Error] en getAnimeById(${id}): ${error.message}`);
      // Si ya hay datos guardados (aunque incompletos), mostrarlos en lugar de fallar.
      if (anime) return anime;
      throw error;
    }
  }

  /**
   * Sincroniza con AniList. Llamadas concurrentes para el mismo ID comparten la misma promesa.
   */
  async syncWithExternal(id: number, forceSync: boolean = false) {
    const existing = AnimeService.inFlight.get(id);
    if (existing) return existing;

    const p = this.runSync(id, forceSync).finally(() => AnimeService.inFlight.delete(id));
    AnimeService.inFlight.set(id, p);
    return p;
  }

  private async runSync(id: number, forceSync: boolean) {
    try {
      console.log(`[Sync] Iniciando descarga ${forceSync ? '(FORZADA)' : ''} para ID ${id}...`);

      if (forceSync) {
        console.log(`[Sync] Limpiando personajes previos para ID ${id}...`);
        await prisma.characterOnAnime.deleteMany({ where: { animeId: id } });
      }

      // 1. DATOS BASE + PRIMERA PÁGINA DE PERSONAJES Y STAFF
      const json = await anilistPost(BASE_QUERY, { id, pageChar: 1, pageStaff: 1 });
      const baseData = json?.data?.Media;
      if (!baseData) throw new Error('Anime no encontrado en AniList');

      const firstChars = baseData.characters?.edges || [];
      const firstStaff = baseData.staff?.nodes || [];
      const hasMoreChars = !!baseData.characters?.pageInfo?.hasNextPage;
      const hasMoreStaff = !!baseData.staff?.pageInfo?.hasNextPage;
      const needsMorePages = hasMoreChars || hasMoreStaff;

      // Traducciones en paralelo (sinopsis + tags)
      const [descriptionTranslated] = await Promise.all([
        translateText(baseData.description),
        ...(baseData.tags || []).map(async (t: any) => {
          if (t.description) t.description = await translateText(t.description);
        })
      ]);

      const titleStr = baseData.title.english || baseData.title.romaji;
      const slug = `${baseData.id}-${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

      const animeData = {
        slug, titleRomaji: baseData.title.romaji, titleEnglish: baseData.title.english, titleNative: baseData.title.native,
        description: descriptionTranslated, type: baseData.type, status: baseData.status, episodes: baseData.episodes,
        duration: baseData.duration, season: baseData.season, seasonYear: baseData.seasonYear, averageScore: baseData.averageScore,
        popularity: baseData.popularity, coverImage: baseData.coverImage?.extraLarge || null, bannerImage: baseData.bannerImage || null,
        trailerYoutubeId: baseData.trailer?.site === 'youtube' ? baseData.trailer.id : null,
        relationsData: baseData.relations?.nodes || [],
        recommendationsData: baseData.recommendations?.nodes?.map((r: any) => r.mediaRecommendation) || [],
        staffData: firstStaff,
        statsData: baseData.stats || {},
        externalLinksData: baseData.externalLinks || [],
        tagsData: baseData.tags || [],
        lastSyncAt: new Date(),
        isComplete: !needsMorePages
      };

      const anime = await prisma.anime.upsert({
        where: { id: baseData.id },
        update: animeData,
        create: { id: baseData.id, ...animeData }
      });

      // Géneros y estudios
      const genreNames: string[] = baseData.genres || [];
      const studioNames: string[] = (baseData.studios?.nodes || []).map((s: any) => s.name);
      await Promise.all([
        ...genreNames.map(name => prisma.genre.upsert({ where: { name }, update: {}, create: { name } })
          .catch((e: any) => logger.error(`[AnimeService] Error creando género ${name}: ${e.message}`))),
        ...studioNames.map(name => prisma.studio.upsert({ where: { name }, update: {}, create: { name } })
          .catch((e: any) => logger.error(`[AnimeService] Error creando estudio ${name}: ${e.message}`)))
      ]);
      if (genreNames.length || studioNames.length) {
        await prisma.anime.update({
          where: { id: anime.id },
          data: {
            genres: { connect: genreNames.map(name => ({ name })) },
            studios: { connect: studioNames.map(name => ({ name })) }
          }
        }).catch((e: any) => logger.error(`[AnimeService] Error vinculando géneros/estudios: ${e.message}`));
      }

      // 2. PERSONAJES DE LA PRIMERA PÁGINA (los principales)
      await this.saveCharacters(anime.id, firstChars);

      // 3. RESTO DE PÁGINAS EN SEGUNDO PLANO (no bloquea la respuesta al usuario)
      if (needsMorePages && !AnimeService.backgroundSyncs.has(anime.id)) {
        AnimeService.backgroundSyncs.add(anime.id);
        this.syncRemainingPages(anime.id, hasMoreChars, hasMoreStaff, firstStaff)
          .catch((e: any) => logger.error(`[Sync] Error completando páginas de ${anime.id}: ${e.message}`))
          .finally(() => AnimeService.backgroundSyncs.delete(anime.id));
      }

      console.log(`[Sync] Datos base listos para ${anime.titleRomaji}${needsMorePages ? ' (completando personajes/staff en segundo plano)' : ''}`);
      return await prisma.anime.findUnique({ where: { id: anime.id }, include: ANIME_INCLUDE });
    } catch (error: any) {
      if (error.response?.data) {
        console.error(`[Sync FATAL ERROR] ID ${id} - Detalle API:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(`[Sync FATAL ERROR] ID ${id}:`, error.message);
      }
      throw new Error(`Error en la Dimensión Nexo al procesar el anime ${id}.`);
    }
  }

  private async syncRemainingPages(animeId: number, hasMoreChars: boolean, hasMoreStaff: boolean, firstStaff: any[]) {
    let allStaff = [...firstStaff];

    let page = 1;
    while (hasMoreChars) {
      page++;
      console.log(`[Sync] (${animeId}) Descargando página ${page} de personajes...`);
      const res = await anilistPost(CHAR_PAGE_QUERY, { id: animeId, page });
      const chars = res?.data?.Media?.characters;
      await this.saveCharacters(animeId, chars?.edges || []);
      hasMoreChars = !!chars?.pageInfo?.hasNextPage;
    }

    page = 1;
    while (hasMoreStaff) {
      page++;
      console.log(`[Sync] (${animeId}) Descargando página ${page} de staff...`);
      const res = await anilistPost(STAFF_PAGE_QUERY, { id: animeId, page });
      const staff = res?.data?.Media?.staff;
      allStaff = [...allStaff, ...(staff?.nodes || [])];
      hasMoreStaff = !!staff?.pageInfo?.hasNextPage;
    }

    await prisma.anime.update({
      where: { id: animeId },
      data: { staffData: allStaff, isComplete: true, lastSyncAt: new Date() }
    });
    console.log(`[Sync] Éxito total para anime ${animeId} (${allStaff.length} staff)`);
  }

  private async saveCharacters(animeId: number, edges: any[]) {
    await mapWithConcurrency(edges, 5, async (edge: any) => {
      const char = edge.node;
      try {
        const charDescTranslated = await translateText(char.description);
        await prisma.character.upsert({
          where: { id: char.id },
          update: { name: char.name?.full || 'Unknown', image: char.image?.large || null, description: charDescTranslated },
          create: { id: char.id, name: char.name?.full || 'Unknown', image: char.image?.large || null, description: charDescTranslated }
        });
        await prisma.characterOnAnime.upsert({
          where: { animeId_characterId: { animeId, characterId: char.id } },
          update: { role: edge.role, voiceActorsData: edge.voiceActors || [] },
          create: { animeId, characterId: char.id, role: edge.role, voiceActorsData: edge.voiceActors || [] }
        });
      } catch (e: any) {
        logger.error(`[AnimeService] Error vinculando personaje ${char?.id}: ${e.message}`);
      }
    });
  }

  async searchExternal(search: string) {
    const query = `
      query ($search: String) {
        Page(perPage: 5) {
          media(search: $search, type: ANIME) {
            id
            title { romaji english native }
            coverImage { extraLarge }
            format
            averageScore
          }
        }
      }
    `;

    try {
      const response = await axios.post(ANILIST_URL, { query, variables: { search } });
      const media = response.data.data.Page.media;

      if (!media || media.length === 0) return [];

      // Guardado rápido de resultados para persistencia progresiva
      const savedAnimes = [];
      for (const item of media) {
        const titleStr = item.title.english || item.title.romaji;
        const slug = `${item.id}-${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
        
        const anime = await prisma.anime.upsert({
          where: { id: item.id },
          update: {}, // No sobreescribir si ya existe, solo queremos asegurar que esté
          create: {
            id: item.id,
            slug,
            titleRomaji: item.title.romaji,
            titleEnglish: item.title.english,
            titleNative: item.title.native,
            coverImage: item.coverImage.extraLarge,
            type: item.format, // Mapeamos format a type que sí existe en el esquema
            averageScore: item.averageScore,
            isComplete: false 
          }
        });
        savedAnimes.push(anime);
      }

      return savedAnimes;
    } catch (error) {
      logger.error(`[AnimeService] Error en búsqueda externa: ${error}`);
      return [];
    }
  }

  async searchExternalCharacters(search: string) {
    const query = `
      query ($search: String) {
        Page(perPage: 5) {
          characters(search: $search) {
            id
            name { full }
            image { large }
          }
        }
      }
    `;

    try {
      const response = await axios.post(ANILIST_URL, { query, variables: { search } });
      return response.data.data.Page.characters || [];
    } catch (error) {
      logger.error(`[AnimeService] Error en búsqueda de personajes: ${error}`);
      return [];
    }
  }
}
