import { Router } from 'express';
import { ListController } from './list.controller';

const router = Router();
const listController = new ListController();

router.post('/', listController.addOrUpdateEntry);
router.get('/:username', listController.getUserList);

export default router;
