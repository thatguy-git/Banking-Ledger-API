import { z } from 'zod';

export const SignupSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(1, 'Name cannot be empty').trim().optional(),
    currency: z
        .string()
        .length(3, 'Currency must be a 3-letter code (e.g., USD, EUR)')
        .toUpperCase()
        .optional(),
    pin: z
        .string()
        .min(1, 'PIN is required')
        .min(4, 'PIN must be at least 4 characters long'),
    question: z.string().min(1, 'Security question cannot be empty').trim(),
    answer: z.string().min(1, 'Security answer cannot be empty').trim(),
});

export const LoginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
