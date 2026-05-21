import { Router } from 'express';
import { SearchController } from './search.controller';

const router = Router();
const searchController = new SearchController();

router.get('/global', searchController.globalSearch);
router.get('/characters', searchController.searchCharacters);

export default router;
