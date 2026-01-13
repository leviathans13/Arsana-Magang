import { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitization';

/**
 * Middleware to sanitize request body, query, and params
 * Prevents XSS and injection attacks by cleaning user input
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    // If sanitization fails, pass the error to error handler
    next(error);
  }
};

/**
 * Middleware specifically for file upload sanitization
 * Sanitizes file metadata without touching file buffer
 */
export const sanitizeFileUpload = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (req.file) {
      // Sanitize file metadata (but not the buffer)
      if (req.file.originalname) {
        // Note: We don't modify originalname here as multer handles it
        // This is just for additional validation
        const extension = req.file.originalname.split('.').pop();
        if (extension && !/^[a-zA-Z0-9]+$/.test(extension)) {
          throw new Error('Invalid file extension');
        }
      }
    }

    if (req.files && Array.isArray(req.files)) {
      // Handle multiple files if needed in the future
      for (const file of req.files) {
        if (file.originalname) {
          const extension = file.originalname.split('.').pop();
          if (extension && !/^[a-zA-Z0-9]+$/.test(extension)) {
            throw new Error('Invalid file extension');
          }
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
