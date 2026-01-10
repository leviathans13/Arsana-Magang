import { z } from 'zod';

// Event type enum
const eventTypeEnum = z.enum(['MEETING', 'APPOINTMENT', 'DEADLINE', 'OTHER']);

// Create calendar event schema
export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  location: z.string().optional(),
  type: eventTypeEnum.optional().default('OTHER'),
  incomingLetterId: z.string().uuid().optional(),
  outgoingLetterId: z.string().uuid().optional(),
});

// Update calendar event schema
export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  type: eventTypeEnum.optional(),
  incomingLetterId: z.string().uuid().optional().nullable(),
  outgoingLetterId: z.string().uuid().optional().nullable(),
});

// Query params for listing events
export const listCalendarEventsQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  type: eventTypeEnum.optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

// Query params for upcoming events
export const upcomingEventsQuerySchema = z.object({
  limit: z.string().transform(Number).optional(),
});

// Types
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
export type ListCalendarEventsQuery = z.infer<typeof listCalendarEventsQuerySchema>;
export type UpcomingEventsQuery = z.infer<typeof upcomingEventsQuerySchema>;
