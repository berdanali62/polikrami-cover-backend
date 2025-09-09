import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Account-based lock: after N failed logins within T minutes, block further attempts until window passes
const MAX_FAILS = 5;
const WINDOW_MIN = 10;

export async function checkAccountLock(req: Request, res: Response, next: NextFunction) {
  try {
    const email = (req.body?.email as string | undefined)?.toLowerCase?.();
    if (!email) return next();
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return next(); // Do not reveal
    const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000);
    const fails = await prisma.event.count({ where: { userId: user.id, type: 'login_failed', createdAt: { gt: since } } });
    if (fails >= MAX_FAILS) return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
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


