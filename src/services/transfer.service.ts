import { prisma } from '../database/client.js';
import { ExchangeService } from './exchange.service.js';

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

    static async depositFunds(
        toAccountId: string,
        amount: bigint,
        reference?: string
    ) {
        const bankId = process.env.BANK_ACCOUNT_ID;
        if (!bankId) throw new Error('BANK_ACCOUNT_ID is not set in .env');

        // STEP A: Prepare Data (Read-Only)
        // We fetch the accounts first just to check their currencies.
        // We are NOT locking them yet.
        const bankPreview = await prisma.account.findUniqueOrThrow({
            where: { id: bankId },
        });
        const userPreview = await prisma.account.findUniqueOrThrow({
            where: { id: toAccountId },
        });

        // STEP B: Fetch Live Rate (Network Call - Do this OUTSIDE the transaction!)
        let exchangeRate = 1.0;
        if (bankPreview.currency !== userPreview.currency) {
            exchangeRate = await ExchangeService.getLiveRate(
                bankPreview.currency,
                userPreview.currency
            );
        }

        // STEP C: Calculate Amounts
        const creditAmount = amount; // User receives exactly what they asked for

        // Calculate how much the Bank pays.
        // Example: User wants 100 EUR. Rate is 0.95 (1 USD = 0.95 EUR).
        // Bank Cost = 100 / 0.95 = 105.26 USD.
        // We multiply by 100000 before dividing to maintain precision during BigInt conversion.
        const bankCostFloat = Number(amount) / exchangeRate;
        const debitAmount = BigInt(Math.floor(bankCostFloat));

        // STEP D: The ACID Transaction (Fast & Locked)
        return await prisma.$transaction(async (tx: any) => {
            // 1. Lock Rows
            const bank = await tx.account.findUniqueOrThrow({
                where: { id: bankId },
            });
            const user = await tx.account.findUniqueOrThrow({
                where: { id: toAccountId },
            });

            // 2. Check Treasury Limit
            if (bank.balance < debitAmount) {
                throw new Error(
                    `Central Treasury Insufficient Funds! Needs ${debitAmount} ${bank.currency} to cover this deposit.`
                );
            }

            // 3. Move Money
            await tx.account.update({
                where: { id: bankId },
                data: { balance: { decrement: debitAmount } },
            });

            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: creditAmount } },
            });

            // 4. Create Record
            return await tx.transaction.create({
                data: {
                    reference: reference || `DEP-FX-${Date.now()}`,
                    currency: bank.currency, // Source (USD)
                    targetCurrency: user.currency, // Target (EUR)
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
