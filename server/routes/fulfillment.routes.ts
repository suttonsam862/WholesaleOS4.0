/**
 * Fulfillment / 3PL Routes
 *
 * Routes for managing fulfillment centers, inbound/outbound shipments,
 * QC inspections, and inventory.
 */

import type { Express, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { loadUserData, requirePermission } from '../permissions';
import { db } from '../db';
import {
  fulfillmentCenters,
  inboundShipments,
  inboundShipmentItems,
  qcInspections,
  qcInspectionItems,
  inventory,
  inventoryTransactions,
  outboundShipments,
  outboundShipmentItems,
  manufacturerJobs,
  manufacturers,
  orders,
  productVariants,
  products,
  orderLineItems,
} from '../../shared/schema';
import { eq, and, desc, inArray, sql, isNull, asc, gte, lte } from 'drizzle-orm';

// Helper to generate codes
function generateCode(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

export function registerFulfillmentRoutes(app: Express) {
  // ==================== FULFILLMENT CENTERS ====================

  /**
   * List all fulfillment centers
   * GET /api/admin/fulfillment-centers
   */
  app.get(
    '/api/admin/fulfillment-centers',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const centers = await db
          .select()
          .from(fulfillmentCenters)
          .orderBy(fulfillmentCenters.name);

        // Get inventory counts for each center
        const centersWithStats = await Promise.all(
          centers.map(async (center) => {
            const inventoryStats = await db
              .select({
                totalItems: sql<number>`COALESCE(SUM(${inventory.quantityOnHand}), 0)`,
                totalVariants: sql<number>`COUNT(DISTINCT ${inventory.variantId})`,
              })
              .from(inventory)
              .where(eq(inventory.fulfillmentCenterId, center.id));

            const pendingInbound = await db
              .select({ count: sql<number>`COUNT(*)` })
              .from(inboundShipments)
              .where(
                and(
                  eq(inboundShipments.fulfillmentCenterId, center.id),
                  inArray(inboundShipments.status, ['expected', 'in_transit'])
                )
              );

            return {
              ...center,
              totalItems: inventoryStats[0]?.totalItems || 0,
              totalVariants: inventoryStats[0]?.totalVariants || 0,
              pendingInboundCount: pendingInbound[0]?.count || 0,
            };
          })
        );

        res.json(centersWithStats);
      } catch (error) {
        console.error('Error fetching fulfillment centers:', error);
        res.status(500).json({ message: 'Failed to fetch fulfillment centers' });
      }
    }
  );

  /**
   * Get a single fulfillment center
   * GET /api/admin/fulfillment-centers/:id
   */
  app.get(
    '/api/admin/fulfillment-centers/:id',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const [center] = await db
          .select()
          .from(fulfillmentCenters)
          .where(eq(fulfillmentCenters.id, id))
          .limit(1);

        if (!center) {
          return res.status(404).json({ message: 'Fulfillment center not found' });
        }

        // Get inventory summary
        const inventorySummary = await db
          .select({
            variantId: inventory.variantId,
            quantityOnHand: inventory.quantityOnHand,
            quantityReserved: inventory.quantityReserved,
            quantityAvailable: inventory.quantityAvailable,
          })
          .from(inventory)
          .where(eq(inventory.fulfillmentCenterId, id))
          .limit(10);

        // Get recent inbound shipments
        const recentInbound = await db
          .select()
          .from(inboundShipments)
          .where(eq(inboundShipments.fulfillmentCenterId, id))
          .orderBy(desc(inboundShipments.createdAt))
          .limit(5);

        // Get recent outbound shipments
        const recentOutbound = await db
          .select()
          .from(outboundShipments)
          .where(eq(outboundShipments.fulfillmentCenterId, id))
          .orderBy(desc(outboundShipments.createdAt))
          .limit(5);

        res.json({
          ...center,
          inventorySummary,
          recentInbound,
          recentOutbound,
        });
      } catch (error) {
        console.error('Error fetching fulfillment center:', error);
        res.status(500).json({ message: 'Failed to fetch fulfillment center' });
      }
    }
  );

  /**
   * Create a fulfillment center
   * POST /api/admin/fulfillment-centers
   */
  app.post(
    '/api/admin/fulfillment-centers',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { code, name, address, city, state, zipCode, country, phone, email, capabilities, isDefault } = req.body;

        if (!code || !name || !address || !city || !state || !zipCode) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        // If setting as default, unset other defaults first
        if (isDefault) {
          await db
            .update(fulfillmentCenters)
            .set({ isDefault: false })
            .where(eq(fulfillmentCenters.isDefault, true));
        }

        const [created] = await db
          .insert(fulfillmentCenters)
          .values({
            code: code.toUpperCase(),
            name,
            address,
            city,
            state,
            zipCode,
            country: country || 'US',
            phone,
            email,
            capabilities,
            isDefault: isDefault || false,
          })
          .returning();

        res.status(201).json(created);
      } catch (error) {
        console.error('Error creating fulfillment center:', error);
        res.status(500).json({ message: 'Failed to create fulfillment center' });
      }
    }
  );

  /**
   * Update a fulfillment center
   * PUT /api/admin/fulfillment-centers/:id
   */
  app.put(
    '/api/admin/fulfillment-centers/:id',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;

        // If setting as default, unset other defaults first
        if (updates.isDefault) {
          await db
            .update(fulfillmentCenters)
            .set({ isDefault: false })
            .where(
              and(
                eq(fulfillmentCenters.isDefault, true),
                sql`${fulfillmentCenters.id} != ${id}`
              )
            );
        }

        const [updated] = await db
          .update(fulfillmentCenters)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(fulfillmentCenters.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: 'Fulfillment center not found' });
        }

        res.json(updated);
      } catch (error) {
        console.error('Error updating fulfillment center:', error);
        res.status(500).json({ message: 'Failed to update fulfillment center' });
      }
    }
  );

  // ==================== INBOUND SHIPMENTS ====================

  /**
   * List inbound shipments
   * GET /api/admin/inbound-shipments
   */
  app.get(
    '/api/admin/inbound-shipments',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { status, fulfillmentCenterId, limit = '50', offset = '0' } = req.query;

        let query = db
          .select({
            shipment: inboundShipments,
            fulfillmentCenter: fulfillmentCenters,
            manufacturer: manufacturers,
          })
          .from(inboundShipments)
          .innerJoin(fulfillmentCenters, eq(inboundShipments.fulfillmentCenterId, fulfillmentCenters.id))
          .leftJoin(manufacturers, eq(inboundShipments.manufacturerId, manufacturers.id))
          .orderBy(desc(inboundShipments.createdAt))
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));

        const shipments = await query;

        res.json(
          shipments.map(({ shipment, fulfillmentCenter, manufacturer }) => ({
            ...shipment,
            fulfillmentCenterName: fulfillmentCenter.name,
            fulfillmentCenterCode: fulfillmentCenter.code,
            manufacturerName: manufacturer?.name,
          }))
        );
      } catch (error) {
        console.error('Error fetching inbound shipments:', error);
        res.status(500).json({ message: 'Failed to fetch inbound shipments' });
      }
    }
  );

  /**
   * Create inbound shipment
   * POST /api/admin/inbound-shipments
   */
  app.post(
    '/api/admin/inbound-shipments',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const {
          fulfillmentCenterId,
          manufacturerId,
          manufacturerJobId,
          trackingNumber,
          carrier,
          expectedArrivalDate,
          items,
        } = req.body;

        if (!fulfillmentCenterId) {
          return res.status(400).json({ message: 'Fulfillment center is required' });
        }

        const shipmentCode = generateCode('IB');

        const [shipment] = await db
          .insert(inboundShipments)
          .values({
            shipmentCode,
            fulfillmentCenterId,
            manufacturerId,
            manufacturerJobId,
            trackingNumber,
            carrier,
            expectedArrivalDate,
            status: 'expected',
          })
          .returning();

        // Add items if provided
        if (items && items.length > 0) {
          await db.insert(inboundShipmentItems).values(
            items.map((item: any) => ({
              inboundShipmentId: shipment.id,
              orderLineItemId: item.orderLineItemId,
              variantId: item.variantId,
              expectedQuantity: item.expectedQuantity,
            }))
          );
        }

        res.status(201).json(shipment);
      } catch (error) {
        console.error('Error creating inbound shipment:', error);
        res.status(500).json({ message: 'Failed to create inbound shipment' });
      }
    }
  );

  /**
   * Update inbound shipment status
   * PUT /api/admin/inbound-shipments/:id/status
   */
  app.put(
    '/api/admin/inbound-shipments/:id/status',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { status, receivedBy } = req.body;
        const userData = (req as any).userData;

        const updates: any = { status, updatedAt: new Date() };

        if (status === 'arrived') {
          updates.actualArrivalDate = new Date().toISOString().split('T')[0];
          updates.receivedBy = receivedBy || userData?.id;
        }

        const [updated] = await db
          .update(inboundShipments)
          .set(updates)
          .where(eq(inboundShipments.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: 'Inbound shipment not found' });
        }

        res.json(updated);
      } catch (error) {
        console.error('Error updating inbound shipment status:', error);
        res.status(500).json({ message: 'Failed to update status' });
      }
    }
  );

  // ==================== QC INSPECTIONS ====================

  /**
   * Create QC inspection for an inbound shipment
   * POST /api/admin/qc-inspections
   */
  app.post(
    '/api/admin/qc-inspections',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { inboundShipmentId } = req.body;
        const userData = (req as any).userData;

        if (!inboundShipmentId) {
          return res.status(400).json({ message: 'Inbound shipment ID is required' });
        }

        const inspectionCode = generateCode('QC');

        const [inspection] = await db
          .insert(qcInspections)
          .values({
            inspectionCode,
            inboundShipmentId,
            inspectorId: userData?.id,
            status: 'in_progress',
            startedAt: new Date(),
          })
          .returning();

        // Update inbound shipment status
        await db
          .update(inboundShipments)
          .set({ status: 'inspecting', updatedAt: new Date() })
          .where(eq(inboundShipments.id, inboundShipmentId));

        // Create inspection items from inbound shipment items
        const shipmentItems = await db
          .select()
          .from(inboundShipmentItems)
          .where(eq(inboundShipmentItems.inboundShipmentId, inboundShipmentId));

        if (shipmentItems.length > 0) {
          await db.insert(qcInspectionItems).values(
            shipmentItems.map((item) => ({
              qcInspectionId: inspection.id,
              inboundShipmentItemId: item.id,
              result: 'pass' as const,
              quantityPassed: item.expectedQuantity,
              quantityFailed: 0,
            }))
          );
        }

        res.status(201).json(inspection);
      } catch (error) {
        console.error('Error creating QC inspection:', error);
        res.status(500).json({ message: 'Failed to create QC inspection' });
      }
    }
  );

  /**
   * Get QC inspection details
   * GET /api/admin/qc-inspections/:id
   */
  app.get(
    '/api/admin/qc-inspections/:id',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const [inspection] = await db
          .select()
          .from(qcInspections)
          .where(eq(qcInspections.id, id))
          .limit(1);

        if (!inspection) {
          return res.status(404).json({ message: 'Inspection not found' });
        }

        const items = await db
          .select({
            item: qcInspectionItems,
            shipmentItem: inboundShipmentItems,
            variant: productVariants,
            product: products,
          })
          .from(qcInspectionItems)
          .innerJoin(inboundShipmentItems, eq(qcInspectionItems.inboundShipmentItemId, inboundShipmentItems.id))
          .leftJoin(productVariants, eq(inboundShipmentItems.variantId, productVariants.id))
          .leftJoin(products, eq(productVariants.productId, products.id))
          .where(eq(qcInspectionItems.qcInspectionId, id));

        res.json({
          ...inspection,
          items: items.map(({ item, shipmentItem, variant, product }) => ({
            ...item,
            expectedQuantity: shipmentItem.expectedQuantity,
            receivedQuantity: shipmentItem.receivedQuantity,
            variantCode: variant?.variantCode,
            productName: product?.name,
          })),
        });
      } catch (error) {
        console.error('Error fetching QC inspection:', error);
        res.status(500).json({ message: 'Failed to fetch QC inspection' });
      }
    }
  );

  /**
   * Update QC inspection item result
   * PUT /api/admin/qc-inspections/:id/items/:itemId
   */
  app.put(
    '/api/admin/qc-inspections/:id/items/:itemId',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const itemId = parseInt(req.params.itemId);
        const { result, quantityPassed, quantityFailed, notes, photoUrls } = req.body;

        const [updated] = await db
          .update(qcInspectionItems)
          .set({
            result,
            quantityPassed,
            quantityFailed,
            notes,
            photoUrls,
          })
          .where(eq(qcInspectionItems.id, itemId))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: 'Inspection item not found' });
        }

        res.json(updated);
      } catch (error) {
        console.error('Error updating QC inspection item:', error);
        res.status(500).json({ message: 'Failed to update inspection item' });
      }
    }
  );

  /**
   * Complete QC inspection
   * POST /api/admin/qc-inspections/:id/complete
   */
  app.post(
    '/api/admin/qc-inspections/:id/complete',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { overallResult, notes } = req.body;

        // Get inspection
        const [inspection] = await db
          .select()
          .from(qcInspections)
          .where(eq(qcInspections.id, id))
          .limit(1);

        if (!inspection) {
          return res.status(404).json({ message: 'Inspection not found' });
        }

        // Update inspection
        const [updated] = await db
          .update(qcInspections)
          .set({
            status: 'completed',
            overallResult,
            notes,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(qcInspections.id, id))
          .returning();

        // If passed, add to inventory
        if (overallResult === 'pass' || overallResult === 'pass_with_notes') {
          const items = await db
            .select({
              item: qcInspectionItems,
              shipmentItem: inboundShipmentItems,
            })
            .from(qcInspectionItems)
            .innerJoin(inboundShipmentItems, eq(qcInspectionItems.inboundShipmentItemId, inboundShipmentItems.id))
            .where(eq(qcInspectionItems.qcInspectionId, id));

          // Get fulfillment center from inbound shipment
          const [inbound] = await db
            .select({ fulfillmentCenterId: inboundShipments.fulfillmentCenterId })
            .from(inboundShipments)
            .where(eq(inboundShipments.id, inspection.inboundShipmentId))
            .limit(1);

          for (const { item, shipmentItem } of items) {
            if (item.quantityPassed && item.quantityPassed > 0 && shipmentItem.variantId) {
              // Check if inventory record exists
              const [existingInventory] = await db
                .select()
                .from(inventory)
                .where(
                  and(
                    eq(inventory.fulfillmentCenterId, inbound.fulfillmentCenterId),
                    eq(inventory.variantId, shipmentItem.variantId)
                  )
                )
                .limit(1);

              if (existingInventory) {
                // Update existing inventory
                const newQuantity = (existingInventory.quantityOnHand || 0) + item.quantityPassed;
                const newAvailable = (existingInventory.quantityAvailable || 0) + item.quantityPassed;

                await db
                  .update(inventory)
                  .set({
                    quantityOnHand: newQuantity,
                    quantityAvailable: newAvailable,
                    lastReceivedAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(eq(inventory.id, existingInventory.id));

                // Log transaction
                await db.insert(inventoryTransactions).values({
                  inventoryId: existingInventory.id,
                  transactionType: 'stock_in',
                  quantity: item.quantityPassed,
                  previousQuantity: existingInventory.quantityOnHand || 0,
                  newQuantity,
                  referenceType: 'qc_inspection',
                  referenceId: inspection.id,
                  reasonCode: 'qc_pass',
                });
              } else {
                // Create new inventory record
                const [newInventory] = await db
                  .insert(inventory)
                  .values({
                    fulfillmentCenterId: inbound.fulfillmentCenterId,
                    variantId: shipmentItem.variantId,
                    quantityOnHand: item.quantityPassed,
                    quantityReserved: 0,
                    quantityAvailable: item.quantityPassed,
                    lastReceivedAt: new Date(),
                  })
                  .returning();

                // Log transaction
                await db.insert(inventoryTransactions).values({
                  inventoryId: newInventory.id,
                  transactionType: 'stock_in',
                  quantity: item.quantityPassed,
                  previousQuantity: 0,
                  newQuantity: item.quantityPassed,
                  referenceType: 'qc_inspection',
                  referenceId: inspection.id,
                  reasonCode: 'qc_pass',
                });
              }
            }
          }

          // Update inbound shipment status
          await db
            .update(inboundShipments)
            .set({ status: 'stocked', updatedAt: new Date() })
            .where(eq(inboundShipments.id, inspection.inboundShipmentId));
        } else {
          // Failed - mark inbound as issue
          await db
            .update(inboundShipments)
            .set({ status: 'issue', updatedAt: new Date() })
            .where(eq(inboundShipments.id, inspection.inboundShipmentId));
        }

        res.json(updated);
      } catch (error) {
        console.error('Error completing QC inspection:', error);
        res.status(500).json({ message: 'Failed to complete inspection' });
      }
    }
  );

  // ==================== INVENTORY ====================

  /**
   * List inventory
   * GET /api/admin/inventory
   */
  app.get(
    '/api/admin/inventory',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { fulfillmentCenterId, lowStock, limit = '100', offset = '0' } = req.query;

        let baseQuery = db
          .select({
            inv: inventory,
            variant: productVariants,
            product: products,
            fc: fulfillmentCenters,
          })
          .from(inventory)
          .innerJoin(fulfillmentCenters, eq(inventory.fulfillmentCenterId, fulfillmentCenters.id))
          .innerJoin(productVariants, eq(inventory.variantId, productVariants.id))
          .innerJoin(products, eq(productVariants.productId, products.id))
          .orderBy(products.name, productVariants.variantCode)
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));

        const results = await baseQuery;

        res.json(
          results.map(({ inv, variant, product, fc }) => ({
            ...inv,
            variantCode: variant.variantCode,
            productName: product.name,
            fulfillmentCenterName: fc.name,
            fulfillmentCenterCode: fc.code,
          }))
        );
      } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Failed to fetch inventory' });
      }
    }
  );

  /**
   * Adjust inventory
   * POST /api/admin/inventory/:id/adjust
   */
  app.post(
    '/api/admin/inventory/:id/adjust',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { adjustment, reasonCode, notes } = req.body;
        const userData = (req as any).userData;

        if (!adjustment || !reasonCode) {
          return res.status(400).json({ message: 'Adjustment and reason code are required' });
        }

        const [current] = await db
          .select()
          .from(inventory)
          .where(eq(inventory.id, id))
          .limit(1);

        if (!current) {
          return res.status(404).json({ message: 'Inventory record not found' });
        }

        const previousQuantity = current.quantityOnHand || 0;
        const newQuantity = previousQuantity + parseInt(adjustment);
        const previousAvailable = current.quantityAvailable || 0;
        const newAvailable = previousAvailable + parseInt(adjustment);

        if (newQuantity < 0 || newAvailable < 0) {
          return res.status(400).json({ message: 'Adjustment would result in negative inventory' });
        }

        // Update inventory
        const [updated] = await db
          .update(inventory)
          .set({
            quantityOnHand: newQuantity,
            quantityAvailable: newAvailable,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, id))
          .returning();

        // Log transaction
        await db.insert(inventoryTransactions).values({
          inventoryId: id,
          transactionType: 'adjustment',
          quantity: parseInt(adjustment),
          previousQuantity,
          newQuantity,
          reasonCode,
          notes,
          performedBy: userData?.id,
        });

        res.json(updated);
      } catch (error) {
        console.error('Error adjusting inventory:', error);
        res.status(500).json({ message: 'Failed to adjust inventory' });
      }
    }
  );

  // ==================== OUTBOUND SHIPMENTS ====================

  /**
   * List outbound shipments
   * GET /api/admin/outbound-shipments
   */
  app.get(
    '/api/admin/outbound-shipments',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { status, limit = '50', offset = '0' } = req.query;

        const shipments = await db
          .select({
            shipment: outboundShipments,
            fc: fulfillmentCenters,
            order: orders,
          })
          .from(outboundShipments)
          .innerJoin(fulfillmentCenters, eq(outboundShipments.fulfillmentCenterId, fulfillmentCenters.id))
          .leftJoin(orders, eq(outboundShipments.orderId, orders.id))
          .orderBy(desc(outboundShipments.createdAt))
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));

        res.json(
          shipments.map(({ shipment, fc, order }) => ({
            ...shipment,
            fulfillmentCenterName: fc.name,
            orderCode: order?.orderCode,
            orderName: order?.orderName,
          }))
        );
      } catch (error) {
        console.error('Error fetching outbound shipments:', error);
        res.status(500).json({ message: 'Failed to fetch outbound shipments' });
      }
    }
  );

  /**
   * Create outbound shipment
   * POST /api/admin/outbound-shipments
   */
  app.post(
    '/api/admin/outbound-shipments',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { fulfillmentCenterId, orderId, shippingAddress, items } = req.body;

        if (!fulfillmentCenterId || !shippingAddress) {
          return res.status(400).json({ message: 'Fulfillment center and shipping address are required' });
        }

        const shipmentCode = generateCode('OB');

        const [shipment] = await db
          .insert(outboundShipments)
          .values({
            shipmentCode,
            fulfillmentCenterId,
            orderId,
            shippingAddress,
            status: 'pending',
          })
          .returning();

        // Add items and reserve inventory
        if (items && items.length > 0) {
          for (const item of items) {
            await db.insert(outboundShipmentItems).values({
              outboundShipmentId: shipment.id,
              inventoryId: item.inventoryId,
              orderLineItemId: item.orderLineItemId,
              variantId: item.variantId,
              quantity: item.quantity,
            });

            // Reserve inventory if inventoryId provided
            if (item.inventoryId) {
              const [inv] = await db
                .select()
                .from(inventory)
                .where(eq(inventory.id, item.inventoryId))
                .limit(1);

              if (inv) {
                await db
                  .update(inventory)
                  .set({
                    quantityReserved: (inv.quantityReserved || 0) + item.quantity,
                    quantityAvailable: (inv.quantityAvailable || 0) - item.quantity,
                    updatedAt: new Date(),
                  })
                  .where(eq(inventory.id, item.inventoryId));

                await db.insert(inventoryTransactions).values({
                  inventoryId: item.inventoryId,
                  transactionType: 'reserve',
                  quantity: -item.quantity,
                  previousQuantity: inv.quantityAvailable || 0,
                  newQuantity: (inv.quantityAvailable || 0) - item.quantity,
                  referenceType: 'outbound_shipment',
                  referenceId: shipment.id,
                  reasonCode: 'customer_order',
                });
              }
            }
          }
        }

        res.status(201).json(shipment);
      } catch (error) {
        console.error('Error creating outbound shipment:', error);
        res.status(500).json({ message: 'Failed to create outbound shipment' });
      }
    }
  );

  /**
   * Update outbound shipment status
   * PUT /api/admin/outbound-shipments/:id/status
   */
  app.put(
    '/api/admin/outbound-shipments/:id/status',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { status, trackingNumber, carrier } = req.body;
        const userData = (req as any).userData;

        const updates: any = { status, updatedAt: new Date() };

        if (trackingNumber) updates.trackingNumber = trackingNumber;
        if (carrier) updates.carrier = carrier;

        if (status === 'shipped') {
          updates.shippedDate = new Date().toISOString().split('T')[0];

          // Deduct inventory (convert reserved to shipped)
          const shipmentItems = await db
            .select()
            .from(outboundShipmentItems)
            .where(eq(outboundShipmentItems.outboundShipmentId, id));

          for (const item of shipmentItems) {
            if (item.inventoryId) {
              const [inv] = await db
                .select()
                .from(inventory)
                .where(eq(inventory.id, item.inventoryId))
                .limit(1);

              if (inv) {
                await db
                  .update(inventory)
                  .set({
                    quantityOnHand: (inv.quantityOnHand || 0) - item.quantity,
                    quantityReserved: (inv.quantityReserved || 0) - item.quantity,
                    updatedAt: new Date(),
                  })
                  .where(eq(inventory.id, item.inventoryId));

                await db.insert(inventoryTransactions).values({
                  inventoryId: item.inventoryId,
                  transactionType: 'stock_out',
                  quantity: -item.quantity,
                  previousQuantity: inv.quantityOnHand || 0,
                  newQuantity: (inv.quantityOnHand || 0) - item.quantity,
                  referenceType: 'outbound_shipment',
                  referenceId: id,
                  reasonCode: 'shipped',
                  performedBy: userData?.id,
                });
              }
            }
          }
        }

        const [updated] = await db
          .update(outboundShipments)
          .set(updates)
          .where(eq(outboundShipments.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ message: 'Outbound shipment not found' });
        }

        res.json(updated);
      } catch (error) {
        console.error('Error updating outbound shipment status:', error);
        res.status(500).json({ message: 'Failed to update status' });
      }
    }
  );

  // ==================== STATS / DASHBOARD ====================

  /**
   * Get fulfillment dashboard stats
   * GET /api/admin/fulfillment/stats
   */
  app.get(
    '/api/admin/fulfillment/stats',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        // Inbound stats
        const inboundStats = await db
          .select({
            status: inboundShipments.status,
            count: sql<number>`COUNT(*)`,
          })
          .from(inboundShipments)
          .groupBy(inboundShipments.status);

        // Outbound stats
        const outboundStats = await db
          .select({
            status: outboundShipments.status,
            count: sql<number>`COUNT(*)`,
          })
          .from(outboundShipments)
          .groupBy(outboundShipments.status);

        // Total inventory
        const inventoryTotals = await db
          .select({
            totalOnHand: sql<number>`COALESCE(SUM(${inventory.quantityOnHand}), 0)`,
            totalReserved: sql<number>`COALESCE(SUM(${inventory.quantityReserved}), 0)`,
            totalAvailable: sql<number>`COALESCE(SUM(${inventory.quantityAvailable}), 0)`,
            uniqueVariants: sql<number>`COUNT(DISTINCT ${inventory.variantId})`,
          })
          .from(inventory);

        // Pending QC inspections
        const pendingQcCount = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(qcInspections)
          .where(inArray(qcInspections.status, ['pending', 'in_progress']));

        res.json({
          inboundByStatus: Object.fromEntries(
            inboundStats.map((s) => [s.status, s.count])
          ),
          outboundByStatus: Object.fromEntries(
            outboundStats.map((s) => [s.status, s.count])
          ),
          inventory: {
            totalOnHand: inventoryTotals[0]?.totalOnHand || 0,
            totalReserved: inventoryTotals[0]?.totalReserved || 0,
            totalAvailable: inventoryTotals[0]?.totalAvailable || 0,
            uniqueVariants: inventoryTotals[0]?.uniqueVariants || 0,
          },
          pendingQcInspections: pendingQcCount[0]?.count || 0,
        });
      } catch (error) {
        console.error('Error fetching fulfillment stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
      }
    }
  );
}
