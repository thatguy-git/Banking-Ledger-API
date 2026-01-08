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
        const { name, email, currency, password, pin, question, answer } = data;

        if (
            !name ||
            !email ||
            !currency ||
            !password ||
            !pin ||
            !question ||
            !answer
        ) {
            throw new Error('All fields are required for signup');
        }

        const existingUser = await prisma.account.findFirst({
            where: {
                OR: [{ email: email }],
            },
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error('Email already in use');
            }
            throw new Error('User already exists');
        }

        let accountNumber = generateAccountNumber();
        let isUnique = false;
        while (!isUnique) {
            const existingAcc = await prisma.account.findUnique({
                where: { accountNumber },
            });
            if (!existingAcc) {
                isUnique = true;
            } else {
                accountNumber = generateAccountNumber();
            }
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const transactionPin = await bcrypt.hash(pin, 10);
        const answerHash = await bcrypt.hash(answer.trim().toLowerCase(), 10);

        console.log(`Creating account for ${email}...`);

        try {
            return await prisma.account.create({
                data: {
                    name,
                    email,
                    currency,
                    passwordHash,
                    transactionPin,
                    securityQuestion: question,
                    securityAnswerHash: answerHash,
                    balance: 0n,
                    accountNumber,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                const target = error.meta?.target?.[0] || 'field';
                throw new Error(`${target} already taken (Race Condition)`);
            }
            throw error;
        }
    }

    static async login(email: string, password: string) {
        const user = await prisma.account.findUnique({ where: { email } });
        if (!user) throw new Error('Invalid credentials');

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { id: user.id, accountNumber: user.accountNumber },
            JWT_SECRET,
            { expiresIn: '1hr' }
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
