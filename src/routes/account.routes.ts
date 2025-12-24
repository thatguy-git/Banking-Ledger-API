import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';

const router = Router();

router.get('/:id', AccountController.getAccount);
router.get('/:id/balance', AccountController.getAccountBalance);

export default router;
