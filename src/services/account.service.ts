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

    static async getHistory(accountId: string) {
        const history: EntryWithTransaction[] = await prisma.entry.findMany({
            where: { accountId },
            include: {
                transaction: true,
            },
            orderBy: {
                transaction: { createdAt: 'desc' },
            },
        });

        return history.map((entry) => ({
            id: entry.id,
            amount: entry.amount,
            description: entry.transaction.description,
            reference: entry.transaction.reference,
            status: entry.transaction.status,
            date: entry.transaction.createdAt,
            type: entry.amount > 0n ? 'CREDIT' : 'DEBIT',
        }));
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
