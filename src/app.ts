import 'dotenv/config';
import express, { Request, Response } from 'express';
import transferRoutes from './routes/transfer.routes.js';
import accountRoutes from './routes/account.routes.js';
import authRoutes from './routes/auth.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to the Banking Ledger API',
        version: '1.0.0',
        docs: 'See README.md for API documentation',
    });
});

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});
app.use('/transfer', transferRoutes);
app.use('/accounts', accountRoutes);
app.use('/auth', authRoutes);
app.use('/invoices', invoiceRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;
