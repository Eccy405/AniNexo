import { Router } from 'express';
import { FeedController } from './feed.controller';

const router = Router();
const feedController = new FeedController();

router.post('/post', feedController.createPost);
router.get('/', feedController.getGlobalFeed);
router.get('/user/:userId', feedController.getUserFeed);
router.get('/anime/:animeId', feedController.getAnimeFeed);
router.post('/comment', feedController.createComment);


export default router;
