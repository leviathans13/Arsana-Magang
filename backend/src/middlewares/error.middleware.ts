import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { logError } from '../utils/logger';
import { config } from '../config/env';
import { Prisma } from '@prisma/client';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error
export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

// Validation error
export class ValidationError extends ApiError {
  details?: Record<string, string[]>;

  constructor(message: string, details?: Record<string, string[]>) {
    super(400, message);
    this.details = details;
  }
}

// Unauthorized error
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

// Forbidden error
export class ForbiddenError extends ApiError {
  constructor(message = 'Access denied') {
    super(403, message);
  }
}

// Conflict error
export class ConflictError extends ApiError {
  field?: string;

  constructor(message: string, field?: string) {
    super(409, message);
    this.field = field;
  }
}

// Global error handler middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logError('Error occurred', err);

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  // Handle API errors
  if (err instanceof ApiError) {
    const response: {
      success: boolean;
      error: string;
      message: string;
      field?: string;
      details?: Record<string, string[]>;
      stack?: string;
    } = {
      success: false,
      error: err.message,
      message: err.message,
    };

    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    if (err instanceof ConflictError && err.field) {
      response.field = err.field;
    }

    if (config.isDevelopment) {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle other errors
  const statusCode = 500;
  const message = config.isDevelopment
    ? err.message
    : 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

// Handle Prisma-specific errors
const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError,
  res: Response
): void => {
  switch (err.code) {
    case 'P2002': {
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(', ') || 'field';
      res.status(409).json({
        success: false,
        error: `${field} already exists`,
        field,
        message: `A record with this ${field} already exists`,
      });
      break;
    }
    case 'P2025': {
      // Record not found
      res.status(404).json({
        success: false,
        error: 'Record not found',
        message: 'The requested record does not exist',
      });
      break;
    }
    case 'P2003': {
      // Foreign key constraint failed
      res.status(400).json({
        success: false,
        error: 'Invalid reference',
        message: 'The referenced record does not exist',
      });
      break;
    }
    default: {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: config.isDevelopment
          ? err.message
          : 'A database error occurred',
      });
    }
  }
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
