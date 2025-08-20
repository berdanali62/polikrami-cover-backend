import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';

type JwtKind = 'access' | 'refresh';

export interface AccessTokenPayload {
  userId: string;
  role?: string;
  typ: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  tid: string; // refresh token id
  typ: 'refresh';
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'typ'>): string {
  const options: SignOptions = { algorithm: 'HS256', expiresIn: durationToSeconds(env.ACCESS_EXPIRES_IN) };
  return jwt.sign({ ...payload, typ: 'access' } as AccessTokenPayload, env.JWT_ACCESS_SECRET as Secret, options);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'typ'>): string {
  const options: SignOptions = { algorithm: 'HS256', expiresIn: durationToSeconds(env.REFRESH_EXPIRES_IN) };
  return jwt.sign({ ...payload, typ: 'refresh' } as RefreshTokenPayload, env.JWT_REFRESH_SECRET as Secret, options);
}

export function verifyToken<T>(token: string, kind: JwtKind): T | null {
  try {
    const secret = kind === 'access' ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
    return jwt.verify(token, secret) as T;
  } catch {
    return null;
  }
}

export function decodeWithoutVerify<T>(token: string): T | null {
  try {
    const payload = jwt.decode(token) as T | null;
    return payload ?? null;
  } catch {
    return null;
  }
}

function durationToSeconds(spec: string): number {
  // supports e.g. "900s", "15m", "1h", "30d"
  const m = spec.match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const v = Number(m[1]);
  const u = m[2];
  if (u === 's') return v;
  if (u === 'm') return v * 60;
  if (u === 'h') return v * 60 * 60;
  if (u === 'd') return v * 24 * 60 * 60;
  return 0;
}

