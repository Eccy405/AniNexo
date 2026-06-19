import { Request, Response, NextFunction } from 'express';
import { GroupService, CollectionService } from './group.service';

const groupService = new GroupService();
const collectionService = new CollectionService();

export class GroupController {
  createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const { animeId, name, description, coverImage } = req.body;

      if (!userId || !animeId || !name) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
      }

      const group = await groupService.createGroup(userId, animeId, name, description, coverImage);
      res.status(201).json({ success: true, data: group });
    } catch (error) {
      next(error);
    }
  };

  getAnimeGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const animeId = Number(req.params.animeId);
      const groups = await groupService.getAnimeGroups(animeId);
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  };

  joinGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const groupId = req.body.groupId as string;

      if (!userId || !groupId) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
      }

      const result = await groupService.joinGroup(userId, groupId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  addToCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const { animeId, status } = req.body;

      const result = await collectionService.addToCollection(userId, animeId, status);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getUserCollection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId requerido' });
      }
      const collection = await collectionService.getUserCollection(userId);
      res.json({ success: true, data: collection });
    } catch (error) {
      next(error);
    }
  };
}