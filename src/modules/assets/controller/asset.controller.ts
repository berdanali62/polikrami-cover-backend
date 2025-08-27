import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { z } from 'zod';
import { notFound, badRequest } from '../../../shared/errors/ApiError';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../../config/env';

const listAssetsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  kind: z.string().optional(), // image, document, etc.
  mimeType: z.string().optional()
});

export async function listMyAssetsController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { page, limit, kind, mimeType } = listAssetsSchema.parse(req.query);
  const skip = (page - 1) * limit;
  
  const where: any = { ownerId: userId };
  if (kind) where.kind = kind;
  if (mimeType) where.mimeType = mimeType;
  
  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.asset.count({ where })
  ]);
  
  res.status(200).json({
    assets: assets.map(asset => ({
      ...asset,
      url: `/uploads/${asset.path}`,
      sizeKB: Math.round(asset.bytes / 1024)
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}

export async function getAssetController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user!.id;
  
  const asset = await prisma.asset.findUnique({
    where: { id }
  });
  
  if (!asset) {
    throw notFound('Asset not found');
  }
  
  if (asset.ownerId !== userId) {
    throw badRequest('Access denied');
  }
  
  res.status(200).json({
    ...asset,
    url: `/uploads/${asset.path}`,
    sizeKB: Math.round(asset.bytes / 1024)
  });
}

export async function deleteAssetController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const userId = req.user!.id;
  
  const asset = await prisma.asset.findUnique({
    where: { id }
  });
  
  if (!asset) {
    throw notFound('Asset not found');
  }
  
  if (asset.ownerId !== userId) {
    throw badRequest('Access denied');
  }
  
  try {
    // Delete physical file
    const filePath = path.join(env.UPLOAD_DIR, asset.path);
    await fs.unlink(filePath);
  } catch (error) {
    // File might already be deleted, continue with DB cleanup
    console.warn('Failed to delete physical file:', error);
  }
  
  // Delete from database
  await prisma.asset.delete({ where: { id } });
  
  res.status(204).send();
}

export async function getStorageStatsController(req: Request, res: Response) {
  const userId = req.user!.id;
  
  const stats = await prisma.asset.aggregate({
    where: { ownerId: userId },
    _sum: { bytes: true },
    _count: { id: true }
  });
  
  const totalBytes = stats._sum.bytes || 0;
  const totalFiles = stats._count.id || 0;
  
  res.status(200).json({
    totalFiles,
    totalBytes,
    totalMB: Math.round(totalBytes / (1024 * 1024)),
    maxMB: env.UPLOAD_MAX_SIZE_MB,
    usagePercentage: Math.round((totalBytes / (env.UPLOAD_MAX_SIZE_MB * 1024 * 1024)) * 100)
  });
}
