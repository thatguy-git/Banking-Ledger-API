import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/client';

declare global {
    namespace Express {
        interface Request {
            merchantAccount?: any;
        }
    }
}

export const verifyMerchantKey = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const apiKeyString = req.headers['x-api-key'] as string;

    if (!apiKeyString) {
        return res.status(401).json({ message: 'Missing API Key' });
    }

    const keyRecord = await prisma.apiKey.findUnique({
        where: {
            key: apiKeyString,
        },
        include: {
            account: true,
        },
    });

    if (!keyRecord || !keyRecord.account) {
        return res.status(401).json({ message: 'Invalid API Key' });
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        return res.status(401).json({ message: 'API Key has expired' });
    }

    req.merchantAccount = keyRecord.account;

    next();
};
