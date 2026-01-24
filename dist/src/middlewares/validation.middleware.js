"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const validateRequest = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const dataToValidate = source === 'query'
                ? req.query
                : source === 'params'
                    ? req.params
                    : req.body;
            const validatedData = schema.parse(dataToValidate);
            req.validatedData = validatedData;
            if (source === 'body') {
                req.body = validatedData;
            }
            else if (source === 'query') {
                req.query = validatedData;
            }
            else if (source === 'params') {
                req.params = validatedData;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                // Format Zod errors nicely
                const formattedErrors = {};
                error.issues.forEach((err) => {
                    const field = err.path.join('.') || 'body';
                    if (!formattedErrors[field]) {
                        formattedErrors[field] = [];
                    }
                    formattedErrors[field].push(err.message);
                });
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    message: 'Please check your input data',
                    details: formattedErrors,
                    fields: Object.keys(formattedErrors),
                });
            }
            res.status(400).json({
                success: false,
                error: error.message || 'Validation error',
            });
        }
    };
};
exports.validateRequest = validateRequest;
;
