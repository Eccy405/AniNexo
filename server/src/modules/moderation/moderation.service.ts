import prisma from '../../lib/prisma';
import { logger } from '../../lib/logger';

export class ModerationService {
  
  async submitReport(data: {
    reporterId: string, 
    reportedUserId: string, 
    reason: string,
    postId?: string,
    commentId?: string,
    messageId?: string
  }) {
    if (data.reporterId === data.reportedUserId) {
      throw new Error('No puedes reportarte a ti mismo');
    }

    return await prisma.report.create({
      data: {
        reporterId: data.reporterId,
        reportedUserId: data.reportedUserId,
        reason: data.reason,
        postId: data.postId ?? null,
        commentId: data.commentId ?? null,
        messageId: data.messageId ?? null
      }
    });
  }

  async issueWarning(moderatorId: string, userId: string, reason: string) {
    return await prisma.$transaction(async (tx) => {
      const warning = await tx.warning.create({
        data: { userId, reason, moderatorId }
      });

      await tx.moderationLog.create({
        data: {
          moderatorId,
          targetUserId: userId,
          action: 'WARNING',
          reason
        }
      });

      return warning;
    });
  }

  async applyMute(moderatorId: string, userId: string, reason: string, hours: number) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);

    return await prisma.$transaction(async (tx) => {
      const mute = await tx.mute.create({
        data: { userId, reason, expiresAt, moderatorId }
      });

      await tx.moderationLog.create({
        data: {
          moderatorId,
          targetUserId: userId,
          action: 'MUTE',
          reason: `${reason} (Duración: ${hours}h)`
        }
      });

      return mute;
    });
  }

  async applyBan(moderatorId: string, userId: string, reason: string, days?: number) {
    let expiresAt: Date | null = null;
    if (days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    return await prisma.$transaction(async (tx) => {
      const ban = await tx.ban.create({
        data: { userId, reason, expiresAt, moderatorId }
      });

      await tx.moderationLog.create({
        data: {
          moderatorId,
          targetUserId: userId,
          action: 'BAN',
          reason: `${reason} (Duración: ${days ? days + ' días' : 'Permanente'})`
        }
      });

      return ban;
    });
  }

  async resolveReport(moderatorId: string, reportId: string, status: 'RESOLVED' | 'DISMISSED', internalNote: string) {
    return await prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id: reportId },
        data: { status }
      });

      await tx.moderationLog.create({
        data: {
          moderatorId,
          targetUserId: report.reportedUserId,
          action: 'RESOLVE_REPORT',
          reason: `Reporte ${reportId} marcado como ${status}. Nota: ${internalNote}`
        }
      });

      return report;
    });
  }

  async getUserModerationHistory(identifier: string) {
    return await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { username: identifier }
        ]
      },
      include: {
        warnings: { orderBy: { createdAt: 'desc' } },
        mutes: { orderBy: { createdAt: 'desc' } },
        bans: { orderBy: { createdAt: 'desc' } },
        moderationLogs: { orderBy: { createdAt: 'desc' } },
        reportsReceived: { orderBy: { createdAt: 'desc' } }
      }
    });
  }
}
