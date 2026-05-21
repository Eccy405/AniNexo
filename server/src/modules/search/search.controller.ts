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

      console.log(`[SearchController] Buscando localmente: "${query}"`);
      // 1. Buscar Animes Locales
      let animes = await prisma.anime.findMany({
        where: {
          OR: [
            { titleRomaji: { contains: query } },
            { titleEnglish: { contains: query } },
            { titleNative: { contains: query } }
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

      // 1.5 Activación modo Híbrido (Si no hay local, buscar API)
      if (animes.length === 0) {
        console.log(`[SearchController] Sin resultados locales. Activando búsqueda externa para: "${query}"`);
        const externalAnimes = await animeService.searchExternal(query);
        // Mapear al formato que espera el controlador
        animes = externalAnimes.map((a: any) => ({
          id: a.id,
          titleRomaji: a.titleRomaji,
          titleEnglish: a.titleEnglish,
          coverImage: a.coverImage,
          type: a.format,
          averageScore: a.averageScore
        }));
      }

      // 2. Buscar Usuarios (Personas)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query } },
            { firstName: { contains: query } },
            { lastName: { contains: query } }
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
