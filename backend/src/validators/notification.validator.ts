import { z } from 'zod';

// Query params for listing notifications
export const listNotificationsQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  unreadOnly: z.string().transform((val) => val === 'true').optional(),
});

// ID param schema
export const notificationIdParamSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

// Types
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
