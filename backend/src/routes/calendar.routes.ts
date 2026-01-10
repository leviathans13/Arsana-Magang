import { Router } from 'express';
import {
  getCalendarEvents,
  getUpcomingEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '../controllers/calendar.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  listCalendarEventsQuerySchema,
  upcomingEventsQuerySchema,
} from '../validators/calendar.validator';
import { idParamSchema } from '../validators/incomingLetter.validator';

const router = Router();

// All calendar routes require authentication
router.use(authMiddleware);

// Get all events
router.get('/events', validate(listCalendarEventsQuerySchema, 'query'), getCalendarEvents);

// Get upcoming events
router.get('/upcoming', validate(upcomingEventsQuerySchema, 'query'), getUpcomingEvents);

// Get single event
router.get('/events/:id', validate(idParamSchema, 'params'), getCalendarEventById);

// Create event
router.post('/events', validate(createCalendarEventSchema), createCalendarEvent);

// Update event
router.put(
  '/events/:id',
  validate(idParamSchema, 'params'),
  validate(updateCalendarEventSchema),
  updateCalendarEvent
);

// Delete event
router.delete('/events/:id', validate(idParamSchema, 'params'), deleteCalendarEvent);

export default router;
