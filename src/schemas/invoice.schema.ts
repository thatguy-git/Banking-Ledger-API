import { z } from 'zod';

export const CreateInvoiceSchema = z.object({
    amount: z
        .union([z.string(), z.number()])
        .refine((val) => {
            const num = typeof val === 'string' ? parseFloat(val) : val;
            return !isNaN(num) && num > 0;
        }, 'Amount must be a positive number greater than 0')
        .refine((val) => {
            const num = typeof val === 'string' ? parseFloat(val) : val;
            return num <= 1000000; // Max 1M for safety
        }, 'Amount cannot exceed 1,000,000'),
    description: z
        .string()
        .max(500, 'Description cannot exceed 500 characters')
        .trim()
        .optional(),
    webhookUrl: z
        .string()
        .min(1, 'Webhook URL is required')
        .url(
            'Please enter a valid webhook URL (must start with http:// or https://)',
        )
        .trim(),
    reference: z
        .string()
        .min(1, 'Reference cannot be empty')
        .max(100, 'Reference cannot exceed 100 characters')
        .trim(),
});

export const PayInvoiceSchema = z.object({
    pin: z
        .string()
        .min(1, 'PIN is required')
        .min(4, 'PIN must be at least 4 characters long')
        .max(10, 'PIN cannot exceed 10 characters'),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type PayInvoiceInput = z.infer<typeof PayInvoiceSchema>;
