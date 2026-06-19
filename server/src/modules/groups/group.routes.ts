import { Router } from 'express';
import { GroupController } from './group.controller';

const router = Router();
const groupController = new GroupController();

router.post('/create', groupController.createGroup);
router.get('/anime/:animeId', groupController.getAnimeGroups);
router.post('/join', groupController.joinGroup);
router.post('/collection/add', groupController.addToCollection);
router.get('/collection/:userId', groupController.getUserCollection);

export default router;