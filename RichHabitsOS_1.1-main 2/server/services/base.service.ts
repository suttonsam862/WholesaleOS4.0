/**
 * Base Service Layer
 * Provides common error handling, validation, and activity logging patterns
 */

import { storage } from '../storage';

// Custom error classes for service layer
export class ServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  
  constructor(message: string, statusCode: number = 500, code: string = 'SERVICE_ERROR') {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends ServiceError {
  public readonly details?: Record<string, string[]>;
  
  constructor(message: string, details?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id: string | number) {
    super(`${resource} with ID ${id} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InvalidTransitionError extends ValidationError {
  constructor(entity: string, from: string, to: string) {
    super(`Invalid ${entity} status transition from "${from}" to "${to}"`);
    this.name = 'InvalidTransitionError';
  }
}

// Activity logging helper
export interface ActivityLogEntry {
  entityType: string;
  entityId: number;
  action: string;
  userId: string;
  details?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
}

/**
 * Log an activity for audit purposes
 */
export async function logActivity(entry: ActivityLogEntry): Promise<void> {
  try {
    await storage.logActivity(
      entry.userId,
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.previousState,
      entry.newState
    );
  } catch (error) {
    // Log but don't fail the main operation
    console.error('[ActivityLog] Failed to log activity:', error);
  }
}

/**
 * Standard API response shape
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
  timestamp: string;
}

/**
 * Create a standardized success response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create a standardized paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: Error | ServiceError
): ApiErrorResponse {
  if (error instanceof ServiceError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error instanceof ValidationError ? error.details : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };
}
