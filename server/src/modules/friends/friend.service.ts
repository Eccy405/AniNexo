import prisma from '../../lib/prisma';
import { notificationService } from '../notification/notification.service';

export class FriendService {
  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new Error('No puedes agregarte como amigo de ti mismo');
    }

    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    const txResult = await prisma.$transaction(async (tx) => {
      const relations = await tx.friendship.findMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      if (relations.some((r) => r.status === 'BLOCKED')) {
        throw new Error('No es posible enviar solicitud a este usuario');
      }

      const accepted = relations.find((r) => r.status === 'ACCEPTED');
      if (accepted) {
        if (relations.length > 1) {
          await tx.friendship.deleteMany({
            where: {
              id: { not: accepted.id },
              OR: [
                { userId, friendId },
                { userId: friendId, friendId: userId }
              ]
            }
          });
        }
        throw new Error('Ya son amigos');
      }

      const outgoing = relations.find((r) => r.userId === userId && r.friendId === friendId);
      const incoming = relations.find((r) => r.userId === friendId && r.friendId === userId);

      if (incoming?.status === 'PENDING') {
        await tx.friendship.update({
          where: { id: incoming.id },
          data: { status: 'ACCEPTED' }
        });
        await tx.friendship.deleteMany({
          where: {
            id: { not: incoming.id },
            OR: [
              { userId, friendId },
              { userId: friendId, friendId: userId }
            ]
          }
        });
        return { status: 'ACCEPTED' as const, autoAccepted: true };
      }

      if (outgoing?.status === 'PENDING') {
        throw new Error('Ya enviaste solicitud de amistad');
      }

      if (outgoing) {
        await tx.friendship.update({
          where: { id: outgoing.id },
          data: { status: 'PENDING' }
        });
      } else {
        await tx.friendship.create({
          data: { userId, friendId, status: 'PENDING' }
        });
      }

      return { status: 'PENDING' as const, autoAccepted: false };
    });

    if (txResult.autoAccepted) {
      await notificationService.clearFriendRequestNotifications(userId, friendId).catch(() => {});
      await notificationService.clearFriendRequestNotifications(friendId, userId).catch(() => {});
      await notificationService.createNotification(friendId, 'SYSTEM', {
        title: '¡Nuevo amigo!',
        message: `Tú y @${sender?.username || 'un usuario'} ahora son amigos.`,
        referenceId: userId
      }).catch(() => {});
      return { status: 'ACCEPTED' };
    }

    await notificationService.clearFriendRequestNotifications(friendId, userId).catch(() => {});
    await notificationService.createNotification(friendId, 'SYSTEM', {
      title: 'Nueva solicitud de amistad',
      message: `@${sender?.username || 'Alguien'} te ha enviado una solicitud de amistad.`,
      referenceId: userId
    }).catch(() => {});

    return { status: 'PENDING' };
  }

  async acceptFriendRequest(userId: string, friendId: string) {
    const txResult = await prisma.$transaction(async (tx) => {
      const relations = await tx.friendship.findMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      const alreadyAccepted = relations.find((r) => r.status === 'ACCEPTED');
      if (alreadyAccepted) {
        if (relations.length > 1) {
          await tx.friendship.deleteMany({
            where: {
              id: { not: alreadyAccepted.id },
              OR: [
                { userId, friendId },
                { userId: friendId, friendId: userId }
              ]
            }
          });
        }
        return { status: 'ACCEPTED' as const, alreadyFriends: true, found: true };
      }

      const incoming = relations.find(
        (r) => r.userId === friendId && r.friendId === userId && r.status === 'PENDING'
      );

      if (!incoming) {
        return { found: false as const, alreadyFriends: false };
      }

      await tx.friendship.update({
        where: { id: incoming.id },
        data: { status: 'ACCEPTED' }
      });

      // Eliminar cualquier registro espejo o duplicado entre ambos usuarios
      await tx.friendship.deleteMany({
        where: {
          id: { not: incoming.id },
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });

      return { status: 'ACCEPTED' as const, alreadyFriends: false, found: true };
    });

    await notificationService.clearFriendRequestNotifications(userId, friendId).catch(() => {});
    await notificationService.clearFriendRequestNotifications(friendId, userId).catch(() => {});

    if (!txResult.found) {
      throw new Error('Solicitud de amistad no encontrada');
    }

    if (txResult.alreadyFriends) {
      return { status: 'ACCEPTED', alreadyFriends: true };
    }

    const acceptor = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    await notificationService.createNotification(friendId, 'SYSTEM', {
      title: '¡Nuevo amigo!',
      message: `@${acceptor?.username || 'Alguien'} aceptó tu solicitud de amistad.`,
      referenceId: userId
    }).catch(() => {});

    return { status: 'ACCEPTED' };
  }

  async rejectFriendRequest(userId: string, friendId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.friendship.deleteMany({
        where: {
          status: 'PENDING',
          OR: [
            { userId: friendId, friendId: userId },
            { userId, friendId }
          ]
        }
      });
    });

    await notificationService.clearFriendRequestNotifications(userId, friendId).catch(() => {});
    await notificationService.clearFriendRequestNotifications(friendId, userId).catch(() => {});
    return { rejected: true };
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
        user: { select: { id: true, username: true, avatarUrl: true, isPremium: true } },
        friend: { select: { id: true, username: true, avatarUrl: true, isPremium: true } }
      }
    });

    const uniqueFriends = new Map<string, any>();
    for (const f of friendships as Array<{ userId: string; friendId: string; user: any; friend: any }>) {
      const other = f.userId === userId ? f.friend : f.user;
      if (other?.id && other.id !== userId && !uniqueFriends.has(other.id)) {
        uniqueFriends.set(other.id, other);
      }
    }

    return Array.from(uniqueFriends.values());
  }

  async getPendingRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: { friendId: userId, status: 'PENDING' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    const unique = new Map<string, { id: string; username: string; avatarUrl: string | null }>();
    for (const r of requests as Array<{ user: any }>) {
      if (r.user?.id && !unique.has(r.user.id)) {
        unique.set(r.user.id, {
          id: r.user.id,
          username: r.user.username,
          avatarUrl: r.user.avatarUrl
        });
      }
    }
    return Array.from(unique.values());
  }

  async removeFriend(userId: string, friendId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });

      await tx.friendNickname.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId }
          ]
        }
      });
    });

    await notificationService.clearFriendRequestNotifications(userId, friendId).catch(() => {});
    await notificationService.clearFriendRequestNotifications(friendId, userId).catch(() => {});

    return { removed: true };
  }

  async setFriendNickname(userId: string, friendId: string, nickname: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'ACCEPTED' },
          { userId: friendId, friendId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    if (!friendship) {
      throw new Error('No son amigos');
    }

    return prisma.friendNickname.upsert({
      where: { userId_friendId: { userId, friendId } },
      create: { userId, friendId, nickname },
      update: { nickname }
    });
  }

  async getFriendNickname(userId: string, friendId: string) {
    const nickname = await prisma.friendNickname.findUnique({
      where: { userId_friendId: { userId, friendId } }
    });

    return nickname?.nickname || null;
  }

  async getUserFriendsWithNicknames(userId: string) {
    const friends = await this.getFriends(userId);

    const friendsWithNicknames = await Promise.all(
      friends.map(async (friend: any) => {
        const nickname = await this.getFriendNickname(userId, friend.id);
        return { ...friend, nickname: nickname || friend.username };
      })
    );

    return friendsWithNicknames;
  }

  async sendMessageToFriend(userId: string, friendId: string, content: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'ACCEPTED' },
          { userId: friendId, friendId: userId, status: 'ACCEPTED' }
        ]
      }
    });

    if (!friendship) {
      throw new Error('No son amigos');
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          some: { userId: userId }
        },
        AND: {
          participants: {
            some: { userId: friendId }
          }
        }
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId },
              { userId: friendId }
            ]
          }
        }
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    return { conversationId: conversation.id, message };
  }
}
