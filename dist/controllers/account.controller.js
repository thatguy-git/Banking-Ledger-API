"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const account_service_js_1 = require("../services/account.service.js");
class AccountController {
    static async getAccount(req, res) {
        try {
            const authReq = req;
            const userId = authReq.user.id;
            const account = await account_service_js_1.AccountService.getAccount(userId);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.status(200).json(account);
        }
        catch (error) {
            console.error('Get Account Error:', error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    static async getAccountBalance(req, res) {
        try {
            const authReq = req;
            const userId = authReq.user.id;
            const result = await account_service_js_1.AccountService.getBalance(userId);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(404).json({
                success: false,
                error: 'Account not found',
            });
        }
    }
    static async getLedgerHistory(req, res) {
        try {
            const authReq = req;
            const userId = authReq.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const { transactions, total } = await account_service_js_1.AccountService.getHistory(userId, limit, offset);
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
        }
        catch (error) {
            console.error('History Error:', error);
            res.status(500).json({
                error: 'Failed to fetch transaction history',
            });
        }
    }
}
exports.AccountController = AccountController;
