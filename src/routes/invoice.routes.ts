import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticateToken, InvoiceController.createInvoice);
router.post('/:id/pay', authenticateToken, InvoiceController.payInvoice);

export default router;