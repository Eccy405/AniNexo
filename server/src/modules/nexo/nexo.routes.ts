import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { NexoController } from './nexo.controller';
import { NexoAnalyticsController } from './nexo.analytics.controller';
import { authenticateToken, isAdmin } from '../../middleware/auth.middleware';
import prisma from '../../lib/prisma';

const router = Router();
const nexoController = new NexoController();
const nexoAnalyticsController = new NexoAnalyticsController();

// Simple in-memory rate limiter for free tier
const nexoRateLimitMap = new Map<string, { count: number; date: string }>();

const extractUserId = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'super_secret_jwt_key_aninexo_change_me'
        ) as { id?: string };
        if (decoded?.id) return decoded.id;
      }
    } catch {
      // ignore invalid token
    }
  }
  return typeof req.body?.userId === 'string' && req.body.userId.trim()
    ? req.body.userId.trim()
    : null;
};

const nexoRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = extractUserId(req);
    if (!userId) return next();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next();

    // Premium users and Admins bypass the daily limit
    if (
      (user.isPremium && (!user.premiumUntil || user.premiumUntil > new Date())) ||
      user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN'
    ) {
      return next();
    }

    const today = new Date().toISOString().split('T')[0] || '';
    const userLimit = nexoRateLimitMap.get(userId);

    if (!userLimit || userLimit.date !== today) {
      nexoRateLimitMap.set(userId, { count: 1, date: today });
      return next();
    }

    if (userLimit.count >= 5) {
      return res.status(429).json({
        success: false,
        action: 'UPGRADE_REQUIRED',
        message: 'Has alcanzado el límite de 5 mensajes diarios gratuitos con Nexo. ¡Hazte Premium para uso ilimitado!',
      });
    }

    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const current = nexoRateLimitMap.get(userId);
        if (!current || current.date !== today) {
          nexoRateLimitMap.set(userId, { count: 1, date: today });
        } else {
          nexoRateLimitMap.set(userId, { count: current.count + 1, date: today });
        }
      }
    });
    next();
  } catch (err) {
    next(err);
  }
};

router.post('/chat', nexoRateLimiter, nexoController.chat);
router.post('/chat-persistent', authenticateToken, nexoController.chatPersistent);
router.get('/analytics', authenticateToken, isAdmin, nexoAnalyticsController.getUsageOverview);

export default router;
