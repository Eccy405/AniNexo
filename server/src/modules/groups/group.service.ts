import prisma from '../../lib/prisma';

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
}

export class CollectionService {
  async addToCollection(userId: string, animeId: number, status: string = 'PLAN_TO_WATCH') {
    try {
      const existing = await prisma.userCollection.findUnique({
        where: { userId_animeId: { userId, animeId } }
      });
      if (existing) {
        return await prisma.userCollection.update({
          where: { userId_animeId: { userId, animeId } },
          data: { status: status as any }
        });
      }
      return await prisma.userCollection.create({
        data: { userId, animeId, status: status as any }
      });
    } catch (e) {
      throw new Error('Error agregando a la colección');
    }
  }

  async getUserCollection(userId: string) {
    return await prisma.userCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    });
  }
}