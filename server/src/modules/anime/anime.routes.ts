import { Router } from 'express';
import { AnimeController } from './anime.controller';
import { DiscoveryController } from './discovery.controller';
import { optionalAuthenticate, authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const animeController = new AnimeController();
const discoveryController = new DiscoveryController();

// Discovery Routes
router.get('/discovery/home', optionalAuthenticate, discoveryController.getHomeData);
router.get('/discovery/genre/:genre', discoveryController.getByGenre);
router.get('/discovery/category/:category', discoveryController.getByCategory);
router.get('/discovery/search', discoveryController.advancedSearch);
router.post('/discovery/track-view', optionalAuthenticate, discoveryController.trackView);

// Standard Routes
router.get('/:id', animeController.getAnime);

export default router;
