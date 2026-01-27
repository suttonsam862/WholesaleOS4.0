/**
 * API Key Management Routes
 *
 * Admin routes for creating, listing, and revoking API keys.
 * These routes use session authentication (admin only).
 *
 * Base path: /api/admin/api-keys
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import { apiKeys } from '../../shared/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { generateApiKey, revokeApiKey, type ApiScope } from '../middleware/apiKey.middleware';

// Available scopes for API keys
const AVAILABLE_SCOPES: ApiScope[] = [
  'read:customers',
  'write:customers',
  'read:orders',
  'write:orders',
  'read:design-jobs',
  'write:design-jobs',
  'read:events',
  'write:events',
  'read:messages',
  'write:messages',
  'read:products',
];

export function registerApiKeyRoutes(app: Express) {
  /**
   * Middleware to ensure user is authenticated and is admin
   */
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = (req as any).user?.userData;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    next();
  };

  /**
   * List all API keys (without showing the actual key)
   */
  app.get('/api/admin/api-keys', requireAdmin, async (req: Request, res: Response) => {
    try {
      const keys = await db
        .select({
          id: apiKeys.id,
          name: apiKeys.name,
          keyPrefix: apiKeys.keyPrefix,
          scopes: apiKeys.scopes,
          description: apiKeys.description,
          lastUsedAt: apiKeys.lastUsedAt,
          lastUsedIp: apiKeys.lastUsedIp,
          expiresAt: apiKeys.expiresAt,
          revokedAt: apiKeys.revokedAt,
          createdBy: apiKeys.createdBy,
          createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .orderBy(desc(apiKeys.createdAt));

      res.json(
        keys.map(key => ({
          ...key,
          keyPreview: `${key.keyPrefix}${'*'.repeat(24)}`, // Show prefix only
          isActive: !key.revokedAt && (!key.expiresAt || new Date(key.expiresAt) > new Date()),
        }))
      );
    } catch (error) {
      console.error('Error listing API keys:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * Get available scopes
   */
  app.get('/api/admin/api-keys/scopes', requireAdmin, async (req: Request, res: Response) => {
    res.json({
      scopes: AVAILABLE_SCOPES,
      groups: {
        customers: ['read:customers', 'write:customers'],
        orders: ['read:orders', 'write:orders'],
        'design-jobs': ['read:design-jobs', 'write:design-jobs'],
        events: ['read:events', 'write:events'],
        messages: ['read:messages', 'write:messages'],
        products: ['read:products'],
      },
      presets: {
        'hydrogen-storefront': [
          'read:customers',
          'read:orders',
          'read:design-jobs',
          'write:design-jobs',
          'read:events',
          'write:events',
          'read:products',
        ],
        'mobile-app': [
          'read:customers',
          'read:orders',
          'read:events',
        ],
        'read-only': [
          'read:customers',
          'read:orders',
          'read:design-jobs',
          'read:events',
          'read:products',
        ],
      },
    });
  });

  /**
   * Create a new API key
   *
   * IMPORTANT: The plainTextKey is only returned once!
   * Store it securely - it cannot be retrieved again.
   */
  app.post('/api/admin/api-keys', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, scopes, description, expiresAt } = req.body;
      const user = (req as any).user?.userData;

      // Validate input
      if (!name || typeof name !== 'string' || name.length < 1) {
        return res.status(400).json({ error: 'Name is required' });
      }

      if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
        return res.status(400).json({ error: 'At least one scope is required' });
      }

      // Validate scopes
      const invalidScopes = scopes.filter(s => !AVAILABLE_SCOPES.includes(s));
      if (invalidScopes.length > 0) {
        return res.status(400).json({
          error: `Invalid scopes: ${invalidScopes.join(', ')}`,
          availableScopes: AVAILABLE_SCOPES,
        });
      }

      // Generate the API key
      const { plainTextKey, keyData } = await generateApiKey(
        name,
        scopes as ApiScope[],
        user.id,
        {
          description,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        }
      );

      // Store in database
      const [created] = await db
        .insert(apiKeys)
        .values({
          ...keyData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json({
        success: true,
        message: 'API key created successfully. Store this key securely - it will not be shown again!',
        apiKey: {
          id: created.id,
          name: created.name,
          key: plainTextKey, // Only time this is shown!
          keyPreview: `${created.keyPrefix}${'*'.repeat(24)}`,
          scopes: created.scopes,
          description: created.description,
          expiresAt: created.expiresAt,
          createdAt: created.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * Update an API key (only name, description, scopes can be updated)
   */
  app.patch('/api/admin/api-keys/:keyId', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { keyId } = req.params;
      const { name, description, scopes } = req.body;

      const [existing] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, keyId))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: 'API key not found' });
      }

      if (existing.revokedAt) {
        return res.status(400).json({ error: 'Cannot update a revoked API key' });
      }

      const updateData: any = { updatedAt: new Date() };

      if (name !== undefined) {
        updateData.name = name;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (scopes !== undefined) {
        const invalidScopes = scopes.filter((s: string) => !AVAILABLE_SCOPES.includes(s as ApiScope));
        if (invalidScopes.length > 0) {
          return res.status(400).json({
            error: `Invalid scopes: ${invalidScopes.join(', ')}`,
            availableScopes: AVAILABLE_SCOPES,
          });
        }
        updateData.scopes = scopes;
      }

      await db
        .update(apiKeys)
        .set(updateData)
        .where(eq(apiKeys.id, keyId));

      res.json({ success: true, message: 'API key updated successfully' });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * Revoke an API key
   */
  app.post('/api/admin/api-keys/:keyId/revoke', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { keyId } = req.params;
      const user = (req as any).user?.userData;

      const [existing] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, keyId))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: 'API key not found' });
      }

      if (existing.revokedAt) {
        return res.status(400).json({ error: 'API key is already revoked' });
      }

      await revokeApiKey(keyId, user.id);

      res.json({ success: true, message: 'API key revoked successfully' });
    } catch (error) {
      console.error('Error revoking API key:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  /**
   * Delete an API key permanently (only if already revoked)
   */
  app.delete('/api/admin/api-keys/:keyId', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { keyId } = req.params;

      const [existing] = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.id, keyId))
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: 'API key not found' });
      }

      if (!existing.revokedAt) {
        return res.status(400).json({
          error: 'Cannot delete an active API key. Revoke it first.',
        });
      }

      await db.delete(apiKeys).where(eq(apiKeys.id, keyId));

      res.json({ success: true, message: 'API key deleted permanently' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
