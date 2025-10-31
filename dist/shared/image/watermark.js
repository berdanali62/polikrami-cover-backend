"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyWatermark = applyWatermark;
let sharp;
try {
    sharp = require('sharp');
}
catch {
    sharp = null;
}
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../../config/env");
function getGravity(position) {
    switch (position) {
        case 'top-left':
            return 'northwest';
        case 'top-right':
            return 'northeast';
        case 'bottom-left':
            return 'southwest';
        case 'bottom-right':
        default:
            return 'southeast';
    }
}
async function applyWatermark(input, opts) {
    if (!sharp) {
        return input; // no-op if sharp not installed
    }
    const options = {
        text: (opts?.text || env_1.env.WATERMARK_TEXT),
        logoPath: (opts?.logoPath || env_1.env.WATERMARK_LOGO_PATH),
        opacity: typeof opts?.opacity === 'number' ? opts.opacity : env_1.env.WATERMARK_OPACITY,
        position: (opts?.position || env_1.env.WATERMARK_POSITION),
    };
    const base = sharp(input).ensureAlpha();
    const { width, height } = await base.metadata();
    const wmOpacity = Math.max(0, Math.min(1, options.opacity ?? 0.2));
    let overlay;
    if (options.logoPath) {
        try {
            const logoAbs = path_1.default.isAbsolute(options.logoPath)
                ? options.logoPath
                : path_1.default.join(process.cwd(), options.logoPath);
            const logoBuf = await promises_1.default.readFile(logoAbs);
            // Resize logo to ~20% of the shorter side
            const target = Math.round(Math.min(width || 1024, height || 1024) * 0.2);
            overlay = await sharp(logoBuf)
                .resize(target)
                .ensureAlpha()
                .modulate({ brightness: 1, saturation: 1 })
                .toBuffer();
        }
        catch {
            overlay = await renderTextOverlay(options.text || 'preview', width || 1024);
        }
    }
    else if (options.text) {
        overlay = await renderTextOverlay(options.text, width || 1024);
    }
    else {
        overlay = await renderTextOverlay('preview', width || 1024);
    }
    const gravity = getGravity(options.position || 'bottom-right');
    const composite = await base
        .composite([
        {
            input: overlay,
            gravity,
            blend: 'over',
            opacity: wmOpacity,
        },
    ])
        .png()
        .toBuffer();
    return composite;
}
async function renderTextOverlay(text, baseWidth) {
    const fontSize = Math.max(18, Math.round((baseWidth || 1024) * 0.035));
    const padding = Math.round(fontSize * 0.6);
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${baseWidth}" height="${fontSize + padding * 2}">
      <style>
        .wm { fill: white; font-size: ${fontSize}px; font-family: Arial, Helvetica, sans-serif; }
      </style>
      <rect width="100%" height="100%" fill="transparent"/>
      <text x="${padding}" y="${fontSize + padding - Math.round(padding / 3)}" class="wm">${escapeXml(text)}</text>
    </svg>`);
    if (!sharp)
        return svg;
    return require('sharp')(svg).png().toBuffer();
}
function escapeXml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
