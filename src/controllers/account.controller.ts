import { Request, Response } from 'express';
import { AccountService } from '../services/account.service.js';

export class AccountController {
    static async getAccount(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const account = await AccountService.getAccount(id);
            res.status(200).json(account);
        } catch (error: any) {
            res.status(404).json({ error: 'Account not found' });
        }
    }

    static async getAccountBalance(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await AccountService.getBalance(id);
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
}
