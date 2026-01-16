-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "webhookUrl" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "webhookUrl" TEXT NOT NULL DEFAULT 'https://default-webhook.example.com';
