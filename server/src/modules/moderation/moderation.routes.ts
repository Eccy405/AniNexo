import { Router } from 'express';
import { ModerationController } from './moderation.controller';
import { authenticateToken, isAdmin } from '../../middleware/auth.middleware';

const router = Router();
const moderationController = new ModerationController();

// Ruta protegida por token (cualquier usuario registrado puede denunciar)
router.post('/report', authenticateToken, moderationController.submitReport);

// Rutas administrativas (Moderadores y Admins)
router.post('/warning', authenticateToken, isAdmin, moderationController.issueWarning);
router.post('/mute', authenticateToken, isAdmin, moderationController.applyMute);
router.post('/ban', authenticateToken, isAdmin, moderationController.applyBan);
router.post('/resolve', authenticateToken, isAdmin, moderationController.resolveReport);
router.get('/investigate/:userId', authenticateToken, isAdmin, moderationController.getUserInvestigation);

export default router;
