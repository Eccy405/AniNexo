import { Router } from 'express';
import { PremiumController } from './premium.controller';

const router = Router();
const premiumController = new PremiumController();

router.post('/checkout', premiumController.createCheckout);
// El webhook de stripe idealmente debería recibir el payload en raw para verificar firmas
// express.raw({type: 'application/json'})
router.post('/webhook', premiumController.webhook);

export default router;
