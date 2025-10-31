"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplatesSchema = exports.updateTemplateSchema = exports.createTemplateSchema = void 0;
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: 'Şablon başlığı boş olamaz.' }).max(100),
    description: zod_1.z.string().max(500).optional(),
    slug: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir.' }),
    cover: zod_1.z.object({
        url: zod_1.z.string().url(),
        width: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
        thumbnailUrl: zod_1.z.string().url().optional()
    }).optional(),
    categoryIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    tagIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    isPublished: zod_1.z.boolean().default(false)
});
exports.updateTemplateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    slug: zod_1.z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
    cover: zod_1.z.object({
        url: zod_1.z.string().url(),
        width: zod_1.z.number().positive(),
        height: zod_1.z.number().positive(),
        thumbnailUrl: zod_1.z.string().url().optional()
    }).optional(),
    categoryIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    tagIds: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    isPublished: zod_1.z.boolean().optional()
});
exports.listTemplatesSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    category: zod_1.z.string().optional(),
    tag: zod_1.z.string().optional(),
    search: zod_1.z.string().max(100).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'title', 'popularity']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
    published: zod_1.z.enum(['true', 'false', 'all']).default('true')
});
