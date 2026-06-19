import { Request, Response, NextFunction } from 'express';
import { MessagingService } from './messaging.service';

export class MessagingController {
  private messagingService: MessagingService;

  constructor() {
    this.messagingService = new MessagingService();
  }

  createOrGetConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userA = req.body.userA as string;
      const userB = req.body.userB as string;
      if (!userA || !userB) {
        return res.status(400).json({ success: false, message: 'Se requieren userA y userB' });
      }

      const conv = await this.messagingService.createOrGetConversation(userA, userB);
      res.status(200).json({ success: true, data: conv });
    } catch (error) {
      next(error);
    }
  };

  getUserConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      if (!userId) return res.status(400).json({ success: false, message: 'userId es requerido' });

      const convs = await this.messagingService.getUserConversations(userId);
      res.status(200).json({ success: true, data: convs });
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.body.conversationId as string;
      const senderId = req.body.senderId as string;
      const content = req.body.content as string;

      if (!conversationId || !senderId || !content) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      }

      const msg = await this.messagingService.sendMessage(conversationId, senderId, content);
      res.status(201).json({ success: true, data: msg });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId es requerido' });

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const msgs = await this.messagingService.getConversationMessages(conversationId, limit);
      res.status(200).json({ success: true, data: msgs });
    } catch (error) {
      next(error);
    }
  };

  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = req.body.adminId as string;
      const name = req.body.name as string;
      const participantIds = req.body.participantIds as string[];
      const avatar = req.body.avatar as string | undefined;
      const theme = req.body.theme as string | undefined;

      if (!adminId || !name || !participantIds || participantIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      }

      const conversation = await this.messagingService.createGroupChat(adminId, name, participantIds, avatar, theme);
      res.status(201).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  };

  addParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.body.conversationId as string;
      const participantIds = req.body.participantIds as string[];
      const adminId = req.body.adminId as string;

      if (!conversationId || !participantIds || !adminId) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      }

      const conversation = await this.messagingService.addParticipants(conversationId, participantIds, adminId);
      res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  getConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const conversationId = req.params.conversationId as string;
      if (!conversationId) return res.status(400).json({ success: false, message: 'conversationId es requerido' });

      const conversation = await this.messagingService.getConversation(conversationId);
      res.status(200).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  };
}
