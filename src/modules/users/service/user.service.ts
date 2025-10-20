import { getUserWithProfile, upsertUserProfile } from '../repository/userProfileRepo';
import { UpdateProfileDto } from '../dto/profile.dto';
import { notFound } from '../../../shared/errors/ApiError';
import { prisma } from '../../../config/database';
import { verifyPassword, hashPassword } from '../../../shared/helpers/crypto';

export class UserService {
  async me(userId: string) {
    const user = await getUserWithProfile(userId);
    if (!user) throw notFound('User not found');
    const p: any = (user as any).profile ?? null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,

      profile: p ? {
        phone: p.phone ?? null,
        phoneVerifiedAt: p.phoneVerifiedAt ?? null,
        company: p.company ?? null,
        address1: p.address1 ?? null,
        address2: p.address2 ?? null,
        city: p.city ?? null,
        state: p.state ?? null,
        postalCode: p.postalCode ?? null,
        country: p.country ?? null,
        preferences: p.preferences ?? null,
        isArtist: p.isArtist ?? null,
        specialization: p.specialization ?? null,
        revenueShareAcceptedAt: p.revenueShareAcceptedAt ?? null,
        artistBio: p.artistBio ?? null,
        isAvailable: p.isAvailable ?? null,
        iban: p.iban ?? null,
        behanceUrl: p.behanceUrl ?? null,
        dribbbleUrl: p.dribbbleUrl ?? null,
        linkedinUrl: p.linkedinUrl ?? null,
        websiteUrl: p.websiteUrl ?? null,
      } : null,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    // If phone changed, reset verification flag
    if (typeof data?.phone !== 'undefined') {
      const current = await prisma.userProfile.findUnique({ where: { userId } });
      const incoming = data.phone ?? null;
      const changed = (current?.phone ?? null) !== incoming;
      if (changed) {
        await prisma.userProfile.upsert({
          where: { userId },
          update: { phone: incoming, phoneVerifiedAt: null },
          create: { userId, phone: incoming, phoneVerifiedAt: null },
        });
        const next = await prisma.userProfile.findUnique({ where: { userId } });
        return next;
      }
    }
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

