"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const transfer_service_js_1 = require("../services/transfer.service.js");
const client_js_1 = require("../database/client.js");
class TransferController {
    static async transfer(req, res) {
        const idempotencyKey = req.headers['idempotency-key'];
        const authReq = req;
        const senderId = authReq.user.id;
        try {
            const { toAccountNumber, amount, description, reference } = req.body;
            if (!idempotencyKey) {
                return res.status(400).json({
                    error: 'Missing required header: Idempotency-Key',
                });
            }
            if (!senderId || !toAccountNumber || !amount) {
                return res.status(400).json({
                    error: 'Missing required fields: senderId, toAccountNumber, or amount',
                });
            }
            const result = await transfer_service_js_1.TransferService.transferFunds({
                senderId,
                toAccountNumber,
                amount: BigInt(amount),
                description,
                reference,
                idempotencyKey,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error('Transfer Error:', error.message);
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }
    static async deposit(req, res) {
        try {
            const { amount } = req.body;
            const authReq = req;
            const userId = authReq.user.id;
            const userAccount = await client_js_1.prisma.account.findUnique({
                where: { id: userId },
            });
            if (!userAccount)
                return res.status(404).json({ error: 'Account not found' });
            const result = await transfer_service_js_1.TransferService.depositFunds({
                toAccountNumber: userAccount.accountNumber,
                amount: BigInt(amount),
                reference: `DEP-${Date.now()}`,
            });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            console.error('Deposit Error:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.TransferController = TransferController;
