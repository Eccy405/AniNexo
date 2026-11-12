import prisma from '../../lib/prisma';
import { WatchStatus } from '@prisma/client';
import { BadgeService } from '../social/badge.service';

const badgeService = new BadgeService();

export class ListService {
  async addOrUpdateEntry(userId: string, animeId: number, status: WatchStatus, score?: number, progress?: number) {
    const entry = await prisma.animeList.upsert({
      where: {
        userId_animeId: {
          userId,
          animeId
        }
      },
      update: {
        status,
        ...(score !== undefined && { score }),
        ...(progress !== undefined && { progress })
      },
      create: {
        userId,
        animeId,
        status,
        score: score ?? null,
        progress: progress || 0
      }
    });
    
    // Evaluar logros reales del usuario
    await badgeService.syncUserBadges(userId);

    return entry;
  }

  async getUserList(username: string) {
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
      select: { id: true, showWatchList: true }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const list = await prisma.animeList.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        anime: {
          select: {
            id: true,
            titleRomaji: true,
            titleEnglish: true,
            coverImage: true,
            bannerImage: true,
            episodes: true,
            type: true,
            averageScore: true
          }
        }
      }
    });

    return list;
  }
}
