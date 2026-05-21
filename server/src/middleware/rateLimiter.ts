import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${req.ip}:${req.originalUrl}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.floor(options.windowMs / 1000));
      }
      
      if (current > options.max) {
        logger.warn(`[Security]: Rate limit exceeded for IP ${req.ip} on ${req.originalUrl}`);
        return res.status(429).json({
          success: false,
          message: options.message,
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }
      
      next();
    } catch (error) {
      // Si falla Redis, dejamos pasar por defecto pero logueamos
      logger.error(`[Redis Error]: Rate limiter failed - ${error}`);
      next();
    }
  };
};

export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.'
});

export const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de acceso. Intenta de nuevo en una hora.'
});
