"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const asyncHandler_1 = require("../../shared/helpers/asyncHandler");
const validation_1 = require("../../middlewares/validation");
const zod_1 = require("zod");
const ai_controller_1 = require("./controller/ai.controller");
const prompt_controller_1 = require("./controller/prompt.controller");
const ai_dto_1 = require("./dto/ai.dto");
const aiRateLimit_1 = require("../../middlewares/aiRateLimit");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const env_1 = require("../../config/env");
const router = (0, express_1.Router)({ mergeParams: true });
const idParam = zod_1.z.object({ id: zod_1.z.string().uuid() });
router.post('/drafts/:id/ai/generate', auth_1.requireAuth, aiRateLimit_1.aiRateLimit, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(ai_dto_1.generateSchema), (0, asyncHandler_1.asyncHandler)(ai_controller_1.generateController));
router.get('/drafts/:id/ai/results', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, asyncHandler_1.asyncHandler)(ai_controller_1.resultsController));
router.post('/drafts/:id/ai/select', auth_1.requireAuth, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(ai_dto_1.selectSchema), (0, asyncHandler_1.asyncHandler)(ai_controller_1.selectController));
router.post('/drafts/:id/ai/regen', auth_1.requireAuth, aiRateLimit_1.aiRateLimit, (0, validation_1.validateParams)(idParam), (0, validation_1.validateBody)(ai_dto_1.regenSchema), (0, asyncHandler_1.asyncHandler)(ai_controller_1.regenController));
// Prompt templates
router.get('/ai/templates', (0, asyncHandler_1.asyncHandler)(prompt_controller_1.listTemplatesController));
router.post('/ai/templates/render', (0, asyncHandler_1.asyncHandler)(prompt_controller_1.renderTemplateController));
// Private original download (authorized owner or assigned designer)
router.get('/drafts/:id/ai/original/:imageKey', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const draftId = req.params.id;
    const draft = await (await Promise.resolve().then(() => __importStar(require('../../config/database')))).prisma.draft.findUnique({ where: { id: draftId } });
    if (!draft || (draft.userId !== userId && draft.assignedDesignerId !== userId))
        return res.status(403).json({ message: 'Forbidden' });
    const imageKey = req.params.imageKey;
    const baseDir = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR, 'tmp', 'ai');
    const candidatePath = path_1.default.join(baseDir, imageKey);
    const relative = path_1.default.relative(baseDir, candidatePath);
    if (relative.startsWith('..') || path_1.default.isAbsolute(relative)) {
        return res.status(400).json({ message: 'Invalid imageKey' });
    }
    if (path_1.default.extname(candidatePath).toLowerCase() !== '.png') {
        return res.status(400).json({ message: 'Invalid file type' });
    }
    try {
        const stat = await promises_1.default.stat(candidatePath);
        if (!stat.isFile())
            return res.status(404).json({ message: 'Not found' });
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', String(stat.size));
        res.sendFile(candidatePath);
    }
    catch {
        res.status(404).json({ message: 'Not found' });
    }
}));
exports.default = router;
