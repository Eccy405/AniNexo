import { Request, Response, NextFunction } from 'express';
import { SocialService } from './social.service';
import { StoryService } from './story.service';

export class SocialController {
  private socialService: SocialService;
  private storyService: StoryService;

  constructor() {
    this.socialService = new SocialService();
    this.storyService = new StoryService();
  }

  toggleFollow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const followerId = req.body.followerId as string;
      const followingId = req.body.followingId as string;

      if (!followerId || !followingId) {
        return res.status(400).json({ success: false, message: 'followerId y followingId son requeridos' });
      }

      const result = await this.socialService.toggleFollow(followerId, followingId);

      res.status(200).json({
        success: true,
        data: result,
        message: result.followed ? 'Usuario seguido' : 'Usuario dejado de seguir'
      });
    } catch (error) {
      next(error);
    }
  };

  toggleLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const postId = req.body.postId as string | undefined;
      const commentId = req.body.commentId as string | undefined;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }

      const result = await this.socialService.toggleLike(userId, postId, commentId);

      res.status(200).json({
        success: true,
        data: result,
        message: result.liked ? 'Me gusta agregado' : 'Me gusta removido'
      });
    } catch (error) {
      next(error);
    }
  };

  toggleBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blockerId = req.body.blockerId as string;
      const blockedId = req.body.blockedId as string;
      const result = await this.socialService.toggleBlock(blockerId, blockedId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  muteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.body.userId as string;
      const targetId = req.body.targetId as string;
      const reason = req.body.reason as string;
      const hours = req.body.hours;
      
      const result = await this.socialService.muteUser(userId, targetId, reason, Number(hours) || 24);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.params.username as string;
      if (!username) return res.status(400).json({ error: 'Username is required' });

      const viewerId = req.query.viewerId as string | undefined;
      const profile = await this.socialService.getUserProfile(username, viewerId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  };

  createStory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, mediaUrl, caption } = req.body;
      if (!userId || !mediaUrl) {
        return res.status(400).json({ success: false, message: 'userId y mediaUrl son requeridos' });
      }
      const story = await this.storyService.createStory(userId, { mediaUrl, caption });
      res.status(201).json({ success: true, data: story });
    } catch (error) {
      next(error);
    }
  };

  getStories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'userId es requerido' });
      }
      const stories = await this.storyService.getFeedStories(userId);
      res.status(200).json({ success: true, data: stories });
    } catch (error) {
      next(error);
    }
  };

  markStoryViewed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, storyId } = req.body;
      await this.storyService.viewStory(userId, storyId);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
