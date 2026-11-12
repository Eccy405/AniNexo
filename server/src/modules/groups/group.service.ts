import prisma from '../../lib/prisma';
import { BadgeService } from '../social/badge.service';

const badgeService = new BadgeService();

export class GroupService {
  async createGroup(userId: string, animeId: number, name: string, description?: string, coverImage?: string) {
    return await prisma.group.create({
      data: {
        name,
        description,
        animeId,
        coverImage,
        createdBy: userId,
        isPublic: true
      },
      include: {
        creator: { select: { username: true, avatarUrl: true } },
        _count: { select: { members: true } }
      }
    });
  }

  async getAnimeGroups(animeId: number) {
    return await prisma.group.findMany({
      where: { animeId },
      include: {
        creator: { select: { username: true, avatarUrl: true } },
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async joinGroup(userId: string, groupId: string) {
    try {
      await prisma.groupMember.create({
        data: { userId, groupId }
      });
      return { joined: true };
    } catch (e) {
      return { joined: false, error: 'Ya estás en el grupo' };
    }
  }

  async getAllGroups() {
    return await prisma.group.findMany({
      include: {
        creator: { select: { username: true, avatarUrl: true } },
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export class CollectionService {
  async addToCollection(userId: string, animeId: number, status: string = 'PLAN_TO_WATCH') {
    try {
      const existing = await prisma.userCollection.findUnique({
        where: { userId_animeId: { userId, animeId: Number(animeId) } }
      });
      let entry;
      if (existing) {
        entry = await prisma.userCollection.update({
          where: { userId_animeId: { userId, animeId: Number(animeId) } },
          data: { status: status as any }
        });
      } else {
        entry = await prisma.userCollection.create({
          data: { userId, animeId: Number(animeId), status: status as any }
        });
      }
      badgeService.syncUserBadges(userId).catch(() => {});
      return entry;
    } catch (e) {
      throw new Error('Error agregando a la colección');
    }
  }

  async getUserCollection(userId: string) {
    const items = await prisma.userCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });

    if (items.length === 0) return [];

    const animeIds = items.map((i) => i.animeId);
    const animes = await prisma.anime.findMany({
      where: { id: { in: animeIds } },
      select: {
        id: true,
        titleRomaji: true,
        titleEnglish: true,
        coverImage: true,
        bannerImage: true,
        type: true,
        averageScore: true,
        episodes: true
      }
    });
    const animeMap = new Map(animes.map((a) => [a.id, a]));

    return items.map((item) => ({
      ...item,
      anime: animeMap.get(item.animeId) || null
    }));
  }
}
