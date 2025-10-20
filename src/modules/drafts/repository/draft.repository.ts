// src/modules/drafts/repository/draft.repository.ts
import { prisma } from '../../../config/database';
import { Prisma, Draft } from '@prisma/client';
import { DraftWithRelations } from '../types/draft.type';

export class DraftRepository {
  /**
   * Create a new draft
   */
  async create(data: Prisma.DraftUncheckedCreateInput | Prisma.DraftCreateInput): Promise<Draft> {
    return prisma.draft.create({ data: data as any });
  }

  /**
   * Find draft by ID
   */
  async findById(id: string): Promise<Draft | null> {
    return prisma.draft.findUnique({ where: { id } });
  }

  /**
   * Find draft with relations
   */
  async findWithRelations(id: string): Promise<DraftWithRelations | null> {
    return prisma.draft.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messageCard: true,
        assignedDesigner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Find many drafts with filters
   */
  async findMany(params: {
    where?: Prisma.DraftWhereInput;
    orderBy?: Prisma.DraftOrderByWithRelationInput;
    skip?: number;
    take?: number;
    include?: Prisma.DraftInclude;
  }): Promise<Draft[]> {
    return prisma.draft.findMany(params);
  }

  /**
   * Update draft
   */
  async update(
    id: string,
    data: Prisma.DraftUpdateInput
  ): Promise<Draft> {
    return prisma.draft.update({
      where: { id },
      data
    });
  }

  /**
   * Delete draft
   */
  async delete(id: string): Promise<Draft> {
    return prisma.draft.delete({ where: { id } });
  }

  /**
   * Count drafts
   */
  async count(where?: Prisma.DraftWhereInput): Promise<number> {
    return prisma.draft.count({ where });
  }

  /**
   * Find drafts by user with pagination
   */
  async findByUser(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DraftWhereInput = { userId };
    
    if (options?.status) {
      where.workflowStatus = options.status as any;
    }

    const [drafts, total] = await Promise.all([
      this.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          messageCard: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true
            }
          },
          assignedDesigner: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      this.count(where)
    ]);

    return {
      data: drafts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find drafts assigned to designer
   */
  async findByDesigner(
    designerId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string[];
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DraftWhereInput = {
      assignedDesignerId: designerId
    };

    if (options?.status && options.status.length > 0) {
      where.workflowStatus = { in: options.status as any[] };
    }

    const [drafts, total] = await Promise.all([
      this.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          messageCard: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      this.count(where)
    ]);

    return {
      data: drafts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}