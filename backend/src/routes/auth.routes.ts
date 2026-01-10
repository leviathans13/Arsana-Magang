import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { loginRateLimiter } from '../middlewares/rateLimit.middleware';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

export default router;
