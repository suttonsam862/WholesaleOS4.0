import { describe, it, expect } from 'vitest';

/**
 * Health Check API Tests
 * Tests the /api/health and /api/ready endpoints
 */
describe('Health Check Endpoints', () => {
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';

  describe('GET /api/health', () => {
    it('should return healthy status with correct structure', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('version');
      
      // Validate types
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThan(0);
    });

    it('should include valid timestamp', async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      const timestamp = new Date(data.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      
      // Timestamp should be recent (within last 5 seconds)
      const now = Date.now();
      const timestampMs = timestamp.getTime();
      expect(Math.abs(now - timestampMs)).toBeLessThan(5000);
    });
  });

  describe('GET /api/ready', () => {
    it('should return readiness status with checks', async () => {
      const response = await fetch(`${BASE_URL}/api/ready`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'ready');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('checks');
      
      // Validate checks structure
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('session');
      expect(data.checks).toHaveProperty('auth');
    });

    it('should have checks with boolean values', async () => {
      const response = await fetch(`${BASE_URL}/api/ready`);
      const data = await response.json();

      // Checks should exist and be booleans
      expect(typeof data.checks.database).toBe('boolean');
      expect(typeof data.checks.session).toBe('boolean');
      expect(typeof data.checks.auth).toBe('boolean');
      
      // Session and auth should always be true when server is running
      expect(data.checks.session).toBe(true);
      expect(data.checks.auth).toBe(true);
      
      // Database may be false in CI environments without database
      // That's acceptable as long as the server responds
    });
  });
});
