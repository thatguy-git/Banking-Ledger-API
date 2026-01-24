"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChargePaymentSchema = exports.DepositSchema = exports.TransferSchema = void 0;
const zod_1 = require("zod");
exports.TransferSchema = zod_1.z.object({
    toAccountNumber: zod_1.z
        .string()
        .min(1, 'Account number cannot be empty')
        .max(50, 'Account number is too long')
        .trim(),
    amount: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number greater than 0')
        .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num <= 1000000; // Max 1M for safety
    }, 'Amount cannot exceed 1,000,000'),
    description: zod_1.z
        .string()
        .max(200, 'Description cannot exceed 200 characters')
        .trim()
        .optional(),
    reference: zod_1.z
        .string()
        .max(100, 'Reference cannot exceed 100 characters')
        .trim()
        .optional(),
});
exports.DepositSchema = zod_1.z.object({
    amount: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number greater than 0')
        .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num <= 1000000; // Max 1M for safety
    }, 'Amount cannot exceed 1,000,000'),
});
exports.ChargePaymentSchema = zod_1.z.object({
    sellerAccountNumber: zod_1.z
        .string()
        .min(1, 'Seller account number cannot be empty')
        .max(50, 'Seller account number is too long')
        .trim(),
    amount: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return !isNaN(num) && num > 0;
    }, 'Amount must be a positive number greater than 0')
        .refine((val) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return num <= 1000000; // Max 1M for safety
    }, 'Amount cannot exceed 1,000,000'),
    description: zod_1.z
        .string()
        .max(200, 'Description cannot exceed 200 characters')
        .trim()
        .optional(),
    reference: zod_1.z
        .string()
        .max(100, 'Reference cannot exceed 100 characters')
        .trim()
        .optional(),
});
