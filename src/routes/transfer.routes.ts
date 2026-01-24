import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller.js';
import { authenticateToken } from '../middlewares/jwt.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
    TransferSchema,
    DepositSchema,
    ChargePaymentSchema,
} from '../schemas/transfer.schema.js';

const router = Router();

router.post(
    '/',
    authenticateToken,
    validateRequest(TransferSchema),
    TransferController.transfer,
);
router.post(
    '/deposit',
    authenticateToken,
    validateRequest(DepositSchema),
    TransferController.deposit,
);
router.post(
    '/charge',
    authenticateToken,
    validateRequest(ChargePaymentSchema),
    TransferController.chargePayment,
);

export default router;
