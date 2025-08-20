import { prisma } from '../../../config/database';
import { UpdateProfileDto } from '../dto/profile.dto';
import { Prisma } from '@prisma/client';

export async function getUserWithProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
}

export async function upsertUserProfile(userId: string, data: UpdateProfileDto) {
  const { preferences, ...rest } = data ?? {};
  const normalized = {
    ...rest,
    ...(preferences === undefined
      ? {}
      : { preferences: preferences === null ? Prisma.JsonNull : (preferences as Prisma.InputJsonValue) }),
  };

  return prisma.userProfile.upsert({
    where: { userId },
    update: normalized,
    create: { userId, ...normalized },
  });
}

