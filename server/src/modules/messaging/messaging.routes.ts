import { Router } from 'express';
import { MessagingController } from './messaging.controller';
import { authenticateToken, requireVerified } from '../../middleware/auth.middleware';

const router = Router();
const messagingController = new MessagingController();

router.post('/conversation', authenticateToken, requireVerified, messagingController.createOrGetConversation);
router.post('/send', authenticateToken, requireVerified, messagingController.sendMessage);
router.get('/:conversationId', messagingController.getMessages);
router.get('/conversation/:conversationId', messagingController.getConversation);
router.get('/user/:userId', messagingController.getUserConversations);
router.post('/group/create', authenticateToken, requireVerified, messagingController.createGroupChat);
router.post('/group/participants', authenticateToken, requireVerified, messagingController.addParticipants);

export default router;
