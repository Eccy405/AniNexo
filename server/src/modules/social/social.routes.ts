import { Router } from 'express';
import { SocialController } from './social.controller';
import { authenticateToken, requireVerified } from '../../middleware/auth.middleware';

const router = Router();
const socialController = new SocialController();

router.post('/follow', authenticateToken, requireVerified, socialController.toggleFollow);
router.post('/like', authenticateToken, requireVerified, socialController.toggleLike);
router.get('/followers/:userId', socialController.getFollowers);
router.get('/following/:userId', socialController.getFollowing);
router.get('/following/check', socialController.checkFollowing);

// Historias (Nexo-Stories)
router.post('/stories', socialController.createStory);
router.get('/stories', socialController.getStories);
router.post('/stories/view', socialController.markStoryViewed);


export default router;
