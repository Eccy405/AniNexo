import prisma from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class StoryService {
  /**
   * Crea una nueva historia que expira en 24 horas.
   */
  async createStory(userId: string, data: { mediaUrl: string; caption?: string }) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await prisma.userStory.create({
        data: {
          userId,
          mediaUrl: data.mediaUrl,
          caption: data.caption,
          expiresAt,
          viewedBy: []
        }
      });

      logger.info(`[StoryService] Nueva historia creada por el usuario ${userId}`);
      return story;
    } catch (error) {
      logger.error(`[StoryService] Error al crear historia: ${error}`);
      throw error;
    }
  }

  /**
   * Obtiene las historias activas de un usuario y de las personas a las que sigue.
   */
  async getFeedStories(userId: string) {
    try {
      const now = new Date();

      // 1. Obtener IDs de las personas a las que sigue el usuario
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });
      const followingIds = following.map(f => f.followingId);

      // 2. Buscar historias activas de uno mismo y seguidos
      const stories = await prisma.userStory.findMany({
        where: {
          userId: { in: [userId, ...followingIds] },
          expiresAt: { gt: now }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Agrupar por usuario para la UI tipo burbujas de WhatsApp/Instagram
      const grouped = stories.reduce((acc: any, story: any) => {
        if (!acc[story.userId]) {
          acc[story.userId] = {
            user: story.user,
            stories: []
          };
        }
        acc[story.userId].stories.push(story);
        return acc;
      }, {});

      return Object.values(grouped);
    } catch (error) {
      logger.error(`[StoryService] Error al obtener feed de historias: ${error}`);
      throw error;
    }
  }

  /**
   * Registra una visualización de la historia.
   */
  async viewStory(userId: string, storyId: string) {
    try {
      const story = await prisma.userStory.findUnique({ where: { id: storyId } });
      if (!story) throw new Error('Historia no encontrada');

      const viewedBy = (story.viewedBy as string[]) || [];
      if (!viewedBy.includes(userId)) {
        await prisma.userStory.update({
          where: { id: storyId },
          data: {
            viewedBy: [...viewedBy, userId]
          }
        });
      }
      return true;
    } catch (error) {
      logger.error(`[StoryService] Error al marcar historia como vista: ${error}`);
      throw error;
    }
  }

  /**
   * Elimina historias expiradas (Mantenimiento).
   */
  async cleanupExpiredStories() {
    try {
      const result = await prisma.userStory.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      });
      if (result.count > 0) {
        logger.info(`[StoryService] Se han eliminado ${result.count} historias expiradas.`);
      }
    } catch (error) {
      logger.error(`[StoryService] Error en limpieza de historias: ${error}`);
    }
  }
}
