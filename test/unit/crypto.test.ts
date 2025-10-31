import { hashPassword, verifyPassword, hashToken, verifyTokenHash } from '../../src/shared/helpers/crypto';

describe('Crypto Helper Functions', () => {
  describe('hashPassword', () => {
    it('should hash password with different salts each time', async () => {
      const password = 'TestPassword123!';
      
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Same password should produce different hashes due to different salts
      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain('$argon2id$'); // Argon2id format
      expect(hash2).toContain('$argon2id$');
    });

    it('should produce consistent hash format', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      // Should contain argon2id identifier and parameters
      expect(hash).toMatch(/^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$/);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');
    });

    it('should handle special characters in password', async () => {
      const password = 'Test@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(hash, wrongPassword);
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hash = await hashPassword('');
      const isValid = await verifyPassword(hash, '');
      expect(isValid).toBe(true);
    });

    it('should handle case sensitivity', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(hash, 'testpassword123!');
      expect(isValid).toBe(false);
    });

    it('should handle malformed hash gracefully', async () => {
      const isValid = await verifyPassword('invalid-hash', 'password');
      expect(isValid).toBe(false);
    });
  });

  describe('hashToken', () => {
    it('should hash token with different salts each time', async () => {
      const token = 'test-token-123';
      
      const hash1 = await hashToken(token);
      const hash2 = await hashToken(token);
      
      // Same token should produce different hashes due to different salts
      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain('$argon2id$');
      expect(hash2).toContain('$argon2id$');
    });

    it('should produce consistent hash format', async () => {
      const token = 'test-token-123';
      const hash = await hashToken(token);
      
      expect(hash).toMatch(/^\$argon2id\$v=\d+\$m=\d+,t=\d+,p=\d+\$/);
    });

    it('should handle empty token', async () => {
      const hash = await hashToken('');
      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');
    });
  });

  describe('verifyTokenHash', () => {
    it('should verify correct token', async () => {
      const token = 'test-token-123';
      const hash = await hashToken(token);
      
      const isValid = await verifyTokenHash(hash, token);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect token', async () => {
      const token = 'test-token-123';
      const wrongToken = 'wrong-token-456';
      const hash = await hashToken(token);
      
      const isValid = await verifyTokenHash(hash, wrongToken);
      expect(isValid).toBe(false);
    });

    it('should handle empty token verification', async () => {
      const hash = await hashToken('');
      const isValid = await verifyTokenHash(hash, '');
      expect(isValid).toBe(true);
    });

    it('should handle malformed hash gracefully', async () => {
      const isValid = await verifyTokenHash('invalid-hash', 'token');
      expect(isValid).toBe(false);
    });
  });

  describe('Performance and Security', () => {
    it('should complete password hashing within reasonable time', async () => {
      const password = 'TestPassword123!';
      const start = Date.now();
      
      await hashPassword(password);
      
      const duration = Date.now() - start;
      // Should complete within 5 seconds (test environment uses lower cost)
      expect(duration).toBeLessThan(5000);
    });

    it('should use different salts for same input', async () => {
      const password = 'TestPassword123!';
      
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Extract salt parts (everything before the hash part)
      const salt1 = hash1.split('$').slice(0, -1).join('$');
      const salt2 = hash2.split('$').slice(0, -1).join('$');
      
      expect(salt1).not.toBe(salt2);
    });

    it('should handle concurrent hashing operations', async () => {
      const password = 'TestPassword123!';
      
      const promises = Array(5).fill(null).map(() => hashPassword(password));
      const hashes = await Promise.all(promises);
      
      // All hashes should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);
    });
  });
});
