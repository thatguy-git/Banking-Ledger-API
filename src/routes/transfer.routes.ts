import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller.js';
import { authenticateToken } from '../middlewares/jwt.middleware.js';

const router = Router();

router.post('/', authenticateToken, TransferController.transfer);
router.post('/deposit', authenticateToken, TransferController.deposit);
router.post('/charge', authenticateToken, TransferController.chargePayment);

export default router;
