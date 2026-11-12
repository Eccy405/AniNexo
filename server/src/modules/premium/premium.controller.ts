import { Response, NextFunction } from 'express';
import { PremiumService } from './premium.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class PremiumController {
  private premiumService: PremiumService;

  constructor() {
    this.premiumService = new PremiumService();
  }

  getStatus = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }
      const status = await this.premiumService.getStatus(userId);
      res.status(200).json({ success: true, data: status });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  requestPremium = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Debes iniciar sesión para solicitar Premium.' });
      }

      const { note } = req.body || {};
      const result = await this.premiumService.requestPremiumActivation(userId, note);
      res.status(200).json({ success: true, message: result.message, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  createCheckout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const session = await this.premiumService.createCheckoutSession(userId);
      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      res.status(403).json({ success: false, message: error.message });
    }
  };

  webhook = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const event = req.body as any;
      await this.premiumService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error(error);
      res.status(403).send(`Webhook Error`);
    }
  };
}
