import { z } from 'zod';

// Enums for validation
const letterNatureEnum = z.enum(['BIASA', 'TERBATAS', 'RAHASIA', 'SANGAT_RAHASIA', 'PENTING']);
const processingMethodEnum = z.enum(['MANUAL', 'SRIKANDI']);
const dispositionTargetEnum = z.enum([
  'UMPEG',
  'PERENCANAAN',
  'KAUR_KEUANGAN',
  'KABID',
  'BIDANG1',
  'BIDANG2',
  'BIDANG3',
  'BIDANG4',
  'BIDANG5',
]);

// Create incoming letter schema with conditional validation
export const createIncomingLetterSchema = z.object({
  letterNumber: z.string().min(1, 'Letter number is required'),
  letterDate: z.string().optional(),
  letterNature: letterNatureEnum.optional().default('BIASA'),
  subject: z.string().min(1, 'Subject is required'),
  sender: z.string().min(1, 'Sender is required'),
  recipient: z.string().min(1, 'Recipient is required'),
  processor: z.string().min(1, 'Processor is required'),
  note: z.string().optional(),
  receivedDate: z.string().min(1, 'Received date is required'),
  isInvitation: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional().default(false)
  ),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  eventLocation: z.string().optional(),
  eventNotes: z.string().optional(),
  needsFollowUp: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional().default(false)
  ),
  followUpDeadline: z.string().optional(),
  processingMethod: processingMethodEnum.optional().default('MANUAL'),
  dispositionTarget: dispositionTargetEnum.optional(),
  srikandiDispositionNumber: z.string().optional(),
}).refine((data) => {
  // If isInvitation is true, eventDate is required
  if (data.isInvitation) {
    return !!data.eventDate;
  }
  return true;
}, {
  message: 'Event date is required when letter is marked as invitation/event',
  path: ['eventDate'],
});

// Update incoming letter schema (all fields optional) with conditional validation
// Note: This validates only the incoming request data. The controller handles validation
// against the final combined state (existing + updates) to ensure data integrity.
export const updateIncomingLetterSchema = z.object({
  letterNumber: z.string().min(1).optional(),
  letterDate: z.string().optional(),
  letterNature: letterNatureEnum.optional(),
  subject: z.string().min(1).optional(),
  sender: z.string().min(1).optional(),
  recipient: z.string().min(1).optional(),
  processor: z.string().min(1).optional(),
  note: z.string().optional(),
  receivedDate: z.string().optional(),
  isInvitation: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  eventLocation: z.string().optional(),
  eventNotes: z.string().optional(),
  needsFollowUp: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ),
  followUpDeadline: z.string().optional(),
  processingMethod: processingMethodEnum.optional(),
  dispositionTarget: dispositionTargetEnum.optional(),
  srikandiDispositionNumber: z.string().optional(),
}).refine((data) => {
  // If isInvitation is being set to true, eventDate must be provided
  if (data.isInvitation === true) {
    return !!data.eventDate;
  }
  return true;
}, {
  message: 'Event date is required when letter is marked as invitation/event',
  path: ['eventDate'],
});

// Query params schema for listing
export const listIncomingLettersQuerySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  nature: letterNatureEnum.optional(),
  processingMethod: processingMethodEnum.optional(),
  dispositionTarget: dispositionTargetEnum.optional(),
  needsFollowUp: z.string().transform((val) => val === 'true').optional(),
  isInvitation: z.string().transform((val) => val === 'true').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ID param schema
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Types
export type CreateIncomingLetterInput = z.infer<typeof createIncomingLetterSchema>;
export type UpdateIncomingLetterInput = z.infer<typeof updateIncomingLetterSchema>;
export type ListIncomingLettersQuery = z.infer<typeof listIncomingLettersQuerySchema>;
