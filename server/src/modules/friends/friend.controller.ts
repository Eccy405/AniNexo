import { Request, Response, NextFunction } from 'express';
import { FriendService } from './friend.service';

export class FriendController {
  private friendService: FriendService;

  constructor() {
    this.friendService = new FriendService();
  }

  sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const friendId = req.body.friendId as string;

      if (!userId || !friendId) {
        return res.status(400).json({ success: false, message: 'Se requieren userId y friendId' });
      }

      const result = await this.friendService.sendFriendRequest(userId, friendId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  acceptFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const friendId = req.body.friendId as string;

      if (!userId || !friendId) {
        return res.status(400).json({ success: false, message: 'Se requieren userId y friendId' });
      }

      const result = await this.friendService.acceptFriendRequest(userId, friendId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'Error desconocido' });
    }
  };

  getFriends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }

      const friends = await this.friendService.getFriends(userId);
      res.status(200).json({ success: true, data: friends });
    } catch (error) {
      next(error);
    }
  };

  getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }

      const requests = await this.friendService.getPendingRequests(userId);
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  };
}