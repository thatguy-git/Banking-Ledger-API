import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../src/database/client.js';

const connection = new IORedis(
    process.env.REDIS_URL || 'redis://localhost:6379'
);

// 1. Define the Queue
export const webhookQueue = new Queue('webhook-delivery', {
    connection,
    defaultJobOptions: {
        attempts: 5, // Retry 5 times
        backoff: {
            type: 'exponential',
            delay: 1000, // 1s, 2s, 4s, 8s, 16s
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for manual inspection (DLQ)
    },
});

// 2. Define the Worker (The "Network I/O" Handler)
const worker = new Worker(
    'webhook-delivery',
    async (job) => {
        const { eventId, endpoint, payload, secret } = job.data;

        try {
            console.log(`🚀 Processing Webhook: ${eventId}`);

            // A. Generate HMAC Signature
            const signature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            // B. Send Request
            await axios.post(endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-signature': signature, // The secure header
                },
                timeout: 5000, // Fail fast if receiver hangs
            });

            // C. Update DB to COMPLETED
            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: { status: 'COMPLETED', lastError: null },
            });

            console.log(`✅ Webhook Delivered: ${eventId}`);
        } catch (error: any) {
            // D. Log Failure in DB (but throw error so BullMQ retries)
            const errorMessage = error.response?.data?.message || error.message;

            await prisma.webhookEvent.update({
                where: { id: eventId },
                data: {
                    lastError: errorMessage,
                    attempts: { increment: 1 },
                },
            });

            console.error(`❌ Webhook Failed (${eventId}):`, errorMessage);
            throw error; // Triggers BullMQ retry
        }
    },
    { connection }
);

// 3. Listen for "Dead Letter" events (Max attempts reached)
worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 5) {
        console.error(`💀 Job ${job.id} moved to DLQ (Max Retries)`);

        // Final DB update
        await prisma.webhookEvent.update({
            where: { id: job.data.eventId },
            data: { status: 'FAILED' },
        });

        // TODO: Send Alert to Slack/Email here
    }
});
