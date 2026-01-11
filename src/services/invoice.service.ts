import { prisma } from '../database/client.js';
import bcrypt from 'bcryptjs';
import { ExchangeService } from './exchange.service.js';
import axios from 'axios';

interface CreateInvoiceInput {
    creditorId: string;
    amount: bigint;
    reference?: string;
    description: string;
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
            },
        });
    }

    static async payInvoice(input: PayInvoiceInput) {
        const { invoiceId, payerId, pin, idempotencyKey } = input;

        if (!idempotencyKey) {
            throw new Error('Please provide an idempotency key');
        }

        if (idempotencyKey) {
            const existingTx = await prisma.transaction.findUnique({
                where: { idempotencyKey },
            });

            if (existingTx) {
                console.log(`Returning previous success for ${idempotencyKey}`);
                const invoice = await prisma.invoice.findUniqueOrThrow({
                    where: { id: invoiceId },
                });
                return invoice;
            }
        }

        return await prisma.$transaction(async (tx) => {
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { creditorAccount: true },
            });

            if (!invoice) throw new Error('Invoice not found');
            if (invoice.status === 'PAID')
                throw new Error('Invoice already paid');

            const payer = await tx.account.findUnique({
                where: { id: payerId },
            });

            if (!payer) throw new Error('Payer account not found');

            const isPinValid = await bcrypt.compare(pin, payer.transactionPin);

            if (!isPinValid) {
                throw new Error('Invalid Transaction PIN');
            }

            if (payer.balance < invoice.amount) {
                throw new Error('Insufficient funds');
            }

            await tx.account.update({
                where: { id: payer.id },
                data: { balance: { decrement: invoice.amount } },
            });

            await tx.account.update({
                where: { id: invoice.creditorAccountId },
                data: { balance: { increment: invoice.amount } },
            });

            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID', paidAt: new Date() },
            });

            await tx.transaction.create({
                data: {
                    amount: invoice.amount,
                    type: 'INVOICE_PAYMENT',
                    fromAccountId: payer.id,
                    toAccountId: invoice.creditorAccountId,
                    reference: invoice.reference,
                    status: 'POSTED',
                    currency: payer.currency,
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

            return updatedInvoice;
        });
    }

    static async sendWebhook(invoice: InvoicePaymentResponse) {
        if (!process.env.WEBHOOK_URL) {
            return;
        }
        const webhookUrl = process.env.WEBHOOK_URL;
        axios
            .post(
                webhookUrl,
                {
                    event: 'INVOICE_PAID',
                    data: {
                        invoiceId: invoice.id,
                        reference: invoice.reference,
                        amount: invoice.amount,
                    },
                },
                {
                    headers: {
                        'x-webhook-signature': process.env.WEBHOOK_SECRET,
                    },
                }
            )
            .catch((err) => console.error('Webhook failed:', err.message));
    }
}
