import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { hashToken, verifyTokenHash } from '../../../shared/helpers/crypto';
import { sendSms } from '../../../shared/sms/sms';

export class UserVerificationService {
  async sendPhoneCode(userId: string, phone: string): Promise<void> {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 1000 * 60 * env.PHONE_VERIFY_CODE_EXPIRE_MINUTES);
    const tokenHash = await hashToken(code);

    await prisma.phoneVerificationToken.create({ data: { userId, phone, tokenHash, expiresAt } });

    await sendSms({ to: phone, body: `Doğrulama kodunuz: ${code}` });

    if (process.env.NODE_ENV === 'test') {
      // Store last code in memory for tests (no-op in prod)
      (global as any).__LAST_PHONE_CODE__ = { userId, phone, code };
    }
  }

  async verifyPhoneCode(userId: string, phone: string, code: string): Promise<boolean> {
    const token = await prisma.phoneVerificationToken.findFirst({
      where: { userId, phone, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) return false;
    const ok = await verifyTokenHash(token.tokenHash, code);
    if (!ok) return false;
    await prisma.$transaction([
      prisma.userProfile.upsert({
        where: { userId },
        update: { phone, phoneVerifiedAt: new Date() },
        create: { userId, phone, phoneVerifiedAt: new Date() },
      }),
      prisma.phoneVerificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    ]);
    return true;
  }
}


