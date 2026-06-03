import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

export const spamProtection = (action: string, limit = 5, windowSeconds = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Honeypot check (Si viene el campo 'website', es un bot)
    if (req.body && req.body.website) {
      logger.log('security', `[Bot Detected]: Honeypot triggered from IP ${req.ip}`);
      return res.status(403).json({ success: false, message: 'Bot detected' });
    }

    // 2. Content similarity check (Previene spam idéntico)
    if (req.body && req.body.content) {
      const userId = (req as any).user?.id || req.ip;
      const contentHash = Buffer.from(req.body.content).toString('base64').substring(0, 32);
      const key = `spam:${userId}:${action}:${contentHash}`;
      
      const exists = await redis.get(key);
      if (exists) {
        return res.status(429).json({ 
          success: false, 
          message: 'Has enviado este contenido recientemente. Por favor, espera un momento.' 
        });
      }
      
      await redis.set(key, '1', 'EX', windowSeconds);
    }

    next();
  };
};
