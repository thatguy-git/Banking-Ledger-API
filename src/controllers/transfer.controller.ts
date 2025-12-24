import { Request, Response } from 'express';
import { TransferService } from '../services/transfer.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export class TransferController {
    static async transfer(req: Request, res: Response) {
        try {
            const {
                fromAccountId,
                toAccountNumber,
                amount,
                description,
                reference,
            } = req.body;

            if (!fromAccountId || !toAccountNumber || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: fromAccountId, toAccountNumber, or amount',
                });
            }
            const result = await TransferService.transferFunds({
                fromAccountId,
                toAccountNumber,
                amount: BigInt(amount),
                description,
                reference,
            });
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Transfer Error:', error.message);
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    static async deposit(req: Request, res: Response) {
        try {
            const { toAccountNumber, amount } = req.body;
            const senderId = (req as AuthenticatedRequest).user.id;

            if (!toAccountNumber || !amount) {
                return res
                    .status(400)
                    .json({ error: 'toAccountNumber and amount are required' });
            }
            const result = await TransferService.depositFunds({
                toAccountNumber: toAccountNumber,
                amount: BigInt(amount),
                reference: `DEP-${Date.now()}`,
            });

            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            console.error('Deposit Error:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
