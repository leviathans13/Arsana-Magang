import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import incomingLetterRoutes from './incomingLetter.routes';
import outgoingLetterRoutes from './outgoingLetter.routes';
import calendarRoutes from './calendar.routes';
import notificationRoutes from './notification.routes';
import fileRoutes from './file.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/incoming-letters', incomingLetterRoutes);
router.use('/outgoing-letters', outgoingLetterRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/files', fileRoutes);

export default router;
