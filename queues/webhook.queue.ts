import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../src/database/client.js';

const connection = new IORedis(
    process.env.REDIS_URL || 'redis://localhost:6379'
);

export const webhookQueue = new Queue('webhook-delivery', {
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

const worker = new Worker(
    'webhook-delivery',
    async (job) => {
        const { eventId, endpoint, payload, secret } = job.data;

        try {
            console.log(`Processing Webhook: ${eventId}`);
            const signature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-signature': signature,
                },
                timeout: 5000,
            });

            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: { status: 'COMPLETED', lastError: null },
            });

            console.log(`Webhook Delivered: ${eventId}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;

            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: {
                    lastError: errorMessage,
                    attempts: { increment: 1 },
                },
            });

            console.error(`Webhook Failed (${eventId}):`, errorMessage);
            throw error; // Triggers BullMQ retry
        }
    },
    { connection }
);

worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 5) {
        console.error(`Job ${job.id} moved to DLQ (Max Retries)`);

        await prisma.webhookEvent.update({
            where: { id: job.data.eventId },
            data: { status: 'FAILED' },
        });

        // TODO: Send Alert to Slack/Email here
    }
});
