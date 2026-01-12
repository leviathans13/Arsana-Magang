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

/**
 * @openapi
 * /api/incoming:
 *   get:
 *     tags:
 *       - Surat Masuk
 *     summary: Get all incoming letters
 *     description: Retrieve list of incoming letters with pagination and filters
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
 *         description: Search in letter number, subject, sender
 *       - in: query
 *         name: isInvitation
 *         schema:
 *           type: boolean
 *         description: Filter by invitation letters
 *       - in: query
 *         name: needsFollowUp
 *         schema:
 *           type: boolean
 *         description: Filter by letters that need follow-up
 *     responses:
 *       200:
 *         description: List of incoming letters
 *       401:
 *         description: Unauthorized
 */
router.get('/', validate(listIncomingLettersQuerySchema, 'query'), getIncomingLetters);

/**
 * @openapi
 * /api/incoming/{id}:
 *   get:
 *     tags:
 *       - Surat Masuk
 *     summary: Get incoming letter by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Incoming letter details
 *       404:
 *         description: Letter not found
 */
router.get('/:id', validate(idParamSchema, 'params'), getIncomingLetterById);

/**
 * @openapi
 * /api/incoming:
 *   post:
 *     tags:
 *       - Surat Masuk
 *     summary: Create new incoming letter
 *     description: Create incoming letter with optional file attachment. Can be marked as invitation or requiring follow-up.
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
 *               - receivedDate
 *             properties:
 *               letterNumber:
 *                 type: string
 *                 example: "001/SM/2024"
 *               letterDate:
 *                 type: string
 *                 format: date
 *               letterNature:
 *                 type: string
 *                 enum: [BIASA, TERBATAS, RAHASIA, SANGAT_RAHASIA, PENTING]
 *                 default: BIASA
 *               subject:
 *                 type: string
 *               sender:
 *                 type: string
 *               recipient:
 *                 type: string
 *               processor:
 *                 type: string
 *               note:
 *                 type: string
 *               receivedDate:
 *                 type: string
 *                 format: date
 *               isInvitation:
 *                 type: boolean
 *                 default: false
 *               eventDate:
 *                 type: string
 *                 format: date
 *                 description: Required if isInvitation is true
 *               eventTime:
 *                 type: string
 *                 example: "10:00"
 *               eventLocation:
 *                 type: string
 *               eventNotes:
 *                 type: string
 *               needsFollowUp:
 *                 type: boolean
 *                 default: false
 *                 description: Mark letter as requiring follow-up action
 *               followUpDeadline:
 *                 type: string
 *                 format: date
 *                 description: Required if needsFollowUp is true
 *               processingMethod:
 *                 type: string
 *                 enum: [MANUAL, SRIKANDI]
 *                 default: MANUAL
 *               dispositionTarget:
 *                 type: string
 *                 enum: [UMPEG, PERENCANAAN, KAUR_KEUANGAN, KABID, BIDANG1, BIDANG2, BIDANG3, BIDANG4, BIDANG5]
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF, DOC, DOCX, JPG, or PNG file (max 5MB)
 *     responses:
 *       201:
 *         description: Incoming letter created successfully
 *       409:
 *         description: Letter number already exists
 */
router.post(
  '/',
  uploadSingleIncoming,
  handleMulterError,
  validate(createIncomingLetterSchema),
  createIncomingLetter
);

/**
 * @openapi
 * /api/incoming/{id}:
 *   put:
 *     tags:
 *       - Surat Masuk
 *     summary: Update incoming letter
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
 *             properties:
 *               letterNumber:
 *                 type: string
 *               subject:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Letter updated successfully
 *       404:
 *         description: Letter not found
 */
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  uploadSingleIncoming,
  handleMulterError,
  validate(updateIncomingLetterSchema),
  updateIncomingLetter
);

/**
 * @openapi
 * /api/incoming/{id}:
 *   delete:
 *     tags:
 *       - Surat Masuk
 *     summary: Delete incoming letter
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Letter deleted successfully
 *       404:
 *         description: Letter not found
 */
router.delete('/:id', validate(idParamSchema, 'params'), deleteIncomingLetter);

export default router;
