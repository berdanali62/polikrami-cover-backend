"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
exports.attachRelativePath = attachRelativePath;
exports.validateMagicBytes = validateMagicBytes;
exports.sanitizeImage = sanitizeImage;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../../config/env");
const sharp_1 = __importDefault(require("sharp"));
const publicRootAbs = path_1.default.isAbsolute(env_1.env.UPLOAD_PUBLIC_DIR) ? env_1.env.UPLOAD_PUBLIC_DIR : path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR);
if (!fs_1.default.existsSync(publicRootAbs))
    fs_1.default.mkdirSync(publicRootAbs, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (req, _file, cb) => {
        const draftId = String(req.params['id']);
        // Validate UUID format to prevent path traversal
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(draftId)) {
            return cb(new Error('Invalid draft ID format'), '');
        }
        const dest = path_1.default.join(publicRootAbs, 'drafts', draftId);
        fs_1.default.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (_req, file, cb) => {
        const ext = extensionForMime(file.mimetype);
        const name = Date.now() + '-' + Math.random().toString(36).slice(2) + ext;
        cb(null, name);
    },
});
function extensionForMime(mime) {
    if (mime === 'image/png')
        return '.png';
    if (mime === 'image/jpeg')
        return '.jpg';
    if (mime === 'image/webp')
        return '.webp';
    if (mime === 'application/pdf')
        return '.pdf';
    return '';
}
function isAllowedMime(mime) {
    return env_1.env.UPLOAD_ALLOWED_MIME.includes(mime);
}
const baseMulter = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: env_1.env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
        files: 1, // Only one file at a time for security
        fields: 5, // Limit form fields
        fieldNameSize: 100, // Limit field name size
        fieldSize: 1024 * 1024 // 1MB field size limit
    },
    fileFilter: (_req, file, cb) => {
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
exports.uploadMiddleware = baseMulter;
// After multer writes the file, attach the relative key for response
function attachRelativePath(req, _res, next) {
    const anyReq = req;
    const files = anyReq.files || (anyReq.file ? [anyReq.file] : []);
    if (files && files[0]) {
        const rel = path_1.default.relative(publicRootAbs, files[0].path).replace(/\\/g, '/');
        anyReq.fileRelPath = rel;
    }
    next();
}
// Basic magic-byte validation to mitigate spoofed MIME from plugins
async function validateMagicBytes(req, res, next) {
    try {
        const anyReq = req;
        const file = anyReq.file || anyReq.files?.[0];
        if (!file)
            return next();
        const fd = fs_1.default.openSync(file.path, 'r');
        const buffer = Buffer.alloc(12);
        fs_1.default.readSync(fd, buffer, 0, 12, 0);
        fs_1.default.closeSync(fd);
        const mime = detectMime(buffer);
        if (!mime || !isAllowedMime(mime)) {
            return res.status(400).json({ message: 'File content type not allowed' });
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
function detectMime(header) {
    // PNG
    if (header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
        return 'image/png';
    // JPEG
    if (header[0] === 0xff && header[1] === 0xd8)
        return 'image/jpeg';
    // WEBP (RIFF....WEBP)
    if (header.length >= 12 &&
        header.slice(0, 4).equals(Buffer.from([0x52, 0x49, 0x46, 0x46])) && // 'RIFF'
        header.slice(8, 12).equals(Buffer.from([0x57, 0x45, 0x42, 0x50])) // 'WEBP'
    )
        return 'image/webp';
    // PDF
    if (header.slice(0, 4).equals(Buffer.from([0x25, 0x50, 0x44, 0x46])))
        return 'application/pdf';
    return null;
}
// Optional: sanitize images by re-encoding with sharp (strips metadata, normalizes)
async function sanitizeImage(req, res, next) {
    try {
        const anyReq = req;
        const file = anyReq.file;
        if (!file)
            return next();
        if (!/^image\//.test(file.mimetype))
            return next();
        const input = await fs_1.default.promises.readFile(file.path);
        let output;
        if (file.mimetype === 'image/png')
            output = await (0, sharp_1.default)(input).png({ compressionLevel: 9 }).toBuffer();
        else if (file.mimetype === 'image/jpeg')
            output = await (0, sharp_1.default)(input).jpeg({ quality: 85 }).toBuffer();
        else if (file.mimetype === 'image/webp')
            output = await (0, sharp_1.default)(input).webp({ quality: 85 }).toBuffer();
        else
            return next();
        await fs_1.default.promises.writeFile(file.path, output);
        next();
    }
    catch (e) {
        next(e);
    }
}
