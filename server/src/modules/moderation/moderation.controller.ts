import { Request, Response, NextFunction } from 'express';
import { ModerationService } from './moderation.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ModerationController {
  private moderationService: ModerationService;

  constructor() {
    this.moderationService = new ModerationService();
  }

  submitReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reporterId = req.user?.id;
      const reportedUserId = String(req.body.reportedUserId);
      const reason = String(req.body.reason);
      const { postId, commentId, messageId } = req.body;

      if (!reporterId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const report = await this.moderationService.submitReport({
        reporterId: reporterId!,
        reportedUserId,
        reason,
        postId,
        commentId,
        messageId
      });
      res.status(201).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  issueWarning = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const moderatorId = req.user?.id;
      const userId = String(req.body.userId);
      const reason = String(req.body.reason);

      if (!moderatorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      
      const warning = await this.moderationService.issueWarning(moderatorId!, userId, reason);
      res.status(201).json({ success: true, data: warning });
    } catch (error) {
      next(error);
    }
  };

  applyMute = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const moderatorId = req.user?.id;
      const userId = String(req.body.userId);
      const reason = String(req.body.reason);
      const hours = Number(req.body.hours) || 24;

      if (!moderatorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const mute = await this.moderationService.applyMute(moderatorId!, userId, reason, hours);
      res.status(201).json({ success: true, data: mute });
    } catch (error) {
      next(error);
    }
  };

  applyBan = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const moderatorId = req.user?.id;
      const userId = String(req.body.userId);
      const reason = String(req.body.reason);
      const days = req.body.days ? Number(req.body.days) : undefined;

      if (!moderatorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const ban = await this.moderationService.applyBan(moderatorId!, userId, reason, days);
      res.status(201).json({ success: true, data: ban });
    } catch (error) {
      next(error);
    }
  };

  resolveReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const moderatorId = req.user?.id;
      const { reportId, status, internalNote } = req.body;

      if (!moderatorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const report = await this.moderationService.resolveReport(moderatorId!, String(reportId), status, String(internalNote));
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  };

  getUserInvestigation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.params.userId);
      const history = await this.moderationService.getUserModerationHistory(userId);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };
}
