import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta, createSearchFilter, parseDate } from '../utils/helpers';
import { CreateIncomingLetterInput, UpdateIncomingLetterInput, ListIncomingLettersQuery } from '../validators/incomingLetter.validator';
import { Prisma } from '@prisma/client';
import { createEventNotifications, deleteEventNotifications, updateEventNotifications } from '../services/notificationService';

// User select for including in responses
const userSelect = {
  id: true,
  name: true,
  email: true,
};

// Get all incoming letters with pagination and filters
export const getIncomingLetters = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListIncomingLettersQuery;
  const { skip, take, page, limit } = getPagination({
    page: query.page,
    limit: query.limit,
  });

  // Build where clause
  const where: Prisma.IncomingLetterWhereInput = {};

  // Search filter
  if (query.search) {
    const searchFilter = createSearchFilter(query.search, [
      'letterNumber',
      'subject',
      'sender',
      'recipient',
      'processor',
    ]);
    if (searchFilter) {
      Object.assign(where, searchFilter);
    }
  }

  // Nature filter
  if (query.nature) {
    where.letterNature = query.nature;
  }

  // Processing method filter
  if (query.processingMethod) {
    where.processingMethod = query.processingMethod;
  }

  // Disposition target filter
  if (query.dispositionTarget) {
    where.dispositionTarget = query.dispositionTarget;
  }

  // Needs follow-up filter
  if (query.needsFollowUp !== undefined) {
    where.needsFollowUp = query.needsFollowUp;
  }

  // Is invitation filter
  if (query.isInvitation !== undefined) {
    where.isInvitation = query.isInvitation;
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    where.receivedDate = {};
    if (query.startDate) {
      where.receivedDate.gte = parseDate(query.startDate);
    }
    if (query.endDate) {
      where.receivedDate.lte = parseDate(query.endDate);
    }
  }

  // Build orderBy
  const orderBy: Prisma.IncomingLetterOrderByWithRelationInput = {};
  if (query.sortBy) {
    orderBy[query.sortBy as keyof Prisma.IncomingLetterOrderByWithRelationInput] =
      query.sortOrder || 'desc';
  } else {
    orderBy.receivedDate = 'desc';
  }

  // Get letters and count
  const [letters, total] = await Promise.all([
    prisma.incomingLetter.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        user: {
          select: userSelect,
        },
      },
    }),
    prisma.incomingLetter.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      letters,
      pagination: createPaginationMeta(page, limit, total),
    },
  });
});

// Get single incoming letter by ID
export const getIncomingLetterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const letter = await prisma.incomingLetter.findUnique({
    where: { id },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  if (!letter) {
    throw new NotFoundError('Incoming letter');
  }

  res.json({
    success: true,
    data: letter,
  });
});

