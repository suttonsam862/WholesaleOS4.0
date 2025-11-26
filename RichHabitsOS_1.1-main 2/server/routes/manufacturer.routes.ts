import type { Express, Response } from 'express';
import { isAuthenticated, loadUserData, type AuthenticatedRequest } from './shared/middleware';
import { db } from '../db';
import { 
  orderLineItems, 
  orderLineItemManufacturers, 
  manufacturingUpdateLineItems,
  manufacturingUpdates,
  manufacturing,
  orders,
  organizations,
  userManufacturerAssociations,
  productVariants,
  manufacturers
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import z from 'zod';

export function registerManufacturerRoutes(app: Express): void {
  // Get line items assigned to the current manufacturer user
  app.get('/api/manufacturer/line-items', 
    isAuthenticated, 
    loadUserData, 
    async (req: any, res: Response) => {
      try {
        const userId = req.user?.userData?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check if user is a manufacturer
        if (req.user?.userData?.role !== 'manufacturer') {
          return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
        }

        // Get manufacturer ID associated with this user
        const [userManufacturer] = await db
          .select()
          .from(userManufacturerAssociations)
          .where(eq(userManufacturerAssociations.userId, userId));

        if (!userManufacturer) {
          return res.status(404).json({ error: 'No manufacturer association found for this user' });
        }

        // Get manufacturer info
        const [manufacturerInfo] = await db
          .select()
          .from(manufacturers)
          .where(eq(manufacturers.id, userManufacturer.manufacturerId));

        // Get all line items assigned to this manufacturer with related data
        const lineItems = await db
          .select({
            id: manufacturingUpdateLineItems.id,
            lineItemId: manufacturingUpdateLineItems.lineItemId,
            manufacturingUpdateId: manufacturingUpdateLineItems.manufacturingUpdateId,
            mockupImageUrl: manufacturingUpdateLineItems.mockupImageUrl,
            actualCost: manufacturingUpdateLineItems.actualCost,
            sizesConfirmed: manufacturingUpdateLineItems.sizesConfirmed,
            manufacturerCompleted: manufacturingUpdateLineItems.manufacturerCompleted,
            notes: manufacturingUpdateLineItems.notes,
            lineItem: {
              id: orderLineItems.id,
              styleName: orderLineItems.itemName,
              color: orderLineItems.colorNotes,
              sizeBreakdown: sql<Record<string, number>>`json_build_object(
                'YXS', ${orderLineItems.yxs},
                'YS', ${orderLineItems.ys},
                'YM', ${orderLineItems.ym},
                'YL', ${orderLineItems.yl},
                'XS', ${orderLineItems.xs},
                'S', ${orderLineItems.s},
                'M', ${orderLineItems.m},
                'L', ${orderLineItems.l},
                'XL', ${orderLineItems.xl},
                '2XL', ${orderLineItems.xxl},
                '3XL', ${orderLineItems.xxxl}
              )`,
              unitPrice: orderLineItems.unitPrice,
              quantity: orderLineItems.qtyTotal,
            },
            order: {
              id: orders.id,
              orderNumber: orders.orderCode,
              customerName: orders.orderName,
              organizationName: organizations.name,
              dueDate: orders.estDelivery,
            },
            manufacturing: {
              id: manufacturing.id,
              status: manufacturing.status,
              priority: manufacturing.priority,
            },
          })
          .from(manufacturingUpdateLineItems)
          .innerJoin(orderLineItems, eq(manufacturingUpdateLineItems.lineItemId, orderLineItems.id))
          .innerJoin(orders, eq(orderLineItems.orderId, orders.id))
          .leftJoin(organizations, eq(orders.orgId, organizations.id))
          .innerJoin(manufacturingUpdates, eq(manufacturingUpdateLineItems.manufacturingUpdateId, manufacturingUpdates.id))
          .innerJoin(manufacturing, eq(manufacturingUpdates.manufacturingId, manufacturing.id))
          .innerJoin(orderLineItemManufacturers, and(
            eq(orderLineItemManufacturers.lineItemId, orderLineItems.id),
            eq(orderLineItemManufacturers.manufacturerId, userManufacturer.manufacturerId)
          ))
          .where(eq(orderLineItemManufacturers.manufacturerId, userManufacturer.manufacturerId));

        res.json({ 
          manufacturer: manufacturerInfo || null,
          lineItems 
        });
      } catch (error) {
        console.error('Error fetching manufacturer line items:', error);
        res.status(500).json({ error: 'Failed to fetch line items' });
      }
    }
  );

  // Update a line item assigned to the manufacturer
  const updateLineItemSchema = z.object({
    actualCost: z.string().optional(),
    manufacturerCompleted: z.boolean().optional(),
    manufacturerCompletedBy: z.string().optional(),
    manufacturerCompletedAt: z.string().datetime().optional(),
    notes: z.string().optional(),
  });

  app.put('/api/manufacturer/line-items/:id', 
    isAuthenticated, 
    loadUserData, 
    async (req: any, res: Response) => {
      try {
        const userId = req.user?.userData?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check if user is a manufacturer
        if (req.user?.userData?.role !== 'manufacturer') {
          return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
        }

        const lineItemId = parseInt(req.params.id);
        if (isNaN(lineItemId)) {
          return res.status(400).json({ error: 'Invalid line item ID' });
        }

        // Validate request body
        const validationResult = updateLineItemSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid data', details: validationResult.error.issues });
        }

        const updateData = validationResult.data;

        // Get manufacturer ID associated with this user
        const [userManufacturer] = await db
          .select()
          .from(userManufacturerAssociations)
          .where(eq(userManufacturerAssociations.userId, userId));

        if (!userManufacturer) {
          return res.status(404).json({ error: 'No manufacturer association found for this user' });
        }

        // Verify this line item is assigned to this manufacturer
        const [lineItem] = await db
          .select()
          .from(manufacturingUpdateLineItems)
          .innerJoin(orderLineItems, eq(manufacturingUpdateLineItems.lineItemId, orderLineItems.id))
          .innerJoin(orderLineItemManufacturers, eq(orderLineItemManufacturers.lineItemId, orderLineItems.id))
          .where(and(
            eq(manufacturingUpdateLineItems.id, lineItemId),
            eq(orderLineItemManufacturers.manufacturerId, userManufacturer.manufacturerId)
          ));

        if (!lineItem) {
          return res.status(404).json({ error: 'Line item not found or not assigned to you' });
        }

        // Prepare update object with proper type conversion
        const updateObject: any = {
          updatedAt: new Date(),
        };

        if (updateData.actualCost !== undefined) {
          updateObject.actualCost = updateData.actualCost;
        }
        if (updateData.manufacturerCompleted !== undefined) {
          updateObject.manufacturerCompleted = updateData.manufacturerCompleted;
        }
        if (updateData.manufacturerCompletedBy !== undefined) {
          updateObject.manufacturerCompletedBy = updateData.manufacturerCompletedBy;
        }
        if (updateData.manufacturerCompletedAt !== undefined) {
          updateObject.manufacturerCompletedAt = new Date(updateData.manufacturerCompletedAt);
        }
        if (updateData.notes !== undefined) {
          updateObject.notes = updateData.notes;
        }

        // Update the line item
        const [updated] = await db
          .update(manufacturingUpdateLineItems)
          .set(updateObject)
          .where(eq(manufacturingUpdateLineItems.id, lineItemId))
          .returning();

        res.json(updated);
      } catch (error) {
        console.error('Error updating line item:', error);
        res.status(500).json({ error: 'Failed to update line item' });
      }
    }
  );

  // Get summary statistics for the manufacturer
  app.get('/api/manufacturer/stats', 
    isAuthenticated, 
    loadUserData, 
    async (req: any, res: Response) => {
      try {
        const userId = req.user?.userData?.id;
        if (!userId) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        // Check if user is a manufacturer
        if (req.user?.userData?.role !== 'manufacturer') {
          return res.status(403).json({ error: 'Access denied. Manufacturer role required.' });
        }

        // Get manufacturer ID associated with this user
        const [userManufacturer] = await db
          .select()
          .from(userManufacturerAssociations)
          .where(eq(userManufacturerAssociations.userId, userId));

        if (!userManufacturer) {
          return res.status(404).json({ error: 'No manufacturer association found for this user' });
        }

        // Get statistics
        const stats = await db
          .select({
            totalItems: sql<number>`count(*)`,
            completedItems: sql<number>`count(case when ${manufacturingUpdateLineItems.manufacturerCompleted} = true then 1 end)`,
            pendingItems: sql<number>`count(case when ${manufacturingUpdateLineItems.manufacturerCompleted} = false then 1 end)`,
          })
          .from(manufacturingUpdateLineItems)
          .innerJoin(orderLineItems, eq(manufacturingUpdateLineItems.lineItemId, orderLineItems.id))
          .innerJoin(orderLineItemManufacturers, eq(orderLineItemManufacturers.lineItemId, orderLineItems.id))
          .where(eq(orderLineItemManufacturers.manufacturerId, userManufacturer.manufacturerId));

        res.json(stats[0] || { totalItems: 0, completedItems: 0, pendingItems: 0 });
      } catch (error) {
        console.error('Error fetching manufacturer stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
      }
    }
  );
}