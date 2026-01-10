import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, NotFoundError } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta, parseDate } from '../utils/helpers';
import { CreateCalendarEventInput, UpdateCalendarEventInput, ListCalendarEventsQuery, UpcomingEventsQuery } from '../validators/calendar.validator';
import { Prisma } from '@prisma/client';

// Get all calendar events with filters
export const getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListCalendarEventsQuery;
  const { skip, take, page, limit } = getPagination({
    page: query.page,
    limit: query.limit,
  });

  // Build where clause
  const where: Prisma.CalendarEventWhereInput = {};

  // Date range filter
  if (query.start || query.end) {
    where.date = {};
    if (query.start) {
      where.date.gte = parseDate(query.start);
    }
    if (query.end) {
      where.date.lte = parseDate(query.end);
    }
  }

  // Type filter
  if (query.type) {
    where.type = query.type;
  }

  // Get events and count
  const [events, total] = await Promise.all([
    prisma.calendarEvent.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        incomingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
          },
        },
        outgoingLetter: {
          select: {
            id: true,
            letterNumber: true,
            subject: true,
          },
        },
      },
    }),
    prisma.calendarEvent.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      events,
      pagination: createPaginationMeta(page, limit, total),
    },
  });
});

// Get upcoming events
export const getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as UpcomingEventsQuery;
  const limit = query.limit || 10;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.calendarEvent.findMany({
    where: {
      date: {
        gte: today,
      },
    },
    take: limit,
    orderBy: { date: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      incomingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
      outgoingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: events,
  });
});

// Get single calendar event by ID
export const getCalendarEventById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      incomingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
      outgoingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
    },
  });

  if (!event) {
    throw new NotFoundError('Calendar event');
  }

  res.json({
    success: true,
    data: event,
  });
});

// Create new calendar event
export const createCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const data = req.body as CreateCalendarEventInput;

  const eventData: Prisma.CalendarEventCreateInput = {
    title: data.title,
    description: data.description,
    date: parseDate(data.date),
    time: data.time,
    location: data.location,
    type: data.type,
    user: {
      connect: { id: req.user.id },
    },
    ...(data.incomingLetterId && {
      incomingLetter: { connect: { id: data.incomingLetterId } },
    }),
    ...(data.outgoingLetterId && {
      outgoingLetter: { connect: { id: data.outgoingLetterId } },
    }),
  };

  const event = await prisma.calendarEvent.create({
    data: eventData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      incomingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
      outgoingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    data: event,
    message: 'Calendar event created successfully',
  });
});

// Update calendar event
export const updateCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateCalendarEventInput;

  // Check if event exists
  const existingEvent = await prisma.calendarEvent.findUnique({
    where: { id },
  });

  if (!existingEvent) {
    throw new NotFoundError('Calendar event');
  }

  const updateData: Prisma.CalendarEventUpdateInput = {
    ...(data.title && { title: data.title }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.date && { date: parseDate(data.date) }),
    ...(data.time !== undefined && { time: data.time }),
    ...(data.location !== undefined && { location: data.location }),
    ...(data.type && { type: data.type }),
  };

  // Handle letter connections
  if (data.incomingLetterId !== undefined) {
    if (data.incomingLetterId === null) {
      updateData.incomingLetter = { disconnect: true };
    } else {
      updateData.incomingLetter = { connect: { id: data.incomingLetterId } };
    }
  }

  if (data.outgoingLetterId !== undefined) {
    if (data.outgoingLetterId === null) {
      updateData.outgoingLetter = { disconnect: true };
    } else {
      updateData.outgoingLetter = { connect: { id: data.outgoingLetterId } };
    }
  }

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      incomingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
      outgoingLetter: {
        select: {
          id: true,
          letterNumber: true,
          subject: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: event,
    message: 'Calendar event updated successfully',
  });
});

// Delete calendar event
export const deleteCalendarEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if event exists
  const event = await prisma.calendarEvent.findUnique({
    where: { id },
  });

  if (!event) {
    throw new NotFoundError('Calendar event');
  }

  // Delete associated notifications
  await prisma.notification.deleteMany({
    where: { calendarEventId: id },
  });

  // Delete the event
  await prisma.calendarEvent.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Calendar event deleted successfully',
  });
});
