
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-backed rate limiting
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${identifier}:${req.path}`;
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }
    
    // Initialize or increment
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }
    
    store[key].count++;
    
    // Check limit
    if (store[key].count > options.maxRequests) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
        timestamp: new Date().toISOString(),
      });
    }
    
    next();
  };
}

// Specific rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Too many API requests, please slow down',
});
