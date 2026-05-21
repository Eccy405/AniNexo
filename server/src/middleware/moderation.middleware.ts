import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import prisma from '../lib/prisma';

/**
 * Bloquea el acceso si el usuario está baneado
 */
export const checkBan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next();

  const activeBan = await prisma.ban.findFirst({
    where: {
      userId: req.user.id,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  if (activeBan) {
    return res.status(403).json({
      success: false,
      code: 'USER_BANNED',
      message: `Tu cuenta ha sido suspendida. Razón: ${activeBan.reason}`,
      expiresAt: activeBan.expiresAt
    });
  }

  next();
};

/**
 * Bloquea acciones de escritura (POST, PUT, DELETE) si el usuario está silenciado (Muted)
 */
export const checkMute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.method === 'GET') return next();

  const activeMute = await prisma.mute.findFirst({
    where: {
      userId: req.user.id,
      expiresAt: { gt: new Date() }
    }
  });

  if (activeMute) {
    return res.status(403).json({
      success: false,
      code: 'USER_MUTED',
      message: `Tu cuenta tiene el chat restringido temporalmente. Razón: ${activeMute.reason}`,
      expiresAt: activeMute.expiresAt
    });
  }

  next();
};
