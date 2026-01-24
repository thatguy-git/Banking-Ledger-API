import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authenticateToken } from '../middlewares/jwt.middleware.js';
import { authenticateApiKey } from '../middlewares/api-key.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
    CreateInvoiceSchema,
    PayInvoiceSchema,
} from '../schemas/invoice.schema.js';

const router = Router();

router.post(
    '/',
    authenticateApiKey,
    validateRequest(CreateInvoiceSchema),
    InvoiceController.createInvoice,
);
router.post(
    '/:id/pay',
    authenticateToken,
    validateRequest(PayInvoiceSchema),
    InvoiceController.payInvoice,
);

export default router;
