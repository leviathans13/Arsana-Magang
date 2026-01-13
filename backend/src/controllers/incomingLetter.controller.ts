import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta, createSearchFilter, parseDate } from '../utils/helpers';
import { CreateIncomingLetterInput, UpdateIncomingLetterInput, ListIncomingLettersQuery } from '../validators/incomingLetter.validator';
import { Prisma } from '@prisma/client';

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
    await prisma.calendarEvent.create({
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

  // Handle calendar event based on isInvitation status
  const finalIsInvitation = data.isInvitation !== undefined ? data.isInvitation : existingLetter.isInvitation;
  const finalEventDate = data.eventDate !== undefined ? (data.eventDate ? parseDate(data.eventDate) : null) : existingLetter.eventDate;
  
  if (finalIsInvitation && finalEventDate) {
    // Check if calendar event already exists
    const existingCalendarEvent = await prisma.calendarEvent.findFirst({
      where: { incomingLetterId: id },
    });

    const eventData = {
      title: `[Undangan] ${letter.subject}`,
      description: letter.eventNotes,
      date: finalEventDate,
      time: letter.eventTime,
      location: letter.eventLocation,
      type: 'MEETING' as const,
      userId: existingLetter.userId, // Use existing userId
    };

    if (existingCalendarEvent) {
      // Update existing calendar event
      await prisma.calendarEvent.update({
        where: { id: existingCalendarEvent.id },
        data: eventData,
      });
    } else {
      // Create new calendar event
      await prisma.calendarEvent.create({
        data: {
          ...eventData,
          incomingLetterId: letter.id,
        },
      });
    }
  } else if (!finalIsInvitation) {
    // Delete calendar event if no longer an invitation
    await prisma.calendarEvent.deleteMany({
      where: { incomingLetterId: id },
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
