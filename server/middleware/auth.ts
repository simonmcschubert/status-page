import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtPayload } from '../services/auth-service.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to require authentication for protected routes
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  const payload = AuthService.verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
};

/**
 * Optional auth - attaches user if token valid, continues regardless
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = AuthService.verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};
