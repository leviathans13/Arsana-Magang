import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { FILE_UPLOAD } from '../config/constants';
import { config } from '../config/env';
import { generateUniqueFilename, sanitizeFilename } from '../utils/helpers';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    // Default to incoming letters folder
    const uploadPath = path.join(config.uploadPath, 'letters', 'incoming');
    cb(null, uploadPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const sanitized = sanitizeFilename(file.originalname);
    const uniqueFilename = generateUniqueFilename(sanitized);
    cb(null, uniqueFilename);
  },
});

// Dynamic storage for specific letter types
const createDynamicStorage = (letterType: 'incoming' | 'outgoing') => {
  return multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      const uploadPath = path.join(config.uploadPath, 'letters', letterType);
      cb(null, uploadPath);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const sanitized = sanitizeFilename(file.originalname);
      const uniqueFilename = generateUniqueFilename(sanitized);
      cb(null, uniqueFilename);
    },
  });
};

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  // Check MIME type
  const allowedMimeTypes = FILE_UPLOAD.ALLOWED_MIME_TYPES as readonly string[];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error(`File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG`));
    return;
  }

  // Check extension
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = FILE_UPLOAD.ALLOWED_EXTENSIONS as readonly string[];
  if (!allowedExtensions.includes(extension)) {
    cb(new Error(`File extension not allowed. Allowed extensions: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  cb(null, true);
};

// Create multer instance with default options
const createMulterInstance = (letterType?: 'incoming' | 'outgoing') => {
  return multer({
    storage: letterType ? createDynamicStorage(letterType) : storage,
    fileFilter,
    limits: {
      fileSize: FILE_UPLOAD.MAX_SIZE,
    },
  });
};

// Export upload middleware for different letter types
export const uploadIncoming = createMulterInstance('incoming');
export const uploadOutgoing = createMulterInstance('outgoing');
export const upload = createMulterInstance();

// Single file upload middleware
export const uploadSingleIncoming = uploadIncoming.single('file');
export const uploadSingleOutgoing = uploadOutgoing.single('file');

// Error handling middleware for multer errors
export const handleMulterError = (err: Error, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File too large',
        message: `File size exceeds the limit of ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`,
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message,
    });
    return;
  }

  if (err.message.includes('File type not allowed') || err.message.includes('File extension not allowed')) {
    res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: err.message,
    });
    return;
  }

  next(err);
};
