"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftRepository = void 0;
// src/modules/drafts/repository/draft.repository.ts
const database_1 = require("../../../config/database");
class DraftRepository {
    /**
     * Create a new draft
     */
    async create(data) {
        return database_1.prisma.draft.create({ data: data });
    }
    /**
     * Find draft by ID
     */
    async findById(id) {
        return database_1.prisma.draft.findUnique({ where: { id } });
    }
    /**
     * Find draft with relations
     */
    async findWithRelations(id) {
        return database_1.prisma.draft.findUnique({
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
    async findMany(params) {
        return database_1.prisma.draft.findMany(params);
    }
    /**
     * Update draft
     */
    async update(id, data) {
        return database_1.prisma.draft.update({
            where: { id },
            data
        });
    }
    /**
     * Delete draft
     */
    async delete(id) {
        return database_1.prisma.draft.delete({ where: { id } });
    }
    /**
     * Count drafts
     */
    async count(where) {
        return database_1.prisma.draft.count({ where });
    }
    /**
     * Find drafts by user with pagination
     */
    async findByUser(userId, options) {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (options?.status) {
            where.workflowStatus = options.status;
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
    async findByDesigner(designerId, options) {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            assignedDesignerId: designerId
        };
        if (options?.status && options.status.length > 0) {
            where.workflowStatus = { in: options.status };
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
exports.DraftRepository = DraftRepository;
