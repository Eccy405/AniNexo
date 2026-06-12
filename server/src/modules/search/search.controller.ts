import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { AnimeService } from '../anime/anime.service';

const animeService = new AnimeService();

export class SearchController {
  globalSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      const query = q as string;

      if (!query || query.length < 2) {
        return res.status(200).json({ success: true, data: { animes: [], users: [] } });
      }

      console.log(`[SearchController] Buscando localmente (case-insensitive): "${query}"`);
      // 1. Buscar Animes Locales
      let animes = await prisma.anime.findMany({
        where: {
          OR: [
            { titleRomaji: { contains: query, mode: 'insensitive' } },
            { titleEnglish: { contains: query, mode: 'insensitive' } },
            { titleNative: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          titleRomaji: true,
          titleEnglish: true,
          coverImage: true,
          type: true,
          averageScore: true
        }
      });

      // 1.5 Activación modo Híbrido (Si hay menos de 5 resultados locales, buscar API)
      if (animes.length < 5) {
        console.log(`[SearchController] Pocos resultados locales (${animes.length}). Activando búsqueda externa para: "${query}"`);
        await animeService.searchExternal(query);

        // Query again to get updated results (now including the synced external ones)
        animes = await prisma.anime.findMany({
          where: {
            OR: [
              { titleRomaji: { contains: query, mode: 'insensitive' } },
              { titleEnglish: { contains: query, mode: 'insensitive' } },
              { titleNative: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 5,
          select: {
            id: true,
            titleRomaji: true,
            titleEnglish: true,
            coverImage: true,
            type: true,
            averageScore: true
          }
        });
      }

      // 2. Buscar Usuarios (Personas)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isPremium: true,
          archetype: true
        }
      });

      console.log(`[SearchController] Resultados para "${query}": ${animes.length} animes, ${users.length} usuarios`);

      // Normalizar respuesta para el frontend
      const normalizedAnimes = animes.map(a => {
        const title = a.titleEnglish || a.titleRomaji;
        console.log(`[Search] Resultado: ID=${a.id}, Título="${title}"`);
        return {
          id: a.id,
          title: title,
          coverImage: a.coverImage,
          type: a.type,
          meanScore: a.averageScore
        };
      });

      res.status(200).json({
        success: true,
        data: {
          animes: normalizedAnimes,
          users
        }
      });
    } catch (error) {
      console.error('[SearchController Error]:', error);
      next(error);
    }
  };

  searchCharacters = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      const query = q as string;
      if (!query || query.length < 2) return res.json({ success: true, data: [] });

      const characters = await animeService.searchExternalCharacters(query);
      res.status(200).json({ success: true, data: characters });
    } catch (error) {
      next(error);
    }
  };
}
