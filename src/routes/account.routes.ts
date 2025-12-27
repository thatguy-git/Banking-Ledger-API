import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authenticateToken, AccountController.getAccount);
router.get('/balance', authenticateToken, AccountController.getAccountBalance);
router.get('/history', authenticateToken, AccountController.getLedgerHistory);

export default router;
