/**
 * Validation Middleware
 * 
 * Provides Zod-based request validation for Express routes
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../services/base.service';

/**
 * Type-safe request with validated body
 */
export interface ValidatedRequest<T> extends Request {
  validatedBody: T;
}

/**
 * Type-safe request with validated params
 */
export interface ValidatedParamsRequest<T> extends Request {
  validatedParams: T;
}

/**
 * Type-safe request with validated query
 */
export interface ValidatedQueryRequest<T> extends Request {
  validatedQuery: T;
}

/**
 * Create a validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }
      
      (req as ValidatedRequest<T>).validatedBody = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create a validation middleware for request params
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.params);
      
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        return res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }
      
      (req as ValidatedParamsRequest<T>).validatedParams = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Create a validation middleware for request query
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.query);
      
      if (!result.success) {
        const errors = formatZodErrors(result.error);
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: errors,
          timestamp: new Date().toISOString(),
        });
      }
      
      (req as ValidatedQueryRequest<T>).validatedQuery = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Format Zod errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  
  return errors;
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  // ID parameter schema
  idParam: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a positive integer').transform(Number),
  }),
  
  // Pagination query schema
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  }),
  
  // Date range query schema
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  
  // Search query schema
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    search: z.string().min(1).max(100).optional(),
  }),
  
  // Sort query schema
  sort: z.object({
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
};

/**
 * Combine multiple schemas
 */
export function combineSchemas<T extends z.ZodRawShape>(
  ...schemas: z.ZodObject<T>[]
): z.ZodObject<T> {
  if (schemas.length === 0) {
    return z.object({} as T);
  }
  return schemas.reduce((acc, schema) => acc.merge(schema) as z.ZodObject<T>);
}
