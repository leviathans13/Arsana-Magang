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
