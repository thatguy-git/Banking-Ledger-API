"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const invoice_service_js_1 = require("../services/invoice.service.js");
class InvoiceController {
    static async createInvoice(req, res) {
        const apiReq = req;
        const creditorId = apiReq.apiKeyAccount?.accountId;
        try {
            const { amount, description, webhookUrl, reference } = req.body;
            if (!creditorId) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Unauthorized: Merchant account not found',
                });
            }
            const result = await invoice_service_js_1.InvoiceService.createInvoice({
                creditorId,
                amount: BigInt(amount),
                description,
                webhookUrl,
                reference,
            });
            res.status(201).json({
                success: true,
                invoiceId: result.id,
                data: result,
            });
        }
        catch (error) {
            console.error('Create Invoice Error:', error.message);
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    static async payInvoice(req, res) {
        const { id } = req.params;
        const { pin } = req.body;
        const authReq = req;
        if (!authReq.user || !authReq.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const payerId = authReq.user.id;
        const headerVal = req.headers['idempotency-key'];
        const idempotencyKey = Array.isArray(headerVal)
            ? headerVal[0]
            : headerVal;
        try {
            const result = await invoice_service_js_1.InvoiceService.payInvoice({
                invoiceId: id,
                payerId,
                pin,
                idempotencyKey,
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
        }
        catch (error) {
            console.error('Payment Error:', error);
            res.status(400).json({
                status: 'fail',
                message: error.message || 'Transaction failed',
            });
        }
    }
}
exports.InvoiceController = InvoiceController;
