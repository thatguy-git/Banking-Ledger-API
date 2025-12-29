"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const client_js_1 = require("../database/client.js");
class AccountService {
    static async getAccount(id) {
        return await client_js_1.prisma.account.findUniqueOrThrow({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                currency: true,
                balance: true,
                allowOverdraft: true,
                createdAt: false,
            },
        });
    }
    static async getHistory(userId, limit = 20, offset = 0) {
        const transactions = await client_js_1.prisma.transaction.findMany({
            where: {
                OR: [{ fromAccountId: userId }, { toAccountId: userId }],
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
            include: {
                fromAccount: {
                    select: { accountNumber: true, name: true },
                },
                toAccount: {
                    select: { accountNumber: true, name: true },
                },
                entries: true,
            },
        });
        const total = await client_js_1.prisma.transaction.count({
            where: {
                OR: [{ fromAccountId: userId }, { toAccountId: userId }],
            },
        });
        return { transactions, total };
    }
    static async getBalance(id) {
        const account = await client_js_1.prisma.account.findUniqueOrThrow({
            where: { id },
            select: {
                balance: true,
                currency: true,
            },
        });
        return {
            balance: account.balance.toString(),
            currency: account.currency,
        };
    }
}
exports.AccountService = AccountService;
