"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyAssetsController = listMyAssetsController;
exports.getAssetController = getAssetController;
exports.deleteAssetController = deleteAssetController;
exports.getStorageStatsController = getStorageStatsController;
const database_1 = require("../../../config/database");
const zod_1 = require("zod");
const ApiError_1 = require("../../../shared/errors/ApiError");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const env_1 = require("../../../config/env");
const listAssetsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    kind: zod_1.z.string().optional(), // image, document, etc.
    mimeType: zod_1.z.string().optional()
});
async function listMyAssetsController(req, res) {
    const userId = req.user.id;
    const { page, limit, kind, mimeType } = listAssetsSchema.parse(req.query);
    const skip = (page - 1) * limit;
    const where = { ownerId: userId };
    if (kind)
        where.kind = kind;
    if (mimeType)
        where.mimeType = mimeType;
    const [assets, total] = await Promise.all([
        database_1.prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        database_1.prisma.asset.count({ where })
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
async function getAssetController(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const asset = await database_1.prisma.asset.findUnique({
        where: { id }
    });
    if (!asset) {
        throw (0, ApiError_1.notFound)('Asset not found');
    }
    if (asset.ownerId !== userId) {
        throw (0, ApiError_1.badRequest)('Access denied');
    }
    res.status(200).json({
        ...asset,
        url: `/uploads/${asset.path}`,
        sizeKB: Math.round(asset.bytes / 1024)
    });
}
async function deleteAssetController(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const asset = await database_1.prisma.asset.findUnique({
        where: { id }
    });
    if (!asset) {
        throw (0, ApiError_1.notFound)('Asset not found');
    }
    if (asset.ownerId !== userId) {
        throw (0, ApiError_1.badRequest)('Access denied');
    }
    try {
        // Delete physical file from PUBLIC root (assets live under public)
        const filePath = path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR, asset.path);
        await promises_1.default.unlink(filePath);
    }
    catch (error) {
        // File might already be deleted, continue with DB cleanup
        console.warn('Failed to delete physical file:', error);
    }
    // Delete from database
    await database_1.prisma.asset.delete({ where: { id } });
    res.status(204).send();
}
async function getStorageStatsController(req, res) {
    const userId = req.user.id;
    const stats = await database_1.prisma.asset.aggregate({
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
        maxMB: env_1.env.UPLOAD_MAX_SIZE_MB,
        usagePercentage: Math.round((totalBytes / (env_1.env.UPLOAD_MAX_SIZE_MB * 1024 * 1024)) * 100)
    });
}
