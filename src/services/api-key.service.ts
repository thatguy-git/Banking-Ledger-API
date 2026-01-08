import { prisma } from '../database/client.js';
import crypto from 'crypto';

export class ApiKeyService {
    static async generateApiKey(
        accountId: string,
        name?: string
    ): Promise<string> {
        const key = `sk_live_${crypto.randomBytes(16).toString('hex')}`;

        await prisma.apiKey.create({
            data: {
                key,
                accountId,
                name,
            },
        });

        return key;
    }

    static async validateApiKey(
        key: string
    ): Promise<{ accountId: string; name?: string } | null> {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key },
            include: { account: true },
        });

        if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt < new Date())) {
            return null;
        }

        return {
            accountId: apiKey.accountId,
            name: apiKey.name ?? undefined,
        };
    }

    static async getApiKeysForAccount(accountId: string) {
        return await prisma.apiKey.findMany({
            where: { accountId },
            select: {
                id: true,
                key: true,
                name: true,
                createdAt: true,
                expiresAt: true,
            },
        });
    }

    static async revokeApiKey(keyId: string, accountId: string) {
        return await prisma.apiKey.deleteMany({
            where: {
                id: keyId,
                accountId,
            },
        });
    }
}
