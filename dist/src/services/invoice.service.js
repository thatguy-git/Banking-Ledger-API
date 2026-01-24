"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const client_js_1 = require("../database/client.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
class InvoiceService {
    static async createInvoice(input) {
        let { creditorId, amount, reference, description, webhookUrl, expiresAt, } = input;
        if (amount <= 0) {
            throw new Error('Invoice amount must be positive');
        }
        const creditor = await client_js_1.prisma.account.findUnique({
            where: { id: creditorId },
        });
        if (!creditor) {
            throw new Error('Creditor account not found');
        }
        if (!description) {
            throw new Error('Please write a description for the invoice');
        }
        if (!reference) {
            const reference = input.reference || `REF-${(0, uuid_1.v4)()}`;
        }
        return await client_js_1.prisma.invoice.create({
            data: {
                reference,
                amount,
                creditorAccountId: creditorId,
                description,
                webhookUrl,
                expiresAt,
            },
        });
    }
    static async payInvoice(input) {
        const { invoiceId, payerId, pin, idempotencyKey } = input;
        if (idempotencyKey) {
            const existingTx = await client_js_1.prisma.transaction.findUnique({
                where: { idempotencyKey },
            });
            if (existingTx) {
                console.log(`Idempotency hit: Returning previous success for ${idempotencyKey}`);
                return await client_js_1.prisma.invoice.findUniqueOrThrow({
                    where: { id: invoiceId },
                });
            }
        }
        return await client_js_1.prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { creditorAccount: true },
            });
            if (!invoice)
                throw new Error('Invoice not found');
            if (invoice.status !== 'PENDING') {
                throw new Error(`Invoice is already ${invoice.status}`);
            }
            if (invoice.expiresAt && new Date() > invoice.expiresAt) {
                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { status: 'EXPIRED' },
                });
                throw new Error('Invoice has expired');
            }
            const payer = await tx.account.findUnique({
                where: { id: payerId },
            });
            if (!payer)
                throw new Error('Payer account not found');
            const isPinValid = await bcryptjs_1.default.compare(pin, payer.transactionPin);
            if (!isPinValid) {
                throw new Error('Invalid Transaction PIN');
            }
            const webhookEndpoint = invoice.webhookUrl;
            if (payer.balance < invoice.amount) {
                console.log(`❌ Insufficient funds for Invoice ${invoiceId}`);
                const failedInvoice = await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { status: 'FAILED' },
                });
                await tx.webhookEvent.create({
                    data: {
                        endpoint: webhookEndpoint,
                        status: 'PENDING',
                        payload: {
                            event: 'INVOICE_PAYMENT_FAILED',
                            invoiceId: failedInvoice.id,
                            reference: failedInvoice.reference,
                            status: 'FAILED',
                            reason: 'Insufficient funds',
                        },
                    },
                });
                // 3. Return the Failed Invoice (Do NOT throw, or we lose the 'FAILED' status update)
                return failedInvoice;
            }
            // E. 💸 Move the Money (The Transfer)
            await tx.account.update({
                where: { id: payer.id },
                data: { balance: { decrement: invoice.amount } },
            });
            await tx.account.update({
                where: { id: invoice.creditorAccountId },
                data: { balance: { increment: invoice.amount } },
            });
            // F. ✅ Update Invoice to PAID
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID', paidAt: new Date() },
            });
            // G. 📝 Create Transaction Record
            await tx.transaction.create({
                data: {
                    idempotencyKey, // Save the key so we can check it later!
                    amount: invoice.amount,
                    type: 'INVOICE_PAYMENT',
                    fromAccountId: payer.id,
                    toAccountId: invoice.creditorAccountId,
                    reference: invoice.reference,
                    status: 'POSTED',
                    currency: payer.currency,
                    // Optional: Double Entry Ledger
                    entries: {
                        create: [
                            { accountId: payer.id, amount: -invoice.amount },
                            {
                                accountId: invoice.creditorAccountId,
                                amount: invoice.amount,
                            },
                        ],
                    },
                },
            });
            // H. 🚀 Add "Success" Webhook to Outbox
            await tx.webhookEvent.create({
                data: {
                    endpoint: webhookEndpoint,
                    status: 'PENDING',
                    payload: {
                        event: 'INVOICE_PAID',
                        invoiceId: updatedInvoice.id,
                        reference: updatedInvoice.reference,
                        status: 'PAID',
                    },
                },
            });
            return updatedInvoice;
        });
    }
}
exports.InvoiceService = InvoiceService;
