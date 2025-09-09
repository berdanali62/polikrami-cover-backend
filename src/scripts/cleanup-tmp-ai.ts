import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(abs)));
    else files.push(abs);
  }
  return files;
}

async function main() {
  const ttlHours = Number(process.env.AI_TMP_TTL_HOURS || 24);
  const cutoff = Date.now() - ttlHours * 3600 * 1000;
  const base = path.join(process.cwd(), env.UPLOAD_DIR, 'tmp', 'ai');
  try {
    const files = await walk(base);
    let deleted = 0;
    await Promise.all(
      files.map(async (file) => {
        try {
          const st = await fs.stat(file);
          if (st.mtimeMs < cutoff) {
            await fs.unlink(file);
            deleted++;
          }
        } catch {}
      })
    );
    logger.info({ deleted, base, ttlHours }, 'AI tmp cleanup completed');
  } catch (err) {
    logger.warn({ err: String(err) }, 'AI tmp cleanup skipped');
  }
}

main().catch((e) => {
  logger.error({ e }, 'AI tmp cleanup failed');
  process.exit(1);
});


