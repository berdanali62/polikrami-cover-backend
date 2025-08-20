import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';
import { env } from '../../../config/env';
import { forgotPasswordSchema, resetPasswordSchema, verifyResetCodeSchema } from '../dto/forgot-password.dto';
import { unauthorized, badRequest, conflict } from '../../../shared/errors/ApiError';

const service = new AuthService();

export async function registerController(req: Request, res: Response) {
  const { email, password, name, role } = req.body as { email: string; password: string; name?: string; role?: 'user' | 'designer' };
  const result = await service.register({ email, password, name, role });
  res.status(201).json({ user: result });
}

export async function loginController(req: Request, res: Response) {
  const { email, password, remember } = req.body as { email: string; password: string; remember?: boolean };
  const ua = req.headers['user-agent'] ?? undefined;
  const ip = req.ip;
  const { access, refresh } = await service.login({ email, password, ua, ip });
  setAuthCookies(res, access, refresh, Boolean(remember));
  res.status(200).json({ ok: true });
}

export async function refreshController(req: Request, res: Response) {
  const token = req.cookies?.refresh ?? '';
  if (!token) throw unauthorized();
  const payload = service.verifyRefreshToken(token);
  if (!payload) throw unauthorized();
  const ua = req.headers['user-agent'] ?? undefined;
  const ip = req.ip;
  const { access, refresh: newRefresh } = await service.refresh({ userId: payload.userId, refreshTid: payload.tid, ua, ip });
  setAuthCookies(res, access, newRefresh);
  res.status(200).json({ ok: true });
}

export async function logoutController(_req: Request, res: Response) {
  // Attempt to revoke active refresh tokens for the authenticated user if available
  try {
    // Note: logout endpoint doesn't require auth; best-effort if user attached by upstream middleware
    // In our current routing, logout is behind rateLimit only. If later protected, req.user will exist.
    const userId = _req.user?.id;
    if (userId) {
      const { revokeAllRefreshTokensByUser } = await import('../repository/tokenRepo');
      await revokeAllRefreshTokensByUser(userId);
    }
  } catch {}
  res.clearCookie('access', cookieClearOpts());
  res.clearCookie('refresh', { ...cookieClearOpts(), path: '/api/auth/refresh' });
  res.status(200).json({ ok: true });
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  await service.forgotPassword(email);
  res.status(200).json({ ok: true });
}

export async function resetPasswordController(req: Request, res: Response) {
  const { email, code, password } = resetPasswordSchema.parse(req.body);
  await service.resetPassword(email, code, password);
  res.status(200).json({ ok: true });
}

export async function verifyResetCodeController(req: Request, res: Response) {
  const { email, code } = verifyResetCodeSchema.parse(req.body);
  const ok = await service.verifyResetCode(email, code);
  res.status(ok ? 200 : 400).json({ ok });
}

function setAuthCookies(res: Response, access: string, refresh: string, remember = false) {
  res.cookie('access', access, cookieOpts(remember));
  res.cookie('refresh', refresh, { ...cookieOpts(remember), path: '/api/auth/refresh' });
}

function cookieOpts(remember = false) {
  const base = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    maxAge: remember ? 1000 * 60 * 60 * 24 * 30 : undefined,
  } as const;
  // domain boş ise hiç set etmeyelim (yerel geliştirme için)
  return env.COOKIE_DOMAIN ? { ...base, domain: env.COOKIE_DOMAIN } : base;
}

function cookieClearOpts() {
  // Express v5 uyarısı: clearCookie için maxAge vermeyin
  const base = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
  } as const;
  return env.COOKIE_DOMAIN ? { ...base, domain: env.COOKIE_DOMAIN } : base;
}

// parseRefresh kaldırıldı; doğrulama service içinde verify ile yapılıyor.

