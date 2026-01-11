import { Request, Response } from 'express';

// 404 Not Found handler
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found',
  });
};
