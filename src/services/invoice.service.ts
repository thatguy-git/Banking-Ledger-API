import { prisma } from '../database/client.js';
import bcrypt from 'bcryptjs';

interface CreateInvoiceInput {
    creditorId: string;
    amount: bigint;
    reference?: string;
    description: string;
    expiresAt?: Date;
}

interface PayInvoiceInput {
    invoiceId: string;
    payerId: string;
    pin: string;
    idempotencyKey?: string;
}

interface InvoicePaymentResponse {
    id: string;
    reference: string;
    amount: bigint;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export class InvoiceService {
    static async createInvoice(input: CreateInvoiceInput) {
        let {
            creditorId,
            amount,
            reference: bodyReference,
            description,
            expiresAt,
        } = input;

        if (amount <= 0) {
            throw new Error('Invoice amount must be positive');
        }

        const creditor = await prisma.account.findUnique({
            where: { id: creditorId },
        });

        if (!creditor) {
            throw new Error('Creditor account not found');
        }

        if (!description) {
            throw new Error('Please write a description for the invoice');
        }

        let finalReference = bodyReference;

        if (!finalReference) {
            const randomSuffix = Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0');
            finalReference = `INV-${Date.now()}-${randomSuffix}`;
        }

        return await prisma.invoice.create({
            data: {
                reference: finalReference,
                amount,
                creditorAccountId: creditorId,
                description,
                expiresAt, // Set expiration if provided
            },
        });
    }

    static async payInvoice(input: PayInvoiceInput) {
        const { invoiceId, payerId, pin, idempotencyKey } = input;

        if (idempotencyKey) {
            const existingTx = await prisma.transaction.findUnique({
                where: { idempotencyKey },
            });

            if (existingTx) {
                console.log(
                    `Idempotency hit: Returning previous success for ${idempotencyKey}`
                );
                return await prisma.invoice.findUniqueOrThrow({
                    where: { id: invoiceId },
                });
            }
        }

        return await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { creditorAccount: true },
            });

            if (!invoice) throw new Error('Invoice not found');
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

            if (!payer) throw new Error('Payer account not found');

            // C. 🔐 Verify PIN (Security Check)
            // We throw here because a bad PIN is a user error, not a transaction failure.
            // The invoice should remain PENDING so they can try again.
            const isPinValid = await bcrypt.compare(pin, payer.transactionPin);
            if (!isPinValid) {
                throw new Error('Invalid Transaction PIN');
            }

            // D. 💰 Check Balance (Logic Limit Check)
            // If balance is low, we FAIL the invoice and notify the merchant.
            if (payer.balance < invoice.amount) {
                console.log(`❌ Insufficient funds for Invoice ${invoiceId}`);

                // 1. Mark Invoice FAILED
                const failedInvoice = await tx.invoice.update({
                    where: { id: invoiceId },
                    data: { status: 'FAILED' },
                });

                // 2. Add "Failure" Webhook to Outbox
                await tx.webhookEvent.create({
                    data: {
                        endpoint: process.env.TICKETING_WEBHOOK_URL!,
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
                    endpoint: process.env.TICKETING_WEBHOOK_URL!,
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
