import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
    static async signup(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const user = await AuthService.signup(req.body);
            res.status(201).json({
                success: true,
                data: { id: user.id, email: user.email, name: user.name },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Email already in use' });
            }
            res.status(400).json({ error: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: 'Email and password are required' });
            }
            const result = await AuthService.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message,
            });
        }
    }
}
