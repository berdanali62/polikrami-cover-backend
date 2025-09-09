import argon2 from 'argon2';
import { randomBytes } from 'crypto';

export type HashingKind = 'password' | 'token';

export interface Argon2Options {
  timeCost?: number;
  memoryCost?: number;
  parallelism?: number;
  saltLength?: number; // default 16
}

const DEFAULTS = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 2,
  saltLength: 16,
} as const;

export interface HashingModuleConfig extends Argon2Options {}

export class Argon2idHasher {
  private readonly timeCost: number;
  private readonly memoryCost: number;
  private readonly parallelism: number;
  private readonly saltLength: number;

  constructor(config?: HashingModuleConfig) {
    this.timeCost = config?.timeCost ?? DEFAULTS.timeCost;
    this.memoryCost = config?.memoryCost ?? DEFAULTS.memoryCost;
    this.parallelism = config?.parallelism ?? DEFAULTS.parallelism;
    this.saltLength = config?.saltLength ?? DEFAULTS.saltLength;
  }

  async hashPassword(plain: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    return argon2.hash(plain, {
      type: argon2.argon2id,
      timeCost: this.timeCost,
      memoryCost: this.memoryCost,
      parallelism: this.parallelism,
      salt,
    });
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  async hashToken(plain: string): Promise<string> {
    const salt = randomBytes(this.saltLength);
    return argon2.hash(plain, {
      type: argon2.argon2id,
      timeCost: Math.max(1, this.timeCost - 1),
      memoryCost: this.memoryCost,
      parallelism: this.parallelism,
      salt,
    });
  }

  async verifyTokenHash(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}

export function createDefaultHasher(): Argon2idHasher {
  return new Argon2idHasher();
}


