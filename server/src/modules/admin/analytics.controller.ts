import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

export class AnalyticsController {
  /**
   * Obtiene los animes en tendencia basados en la cantidad de posts vinculados
   * en los últimos 7 días.
   */
  async getTrendingAnimes(req: Request, res: Response) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Agrupar posts por animeId y contar
      const trending = await prisma.post.groupBy({
        by: ['animeId'],
        where: {
          animeId: { not: null },
          createdAt: { gte: sevenDaysAgo }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      });

      // El resultado de groupBy solo da animeId y count. 
      // Necesitamos los datos de la DB para mostrar nombres/imágenes.
      const result = await Promise.all(
        trending.map(async (item) => {
          const anime = await prisma.anime.findUnique({
            where: { id: item.animeId! }
          });
          
          return {
            id: item.animeId,
            name: anime?.titleRomaji || anime?.titleEnglish || 'Unknown',
            image: anime?.coverImage,
            count: `+${item._count.id} menciones`
          };
        })
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
