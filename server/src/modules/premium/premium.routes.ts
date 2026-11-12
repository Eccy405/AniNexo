import { Router } from 'express';
import { PremiumController } from './premium.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const premiumController = new PremiumController();

router.get('/status', authenticateToken, premiumController.getStatus);
router.post('/request', authenticateToken, premiumController.requestPremium);
router.post('/checkout', authenticateToken, premiumController.createCheckout);
// El webhook de stripe idealmente debería recibir el payload en raw para verificar firmas
// express.raw({type: 'application/json'})
router.post('/webhook', premiumController.webhook);

export default router;
