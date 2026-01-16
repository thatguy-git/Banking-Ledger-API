import './utils/bigint-serializer.js';
import app from './app.js';
import dotenv from 'dotenv';
import '../queues/webhook-sweeper.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
