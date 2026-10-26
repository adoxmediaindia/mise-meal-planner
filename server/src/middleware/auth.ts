import { Request, Response, NextFunction } from 'express';
import 'cookie-parser';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: 'user' | 'admin';
    subscriptionTier: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token =
    req.cookies?.mise_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'mise_meal_planner_jwt_secret_dev_key_2026';
    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role?: 'user' | 'admin';
      subscriptionTier: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session. Please log in again.',
    });
  }
};

/**
 * Strict Admin Authorization Middleware
 * Verifies both JWT claims and directly inspects the database record to prevent token tampering.
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden: Administrator privileges required for this endpoint.',
      });
      return;
    }

    req.user.role = 'admin';
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Authorization verification failed' });
  }
};
