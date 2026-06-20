import { Router } from 'express';
import { FriendController } from './friend.controller';

const router = Router();
const friendController = new FriendController();

router.post('/request', friendController.sendFriendRequest);
router.post('/accept', friendController.acceptFriendRequest);
router.get('/list/:userId', friendController.getFriends);
router.get('/requests/:userId', friendController.getPendingRequests);
router.delete('/:friendId', friendController.removeFriend);
router.put('/:friendId/nickname', friendController.setFriendNickname);
router.get('/:userId/:friendId/nickname', friendController.getFriendNickname);
router.get('/list-with-nicknames/:userId', friendController.getUserFriendsWithNicknames);

export default router;