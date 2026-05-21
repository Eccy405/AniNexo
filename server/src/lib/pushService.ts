import webpush from 'web-push';
import { logger } from './logger';

/**
 * Servicio para envío de notificaciones Push (Web Push)
 */
export class PushService {
  constructor() {
    // En producción estas llaves vendrían de .env
    const vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'BIm_lfKczXUqbzHq3wH3GgquLcSwQuNmShx0Fk7FQDm6GZwtXPxz1plohkVTEisOFRVJWqOGWXMgiDcTxuZHtbE',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'sD0ailjwUK7XcpzC3lLDgVBDmP2rVIqI-lExGtlflIM'
    };

    webpush.setVapidDetails(
      'mailto:admin@aninexo.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }

  async sendPush(subscription: any, title: string, body: string, icon?: string) {
    try {
      const payload = JSON.stringify({
        notification: {
          title,
          body,
          icon: icon || '/logo.png',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          }
        }
      });

      await webpush.sendNotification(subscription, payload);
      logger.info(`[PushService] Notificación enviada con éxito`);
    } catch (error) {
      logger.error('[PushService] Error enviando push', error);
      // Si el error es 410 (Gone) o 404, deberíamos eliminar la suscripción de la DB
      throw error;
    }
  }
}

export const pushService = new PushService();
