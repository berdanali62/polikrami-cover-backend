import { Request, Response } from 'express';
import { UserService } from '../service/user.service';
import { changePasswordSchema } from '../dto/password.dto';
import { sendPhoneCodeSchema, verifyPhoneCodeSchema } from '../dto/phone-verification.dto';
import { UserVerificationService } from '../service/userVerification.service';
import { firebaseVerifySchema } from '../dto/phone-verification.dto';
import { verifyFirebaseIdToken } from '../../../shared/firebase/admin';
import { prisma } from '../../../config/database';
import { env } from '../../../config/env';

const service = new UserService();
const verifyService = new UserVerificationService();

export async function meController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const me = await service.me(userId);
  res.status(200).json({ success: true, data: me });
}

export async function updateProfileController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const updated = await service.updateProfile(userId, req.body);
  res.status(200).json({ success: true, data: updated });
}

export async function changePasswordController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const result = await service.changePassword(userId, currentPassword, newPassword);
  if (!result.ok) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: result.message } });
  res.status(200).json({ success: true });
}

export async function sendPhoneCodeController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const { phone } = sendPhoneCodeSchema.parse(req.body);
  await verifyService.sendPhoneCode(userId, phone);
  res.status(200).json({ success: true });
}

export async function verifyPhoneCodeController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const { phone, code } = verifyPhoneCodeSchema.parse(req.body);
  const ok = await verifyService.verifyPhoneCode(userId, phone, code);
  if (!ok) return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired code' } });
  res.status(200).json({ success: true });
}

export async function firebasePhoneVerifyController(req: Request, res: Response) {
  if (env.PHONE_VERIFY_PROVIDER !== 'firebase') return res.status(400).json({ success: false, error: { code: 'PROVIDER_DISABLED', message: 'Firebase provider disabled' } });
  const userId = req.user?.id as string;
  const { idToken } = firebaseVerifySchema.parse(req.body);
  const decoded = await verifyFirebaseIdToken(idToken);
  if (!decoded || !decoded.phoneNumber) return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid Firebase token' } });
  await prisma.userProfile.upsert({
    where: { userId },
    update: { phone: decoded.phoneNumber, phoneVerifiedAt: new Date() },
    create: { userId, phone: decoded.phoneNumber, phoneVerifiedAt: new Date() },
  });
  res.status(200).json({ success: true, data: { phone: decoded.phoneNumber } });
}




