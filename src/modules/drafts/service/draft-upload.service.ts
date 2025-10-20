import { env } from '../../../config/env';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { badRequest } from '../../../shared/errors/ApiError';
import sharp from 'sharp';
import { logger } from '../../../utils/logger';

export class DraftUploadService {
  private readonly allowedMimeTypes: string[];
  private readonly maxSizeMB: number;
  private readonly uploadDir: string;

  constructor() {
    this.allowedMimeTypes = env.UPLOAD_ALLOWED_MIME;
    this.maxSizeMB = env.UPLOAD_MAX_SIZE_MB;
    this.uploadDir = env.UPLOAD_PUBLIC_DIR;
  }

  async createUploadUrl(draftId: string, contentType?: string) {
    const mimeType = this.validateAndGetMimeType(contentType);
    const fileId = randomUUID();
    const extension = this.getExtensionForMimeType(mimeType);
    const relativePath = `drafts/${draftId}/${fileId}${extension}`;
    const absolutePath = path.join(this.uploadDir, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    return {
      url: `/api/drafts/${draftId}/upload`,
      method: 'POST' as const,
      key: relativePath,
      contentType: mimeType,
      maxSizeMB: this.maxSizeMB,
      fields: { key: relativePath }
    };
  }

  async handleFileUpload(file: Express.Multer.File, draftId: string): Promise<{ key: string; url: string; metadata: any }> {
    try {
      await this.validateFile(file);
      const fileId = randomUUID();
      const extension = this.getExtensionForMimeType(file.mimetype);
      const relativePath = `drafts/${draftId}/${fileId}${extension}`;
      const absolutePath = path.join(this.uploadDir, relativePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      if (this.isImage(file.mimetype)) {
        await this.processImage(file.path, absolutePath, file.mimetype);
      } else {
        await fs.rename(file.path, absolutePath);
      }
      const metadata = await this.getFileMetadata(absolutePath);
      const publicUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
      logger.info({ draftId, relativePath, fileSize: metadata.size, mimeType: file.mimetype }, 'File uploaded successfully');
      return { key: relativePath, url: publicUrl, metadata };
    } catch (error) {
      if (file.path) await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  async deleteFiles(draftId: string): Promise<void> {
    const draftDir = path.join(this.uploadDir, 'drafts', draftId);
    try {
      await fs.rm(draftDir, { recursive: true, force: true });
      logger.info({ draftId }, 'Draft files deleted');
    } catch (error) {
      logger.error({ error, draftId }, 'Failed to delete draft files');
    }
  }

  private validateAndGetMimeType(contentType?: string): string {
    if (!contentType) return 'application/octet-stream';
    if (!this.allowedMimeTypes.includes(contentType)) {
      throw badRequest(`Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }
    return contentType;
  }

  private getExtensionForMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'application/pdf': '.pdf'
    };
    return extensions[mimeType] || '';
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async validateFile(file: Express.Multer.File): Promise<void> {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw badRequest(`Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedMimeTypes.join(', ')}`);
    }
    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw badRequest(`File size exceeds maximum limit of ${this.maxSizeMB}MB`);
    }
    await this.validateMagicBytes(file.path, file.mimetype);
  }

  private async validateMagicBytes(filePath: string, mimeType: string): Promise<void> {
    const buffer = await fs.readFile(filePath, { encoding: null, flag: 'r', signal: AbortSignal.timeout(5000) });
    const signatures: Record<string, Buffer[]> = {
      'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
      'image/webp': [Buffer.from('RIFF'), Buffer.from('WEBP')],
      'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])]
    };
    const expected = signatures[mimeType];
    if (!expected) return;
    const isValid = expected.some((sig, index) => {
      if (mimeType === 'image/webp') {
        if (index === 0) return buffer.slice(0, 4).equals(sig);
        if (index === 1) return buffer.slice(8, 12).equals(sig);
      }
      return buffer.slice(0, sig.length).equals(sig);
    });
    if (!isValid) throw badRequest('File content does not match its type');
  }

  private async processImage(inputPath: string, outputPath: string, mimeType: string): Promise<void> {
    try {
      const pipeline = sharp(inputPath).resize(2000, 2000, { fit: 'inside', withoutEnlargement: true });
      if (mimeType === 'image/png') await pipeline.png({ compressionLevel: 9, progressive: true }).toFile(outputPath);
      else if (mimeType === 'image/jpeg') await pipeline.jpeg({ quality: 90, progressive: true }).toFile(outputPath);
      else if (mimeType === 'image/webp') await pipeline.webp({ quality: 90 }).toFile(outputPath);
      else await fs.rename(inputPath, outputPath);
      if (mimeType.startsWith('image/')) await fs.unlink(inputPath).catch(() => {});
    } catch (error) {
      logger.error({ error, inputPath }, 'Image processing failed');
      await fs.rename(inputPath, outputPath);
    }
  }

  private async getFileMetadata(filePath: string) {
    const stats = await fs.stat(filePath);
    let dimensions: { width?: number | null; height?: number | null } | null = null;
    try {
      const metadata = await sharp(filePath).metadata();
      if (metadata.width || metadata.height) {
        dimensions = { width: metadata.width, height: metadata.height };
      }
    } catch {
      // ignore
    }
    return { size: stats.size, createdAt: stats.birthtime, modifiedAt: stats.mtime, dimensions };
  }
}


