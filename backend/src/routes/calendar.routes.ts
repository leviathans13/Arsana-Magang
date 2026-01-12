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

/**
 * @openapi
 * /api/calendar/events:
 *   get:
 *     tags:
 *       - Agenda & Calendar
 *     summary: Get all calendar events
 *     description: Retrieve all calendar events including invitations and follow-up deadlines
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of calendar events
 */
router.get('/events', validate(listCalendarEventsQuerySchema, 'query'), getCalendarEvents);

/**
 * @openapi
 * /api/calendar/upcoming:
 *   get:
 *     tags:
 *       - Agenda & Calendar
 *     summary: Get upcoming events
 *     description: Get events within specified days ahead (with H-7, H-3, H-1 notifications)
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Upcoming events list
 */
router.get('/upcoming', validate(upcomingEventsQuerySchema, 'query'), getUpcomingEvents);

/**
 * @openapi
 * /api/calendar/events/{id}:
 *   get:
 *     tags:
 *       - Agenda & Calendar
 *     summary: Get event by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/events/:id', validate(idParamSchema, 'params'), getCalendarEventById);

/**
 * @openapi
 * /api/calendar/events:
 *   post:
 *     tags:
 *       - Agenda & Calendar
 *     summary: Create calendar event
 *     description: Manually create a calendar event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [MEETING, APPOINTMENT, DEADLINE, OTHER]
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/events', validate(createCalendarEventSchema), createCalendarEvent);

/**
 * @openapi
 * /api/calendar/events/{id}:
 *   put:
 *     tags:
 *       - Agenda & Calendar
 *     summary: Update calendar event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put(
  '/events/:id',
  validate(idParamSchema, 'params'),
  validate(updateCalendarEventSchema),
  updateCalendarEvent
);

/**
 * @openapi
 * /api/calendar/events/{id}:
 *   delete:
 *     tags:
 *       - Agenda & Calendar
 *     summary: Delete calendar event
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete('/events/:id', validate(idParamSchema, 'params'), deleteCalendarEvent);

export default router;
