import { Router } from 'express';
import { SocialController } from './social.controller';

const router = Router();
const socialController = new SocialController();

router.post('/follow', socialController.toggleFollow);
router.post('/like', socialController.toggleLike);

// Historias (Nexo-Stories)
router.post('/stories', socialController.createStory);
router.get('/stories', socialController.getStories);
router.post('/stories/view', socialController.markStoryViewed);


export default router;
