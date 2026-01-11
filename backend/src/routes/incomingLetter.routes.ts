import { Router } from 'express';
import {
  getIncomingLetters,
  getIncomingLetterById,
  createIncomingLetter,
  updateIncomingLetter,
  deleteIncomingLetter,
} from '../controllers/incomingLetter.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadSingleIncoming, handleMulterError } from '../middlewares/upload.middleware';
import {
  createIncomingLetterSchema,
  updateIncomingLetterSchema,
  listIncomingLettersQuerySchema,
  idParamSchema,
} from '../validators/incomingLetter.validator';

const router = Router();

// All incoming letter routes require authentication
router.use(authMiddleware);

// Get all incoming letters
router.get('/', validate(listIncomingLettersQuerySchema, 'query'), getIncomingLetters);

// Get single incoming letter
router.get('/:id', validate(idParamSchema, 'params'), getIncomingLetterById);

// Create incoming letter
router.post(
  '/',
  uploadSingleIncoming,
  handleMulterError,
  validate(createIncomingLetterSchema),
  createIncomingLetter
);

// Update incoming letter
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  uploadSingleIncoming,
  handleMulterError,
  validate(updateIncomingLetterSchema),
  updateIncomingLetter
);

// Delete incoming letter
router.delete('/:id', validate(idParamSchema, 'params'), deleteIncomingLetter);

export default router;
