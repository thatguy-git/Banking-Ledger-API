import { prisma } from '../database/client.js';
import { Prisma } from '@prisma/client';

type EntryWithTransaction = Prisma.EntryGetPayload<{
    include: { transaction: true };
}>;

export class AccountService {
    static async getAccount(id: string) {
        return await prisma.account.findUniqueOrThrow({
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

    static async getHistory(userId: string, limit = 20, offset = 0) {
        const transactions = await prisma.transaction.findMany({
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
            },
        });

        const total = await prisma.transaction.count({
            where: {
                OR: [{ fromAccountId: userId }, { toAccountId: userId }],
            },
        });

        return { transactions, total };
    }

    static async getBalance(id: string) {
        const account = await prisma.account.findUniqueOrThrow({
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
