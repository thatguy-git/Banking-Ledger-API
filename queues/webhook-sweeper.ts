import cron from 'node-cron';
import { webhookQueue } from './webhook.queue.js';
import { prisma } from '../src/database/client.js';

const BATCH_SIZE = 50;

cron.schedule('* * * * *', async () => {
    try {
        const pendingWebhooks = await prisma.webhookEvent.findMany({
            where: { status: 'PENDING' },
            take: BATCH_SIZE,
            orderBy: { createdAt: 'asc' },
        });

        if (pendingWebhooks.length === 0) return;

        await Promise.all(
            pendingWebhooks.map((webhook) =>
                webhookQueue.add('webhook-delivery', {
                    eventId: webhook.id,
                    endpoint: webhook.endpoint,
                    payload: webhook.payload,
                    secret:
                        process.env.WEBHOOK_SECRET || 'default-webhook-secret',
                }),
            ),
        );

        await prisma.webhookEvent.updateMany({
            where: {
                id: { in: pendingWebhooks.map((w) => w.id) },
            },
            data: { status: 'PROCESSING' },
        });
    } catch (error) {
        console.error('Webhook sweeper error:', error);
    }
});
