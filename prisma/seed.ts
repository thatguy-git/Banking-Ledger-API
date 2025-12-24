import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = process.env.BANK_EMAIL;
    const password = process.env.BANK_PASSWORD;
    const pin = process.env.BANK_PIN;
    const balance = process.env.BANK_INITIAL_BALANCE;

    if (!email || !password || !pin || !balance) {
        throw new Error('Missing BANK_ variables in .env file');
    }

    console.log(`Seeding Central Bank: ${email}...`);

    const passwordHash = await bcrypt.hash(password, 10);
    const pinHash = await bcrypt.hash(pin, 10);
    const answerHash = await bcrypt.hash('thatguy', 10);

    const treasury = await prisma.account.upsert({
        where: { email: email },
        update: {},
        create: {
            name: process.env.BANK_NAME || 'Central Treasury',
            email: email,
            accountNumber: '0000000000',
            currency: process.env.BANK_CURRENCY || 'USD',
            balance: BigInt(balance),
            allowOverdraft: true,
            passwordHash,
            pinHash,
            securityQuestion: 'Who created this?',
            securityAnswerHash: answerHash,
        },
    });

    console.log(`Central Bank Ready: ${treasury.id}`);
    console.log(`Balance: ${treasury.balance} cents`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
