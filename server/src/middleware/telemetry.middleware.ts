import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { telemetryService } from '../modules/admin/telemetry.service';

/**
 * Middleware para capturar búsquedas de anime automáticamente
 */
export const searchTelemetryMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  // Interceptar la respuesta para contar los resultados
  res.json = function (data) {
    if (req.path.includes('/search') && req.query.q) {
      const query = req.query.q as string;
      const resultsCount = data?.data?.length || 0;
      const userId = req.user?.id || null;

      telemetryService.logSearch(userId, query, resultsCount);
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware para capturar errores de API (Telemetría de Errores)
 */
export const errorTelemetryMiddleware = (err: any, req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id || null;
  
  telemetryService.logEvent(userId, 'API_ERROR', {
    path: req.path,
    method: req.method,
    error: err.message || 'Unknown Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  next(err);
};
