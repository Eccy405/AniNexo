import prisma from '../../lib/prisma';
import { notificationService } from '../notification/notification.service';

export class MessagingService {
  
  async createOrGetConversation(userA: string, userB: string) {
    // Buscar si ya existe una conversación 1a1 entre estos dos usuarios
    const existingConvos = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [userA, userB] }
          }
        }
      },
      include: {
        participants: true
      }
    });

    const exactMatch = existingConvos.find(c => c.participants.length === 2);
    if (exactMatch) return exactMatch;

    // Si no existe, crear nueva
    return await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: userA },
            { userId: userB }
          ]
        }
      },
      include: {
        participants: true
      }
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    }).catch(() => {});

    // Notificar a los otros participantes
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true }
    });

    const senderName = message.sender?.username || 'Alguien';
    let previewText: string;
    if (content.startsWith('[IMAGE]')) {
      previewText = 'Te envió una imagen 📷';
    } else if (content.startsWith('[GIF]')) {
      previewText = 'Te envió un GIF 🎞️';
    } else if (content.startsWith('[AUDIO]')) {
      previewText = 'Te envió un mensaje de voz 🎙️';
    } else {
      const trimmed = content.length > 50 ? content.substring(0, 47) + '...' : content;
      previewText = `@${senderName}: "${trimmed}"`;
    }

    for (const p of participants) {
      await notificationService.createNotification(p.userId, 'MESSAGE', {
        title: `Nuevo mensaje de @${senderName}`,
        message: previewText,
        referenceId: conversationId
      }).catch(() => {});
    }

    return message;
  }

  async getOtherParticipantIds(conversationId: string, senderId: string): Promise<string[]> {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true }
    });
    return participants.map((p) => p.userId);
  }

  async getUnreadSummary(userId: string) {
    const unreadMessages = await prisma.message.findMany({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: {
          participants: { some: { userId } }
        }
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true
      }
    });

    const byConversation: Record<string, number> = {};
    const bySender: Record<string, number> = {};

    for (const m of unreadMessages) {
      byConversation[m.conversationId] = (byConversation[m.conversationId] || 0) + 1;
      bySender[m.senderId] = (bySender[m.senderId] || 0) + 1;
    }

    return {
      totalUnread: unreadMessages.length,
      byConversation,
      bySender
    };
  }

  async getConversationMessages(conversationId: string, limit: number = 50) {
    return await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: { select: { username: true, avatarUrl: true } }
      }
    });
  }

  async getUserConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }
  
  async markMessagesAsRead(conversationId: string, userId: string) {
    const updated = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    await notificationService.markConversationNotificationsRead(userId, conversationId).catch(() => {});
    return updated;
  }

  async createGroupChat(adminId: string, name: string, participantIds: string[], avatar?: string, theme?: string) {
    return await prisma.conversation.create({
      data: {
        isGroup: true,
        name,
        adminId,
        avatar,
        theme,
        participants: {
          create: participantIds.map(userId => ({ userId }))
        }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } }
        }
      }
    });
  }

  async addParticipants(conversationId: string, participantIds: string[], adminId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { adminId: true, isGroup: true }
    });

    if (!conversation?.isGroup) {
      throw new Error('Esta conversación no es un grupo');
    }
    if (conversation.adminId !== adminId) {
      throw new Error('Solo el administrador puede agregar participantes');
    }

    const existingParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId }
    });
    const existingUserIds = existingParticipants.map((p: { userId: string }) => p.userId);

    const newParticipants = participantIds.filter(id => !existingUserIds.includes(id));

    if (newParticipants.length > 0) {
      await prisma.conversationParticipant.createMany({
        data: newParticipants.map(userId => ({ userId, conversationId }))
      });
    }

    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } }
        }
      }
    });
  }

  async getConversation(conversationId: string) {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: { sender: { select: { username: true, avatarUrl: true } } }
        }
      }
    });
  }
}
