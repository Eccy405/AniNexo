import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();
const controller = new AnalyticsController();

// El endpoint de tendencias es público para el dashboard
router.get('/trending', controller.getTrendingAnimes);

export default router;
