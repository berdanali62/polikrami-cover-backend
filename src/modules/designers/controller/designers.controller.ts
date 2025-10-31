import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { getDesignersBasic } from '../service/recommendation.service';
import { buildRecommendedSlate, getDesignerStats } from '../service/recommendation.service';
import { createReviewSchema, designersListQuerySchema, listReviewsQuerySchema } from '../dto/review.dto';

export async function listDesignersController(_req: Request, res: Response) {
  // Delegate to service function to respect layering
  const designerUsers = await getDesignersBasic();
  res.status(200).json({ success: true, data: designerUsers });
}

export async function recommendedDesignersController(_req: Request, res: Response) {
  const stats = await getDesignerStats();
  const { slate, rest } = buildRecommendedSlate(stats, 3);
  res.status(200).json({ success: true, data: { slate, rest } });
}

export async function listDesignersSortedController(req: Request, res: Response) {
  const { sort } = designersListQuerySchema.parse(req.query);
  const stats = await getDesignerStats();
  if (sort === 'rating') {
    const sorted = stats.sort((a, b) => (b.ratingAvg - a.ratingAvg) || (b.ratingCount - a.ratingCount));
    return res.status(200).json({ success: true, data: { designers: sorted } });
  }
  if (sort === 'newest') {
    const sorted = stats.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return res.status(200).json({ success: true, data: { designers: sorted } });
  }
  if (sort === 'active30d') {
    const sorted = stats.sort((a, b) => b.recentJobs30d - a.recentJobs30d);
    return res.status(200).json({ success: true, data: { designers: sorted } });
  }
  // default: recommended
  const { slate, rest } = buildRecommendedSlate(stats, 3);
  res.status(200).json({ success: true, data: { slate, rest } });
}

export async function createReviewController(req: Request, res: Response) {
  const reviewerId = req.user!.id;
  const designerId = req.params.id as string;
  const { rating, comment } = createReviewSchema.parse(req.body);
  // ensure target is designer role
  const isDesigner = await prisma.user.findFirst({ where: { id: designerId, roles: { some: { role: { name: 'designer' } } } }, select: { id: true } });
  if (!isDesigner) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Designer not found' } });
  // upsert by unique(designerId, reviewerId)
  const existing = await prisma.designerReview.findUnique({ where: { designerId_reviewerId: { designerId, reviewerId } } }).catch(() => null);
  let review;
  if (existing) {
    review = await prisma.designerReview.update({ where: { designerId_reviewerId: { designerId, reviewerId } }, data: { rating, comment } });
  } else {
    review = await prisma.designerReview.create({ data: { designerId, reviewerId, rating, comment } });
  }
  res.status(201).json({ success: true, data: { id: review.id, rating: review.rating, comment: review.comment } });
}

export async function listReviewsController(req: Request, res: Response) {
  const designerId = req.params.id as string;
  const { page, limit } = listReviewsQuerySchema.parse(req.query);
  const [items, total] = await Promise.all([
    prisma.designerReview.findMany({ where: { designerId }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.designerReview.count({ where: { designerId } }),
  ]);
  res.status(200).json({ success: true, data: { items, total, page, limit } });
}

