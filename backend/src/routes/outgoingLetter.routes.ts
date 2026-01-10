import { Router } from 'express';
import {
  getOutgoingLetters,
  getOutgoingLetterById,
  createOutgoingLetter,
  updateOutgoingLetter,
  deleteOutgoingLetter,
} from '../controllers/outgoingLetter.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadSingleOutgoing, handleMulterError } from '../middlewares/upload.middleware';
import {
  createOutgoingLetterSchema,
  updateOutgoingLetterSchema,
  listOutgoingLettersQuerySchema,
} from '../validators/outgoingLetter.validator';
import { idParamSchema } from '../validators/incomingLetter.validator';

const router = Router();

// All outgoing letter routes require authentication
router.use(authMiddleware);

// Get all outgoing letters
router.get('/', validate(listOutgoingLettersQuerySchema, 'query'), getOutgoingLetters);

// Get single outgoing letter
router.get('/:id', validate(idParamSchema, 'params'), getOutgoingLetterById);

// Create outgoing letter
router.post(
  '/',
  uploadSingleOutgoing,
  handleMulterError,
  validate(createOutgoingLetterSchema),
  createOutgoingLetter
);

// Update outgoing letter
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  uploadSingleOutgoing,
  handleMulterError,
  validate(updateOutgoingLetterSchema),
  updateOutgoingLetter
);

// Delete outgoing letter
router.delete('/:id', validate(idParamSchema, 'params'), deleteOutgoingLetter);

export default router;
