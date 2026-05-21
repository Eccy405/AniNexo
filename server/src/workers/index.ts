import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { QUEUES } from '../lib/queue';
import { AnimeService } from '../modules/anime/anime.service';

const animeService = new AnimeService();

export const startWorkers = () => {
  if (!process.env.REDIS_URL) {
    logger.warn('[Worker]: REDIS_URL no encontrada. Los workers no se iniciarán.');
    return;
  }

  const animeSyncWorker = new Worker(QUEUES.ANIME_SYNC, async (job: Job) => {
    const { animeId } = job.data;
    logger.info(`[Worker]: Sincronizando metadata para anime ${animeId}...`);
    
    try {
      // Forzar actualización desde AniList y persistir
      await animeService.syncWithExternal(animeId);
      logger.info(`[Worker]: Anime ${animeId} sincronizado con éxito.`);
    } catch (error) {
      logger.error(`[Worker]: Error sincronizando anime ${animeId}: ${error}`);
      throw error;
    }
  }, { connection: redis });

  animeSyncWorker.on('failed', (job, err) => {
    logger.error(`[Worker]: Job ${job?.id} falló: ${err.message}`);
  });
  
  logger.info('[Worker]: Todos los trabajadores iniciados.');
};
