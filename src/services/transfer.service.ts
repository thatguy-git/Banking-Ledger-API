import { prisma } from '../database/client.js';
import { ExchangeService } from './exchange.service.js';

interface TransferInput {
    senderId: string;
    toAccountNumber: string;
    amount: bigint;
    description?: string;
    reference?: string;
    idempotencyKey?: string;
}

interface DepositInput {
    toAccountNumber: string;
    amount: bigint;
    reference?: string;
}

interface ChargeInput {
    buyerId: string;
    sellerAccountNumber: string;
    amount: bigint;
    description?: string;
    reference?: string;
}

export const BANK_CONFIG = {
    MAX_TRANSACTION_LIMIT: BigInt(100000),
};

export class TransferService {
    static async transferFunds(input: TransferInput) {
        const {
            senderId,
            toAccountNumber,
            amount,
            description,
            reference,
            idempotencyKey,
        } = input;

        if (idempotencyKey) {
            const existingTransaction = await prisma.transaction.findUnique({
                where: { idempotencyKey },
            });

            if (existingTransaction) {
                return existingTransaction;
            }
        }

        if (amount <= 0) {
            throw new Error('Transfer amount must be positive');
        }

        const recipient = await prisma.account.findUnique({
            where: { accountNumber: toAccountNumber },
        });

        const sender = await prisma.account.findUnique({
            where: { id: senderId },
        });

        if (!sender) {
            throw new Error('Sender account not found');
        }

        if (!recipient) {
            throw new Error('Recipient account number not found');
        }

        const toAccountId = recipient.id;

        let exchangeRate = 1.0;
        console.log(
            `Comparing '${sender.currency}' vs '${recipient.currency}'`
        );
        if (sender.currency !== recipient.currency) {
            exchangeRate = await ExchangeService.getLiveRate(
                sender.currency,
                recipient.currency
            );
        }

        const debitAmount = amount;
        const bankCostFloat = Number(amount) / exchangeRate;
        const creditAmount = BigInt(Math.ceil(bankCostFloat));

        if (senderId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
        }

        return await prisma.$transaction(async (tx: any) => {
            const sender = await tx.account.findUniqueOrThrow({
                where: { id: senderId },
            });

            if (!sender.allowOverdraft && sender.balance < amount) {
                throw new Error(
                    `Insufficient funds. Available: ${sender.balance}, Required: ${amount}`
                );
            }

            if (sender.balance < debitAmount) {
                throw new Error(
                    `Insufficient Funds! Needs ${debitAmount} ${sender.currency}`
                );
            }

            await tx.account.update({
                where: { id: senderId },
                data: { balance: { decrement: debitAmount } },
            });

            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: creditAmount } },
            });

            return await tx.transaction.create({
                data: {
                    reference: reference || `REF-${Date.now()}`,
                    currency: sender.currency,
                    exchangeRate: exchangeRate,
                    targetCurrency: recipient.currency,
                    description,
                    status: 'POSTED',
                    fromAccountId: senderId,
                    toAccountId: toAccountId,
                    entries: {
                        create: [
                            { accountId: senderId, amount: -amount },
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

        if (BigInt(amount) > BANK_CONFIG.MAX_TRANSACTION_LIMIT) {
            throw new Error(
                `Transfer limit exceeded. Maximum allowed per transaction is ${BANK_CONFIG.MAX_TRANSACTION_LIMIT}`
            );
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
                    amount: debitAmount,
                    fromAccountId: bankId,
                    toAccountId: toAccountId,
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

    static async chargePayment(input: ChargeInput) {
        const { buyerId, sellerAccountNumber, amount, description, reference } =
            input;

        if (amount <= 0) {
            throw new Error('Charge amount must be positive');
        }

        if (amount > BANK_CONFIG.MAX_TRANSACTION_LIMIT) {
            throw new Error(
                `Charge limit exceeded. Maximum allowed per transaction is ${BANK_CONFIG.MAX_TRANSACTION_LIMIT}`
            );
        }

        const buyer = await prisma.account.findUnique({
            where: { id: buyerId },
        });

        const seller = await prisma.account.findUnique({
            where: { accountNumber: sellerAccountNumber },
        });

        if (!buyer) {
            throw new Error('Buyer account not found');
        }

        if (!seller) {
            throw new Error('Seller account not found');
        }

        if (buyer.id === seller.id) {
            throw new Error('Cannot charge your own account');
        }

        let exchangeRate = 1.0;
        if (buyer.currency !== seller.currency) {
            exchangeRate = await ExchangeService.getLiveRate(
                buyer.currency,
                seller.currency
            );
        }

        const debitAmount = amount;
        const creditAmountFloat = Number(amount) * exchangeRate;
        const creditAmount = BigInt(Math.floor(creditAmountFloat));

        return await prisma.$transaction(async (tx: any) => {
            const buyerAccount = await tx.account.findUniqueOrThrow({
                where: { id: buyer.id },
            });

            if (buyerAccount.balance < debitAmount) {
                throw new Error(
                    `Insufficient funds. Available: ${buyerAccount.balance}, Required: ${debitAmount}`
                );
            }

            await tx.account.update({
                where: { id: buyer.id },
                data: { balance: { decrement: debitAmount } },
            });

            await tx.account.update({
                where: { id: seller.id },
                data: { balance: { increment: creditAmount } },
            });

            return await tx.transaction.create({
                data: {
                    reference: reference || `CHG-${Date.now()}`,
                    currency: buyer.currency,
                    exchangeRate: exchangeRate,
                    targetCurrency: seller.currency,
                    description: description || 'Ticket purchase charge',
                    status: 'POSTED',
                    fromAccountId: buyer.id,
                    toAccountId: seller.id,
                    entries: {
                        create: [
                            { accountId: buyer.id, amount: -amount },
                            { accountId: seller.id, amount: creditAmount },
                        ],
                    },
                },
            });
        });
    }
}
