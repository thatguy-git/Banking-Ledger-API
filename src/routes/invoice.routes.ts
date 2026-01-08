import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authenticateToken } from '../middlewares/jwt.middleware.js';
import { authenticateApiKey } from '../middlewares/api-key.middleware.js';

const router = Router();

router.post('/', authenticateApiKey, InvoiceController.createInvoice);
router.post('/:id/pay', authenticateToken, InvoiceController.payInvoice);

export default router;
