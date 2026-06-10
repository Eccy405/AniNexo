import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

export class AdminController {
  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCount = await prisma.user.count();
      const postCount = await prisma.post.count();
      const commentCount = await prisma.comment.count();
      const premiumUsers = await prisma.user.count({ where: { isPremium: true } });
      const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
      const nexoInteractionsCount = await prisma.nexoInteraction.count();

      const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { username: true, email: true, createdAt: true, role: true }
      });

      res.status(200).json({
        success: true,
        data: {
          metrics: { userCount, postCount, commentCount, premiumUsers, verifiedUsers, nexoInteractionsCount },
          recentUsers
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getEnterpriseStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await prisma.analyticsSnapshot.findMany({
        take: 30,
        orderBy: { date: 'desc' }
      });
      
      const totalRevenue = await prisma.analyticsSnapshot.aggregate({
        _sum: { totalRevenue: true }
      });

      res.status(200).json({
        success: true,
        data: {
          historical: stats,
          totalRevenue: totalRevenue._sum.totalRevenue || 0
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reports = await prisma.report.findMany({
        include: {
          reporter: { select: { username: true } },
          reportedUser: { select: { username: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, data: reports });
    } catch (error) {
      next(error);
    }
  };

  setMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const active = req.body.active;
      await prisma.systemSettings.upsert({
        where: { key: 'MAINTENANCE_MODE' },
        update: { value: String(active) },
        create: { key: 'MAINTENANCE_MODE', value: String(active) }
      });
      res.status(200).json({ success: true, message: `Mantenimiento ${active ? 'Activado' : 'Desactivado'}` });
    } catch (error) {
      next(error);
    }
  };

  updateFeatureFlag = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = req.body.key as string;
      const value = req.body.value;
      
      if (!key) return res.status(400).json({ success: false, message: 'Key is required' });

      await prisma.systemSettings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
      res.status(200).json({ success: true, message: `Flag ${key} actualizado a ${value}` });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.moderationLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          moderator: { select: { username: true } },
          targetUser: { select: { username: true } }
        }
      });
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };

  getFinances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const donations = await prisma.donation.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } }
      });
      const ads = await prisma.advertisement.findMany();
      const totalDonations = await prisma.donation.aggregate({ _sum: { amount: true } });
      
      res.status(200).json({
        success: true,
        data: {
          donations,
          ads,
          totalDonations: totalDonations._sum.amount || 0
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getEmailLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.emailLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  };

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, email: true, role: true, isPremium: true, isVerified: true, createdAt: true }
      });
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  toggleUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params.userId);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: { id: true, username: true, email: true, role: true, isPremium: true, isVerified: true, createdAt: true }
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  toggleUserVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params.userId);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: !user.isVerified },
        select: { id: true, username: true, email: true, role: true, isPremium: true, isVerified: true, createdAt: true }
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  toggleUserPremium = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params.userId);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { isPremium: !user.isPremium },
        select: { id: true, username: true, email: true, role: true, isPremium: true, isVerified: true, createdAt: true }
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  };

  getAnimePersistence = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const animes = await prisma.anime.findMany({
        take: 20,
        orderBy: { updatedAt: 'desc' }
      });
      res.status(200).json({ success: true, data: animes });
    } catch (error) {
      next(error);
    }
  };

  getNexoInteractions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const interactions = await prisma.nexoInteraction.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } }
      });
      res.status(200).json({ success: true, data: interactions });
    } catch (error) {
      next(error);
    }
  };

  getDetailedTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topSearches = await prisma.searchLog.groupBy({
        by: ['query'],
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: 10
      });

      const adPerformance = await prisma.advertisement.findMany({
        select: { title: true, clicks: true, impressions: true }
      });

      const recentEvents = await prisma.telemetryEvent.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } }
      });

      const sessionStats = await prisma.userSession.aggregate({
        _avg: { duration: true },
        _count: { id: true }
      });

      res.status(200).json({
        success: true,
        data: {
          topSearches,
          adPerformance: adPerformance.map(ad => ({
            ...ad,
            ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0
          })),
          recentEvents,
          avgSessionTime: sessionStats._avg.duration || 0,
          totalSessions: sessionStats._count.id
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
