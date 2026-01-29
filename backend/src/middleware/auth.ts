import { Request, Response, NextFunction } from 'express';
import pool from '../database/db';
import { User } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

// No-op authentication - just pass through
// User ID should be passed via headers or query params
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for userId in header (for API calls that need user context)
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      // Fetch user from database
      const result = await pool.query(
        'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

// No-op authorization - just pass through
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    next();
  };
};
