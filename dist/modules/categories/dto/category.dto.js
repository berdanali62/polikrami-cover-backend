"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, { message: 'Kategori adı boş olamaz.' }).max(50),
    slug: zod_1.z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir.' })
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50).optional(),
    slug: zod_1.z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional()
});
