import { Router } from 'express';
import { MessagingController } from './messaging.controller';

const router = Router();
const messagingController = new MessagingController();

router.post('/conversation', messagingController.createOrGetConversation);
router.post('/send', messagingController.sendMessage);
router.get('/:conversationId', messagingController.getMessages);
router.get('/user/:userId', messagingController.getUserConversations);

export default router;
