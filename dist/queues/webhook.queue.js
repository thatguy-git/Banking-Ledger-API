"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookQueue = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const client_js_1 = require("../src/database/client.js");
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
exports.webhookQueue = new bullmq_1.Queue('webhook-delivery', {
    connection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});
const worker = new bullmq_1.Worker('webhook-delivery', async (job) => {
    const { eventId, endpoint, payload, secret } = job.data;
    try {
        console.log(`Processing Webhook: ${eventId}`);
        const signature = crypto_1.default
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        await axios_1.default.post(endpoint, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature,
            },
            timeout: 5000,
        });
        await client_js_1.prisma.webhookEvent.update({
            where: { id: eventId },
            data: { status: 'COMPLETED', lastError: null },
        });
        console.log(`Webhook Delivered: ${eventId}`);
    }
    catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        await client_js_1.prisma.webhookEvent.update({
            where: { id: eventId },
            data: {
                lastError: errorMessage,
                attempts: { increment: 1 },
            },
        });
        console.error(`Webhook Failed (${eventId}):`, errorMessage);
        throw error; // Triggers BullMQ retry
    }
}, { connection });
worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 5) {
        console.error(`Job ${job.id} moved to DLQ (Max Retries)`);
        await client_js_1.prisma.webhookEvent.update({
            where: { id: job.data.eventId },
            data: { status: 'FAILED' },
        });
        // TODO: Send Alert to Slack/Email here
    }
});
