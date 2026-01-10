import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/env';

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request
  const logRequest = (): void => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    if (config.logging.detailedRequestLogging) {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, logData);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  };

  // Log when response finishes
  res.on('finish', logRequest);

  next();
};
