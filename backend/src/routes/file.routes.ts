import { Router } from 'express';
import {
  getFileInfo,
  downloadFile,
  previewFile,
  deleteFile,
} from '../controllers/file.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All file routes require authentication
router.use(authMiddleware);

// Get file info
router.get('/:type/:id/info', getFileInfo);

// Download file
router.get('/:type/:id', downloadFile);

// Preview file
router.get('/:type/:id/preview', previewFile);

// Delete file
router.delete('/:type/:id', deleteFile);

export default router;
