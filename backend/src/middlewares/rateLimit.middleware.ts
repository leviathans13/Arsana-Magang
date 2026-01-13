import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for login endpoint
export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.LOGIN_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed login attempts
});

// Rate limiter for password reset / sensitive operations
export const sensitiveOperationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Too many attempts',
    message: 'Please try again in 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
