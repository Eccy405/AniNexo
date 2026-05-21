import prisma from '../../lib/prisma';
import { NotificationService } from '../notification/notification.service';
import { BadgeService } from './badge.service';
import { logger } from '../../lib/logger';

const notificationService = new NotificationService();
const badgeService = new BadgeService();

export class SocialService {
  
  // Follow/Unfollow a user with Counters
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('No puedes seguirte a ti mismo');
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.$transaction([
        prisma.follow.delete({ where: { id: existingFollow.id } }),
        prisma.user.update({
          where: { id: followerId },
          data: { followingCount: { decrement: 1 } }
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followersCount: { decrement: 1 } }
        })
      ]);
      return { followed: false };
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follow.create({ data: { followerId, followingId } }),
        prisma.user.update({
          where: { id: followerId },
          data: { followingCount: { increment: 1 } }
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followersCount: { increment: 1 } }
        })
      ]);

      // Async: Notificar al usuario seguido
      notificationService.createNotification(followingId, 'FOLLOW', {
        title: '¡Tienes un nuevo seguidor!',
        message: 'Un usuario ha comenzado a seguirte.',
        referenceId: followerId
      }).catch(err => logger.error('[Social]: Error enviando notificación', err));

      // Trigger: Medalla Socialite
      badgeService.checkSocialite(followerId).catch(err => logger.error('[Social]: Error en badge check', err));

      return { followed: true };
    }
  }

  // Like/Unlike a Post or Comment with Counters
  async toggleLike(userId: string, postId?: string, commentId?: string) {
    if (!postId && !commentId) throw new Error('Debes proporcionar un postId o un commentId');

    if (postId) {
      const existingLike = await prisma.like.findUnique({
        where: { userId_postId: { userId, postId } }
      });

      if (existingLike) {
        await prisma.$transaction([
          prisma.like.delete({ where: { id: existingLike.id } }),
          prisma.post.update({
            where: { id: postId },
            data: { likesCount: { decrement: 1 } }
          })
        ]);
        return { liked: false };
      } else {
        await prisma.$transaction([
          prisma.like.create({ data: { userId, postId } }),
          prisma.post.update({
            where: { id: postId },
            data: { likesCount: { increment: 1 } }
          })
        ]);
        
        // Notificación opcional
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
        if (post && post.userId !== userId) {
          notificationService.createNotification(post.userId, 'LIKE', {
            title: '¡A alguien le gusta tu post!',
            message: 'Un usuario ha dado like a tu publicación.',
            referenceId: postId
          }).catch(err => logger.error('[Social]: Error enviando notificación like', err));
        }

        return { liked: true };
      }
    }

    if (commentId) {
       const existingLike = await prisma.like.findUnique({
        where: { userId_commentId: { userId, commentId } }
      });

      if (existingLike) {
        await prisma.$transaction([
          prisma.like.delete({ where: { id: existingLike.id } }),
          prisma.comment.update({
            where: { id: commentId },
            data: { likesCount: { decrement: 1 } }
          })
        ]);
        return { liked: false };
      } else {
        await prisma.$transaction([
          prisma.like.create({ data: { userId, commentId } }),
          prisma.comment.update({
            where: { id: commentId },
            data: { likesCount: { increment: 1 } }
          })
        ]);
        return { liked: true };
      }
    }

    throw new Error('Estado inválido para el Like');
  }

  // Bloquear/Desbloquear usuario
  async toggleBlock(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new Error('No puedes bloquearte a ti mismo');

    const existingBlock = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } }
    });

    if (existingBlock) {
      await prisma.block.delete({ where: { id: existingBlock.id } });
      return { blocked: false };
    } else {
      await prisma.block.create({ data: { blockerId, blockedId } });
      // Al bloquear, también eliminamos el follow si existe
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId }
          ]
        }
      });
      return { blocked: true };
    }
  }

  // Silenciar usuario (Mute)
  async muteUser(userId: string, targetId: string, reason: string, hours: number = 24) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    return prisma.mute.create({
      data: {
        userId: targetId,
        reason,
        expiresAt
      }
    });
  }

  // Obtener Perfil Completo (Optimizado con contadores)
  async getUserProfile(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        badges: { include: { badge: true } },
        animeLists: { take: 10, orderBy: { updatedAt: 'desc' }, include: { anime: true } }
      }
    });

    if (!user) throw new Error('Usuario no encontrado');

    if (viewerId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: user.id },
            { blockerId: user.id, blockedId: viewerId }
          ]
        }
      });
      if (block) throw new Error('No tienes permiso para ver este perfil');
    }

    return user;
  }

  // Obtener el Feed para un usuario (Optimizado con contadores)
  async getFeed(userId: string, limit: number = 20, offset: number = 0) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    return prisma.post.findMany({
      where: {
        userId: { in: followingIds }
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true, isPremium: true }
        },
        likes: { where: { userId }, select: { id: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }
}
