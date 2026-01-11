import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/api-key.service.js';

export interface ApiKeyAuthenticatedRequest extends Request {
    apiKeyAccount?: {
        accountId: string;
        name?: string;
    };
}

export const authenticateApiKey = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const apiKey = req.headers['api-key'] as string;

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    const account = await ApiKeyService.validateApiKey(apiKey);
    if (!account) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
    }

    (req as ApiKeyAuthenticatedRequest).apiKeyAccount = {
        accountId: account.accountId,
        name: account.name,
    };
    next();
};
