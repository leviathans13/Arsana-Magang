import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler, NotFoundError, ConflictError } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta, createSearchFilter, parseDate } from '../utils/helpers';
import { CreateOutgoingLetterInput, UpdateOutgoingLetterInput, ListOutgoingLettersQuery } from '../validators/outgoingLetter.validator';
import { Prisma } from '@prisma/client';

// User select for including in responses
const userSelect = {
  id: true,
  name: true,
  email: true,
};

// Get all outgoing letters with pagination and filters
export const getOutgoingLetters = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListOutgoingLettersQuery;
  const { skip, take, page, limit } = getPagination({
    page: query.page,
    limit: query.limit,
  });

  // Build where clause
  const where: Prisma.OutgoingLetterWhereInput = {};

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

  // Security class filter
  if (query.securityClass) {
    where.securityClass = query.securityClass;
  }

  // Processing method filter
  if (query.processingMethod) {
    where.processingMethod = query.processingMethod;
  }

  // Is invitation filter
  if (query.isInvitation !== undefined) {
    where.isInvitation = query.isInvitation;
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    where.letterDate = {};
    if (query.startDate) {
      where.letterDate.gte = parseDate(query.startDate);
    }
    if (query.endDate) {
      where.letterDate.lte = parseDate(query.endDate);
    }
  }

  // Build orderBy
  const orderBy: Prisma.OutgoingLetterOrderByWithRelationInput = {};
  if (query.sortBy) {
    orderBy[query.sortBy as keyof Prisma.OutgoingLetterOrderByWithRelationInput] =
      query.sortOrder || 'desc';
  } else {
    orderBy.letterDate = 'desc';
  }

  // Get letters and count
  const [letters, total] = await Promise.all([
    prisma.outgoingLetter.findMany({
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
    prisma.outgoingLetter.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      letters,
      pagination: createPaginationMeta(page, limit, total),
    },
  });
});

// Get single outgoing letter by ID
export const getOutgoingLetterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const letter = await prisma.outgoingLetter.findUnique({
    where: { id },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  if (!letter) {
    throw new NotFoundError('Outgoing letter');
  }

  res.json({
    success: true,
    data: letter,
  });
});

// Create new outgoing letter
export const createOutgoingLetter = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const data = req.body as CreateOutgoingLetterInput;
  const file = req.file;

  // Check for duplicate letter number
  const existing = await prisma.outgoingLetter.findUnique({
    where: { letterNumber: data.letterNumber },
  });

  if (existing) {
    throw new ConflictError('Letter number already exists', 'letterNumber');
  }

  // Parse dates
  const letterData: Prisma.OutgoingLetterCreateInput = {
    createdDate: parseDate(data.createdDate),
    letterDate: parseDate(data.letterDate),
    letterNumber: data.letterNumber,
    letterNature: data.letterNature,
    subject: data.subject,
    sender: data.sender,
    recipient: data.recipient,
    processor: data.processor,
    note: data.note,
    isInvitation: data.isInvitation,
    eventDate: data.eventDate ? parseDate(data.eventDate) : null,
    eventTime: data.eventTime,
    eventLocation: data.eventLocation,
    eventNotes: data.eventNotes,
    executionDate: data.executionDate ? parseDate(data.executionDate) : null,
    classificationCode: data.classificationCode,
    serialNumber: data.serialNumber,
    securityClass: data.securityClass,
    processingMethod: data.processingMethod,
    srikandiDispositionNumber: data.srikandiDispositionNumber,
    fileName: file?.originalname,
    filePath: file?.path,
    user: {
      connect: { id: req.user.id },
    },
  };

  const letter = await prisma.outgoingLetter.create({
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
        title: `[Undangan Keluar] ${data.subject}`,
        description: data.eventNotes,
        date: parseDate(data.eventDate),
        time: data.eventTime,
        location: data.eventLocation,
        type: 'MEETING',
        userId: req.user.id,
        outgoingLetterId: letter.id,
      },
    });
  }

  // Create notification for new letter
  await prisma.notification.create({
    data: {
      title: 'Surat Keluar Baru',
      message: `Surat keluar baru: ${data.letterNumber} - ${data.subject}`,
      type: 'INFO',
    },
  });

  res.status(201).json({
    success: true,
    data: letter,
    message: 'Outgoing letter created successfully',
  });
});

// Update outgoing letter
export const updateOutgoingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body as UpdateOutgoingLetterInput;
  const file = req.file;

  // Check if letter exists
  const existingLetter = await prisma.outgoingLetter.findUnique({
    where: { id },
  });

  if (!existingLetter) {
    throw new NotFoundError('Outgoing letter');
  }

  // Check for duplicate letter number (if changing)
  if (data.letterNumber && data.letterNumber !== existingLetter.letterNumber) {
    const duplicate = await prisma.outgoingLetter.findUnique({
      where: { letterNumber: data.letterNumber },
    });

    if (duplicate) {
      throw new ConflictError('Letter number already exists', 'letterNumber');
    }
  }

  // Build update data
  const updateData: Prisma.OutgoingLetterUpdateInput = {
    ...(data.createdDate && { createdDate: parseDate(data.createdDate) }),
    ...(data.letterDate && { letterDate: parseDate(data.letterDate) }),
    ...(data.letterNumber && { letterNumber: data.letterNumber }),
    ...(data.letterNature && { letterNature: data.letterNature }),
    ...(data.subject && { subject: data.subject }),
    ...(data.sender && { sender: data.sender }),
    ...(data.recipient && { recipient: data.recipient }),
    ...(data.processor && { processor: data.processor }),
    ...(data.note !== undefined && { note: data.note }),
    ...(data.isInvitation !== undefined && { isInvitation: data.isInvitation }),
    ...(data.eventDate !== undefined && { eventDate: data.eventDate ? parseDate(data.eventDate) : null }),
    ...(data.eventTime !== undefined && { eventTime: data.eventTime }),
    ...(data.eventLocation !== undefined && { eventLocation: data.eventLocation }),
    ...(data.eventNotes !== undefined && { eventNotes: data.eventNotes }),
    ...(data.executionDate !== undefined && { executionDate: data.executionDate ? parseDate(data.executionDate) : null }),
    ...(data.classificationCode !== undefined && { classificationCode: data.classificationCode }),
    ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
    ...(data.securityClass && { securityClass: data.securityClass }),
    ...(data.processingMethod && { processingMethod: data.processingMethod }),
    ...(data.srikandiDispositionNumber !== undefined && { srikandiDispositionNumber: data.srikandiDispositionNumber }),
    ...(file && { fileName: file.originalname, filePath: file.path }),
  };

  const letter = await prisma.outgoingLetter.update({
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
      where: { outgoingLetterId: id },
    });

    const eventData = {
      title: `[Undangan Keluar] ${letter.subject}`,
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
          outgoingLetterId: letter.id,
        },
      });
    }
  } else if (!finalIsInvitation) {
    // Delete calendar event if no longer an invitation
    await prisma.calendarEvent.deleteMany({
      where: { outgoingLetterId: id },
    });
  }

  res.json({
    success: true,
    data: letter,
    message: 'Outgoing letter updated successfully',
  });
});

// Delete outgoing letter
export const deleteOutgoingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if letter exists
  const letter = await prisma.outgoingLetter.findUnique({
    where: { id },
  });

  if (!letter) {
    throw new NotFoundError('Outgoing letter');
  }

  // Delete associated calendar events
  await prisma.calendarEvent.deleteMany({
    where: { outgoingLetterId: id },
  });

  // Delete the letter
  await prisma.outgoingLetter.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Outgoing letter deleted successfully',
  });
});
