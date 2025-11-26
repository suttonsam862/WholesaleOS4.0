import { describe, it, expect } from 'vitest';
import { LocalAuthManager } from '../../server/localAuth';

/**
 * LocalAuthManager Unit Tests
 * Tests authentication utilities without database dependencies
 */
describe('LocalAuthManager', () => {
  describe('createLocalSession', () => {
    it('should create session with correct structure', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: 'admin' as const,
        isActive: true,
      };

      const session = LocalAuthManager.createLocalSession(user);

      expect(session).toHaveProperty('claims');
      expect(session).toHaveProperty('userData');
      expect(session).toHaveProperty('access_token');
      expect(session).toHaveProperty('refresh_token');
      expect(session).toHaveProperty('expires_at');
      expect(session).toHaveProperty('authMethod', 'local');
    });

    it('should create claims with correct user data', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: 'sales' as const,
        isActive: true,
      };

      const session = LocalAuthManager.createLocalSession(user);

      expect(session.claims.sub).toBe(user.id);
      expect(session.claims.email).toBe(user.email);
      expect(session.claims.first_name).toBe(user.firstName);
      expect(session.claims.last_name).toBe(user.lastName);
      expect(session.claims.role).toBe(user.role);
    });

    it('should set expiration 7 days in future', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: 'admin' as const,
        isActive: true,
      };

      const before = Math.floor(Date.now() / 1000);
      const session = LocalAuthManager.createLocalSession(user);
      const after = Math.floor(Date.now() / 1000);

      const expectedExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
      
      expect(session.expires_at).toBeGreaterThanOrEqual(before + expectedExpiry);
      expect(session.expires_at).toBeLessThanOrEqual(after + expectedExpiry + 1);
    });

    it('should include all required JWT claims', () => {
      const user = {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: 'designer' as const,
        isActive: true,
      };

      const session = LocalAuthManager.createLocalSession(user);

      expect(session.claims).toHaveProperty('sub');
      expect(session.claims).toHaveProperty('email');
      expect(session.claims).toHaveProperty('exp');
      expect(session.claims).toHaveProperty('aud', 'local-auth');
      expect(session.claims).toHaveProperty('iat');
      expect(session.claims).toHaveProperty('iss', 'local-auth');
    });
  });
});
