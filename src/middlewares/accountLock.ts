import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';

export async function checkAccountLock(req: Request, res: Response, next: NextFunction) {
  try {
    const email = (req.body?.email as string | undefined)?.toLowerCase?.();
    if (!email) return next();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return next(); // Do not reveal
    const since = new Date(Date.now() - env.LOGIN_LOCKOUT_WINDOW_MINUTES * 60 * 1000);
    const fails = await prisma.event.count({ where: { userId: user.id, type: 'login_failed', createdAt: { gt: since } } });
    if (fails >= env.MAX_FAILED_LOGIN_ATTEMPTS) return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
    next();
  } catch (err) {
    next(err as unknown as Error);
  }
}

export async function recordLoginFailure(userId: string) {
  try { await prisma.event.create({ data: { userId, type: 'login_failed' } }); } catch { /* ignore */ }
}

export async function recordLoginSuccess(userId: string) {
  try { await prisma.event.create({ data: { userId, type: 'login_success' } }); } catch { /* ignore */ }
}


