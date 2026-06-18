import prisma from '../../lib/prisma';
import { BadgeService } from '../social/badge.service';

const badgeService = new BadgeService();

export class FeedService {
  async createPost(userId: string, content: string, animeId?: number, mediaUrl?: string) {
    const post = await prisma.post.create({
      data: {
        userId,
        content,
        animeId: animeId ?? null,
        mediaUrl: mediaUrl ?? null
      },
      include: {
        user: { select: { username: true, avatarUrl: true, isPremium: true } },
        anime: { select: { id: true, titleRomaji: true } },
        _count: { select: { comments: true, likes: true } },
        likes: true
      }
    });

    // Trigger: Medalla Primer Post
    await badgeService.awardBadgeIfEligible(userId, 'Primer Post');

    return post;
  }

  async getGlobalFeed(limit: number = 20) {
    const posts = await prisma.post.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, avatarUrl: true, isPremium: true } },
        comments: {
          include: {
            user: { select: { username: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { comments: true, likes: true } },
        likes: true,
        anime: { select: { id: true, titleRomaji: true, titleEnglish: true } }
      }
    });
    return posts;
  }

  async getUserFeed(userId: string) {
    return await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, avatarUrl: true, isPremium: true } },
        anime: { select: { id: true, titleRomaji: true } },
        _count: { select: { comments: true, likes: true } },
        likes: true
      }
    });
  }

  async getAnimeFeed(animeId: number) {
    return await prisma.post.findMany({
      where: { animeId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, avatarUrl: true, isPremium: true } },
        anime: { select: { id: true, titleRomaji: true } },
        _count: { select: { comments: true, likes: true } },
        likes: true
      }
    });
  }

  async createComment(userId: string, postId: string, content: string) {
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      throw new Error('La publicación no existe');
    }

    const comment = await prisma.comment.create({
      data: {
        userId,
        postId,
        content
      },
      include: {
        user: { select: { username: true, avatarUrl: true } }
      }
    });
    return comment;
  }
}
