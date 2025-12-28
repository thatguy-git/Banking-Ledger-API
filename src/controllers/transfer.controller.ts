import { Request, Response } from 'express';
import { TransferService } from '../services/transfer.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { prisma } from '../database/client.js';

export class TransferController {
    static async transfer(req: Request, res: Response) {
        const idempotencyKey = req.headers['idempotency-key'] as
            | string
            | undefined;
        const authReq = req as AuthenticatedRequest;
        const senderId = authReq.user.id;
        try {
            const { toAccountNumber, amount, description, reference } =
                req.body;

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
            const result = await TransferService.transferFunds({
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
            const { amount } = req.body;
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user.id;

            const userAccount = await prisma.account.findUnique({
                where: { id: userId },
            });

            if (!userAccount)
                return res.status(404).json({ error: 'Account not found' });

            const result = await TransferService.depositFunds({
                toAccountNumber: userAccount.accountNumber,
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
