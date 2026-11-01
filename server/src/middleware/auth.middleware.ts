import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      console.warn('[Middleware] Invalid JWT token');
      // If it's optional, we can just not set req.user.
      // But if it's required:
      // return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  // For our /save route, we might want to allow anonymous saves if they aren't logged in.
  // We'll proceed without setting req.user. The controller can decide if it's strictly required.
  next();
};
