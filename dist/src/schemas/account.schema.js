"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.GenerateApiKeySchema = void 0;
const zod_1 = require("zod");
exports.GenerateApiKeySchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(1, 'API key name cannot be empty')
        .max(100, 'API key name must be less than 100 characters')
        .trim(),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z
        .coerce
        .number()
        .int('Page must be a whole number')
        .positive('Page must be greater than 0')
        .max(10000, 'Page number too large')
        .default(1),
    limit: zod_1.z
        .coerce
        .number()
        .int('Limit must be a whole number')
        .positive('Limit must be greater than 0')
        .max(100, 'Limit cannot exceed 100 items per page')
        .default(20),
});
