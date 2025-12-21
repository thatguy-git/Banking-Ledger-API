import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller.js';

const router = Router();

router.post('/', TransferController.transfer);
router.post('/deposit', TransferController.deposit);

export default router;
