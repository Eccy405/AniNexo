import cron from 'node-cron';
import { runAnalyticsSnapshot } from './analytics.job';
import { initNotificationJobs } from './notification.jobs';
import { logger } from '../lib/logger';

export const startJobs = () => {
  logger.info('Initializing background jobs...');

  // Se ejecuta todos los días a medianoche
  cron.schedule('0 0 * * *', () => {
    runAnalyticsSnapshot();
  });

  // Notificaciones automáticas
  initNotificationJobs();

  logger.info('Jobs scheduled.');
};
