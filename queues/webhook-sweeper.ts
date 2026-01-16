import cron from 'node-cron';
import { webhookQueue } from './webhook.queue.js';
import { prisma } from '../src/database/client.js';

cron.schedule('*/1 * * * *', async () => {
    console.log('Sweeping for pending webhooks...');

    try {
        const pendingWebhooks = await prisma.webhookEvent.findMany({
            where: { status: 'PENDING' },
        });

        console.log(`Found ${pendingWebhooks.length} pending webhooks`);

        for (const webhook of pendingWebhooks) {
            await webhookQueue.add('webhook-delivery', {
                eventId: webhook.id,
                endpoint: webhook.endpoint,
                payload: webhook.payload,
                secret: process.env.WEBHOOK_SECRET || 'default-webhook-secret',
            });

            await prisma.webhookEvent.update({
                where: { id: webhook.id },
                data: { status: 'PROCESSING' },
            });

            console.log(`Queued webhook ${webhook.id} for delivery`);
        }
    } catch (error) {
        console.error('Error in webhook sweeper:', error);
    }
});

console.log('Webhook sweeper cron job scheduled to run every minute');
