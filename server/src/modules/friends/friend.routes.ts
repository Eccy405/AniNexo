import { Router } from 'express';
import { FriendController } from './friend.controller';

const router = Router();
const friendController = new FriendController();

router.post('/request', friendController.sendFriendRequest);
router.post('/accept', friendController.acceptFriendRequest);
router.get('/list/:userId', friendController.getFriends);
router.get('/requests/:userId', friendController.getPendingRequests);

export default router;