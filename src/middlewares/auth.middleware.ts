import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export interface AuthRequest extends Request {
    user?: any;
}

interface UserPayload extends JwtPayload {
    id: string;
    accountNumber?: string;
}

export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        accountNumber?: string;
    };
}

export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res
            .status(401)
            .json({ error: 'Access Denied: No Token Provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        req.user = { id: decoded.id, accountNumber: decoded.accountNumber };
        next();
    } catch (error) {
        res.status(403).json({ error: 'Invalid or Expired Token' });
    }
};
