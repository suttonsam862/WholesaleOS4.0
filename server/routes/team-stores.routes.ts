import { Express } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { 
  insertTeamStoreSchema, 
  teamStoreLineItems,
  orderLineItems,
  productVariants,
  products
} from '@shared/schema';
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from './shared/middleware';
import { storage } from '../storage';

export function registerTeamStoresRoutes(app: Express): void {
  // Get all active team stores
  app.get('/api/team-stores', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData;
      const teamStores = await storage.getTeamStores(user);
      res.json(teamStores);
    } catch (error) {
      console.error("Error fetching team stores:", error);
      res.status(500).json({ message: "Failed to fetch team stores" });
    }
  });

  // Get archived team stores
  app.get('/api/team-stores/archived/list', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData;
      const archivedTeamStores = await storage.getArchivedTeamStores(user);
      res.json(archivedTeamStores);
    } catch (error) {
      console.error("Error fetching archived team stores:", error);
      res.status(500).json({ message: "Failed to fetch archived team stores" });
    }
  });

  // Get single team store by ID
  app.get('/api/team-stores/:id', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team store ID" });
      }
      const user = (req as AuthenticatedRequest).user.userData;
      const teamStore = await storage.getTeamStore(id, user);
      if (!teamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }
      res.json(teamStore);
    } catch (error) {
      console.error("Error fetching team store:", error);
      res.status(500).json({ message: "Failed to fetch team store" });
    }
  });

  // Create new team store
  app.post('/api/team-stores', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const { lineItemIds, ...teamStoreData } = req.body;
      const validatedData = insertTeamStoreSchema.parse(teamStoreData);
      
      // Validate lineItemIds array
      const lineItemIdsSchema = z.array(z.number().int().positive()).optional();
      const validatedLineItemIds = lineItemIdsSchema.parse(lineItemIds) || [];
      
      const teamStore = await storage.createTeamStore(validatedData, validatedLineItemIds);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        teamStore.id,
        'created',
        null,
        teamStore
      );

      res.status(201).json(teamStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating team store:", error);
      res.status(500).json({ message: "Failed to create team store" });
    }
  });

  // Update team store
  app.put('/api/team-stores/:id', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team store ID" });
      }
      const user = (req as AuthenticatedRequest).user.userData;
      const existingTeamStore = await storage.getTeamStore(id, user);
      if (!existingTeamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }

      const validatedData = insertTeamStoreSchema.partial().parse(req.body);
      const updatedTeamStore = await storage.updateTeamStore(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        id,
        'updated',
        existingTeamStore,
        updatedTeamStore
      );

      res.json(updatedTeamStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating team store:", error);
      res.status(500).json({ message: "Failed to update team store" });
    }
  });

  // Archive team store
  app.put('/api/team-stores/:id/archive', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team store ID" });
      }
      const user = (req as AuthenticatedRequest).user.userData;
      const teamStore = await storage.archiveTeamStore(id, user!.id);

      if (!teamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }

      // Log activity
      await storage.logActivity(
        user!.id,
        'team_store',
        id,
        'archived',
        null,
        teamStore
      );

      res.json(teamStore);
    } catch (error) {
      console.error("Error archiving team store:", error);
      res.status(500).json({ message: "Failed to archive team store" });
    }
  });

  // Unarchive team store
  app.put('/api/team-stores/:id/unarchive', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team store ID" });
      }
      const teamStore = await storage.unarchiveTeamStore(id);

      if (!teamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        id,
        'unarchived',
        null,
        teamStore
      );

      res.json(teamStore);
    } catch (error) {
      console.error("Error unarchiving team store:", error);
      res.status(500).json({ message: "Failed to unarchive team store" });
    }
  });

  // Delete team store
  app.delete('/api/team-stores/:id', isAuthenticated, loadUserData, requirePermission('orders', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team store ID" });
      }
      const user = (req as AuthenticatedRequest).user.userData;
      const existingTeamStore = await storage.getTeamStore(id, user);
      
      if (!existingTeamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }
      
      await storage.deleteTeamStore(id);

      // Log activity
      await storage.logActivity(
        user!.id,
        'team_store',
        id,
        'deleted',
        existingTeamStore,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team store:", error);
      res.status(500).json({ message: "Failed to delete team store" });
    }
  });

  // Refresh team store line items from order
  app.post('/api/team-stores/:id/refresh-line-items', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const teamStoreId = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      // Only admin and ops users can refresh line items
      if (!['admin', 'ops'].includes(user.role)) {
        return res.status(403).json({ message: "Only admin and ops users can refresh line items" });
      }
      
      // Get the team store
      const teamStore = await storage.getTeamStore(teamStoreId, user);
      if (!teamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }
      
      if (!teamStore.orderId) {
        return res.status(400).json({ message: "No order associated with this team store" });
      }
      
      // Get current order line items with details
      const orderLineItemsWithDetails = await db
        .select({
          order_line_items: orderLineItems,
          product_variants: productVariants,
          products: products,
        })
        .from(orderLineItems)
        .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
        .leftJoin(products, eq(productVariants.productId, products.id))
        .where(eq(orderLineItems.orderId, teamStore.orderId));
      
      // Get existing team store line items
      const existingLineItems = await db
        .select()
        .from(teamStoreLineItems)
        .where(eq(teamStoreLineItems.teamStoreId, teamStoreId));
      
      const existingLineItemMap = new Map(
        existingLineItems.map(item => [item.lineItemId, item])
      );
      
      let updatedCount = 0;
      let createdCount = 0;
      
      // Update or create line items
      for (const row of orderLineItemsWithDetails) {
        const existing = existingLineItemMap.get(row.order_line_items.id);
        
        const updatedData = {
          productName: row.order_line_items.itemName || row.products?.name || 'Unknown Product',
          variantCode: row.product_variants?.variantCode || null,
          variantColor: row.product_variants?.color || null,
          imageUrl: row.order_line_items.imageUrl || row.product_variants?.imageUrl || null,
          yxs: row.order_line_items.yxs || 0,
          ys: row.order_line_items.ys || 0,
          ym: row.order_line_items.ym || 0,
          yl: row.order_line_items.yl || 0,
          xs: row.order_line_items.xs || 0,
          s: row.order_line_items.s || 0,
          m: row.order_line_items.m || 0,
          l: row.order_line_items.l || 0,
          xl: row.order_line_items.xl || 0,
          xxl: row.order_line_items.xxl || 0,
          xxxl: row.order_line_items.xxxl || 0,
        };
        
        if (existing) {
          // Update existing line item with new data from order
          await db
            .update(teamStoreLineItems)
            .set(updatedData)
            .where(eq(teamStoreLineItems.id, existing.id));
          updatedCount++;
        } else {
          // Create new line item for newly added order items
          await db.insert(teamStoreLineItems).values({
            teamStoreId: teamStoreId,
            lineItemId: row.order_line_items.id,
            ...updatedData,
          });
          createdCount++;
        }
      }
      
      // Log activity
      await storage.logActivity(
        user.id,
        'team_store',
        teamStoreId,
        'refreshed_line_items',
        null,
        { updatedCount, createdCount }
      );
      
      res.json({ 
        message: "Line items refreshed successfully",
        updatedCount,
        createdCount
      });
    } catch (error) {
      console.error("Error refreshing team store line items:", error);
      res.status(500).json({ message: "Failed to refresh line items" });
    }
  });

  // Get team store line items
  app.get('/api/team-stores/:id/line-items', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const teamStoreId = parseInt(req.params.id);
      if (isNaN(teamStoreId)) {
        return res.status(400).json({ message: "Invalid team store ID" });
      }

      const lineItems = await db
        .select()
        .from(teamStoreLineItems)
        .where(eq(teamStoreLineItems.teamStoreId, teamStoreId));

      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching team store line items:", error);
      res.status(500).json({ message: "Failed to fetch team store line items" });
    }
  });
}
