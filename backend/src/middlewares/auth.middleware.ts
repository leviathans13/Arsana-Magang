import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/auth';
import { logError } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided',
      });
      return;
    }

    // Verify token
    let payload: JwtPayload;
    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
      });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logError('Authentication error', error as Error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
};

// Optional auth middleware - doesn't fail if no token, but attaches user if present
export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      try {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        });

        if (user) {
          req.user = user;
        }
      } catch {
        // Token invalid, but don't fail - just continue without user
      }
    }

    next();
  } catch (error) {
    logError('Optional auth error', error as Error);
    next();
  }
};

// Admin-only middleware
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be logged in to access this resource',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Admin privileges required',
    });
    return;
  }

  next();
};
