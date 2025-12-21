import 'dotenv/config';
import express, { Request, Response } from 'express';
import transferRoutes from './routes/transfer.routes.js';
import accountRoutes from './routes/account.routes.js';

const app = express();

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});
app.use('/transfer', transferRoutes);
app.use('/accounts', accountRoutes);

export default app;
