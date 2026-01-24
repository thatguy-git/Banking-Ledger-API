import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { SignupSchema, LoginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validateRequest(SignupSchema), AuthController.signup);
router.post('/login', validateRequest(LoginSchema), AuthController.login);

export default router;
