"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayInvoiceSchema = exports.CreateInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.CreateInvoiceSchema = zod_1.z.object({
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
        .max(500, 'Description cannot exceed 500 characters')
        .trim()
        .optional(),
    webhookUrl: zod_1.z
        .string()
        .min(1, 'Webhook URL is required')
        .url('Please enter a valid webhook URL (must start with http:// or https://)')
        .trim(),
    reference: zod_1.z
        .string()
        .min(1, 'Reference cannot be empty')
        .max(100, 'Reference cannot exceed 100 characters')
        .trim(),
});
exports.PayInvoiceSchema = zod_1.z.object({
    pin: zod_1.z
        .string()
        .min(1, 'PIN is required')
        .min(4, 'PIN must be at least 4 characters long')
        .max(10, 'PIN cannot exceed 10 characters'),
});
