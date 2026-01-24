"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const client_js_1 = require("../database/client.js");
const crypto_1 = __importDefault(require("crypto"));
class ApiKeyService {
    static async generateApiKey(accountId, name) {
        const key = `bnk_${crypto_1.default.randomBytes(16).toString('hex')}`;
        await client_js_1.prisma.apiKey.create({
            data: {
                key,
                accountId,
                name,
            },
        });
        return key;
    }
    static async validateApiKey(key) {
        const apiKey = await client_js_1.prisma.apiKey.findUnique({
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
    static async getApiKeysForAccount(accountId) {
        return await client_js_1.prisma.apiKey.findMany({
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
    static async revokeApiKey(keyId, accountId) {
        return await client_js_1.prisma.apiKey.deleteMany({
            where: {
                id: keyId,
                accountId,
            },
        });
    }
}
exports.ApiKeyService = ApiKeyService;
