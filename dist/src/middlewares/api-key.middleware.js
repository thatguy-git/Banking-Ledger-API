"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = void 0;
const api_key_service_js_1 = require("../services/api-key.service.js");
const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    // 👇 ADD THIS DEBUG LOG
    console.log(`🔑 Incoming Key: '${apiKey}'`);
    const account = await api_key_service_js_1.ApiKeyService.validateApiKey(apiKey);
    // 👇 ADD THIS DEBUG LOG
    console.log(`🕵️ Lookup Result:`, account);
    if (!account) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
    }
    // ...
    req.apiKeyAccount = {
        accountId: account.accountId,
        name: account.name,
    };
    next();
};
exports.authenticateApiKey = authenticateApiKey;
