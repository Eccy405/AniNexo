import { Request, Response, NextFunction } from 'express';
import { AnimeService } from './anime.service';

export class AnimeController {
  private animeService: AnimeService;

  constructor() {
    this.animeService = new AnimeService();
  }

  getAnime = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ success: false, message: 'Invalid anime ID' });
      }

      const anime = await this.animeService.getAnimeById(Number(id));
      
      res.status(200).json({
        success: true,
        data: anime
      });
    } catch (error) {
      next(error);
    }
  };
}
