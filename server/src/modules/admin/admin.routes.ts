import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateToken, isAdmin } from '../../middleware/auth.middleware';

const router = Router();
const adminController = new AdminController();

// Todas las rutas de administración requieren ser ADMIN
router.use(authenticateToken, isAdmin);

router.get('/analytics', adminController.getAnalytics);
router.get('/stats', adminController.getEnterpriseStats);
router.get('/reports', adminController.getReports);
router.post('/maintenance', adminController.setMaintenance);
router.post('/feature-flag', adminController.updateFeatureFlag);
router.get('/finances', adminController.getFinances);
router.get('/users', adminController.getAllUsers);
router.get('/anime', adminController.getAnimePersistence);
router.get('/nexo-logs', adminController.getNexoInteractions);
router.get('/telemetry', adminController.getDetailedTelemetry);
router.get('/logs', adminController.getAuditLogs);
router.get('/email-logs', adminController.getEmailLogs);

export default router;
