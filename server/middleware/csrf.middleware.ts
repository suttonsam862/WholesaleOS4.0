
import { Request, Response, NextFunction, RequestHandler } from 'express';
import crypto from 'crypto';

declare module 'express-session' {
  interface SessionData {
    csrfSecret?: string;
  }
}

/**
 * Generate a CSRF token for the current session
 */
export function generateCsrfToken(req: Request): string {
  if (!req.session.csrfSecret) {
    req.session.csrfSecret = crypto.randomBytes(32).toString('hex');
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto
    .createHmac('sha256', req.session.csrfSecret)
    .update(token)
    .digest('hex');
  
  return `${token}.${hash}`;
}

/**
 * Validate a CSRF token against the session secret
 */
export function validateCsrfToken(req: Request, token: string): boolean {
  if (!req.session.csrfSecret) {
    return false;
  }
  
  const [tokenPart, hashPart] = token.split('.');
  if (!tokenPart || !hashPart) {
    return false;
  }
  
  const expectedHash = crypto
    .createHmac('sha256', req.session.csrfSecret)
    .update(tokenPart)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hashPart),
    Buffer.from(expectedHash)
  );
}

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing requests
 */
export const csrfProtection: RequestHandler = (req, res, next) => {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Skip CSRF for public endpoints (customer portal, etc.)
  if (req.path.startsWith('/api/public/')) {
    return next();
  }
  
  // Skip CSRF for local auth login (needs special handling)
  if (req.path === '/api/auth/local/login') {
    return next();
  }
  
  // Skip CSRF for internal geocoding endpoints (protected by authentication)
  if (req.path === '/api/sales-map/geocode-organizations' || req.path === '/api/sales-map/geocode-leads') {
    return next();
  }
  
  // Get token from header or body
  const token = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!token || !validateCsrfToken(req, token)) {
    console.warn(`⚠️ CSRF validation failed for ${req.method} ${req.path}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
      code: 'CSRF_VALIDATION_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
};

/**
 * Endpoint to get a CSRF token
 */
export const getCsrfToken: RequestHandler = (req, res) => {
  const token = generateCsrfToken(req);
  res.json({ csrfToken: token });
};
