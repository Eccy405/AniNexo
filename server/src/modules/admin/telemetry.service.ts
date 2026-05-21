import prisma from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class TelemetryService {
  /**
   * Registra una búsqueda de usuario
   */
  async logSearch(userId: string | null, query: string, resultsCount: number) {
    try {
      await prisma.searchLog.create({
        data: { 
          userId: userId || null, 
          query, 
          resultsCount 
        }
      });
      
      // Actualizar contador diario en el snapshot
      await this.updateDailyMetric('searchCount', 1);
    } catch (error) {
      logger.error('Error logging search telemetry', error);
    }
  }

  /**
   * Registra un evento genérico (Clic en anuncio, conversión, etc.)
   */
  async logEvent(userId: string | null, type: string, payload?: any) {
    try {
      await prisma.telemetryEvent.create({
        data: { 
          userId: userId || null, 
          type, 
          payload: payload ? JSON.stringify(payload) : null 
        }
      });

      if (type === 'AD_CLICK') {
        const adId = payload?.adId;
        if (adId) {
          await prisma.advertisement.update({
            where: { id: adId },
            data: { clicks: { increment: 1 } }
          });
        }
      }
    } catch (error) {
      logger.error('Error logging telemetry event', error);
    }
  }

  /**
   * Inicia una sesión de usuario
   */
  async startSession(userId: string, ip?: string, userAgent?: string) {
    try {
      const ipAddress: string | null = ip || null;
      const ua: string | null = userAgent || null;

      return await prisma.userSession.create({
        data: { 
          userId, 
          ipAddress, 
          userAgent: ua 
        }
      });
    } catch (error) {
      logger.error('Error starting user session', error);
    }
  }

  /**
   * Finaliza una sesión y calcula duración
   */
  async endSession(sessionId: string) {
    try {
      const session = await prisma.userSession.findUnique({ where: { id: sessionId } });
      if (!session) return;

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

      await prisma.userSession.update({
        where: { id: sessionId },
        data: { endTime, duration }
      });

      // Actualizar promedio de sesión en el snapshot diario (simplificado)
      await this.updateAvgSessionDuration(duration);
    } catch (error) {
      logger.error('Error ending user session', error);
    }
  }

  private async updateDailyMetric(field: string, increment: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analyticsSnapshot.upsert({
      where: { date: today },
      update: { [field]: { increment } },
      create: { 
        date: today,
        [field]: increment
      }
    });
  }

  private async updateAvgSessionDuration(newDurationSeconds: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDurationMinutes = newDurationSeconds / 60;

    await prisma.$transaction(async (tx) => {
      const snapshot = await tx.analyticsSnapshot.findUnique({ where: { date: today } });
      if (!snapshot) {
        await tx.analyticsSnapshot.create({
          data: { date: today, avgSessionDuration: newDurationMinutes }
        });
      } else {
        const avg = (snapshot.avgSessionDuration + newDurationMinutes) / 2;
        await tx.analyticsSnapshot.update({
          where: { date: today },
          data: { avgSessionDuration: avg }
        });
      }
    });
  }
}

export const telemetryService = new TelemetryService();
