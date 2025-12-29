"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferService = exports.BANK_CONFIG = void 0;
const client_js_1 = require("../database/client.js");
const exchange_service_js_1 = require("./exchange.service.js");
exports.BANK_CONFIG = {
    MAX_TRANSACTION_LIMIT: BigInt(100000),
};
class TransferService {
    static async transferFunds(input) {
        const { senderId, toAccountNumber, amount, description, reference, idempotencyKey, } = input;
        if (idempotencyKey) {
            const existingTransaction = await client_js_1.prisma.transaction.findUnique({
                where: { idempotencyKey },
            });
            if (existingTransaction) {
                return existingTransaction;
            }
        }
        if (amount <= 0) {
            throw new Error('Transfer amount must be positive');
        }
        const recipient = await client_js_1.prisma.account.findUnique({
            where: { accountNumber: toAccountNumber },
        });
        const sender = await client_js_1.prisma.account.findUnique({
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
        console.log(`Comparing '${sender.currency}' vs '${recipient.currency}'`);
        if (sender.currency !== recipient.currency) {
            exchangeRate = await exchange_service_js_1.ExchangeService.getLiveRate(sender.currency, recipient.currency);
        }
        const debitAmount = amount;
        const bankCostFloat = Number(amount) / exchangeRate;
        const creditAmount = BigInt(Math.ceil(bankCostFloat));
        if (senderId === toAccountId) {
            throw new Error('Cannot transfer to the same account');
        }
        return await client_js_1.prisma.$transaction(async (tx) => {
            const sender = await tx.account.findUniqueOrThrow({
                where: { id: senderId },
            });
            if (!sender.allowOverdraft && sender.balance < amount) {
                throw new Error(`Insufficient funds. Available: ${sender.balance}, Required: ${amount}`);
            }
            if (sender.balance < debitAmount) {
                throw new Error(`Insufficient Funds! Needs ${debitAmount} ${sender.currency}`);
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
    static async depositFunds(input) {
        const { toAccountNumber, amount, reference } = input;
        if (amount <= 0) {
            throw new Error('Deposit amount must be positive');
        }
        if (BigInt(amount) > exports.BANK_CONFIG.MAX_TRANSACTION_LIMIT) {
            throw new Error(`Transfer limit exceeded. Maximum allowed per transaction is ${exports.BANK_CONFIG.MAX_TRANSACTION_LIMIT}`);
        }
        const bankEmail = process.env.BANK_EMAIL;
        if (!bankEmail)
            throw new Error('BANK_EMAIL not set in .env');
        const bankPreview = await client_js_1.prisma.account.findUniqueOrThrow({
            where: { email: bankEmail },
        });
        const bankId = bankPreview.id;
        const userPreview = await client_js_1.prisma.account.findUnique({
            where: { accountNumber: toAccountNumber },
        });
        if (!userPreview) {
            throw new Error('Target account number not found');
        }
        const toAccountId = userPreview.id;
        let exchangeRate = 1.0;
        if (bankPreview.currency !== userPreview.currency) {
            exchangeRate = await exchange_service_js_1.ExchangeService.getLiveRate(bankPreview.currency, userPreview.currency);
        }
        const creditAmount = amount;
        const bankCostFloat = Number(amount) / exchangeRate;
        const debitAmount = BigInt(Math.ceil(bankCostFloat));
        return await client_js_1.prisma.$transaction(async (tx) => {
            const bank = await tx.account.findUniqueOrThrow({
                where: { id: bankId },
            });
            if (bank.balance < debitAmount) {
                throw new Error(`Central Treasury Insufficient Funds! Needs ${debitAmount} ${bank.currency}`);
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
}
exports.TransferService = TransferService;
