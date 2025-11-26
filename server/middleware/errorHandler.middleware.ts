/**
 * Error Handler Middleware
 * 
 * Centralized error handling for Express routes
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ServiceError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  errorResponse,
} from '../services/base.service';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Not Found handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global error handler middleware
 * Must be registered last in the Express middleware chain
 */
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error in development
  if (isDev) {
    console.error('[ErrorHandler]', error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.') || '_root';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle service-layer errors
  if (error instanceof ServiceError) {
    const response = errorResponse(error);
    return res.status(error.statusCode).json(response);
  }

  // Handle unexpected errors
  const statusCode = 500;
  const message = isDev 
    ? error.message || 'An unexpected error occurred'
    : 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    ...(isDev && { stack: error.stack }),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async route wrapper - catches async errors and passes to error handler
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrap an express router with async error handling
 * Use when you want to use try/catch-free async route handlers
 * 
 * @example
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await UserService.getById(req.params.id);
 *   res.json({ success: true, data: user });
 * }));
 */

/**
 * Log uncaught exceptions and unhandled rejections
 */
export function setupProcessErrorHandlers() {
  process.on('uncaughtException', (error: Error) => {
    console.error('[CRITICAL] Uncaught Exception:', error);
    // In production, you might want to gracefully shutdown
    // process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

/**
 * Create error with additional metadata
 */
export function createError(
  message: string,
  statusCode: number,
  code: string,
  details?: Record<string, unknown>
): ServiceError & { details?: Record<string, unknown> } {
  const error = new ServiceError(message, statusCode, code);
  if (details) {
    (error as any).details = details;
  }
  return error as ServiceError & { details?: Record<string, unknown> };
}

/**
 * Standard error codes
 */
export const ErrorCodes = {
  // Client Errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  
  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
