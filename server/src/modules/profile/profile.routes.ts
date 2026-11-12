import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authenticateToken, optionalAuthenticate } from '../../middleware/auth.middleware';

const router = Router();
const profileController = new ProfileController();

router.get('/:username', optionalAuthenticate, profileController.getProfile);
router.put('/update', authenticateToken, profileController.updateProfile);
router.post('/onboarding', authenticateToken, profileController.saveOnboarding);

export default router;
