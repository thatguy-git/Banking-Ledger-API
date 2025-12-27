import { Request, Response } from 'express';
import { AccountService } from '../services/account.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export class AccountController {
    static async getAccount(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user.id;
            const account = await AccountService.getAccount(userId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.status(200).json(account);
        } catch (error: any) {
            console.error('Get Account Error:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getAccountBalance(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user.id;
            const result = await AccountService.getBalance(userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: 'Account not found',
            });
        }
    }

    static async getLedgerHistory(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user.id;

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = (page - 1) * limit;

            const { transactions, total } = await AccountService.getHistory(
                userId,
                limit,
                offset
            );

            const formattedHistory = transactions.map((tx) => {
                const isSender = tx.fromAccountId === userId;
                return {
                    id: tx.id,
                    type: isSender ? 'DEBIT' : 'CREDIT',
                    amount: tx.entries[0]?.amount
                        ? Math.abs(Number(tx.entries[0].amount))
                        : 0,
                    currency: tx.currency,
                    counterparty: isSender
                        ? tx.toAccount.name
                        : tx.fromAccount.name,
                    description: tx.description,
                    date: tx.createdAt,
                    status: tx.status,
                };
            });

            res.status(200).json({
                data: formattedHistory,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error: any) {
            console.error('History Error:', error);
            res.status(500).json({
                error: 'Failed to fetch transaction history',
            });
        }
    }
}
