import { Queue, Worker, Job } from 'bullmq';
import { redis } from './redis';
import { logger } from './logger';

// Tipos de colas disponibles
export const QUEUES = {
  ANIME_SYNC: 'anime-sync',
  NOTIFICATIONS: 'notifications',
  NEXO_AI: 'nexo-ai',
  EMAILS: 'emails',
  ANALYTICS: 'analytics',
};

// Mapa de colas inicializadas
const activeQueues: Record<string, Queue> = {};

export const getQueue = (name: string) => {
  if (!process.env.REDIS_URL) return null;
  
  if (!activeQueues[name]) {
    activeQueues[name] = new Queue(name, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    });
    logger.info(`[Queue]: Cola "${name}" inicializada.`);
  }
  return activeQueues[name];
};

export const addJob = async (queueName: string, jobName: string, data: any) => {
  if (!process.env.REDIS_URL) {
    logger.warn(`[Queue]: REDIS_URL no encontrada. Saltando job ${jobName} en ${queueName}`);
    return null;
  }
  const queue = getQueue(queueName);
  return queue?.add(jobName, data);
};
