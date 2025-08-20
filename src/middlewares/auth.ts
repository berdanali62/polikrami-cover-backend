import { Request, Response, NextFunction } from 'express';
import { verifyToken, type AccessTokenPayload } from '../shared/helpers/jwt';
import { prisma } from '../config/database';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : undefined;
  const token = req.cookies?.access || bearer;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  const payload = verifyToken<AccessTokenPayload>(token, 'access');
  if (!payload) return res.status(401).json({ message: 'Unauthorized' });

  // Role'u DB'den doğrula (JWT'ye güvenme)
  const dbUser = await prisma.user.findUnique({ where: { id: payload.userId }, include: { roles: { include: { role: true } } } });
  if (!dbUser) return res.status(401).json({ message: 'Unauthorized' });
  const roleName = dbUser.roles?.[0]?.role?.name;
  req.user = { id: payload.userId, role: roleName };
  next();
}

