"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
async function walk(dir) {
    const entries = await promises_1.default.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
        const abs = path_1.default.join(dir, e.name);
        if (e.isDirectory())
            files.push(...(await walk(abs)));
        else
            files.push(abs);
    }
    return files;
}
async function main() {
    const ttlHours = Number(process.env.AI_TMP_TTL_HOURS || 24);
    const cutoff = Date.now() - ttlHours * 3600 * 1000;
    const base = path_1.default.join(process.cwd(), env_1.env.UPLOAD_DIR, 'tmp', 'ai');
    try {
        const files = await walk(base);
        let deleted = 0;
        await Promise.all(files.map(async (file) => {
            try {
                const st = await promises_1.default.stat(file);
                if (st.mtimeMs < cutoff) {
                    await promises_1.default.unlink(file);
                    deleted++;
                }
            }
            catch { }
        }));
        logger_1.logger.info({ deleted, base, ttlHours }, 'AI tmp cleanup completed');
    }
    catch (err) {
        logger_1.logger.warn({ err: String(err) }, 'AI tmp cleanup skipped');
    }
}
main().catch((e) => {
    logger_1.logger.error({ e }, 'AI tmp cleanup failed');
    process.exit(1);
});
