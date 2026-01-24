import { z } from 'zod';

export const TransferSchema = z.object({
    toAccountNumber: z
        .string()
        .min(1, 'Account number cannot be empty')
        .max(50, 'Account number is too long')
        .trim(),
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
        .max(200, 'Description cannot exceed 200 characters')
        .trim()
        .optional(),
    reference: z
        .string()
        .max(100, 'Reference cannot exceed 100 characters')
        .trim()
        .optional(),
});

export const DepositSchema = z.object({
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
});

export const ChargePaymentSchema = z.object({
    sellerAccountNumber: z
        .string()
        .min(1, 'Seller account number cannot be empty')
        .max(50, 'Seller account number is too long')
        .trim(),
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
        .max(200, 'Description cannot exceed 200 characters')
        .trim()
        .optional(),
    reference: z
        .string()
        .max(100, 'Reference cannot exceed 100 characters')
        .trim()
        .optional(),
});

export type TransferInput = z.infer<typeof TransferSchema>;
export type DepositInput = z.infer<typeof DepositSchema>;
export type ChargePaymentInput = z.infer<typeof ChargePaymentSchema>;
