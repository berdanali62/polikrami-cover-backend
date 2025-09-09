let sharp: any;
try { sharp = require('sharp'); } catch { sharp = null; }
import fs from 'fs/promises';
import path from 'path';
import { env } from '../../config/env';

export type WatermarkOptions = {
  text?: string;
  logoPath?: string;
  opacity?: number; // 0..1
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

function getGravity(position: NonNullable<WatermarkOptions['position']>): 'northwest' | 'northeast' | 'southwest' | 'southeast' {
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

export async function applyWatermark(input: Buffer, opts?: WatermarkOptions): Promise<Buffer> {
  if (!sharp) {
    return input; // no-op if sharp not installed
  }
  const options: Required<WatermarkOptions> = {
    text: (opts?.text || env.WATERMARK_TEXT) as string,
    logoPath: (opts?.logoPath || env.WATERMARK_LOGO_PATH) as string,
    opacity: typeof opts?.opacity === 'number' ? opts.opacity : env.WATERMARK_OPACITY,
    position: (opts?.position || env.WATERMARK_POSITION) as NonNullable<WatermarkOptions['position']>,
  } as any;

  const base = sharp(input).ensureAlpha();
  const { width, height } = await base.metadata();
  const wmOpacity = Math.max(0, Math.min(1, options.opacity ?? 0.2));

  let overlay: Buffer;

  if (options.logoPath) {
    try {
      const logoAbs = path.isAbsolute(options.logoPath)
        ? options.logoPath
        : path.join(process.cwd(), options.logoPath);
      const logoBuf = await fs.readFile(logoAbs);
      // Resize logo to ~20% of the shorter side
      const target = Math.round(Math.min(width || 1024, height || 1024) * 0.2);
      overlay = await sharp(logoBuf)
        .resize(target)
        .ensureAlpha()
        .modulate({ brightness: 1, saturation: 1 })
        .toBuffer();
    } catch {
      overlay = await renderTextOverlay(options.text || 'preview', width || 1024);
    }
  } else if (options.text) {
    overlay = await renderTextOverlay(options.text, width || 1024);
  } else {
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

async function renderTextOverlay(text: string, baseWidth: number): Promise<Buffer> {
  const fontSize = Math.max(18, Math.round((baseWidth || 1024) * 0.035));
  const padding = Math.round(fontSize * 0.6);
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${baseWidth}" height="${fontSize + padding * 2}">
      <style>
        .wm { fill: white; font-size: ${fontSize}px; font-family: Arial, Helvetica, sans-serif; }
      </style>
      <rect width="100%" height="100%" fill="transparent"/>
      <text x="${padding}" y="${fontSize + padding - Math.round(padding/3)}" class="wm">${escapeXml(
        text
      )}</text>
    </svg>`
  );
  if (!sharp) return svg;
  return require('sharp')(svg).png().toBuffer();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