// Create new incoming letter
export const createIncomingLetter = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const data = req.body as CreateIncomingLetterInput;
  const file = req.file;

  // Check for duplicate letter number
  const existing = await prisma.incomingLetter.findUnique({
    where: { letterNumber: data.letterNumber },
  });

  if (existing) {
    throw new ConflictError('Letter number already exists', 'letterNumber');
  }

  // Parse dates
  const letterData: Prisma.IncomingLetterCreateInput = {
    letterNumber: data.letterNumber,
    letterDate: data.letterDate ? parseDate(data.letterDate) : null,
    letterNature: data.letterNature,
    subject: data.subject,
    sender: data.sender,
    recipient: data.recipient,
    processor: data.processor,
    note: data.note,
    receivedDate: parseDate(data.receivedDate),
    isInvitation: data.isInvitation,
    eventDate: data.eventDate ? parseDate(data.eventDate) : null,
    eventTime: data.eventTime,
    eventLocation: data.eventLocation,
    eventNotes: data.eventNotes,
    needsFollowUp: data.needsFollowUp,
    followUpDeadline: data.followUpDeadline ? parseDate(data.followUpDeadline) : null,
    processingMethod: data.processingMethod,
    dispositionTarget: data.dispositionTarget,
    srikandiDispositionNumber: data.srikandiDispositionNumber,
    fileName: file?.originalname,
    filePath: file?.path ? file.path.replace(/\\/g, '/').replace(/^uploads\//, '') : undefined,
    user: {
      connect: { id: req.user.id },
    },
  };

  const letter = await prisma.incomingLetter.create({
    data: letterData,
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  // Create calendar event if invitation
  if (data.isInvitation && data.eventDate) {
    const calendarEvent = await prisma.calendarEvent.create({
      data: {
        title: `[Undangan] ${data.subject}`,
        description: data.eventNotes,
        date: parseDate(data.eventDate),
        time: data.eventTime,
        location: data.eventLocation,
        type: 'MEETING',
        userId: req.user.id,
        incomingLetterId: letter.id,
      },
    });

    // Create notifications for H-7, H-3, H-1
    await createEventNotifications(
      calendarEvent.id,
      req.user.id,
      calendarEvent.title,
      calendarEvent.date
    );
  }

  // Create notification for new letter
  await prisma.notification.create({
    data: {
      title: 'Surat Masuk Baru',
      message: `Surat masuk baru: ${data.letterNumber} - ${data.subject}`,
      type: 'INFO',
    },
  });

  res.status(201).json({
    success: true,
    data: letter,
    message: 'Incoming letter created successfully',
  });
});

// Update incoming letter
export const updateIncomingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateIncomingLetterInput;
  const file = req.file;

  // Check if letter exists
  const existingLetter = await prisma.incomingLetter.findUnique({
    where: { id },
  });

  if (!existingLetter) {
    throw new NotFoundError('Incoming letter');
  }

  // Check for duplicate letter number (if changing)
  if (data.letterNumber && data.letterNumber !== existingLetter.letterNumber) {
    const duplicate = await prisma.incomingLetter.findUnique({
      where: { letterNumber: data.letterNumber },
    });

    if (duplicate) {
      throw new ConflictError('Letter number already exists', 'letterNumber');
    }
  }

  // Build update data
  const updateData: Prisma.IncomingLetterUpdateInput = {
    ...(data.letterNumber && { letterNumber: data.letterNumber }),
    ...(data.letterDate !== undefined && { letterDate: data.letterDate ? parseDate(data.letterDate) : null }),
    ...(data.letterNature && { letterNature: data.letterNature }),
    ...(data.subject && { subject: data.subject }),
    ...(data.sender && { sender: data.sender }),
    ...(data.recipient && { recipient: data.recipient }),
    ...(data.processor && { processor: data.processor }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.receivedDate && { receivedDate: parseDate(data.receivedDate) }),
    ...(data.isInvitation !== undefined && { isInvitation: data.isInvitation }),
    ...(data.eventDate !== undefined && { eventDate: data.eventDate ? parseDate(data.eventDate) : null }),
    ...(data.eventTime !== undefined && { eventTime: data.eventTime }),
    ...(data.eventLocation !== undefined && { eventLocation: data.eventLocation }),
    ...(data.eventNotes !== undefined && { eventNotes: data.eventNotes }),
    ...(data.needsFollowUp !== undefined && { needsFollowUp: data.needsFollowUp }),
    ...(data.followUpDeadline !== undefined && { followUpDeadline: data.followUpDeadline ? parseDate(data.followUpDeadline) : null }),
    ...(data.processingMethod && { processingMethod: data.processingMethod }),
    ...(data.dispositionTarget !== undefined && { dispositionTarget: data.dispositionTarget }),
    ...(data.srikandiDispositionNumber !== undefined && { srikandiDispositionNumber: data.srikandiDispositionNumber }),
    ...(file && { fileName: file.originalname, filePath: file.path.replace(/\\/g, '/').replace(/^uploads\//, '') }),
  };

  const letter = await prisma.incomingLetter.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  // Determine final values after update
  const finalIsInvitation = data.isInvitation !== undefined ? data.isInvitation : existingLetter.isInvitation;
  const finalEventDate = data.eventDate !== undefined ? (data.eventDate ? parseDate(data.eventDate) : null) : existingLetter.eventDate;
  const wasInvitation = existingLetter.isInvitation;
  const oldEventDate = existingLetter.eventDate;
  
  // Check if calendar event already exists
  const existingCalendarEvent = await prisma.calendarEvent.findFirst({
    where: { incomingLetterId: id },
  });

  // SCENARIO 1: Changed from non-event to event
  if (!wasInvitation && finalIsInvitation && finalEventDate) {
    const eventData = {
      title: `[Undangan] ${letter.subject}`,
      description: letter.eventNotes,
      date: finalEventDate,
      time: letter.eventTime,
      location: letter.eventLocation,
      type: 'MEETING' as const,
      userId: existingLetter.userId,
    };

    // Create new calendar event
    const calendarEvent = await prisma.calendarEvent.create({
      data: {
        ...eventData,
        incomingLetterId: letter.id,
      },
    });

    // Create notifications for H-7, H-3, H-1
    await createEventNotifications(
      calendarEvent.id,
      existingLetter.userId,
      calendarEvent.title,
      calendarEvent.date
    );
  }
  // SCENARIO 2: Changed from event to non-event
  else if (wasInvitation && !finalIsInvitation) {
    if (existingCalendarEvent) {
      // Delete all notifications associated with this event
      await deleteEventNotifications(existingCalendarEvent.id);
      
      // Delete calendar event
      await prisma.calendarEvent.delete({
        where: { id: existingCalendarEvent.id },
      });
    }
  }
  // SCENARIO 3: Still an event - update event and notifications if needed
  else if (finalIsInvitation && finalEventDate) {
    const eventData = {
      title: `[Undangan] ${letter.subject}`,
      description: letter.eventNotes,
      date: finalEventDate,
      time: letter.eventTime,
      location: letter.eventLocation,
      type: 'MEETING' as const,
      userId: existingLetter.userId,
    };

    if (existingCalendarEvent) {
      // Update existing calendar event
      await prisma.calendarEvent.update({
        where: { id: existingCalendarEvent.id },
        data: eventData,
      });

      // Check if event date changed
      const dateChanged = oldEventDate && finalEventDate && 
        oldEventDate.getTime() !== finalEventDate.getTime();

      if (dateChanged) {
        // Date changed - update notifications (delete old, create new)
        await updateEventNotifications(
          existingCalendarEvent.id,
          existingLetter.userId,
          eventData.title,
          eventData.date
        );
      }
    } else {
      // Calendar event doesn't exist but should - create it
      const calendarEvent = await prisma.calendarEvent.create({
        data: {
          ...eventData,
          incomingLetterId: letter.id,
        },
      });

      // Create notifications
      await createEventNotifications(
        calendarEvent.id,
        existingLetter.userId,
        calendarEvent.title,
        calendarEvent.date
      );
    }
  }
  // SCENARIO 4: Was event, still event, but no event date provided
  else if (finalIsInvitation && !finalEventDate && existingCalendarEvent) {
    // Delete notifications and calendar event since no valid date
    await deleteEventNotifications(existingCalendarEvent.id);
    await prisma.calendarEvent.delete({
      where: { id: existingCalendarEvent.id },
    });
  }

  res.json({
    success: true,
    data: letter,
    message: 'Incoming letter updated successfully',
  });
});

// Delete incoming letter
export const deleteIncomingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if letter exists
  const letter = await prisma.incomingLetter.findUnique({
    where: { id },
  });

  if (!letter) {
    throw new NotFoundError('Incoming letter');
  }

  // Find and delete associated calendar events and their notifications
  const calendarEvents = await prisma.calendarEvent.findMany({
    where: { incomingLetterId: id },
  });

  for (const event of calendarEvents) {
    // Delete notifications for each calendar event
    await deleteEventNotifications(event.id);
  }

  // Delete associated calendar events
  await prisma.calendarEvent.deleteMany({
    where: { incomingLetterId: id },
  });

  // Delete the letter
  await prisma.incomingLetter.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Incoming letter deleted successfully',
  });
});
