import { z } from 'zod';

// Enums for validation
const letterNatureEnum = z.enum(['BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING']);
const securityClassEnum = z.enum(['BIASA', 'TERBATAS']);
const processingMethodEnum = z.enum(['MANUAL', 'SRIKANDI']);

// Create outgoing letter schema
export const createOutgoingLetterSchema = z.object({
  createdDate: z.string().min(1, 'Created date is required'),
  letterDate: z.string().min(1, 'Letter date is required'),
  letterNumber: z.string().min(1, 'Letter number is required'),
  letterNature: letterNatureEnum.optional().default('BIASA'),
  subject: z.string().min(1, 'Subject is required'),
  sender: z.string().min(1, 'Sender is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  processor: z.string().min(1, 'Processor is required'),
  note: z.string().optional(),
  isInvitation: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional().default(false)
  ),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  eventLocation: z.string().optional(),
  eventNotes: z.string().optional(),
  executionDate: z.string().optional(),
  classificationCode: z.string().optional(),
  serialNumber: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  securityClass: securityClassEnum.optional().default('BIASA'),
  processingMethod: processingMethodEnum.optional().default('MANUAL'),
  srikandiDispositionNumber: z.string().optional(),
});

// Update outgoing letter schema (all fields optional)
export const updateOutgoingLetterSchema = z.object({
  createdDate: z.string().optional(),
  letterDate: z.string().optional(),
  letterNumber: z.string().min(1).optional(),
  letterNature: letterNatureEnum.optional(),
  subject: z.string().min(1).optional(),
  sender: z.string().min(1).optional(),
  recipient: z.string().min(1).optional(),
  processor: z.string().min(1).optional(),
  note: z.string().optional(),
  isInvitation: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  eventLocation: z.string().optional(),
  eventNotes: z.string().optional(),
  executionDate: z.string().optional(),
  classificationCode: z.string().optional(),
  serialNumber: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().positive().optional()
  ),
  securityClass: securityClassEnum.optional(),
  processingMethod: processingMethodEnum.optional(),
  srikandiDispositionNumber: z.string().optional(),
});

// Query params schema for listing
export const listOutgoingLettersQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  nature: letterNatureEnum.optional(),
  securityClass: securityClassEnum.optional(),
  processingMethod: processingMethodEnum.optional(),
  isInvitation: z.string().transform((val) => val === 'true').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Types
export type CreateOutgoingLetterInput = z.infer<typeof createOutgoingLetterSchema>;
export type UpdateOutgoingLetterInput = z.infer<typeof updateOutgoingLetterSchema>;
export type ListOutgoingLettersQuery = z.infer<typeof listOutgoingLettersQuerySchema>;
