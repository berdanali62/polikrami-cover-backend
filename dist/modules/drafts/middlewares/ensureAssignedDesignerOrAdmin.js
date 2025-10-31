"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAssignedDesignerOrAdmin = ensureAssignedDesignerOrAdmin;
const database_1 = require("../../../config/database");
async function ensureAssignedDesignerOrAdmin(req, res, next) {
    try {
        const draftId = req.params.id;
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (role === 'admin')
            return next();
        const draft = await database_1.prisma.draft.findUnique({ where: { id: draftId }, select: { assignedDesignerId: true } });
        if (!draft)
            return res.status(404).json({ message: 'Draft not found' });
        if (!draft.assignedDesignerId || draft.assignedDesignerId !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    }
    catch (err) {
        return next(err);
    }
}
