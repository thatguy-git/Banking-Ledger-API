"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_js_1 = require("../services/auth.service.js");
class AuthController {
    static async signup(req, res) {
        try {
            const { email, password } = req.body;
            const user = await auth_service_js_1.AuthService.signup(req.body);
            res.status(201).json({
                success: true,
                data: { id: user.id, email: user.email, name: user.name },
            });
        }
        catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Email already in use' });
            }
            res.status(400).json({ error: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: 'Email and password are required' });
            }
            const result = await auth_service_js_1.AuthService.login(email, password);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message,
            });
        }
    }
}
exports.AuthController = AuthController;
