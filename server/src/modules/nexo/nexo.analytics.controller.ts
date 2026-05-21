import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

export class NexoAnalyticsController {
  /**
   * Obtiene un resumen del uso de la IA
   */
  async getUsageOverview(req: Request, res: Response) {
    try {
      const totalInteractions = await prisma.nexoInteraction.count();
      
      const tokensByModel = await prisma.nexoInteraction.groupBy({
        by: ['modelUsed'],
        _sum: { tokensUsed: true },
        _count: { id: true }
      });

      const recentLogs = await prisma.nexoInteraction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          type: true,
          input: true,
          sentiment: true,
          createdAt: true
        }
      });

      res.json({
        totalInteractions,
        tokensByModel: tokensByModel as any,
        recentLogs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * (Opcional) Análisis de sentimiento básico por palabras clave
   */
  async getSentimentReport(req: Request, res: Response) {
    // Implementación futura con IA
    res.json({ message: "Análisis de sentimiento detallado próximamente." });
  }
}
