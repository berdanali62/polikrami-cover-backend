import { Request, Response } from 'express';
import { UserService } from '../service/user.service';
import { changePasswordSchema } from '../dto/password.dto';

const service = new UserService();

export async function meController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const me = await service.me(userId);
  res.status(200).json(me);
}

export async function updateProfileController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const updated = await service.updateProfile(userId, req.body);
  res.status(200).json(updated);
}

export async function changePasswordController(req: Request, res: Response) {
  const userId = req.user?.id as string;
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const result = await service.changePassword(userId, currentPassword, newPassword);
  if (!result.ok) return res.status(400).json({ message: result.message });
  res.status(200).json({ ok: true });
}

