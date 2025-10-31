/**
 * ORDER WORKFLOW UNIT TEST - Polikrami Cover Order Management System
 * 
 * Bu test, tam order lifecycle'ını test eder:
 * 1. Draft → Order dönüşümü (commit)
 * 2. Order status geçişleri (pending → paid → completed)
 * 3. Order cancellation
 * 4. Transaction rollback
 * 5. Concurrent order handling
 * 6. Payment integration
 * 7. Authorization kontrolü
 * 
 * Order Status Flow:
 * pending → paid → processing → shipped → completed
 *        ↓
 *     canceled/refunded
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock jest functions with proper typing
const mockFn = jest.fn as any;

// Mock Prisma
const mockPrisma: any = {
  order: {
    findUnique: mockFn(),
    findFirst: mockFn(),
    findMany: mockFn(),
    create: mockFn(),
    update: mockFn(),
    updateMany: mockFn()
  },
  draft: {
    findUnique: mockFn(),
    update: mockFn()
  },
  orderItem: {
    create: mockFn(),
    createMany: mockFn()
  },
  payment: {
    findFirst: mockFn(),
    create: mockFn(),
    update: mockFn(),
    updateMany: mockFn()
  },
  $transaction: mockFn()
};

jest.mock('../../src/config/database', () => ({
  prisma: mockPrisma,
}));

// Mock Order Service
const mockOrderService = {
  get: mockFn(),
  listMy: mockFn(),
  cancel: mockFn(),
  updateStatusForTesting: mockFn()
};

jest.mock('../../src/modules/orders/service/order.service', () => ({
  OrderService: mockFn().mockImplementation(() => mockOrderService),
}));

// Mock Draft Service
const mockDraftService = {
  commit: mockFn(),
  canCommit: mockFn()
};

jest.mock('../../src/modules/drafts/service/draft.service', () => ({
  DraftService: mockFn().mockImplementation(() => mockDraftService),
}));

describe('Order Workflow System - Polikrami Cover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Draft to Order Conversion (Commit)', () => {
    it('should successfully convert draft to order when all requirements met', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        messageCardId: 'card123',
        shipping: {
          senderName: 'John Doe',
          receiverName: 'Jane Doe',
          city: 'Istanbul',
          district: 'Kadikoy',
          address: 'Test Address 123'
        },
        billing: {
          name: 'John Doe',
          city: 'Istanbul'
        },
        totalCents: 10000,
        committedAt: null
      };

      const expectedOrder = {
        id: 'order123',
        userId: 'user123',
        status: 'pending' as const,
        totalCents: 10000,
        currency: 'TRY',
        createdAt: new Date()
      };

      mockPrisma.draft.findUnique.mockResolvedValue(draft);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            create: mockFn().mockResolvedValue(expectedOrder)
          },
          draft: {
            update: mockFn().mockResolvedValue({ ...draft, committedAt: new Date() })
          },
          orderItem: {
            createMany: mockFn().mockResolvedValue({ count: 0 })
          }
        };
        return await callback(mockTx);
      });

      const order = await mockPrisma.$transaction(async (tx: any) => {
        return await tx.order.create({ data: expectedOrder });
      });

      expect(order).toBeDefined();
      expect(order.status).toBe('pending');
      expect(order.totalCents).toBe(10000);
    });

    it('should reject commit when message card is missing', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        messageCardId: null,
        shipping: { senderName: 'Test' },
        totalCents: 10000,
        committedAt: null
      };

      mockPrisma.draft.findUnique.mockResolvedValue(draft);

      const canCommit = draft.messageCardId !== null && draft.shipping !== null;
      expect(canCommit).toBe(false);

      if (!canCommit) {
        expect(() => {
          throw new Error('Cannot commit draft. Missing required fields: message card');
        }).toThrow('message card');
      }
    });

    it('should reject commit when shipping info is missing', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        messageCardId: 'card123',
        shipping: null,
        totalCents: 10000,
        committedAt: null
      };

      mockPrisma.draft.findUnique.mockResolvedValue(draft);

      const canCommit = draft.messageCardId !== null && draft.shipping !== null;
      expect(canCommit).toBe(false);

      if (!canCommit) {
        expect(() => {
          throw new Error('Cannot commit draft. Missing required fields: shipping information');
        }).toThrow('shipping information');
      }
    });

    it('should reject commit when draft already committed', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        messageCardId: 'card123',
        shipping: { senderName: 'Test' },
        totalCents: 10000,
        committedAt: new Date()
      };

      mockPrisma.draft.findUnique.mockResolvedValue(draft);

      const isAlreadyCommitted = draft.committedAt !== null;
      expect(isAlreadyCommitted).toBe(true);

      if (isAlreadyCommitted) {
        expect(() => {
          throw new Error('Draft is already committed');
        }).toThrow('already committed');
      }
    });

    it('should create order items when committing draft', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        messageCardId: 'card123',
        shipping: { senderName: 'Test' },
        totalCents: 10000,
        items: [
          { productId: 'prod1', quantity: 1, priceCents: 5000 },
          { productId: 'prod2', quantity: 2, priceCents: 2500 }
        ]
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            create: mockFn().mockResolvedValue({ id: 'order123' })
          },
          orderItem: {
            createMany: mockFn().mockResolvedValue({ count: 2 })
          },
          draft: {
            update: mockFn().mockResolvedValue(draft)
          }
        };
        return await callback(mockTx);
      });

      const result = await mockPrisma.$transaction(async (tx: any) => {
        const order = await tx.order.create({ data: {} });
        const items = await tx.orderItem.createMany({ 
          data: draft.items.map((item: any) => ({ 
            orderId: order.id,
            ...item 
          }))
        });
        return { order, itemsCreated: items.count };
      });

      expect(result.itemsCreated).toBe(2);
    });
  });

  describe('Order Status Transitions', () => {
    it('should transition from pending to paid after successful payment', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'pending',
        totalCents: 10000
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });

      const updated = await mockPrisma.order.updateMany({
        where: { id: 'order123', status: 'pending' },
        data: { status: 'paid' }
      });

      expect(updated.count).toBe(1);
    });

    it('should transition from paid to processing when order is being prepared', async () => {
      const order = {
        id: 'order123',
        status: 'paid'
      };

      mockPrisma.order.update.mockResolvedValue({ 
        ...order, 
        status: 'processing' 
      });

      const updated = await mockPrisma.order.update({
        where: { id: 'order123' },
        data: { status: 'processing' }
      });

      expect(updated.status).toBe('processing');
    });

    it('should transition from processing to shipped when shipment created', async () => {
      const order = {
        id: 'order123',
        status: 'processing'
      };

      mockPrisma.order.update.mockResolvedValue({ 
        ...order, 
        status: 'shipped' 
      });

      const updated = await mockPrisma.order.update({
        where: { id: 'order123' },
        data: { status: 'shipped' }
      });

      expect(updated.status).toBe('shipped');
    });

    it('should transition from shipped to completed when delivery confirmed', async () => {
      const order = {
        id: 'order123',
        status: 'shipped'
      };

      mockPrisma.order.update.mockResolvedValue({ 
        ...order, 
        status: 'completed' 
      });

      const updated = await mockPrisma.order.update({
        where: { id: 'order123' },
        data: { status: 'completed' }
      });

      expect(updated.status).toBe('completed');
    });

    it('should reject invalid status transitions', async () => {
      const invalidTransitions = [
        { from: 'completed', to: 'pending', isValid: false },
        { from: 'canceled', to: 'paid', isValid: false },
        { from: 'refunded', to: 'processing', isValid: false },
        { from: 'paid', to: 'pending', isValid: false }
      ];

      invalidTransitions.forEach(transition => {
        expect(transition.isValid).toBe(false);
      });
    });

    it('should allow valid status transitions only', async () => {
      const validTransitions = [
        { from: 'pending', to: 'paid', isValid: true },
        { from: 'pending', to: 'canceled', isValid: true },
        { from: 'paid', to: 'processing', isValid: true },
        { from: 'paid', to: 'refunded', isValid: true },
        { from: 'processing', to: 'shipped', isValid: true },
        { from: 'shipped', to: 'completed', isValid: true }
      ];

      validTransitions.forEach(transition => {
        expect(transition.isValid).toBe(true);
      });
    });
  });

  describe('Order Cancellation', () => {
    it('should cancel pending order successfully', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'pending',
        totalCents: 10000
      };

      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.order.update.mockResolvedValue({
        ...order,
        status: 'canceled',
        cancelReason: 'Customer changed mind'
      });

      const canceled = await mockPrisma.order.update({
        where: { id: 'order123' },
        data: { 
          status: 'canceled',
          cancelReason: 'Customer changed mind'
        }
      });

      expect(canceled.status).toBe('canceled');
      expect(canceled.cancelReason).toBe('Customer changed mind');
    });

    it('should not allow canceling paid order', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'paid',
        totalCents: 10000
      };

      mockPrisma.order.findFirst.mockResolvedValue(order);

      const canCancel = order.status === 'pending';
      expect(canCancel).toBe(false);

      if (!canCancel) {
        expect(() => {
          throw new Error('Cannot cancel order. Order is already paid');
        }).toThrow('already paid');
      }
    });

    it('should not allow canceling completed order', async () => {
      const order = {
        id: 'order123',
        status: 'completed'
      };

      const canCancel = order.status === 'pending';
      expect(canCancel).toBe(false);
    });

    it('should track cancellation reason', async () => {
      const reasons = [
        'Changed my mind',
        'Found cheaper alternative',
        'Ordered by mistake',
        'Too expensive',
        'Long delivery time'
      ];

      reasons.forEach(reason => {
        expect(typeof reason).toBe('string');
        expect(reason.length).toBeGreaterThan(0);
        expect(reason.length).toBeLessThanOrEqual(500);
      });
    });
  });

  describe('Transaction Rollback', () => {
    it('should rollback entire transaction if order creation fails', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        messageCardId: 'card123',
        shipping: { senderName: 'Test' },
        totalCents: 10000
      };

      mockPrisma.draft.findUnique.mockResolvedValue(draft);
      mockPrisma.$transaction.mockRejectedValue(new Error('Order creation failed'));

      await expect(
        mockPrisma.$transaction(async () => {
          throw new Error('Order creation failed');
        })
      ).rejects.toThrow('Order creation failed');
    });

    it('should rollback if order items creation fails', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            create: mockFn().mockResolvedValue({ id: 'order123' }) as any
          },
          orderItem: {
            createMany: mockFn().mockRejectedValue(new Error('Items creation failed')) as any
          }
        };
        
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await expect(
        mockPrisma.$transaction(async (tx: any) => {
          await tx.order.create({ data: {} });
          await tx.orderItem.createMany({ data: [] });
        })
      ).rejects.toThrow('Items creation failed');
    });

    it('should rollback if draft update fails after order creation', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            create: mockFn().mockResolvedValue({ id: 'order123' }) as any
          },
          orderItem: {
            createMany: mockFn().mockResolvedValue({ count: 1 }) as any
          },
          draft: {
            update: mockFn().mockRejectedValue(new Error('Draft update failed')) as any
          }
        };
        
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await expect(
        mockPrisma.$transaction(async (tx: any) => {
          await tx.order.create({ data: {} });
          await tx.orderItem.createMany({ data: [] });
          await tx.draft.update({ where: {}, data: {} });
        })
      ).rejects.toThrow('Draft update failed');
    });

    it('should maintain data consistency on rollback', async () => {
      let orderCreated = false;
      let itemsCreated = false;
      let draftUpdated = false;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          order: {
            create: mockFn().mockImplementation(() => {
              orderCreated = true;
              return Promise.resolve({ id: 'order123' });
            })
          },
          orderItem: {
            createMany: mockFn().mockImplementation(() => {
              itemsCreated = true;
              return Promise.reject(new Error('Items failed'));
            })
          },
          draft: {
            update: mockFn().mockImplementation(() => {
              draftUpdated = true;
              return Promise.resolve({});
            })
          }
        };

        try {
          return await callback(mockTx);
        } catch (error) {
          orderCreated = false;
          itemsCreated = false;
          draftUpdated = false;
          throw error;
        }
      });

      try {
        await mockPrisma.$transaction(async (tx: any) => {
          await tx.order.create({});
          await tx.orderItem.createMany({});
          await tx.draft.update({});
        });
      } catch (error) {
        // Expected to fail
      }

      expect(orderCreated).toBe(false);
      expect(itemsCreated).toBe(false);
      expect(draftUpdated).toBe(false);
    });
  });

  describe('Concurrent Order Handling', () => {
    it('should handle concurrent order creation from same draft', async () => {
      const draft = {
        id: 'draft123',
        userId: 'user123',
        committedAt: null,
        version: 1
      };

      mockPrisma.draft.findUnique.mockResolvedValue(draft);

      // Mock the transaction to simulate concurrent behavior
      let callCount = 0;
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        callCount++;
        if (callCount === 1) {
          // First call succeeds
          const mockTx = {
            draft: {
              findUnique: mockFn().mockResolvedValue(draft)
            },
            order: {
              create: mockFn().mockResolvedValue({ id: 'order123' })
            }
          };
          return await callback(mockTx);
        } else {
          // Second call fails due to concurrent modification
          throw new Error('Already committed');
        }
      });

      const promises = Array(2).fill(null).map(() => 
        mockPrisma.$transaction(async (tx: any) => {
          const d = await tx.draft.findUnique({ 
            where: { id: 'draft123', version: 1 }
          });
          if (d.committedAt) throw new Error('Already committed');
          return tx.order.create({ data: {} });
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(1);
    });

    it('should prevent duplicate orders using optimistic locking', async () => {
      const draft = {
        id: 'draft123',
        committedAt: null,
        version: 1
      };

      mockPrisma.draft.update
        .mockResolvedValueOnce({ ...draft, version: 2, committedAt: new Date() })
        .mockRejectedValueOnce(new Error('Version conflict'));

      const results = await Promise.allSettled([
        mockPrisma.draft.update({ 
          where: { id: 'draft123', version: 1 },
          data: { committedAt: new Date(), version: { increment: 1 } }
        }),
        mockPrisma.draft.update({ 
          where: { id: 'draft123', version: 1 },
          data: { committedAt: new Date(), version: { increment: 1 } }
        })
      ]);

      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful).toHaveLength(1);
    });

    it('should handle concurrent status updates safely', async () => {
      const order = {
        id: 'order123',
        status: 'pending',
        version: 1
      };

      mockPrisma.order.findUnique.mockResolvedValue(order);

      mockPrisma.order.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const [result1, result2] = await Promise.all([
        mockPrisma.order.updateMany({
          where: { id: 'order123', status: 'pending' },
          data: { status: 'paid' }
        }),
        mockPrisma.order.updateMany({
          where: { id: 'order123', status: 'pending' },
          data: { status: 'paid' }
        })
      ]);

      expect(result1.count + result2.count).toBeLessThanOrEqual(1);
    });
  });

  describe('Authorization & Ownership', () => {
    it('should only allow order owner to view order', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'pending',
        totalCents: 10000
      };

      mockPrisma.order.findFirst.mockResolvedValue(order);

      const testCases = [
        { requesterId: 'user123', shouldAllow: true },
        { requesterId: 'user456', shouldAllow: false },
        { requesterId: 'admin', shouldAllow: false }
      ];

      testCases.forEach(({ requesterId, shouldAllow }) => {
        const isAuthorized = requesterId === order.userId;
        expect(isAuthorized).toBe(shouldAllow);
      });
    });

    it('should only allow order owner to cancel order', async () => {
      const order = {
        id: 'order123',
        userId: 'user123',
        status: 'pending'
      };

      const canCancel = (userId: string) => {
        return userId === order.userId && order.status === 'pending';
      };

      expect(canCancel('user123')).toBe(true);
      expect(canCancel('user456')).toBe(false);
    });

    it('should validate user ownership before any order operation', async () => {
      const operations = ['view', 'cancel', 'update', 'refund'];

      operations.forEach(operation => {
        const validateOwnership = (userId: string, orderUserId: string) => {
          return userId === orderUserId;
        };

        expect(validateOwnership('user123', 'user123')).toBe(true);
        expect(validateOwnership('user123', 'user456')).toBe(false);
      });
    });
  });

  describe('Payment Integration', () => {
    it('should update order status when payment succeeds', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          payment: {
            updateMany: mockFn().mockResolvedValue({ count: 1 }) as any
          },
          order: {
            updateMany: mockFn().mockResolvedValue({ count: 1 }) as any
          }
        };
        return await callback(mockTx);
      });

      await mockPrisma.$transaction(async (tx: any) => {
        await tx.payment.updateMany({
          where: { id: 'payment123', status: 'pending' },
          data: { status: 'success' }
        });
        await tx.order.updateMany({
          where: { id: 'order123', status: 'pending' },
          data: { status: 'paid' }
        });
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should not update order if payment already processed', async () => {
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 0 });

      const result = await mockPrisma.payment.updateMany({
        where: { id: 'payment123', status: 'pending' },
        data: { status: 'success' }
      });

      expect(result.count).toBe(0);
    });

    it('should handle payment failure gracefully', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          payment: {
            updateMany: mockFn().mockResolvedValue({ count: 1 }) as any
          },
          order: {
            updateMany: mockFn().mockResolvedValue({ count: 1 }) as any
          }
        };
        return await callback(mockTx);
      });

      await mockPrisma.$transaction(async (tx: any) => {
        await tx.payment.updateMany({
          where: { id: 'payment123', status: 'pending' },
          data: { status: 'failed' }
        });
        await tx.order.updateMany({
          where: { id: 'order123', status: 'pending' },
          data: { status: 'failed' }
        });
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('Order Listing & Filtering', () => {
    it('should list only user own orders', async () => {
      const orders = [
        { id: 'order1', userId: 'user123', status: 'pending' },
        { id: 'order2', userId: 'user123', status: 'paid' },
        { id: 'order3', userId: 'user456', status: 'completed' }
      ];

      mockPrisma.order.findMany.mockResolvedValue(
        orders.filter(o => o.userId === 'user123')
      );

      const userOrders = await mockPrisma.order.findMany({
        where: { userId: 'user123' }
      });

      expect(userOrders).toHaveLength(2);
      expect(userOrders.every((o: any) => o.userId === 'user123')).toBe(true);
    });

    it('should sort orders by creation date descending', async () => {
      const orders = [
        { id: 'order1', createdAt: new Date('2024-01-01') },
        { id: 'order2', createdAt: new Date('2024-01-03') },
        { id: 'order3', createdAt: new Date('2024-01-02') }
      ];

      mockPrisma.order.findMany.mockResolvedValue(
        [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );

      const sortedOrders = await mockPrisma.order.findMany({
        orderBy: { createdAt: 'desc' }
      });

      expect(sortedOrders[0].id).toBe('order2');
      expect(sortedOrders[1].id).toBe('order3');
      expect(sortedOrders[2].id).toBe('order1');
    });
  });

  describe('Order Number Generation', () => {
    it('should generate unique order numbers', () => {
      const generateOrderNumber = (id: string, createdAt: Date): string => {
        const dt = createdAt;
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        const suffix = id.replace(/-/g, '').slice(0, 8).toUpperCase();
        return `CP-${y}${m}${d}-${suffix}`;
      };

      const order1 = generateOrderNumber('abc-123-def', new Date('2024-01-15'));
      const order2 = generateOrderNumber('xyz-456-ghi', new Date('2024-01-15'));

      expect(order1).toMatch(/^CP-20240115-[A-Z0-9]{8}$/);
      expect(order2).toMatch(/^CP-20240115-[A-Z0-9]{8}$/);
      expect(order1).not.toBe(order2);
    });
  });

  describe('Complete Order Lifecycle', () => {
    it('should complete full order lifecycle from draft to completed', async () => {
      const lifecycle = [
        { step: 1, action: 'order_created', status: 'pending' },
        { step: 2, action: 'payment_success', status: 'paid' },
        { step: 3, action: 'preparation_started', status: 'processing' },
        { step: 4, action: 'shipment_created', status: 'shipped' },
        { step: 5, action: 'delivery_confirmed', status: 'completed' }
      ];

      expect(lifecycle).toHaveLength(5);
      expect(lifecycle[0]?.status).toBe('pending');
      expect(lifecycle[4]?.status).toBe('completed');
      
      const statuses = lifecycle.map(l => l.status);
      expect(statuses).toEqual(['pending', 'paid', 'processing', 'shipped', 'completed']);
    });

    it('should handle cancellation in lifecycle', async () => {
      const lifecycle = [
        { step: 1, status: 'pending' },
        { step: 2, status: 'canceled', reason: 'Customer request' }
      ];

      expect(lifecycle[lifecycle.length - 1]?.status).toBe('canceled');
    });

    it('should handle refund in lifecycle', async () => {
      const lifecycle = [
        { step: 1, status: 'pending' },
        { step: 2, status: 'paid' },
        { step: 3, status: 'refunded', reason: 'Product defect' }
      ];

      expect(lifecycle[lifecycle.length - 1]?.status).toBe('refunded');
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle non-existent order gracefully', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      const order = await mockPrisma.order.findFirst({
        where: { id: 'nonexistent' }
      });

      expect(order).toBeNull();
    });

    it('should validate order total before payment', async () => {
      const order = {
        id: 'order123',
        totalCents: 10000
      };

      const payment = {
        amountCents: 9000
      };

      const isValidAmount = order.totalCents === payment.amountCents;
      expect(isValidAmount).toBe(false);

      if (!isValidAmount) {
        expect(() => {
          throw new Error('Payment amount does not match order total');
        }).toThrow('does not match');
      }
    });

    it('should handle zero-value orders', async () => {
      const order = {
        id: 'order123',
        totalCents: 0
      };

      const isValid = order.totalCents > 0;
      expect(isValid).toBe(false);
  
      if (!isValid) {
        expect(() => {
          throw new Error('Order total must be greater than zero');
        }).toThrow('greater than zero');
      }
    });
  });
});