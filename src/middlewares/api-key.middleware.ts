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
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    // 👇 ADD THIS DEBUG LOG
    console.log(`🔑 Incoming Key: '${apiKey}'`);

    const account = await ApiKeyService.validateApiKey(apiKey);

    // 👇 ADD THIS DEBUG LOG
    console.log(`🕵️ Lookup Result:`, account);

    if (!account) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
    }
    // ...

    (req as ApiKeyAuthenticatedRequest).apiKeyAccount = {
        accountId: account.accountId,
        name: account.name,
    };
    next();
};
