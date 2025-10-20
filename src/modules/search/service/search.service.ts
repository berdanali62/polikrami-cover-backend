import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';

interface SearchParams {
  query: string;
  type: 'all' | 'templates' | 'projects' | 'designers';
  category?: string;
  tag?: string;
  limit: number;
  page: number;
  userId?: string; // For private project search
}

interface SearchResult {
  query: string;
  type: string;
  results: {
    templates?: any[];
    designers?: any[];
    projects?: any[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export class SearchService {
  /**
   * Global search with full-text support
   */
  async search(params: SearchParams): Promise<SearchResult> {
    const { query, type, category, tag, limit, page, userId } = params;
    const skip = (page - 1) * limit;
    
    // Sanitize query
    const searchTerm = this.sanitizeQuery(query);
    
    const results: any = {};
    let totalResults = 0;

    // Search templates
    if (type === 'all' || type === 'templates') {
      const { items, total } = await this.searchTemplates({
        query: searchTerm,
        category,
        tag,
        limit,
        skip
      });
      results.templates = items;
      totalResults += total;
    }

    // Search designers (public profiles only)
    if (type === 'all' || type === 'designers') {
      const { items, total } = await this.searchDesigners({
        query: searchTerm,
        limit,
        skip
      });
      results.designers = items;
      totalResults += total;
    }

    // Search user's projects (authenticated)
    if (userId && (type === 'all' || type === 'projects')) {
      const { items, total } = await this.searchProjects({
        query: searchTerm,
        userId,
        limit,
        skip
      });
      results.projects = items;
      totalResults += total;
    }

    return {
      query,
      type,
      results,
      pagination: {
        page,
        limit,
        total: totalResults,
        hasMore: totalResults > skip + limit
      }
    };
  }

  /**
   * Search templates with optimized query
   */
  private async searchTemplates(params: {
    query: string;
    category?: string;
    tag?: string;
    limit: number;
    skip: number;
  }) {
    const { query, category, tag, limit, skip } = params;

    const where: Prisma.TemplateWhereInput = {
      isPublished: true,
      AND: []
    };

    // Full-text search (PostgreSQL)
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Filter by category
    if (category) {
      where.categories = {
        some: {
          category: { slug: category }
        }
      };
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag }
        }
      };
    }

    // Parallel queries for performance
    const [items, total] = await Promise.all([
      prisma.template.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          cover: true,
          createdAt: true,
          //yalnızca gerekli alanları seç
          categories: {
            select: {
              category: {
                select: { id: true, name: true, slug: true }
              }
            },
            take: 3 // Büyük yanıtları önlemek için sınır koy
          },
          tags: {
            select: {
              tag: {
                select: { id: true, name: true, slug: true }
              }
            },
            take: 5
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        
        ],
        take: limit,
        skip
      }),
      prisma.template.count({ where })
    ]);

    // Flatten relations
    const formatted = items.map(t => ({
      ...t,
      categories: t.categories.map(tc => tc.category),
      tags: t.tags.map(tt => tt.tag)
    }));

    return { items: formatted, total };
  }

  /**
   * Search designers (public profiles only)
   */
  private async searchDesigners(params: {
    query: string;
    limit: number;
    skip: number;
  }) {
    const { query, limit, skip } = params;

    const where: Prisma.UserWhereInput = {
      // Only users with artist profile
      profile: {
        is: {
          isArtist: true,
          isAvailable: true
        }
      },
      roles: {
        some: {
          role: { name: 'designer' }
        }
      }
    };

    // Search in name, bio, specialization
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { profile: { 
          is: { artistBio: { contains: query, mode: 'insensitive' } } 
        }},
        { profile: { 
          is: { specialization: { contains: query, mode: 'insensitive' } } 
        }}
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        
          profile: {
            select: {
              artistBio: true,
              specialization: true,
              isAvailable: true
            }
          },
          // Average rating from reviews
          designerReviewsReceived: {
            select: {
              rating: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.user.count({ where })
    ]);

    // Calculate average rating
    const formatted = items.map(designer => {
      const reviews = designer.designerReviewsReceived;
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      return {
        id: designer.id,
        name: designer.name,
        avatarUrl: designer.avatarUrl,
        bio: designer.profile?.artistBio,
        specialization: designer.profile?.specialization,
        isAvailable: designer.profile?.isAvailable,
        rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviews.length
      };
    });

    return { items: formatted, total };
  }
  private async searchProjects(params: {
    query: string;
    userId: string;
    limit: number;
    skip: number;
  }) {
    const { query, userId, limit, skip } = params;

    const where: Prisma.ProjectWhereInput = {
      ownerId: userId,
      status: 'active' // Don't show deleted projects
    };

    if (query) {
      where.title = { contains: query, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.project.count({ where })
    ]);

    return { items, total };
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit: number = 10) {
    const searchTerm = this.sanitizeQuery(query);
    
    if (!searchTerm) {
      // Return popular items if no query
      return this.getPopularSuggestions(limit);
    }

    const [categories, tags, templates] = await Promise.all([
      prisma.category.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { name: true, slug: true },
        take: 3
      }),
      prisma.tag.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { name: true, slug: true },
        take: 3
      }),
      prisma.template.findMany({
        where: {
          isPublished: true,
          title: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { title: true, slug: true },
        take: 4
      })
    ]);

    const suggestions = [
      ...categories.map(c => ({ 
        type: 'category', 
        text: c.name, 
        value: c.slug,
        icon: '📁'
      })),
      ...tags.map(t => ({ 
        type: 'tag', 
        text: t.name, 
        value: t.slug,
        icon: '🏷️'
      })),
      ...templates.map(t => ({ 
        type: 'template', 
        text: t.title, 
        value: t.slug,
        icon: '📄'
      }))
    ];

    return suggestions.slice(0, limit);
  }

  /**
   * Get popular suggestions (trending)
   */
  private async getPopularSuggestions(limit: number) {
    // Get most used categories and tags
    const [categories, tags, templates] = await Promise.all([
      prisma.category.findMany({
        select: { 
          name: true, 
          slug: true,
          _count: { select: { templates: true } }
        },
        orderBy: { templates: { _count: 'desc' } },
        take: 3
      }),
      prisma.tag.findMany({
        select: { 
          name: true, 
          slug: true,
          _count: { select: { templates: true } }
        },
        orderBy: { templates: { _count: 'desc' } },
        take: 3
      }),
      prisma.template.findMany({
        where: { isPublished: true },
        select: { title: true, slug: true },
        orderBy: { createdAt: 'desc' },
        take: 4
      })
    ]);

    return [
      ...categories.map(c => ({ 
        type: 'category', 
        text: `${c.name} (${c._count.templates})`, 
        value: c.slug,
        icon: '🔥'
      })),
      ...tags.map(t => ({ 
        type: 'tag', 
        text: `${t.name} (${t._count.templates})`, 
        value: t.slug,
        icon: '⭐'
      })),
      ...templates.map(t => ({ 
        type: 'template', 
        text: t.title, 
        value: t.slug,
        icon: '📄'
      }))
    ].slice(0, limit);
  }

  /**
   * Sanitize search query
   */
  private sanitizeQuery(query: string): string {
    if (!query) return '';
    
    return query
      .trim()
      .toLowerCase()
      .replace(/[<>'"]/g, '') // Remove XSS chars
      .slice(0, 100); // Max length
  }

  /**
   * Log search analytics
   */
  async logSearch(params: {
    query: string;
    type: string;
    userId?: string;
    resultsCount: number;
  }) {
    // TODO: Implement search analytics
    // Store in separate SearchLog table or send to analytics service
    // This helps with:
    // - Popular searches
    // - Failed searches (0 results)
    // - Search relevance improvement
  }
}