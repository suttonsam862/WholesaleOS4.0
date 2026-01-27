/**
 * API Key Authentication Middleware
 *
 * Handles Bearer token authentication for external API access (Hydrogen storefront, etc.)
 * Validates API keys, checks scopes, and tracks usage.
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { apiKeys } from '../../shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Define scope types
export type ApiScope =
  | 'read:customers'
  | 'write:customers'
  | 'read:orders'
  | 'write:orders'
  | 'read:design-jobs'
  | 'write:design-jobs'
  | 'read:events'
  | 'write:events'
  | 'read:messages'
  | 'write:messages'
  | 'read:products';

// Extend Express Request to include API key context
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        name: string;
        scopes: string[];
      };
      isExternalApi?: boolean;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to authenticate API requests using Bearer tokens
 * Use this for /api/external/* routes
 */
export function authenticateApiKey(requiredScopes: ApiScope[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractBearerToken(req.headers.authorization);

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header. Use: Bearer <api_key>',
        });
      }

      // Extract prefix for quick lookup (first 12 chars: "wos_live_" + 3 chars)
      const keyPrefix = token.substring(0, 12);

      // Find API key by prefix (not revoked)
      const [apiKeyRecord] = await db
        .select()
        .from(apiKeys)
        .where(
          and(
            eq(apiKeys.keyPrefix, keyPrefix),
            isNull(apiKeys.revokedAt)
          )
        )
        .limit(1);

      if (!apiKeyRecord) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key',
        });
      }

      // Check if key is expired
      if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'API key has expired',
        });
      }

      // Verify the full key hash
      const isValidKey = await bcrypt.compare(token, apiKeyRecord.keyHash);
      if (!isValidKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key',
        });
      }

      // Check required scopes
      const keyScopes = apiKeyRecord.scopes || [];
      const missingScopes = requiredScopes.filter(scope => !keyScopes.includes(scope));

      if (missingScopes.length > 0) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Missing required scopes: ${missingScopes.join(', ')}`,
          required: requiredScopes,
          granted: keyScopes,
        });
      }

      // Update last used timestamp (non-blocking)
      db.update(apiKeys)
        .set({
          lastUsedAt: new Date(),
          lastUsedIp: req.ip || req.socket.remoteAddress || 'unknown',
          updatedAt: new Date(),
        })
        .where(eq(apiKeys.id, apiKeyRecord.id))
        .catch(err => console.error('Failed to update API key last used:', err));

      // Attach API key info to request
      req.apiKey = {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        scopes: keyScopes,
      };
      req.isExternalApi = true;

      next();
    } catch (error) {
      console.error('API key authentication error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to authenticate API key',
      });
    }
  };
}

/**
 * Check if the current request has a specific scope
 */
export function hasScope(req: Request, scope: ApiScope): boolean {
  if (!req.apiKey) return false;
  return req.apiKey.scopes.includes(scope);
}

/**
 * Generate a new API key
 * Returns the plain text key (only shown once) and the data to store
 */
export async function generateApiKey(
  name: string,
  scopes: ApiScope[],
  createdBy: string,
  options?: {
    description?: string;
    expiresAt?: Date;
  }
): Promise<{
  plainTextKey: string;
  keyData: {
    name: string;
    keyHash: string;
    keyPrefix: string;
    scopes: string[];
    description?: string;
    expiresAt?: Date;
    createdBy: string;
  };
}> {
  // Generate a secure random key: wos_live_ + 32 random chars
  const randomPart = generateSecureRandomString(32);
  const plainTextKey = `wos_live_${randomPart}`;
  const keyPrefix = plainTextKey.substring(0, 12);

  // Hash the key for storage
  const keyHash = await bcrypt.hash(plainTextKey, 12);

  return {
    plainTextKey,
    keyData: {
      name,
      keyHash,
      keyPrefix,
      scopes,
      description: options?.description,
      expiresAt: options?.expiresAt,
      createdBy,
    },
  };
}

/**
 * Generate a cryptographically secure random string
 */
function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, revokedBy: string): Promise<boolean> {
  const result = await db
    .update(apiKeys)
    .set({
      revokedAt: new Date(),
      revokedBy,
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, keyId));

  return true;
}
