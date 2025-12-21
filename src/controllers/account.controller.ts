import { Request, Response } from 'express';
import { AccountService } from '../services/account.service.js';

export class AccountController {
    static async create(req: Request, res: Response) {
        try {
            const { name, currency } = req.body;

            if (!name || !currency) {
                return res
                    .status(400)
                    .json({ error: 'Name and Currency are required' });
            }

            const account = await AccountService.createAccount(name, currency);
            res.status(201).json(account);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const account = await AccountService.getAccount(id);
            res.status(200).json(account);
        } catch (error: any) {
            res.status(404).json({ error: 'Account not found' });
        }
    }
}
