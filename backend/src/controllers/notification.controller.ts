import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, NotFoundError } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta } from '../utils/helpers';
import { ListNotificationsQuery } from '../validators/notification.validator';
import { Prisma } from '@prisma/client';

// Get all notifications with pagination
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListNotificationsQuery;
  const { skip, take, page, limit } = getPagination({
    page: query.page,
    limit: query.limit,
  });

  // Build where clause
  const where: Prisma.NotificationWhereInput = {};

  // Filter by user if authenticated
  if (req.user) {
    where.OR = [
      { userId: req.user.id },
      { userId: null }, // Global notifications
    ];
  }

  // Unread only filter
  if (query.unreadOnly) {
    where.isRead = false;
  }

  // Get notifications and counts
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        calendarEvent: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      pagination: createPaginationMeta(page, limit, total),
      unreadCount,
    },
  });
});

// Get single notification by ID
export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
    include: {
      calendarEvent: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  res.json({
    success: true,
    data: notification,
  });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
    include: {
      calendarEvent: {
        select: {
          id: true,
          title: true,
          date: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: updated,
    message: 'Notification marked as read',
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.NotificationWhereInput = {
    isRead: false,
  };

  // Filter by user if authenticated
  if (req.user) {
    where.OR = [
      { userId: req.user.id },
      { userId: null },
    ];
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: `${result.count} notifications marked as read`,
  });
});

// Delete notification
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({
    where: { id },
  });

  if (!notification) {
    throw new NotFoundError('Notification');
  }

  await prisma.notification.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

// Delete all read notifications
export const deleteAllRead = asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.NotificationWhereInput = {
    isRead: true,
  };

  // Filter by user if authenticated
  if (req.user) {
    where.OR = [
      { userId: req.user.id },
      { userId: null },
    ];
  }

  const result = await prisma.notification.deleteMany({
    where,
  });

  res.json({
    success: true,
    message: `${result.count} notifications deleted`,
  });
});
