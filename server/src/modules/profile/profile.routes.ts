import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const profileController = new ProfileController();

router.get('/:username', profileController.getProfile);
router.put('/update', authenticateToken, profileController.updateProfile);
router.post('/onboarding', authenticateToken, profileController.saveOnboarding);

export default router;
