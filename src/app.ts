import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

export default app;
