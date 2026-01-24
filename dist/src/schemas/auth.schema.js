"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.SignupSchema = void 0;
const zod_1 = require("zod");
exports.SignupSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    password: zod_1.z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters long'),
    name: zod_1.z
        .string()
        .min(1, 'Name cannot be empty')
        .trim()
        .optional(),
    currency: zod_1.z
        .string()
        .length(3, 'Currency must be a 3-letter code (e.g., USD, EUR)')
        .toUpperCase()
        .optional(),
    pin: zod_1.z
        .string()
        .min(1, 'PIN is required')
        .min(4, 'PIN must be at least 4 characters long'),
    question: zod_1.z
        .string()
        .min(1, 'Security question cannot be empty')
        .trim(),
    answer: zod_1.z
        .string()
        .min(1, 'Security answer cannot be empty')
        .trim(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    password: zod_1.z
        .string()
        .min(1, 'Password is required'),
});
