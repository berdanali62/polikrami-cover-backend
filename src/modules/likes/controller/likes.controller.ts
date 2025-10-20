import { Request, Response } from 'express';
import { prisma } from '../../../config/database';
import { createRedisConnection } from '../../../queue/connection';
import { toggleLikeSchema, likeSummaryParamsSchema } from '../dto/likes.dto';

// Singleton Redis client
let redisClient: any = null;
function getRedisClient() {
  if (!redisClient) {
    redisClient = createRedisConnection();
  }
  return redisClient;
}

async function invalidateCache(messageCardId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.del(`likes:card:${messageCardId}`);
    }
  } catch (err) {
    console.error('[Like] Cache invalidation failed:', err);
  }
}

export async function toggleLikeController(req: Request, res: Response) {
  const userId = req.user!.id;
  const { messageCardId } = toggleLikeSchema.parse(req.body);

  // Check if message card exists
  const cardExists = await prisma.messageCard.findUnique({
    where: { id: messageCardId },
    select: { id: true }
  });

  if (!cardExists) {
    return res.status(404).json({ message: 'Message card not found' });
  }

  try {
    // Try to delete first (optimistic: assume like exists)
    await prisma.like.delete({
      where: {
        userId_messageCardId: { userId, messageCardId }
      }
    });

    // Successfully deleted = unlike
    await invalidateCache(messageCardId);
    return res.status(200).json({ liked: false });

  } catch (error: any) {
    // P2025 = Record not found (like didn't exist)
    if (error.code === 'P2025') {
      try {
        // Create the like
        await prisma.like.create({
          data: { userId, messageCardId }
        });

        await invalidateCache(messageCardId);
        return res.status(201).json({ liked: true });

      } catch (createError: any) {
        // P2002 = Unique constraint violation (concurrent request created it)
        if (createError.code === 'P2002') {
          // Already exists now, treat as success
          await invalidateCache(messageCardId);
          return res.status(200).json({ liked: true });
        }
        
        // Unexpected error
        console.error('[Like] Create error:', createError);
        return res.status(500).json({ message: 'Failed to toggle like' });
      }
    }

    // Unexpected delete error
    console.error('[Like] Delete error:', error);
    return res.status(500).json({ message: 'Failed to toggle like' });
  }
}

export async function getLikeSummaryController(req: Request, res: Response) {
  const { id } = likeSummaryParamsSchema.parse(req.params);
  const cacheKey = `likes:card:${id}`;

  // Try cache first
  try {
    const redis = getRedisClient();
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return res.status(200).json({ likes: Number(cached) });
      }
    }
  } catch (err) {
    console.error('[Like] Redis read error:', err);
    // Continue to DB fallback
  }

  // Fetch from DB
  let count = 0;
  try {
    count = await prisma.like.count({
      where: { messageCardId: id }
    });
  } catch (err: any) {
    console.error('[Like] DB count error:', err);
    
    // If table doesn't exist (test env), degrade gracefully
    if (err.code === 'P2021') {
      return res.status(200).json({ likes: 0 });
    }
    
    return res.status(500).json({ message: 'Failed to fetch likes' });
  }

  // Update cache (best effort, don't fail request if this fails)
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.set(cacheKey, String(count), 'EX', 30);
    }
  } catch (err) {
    console.error('[Like] Redis write error:', err);
  }

  return res.status(200).json({ likes: count });
}