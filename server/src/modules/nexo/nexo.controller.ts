import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { NexoService, NexoHistoryTurn } from './nexo.service';

export class NexoController {
  private nexoService: NexoService;

  constructor() {
    this.nexoService = new NexoService();
  }

  private resolveUserId(req: Request): string | undefined {
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
        // Fallback al userId del cuerpo si el token expiró o no es válido
      }
    }

    if (typeof req.body?.userId === 'string' && req.body.userId.trim()) {
      return req.body.userId.trim();
    }
    return undefined;
  }

  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = this.resolveUserId(req);
      const message = typeof req.body?.message === 'string' ? req.body.message : '';
      const history = Array.isArray(req.body?.history)
        ? (req.body.history as NexoHistoryTurn[])
        : [];

      if (!userId || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Usuario autenticado y mensaje son obligatorios',
        });
      }

      const reply = await this.nexoService.chatWithNexo(userId, message, history);

      res.status(200).json({
        success: true,
        data: {
          reply,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  chatPersistent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.body.conversationId as string;
      const message = req.body.message as string;
      const userId = (req as any).user.id as string;

      if (!conversationId || !message) {
        return res.status(400).json({ success: false, message: 'Faltan parámetros' });
      }

      const result = await this.nexoService.chatInConversation(userId, conversationId, message);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
