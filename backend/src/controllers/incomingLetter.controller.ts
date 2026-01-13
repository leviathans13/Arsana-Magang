import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta, createSearchFilter, parseDate } from '../utils/helpers';
import { ListIncomingLettersQuery } from '../validators/incomingLetter.validator';
import { Prisma } from '@prisma/client';
import { incomingLetterService } from '../services/incomingLetterService';

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

  // Use service layer for business logic
  const { letters, total } = await incomingLetterService.getIncomingLetters({
    skip,
    take,
    where,
    orderBy,
  });

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

  // Use service layer
  const letter = await incomingLetterService.getIncomingLetterById(id);

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

  const data = req.body;
  const file = req.file;

  // Use service layer with transaction handling
  const letter = await incomingLetterService.createIncomingLetter(
    data,
    req.user.id,
    file
  );

  res.status(201).json({
    success: true,
    data: letter,
    message: 'Incoming letter created successfully',
  });
});

// Update incoming letter
export const updateIncomingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const file = req.file;

  // Use service layer with transaction handling
  const letter = await incomingLetterService.updateIncomingLetter(id, data, file);

  res.json({
    success: true,
    data: letter,
    message: 'Incoming letter updated successfully',
  });
});

// Delete incoming letter
export const deleteIncomingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Use service layer with transaction handling
  await incomingLetterService.deleteIncomingLetter(id);

  res.json({
    success: true,
    message: 'Incoming letter deleted successfully',
  });
});
