import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

// En un entorno real, esto vendría de Redis o la DB
let isMaintenanceMode = false; 

export const setMaintenanceMode = (status: boolean) => {
  isMaintenanceMode = status;
  logger.info(`Maintenance mode set to: ${status}`);
};

export const maintenanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (isMaintenanceMode) {
    // Permitir a admins bypassear el mantenimiento
    // Esto requiere que el JWT sea parseado antes o enviar un header especial
    if (req.headers['x-bypass-maintenance'] === 'admin-secret') {
      return next();
    }
    
    return res.status(503).json({
      success: false,
      message: 'AniNexo está actualmente en mantenimiento. Por favor, intenta de nuevo más tarde.',
      code: 'MAINTENANCE_MODE'
    });
  }
  next();
};
