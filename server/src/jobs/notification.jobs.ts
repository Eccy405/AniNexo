import cron from 'node-cron';
import prisma from '../lib/prisma';
import { notificationService } from '../modules/notification/notification.service';
import { emailService } from '../lib/emailService';
import { logger } from '../lib/logger';

/**
 * Programador de tareas automáticas para notificaciones y correos
 */
export const initNotificationJobs = () => {
  logger.info('[NotificationJobs] Inicializando schedulers...');

  // 1. Cada minuto - Procesar Cola de Emails
  cron.schedule('* * * * *', async () => {
    await emailService.processQueue();
  });

  // 1. Cada mañana a las 9:00 AM - Recordatorios de Anime (Pendientes)
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Jobs] Ejecutando recordatorios de anime pendientes...');
    try {
      const users = await prisma.user.findMany({
        where: { animeLists: { some: { status: 'WATCHING' } } },
        include: { animeLists: { where: { status: 'WATCHING' }, take: 3 } }
      });

      for (const user of users) {
        if (user.animeLists.length > 0) {
          await notificationService.createNotification(user.id, 'SYSTEM', {
            title: '¡No olvides tu maratón!',
            message: `Tienes ${user.animeLists.length} animes en emisión esperándote. ¡Entra a AniNexo para ver lo nuevo!`
          });
        }
      }
    } catch (error) {
      logger.error('Error en job de recordatorios', error);
    }
  });

  // 2. Cada Lunes a las 10:00 AM - Resumen Semanal Pro
  cron.schedule('0 10 * * 1', async () => {
    logger.info('[Jobs] Enviando resúmenes semanales...');
    // Lógica para enviar emails masivos con actividad de la semana
  });

  // 3. Nexo Proactivo - Cada 12 horas - Mensajes de la IA
  cron.schedule('0 */12 * * *', async () => {
    logger.info('[Jobs] Nexo está analizando a quién saludar...');
    // Lógica para que Nexo envíe mensajes "Hey, ¿has visto esto?" basado en recomendaciones
  });
};
