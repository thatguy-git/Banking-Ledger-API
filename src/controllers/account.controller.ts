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

    static async getAccountHistory(req: Request, res: Response) {
        try {
            const authReq = req as AuthenticatedRequest;
            const userId = authReq.user.id;
            const history = await AccountService.getHistory(userId);
            res.status(200).json({
                success: true,
                data: history,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: 'Account not found',
            });
        }
    }
}
