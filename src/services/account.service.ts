import { prisma } from '../database/client.js';
import { Prisma } from '@prisma/client';

type EntryWithTransaction = Prisma.EntryGetPayload<{
    include: { transaction: true };
}>;

export class AccountService {
    static async createAccount(name: string, currency: string) {
        return await prisma.account.create({
            data: {
                name,
                currency,
                balance: 0n,
                allowOverdraft: false,
            },
        });
    }

    static async getAccount(id: string) {
        return await prisma.account.findUniqueOrThrow({
            where: { id },
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
}
