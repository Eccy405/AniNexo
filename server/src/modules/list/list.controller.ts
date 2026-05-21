import { Request, Response, NextFunction } from 'express';
import { ListService } from './list.service';

export class ListController {
  private listService: ListService;

  constructor() {
    this.listService = new ListService();
  }

  addOrUpdateEntry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const animeId = req.body.animeId;
      const status = req.body.status;
      const score = req.body.score;
      const progress = req.body.progress;

      if (!userId || !animeId || !status) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios (userId, animeId, status)' });
      }

      const entry = await this.listService.addOrUpdateEntry(userId, Number(animeId), status, score, progress);

      res.status(200).json({
        success: true,
        data: entry
      });
    } catch (error) {
      next(error);
    }
  };

  getUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username as string;

      if (!username) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario es requerido' });
      }

      const list = await this.listService.getUserList(username);

      res.status(200).json({
        success: true,
        data: list
      });
    } catch (error) {
      next(error);
    }
  };
}
