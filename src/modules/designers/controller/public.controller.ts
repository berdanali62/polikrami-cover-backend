import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { z } from 'zod';

export async function publicProfileController(req: Request, res: Response) {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      // Public-only profile fields
      profile: {
        select: {
          artistBio: true,
          specialization: true,
          isAvailable: true,
          behanceUrl: true,
          dribbbleUrl: true,
          linkedinUrl: true,
          websiteUrl: true,
        }
      },
      designerReviewsReceived: { select: { rating: true }, take: 1000 },
    },
  });
  if (!user) return res.status(404).json({ message: 'Designer not found' });
  const ratings = user.designerReviewsReceived || [];
  const ratingCount = ratings.length;
  const ratingAvg = ratingCount ? ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / ratingCount : 0;
  res.status(200).json({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    profile: user.profile,
    rating: { avg: ratingAvg, count: ratingCount },
  });
}

export async function searchDesignersController(req: Request, res: Response) {
  const { q, skill, limit } = z.object({
    q: z.string().optional(),
    skill: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }).parse(req.query);

  const where: any = {
    roles: { some: { role: { name: 'designer' } } },
  };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { profile: { is: { artistBio: { contains: q, mode: 'insensitive' } } } },
    ];
  }
  if (skill) {
    where.profile = { is: { specialization: { contains: skill, mode: 'insensitive' } } };
  }

  const designers = await prisma.user.findMany({
    where,
    select: { id: true, name: true, avatarUrl: true, profile: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ items: designers });
}


