import { Router, Request, Response, NextFunction } from 'express';
import { NexoController } from './nexo.controller';
import { NexoAnalyticsController } from './nexo.analytics.controller';
import { authenticateToken, isAdmin } from '../../middleware/auth.middleware';
import prisma from '../../lib/prisma';

const router = Router();
const nexoController = new NexoController();
const nexoAnalyticsController = new NexoAnalyticsController();

// Simple in-memory rate limiter for dev purposes
const nexoRateLimitMap = new Map<string, { count: number, date: string }>();

const nexoRateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdRaw = req.body.userId;
    if (!userIdRaw || typeof userIdRaw !== 'string') return next();
    const userId: string = userIdRaw;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next();

    // Premium users bypass the limit
    if (user.isPremium && (!user.premiumUntil || user.premiumUntil > new Date())) {
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
        success: true, 
        action: 'UPGRADE_REQUIRED',
        message: 'Has alcanzado el límite de 5 mensajes diarios gratuitos con Nexo. ¡Hazte Premium para uso ilimitado!' 
      });
    }

    userLimit.count += 1;
    nexoRateLimitMap.set(userId, userLimit);
    next();
  } catch (err) {
    next(err);
  }
};

router.post('/chat', nexoRateLimiter, nexoController.chat);
router.post('/chat-persistent', authenticateToken, nexoController.chatPersistent);
router.get('/analytics', authenticateToken, isAdmin, nexoAnalyticsController.getUsageOverview);

export default router;
