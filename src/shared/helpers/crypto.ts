import argon2 from 'argon2';
import { randomBytes } from 'crypto';

const ARGON2_OPTIONS: argon2.Options & { timeCost: number; memoryCost: number; parallelism: number } = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 2,
};

export async function hashPassword(plain: string): Promise<string> {
  // Use our own 16-byte random salt to avoid relying on library-generated salt
  const salt = randomBytes(16);
  return argon2.hash(plain, { ...ARGON2_OPTIONS, salt });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    // argon2.verify reads salt from the encoded hash; options like time/memory are hints only
    return await argon2.verify(hash, plain, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

export async function hashToken(plain: string): Promise<string> {
  const salt = randomBytes(16);
  return argon2.hash(plain, { ...ARGON2_OPTIONS, timeCost: 2, salt });
}

export async function verifyTokenHash(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

