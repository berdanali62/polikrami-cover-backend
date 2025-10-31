import { Prisma } from '@prisma/client';
export declare class TemplateService {
    list(params: {
        page: number;
        limit: number;
        category?: string;
        tag?: string;
        search?: string;
        sortBy: string;
        sortOrder: string;
        published: string;
    }): Promise<{
        templates: {
            categories: {
                name: string;
                id: number;
                slug: string;
            }[];
            tags: {
                name: string;
                id: number;
                slug: string;
            }[];
            id: string;
            createdAt: Date;
            title: string;
            isPublished: boolean;
            description: string | null;
            slug: string;
            authorId: string | null;
            cover: Prisma.JsonValue | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getBySlug(slug: string): Promise<{
        categories: {
            name: string;
            id: number;
            slug: string;
        }[];
        tags: {
            name: string;
            id: number;
            slug: string;
        }[];
        versions: {
            id: string;
            createdAt: Date;
            templateId: string;
            version: number;
            baseProjectVersionId: string | null;
            changelog: Prisma.JsonValue | null;
        }[];
        id: string;
        createdAt: Date;
        title: string;
        isPublished: boolean;
        description: string | null;
        slug: string;
        authorId: string | null;
        cover: Prisma.JsonValue | null;
    }>;
    getById(id: string): Promise<{
        categories: {
            name: string;
            id: number;
            slug: string;
        }[];
        tags: {
            name: string;
            id: number;
            slug: string;
        }[];
        versions: {
            id: string;
            createdAt: Date;
            templateId: string;
            version: number;
            baseProjectVersionId: string | null;
            changelog: Prisma.JsonValue | null;
        }[];
        id: string;
        createdAt: Date;
        title: string;
        isPublished: boolean;
        description: string | null;
        slug: string;
        authorId: string | null;
        cover: Prisma.JsonValue | null;
    }>;
    create(data: {
        title: string;
        description?: string;
        slug: string;
        cover?: any;
        categoryIds?: number[];
        tagIds?: number[];
        isPublished?: boolean;
    }, authorId?: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        isPublished: boolean;
        description: string | null;
        slug: string;
        authorId: string | null;
        cover: Prisma.JsonValue | null;
    }>;
    update(id: string, data: {
        title?: string;
        description?: string;
        slug?: string;
        cover?: any;
        categoryIds?: number[];
        tagIds?: number[];
        isPublished?: boolean;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        isPublished: boolean;
        description: string | null;
        slug: string;
        authorId: string | null;
        cover: Prisma.JsonValue | null;
    }>;
    delete(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        isPublished: boolean;
        description: string | null;
        slug: string;
        authorId: string | null;
        cover: Prisma.JsonValue | null;
    }>;
    getPopular(limit?: number): Promise<({
        categories: ({
            category: {
                name: string;
                id: number;
                slug: string;
            };
        } & {
            templateId: string;
            categoryId: number;
        })[];
        tags: ({
            tag: {
                name: string;
                id: number;
                slug: string;
            };
        } & {
            templateId: string;
            tagId: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        title: string;
        isPublished: boolean;
        description: string | null;
        slug: string;
        authorId: string | null;
        cover: Prisma.JsonValue | null;
    })[]>;
}
