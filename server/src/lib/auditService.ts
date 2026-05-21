import prisma from './prisma';
import { logger } from './logger';

export class AuditService {
  static async log(data: {
    userId?: string;
    action: string;
    ip?: string;
    userAgent?: string;
    status: 'SUCCESS' | 'FAILURE';
    metadata?: any;
  }) {
    try {
      await prisma.securityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          ip: data.ip,
          userAgent: data.userAgent,
          status: data.status,
          // metadata: JSON.stringify(data.metadata) // Si agregamos campo JSON al modelo
        }
      });

      if (data.status === 'FAILURE') {
        logger.security(`[Audit FAILURE]: ${data.action} by ${data.userId || 'Anonymous'} from ${data.ip}`);
      } else {
        logger.info(`[Audit SUCCESS]: ${data.action} by ${data.userId || 'Anonymous'}`);
      }
    } catch (error) {
      logger.error(`[Audit Error]: Failed to save security log - ${error}`);
    }
  }
}
