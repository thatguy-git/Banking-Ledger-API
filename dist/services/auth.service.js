"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const client_js_1 = require("../database/client.js");
const account_generator_js_1 = require("../utils/account.generator.js");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super';
class AuthService {
    static async signup(data) {
        let accountNumber = (0, account_generator_js_1.generateAccountNumber)();
        let isUnique = false;
        while (!isUnique) {
            const existing = await client_js_1.prisma.account.findUnique({
                where: { accountNumber },
            });
            if (!existing) {
                isUnique = true;
            }
            else {
                accountNumber = (0, account_generator_js_1.generateAccountNumber)(); // Try again
            }
        }
        const { name, email, currency, password, pin, question, answer } = data;
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const pinHash = await bcryptjs_1.default.hash(pin, 10);
        const answerHash = await bcryptjs_1.default.hash(answer.trim().toLowerCase(), 10);
        return await client_js_1.prisma.account.create({
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
    static async login(email, password) {
        const user = await client_js_1.prisma.account.findUnique({ where: { email } });
        if (!user)
            throw new Error('Invalid credentials');
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid)
            throw new Error('Invalid credentials');
        const token = jsonwebtoken_1.default.sign({ id: user.id, accountNumber: user.accountNumber }, JWT_SECRET, { expiresIn: '1hr' });
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
exports.AuthService = AuthService;
