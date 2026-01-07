import { prisma } from '../database/client.js';
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
}

export class InvoiceService {
    static async createInvoice(input: CreateInvoiceInput) {
        let { creditorId, amount, reference, description } = input;

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

        if (!reference) {
            const randomSuffix = Math.floor(Math.random() * 10000)
                .toString()
                .padStart(4, '0');
            const reference = `INV-${Date.now()}-${randomSuffix}`;
        }

        return await prisma.invoice.create({
            data: {
                reference,
                amount,
                creditorAccountId: creditorId,
                description,
            },
        });
    }

    static async payInvoice(input: PayInvoiceInput) {
        const { invoiceId, payerId, pin } = input;

        return await prisma.$transaction(async (tx) => {
            // A. Fetch Invoice & Validate
            const invoice = await tx.invoice.findUnique({
                where: { id: invoiceId },
                include: { creditorAccount: true },
            });

            if (!invoice) throw new Error('Invoice not found');
            if (invoice.status === 'PAID')
                throw new Error('Invoice already paid');

            // B. Fetch Payer & Validate
            const payer = await tx.account.findUnique({
                where: { id: payerId },
            });

            if (!payer) throw new Error('Payer account not found');

            // C. Verify PIN
            if (payer.transactionPin !== pin) {
                throw new Error('Invalid Transaction PIN');
            }

            // D. Check Balance
            if (payer.balance < invoice.amount) {
                throw new Error('Insufficient funds');
            }

            // E. Money Movement
            await tx.account.update({
                where: { id: payer.id },
                data: { balance: { decrement: invoice.amount } },
            });

            await tx.account.update({
                where: { id: invoice.creditorAccountId },
                data: { balance: { increment: invoice.amount } },
            });

            // F. Mark Invoice as PAID
            const updatedInvoice = await tx.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID', paidAt: new Date() },
            });

            // G. Create Transaction Record
            await tx.transaction.create({
                data: {
                    amount: invoice.amount,
                    type: 'INVOICE_PAYMENT',
                    fromAccountId: payer.id,
                    toAccountId: invoice.creditorAccountId,
                    reference: invoice.reference,
                    status: 'POSTED',
                    currency: payer.currency, // Assuming same currency for simplicity
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

    static async sendWebhook(invoice: any) {
        const webhookUrl =
            process.env.WEBHOOK_URL ||
            'http://localhost:4000/api/webhooks/bank';
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
