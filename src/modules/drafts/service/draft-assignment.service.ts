import { PrismaClient } from '@prisma/client';
import { TransactionManager, TransactionConfig } from '../../../config/transaction';
import { badRequest, notFound } from '../../../shared/errors/ApiError';

export class DraftAssignmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Assign designer to draft with concurrency protection
   */
  async assignDesigner(
    draftId: string, 
    designerId: string, 
    assignedBy: string
  ): Promise<{ success: boolean; message: string }> {
    const transactionManager = new TransactionManager(this.prisma);
    
    return transactionManager.executeWithIsolation(
      async (tx) => {
        // 1. Check if draft exists and is available for assignment
        const draft = await tx.draft.findUnique({
          where: { id: draftId },
          select: {
            id: true,
            userId: true,
            assignedDesignerId: true,
            status: true,
            committedAt: true
          }
        });

        if (!draft) {
          throw notFound('Draft not found');
        }

        if (draft.committedAt) {
          throw badRequest('Cannot assign designer to committed draft');
        }

        if (draft.status !== 'ready') {
          throw badRequest('Draft must be in ready status for assignment');
        }

        // 2. Check if designer is already assigned
        if (draft.assignedDesignerId) {
          if (draft.assignedDesignerId === designerId) {
            return { success: true, message: 'Designer already assigned' };
          }
          throw badRequest('Draft already has an assigned designer');
        }

        // 3. Check if designer exists and is available
        const designer = await tx.user.findUnique({
          where: { id: designerId },
          select: {
            id: true,
            roles: {
              where: { role: { name: 'designer' } },
              select: { role: { select: { name: true } } }
            }
          }
        });

        if (!designer || designer.roles.length === 0) {
          throw badRequest('User is not a designer');
        }

        // 4. Check designer's current workload
        const designerWorkload = await tx.draft.count({
          where: {
            assignedDesignerId: designerId,
            status: { in: ['assigned', 'in_progress'] },
            committedAt: null
          }
        });

        const maxWorkload = 5; // Maximum concurrent drafts per designer
        if (designerWorkload >= maxWorkload) {
          throw badRequest('Designer has reached maximum workload');
        }

        // 5. Assign designer atomically
        const updatedDraft = await tx.draft.update({
          where: { 
            id: draftId,
            assignedDesignerId: null // Ensure no concurrent assignment
          },
          data: {
            assignedDesignerId: designerId,
            status: 'assigned',
            updatedAt: new Date()
          },
          select: {
            id: true,
            assignedDesignerId: true,
            status: true
          }
        });

        // 6. Log assignment
        await tx.draftAssignmentLog.create({
          data: {
            draftId,
            designerId,
            assignedBy,
            action: 'assigned',
            timestamp: new Date()
          }
        });

        return { 
          success: true, 
          message: 'Designer assigned successfully' 
        };
      },
      TransactionConfig.DESIGNER_ASSIGNMENT
    );
  }

  /**
   * Unassign designer from draft
   */
  async unassignDesigner(
    draftId: string,
    unassignedBy: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const transactionManager = new TransactionManager(this.prisma);
    
    return transactionManager.executeWithIsolation(
      async (tx) => {
        const draft = await tx.draft.findUnique({
          where: { id: draftId },
          select: {
            id: true,
            assignedDesignerId: true,
            status: true,
            committedAt: true
          }
        });

        if (!draft) {
          throw notFound('Draft not found');
        }

        if (!draft.assignedDesignerId) {
          return { success: true, message: 'No designer assigned' };
        }

        if (draft.committedAt) {
          throw badRequest('Cannot unassign designer from committed draft');
        }

        // Unassign designer
        await tx.draft.update({
          where: { id: draftId },
          data: {
            assignedDesignerId: null,
            status: 'ready',
            updatedAt: new Date()
          }
        });

        // Log unassignment
        await tx.draftAssignmentLog.create({
          data: {
            draftId,
            designerId: draft.assignedDesignerId,
            assignedBy: unassignedBy,
            action: 'unassigned',
            reason,
            timestamp: new Date()
          }
        });

        return { 
          success: true, 
          message: 'Designer unassigned successfully' 
        };
      },
      TransactionConfig.DESIGNER_ASSIGNMENT
    );
  }

  /**
   * Get designer workload
   */
  async getDesignerWorkload(designerId: string): Promise<{
    current: number;
    max: number;
    drafts: Array<{ id: string; status: string; createdAt: Date }>;
  }> {
    const designer = await this.prisma.user.findUnique({
      where: { id: designerId },
      select: {
        id: true,
        roles: {
          where: { role: { name: 'designer' } },
          select: { role: { select: { name: true } } }
        }
      }
    });

    if (!designer || designer.roles.length === 0) {
      throw badRequest('User is not a designer');
    }

    const drafts = await this.prisma.draft.findMany({
      where: {
        assignedDesignerId: designerId,
        workflowStatus: { in: ['APPROVED', 'IN_PROGRESS', 'PREVIEW_SENT'] }, // Changed from status to workflowStatus
        committedAt: null
      },
      select: {
        id: true,
        workflowStatus: true, // Changed from status to workflowStatus
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      current: drafts.length,
      max: 5,
      drafts: drafts.map(d => ({
        id: d.id,
        status: d.workflowStatus, // Map workflowStatus to status for compatibility
        createdAt: d.createdAt
      }))
    };
  }

  /**
   * Reassign designer with concurrency protection
   */
  async reassignDesigner(
    draftId: string,
    newDesignerId: string,
    reassignedBy: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const transactionManager = new TransactionManager(this.prisma);
    
    return transactionManager.executeWithIsolation(
      async (tx) => {
        const draft = await tx.draft.findUnique({
          where: { id: draftId },
          select: {
            id: true,
            assignedDesignerId: true,
            status: true,
            committedAt: true
          }
        });

        if (!draft) {
          throw notFound('Draft not found');
        }

        if (draft.committedAt) {
          throw badRequest('Cannot reassign designer for committed draft');
        }

        if (!draft.assignedDesignerId) {
          throw badRequest('No designer currently assigned');
        }

        if (draft.assignedDesignerId === newDesignerId) {
          return { success: true, message: 'Designer is already assigned' };
        }

        // Check new designer availability
        const newDesigner = await tx.user.findUnique({
          where: { id: newDesignerId },
          select: {
            id: true,
            roles: {
              where: { role: { name: 'designer' } },
              select: { role: { select: { name: true } } }
            }
          }
        });

        if (!newDesigner || newDesigner.roles.length === 0) {
          throw badRequest('New user is not a designer');
        }

        // Check new designer workload
        const newDesignerWorkload = await tx.draft.count({
          where: {
            assignedDesignerId: newDesignerId,
            status: { in: ['assigned', 'in_progress'] },
            committedAt: null
          }
        });

        if (newDesignerWorkload >= 5) {
          throw badRequest('New designer has reached maximum workload');
        }

        // Reassign atomically
        await tx.draft.update({
          where: { id: draftId },
          data: {
            assignedDesignerId: newDesignerId,
            status: 'assigned',
            updatedAt: new Date()
          }
        });

        // Log reassignment
        await tx.draftAssignmentLog.create({
          data: {
            draftId,
            designerId: newDesignerId,
            assignedBy: reassignedBy,
            action: 'reassigned',
            reason,
            previousDesignerId: draft.assignedDesignerId,
            timestamp: new Date()
          }
        });

        return { 
          success: true, 
          message: 'Designer reassigned successfully' 
        };
      },
      TransactionConfig.DESIGNER_ASSIGNMENT
    );
  }
}
