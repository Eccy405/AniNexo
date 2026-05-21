import { Request, Response, NextFunction } from 'express';
import { PremiumService } from './premium.service';
import Stripe from 'stripe';

export class PremiumController {
  private premiumService: PremiumService;

  constructor() {
    this.premiumService = new PremiumService();
  }

  createCheckout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Falta userId' });
      }

      const session = await this.premiumService.createCheckoutSession(userId);
      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers['stripe-signature'];
      
      // En producción, validar la firma con req.rawBody y stripe.webhooks.constructEvent
      // Por simplicidad en esta demo, lo pasamos directamente
      const event = req.body as any;

      await this.premiumService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      console.error(error);
      res.status(400).send(`Webhook Error`);
    }
  };
}
