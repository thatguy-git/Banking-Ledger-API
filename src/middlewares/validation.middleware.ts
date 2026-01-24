import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidatedRequest extends Request {
    validatedData?: Record<string, any>;
}

export const validateRequest = (
    schema: ZodSchema,
    source: 'body' | 'query' | 'params' = 'body',
) => {
    return (req: ValidatedRequest, res: Response, next: NextFunction) => {
        try {
            const dataToValidate =
                source === 'query'
                    ? req.query
                    : source === 'params'
                      ? req.params
                      : req.body;
            const validatedData = schema.parse(dataToValidate) as Record<
                string,
                any
            >;

            req.validatedData = validatedData;

            if (source === 'body') {
                req.body = validatedData;
            } else if (source === 'query') {
                req.query = validatedData;
            } else if (source === 'params') {
                req.params = validatedData;
            }

            next();
        } catch (error: any) {
            if (error instanceof ZodError) {
                // Format Zod errors nicely
                const formattedErrors: Record<string, string[]> = {};

                error.issues.forEach((err: any) => {
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
