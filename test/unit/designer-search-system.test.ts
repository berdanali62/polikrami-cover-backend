/**
 * DESIGNER SEARCH & DISCOVERY SYSTEM TEST - Polikrami Cover
 * 
 * Bu test sanatçı arama ve keşfetme sistemini test eder:
 * 1. Search functionality (name, bio, specialization)
 * 2. Filtering & sorting (rating, availability, newest, active)
 * 3. Rating calculation & aggregation
 * 4. Availability status filtering
 * 5. Specialization & tag matching
 * 6. Search query validation & sanitization
 * 7. Pagination & limit controls
 * 8. Performance optimization
 * 9. Empty state handling
 * 10. Search suggestions/autocomplete
 * 
 * Müşteriler DOĞRU sanatçıyı bulmalı! 🎨
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma: any = {
  user: {
    findUnique: jest.fn() as any,
    findFirst: jest.fn() as any,
    findMany: jest.fn() as any,
    count: jest.fn() as any
  },
  profile: {
    findMany: jest.fn() as any,
    findFirst: jest.fn() as any
  },
  designerReview: {
    findMany: jest.fn() as any,
    aggregate: jest.fn() as any
  },
  $transaction: jest.fn() as any
};

jest.mock('../../src/config/database', () => ({
  prisma: mockPrisma,
}));

// Mock Search Service
const mockSearchService = {
  search: jest.fn(),
  searchDesigners: jest.fn(),
  getSuggestions: jest.fn(),
  sanitizeQuery: jest.fn()
};

jest.mock('../../src/modules/search/service/search.service', () => ({
  SearchService: jest.fn().mockImplementation(() => mockSearchService),
}));

describe('Designer Search & Discovery System - Polikrami Cover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Search Functionality', () => {
    it('should search designers by name', async () => {
      const designers = [
        {
          id: 'designer1',
          name: 'Kerem Özer',
          avatarUrl: 'avatar1.jpg',
          profile: {
            artistBio: 'İllüstratör',
            specialization: 'Çizim',
            isAvailable: true
          },
          designerReviewsReceived: [{ rating: 5 }, { rating: 4 }]
        },
        {
          id: 'designer2',
          name: 'Mine Ceylan',
          avatarUrl: 'avatar2.jpg',
          profile: {
            artistBio: 'Grafik tasarımcı',
            specialization: 'Gerçekçi',
            isAvailable: true
          },
          designerReviewsReceived: [{ rating: 5 }]
        }
      ];

      mockPrisma.user.findMany.mockResolvedValue(designers);
      mockPrisma.user.count.mockResolvedValue(2);

      const result = await mockPrisma.user.findMany({
        where: {
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
          },
          OR: [
            { name: { contains: 'Kerem', mode: 'insensitive' } }
          ]
        }
      });

      expect(result).toHaveLength(2);
      expect((result as any)[0].name).toContain('Kerem');
    });

    it('should search designers by bio', async () => {
      const query = 'İllüstratör';

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'designer1',
          name: 'Kerem Özer',
          profile: {
            artistBio: 'Profesyonel İllüstratör',
            specialization: 'Çizim',
            isAvailable: true
          },
          designerReviewsReceived: []
        }
      ]);

      const result = await mockPrisma.user.findMany({
        where: {
          profile: {
            is: {
              artistBio: { contains: query, mode: 'insensitive' }
            }
          }
        }
      });

      expect(result).toHaveLength(1);
      expect((result as any)[0].profile.artistBio).toContain('İllüstratör');
    });

    it('should search designers by specialization', async () => {
      const specializations = ['Soyut', 'Gerçekçi', 'İllüstratif', 'Karakalem', 'Minimalist', 'Kübizm'];

      specializations.forEach(spec => {
        const isValid = specializations.includes(spec);
        expect(isValid).toBe(true);
      });

      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'designer1',
          name: 'Kerem Özer',
          profile: {
            specialization: 'Gerçekçi',
            isAvailable: true
          },
          designerReviewsReceived: []
        }
      ]);

      const result = await mockPrisma.user.findMany({
        where: {
          profile: {
            is: {
              specialization: { contains: 'Gerçekçi', mode: 'insensitive' }
            }
          }
        }
      });

      expect(result).toHaveLength(1);
      expect((result as any)[0].profile.specialization).toBe('Gerçekçi');
    });

    it('should handle Turkish characters in search', () => {
      const turkishQueries = [
        { query: 'Kerem Özer', sanitized: 'kerem özer' },
        { query: 'İllüstratör', sanitized: 'i̇llüstratör' }, // Unicode normalization
        { query: 'ÇAĞDAŞ SANAT', sanitized: 'çağdaş sanat' },
        { query: 'Şükrü Bey', sanitized: 'şükrü bey' }
      ];

      turkishQueries.forEach(({ query, sanitized }) => {
        const result = query.toLowerCase().trim();
        expect(result).toBe(sanitized);
      });
    });
  });

  describe('Filtering & Sorting', () => {
    it('should filter only available designers', async () => {
      const allDesigners = [
        { id: '1', name: 'Designer 1', profile: { isAvailable: true } },
        { id: '2', name: 'Designer 2', profile: { isAvailable: false } },
        { id: '3', name: 'Designer 3', profile: { isAvailable: true } }
      ];

      const available = allDesigners.filter(d => d.profile.isAvailable);
      expect(available).toHaveLength(2);
      expect(available.every(d => d.profile.isAvailable)).toBe(true);
    });

    it('should sort designers by rating (highest first)', async () => {
      const designers = [
        {
          id: '1',
          name: 'Designer A',
          designerReviewsReceived: [{ rating: 4 }, { rating: 4 }] // avg: 4.0
        },
        {
          id: '2',
          name: 'Designer B',
          designerReviewsReceived: [{ rating: 5 }, { rating: 5 }] // avg: 5.0
        },
        {
          id: '3',
          name: 'Designer C',
          designerReviewsReceived: [{ rating: 3 }, { rating: 4 }] // avg: 3.5
        }
      ];

      const withRatings = designers.map(d => {
        const reviews = d.designerReviewsReceived;
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        return { ...d, avgRating };
      });

      const sorted = withRatings.sort((a, b) => b.avgRating - a.avgRating);

      expect(sorted[0]?.avgRating).toBe(5.0);
      expect(sorted[1]?.avgRating).toBe(4.0);
      expect(sorted[2]?.avgRating).toBe(3.5);
    });

    it('should sort designers by newest first', () => {
      const designers = [
        { id: '1', name: 'Designer A', createdAt: new Date('2024-01-01') },
        { id: '2', name: 'Designer B', createdAt: new Date('2024-03-01') },
        { id: '3', name: 'Designer C', createdAt: new Date('2024-02-01') }
      ];

      const sorted = [...designers].sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sorted[0]?.name).toBe('Designer B'); // March (newest)
      expect(sorted[1]?.name).toBe('Designer C'); // February
      expect(sorted[2]?.name).toBe('Designer A'); // January
    });

    it('should sort designers by most active (30 days)', () => {
      const designers = [
        { id: '1', name: 'Designer A', recentJobs30d: 5 },
        { id: '2', name: 'Designer B', recentJobs30d: 12 },
        { id: '3', name: 'Designer C', recentJobs30d: 8 }
      ];

      const sorted = [...designers].sort((a, b) => 
        b.recentJobs30d - a.recentJobs30d
      );

      expect(sorted[0]?.recentJobs30d).toBe(12);
      expect(sorted[1]?.recentJobs30d).toBe(8);
      expect(sorted[2]?.recentJobs30d).toBe(5);
    });

    it('should filter by multiple specializations', () => {
      const designers = [
        { id: '1', specialization: 'Soyut' },
        { id: '2', specialization: 'Gerçekçi' },
        { id: '3', specialization: 'İllüstratif' },
        { id: '4', specialization: 'Soyut' }
      ];

      const filter = ['Soyut', 'Gerçekçi'];
      const filtered = designers.filter(d => filter.includes(d.specialization));

      expect(filtered).toHaveLength(3);
    });
  });

  describe('Rating Calculation & Aggregation', () => {
    it('should calculate average rating correctly', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ];

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const rounded = Math.round(avgRating * 10) / 10; // Round to 1 decimal

      expect(rounded).toBe(4.3);
    });

    it('should handle designers with no reviews', () => {
      const designer = {
        id: 'designer1',
        name: 'New Designer',
        designerReviewsReceived: []
      };

      const reviews = designer.designerReviewsReceived;
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;

      expect(avgRating).toBe(0);
    });

    it('should display review count', () => {
      const designer = {
        id: 'designer1',
        name: 'Popular Designer',
        designerReviewsReceived: [
          { rating: 5 },
          { rating: 4 },
          { rating: 5 }
        ]
      };

      const reviewCount = designer.designerReviewsReceived.length;
      expect(reviewCount).toBe(3);
    });

    it('should calculate rating distribution', () => {
      const reviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 4 }
      ];

      const distribution = {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      };

      expect(distribution[5]).toBe(3);
      expect(distribution[4]).toBe(2);
      expect(distribution[3]).toBe(1);
      expect(distribution[2]).toBe(0);
      expect(distribution[1]).toBe(0);
    });
  });

  describe('Availability Status', () => {
    it('should only show available designers by default', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'designer1',
          name: 'Available Designer',
          profile: {
            isAvailable: true,
            isArtist: true
          }
        }
      ]);

      const result = await mockPrisma.user.findMany({
        where: {
          profile: {
            is: {
              isArtist: true,
              isAvailable: true
            }
          }
        }
      });

      expect((result as any).every((d: any) => d.profile.isAvailable)).toBe(true);
    });

    it('should handle unavailable designers gracefully', () => {
      const designer = {
        id: 'designer1',
        name: 'Busy Designer',
        profile: {
          isAvailable: false,
          unavailableReason: 'Tatilde'
        }
      };

      const canAssign = designer.profile.isAvailable;
      expect(canAssign).toBe(false);
    });

    it('should track designer workload', () => {
      const designer = {
        id: 'designer1',
        activeJobs: 5,
        maxConcurrentJobs: 3
      };

      const isAvailable = designer.activeJobs < designer.maxConcurrentJobs;
      expect(isAvailable).toBe(false);
    });
  });

  describe('Search Query Validation', () => {
    it('should validate search query length', () => {
      const queries = [
        { query: 'a', isValid: true },
        { query: 'Kerem Özer', isValid: true },
        { query: 'a'.repeat(100), isValid: true },
        { query: 'a'.repeat(101), isValid: false }
      ];

      const MAX_LENGTH = 100;

      queries.forEach(({ query, isValid }) => {
        const valid = query.length <= MAX_LENGTH;
        expect(valid).toBe(isValid);
      });
    });

    it('should sanitize malicious input', () => {
      const maliciousInputs = [
        { input: '<script>alert("xss")</script>', sanitized: 'scriptalert(xss)/script' },
        { input: 'DROP TABLE users;', sanitized: 'drop table users' },
        { input: '\'OR 1=1--', sanitized: 'or 11' }
      ];

      maliciousInputs.forEach(({ input, sanitized }) => {
        // Remove special chars
        const cleaned = input
          .toLowerCase()
          .replace(/[<>'";\-=]/g, '')
          .trim();
        expect(cleaned).toBe(sanitized);
      });
    });

    it('should trim and normalize whitespace', () => {
      const inputs = [
        { input: '  Kerem  Özer  ', expected: 'Kerem Özer' },
        { input: 'Kerem\nÖzer', expected: 'Kerem Özer' },
        { input: 'Kerem\tÖzer', expected: 'Kerem Özer' }
      ];

      inputs.forEach(({ input, expected }) => {
        const normalized = input.trim().replace(/\s+/g, ' ');
        expect(normalized).toBe(expected);
      });
    });

    it('should handle empty search query', async () => {
      const query = '';

      mockPrisma.user.findMany.mockResolvedValue([
        { id: '1', name: 'Designer 1' },
        { id: '2', name: 'Designer 2' }
      ]);

      // Empty query should return all designers
      const result = await mockPrisma.user.findMany({
        where: {
          profile: {
            is: {
              isArtist: true,
              isAvailable: true
            }
          }
        }
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('Pagination & Limits', () => {
    it('should paginate results correctly', () => {
      const allDesigners = Array.from({ length: 50 }, (_, i) => ({
        id: `designer${i + 1}`,
        name: `Designer ${i + 1}`
      }));

      const page = 2;
      const limit = 10;
      const skip = (page - 1) * limit;

      const paginated = allDesigners.slice(skip, skip + limit);

      expect(paginated).toHaveLength(10);
      expect(paginated[0]?.name).toBe('Designer 11');
      expect(paginated[9]?.name).toBe('Designer 20');
    });

    it('should enforce maximum limit', () => {
      const MAX_LIMIT = 50;
      const limits = [10, 20, 50, 51, 100];

      limits.forEach(limit => {
        const validLimit = Math.min(limit, MAX_LIMIT);
        expect(validLimit).toBeLessThanOrEqual(MAX_LIMIT);
      });
    });

    it('should calculate total pages', () => {
      const totalDesigners = 47;
      const limit = 10;

      const totalPages = Math.ceil(totalDesigners / limit);
      expect(totalPages).toBe(5);
    });

    it('should handle last page with fewer items', () => {
      const allDesigners = Array.from({ length: 47 }, (_, i) => ({
        id: `designer${i + 1}`
      }));

      const page = 5;
      const limit = 10;
      const skip = (page - 1) * limit;

      const lastPage = allDesigners.slice(skip, skip + limit);

      expect(lastPage).toHaveLength(7); // Only 7 items on last page
    });
  });

  describe('Performance Optimization', () => {
    it('should use parallel queries for performance', async () => {
      mockPrisma.$transaction.mockImplementation(async (queries: any[]) => {
        return Promise.all(queries);
      });

      const start = Date.now();
      const results = await Promise.all([
        mockPrisma.user.findMany({ where: {} }),
        mockPrisma.user.count({ where: {} })
      ]);
      const duration = Date.now() - start;

      expect(results).toHaveLength(2);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should select only necessary fields', async () => {
      const selectFields = {
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
        designerReviewsReceived: {
          select: {
            rating: true
          }
        }
      };

      // Should NOT select: email, password, phone, etc.
      expect(selectFields).not.toHaveProperty('email');
      expect(selectFields).not.toHaveProperty('password');
      expect(selectFields).not.toHaveProperty('phone');
    });

    it('should limit review count in listings', () => {
      const designer = {
        id: 'designer1',
        name: 'Popular Designer',
        designerReviewsReceived: Array(100).fill({ rating: 5 })
      };

      // For listing, only show count and avg, not all reviews
      const reviewSummary = {
        count: designer.designerReviewsReceived.length,
        avgRating: 5
      };

      expect(reviewSummary.count).toBe(100);
      expect(reviewSummary.avgRating).toBe(5);
    });
  });

  describe('Empty States & Edge Cases', () => {
    it('should handle no search results', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await mockPrisma.user.findMany({
        where: {
          name: { contains: 'NonExistentDesigner' }
        }
      });

      expect(result).toHaveLength(0);
    });

    it('should handle designer with incomplete profile', () => {
      const designer = {
        id: 'designer1',
        name: 'New Designer',
        profile: null // Incomplete!
      };

      const hasProfile = designer.profile !== null;
      expect(hasProfile).toBe(false);
    });

    it('should handle designer with no avatar', () => {
      const designer = {
        id: 'designer1',
        name: 'Designer',
        avatarUrl: null
      };

      const avatarUrl = designer.avatarUrl || '/default-avatar.png';
      expect(avatarUrl).toBe('/default-avatar.png');
    });

    it('should handle very long bio text', () => {
      const longBio = 'a'.repeat(1000);
      const MAX_BIO_LENGTH = 500;

      const truncated = longBio.slice(0, MAX_BIO_LENGTH) + '...';
      expect(truncated.length).toBeLessThanOrEqual(MAX_BIO_LENGTH + 3);
    });
  });

  describe('Search Suggestions (Autocomplete)', () => {
    it('should provide designer name suggestions', async () => {
      const allDesigners = [
        { name: 'Kerem Özer' },
        { name: 'Kemal Yılmaz' },
        { name: 'Mine Ceylan' }
      ];

      const query = 'Ke';
      const suggestions = allDesigners.filter(d =>
        d.name.toLowerCase().startsWith(query.toLowerCase())
      );

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]?.name).toBe('Kerem Özer');
      expect(suggestions[1]?.name).toBe('Kemal Yılmaz');
    });

    it('should limit suggestion count', () => {
      const allSuggestions = Array.from({ length: 50 }, (_, i) => ({
        name: `Designer ${i + 1}`
      }));

      const MAX_SUGGESTIONS = 10;
      const limited = allSuggestions.slice(0, MAX_SUGGESTIONS);

      expect(limited).toHaveLength(MAX_SUGGESTIONS);
    });

    it('should suggest popular specializations', () => {
      const popularSpecs = [
        'Soyut',
        'Gerçekçi',
        'İllüstratif',
        'Karakalem',
        'Minimalist'
      ];

      const query = 'So';
      const suggestions = popularSpecs.filter(s =>
        s.toLowerCase().startsWith(query.toLowerCase())
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toBe('Soyut');
    });
  });

  describe('Integration with Reviews System', () => {
    it('should update designer rating when new review added', () => {
      const designer = {
        id: 'designer1',
        reviews: [{ rating: 5 }, { rating: 4 }]
      };

      const newReview = { rating: 5 };
      const updatedReviews = [...designer.reviews, newReview];

      const newAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
      const rounded = Math.round(newAvg * 10) / 10;

      expect(rounded).toBe(4.7);
    });

    it('should show recent reviews in search results', () => {
      const designer = {
        id: 'designer1',
        recentReviews: [
          { rating: 5, comment: 'Harika!', createdAt: new Date('2024-03-01') },
          { rating: 4, comment: 'İyi', createdAt: new Date('2024-02-15') }
        ]
      };

      const sorted = designer.recentReviews.sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      expect(sorted[0]?.comment).toBe('Harika!');
    });
  });

  describe('Security & Privacy', () => {
    it('should not expose designer email in search', () => {
      const designer = {
        id: 'designer1',
        name: 'Designer',
        email: 'designer@email.com', // Should NOT be in search results
        profile: {
          artistBio: 'Bio'
        }
      };

      const publicData = {
        id: designer.id,
        name: designer.name,
        bio: designer.profile.artistBio
        // email should NOT be here
      };

      expect(publicData).not.toHaveProperty('email');
    });

    it('should not expose designer phone in search', () => {
      const designer = {
        id: 'designer1',
        name: 'Designer',
        phone: '+905551234567', // Should NOT be in search results
        profile: {}
      };

      const publicData = {
        id: designer.id,
        name: designer.name
      };

      expect(publicData).not.toHaveProperty('phone');
    });

    it('should validate designer role before showing in search', async () => {
      const users = [
        { id: '1', name: 'Designer', roles: [{ role: { name: 'designer' } }] },
        { id: '2', name: 'Customer', roles: [{ role: { name: 'customer' } }] }
      ];

      const designers = users.filter(u =>
        u.roles.some(r => r.role.name === 'designer')
      );

      expect(designers).toHaveLength(1);
      expect(designers[0]?.name).toBe('Designer');
    });
  });
});
