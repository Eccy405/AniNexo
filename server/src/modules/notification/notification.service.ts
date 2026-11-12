import prisma from '../../lib/prisma';
import { NotificationType } from '@prisma/client';
import { socketService } from '../../lib/socketService';
import { emailService } from '../../lib/emailService';
import { pushService } from '../../lib/pushService';
import { logger } from '../../lib/logger';

export class NotificationService {
  /**
   * Crea una notificación y la distribuye por los canales permitidos
   */
  async createNotification(userId: string, type: NotificationType, data: { title: string, message: string, referenceId?: string }) {
    try {
      // 1. Obtener preferencias del usuario
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId_type: { userId, type } }
      });

      // Si no hay preferencias, usamos valores por defecto (todo activado)
      const emailEnabled = prefs ? prefs.emailEnabled : true;
      const pushEnabled = prefs ? prefs.pushEnabled : true;
      const inAppEnabled = prefs ? prefs.inAppEnabled : true;

      let notification = null;

      // 2. Notificación In-App (Persistente en DB)
      if (inAppEnabled) {
        if (type === 'MESSAGE' && data.referenceId) {
          const existingUnread = await prisma.notification.findFirst({
            where: {
              userId,
              type: 'MESSAGE',
              referenceId: data.referenceId,
              isRead: false
            },
            orderBy: { createdAt: 'desc' }
          });

          if (existingUnread) {
            notification = await prisma.notification.update({
              where: { id: existingUnread.id },
              data: { createdAt: new Date() }
            });

            // Limpiar posibles duplicados antiguos sin leer de esa misma conversación
            await prisma.notification.deleteMany({
              where: {
                userId,
                type: 'MESSAGE',
                referenceId: data.referenceId,
                isRead: false,
                id: { not: existingUnread.id }
              }
            }).catch(() => {});
          } else {
            notification = await prisma.notification.create({
              data: {
                userId,
                type,
                referenceId: data.referenceId,
                title: data.title,
                message: data.message,
                isRead: false
              }
            });
          }
        } else {
          notification = await prisma.notification.create({
            data: {
              userId,
              type,
              referenceId: data.referenceId ?? null,
              title: data.title,
              message: data.message,
              isRead: false
            }
          });
        }

        // Emitir vía WebSocket (Tiempo Real)
        socketService.emitToUser(userId, 'notification', {
          ...notification,
          title: data.title,
          message: data.message,
          ...(type === 'MESSAGE' && data.referenceId ? { conversationId: data.referenceId } : {})
        });
      }

      // 3. Notificación vía Email
      if (emailEnabled) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          emailService.sendTemplateEmail(user.email, 'NOTIFICATION', {
            title: data.title,
            message: data.message
          }).catch(err => logger.error('Error enviando email notification', err));
        }
      }

      // 4. Notificación vía Push
      if (pushEnabled) {
        const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
        for (const sub of subscriptions) {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };
          pushService.sendPush(pushConfig, data.title, data.message)
            .catch(err => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                // Eliminar suscripción expirada
                prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
              }
            });
        }
      }

      return notification;
    } catch (error) {
      logger.error('Error en createNotification orquestado', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string) {
    const rawNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const enriched = await Promise.all(
      rawNotifications.map(async (n) => {
        let sender: { id: string; username: string; avatarUrl: string | null } | null = null;
        let message = '';
        let title = '';
        let actionRequired = false;
        let conversationId: string | null = null;
        let isGroup = false;

        if (n.type === 'FOLLOW' && n.referenceId) {
          const senderUser = await prisma.user.findUnique({
            where: { id: n.referenceId },
            select: { id: true, username: true, avatarUrl: true }
          });
          if (senderUser) {
            sender = senderUser;
            title = '¡Nuevo seguidor!';
            message = `@${senderUser.username} comenzó a seguirte.`;
          } else {
            title = '¡Nuevo seguidor!';
            message = 'Alguien comenzó a seguirte.';
          }
        } else if (n.type === 'SYSTEM' && (n as any).title && (n as any).message) {
          title = (n as any).title;
          message = (n as any).message;
          actionRequired = false;
        } else if (n.type === 'SYSTEM' && n.referenceId && !n.referenceId.startsWith('PREMIUM_')) {
          const [senderUser, pendingIncoming, acceptedFriendship] = await Promise.all([
            prisma.user.findUnique({
              where: { id: n.referenceId },
              select: { id: true, username: true, avatarUrl: true }
            }),
            prisma.friendship.findUnique({
              where: { userId_friendId: { userId: n.referenceId, friendId: userId } }
            }),
            prisma.friendship.findFirst({
              where: {
                status: 'ACCEPTED',
                OR: [
                  { userId, friendId: n.referenceId },
                  { userId: n.referenceId, friendId: userId }
                ]
              }
            })
          ]);

          if (pendingIncoming?.status === 'PENDING' && senderUser) {
            sender = senderUser;
            title = 'Solicitud de Amistad';
            message = `@${senderUser.username} te ha enviado una solicitud de amistad.`;
            actionRequired = true;
          } else if (acceptedFriendship && senderUser) {
            sender = senderUser;
            title = '¡Nuevo amigo!';
            message = `Tú y @${senderUser.username} ahora son amigos.`;
            actionRequired = false;
          } else {
            // Solicitud expirada/cancelada o rechazada -> no mostrar notificación fantasma
            return null;
          }
        } else if (n.type === 'MESSAGE' && n.referenceId) {
          conversationId = n.referenceId;
          const conv = await prisma.conversation.findUnique({
            where: { id: n.referenceId },
            include: {
              participants: {
                include: { user: { select: { id: true, username: true, avatarUrl: true } } }
              },
              messages: {
                where: { senderId: { not: userId } },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: { sender: { select: { id: true, username: true, avatarUrl: true } } }
              }
            }
          });

          if (conv) {
            isGroup = conv.isGroup;
            const latestMsg: any = conv.messages?.[0];
            const msgSender = latestMsg?.sender
              || conv.participants.find((p) => p.userId !== userId)?.user
              || null;
            sender = msgSender;

            let actionText = 'te envió un mensaje';
            if (latestMsg?.content) {
              const raw = String(latestMsg.content);
              if (raw.startsWith('[IMAGE]')) {
                actionText = 'te envió una imagen 📷';
              } else if (raw.startsWith('[GIF]')) {
                actionText = 'te envió un GIF 🎞️';
              } else if (raw.startsWith('[AUDIO]')) {
                actionText = 'te envió un mensaje de voz 🎙️';
              } else {
                const preview = raw.length > 48 ? `${raw.substring(0, 45)}...` : raw;
                actionText = `te envió un mensaje: "${preview}"`;
              }
            }

            if (conv.isGroup) {
              const groupName = conv.name || 'Grupo';
              title = `Nuevo mensaje en ${groupName}`;
              message = sender
                ? `@${sender.username} en ${groupName}: ${actionText.replace('te envió ', '')}`
                : `Tienes un nuevo mensaje en ${groupName}.`;
            } else if (sender) {
              title = `Nuevo mensaje de @${sender.username}`;
              message = `@${sender.username} ${actionText}`;
            } else {
              title = 'Nuevo mensaje';
              message = 'Tienes un nuevo mensaje sin leer.';
            }
          } else {
            // Fallback por si referenceId fuera un userId antiguo
            const fallbackUser = await prisma.user.findUnique({
              where: { id: n.referenceId },
              select: { id: true, username: true, avatarUrl: true }
            });
            if (fallbackUser) {
              sender = fallbackUser;
              title = `Nuevo mensaje de @${fallbackUser.username}`;
              message = `@${fallbackUser.username} te envió un mensaje.`;
            } else {
              title = 'Nuevo mensaje';
              message = 'Tienes un nuevo mensaje en tu chat.';
            }
          }
        } else if (n.type === 'LIKE' && n.referenceId) {
          // El referenceId es el postId. Busquemos la última reacción en ese post
          const lastLike = await prisma.like.findFirst({
            where: { postId: n.referenceId, NOT: { userId } },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } }
          });
          if (lastLike) {
            sender = lastLike.user;
            title = '¡Reacción!';
            message = `@${lastLike.user.username} reaccionó a tu publicación.`;
          } else {
            title = '¡Reacción!';
            message = 'Alguien reaccionó a tu publicación.';
          }
        } else if (n.type === 'COMMENT' && n.referenceId) {
          // El referenceId es el postId. Busquemos el último comentario en ese post
          const lastComment = await prisma.comment.findFirst({
            where: { postId: n.referenceId, NOT: { userId } },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, username: true, avatarUrl: true } } }
          });
          if (lastComment) {
            sender = lastComment.user;
            title = 'Nuevo comentario';
            message = `@${lastComment.user.username} comentó en tu publicación.`;
          } else {
            title = 'Nuevo comentario';
            message = 'Alguien comentó en tu publicación.';
          }
        }

        // Valores por defecto
        if (!message) {
          if (n.type === 'BADGE') {
            title = '¡Nueva medalla!';
            message = '¡Has ganado una nueva medalla en AniNexo!';
          } else if (n.type === 'NEXO') {
            title = 'Nexo IA';
            message = 'Nexo IA tiene un mensaje para ti.';
          } else if (n.type === 'MESSAGE') {
            title = 'Nuevo mensaje';
            message = 'Tienes un nuevo mensaje en tu cuenta.';
          } else {
            title = 'Actualización del Nexo';
            message = 'Tienes una nueva notificación en tu cuenta.';
          }
        }

        return {
          ...n,
          title,
          message,
          sender,
          actionRequired,
          conversationId,
          isGroup
        };
      })
    );

    return enriched.filter((item): item is NonNullable<typeof item> => item !== null);
  }

  async markAsRead(notificationId: string, userId?: string) {
    if (userId) {
      return prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true }
      });
    }
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { id: notificationId, userId }
    });
  }

  async markConversationNotificationsRead(userId: string, conversationId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        type: 'MESSAGE',
        referenceId: conversationId,
        isRead: false
      },
      data: { isRead: true }
    });
  }

  async clearFriendRequestNotifications(userId: string, friendId: string) {
    return prisma.notification.deleteMany({
      where: {
        userId,
        type: 'SYSTEM',
        referenceId: friendId
      }
    });
  }

  async getPreferences(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId }
    });
  }

  async updatePreference(userId: string, type: NotificationType, channels: { email?: boolean, push?: boolean, inApp?: boolean }) {
    // Para evitar errores de exactOptionalPropertyTypes: true, solo incluimos las propiedades definidas
    const updateData: any = {};
    if (channels.email !== undefined) updateData.emailEnabled = channels.email;
    if (channels.push !== undefined) updateData.pushEnabled = channels.push;
    if (channels.inApp !== undefined) updateData.inAppEnabled = channels.inApp;

    return prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      update: updateData,
      create: {
        userId,
        type,
        emailEnabled: channels.email ?? true,
        pushEnabled: channels.push ?? true,
        inAppEnabled: channels.inApp ?? true
      }
    });
  }

  async savePushSubscription(userId: string, subscription: any) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
  }
}

export const notificationService = new NotificationService();
