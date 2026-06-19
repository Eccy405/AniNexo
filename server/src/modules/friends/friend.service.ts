import prisma from '../../lib/prisma';
import { notificationService } from '../notification/notification.service';

export class FriendService {
  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new Error('No puedes agregarte como amigo de ti mismo');
    }

    const existing = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId } }
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new Error('Ya enviaste solicitud de amistad');
      }
      if (existing.status === 'ACCEPTED') {
        throw new Error('Ya son amigos');
      }
    }

    const reverse = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId: friendId, friendId: userId } }
    });

    if (reverse?.status === 'PENDING') {
      await prisma.friendship.update({
        where: { userId_friendId: { userId: friendId, friendId: userId } },
        data: { status: 'ACCEPTED' }
      });
      await notificationService.createNotification(friendId, 'SYSTEM', {
        title: 'Amistad aceptada',
        message: 'Ahora son amigos',
        referenceId: friendId
      }).catch(() => {});
      return { status: 'ACCEPTED' };
    }

    await prisma.friendship.create({
      data: { userId, friendId, status: 'PENDING' }
    });

    await notificationService.createNotification(friendId, 'SYSTEM', {
      title: 'Nueva solicitud de amistad',
      message: 'Te ha enviado una solicitud de amistad',
      referenceId: userId
    }).catch(() => {});

    return { status: 'PENDING' };
  }

  async acceptFriendRequest(userId: string, friendId: string) {
    const friendship = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId: friendId, friendId: userId } }
    });

    if (!friendship || friendship.status !== 'PENDING') {
      throw new Error('Solicitud de amistad no encontrada');
    }

    await prisma.friendship.update({
      where: { userId_friendId: { userId: friendId, friendId: userId } },
      data: { status: 'ACCEPTED' }
    });

    await prisma.friendship.create({
      data: { userId, friendId, status: 'ACCEPTED' }
    });

    return { status: 'ACCEPTED' };
  }

  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        friend: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    return friendships.map((f: { userId: string; friendId: string; user: any; friend: any }) => {
      return f.userId === userId ? f.friend : f.user;
    });
  }

  async getPendingRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: { friendId: userId, status: 'PENDING' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    return requests.map((r: { user: any }) => ({
      id: r.user.id,
      username: r.user.username,
      avatarUrl: r.user.avatarUrl
    }));
  }
}