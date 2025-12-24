import { prisma } from '../database/client.js';
import { ExchangeService } from './exchange.service.js';

interface TransferInput {
    fromAccountId: string;
    toAccountNumber: string;
    amount: bigint;
    description?: string;
    reference?: string;
}

interface DepositInput {
    toAccountNumber: string;
    amount: bigint;
    reference?: string;
}

export class TransferService {
    static async transferFunds(input: TransferInput) {
        const {
            fromAccountId,
            toAccountNumber,
            amount,
            description,
            reference,
        } = input;

        if (amount <= 0) {
            throw new Error('Transfer amount must be positive');
        }

        // A. Resolve Recipient: Account Number -> UUID
        const recipient = await prisma.account.findUnique({
            where: { accountNumber: toAccountNumber },
        });

        if (!recipient) {
            throw new Error('Recipient account number not found');
        }

        const toAccountId = recipient.id; // 👈 Found the UUID!

        // B. Safety Checks
        if (fromAccountId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
        }

        // C. Perform Transaction (using UUIDs)
        return await prisma.$transaction(async (tx: any) => {
            const sender = await tx.account.findUniqueOrThrow({
                where: { id: fromAccountId },
            });

            if (!sender.allowOverdraft && sender.balance < amount) {
                throw new Error(
                    `Insufficient funds. Available: ${sender.balance}, Required: ${amount}`
                );
            }

            // 1. Decrement Sender
            await tx.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: amount } },
            });

            // 2. Increment Recipient
            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: amount } },
            });

            // 3. Log the Transaction
            return await tx.transaction.create({
                data: {
                    reference: reference || `REF-${Date.now()}`,
                    currency: sender.currency,
                    description,
                    status: 'POSTED',
                    entries: {
                        create: [
                            { accountId: fromAccountId, amount: -amount },
                            { accountId: toAccountId, amount: amount },
                        ],
                    },
                },
            });
        });
    }

    static async depositFunds(input: DepositInput) {
        const { toAccountNumber, amount, reference } = input;

        if (amount <= 0) {
            throw new Error('Deposit amount must be positive');
        }

        const bankEmail = process.env.BANK_EMAIL;
        if (!bankEmail) throw new Error('BANK_EMAIL not set in .env');

        const bankPreview = await prisma.account.findUniqueOrThrow({
            where: { email: bankEmail },
        });
        const bankId = bankPreview.id;

        const userPreview = await prisma.account.findUnique({
            where: { accountNumber: toAccountNumber },
        });

        if (!userPreview) {
            throw new Error('Target account number not found');
        }
        const toAccountId = userPreview.id;

        let exchangeRate = 1.0;
        if (bankPreview.currency !== userPreview.currency) {
            exchangeRate = await ExchangeService.getLiveRate(
                bankPreview.currency,
                userPreview.currency
            );
        }

        const creditAmount = amount;
        const bankCostFloat = Number(amount) / exchangeRate;
        const debitAmount = BigInt(Math.ceil(bankCostFloat));

        return await prisma.$transaction(async (tx: any) => {
            const bank = await tx.account.findUniqueOrThrow({
                where: { id: bankId },
            });

            if (bank.balance < debitAmount) {
                throw new Error(
                    `Central Treasury Insufficient Funds! Needs ${debitAmount} ${bank.currency}`
                );
            }

            await tx.account.update({
                where: { id: bankId },
                data: { balance: { decrement: debitAmount } },
            });

            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: creditAmount } },
            });

            return await tx.transaction.create({
                data: {
                    reference: reference || `DEP-FX-${Date.now()}`,
                    currency: bank.currency,
                    targetCurrency: userPreview.currency,
                    exchangeRate: exchangeRate,
                    description: `Treasury Deposit (${exchangeRate} rate)`,
                    status: 'POSTED',
                    entries: {
                        create: [
                            { accountId: bankId, amount: -debitAmount },
                            { accountId: toAccountId, amount: creditAmount },
                        ],
                    },
                },
            });
        });
    }
}
