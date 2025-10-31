"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftUploadService = void 0;
const env_1 = require("../../../config/env");
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const ApiError_1 = require("../../../shared/errors/ApiError");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../../../utils/logger");
class DraftUploadService {
    allowedMimeTypes;
    maxSizeMB;
    uploadDir;
    constructor() {
        this.allowedMimeTypes = env_1.env.UPLOAD_ALLOWED_MIME;
        this.maxSizeMB = env_1.env.UPLOAD_MAX_SIZE_MB;
        this.uploadDir = env_1.env.UPLOAD_PUBLIC_DIR;
    }
    async createUploadUrl(draftId, contentType) {
        const mimeType = this.validateAndGetMimeType(contentType);
        const fileId = (0, crypto_1.randomUUID)();
        const extension = this.getExtensionForMimeType(mimeType);
        const relativePath = `drafts/${draftId}/${fileId}${extension}`;
        const absolutePath = path_1.default.join(this.uploadDir, relativePath);
        await promises_1.default.mkdir(path_1.default.dirname(absolutePath), { recursive: true });
        return {
            url: `/api/drafts/${draftId}/upload`,
            method: 'POST',
            key: relativePath,
            contentType: mimeType,
            maxSizeMB: this.maxSizeMB,
            fields: { key: relativePath }
        };
    }
    async handleFileUpload(file, draftId) {
        try {
            await this.validateFile(file);
            const fileId = (0, crypto_1.randomUUID)();
            const extension = this.getExtensionForMimeType(file.mimetype);
            const relativePath = `drafts/${draftId}/${fileId}${extension}`;
            const absolutePath = path_1.default.join(this.uploadDir, relativePath);
            await promises_1.default.mkdir(path_1.default.dirname(absolutePath), { recursive: true });
            if (this.isImage(file.mimetype)) {
                await this.processImage(file.path, absolutePath, file.mimetype);
            }
            else {
                await promises_1.default.rename(file.path, absolutePath);
            }
            const metadata = await this.getFileMetadata(absolutePath);
            const publicUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
            logger_1.logger.info({ draftId, relativePath, fileSize: metadata.size, mimeType: file.mimetype }, 'File uploaded successfully');
            return { key: relativePath, url: publicUrl, metadata };
        }
        catch (error) {
            if (file.path)
                await promises_1.default.unlink(file.path).catch(() => { });
            throw error;
        }
    }
    async deleteFiles(draftId) {
        const draftDir = path_1.default.join(this.uploadDir, 'drafts', draftId);
        try {
            await promises_1.default.rm(draftDir, { recursive: true, force: true });
            logger_1.logger.info({ draftId }, 'Draft files deleted');
        }
        catch (error) {
            logger_1.logger.error({ error, draftId }, 'Failed to delete draft files');
        }
    }
    validateAndGetMimeType(contentType) {
        if (!contentType)
            return 'application/octet-stream';
        if (!this.allowedMimeTypes.includes(contentType)) {
            throw (0, ApiError_1.badRequest)(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }
        return contentType;
    }
    getExtensionForMimeType(mimeType) {
        const extensions = {
            'image/png': '.png',
            'image/jpeg': '.jpg',
            'image/webp': '.webp',
            'application/pdf': '.pdf'
        };
        return extensions[mimeType] || '';
    }
    isImage(mimeType) {
        return mimeType.startsWith('image/');
    }
    async validateFile(file) {
        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw (0, ApiError_1.badRequest)(`Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
        }
        const maxSizeBytes = this.maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw (0, ApiError_1.badRequest)(`File size exceeds maximum limit of ${this.maxSizeMB}MB`);
        }
        await this.validateMagicBytes(file.path, file.mimetype);
    }
    async validateMagicBytes(filePath, mimeType) {
        const buffer = await promises_1.default.readFile(filePath, { encoding: null, flag: 'r', signal: AbortSignal.timeout(5000) });
        const signatures = {
            'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
            'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
            'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
            'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])]
        };
        const expected = signatures[mimeType];
        if (!expected)
            return;
        const isValid = expected.some((sig, index) => {
            if (mimeType === 'image/webp') {
                if (index === 0)
                    return buffer.slice(0, 4).equals(sig);
                if (index === 1)
                    return buffer.slice(8, 12).equals(sig);
            }
            return buffer.slice(0, sig.length).equals(sig);
        });
        if (!isValid)
            throw (0, ApiError_1.badRequest)('File content does not match its type');
    }
    async processImage(inputPath, outputPath, mimeType) {
        try {
            const pipeline = (0, sharp_1.default)(inputPath).resize(2000, 2000, { fit: 'inside', withoutEnlargement: true });
            if (mimeType === 'image/png')
                await pipeline.png({ compressionLevel: 9, progressive: true }).toFile(outputPath);
            else if (mimeType === 'image/jpeg')
                await pipeline.jpeg({ quality: 90, progressive: true }).toFile(outputPath);
            else if (mimeType === 'image/webp')
                await pipeline.webp({ quality: 90 }).toFile(outputPath);
            else
                await promises_1.default.rename(inputPath, outputPath);
            if (mimeType.startsWith('image/'))
                await promises_1.default.unlink(inputPath).catch(() => { });
        }
        catch (error) {
            logger_1.logger.error({ error, inputPath }, 'Image processing failed');
            await promises_1.default.rename(inputPath, outputPath);
        }
    }
    async getFileMetadata(filePath) {
        const stats = await promises_1.default.stat(filePath);
        let dimensions = null;
        try {
            const metadata = await (0, sharp_1.default)(filePath).metadata();
            if (metadata.width || metadata.height) {
                dimensions = { width: metadata.width, height: metadata.height };
            }
        }
        catch {
            // ignore
        }
        return { size: stats.size, createdAt: stats.birthtime, modifiedAt: stats.mtime, dimensions };
    }
}
exports.DraftUploadService = DraftUploadService;
