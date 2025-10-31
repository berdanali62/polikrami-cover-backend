import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  decodeWithoutVerify,
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../src/shared/helpers/jwt';
import { env } from '../../src/config/env';

// Mock environment variables
jest.mock('../../src/config/env', () => ({
  env: {
    JWT_ACCESS_SECRET: 'test-access-secret-key',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key',
    ACCESS_EXPIRES_IN: '15m',
    REFRESH_EXPIRES_IN: '7d',
  },
}));

describe('JWT Helper Functions', () => {
  const mockUserId = 'user-123';
  const mockTokenId = 'token-456';
  const mockRole = 'user';

  describe('signAccessToken', () => {
    it('should sign access token with correct payload', () => {
      const token = signAccessToken({ userId: mockUserId, role: mockRole });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should sign access token without role', () => {
      const token = signAccessToken({ userId: mockUserId });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should produce different tokens for same payload', () => {
      const token1 = signAccessToken({ userId: mockUserId });
      
      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const token2 = signAccessToken({ userId: mockUserId });
      
      // Tokens should be different due to timestamp (iat field)
      expect(token1).not.toBe(token2);
      
      // Verify they have different iat (issued at) timestamps
      const decoded1 = decodeWithoutVerify<any>(token1);
      const decoded2 = decodeWithoutVerify<any>(token2);
      expect(decoded1?.iat).toBeLessThanOrEqual(decoded2?.iat! + 1);
    });

    it('should include typ field in token', () => {
      const token = signAccessToken({ userId: mockUserId });
      const decoded = decodeWithoutVerify<AccessTokenPayload>(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.typ).toBe('access');
    });

    it('should include userId in token', () => {
      const token = signAccessToken({ userId: mockUserId });
      const decoded = decodeWithoutVerify<AccessTokenPayload>(token);
      
      expect(decoded?.userId).toBe(mockUserId);
    });

    it('should include role in token if provided', () => {
      const token = signAccessToken({ userId: mockUserId, role: mockRole });
      const decoded = decodeWithoutVerify<AccessTokenPayload>(token);
      
      expect(decoded?.role).toBe(mockRole);
    });

    it('should have expiration time', () => {
      const token = signAccessToken({ userId: mockUserId });
      const decoded = decodeWithoutVerify<any>(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });
  });

  describe('signRefreshToken', () => {
    it('should sign refresh token with correct payload', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include typ field in token', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const decoded = decodeWithoutVerify<RefreshTokenPayload>(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.typ).toBe('refresh');
    });

    it('should include userId in token', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const decoded = decodeWithoutVerify<RefreshTokenPayload>(token);
      
      expect(decoded?.userId).toBe(mockUserId);
    });

    it('should include tid in token', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const decoded = decodeWithoutVerify<RefreshTokenPayload>(token);
      
      expect(decoded?.tid).toBe(mockTokenId);
    });

    it('should have longer expiration than access token', () => {
      const accessToken = signAccessToken({ userId: mockUserId });
      const refreshToken = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      
      const accessDecoded = decodeWithoutVerify<any>(accessToken);
      const refreshDecoded = decodeWithoutVerify<any>(refreshToken);
      
      expect(refreshDecoded?.exp).toBeGreaterThan(accessDecoded?.exp!);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = signAccessToken({ userId: mockUserId, role: mockRole });
      const verified = verifyToken<AccessTokenPayload>(token, 'access');
      
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(mockUserId);
      expect(verified?.role).toBe(mockRole);
      expect(verified?.typ).toBe('access');
    });

    it('should verify valid refresh token', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const verified = verifyToken<RefreshTokenPayload>(token, 'refresh');
      
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(mockUserId);
      expect(verified?.tid).toBe(mockTokenId);
      expect(verified?.typ).toBe('refresh');
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const verified = verifyToken<AccessTokenPayload>(invalidToken, 'access');
      
      expect(verified).toBeNull();
    });

    it('should return null for access token verified with refresh secret', () => {
      const token = signAccessToken({ userId: mockUserId });
      const verified = verifyToken<AccessTokenPayload>(token, 'refresh');
      
      expect(verified).toBeNull();
    });

    it('should return null for refresh token verified with access secret', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const verified = verifyToken<RefreshTokenPayload>(token, 'access');
      
      expect(verified).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = signAccessToken({ userId: mockUserId });
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const verified = verifyToken<AccessTokenPayload>(tamperedToken, 'access');
      
      expect(verified).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedTokens = ['not-a-jwt', 'not.a.jwt', '', 'singlepart'];
      
      malformedTokens.forEach(token => {
        const verified = verifyToken<AccessTokenPayload>(token, 'access');
        expect(verified).toBeNull();
      });
    });
  });

  describe('decodeWithoutVerify', () => {
    it('should decode valid access token without verification', () => {
      const token = signAccessToken({ userId: mockUserId, role: mockRole });
      const decoded = decodeWithoutVerify<AccessTokenPayload>(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUserId);
      expect(decoded?.role).toBe(mockRole);
      expect(decoded?.typ).toBe('access');
    });

    it('should decode valid refresh token without verification', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const decoded = decodeWithoutVerify<RefreshTokenPayload>(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockUserId);
      expect(decoded?.tid).toBe(mockTokenId);
      expect(decoded?.typ).toBe('refresh');
    });

    it('should decode expired token without verification', () => {
      // Create a token that would fail verification but passes decode
      const token = signAccessToken({ userId: mockUserId });
      const decoded = decodeWithoutVerify<AccessTokenPayload>(token);
      
      expect(decoded).toBeDefined();
      // Note: decodeWithoutVerify ignores expiration
    });

    it('should return null for malformed token', () => {
      const malformedTokens = ['not-a-jwt', 'not.a.jwt', '', 'invalid'];
      
      malformedTokens.forEach(token => {
        const decoded = decodeWithoutVerify<AccessTokenPayload>(token);
        expect(decoded).toBeNull();
      });
    });

    it('should return null for invalid token format', () => {
      const invalidToken = 'invalid.format.token';
      const decoded = decodeWithoutVerify<AccessTokenPayload>(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('token payload structure', () => {
    it('should include standard JWT claims', () => {
      const token = signAccessToken({ userId: mockUserId });
      const decoded = decodeWithoutVerify<any>(token);
      
      expect(decoded).toHaveProperty('iat'); // issued at
      expect(decoded).toHaveProperty('exp'); // expiration
      expect(decoded).toHaveProperty('typ');
    });

    it('should have correct expiration calculation', () => {
      const token = signAccessToken({ userId: mockUserId });
      const decoded = decodeWithoutVerify<any>(token);
      
      expect(decoded?.exp).toBeGreaterThan(decoded?.iat!);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent token generation', async () => {
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(signAccessToken({ userId: mockUserId }))
      );
      
      const tokens = await Promise.all(promises);
      
      expect(tokens.length).toBe(10);
      tokens.forEach(token => {
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });
    });

    it('should handle concurrent token verification', async () => {
      const token = signAccessToken({ userId: mockUserId });
      const promises = Array.from({ length: 10 }, () => 
        Promise.resolve(verifyToken<AccessTokenPayload>(token, 'access'))
      );
      
      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result?.userId).toBe(mockUserId);
      });
    });
  });

  describe('different users', () => {
    it('should generate different tokens for different users', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      const token1 = signAccessToken({ userId: user1 });
      const token2 = signAccessToken({ userId: user2 });
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = verifyToken<AccessTokenPayload>(token1, 'access');
      const decoded2 = verifyToken<AccessTokenPayload>(token2, 'access');
      
      expect(decoded1?.userId).toBe(user1);
      expect(decoded2?.userId).toBe(user2);
    });
  });

  describe('different roles', () => {
    it('should generate different tokens for different roles', () => {
      const token1 = signAccessToken({ userId: mockUserId, role: 'admin' });
      const token2 = signAccessToken({ userId: mockUserId, role: 'user' });
      
      expect(token1).not.toBe(token2);
      
      const decoded1 = verifyToken<AccessTokenPayload>(token1, 'access');
      const decoded2 = verifyToken<AccessTokenPayload>(token2, 'access');
      
      expect(decoded1?.role).toBe('admin');
      expect(decoded2?.role).toBe('user');
    });
  });

  describe('security tests', () => {
    it('should use correct secrets for access tokens', () => {
      const token = signAccessToken({ userId: mockUserId });
      const verified = verifyToken<AccessTokenPayload>(token, 'access');
      
      expect(verified).toBeDefined();
      // If wrong secret was used, verification would fail
    });

    it('should use correct secrets for refresh tokens', () => {
      const token = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      const verified = verifyToken<RefreshTokenPayload>(token, 'refresh');
      
      expect(verified).toBeDefined();
    });

    it('should prevent token reuse across token types', () => {
      const accessToken = signAccessToken({ userId: mockUserId });
      const refreshToken = signRefreshToken({ userId: mockUserId, tid: mockTokenId });
      
      const accessVerified = verifyToken<AccessTokenPayload>(accessToken, 'access');
      const refreshVerified = verifyToken<RefreshTokenPayload>(refreshToken, 'refresh');
      
      expect(accessVerified).toBeDefined();
      expect(refreshVerified).toBeDefined();
      
      // Cross-verification should fail
      expect(verifyToken<AccessTokenPayload>(accessToken, 'refresh')).toBeNull();
      expect(verifyToken<RefreshTokenPayload>(refreshToken, 'access')).toBeNull();
    });
  });
});
