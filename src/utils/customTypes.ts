import { Request } from 'express';

export interface ApiKeyAuthenticatedRequest extends Request {
    apiKeyAccount?: {
        accountId: string;
        name: string | null;
    };
}
