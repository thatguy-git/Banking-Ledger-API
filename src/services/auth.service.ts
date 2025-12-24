import { prisma } from '../database/client.js';
import { generateAccountNumber } from '../utils/account.generator.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface SignupInput {
    name: string;
    email: string;
    currency: string;
    password: string;
    pin: string;
    question: string;
    answer: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super';

export class AuthService {
    static async signup(data: SignupInput) {
        let accountNumber = generateAccountNumber();
        let isUnique = false;
        while (!isUnique) {
            const existing = await prisma.account.findUnique({
                where: { accountNumber },
            });
            if (!existing) {
                isUnique = true;
            } else {
                accountNumber = generateAccountNumber(); // Try again
            }
        }
        const { name, email, currency, password, pin, question, answer } = data;
        const passwordHash = await bcrypt.hash(password, 10);
        const pinHash = await bcrypt.hash(pin, 10);
        const answerHash = await bcrypt.hash(answer.trim().toLowerCase(), 10);

        return await prisma.account.create({
            data: {
                name,
                email,
                currency,
                passwordHash,
                pinHash,
                securityQuestion: question,
                securityAnswerHash: answerHash,
                balance: 0n,
                accountNumber,
            },
        });
    }

    static async login(email: string, password: string) {
        const user = await prisma.account.findUnique({ where: { email } });
        if (!user) throw new Error('Invalid credentials');

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { Id: user.id, accountNumber: user.accountNumber },
            JWT_SECRET,
            { expiresIn: '2m' }
        );

        return {
            token,
            user: {
                name: user.name,
                email: user.email,
                accountNumber: user.accountNumber,
                balance: user.balance.toString(),
                currency: user.currency,
            },
        };
    }
}
