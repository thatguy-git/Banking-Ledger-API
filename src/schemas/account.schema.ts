import { z } from 'zod';

export const GenerateApiKeySchema = z.object({
    name: z
        .string()
        .min(1, 'API key name cannot be empty')
        .max(100, 'API key name must be less than 100 characters')
        .trim(),
});

export const PaginationSchema = z.object({
    page: z.coerce
        .number()
        .int('Page must be a whole number')
        .positive('Page must be greater than 0')
        .max(10000, 'Page number too large')
        .default(1),
    limit: z.coerce
        .number()
        .int('Limit must be a whole number')
        .positive('Limit must be greater than 0')
        .max(100, 'Limit cannot exceed 100 items per page')
        .default(20),
});

export type GenerateApiKeyInput = z.infer<typeof GenerateApiKeySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
