import { getUserWithProfile, upsertUserProfile } from '../repository/userProfileRepo';
import { UpdateProfileDto } from '../dto/profile.dto';
import { notFound } from '../../../shared/errors/ApiError';
import { prisma } from '../../../config/database';
import { verifyPassword, hashPassword } from '../../../shared/helpers/crypto';

export class UserService {
  async me(userId: string) {
    const user = await getUserWithProfile(userId);
    if (!user) throw notFound('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      profile: user.profile ?? null,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const profile = await upsertUserProfile(userId, data);
    return profile;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw notFound('User not found');
    const ok = await verifyPassword(user.password, currentPassword);
    if (!ok) {
      return { ok: false, message: 'Mevcut şifre hatalı' } as const;
    }
    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { ok: true } as const;
  }
}

