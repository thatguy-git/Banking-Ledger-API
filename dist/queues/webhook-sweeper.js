"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const webhook_queue_js_1 = require("./webhook.queue.js");
const client_js_1 = require("../src/database/client.js");
const BATCH_SIZE = 50;
node_cron_1.default.schedule('* * * * *', async () => {
    try {
        const pendingWebhooks = await client_js_1.prisma.webhookEvent.findMany({
            where: { status: 'PENDING' },
            take: BATCH_SIZE,
            orderBy: { createdAt: 'asc' },
        });
        if (pendingWebhooks.length === 0)
            return;
        await Promise.all(pendingWebhooks.map((webhook) => webhook_queue_js_1.webhookQueue.add('webhook-delivery', {
            eventId: webhook.id,
            endpoint: webhook.endpoint,
            payload: webhook.payload,
            secret: process.env.WEBHOOK_SECRET || 'default-webhook-secret',
        })));
        await client_js_1.prisma.webhookEvent.updateMany({
            where: {
                id: { in: pendingWebhooks.map((w) => w.id) },
            },
            data: { status: 'PROCESSING' },
        });
    }
    catch (error) {
        console.error('Webhook sweeper error:', error);
    }
});
