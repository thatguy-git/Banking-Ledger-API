import { Router } from 'express';
import { AccountController } from '../controllers/account.controller.js';

const router = Router();

// POST /accounts -> Create new account
router.post('/', AccountController.create);

// GET /accounts/:id -> Get balance
router.get('/:id', AccountController.get);

export default router;
