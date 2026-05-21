import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1] as string;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured on the server' });
    }
    const decoded: any = jwt.verify(token, secret);
    
    // Buscar usuario en BD
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1] as string;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }
    const decoded: any = jwt.verify(token, secret);
    
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // Si el token es inválido, simplemente ignoramos y seguimos como guest
    next();
  }
};

export const requirePremium = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const now = new Date();
    if (!user.isPremium || (user.premiumUntil && user.premiumUntil < now)) {
      return res.status(403).json({ 
        success: false, 
        action: 'UPGRADE_REQUIRED',
        message: 'This feature requires an active Premium subscription.' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
