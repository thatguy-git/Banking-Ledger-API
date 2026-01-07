import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export class InvoiceController {
    static async createInvoice(req: Request, res: Response) {
        const authReq = req as AuthenticatedRequest;
        const creditorId = authReq.user.id;
        try {
            const { amount, description } = req.body;

            if (!amount) {
                return res.status(400).json({
                    error: 'Missing required field: amount',
                });
            }

            const result = await InvoiceService.createInvoice({
                creditorId,
                amount: BigInt(amount),
                description,
            });

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Create Invoice Error:', error.message);
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async payInvoice(req: Request, res: Response) {
        const { id } = req.params;
        const { pin } = req.body;
        const authReq = req as AuthenticatedRequest;
        const payerId = authReq.user.id;

        try {
            const result = await InvoiceService.payInvoice({
                invoiceId: id,
                payerId,
                pin,
            });

            // Send webhook asynchronously
            InvoiceService.sendWebhook(result);

            res.status(200).json({
                status: 'success',
                message: 'Payment successful',
                data: { invoiceId: result.id },
            });
        } catch (error: any) {
            res.status(400).json({
                status: 'fail',
                message: error.message || 'Transaction failed',
            });
        }
    }
}
