"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDraftOwner = ensureDraftOwner;
const database_1 = require("../../../config/database");
async function ensureDraftOwner(req, res, next) {
    try {
        const draftId = req.params.id;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const draft = await database_1.prisma.draft.findUnique({ where: { id: draftId }, select: { userId: true } });
        if (!draft)
            return res.status(404).json({ message: 'Draft not found' });
        if (draft.userId !== userId)
            return res.status(403).json({ message: 'Forbidden' });
        return next();
    }
    catch (err) {
        return next(err);
    }
}
