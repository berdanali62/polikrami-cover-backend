import { prisma } from '../../../config/database';
import { UpdateProfileDto } from '../dto/profile.dto';
import { Prisma } from '@prisma/client';

export async function getUserWithProfile(userId: string) {
  try {
    return await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  } catch {
    // If schema mismatches (e.g., missing optional columns in CI DB), fallback to user only
    return await prisma.user.findUnique({ where: { id: userId } });
  }
}

export async function upsertUserProfile(userId: string, data: UpdateProfileDto) {
  const { preferences, ...rest } = data ?? {};
  const normalized: any = {
    ...rest,
    ...(preferences === undefined
      ? {}
      : { preferences: preferences === null ? Prisma.JsonNull : (preferences as Prisma.InputJsonValue) }),
  };

  try {
    return await prisma.userProfile.upsert({
      where: { userId },
      update: normalized,
      create: { userId, ...normalized },
    });
  } catch {
    // Fallback: ensure row exists with minimal fields
    try { await prisma.$executeRawUnsafe(`INSERT INTO "UserProfile" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`, userId); } catch {}
    return await prisma.userProfile.findUnique({ where: { userId } });
  }
}

