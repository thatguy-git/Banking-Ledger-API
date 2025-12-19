import { prisma } from '../database/client.js';

interface TransferInput {
    fromAccountId: string;
    toAccountId: string;
    amount: bigint;
    description?: string;
    reference?: string;
}

export class TransferService {
    static async transferFunds(input: TransferInput) {
        const { fromAccountId, toAccountId, amount, description, reference } =
            input;

        if (amount <= 0) {
            throw new Error('Transfer amount must be positive');
        }
        if (fromAccountId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
        }
        return await prisma.$transaction(async (tx: any) => {
            const sender = await tx.account.findUniqueOrThrow({
                where: { id: fromAccountId },
            });
            if (!sender.allowOverdraft && sender.balance < amount) {
                throw new Error(
                    `Insufficient funds. Available: ${sender.balance}, Required: ${amount}`
                );
            }
            await tx.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: amount } },
            });
            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: amount } },
            });
            const transaction = await tx.transaction.create({
                data: {
                    reference: reference || `REF-${Date.now()}`,
                    currency: sender.currency,
                    description,
                    status: 'POSTED',
                    entries: {
                        create: [
                            {
                                accountId: fromAccountId,
                                amount: -amount,
                            },
                            {
                                accountId: toAccountId,
                                amount: amount,
                            },
                        ],
                    },
                },
            });

            return transaction;
        });
    }
}
