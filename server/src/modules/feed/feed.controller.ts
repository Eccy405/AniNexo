import { Request, Response, NextFunction } from 'express';
import { FeedService } from './feed.service';
import { SocialService } from '../social/social.service';

export class FeedController {
  private feedService: FeedService;
  private socialService: SocialService;

  constructor() {
    this.feedService = new FeedService();
    this.socialService = new SocialService();
  }

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const content = req.body.content as string;
      const mediaUrl = req.body.mediaUrl as string | undefined;
      const animeId = req.body.animeId;
      const isPrivate = req.body.isPrivate as boolean | undefined;

      if (!userId || (!content && !mediaUrl)) {
        return res.status(400).json({ success: false, message: 'Usuario y contenido (o medio) son obligatorios' });
      }

      const post = await this.feedService.createPost(userId, content, animeId ? Number(animeId) : undefined, mediaUrl, isPrivate);

      res.status(201).json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.params.postId as string;
      const content = req.body.content as string;
      const isPrivate = req.body.isPrivate as boolean | undefined;

      if (!userId || !postId) {
        return res.status(400).json({ success: false, message: 'Usuario y postId son obligatorios' });
      }

      const post = await this.feedService.updatePost(userId, postId, content, isPrivate);

      res.status(200).json({
        success: true,
        data: post
      });
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.params.postId as string;

      if (!userId || !postId) {
        return res.status(400).json({ success: false, message: 'Usuario y postId son obligatorios' });
      }

      await this.feedService.deletePost(userId, postId);

      res.status(200).json({
        success: true,
        message: 'Publicación eliminada'
      });
    } catch (error) {
      next(error);
    }
  };

  getGlobalFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const feed = await this.feedService.getGlobalFeed(limit);
      res.status(200).json({ success: true, data: feed });
    } catch (error) { next(error); }
  };

  getUserFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      if (!userId) return res.status(400).json({ success: false, message: 'UserId es obligatorio' });
      const feed = await this.feedService.getUserFeed(userId);
      res.status(200).json({ success: true, data: feed });
    } catch (error) { next(error); }
  };

  getAnimeFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const animeId = req.params.animeId;
      if (!animeId) return res.status(400).json({ success: false, message: 'AnimeId es obligatorio' });
      const feed = await this.feedService.getAnimeFeed(Number(animeId));
      res.status(200).json({ success: true, data: feed });
    } catch (error) { next(error); }
  };

  createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.body.postId as string;
      const content = req.body.content as string;

      if (!userId || !postId || !content) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para el comentario' });
      }

      const comment = await this.feedService.createComment(userId, postId, content);

      res.status(201).json({
        success: true,
        data: comment
      });
    } catch (error) {
      next(error);
    }
  };

  getPersonalizedFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      if (!userId) return res.status(400).json({ error: 'UserID is required' });

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const feed = await this.socialService.getFeed(userId, limit, offset);

      res.status(200).json({
        success: true,
        data: feed
      });
    } catch (error) {
      next(error);
    }
  };

  savePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.params.postId as string;

      if (!userId || !postId) {
        return res.status(400).json({ success: false, message: 'Usuario y postId son obligatorios' });
      }

      const saved = await this.feedService.savePost(userId, postId);

      res.status(200).json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  };

  unsavePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.params.postId as string;

      if (!userId || !postId) {
        return res.status(400).json({ success: false, message: 'Usuario y postId son obligatorios' });
      }

      await this.feedService.unsavePost(userId, postId);

      res.status(200).json({ success: true, message: 'Publicación quitada de guardado' });
    } catch (error) {
      next(error);
    }
  };

  getSavedPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }

      const savedPosts = await this.feedService.getSavedPosts(userId);

      res.status(200).json({ success: true, data: savedPosts });
    } catch (error) {
      next(error);
    }
  };

  sharePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.params.postId as string;
      const content = req.body.content as string | undefined;

      if (!userId || !postId) {
        return res.status(400).json({ success: false, message: 'Usuario y postId son obligatorios' });
      }

      const sharedPost = await this.feedService.sharePost(userId, postId, content);

      res.status(200).json({ success: true, data: sharedPost });
    } catch (error) {
      next(error);
    }
  };

  getMemories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const memories = await this.feedService.getMemories(userId, limit);

      res.status(200).json({ success: true, data: memories });
    } catch (error) {
      next(error);
    }
  };

  addInteractionMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.body.postId as string | undefined;
      const commentId = req.body.commentId as string | undefined;

      if (!userId || (!postId && !commentId)) {
        return res.status(400).json({ success: false, message: 'userId y postId o commentId son requeridos' });
      }

      const memory = await this.feedService.addMemoryFromInteraction(userId, postId, commentId);

      res.status(200).json({ success: true, data: memory });
    } catch (error) {
      next(error);
    }
  };

  addMemory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.body.postId as string;
      const type = req.body.type as 'INTERACTION' | 'SHARE';

      if (!userId || !postId) {
        return res.status(400).json({ success: false, message: 'userId y postId son requeridos' });
      }

      await this.feedService.addMemory(userId, postId, type);

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
