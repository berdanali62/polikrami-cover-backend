import multer from 'multer';
import type { File as MulterFile, FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';
import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';

const publicRootAbs = path.isAbsolute(env.UPLOAD_PUBLIC_DIR) ? env.UPLOAD_PUBLIC_DIR : path.join(process.cwd(), env.UPLOAD_PUBLIC_DIR);
if (!fs.existsSync(publicRootAbs)) fs.mkdirSync(publicRootAbs, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: Request, _file: MulterFile, cb: (error: Error | null, destination: string) => void) => {
    const draftId = String(req.params['id']);
    // Validate UUID format to prevent path traversal
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(draftId)) {
      return cb(new Error('Invalid draft ID format'), '');
    }
    const dest = path.join(publicRootAbs, 'drafts', draftId);
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
  limits: { 
    fileSize: (env.UPLOAD_MAX_SIZE_MB as number) * 1024 * 1024,
    files: 1, // Only one file at a time for security
    fields: 5, // Limit form fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: (_req: Request, file: MulterFile, cb: FileFilterCallback) => {
    // Additional security checks
    if (!isAllowedMime(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    // Check for suspicious filenames
    if (/[<>:"|?*]/.test(file.originalname)) {
      return cb(new Error('Invalid filename characters'));
    }
    // Check file extension matches MIME type
    const expectedExt = extensionForMime(file.mimetype);
    if (!file.originalname.toLowerCase().endsWith(expectedExt)) {
      return cb(new Error('File extension does not match content type'));
    }
    cb(null, true);
  },
});

export const uploadMiddleware = baseMulter;

// After multer writes the file, attach the relative key for response
export function attachRelativePath(req: Request, _res: Response, next: NextFunction) {
  const anyReq = req as unknown as { files?: MulterFile[] | Record<string, MulterFile[]>; file?: MulterFile; fileRelPath?: string };
  const files = (anyReq.files as MulterFile[]) || (anyReq.file ? [anyReq.file as MulterFile] : []);
  if (files && files[0]) {
    const rel = path.relative(publicRootAbs, files[0].path).replace(/\\/g, '/');
    anyReq.fileRelPath = rel;
  }
  next();
}

// Basic magic-byte validation to mitigate spoofed MIME from plugins
export async function validateMagicBytes(req: Request, res: Response, next: NextFunction) {
  try {
    const anyReq = req as unknown as { file?: MulterFile; files?: MulterFile[] | Record<string, MulterFile[]> };
    const file = (anyReq.file as MulterFile) || ((anyReq.files as MulterFile[])?.[0] as MulterFile);
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

// Optional: sanitize images by re-encoding with sharp (strips metadata, normalizes)
export async function sanitizeImage(req: Request, res: Response, next: NextFunction) {
  try {
    const anyReq = req as any;
    const file = anyReq.file as MulterFile | undefined;
    if (!file) return next();
    if (!/^image\//.test(file.mimetype)) return next();
    const input = await fs.promises.readFile(file.path);
    let output: Buffer;
    if (file.mimetype === 'image/png') output = await sharp(input).png({ compressionLevel: 9 }).toBuffer();
    else if (file.mimetype === 'image/jpeg') output = await sharp(input).jpeg({ quality: 85 }).toBuffer();
    else if (file.mimetype === 'image/webp') output = await sharp(input).webp({ quality: 85 }).toBuffer();
    else return next();
    await fs.promises.writeFile(file.path, output);
    next();
  } catch (e) {
    next(e);
  }
}


