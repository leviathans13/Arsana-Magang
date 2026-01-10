import { Router } from 'express';
import {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from '../controllers/notification.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { listNotificationsQuerySchema, notificationIdParamSchema } from '../validators/notification.validator';

const router = Router();

// All notification routes use optional auth (for global notifications)
router.use(optionalAuthMiddleware);

// Get all notifications
router.get('/', validate(listNotificationsQuerySchema, 'query'), getNotifications);

// Mark all as read
router.put('/read-all', authMiddleware, markAllAsRead);

// Delete all read notifications
router.delete('/read', authMiddleware, deleteAllRead);

// Get single notification
router.get('/:id', validate(notificationIdParamSchema, 'params'), getNotificationById);

// Mark notification as read
router.put('/:id/read', validate(notificationIdParamSchema, 'params'), markAsRead);

// Delete notification
router.delete('/:id', validate(notificationIdParamSchema, 'params'), deleteNotification);

export default router;
