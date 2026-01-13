import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { getPagination, createPaginationMeta, createSearchFilter, parseDate } from '../utils/helpers';
import { ListOutgoingLettersQuery } from '../validators/outgoingLetter.validator';
import { Prisma } from '@prisma/client';
import { outgoingLetterService } from '../services/outgoingLetterService';

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

  // Use service layer for business logic
  const { letters, total } = await outgoingLetterService.getOutgoingLetters({
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

// Get single outgoing letter by ID
export const getOutgoingLetterById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Use service layer
  const letter = await outgoingLetterService.getOutgoingLetterById(id);

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

  const data = req.body;
  const file = req.file;

  // Use service layer with transaction handling
  const letter = await outgoingLetterService.createOutgoingLetter(
    data,
    req.user.id,
    file
  );

  res.status(201).json({
    success: true,
    data: letter,
    message: 'Outgoing letter created successfully',
  });
});

// Update outgoing letter
export const updateOutgoingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const file = req.file;

  // Use service layer with transaction handling
  const letter = await outgoingLetterService.updateOutgoingLetter(id, data, file);

  res.json({
    success: true,
    data: letter,
    message: 'Outgoing letter updated successfully',
  });
});

// Delete outgoing letter
export const deleteOutgoingLetter = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Use service layer with transaction handling
  await outgoingLetterService.deleteOutgoingLetter(id);

  res.json({
    success: true,
    message: 'Outgoing letter deleted successfully',
  });
});
