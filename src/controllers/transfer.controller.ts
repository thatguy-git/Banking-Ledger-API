import { Request, Response } from 'express';
import { TransferService } from '../services/transfer.service.js';

export class TransferController {
    static async transfer(req: Request, res: Response) {
        try {
            const {
                fromAccountId,
                toAccountId,
                amount,
                description,
                reference,
            } = req.body;

            if (!fromAccountId || !toAccountId || !amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: fromAccountId, toAccountId, or amount',
                });
            }
            const result = await TransferService.transferFunds({
                fromAccountId,
                toAccountId,
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
}
