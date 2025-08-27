import { Request, Response } from 'express';
import { prisma } from '../../../config/database';

export async function listDesignersController(_req: Request, res: Response) {
  // Optimized single query with JOIN instead of separate queries
  const designerUsers = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: {
            name: 'designer'
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      profile: true
    }
  });
  
  res.status(200).json(designerUsers);
}

