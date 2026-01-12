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
  idParamSchema,
} from '../validators/outgoingLetter.validator';

const router = Router();

// All outgoing letter routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /api/outgoing:
 *   get:
 *     tags:
 *       - Surat Keluar
 *     summary: Get all outgoing letters
 *     description: Retrieve list of outgoing letters with pagination and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isInvitation
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of outgoing letters
 */
router.get('/', validate(listOutgoingLettersQuerySchema, 'query'), getOutgoingLetters);

/**
 * @openapi
 * /api/outgoing/{id}:
 *   get:
 *     tags:
 *       - Surat Keluar
 *     summary: Get outgoing letter by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Outgoing letter details
 *       404:
 *         description: Letter not found
 */
router.get('/:id', validate(idParamSchema, 'params'), getOutgoingLetterById);

/**
 * @openapi
 * /api/outgoing:
 *   post:
 *     tags:
 *       - Surat Keluar
 *     summary: Create new outgoing letter
 *     description: Create outgoing letter with optional file attachment. Can be marked as invitation. Note - outgoing letters DO NOT have "Perlu Tindakan" label (only incoming letters).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - letterNumber
 *               - subject
 *               - sender
 *               - recipient
 *               - processor
 *               - createdDate
 *               - letterDate
 *             properties:
 *               letterNumber:
 *                 type: string
 *               createdDate:
 *                 type: string
 *                 format: date
 *               letterDate:
 *                 type: string
 *                 format: date
 *               letterNature:
 *                 type: string
 *                 enum: [BIASA, TERBATAS, RAHASIA, SANGAT_RAHASIA, PENTING]
 *               subject:
 *                 type: string
 *               sender:
 *                 type: string
 *               recipient:
 *                 type: string
 *               processor:
 *                 type: string
 *               isInvitation:
 *                 type: boolean
 *                 default: false
 *               eventDate:
 *                 type: string
 *                 format: date
 *               eventTime:
 *                 type: string
 *               eventLocation:
 *                 type: string
 *               eventNotes:
 *                 type: string
 *               classificationCode:
 *                 type: string
 *               serialNumber:
 *                 type: integer
 *               securityClass:
 *                 type: string
 *                 enum: [BIASA, TERBATAS]
 *               processingMethod:
 *                 type: string
 *                 enum: [MANUAL, SRIKANDI]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Outgoing letter created
 *       409:
 *         description: Letter number already exists
 */
router.post(
  '/',
  uploadSingleOutgoing,
  handleMulterError,
  validate(createOutgoingLetterSchema),
  createOutgoingLetter
);

/**
 * @openapi
 * /api/outgoing/{id}:
 *   put:
 *     tags:
 *       - Surat Keluar
 *     summary: Update outgoing letter
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Letter updated successfully
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  uploadSingleOutgoing,
  handleMulterError,
  validate(updateOutgoingLetterSchema),
  updateOutgoingLetter
);

/**
 * @openapi
 * /api/outgoing/{id}:
 *   delete:
 *     tags:
 *       - Surat Keluar
 *     summary: Delete outgoing letter
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Letter deleted successfully
 */
router.delete('/:id', validate(idParamSchema, 'params'), deleteOutgoingLetter);

export default router;
