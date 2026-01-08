import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service.js';
import { AuthenticatedRequest } from '../middlewares/jwt.middleware.js';
import { ApiKeyAuthenticatedRequest } from '../utils/customTypes.js';

export class InvoiceController {
    static async createInvoice(req: Request, res: Response) {
        const apiReq = req as ApiKeyAuthenticatedRequest;
        const creditorId = apiReq.apiKeyAccount?.accountId;
        try {
            const { amount, description } = req.body;

            if (!creditorId) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Unauthorized: Merchant account not found',
                });
            }

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
                invoiceId: result.id,
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

        if (!authReq.user || !authReq.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payerId = authReq.user.id;

        const headerVal = req.headers['idempotency-key'];
        const idempotencyKey = Array.isArray(headerVal)
            ? headerVal[0]
            : headerVal;

        try {
            const result = await InvoiceService.payInvoice({
                invoiceId: id,
                payerId,
                pin,
                idempotencyKey,
            });

            InvoiceService.sendWebhook(result).catch((err) => {
                console.error('⚠️ Webhook failed to send:', err.message);
            });

            const safeResponse = {
                ...result,
                amount: result.amount.toString(),
            };

            res.status(200).json({
                status: 'success',
                message: 'Payment successful',
                data: safeResponse,
            });
        } catch (error: any) {
            console.error('Payment Error:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message || 'Transaction failed',
            });
        }
    }
}
