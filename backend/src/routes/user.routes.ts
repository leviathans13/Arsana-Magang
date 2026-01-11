import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/auth.controller';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateUserSchema } from '../validators/auth.validator';
import { idParamSchema } from '../validators/incomingLetter.validator';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

// Get all users
router.get('/', getUsers);

// Get user by ID
router.get('/:id', validate(idParamSchema, 'params'), getUserById);

// Update user (admin only)
router.put('/:id', adminMiddleware, validate(idParamSchema, 'params'), validate(updateUserSchema), updateUser);

// Delete user (admin only)
router.delete('/:id', adminMiddleware, validate(idParamSchema, 'params'), deleteUser);

export default router;
