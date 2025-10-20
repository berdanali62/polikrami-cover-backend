import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../config/database';

export async function ensureAssignedDesignerOrAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const draftId = req.params.id as string;
    const userId = req.user?.id as string | undefined;
    const role = req.user?.role as string | undefined;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (role === 'admin') return next();

    const draft = await prisma.draft.findUnique({ where: { id: draftId }, select: { assignedDesignerId: true } });
    if (!draft) return res.status(404).json({ message: 'Draft not found' });
    if (!draft.assignedDesignerId || draft.assignedDesignerId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  } catch (err) {
    return next(err as unknown as Error);
  }
}


