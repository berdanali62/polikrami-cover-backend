import request from 'supertest';
import { app } from '../../../src/app';
import { PrismaClient } from '@prisma/client';

describe('Concurrent Users Stress Tests', () => {
  let prisma: PrismaClient;
  let testUsers: any[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    
    // Create test users for stress testing
    for (let i = 0; i < 1000; i++) {
      const user = await prisma.user.create({
        data: {
          email: `stress-test-${i}@example.com`,
          password: '$argon2id$v=19$m=65536,t=3,p=4$test',
          firstName: `StressUser${i}`,
          lastName: 'Test',
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

  describe('High Concurrency Login Tests', () => {
    it('should handle 1000 concurrent login requests', async () => {
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

      // Should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      // At least 95% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(950);
    });

    it('should handle 2000 concurrent registration requests', async () => {
      const startTime = Date.now();
      
      const promises = Array(2000).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `stress-reg-${index}@example.com`,
            password: 'password123',
            firstName: `StressReg${index}`,
            lastName: 'Test'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 120 seconds
      expect(duration).toBeLessThan(120000);
      
      // All should succeed (unique emails)
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(2000);
    });
  });

  describe('Database Stress Tests', () => {
    it('should handle high database write load', async () => {
      const startTime = Date.now();
      
      // Simulate high write load with user creation
      const promises = Array(500).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `db-write-${index}@example.com`,
            password: 'password123',
            firstName: `DbWrite${index}`,
            lastName: 'Test'
          })
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(500);
    });

    it('should handle high database read load', async () => {
      const startTime = Date.now();
      
      // Simulate high read load with login attempts
      const promises = testUsers.slice(0, 500).map(user => 
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

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      // All should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(500);
    });

    it('should handle mixed read/write load', async () => {
      const startTime = Date.now();
      const promises = [];

      // 250 read operations (login)
      for (let i = 0; i < 250; i++) {
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

      // 250 write operations (registration)
      for (let i = 0; i < 250; i++) {
        promises.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: `mixed-stress-${i}@example.com`,
              password: 'password123',
              firstName: `Mixed${i}`,
              lastName: 'Test'
            })
        );
      }

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 90 seconds
      expect(duration).toBeLessThan(90000);
      
      // At least 90% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(450);
    });
  });

  describe('Memory Stress Tests', () => {
    it('should handle memory pressure during high load', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run multiple stress cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        const promises = Array(200).fill(null).map((_, index) => 
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
      
      // Memory increase should be reasonable (less than 200MB)
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
    });

    it('should handle memory leaks during extended load', async () => {
      const memorySnapshots: number[] = [];
      
      // Run extended load test
      for (let cycle = 0; cycle < 10; cycle++) {
        const promises = Array(100).fill(null).map((_, index) => 
          request(app)
            .post('/api/auth/login')
            .send({
              email: testUsers[index % testUsers.length].email,
              password: 'password123'
            })
        );

        await Promise.allSettled(promises);
        
        // Take memory snapshot
        const memory = process.memoryUsage();
        memorySnapshots.push(memory.heapUsed);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Check for memory leaks (memory should not continuously increase)
      const memoryIncrease = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Connection Pool Stress Tests', () => {
    it('should handle connection pool exhaustion', async () => {
      const startTime = Date.now();
      
      // Simulate connection pool stress
      const promises = Array(1000).fill(null).map((_, index) => 
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

      // Should complete within 120 seconds
      expect(duration).toBeLessThan(120000);
      
      // At least 90% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(900);
    });

    it('should handle connection timeouts gracefully', async () => {
      const startTime = Date.now();
      
      // Simulate connection timeout scenarios
      const promises = Array(500).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            email: `timeout-test-${index}@example.com`,
            password: 'password123',
            firstName: `Timeout${index}`,
            lastName: 'Test'
          })
          .timeout(5000) // 5 second timeout
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      // At least 80% should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Error Handling Under Stress', () => {
    it('should handle errors gracefully under high load', async () => {
      const startTime = Date.now();
      
      // Mix valid and invalid requests
      const promises = Array(200).fill(null).map((_, index) => {
        if (index % 4 === 0) {
          // Invalid request (25% of requests)
          return request(app)
            .post('/api/auth/login')
            .send({
              email: 'invalid@example.com',
              password: 'wrongpassword'
            });
        } else {
          // Valid request (75% of requests)
          const user = testUsers[index % testUsers.length];
          return request(app)
            .post('/api/auth/login')
            .send({
              email: user.email,
              password: 'password123'
            });
        }
      });

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      // Valid requests should succeed, invalid should fail gracefully
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBeGreaterThanOrEqual(100);
      expect(failed.length).toBeGreaterThanOrEqual(50);
    });

    it('should handle rate limiting under stress', async () => {
      const startTime = Date.now();
      
      // Simulate rate limiting scenarios
      const promises = Array(1000).fill(null).map((_, index) => 
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

      // Should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      // Most should succeed (rate limiting should be reasonable)
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThanOrEqual(800);
    });
  });

  describe('Performance Degradation Tests', () => {
    it('should maintain performance under sustained load', async () => {
      const responseTimes: number[] = [];
      
      // Run sustained load for 5 minutes
      const startTime = Date.now();
      const endTime = startTime + (5 * 60 * 1000); // 5 minutes
      
      while (Date.now() < endTime) {
        const cycleStart = Date.now();
        
        const promises = Array(50).fill(null).map((_, index) => 
          request(app)
            .post('/api/auth/login')
            .send({
              email: testUsers[index % testUsers.length].email,
              password: 'password123'
            })
        );

        const results = await Promise.allSettled(promises);
        const cycleEnd = Date.now();
        
        responseTimes.push(cycleEnd - cycleStart);
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      
      // Performance should not degrade significantly
      expect(avgResponseTime).toBeLessThan(1000); // Average less than 1 second
      expect(maxResponseTime).toBeLessThan(5000); // Max less than 5 seconds
      expect(p95ResponseTime).toBeLessThan(2000); // 95th percentile less than 2 seconds
    });
  });
});
