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

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get all notifications
 *     description: Retrieve all notifications for authenticated user or global notifications. Supports filtering and pagination.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications with unread count
 */
router.get('/', validate(listNotificationsQuerySchema, 'query'), getNotifications);

/**
 * @openapi
 * /api/notifications/read-all:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     description: Mark all user's notifications as read
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put('/read-all', authMiddleware, markAllAsRead);

/**
 * @openapi
 * /api/notifications/read:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete all read notifications
 *     description: Delete all read notifications for authenticated user
 *     responses:
 *       200:
 *         description: Read notifications deleted
 */
router.delete('/read', authMiddleware, deleteAllRead);

/**
 * @openapi
 * /api/notifications/{id}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notification by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification details
 *       404:
 *         description: Notification not found
 */
router.get('/:id', validate(notificationIdParamSchema, 'params'), getNotificationById);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put('/:id/read', validate(notificationIdParamSchema, 'params'), markAsRead);

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete notification
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', validate(notificationIdParamSchema, 'params'), deleteNotification);

export default router;
