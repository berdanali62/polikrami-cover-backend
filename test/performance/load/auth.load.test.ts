import request from 'supertest';
import { app } from '../../../src/app';
import { PrismaClient } from '@prisma/client';

describe('Auth Load Tests', () => {
  let prisma: PrismaClient;
  let testUsers: any[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create test users for load testing
    for (let i = 0; i < 100; i++) {
      const user = await prisma.user.create({
        data: {
          email: `load-test-${i}@example.com`,
          password: '$argon2id$v=19$m=65536,t=3,p=4$test',
          firstName: `User${i}`,
          lastName: 'LoadTest',
          isEmailVerified: true,
          isActive: true
        }
      });
      testUsers.push(user);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Login Load Tests', () => {
    it('should handle 100 concurrent login requests', async () => {
      const startTime = Date.now();
      
      const promises = testUsers.map((user, index) => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'password123'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      // At least 90% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(90);
    });

    it('should handle 500 sequential login requests', async () => {
      const startTime = Date.now();
      const results = [];

      for (let i = 0; i < 500; i++) {
        const user = testUsers[i % testUsers.length];
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'password123'
          });
        
        results.push(response.status);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      // All should succeed
      const successful = results.filter(status => status === 200);
      expect(successful.length).toBe(500);
    });

    it('should handle mixed load (login + registration)', async () => {
      const startTime = Date.now();
      const promises = [];

      // 50 login requests
      for (let i = 0; i < 50; i++) {
        const user = testUsers[i];
        promises.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: user.email,
              password: 'password123'
            })
        );
      }

      // 50 registration requests
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: `mixed-load-${i}@example.com`,
              password: 'password123',
              firstName: `Mixed${i}`,
              lastName: 'LoadTest'
            })
        );
      }

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 15 seconds
      expect(duration).toBeLessThan(15000);
      
      // At least 80% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Registration Load Tests', () => {
    it('should handle 100 concurrent registration requests', async () => {
      const startTime = Date.now();
      
      const promises = Array(100).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `concurrent-reg-${index}@example.com`,
            password: 'password123',
            firstName: `Concurrent${index}`,
            lastName: 'LoadTest'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 20 seconds
      expect(duration).toBeLessThan(20000);
      
      // All should succeed (unique emails)
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(100);
    });

    it('should handle duplicate email registration gracefully', async () => {
      const startTime = Date.now();
      
      const promises = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: 'duplicate-load@example.com',
            password: 'password123',
            firstName: 'Duplicate',
            lastName: 'LoadTest'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      
      // Only one should succeed, others should fail gracefully
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(9);
    });
  });

  describe('Token Validation Load Tests', () => {
    let authTokens: string[] = [];

    beforeEach(async () => {
      // Get auth tokens for load testing
      authTokens = [];
      for (let i = 0; i < 50; i++) {
        const user = testUsers[i];
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'password123'
          });
        
        if (response.status === 200) {
          authTokens.push(response.body.token);
        }
      }
    });

    it('should handle 100 concurrent token validations', async () => {
      const startTime = Date.now();
      
      const promises = authTokens.map(token => 
        request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`)
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(authTokens.length);
    });

    it('should handle token refresh load', async () => {
      const startTime = Date.now();
      
      const promises = authTokens.map(token => 
        request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: token })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(authTokens.length);
    });
  });

  describe('Password Hashing Load Tests', () => {
    it('should handle concurrent password hashing', async () => {
      const startTime = Date.now();
      
      const promises = Array(50).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `password-hash-${index}@example.com`,
            password: 'complexpassword123!@#',
            firstName: `Hash${index}`,
            lastName: 'LoadTest'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 30 seconds (password hashing is CPU intensive)
      expect(duration).toBeLessThan(30000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(50);
    });

    it('should handle password verification load', async () => {
      const startTime = Date.now();
      
      const promises = testUsers.slice(0, 100).map(user => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: 'password123'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 20 seconds
      expect(duration).toBeLessThan(20000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(100);
    });
  });

  describe('Database Connection Load Tests', () => {
    it('should handle database connection pooling', async () => {
      const startTime = Date.now();
      
      // Simulate high database load
      const promises = Array(200).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: testUsers[index % testUsers.length].email,
            password: 'password123'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      // At least 90% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(180);
    });

    it('should handle database transaction load', async () => {
      const startTime = Date.now();
      
      // Simulate transaction-heavy operations
      const promises = Array(100).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `transaction-load-${index}@example.com`,
            password: 'password123',
            firstName: `Transaction${index}`,
            lastName: 'LoadTest'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 25 seconds
      expect(duration).toBeLessThan(25000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(100);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple load cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        const promises = Array(50).fill(null).map((_, index) => 
          request(app)
            .post('/api/auth/login')
            .send({
              email: testUsers[index % testUsers.length].email,
              password: 'password123'
            })
        );

        await Promise.allSettled(promises);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Response Time Tests', () => {
    it('should maintain response times under load', async () => {
      const responseTimes: number[] = [];
      
      const promises = Array(100).fill(null).map(async (_, index) => {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUsers[index % testUsers.length].email,
            password: 'password123'
          });
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
        
        return response;
      });

      await Promise.allSettled(promises);
      
      // Calculate statistics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      
      // Average response time should be less than 500ms
      expect(avgResponseTime).toBeLessThan(500);
      
      // Max response time should be less than 2 seconds
      expect(maxResponseTime).toBeLessThan(2000);
      
      // 95th percentile should be less than 1 second
      expect(p95ResponseTime).toBeLessThan(1000);
    });
  });
});
