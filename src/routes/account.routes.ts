import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';
import { authenticateToken } from '../middlewares/jwt.middleware.js';

const router = Router();

router.get('/', authenticateToken, AccountController.getAccount);
router.get('/balance', authenticateToken, AccountController.getAccountBalance);
router.get('/history', authenticateToken, AccountController.getLedgerHistory);
router.post('/api-keys', authenticateToken, AccountController.generateApiKey);
router.get('/api-keys', authenticateToken, AccountController.getApiKeys);

export default router;
