import { Request, Response, NextFunction } from 'express';
import { verifyToken, type AccessTokenPayload } from '../shared/helpers/jwt';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : undefined;
  const token = req.cookies?.access || bearer;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const payload = verifyToken<AccessTokenPayload>(token, 'access');
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });

  // Use role from JWT (no DB query needed)
  req.user = { id: payload.userId, role: payload.role };
  next();
}

export function requireRole(role: string) {
  return async function roleCheck(req: Request, res: Response, next: NextFunction) {
    // First ensure user is authenticated
    let authCompleted = false;
    await new Promise<void>((resolve) => {
      requireAuth(req, res, () => {
        authCompleted = true;
        resolve();
      });
    });
    
    // If requireAuth sent a response, don't proceed
    if (res.headersSent) {
      return;
    }
    
    // Check role
    if (!req.user?.role || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
}

