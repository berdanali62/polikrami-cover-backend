import multer from 'multer';
import type { File as MulterFile, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { Request, Response, NextFunction } from 'express';

const uploadDirAbs = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDirAbs)) fs.mkdirSync(uploadDirAbs, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: Request, _file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
    const draftId = String(req.params['id']);
    const dest = path.join(uploadDirAbs, 'drafts', draftId);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req: Request, file: MulterFile, cb: (error: Error | null, filename: string) => void) => {
    const ext = extensionForMime(file.mimetype);
    const name = Date.now() + '-' + Math.random().toString(36).slice(2) + ext;
    cb(null, name);
  },
});

function extensionForMime(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/jpeg') return '.jpg';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'application/pdf') return '.pdf';
  return '';
}

function isAllowedMime(mime: string): boolean {
  return (env.UPLOAD_ALLOWED_MIME as string[]).includes(mime);
}

const baseMulter = multer({
  storage,
  limits: { fileSize: (env.UPLOAD_MAX_SIZE_MB as number) * 1024 * 1024 },
  fileFilter: (_req: Request, file: MulterFile, cb: FileFilterCallback) => {
    if (!isAllowedMime(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  },
});

export const uploadMiddleware = baseMulter;

// After multer writes the file, attach the relative key for response
export function attachRelativePath(req: Request & { fileRelPath?: string; file?: MulterFile; files?: MulterFile[] }, _res: Response, next: NextFunction) {
  const files = (req.files as MulterFile[]) || (req.file ? [req.file as MulterFile] : []);
  if (files && files[0]) {
    const rel = path.relative(uploadDirAbs, files[0].path).replace(/\\/g, '/');
    req.fileRelPath = rel;
  }
  next();
}

// Basic magic-byte validation to mitigate spoofed MIME from plugins
export async function validateMagicBytes(req: Request & { file?: MulterFile; files?: MulterFile[] }, res: Response, next: NextFunction) {
  try {
    const file = (req.file as MulterFile) || ((req.files as MulterFile[])?.[0] as MulterFile);
    if (!file) return next();
    const fd = fs.openSync(file.path, 'r');
    const buffer = Buffer.alloc(12);
    fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);
    const mime = detectMime(buffer);
    if (!mime || !isAllowedMime(mime)) {
      return res.status(400).json({ message: 'File content type not allowed' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

function detectMime(header: Buffer): string | null {
  // PNG
  if (header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  // JPEG
  if (header[0] === 0xff && header[1] === 0xd8) return 'image/jpeg';
  // WEBP (RIFF....WEBP)
  if (
    header.length >= 12 &&
    header.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) && // 'RIFF'
    header.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50])) // 'WEBP'
  )
    return 'image/webp';
  // PDF
  if (header.slice(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46]))) return 'application/pdf';
  return null;
}


