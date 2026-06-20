import { Router } from 'express';
import { FeedController } from './feed.controller';

const router = Router();
const feedController = new FeedController();

router.post('/post', feedController.createPost);
router.put('/post/:postId', feedController.updatePost);
router.delete('/post/:postId', feedController.deletePost);
router.get('/', feedController.getGlobalFeed);
router.get('/user/:userId', feedController.getUserFeed);
router.get('/anime/:animeId', feedController.getAnimeFeed);
router.post('/comment', feedController.createComment);

router.post('/post/:postId/save', feedController.savePost);
router.delete('/post/:postId/save', feedController.unsavePost);
router.get('/saved/:userId', feedController.getSavedPosts);
router.post('/post/:postId/share', feedController.sharePost);
router.post('/memory/interaction', feedController.addInteractionMemory);
router.get('/memories/:userId', feedController.getMemories);
router.post('/memory', feedController.addMemory);

export default router;
