import { Request, Response, NextFunction } from 'express';
import { NexoService } from './nexo.service';

export class NexoController {
  private nexoService: NexoService;

  constructor() {
    this.nexoService = new NexoService();
  }

  chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const message = req.body.message as string;

      if (!userId || !message) {
        return res.status(400).json({ success: false, message: 'Usuario y mensaje son obligatorios' });
      }

      const reply = await this.nexoService.chatWithNexo(userId, message);

      res.status(200).json({
        success: true,
        data: {
          reply
        }
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
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
