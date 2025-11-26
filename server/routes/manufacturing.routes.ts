import { Express } from 'express';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import {
  manufacturing,
  manufacturingUpdates,
  orderLineItemManufacturers,
  insertManufacturingSchema,
  insertManufacturingUpdateSchema,
  insertOrderLineItemManufacturerSchema,
  InsertManufacturing,
  InsertManufacturingUpdate,
  manufacturingAttachments,
  insertManufacturingAttachmentSchema,
  ManufacturingAttachment,
  users,
  orders,
  manufacturers,
  manufacturingUpdateLineItems,
  insertManufacturingUpdateLineItemSchema,
  orderLineItems,
  products,
  productVariants,
  designJobs,
  userManufacturerAssociations,
  orderTrackingNumbers,
} from '@shared/schema';
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from './shared/middleware';
import { stripFinancialData } from './shared/utils';
import { storage } from '../storage';
import PDFDocument from 'pdfkit';
import { ObjectStorageService } from '../objectStorage';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { isValidManufacturingStatus, getValidManufacturingStatuses } from './config.routes';

export function registerManufacturingRoutes(app: Express): void {
  // Manufacturing Update Line Items API (specific to manufacturing updates)
  app.get('/api/manufacturing-update-line-items', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturingUpdateId = req.query.manufacturingUpdateId ? parseInt(req.query.manufacturingUpdateId as string) : undefined;
      
      if (!manufacturingUpdateId) {
        return res.status(400).json({ message: "manufacturingUpdateId is required" });
      }

      // Fetch manufacturing update line items with snapshotted data
      const lineItems = await db
        .select({
          id: manufacturingUpdateLineItems.id,
          lineItemId: manufacturingUpdateLineItems.lineItemId,
          manufacturingUpdateId: manufacturingUpdateLineItems.manufacturingUpdateId,
          // Snapshot fields
          productName: manufacturingUpdateLineItems.productName,
          variantCode: manufacturingUpdateLineItems.variantCode,
          variantColor: manufacturingUpdateLineItems.variantColor,
          imageUrl: manufacturingUpdateLineItems.imageUrl,
          yxs: manufacturingUpdateLineItems.yxs,
          ys: manufacturingUpdateLineItems.ys,
          ym: manufacturingUpdateLineItems.ym,
          yl: manufacturingUpdateLineItems.yl,
          xs: manufacturingUpdateLineItems.xs,
          s: manufacturingUpdateLineItems.s,
          m: manufacturingUpdateLineItems.m,
          l: manufacturingUpdateLineItems.l,
          xl: manufacturingUpdateLineItems.xl,
          xxl: manufacturingUpdateLineItems.xxl,
          xxxl: manufacturingUpdateLineItems.xxxl,
          // Manufacturing workflow fields
          mockupImageUrl: manufacturingUpdateLineItems.mockupImageUrl,
          actualCost: manufacturingUpdateLineItems.actualCost,
          sizesConfirmed: manufacturingUpdateLineItems.sizesConfirmed,
          sizesConfirmedBy: manufacturingUpdateLineItems.sizesConfirmedBy,
          sizesConfirmedAt: manufacturingUpdateLineItems.sizesConfirmedAt,
          manufacturerCompleted: manufacturingUpdateLineItems.manufacturerCompleted,
          manufacturerCompletedBy: manufacturingUpdateLineItems.manufacturerCompletedBy,
          manufacturerCompletedAt: manufacturingUpdateLineItems.manufacturerCompletedAt,
          notes: manufacturingUpdateLineItems.notes,
          descriptors: manufacturingUpdateLineItems.descriptors,
          createdAt: manufacturingUpdateLineItems.createdAt,
          updatedAt: manufacturingUpdateLineItems.updatedAt
        })
        .from(manufacturingUpdateLineItems)
        .where(eq(manufacturingUpdateLineItems.manufacturingUpdateId, manufacturingUpdateId));

      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredLineItems = stripFinancialData(lineItems, user.role);
      res.json(filteredLineItems);
    } catch (error) {
      console.error("Error fetching manufacturing update line items:", error);
      res.status(500).json({ message: "Failed to fetch line items" });
    }
  });

  app.put('/api/manufacturing-update-line-items/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertManufacturingUpdateLineItemSchema.partial().parse(req.body);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      // Get the line item first to check authorization
      const [lineItem] = await db
        .select()
        .from(manufacturingUpdateLineItems)
        .where(eq(manufacturingUpdateLineItems.id, id))
        .limit(1);
      
      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }
      
      // Authorization check: manufacturer users can only update their own line items
      if (user.role === 'manufacturer') {
        // Get the manufacturer association for this user
        const [userManufacturer] = await db
          .select()
          .from(userManufacturerAssociations)
          .where(eq(userManufacturerAssociations.userId, user.id))
          .limit(1);
        
        if (!userManufacturer) {
          return res.status(403).json({ message: "No manufacturer association found for this user" });
        }
        
        // Check if this line item belongs to this manufacturer
        const [lineItemManufacturer] = await db
          .select()
          .from(orderLineItemManufacturers)
          .where(eq(orderLineItemManufacturers.lineItemId, lineItem.lineItemId))
          .limit(1);
        
        // If there's a manufacturer assignment, verify it matches the user's manufacturer
        // If there's no assignment, allow the update to proceed
        if (lineItemManufacturer && lineItemManufacturer.manufacturerId !== userManufacturer.manufacturerId) {
          return res.status(403).json({ message: "You can only update line items assigned to your manufacturer" });
        }
      }
      
      // If mockupImageUrl is being updated, also set mockupUploadedAt and mockupUploadedBy
      const updateData: any = { ...validatedData };
      if (validatedData.mockupImageUrl) {
        updateData.mockupUploadedAt = new Date();
        updateData.mockupUploadedBy = user.id;
      }
      
      const updated = await storage.updateManufacturingUpdateLineItem(id, updateData);
      
      const filteredUpdate = stripFinancialData(updated, user.role);
      res.json(filteredUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturing update line item:", error);
      res.status(500).json({ message: "Failed to update line item" });
    }
  });
  
  // Manufacturing API
  // Manufacturing records (main CRUD)
  app.get('/api/manufacturing', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const user = (req as AuthenticatedRequest).user.userData;
      const records = await storage.getManufacturing(user);
      
      res.setHeader('X-Total-Count', records.length.toString());
      
      const filteredRecords = stripFinancialData(records, user?.role || 'guest');
      res.json(filteredRecords);
    } catch (error) {
      console.error("Error fetching manufacturing records:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing records" });
    }
  });
  
  app.get('/api/manufacturing/archived', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const user = (req as AuthenticatedRequest).user.userData;
      const records = await storage.getArchivedManufacturing(user);
      
      res.setHeader('X-Total-Count', records.length.toString());
      
      const filteredRecords = stripFinancialData(records, user?.role || 'guest');
      res.json(filteredRecords);
    } catch (error) {
      console.error("Error fetching archived manufacturing records:", error);
      res.status(500).json({ message: "Failed to fetch archived manufacturing records" });
    }
  });

  // Alias endpoint for archived list (frontend compatibility)
  app.get('/api/manufacturing/archived/list', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const user = (req as AuthenticatedRequest).user.userData;
      const records = await storage.getArchivedManufacturing(user);
      
      res.setHeader('X-Total-Count', records.length.toString());
      
      const filteredRecords = stripFinancialData(records, user?.role || 'guest');
      res.json(filteredRecords);
    } catch (error) {
      console.error("Error fetching archived manufacturing records:", error);
      res.status(500).json({ message: "Failed to fetch archived manufacturing records" });
    }
  });

  app.post('/api/manufacturing', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const validatedData = insertManufacturingSchema.parse(req.body);

      // Validate manufacturing status
      if (validatedData.status && !isValidManufacturingStatus(validatedData.status)) {
        return res.status(400).json({ 
          message: `Invalid manufacturing status. Allowed values: ${getValidManufacturingStatuses().join(', ')}` 
        });
      }

      // Check if manufacturing record already exists for this order
      if (validatedData.orderId) {
        const existing = await storage.getManufacturingByOrder(validatedData.orderId);
        if (existing) {
          return res.status(400).json({ message: "Manufacturing record already exists for this order" });
        }
      }

      const record = await storage.createManufacturing(validatedData);

      // After creating the manufacturing record, also create the initial status update
      const update = await storage.createManufacturingUpdate({
        manufacturingId: record.id,
        status: validatedData.status || 'awaiting_admin_confirmation',
        notes: 'Manufacturing record created',
        updatedBy: (req as AuthenticatedRequest).user.userData!.id,
        manufacturerId: record.manufacturerId || undefined,
        orderId: record.orderId,
      });

      // If the orderId exists, fetch the order line items and create manufacturing update line items
      if (record.orderId) {
        const orderLineItemsWithDetails = await db
          .select({
            order_line_items: orderLineItems,
            product_variants: productVariants,
            products: products,
          })
          .from(orderLineItems)
          .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .leftJoin(products, eq(productVariants.productId, products.id))
          .where(eq(orderLineItems.orderId, record.orderId));

        // Create manufacturing update line items with snapshotted data
        if (orderLineItemsWithDetails.length > 0) {
          const lineItemsToInsert = orderLineItemsWithDetails.map(row => ({
            manufacturingUpdateId: update.id,
            lineItemId: row.order_line_items.id,
            // Snapshot fields from order line item and variant
            productName: row.products?.name || 'Unknown Product',
            variantCode: row.product_variants?.variantCode || '',
            variantColor: row.product_variants?.color || '',
            imageUrl: row.order_line_items.imageUrl || row.product_variants?.imageUrl || null,
            // Copy size distribution
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
            // Workflow fields
            sizesConfirmed: false,
            manufacturerCompleted: false,
          }));

          await db.insert(manufacturingUpdateLineItems).values(lineItemsToInsert);
        }
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing',
        record.id,
        'created',
        null,
        record
      );

      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredRecord = stripFinancialData(record, user.role);
      res.status(201).json(filteredRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing record:", error);
      res.status(500).json({ message: "Failed to create manufacturing record" });
    }
  });

  app.put('/api/manufacturing/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertManufacturingSchema.partial().parse(req.body);

      // Validate manufacturing status if provided
      if (validatedData.status && !isValidManufacturingStatus(validatedData.status)) {
        return res.status(400).json({ 
          message: `Invalid manufacturing status. Allowed values: ${getValidManufacturingStatuses().join(', ')}` 
        });
      }

      const existingRecord = await storage.getManufacturingRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const updatedRecord = await storage.updateManufacturing(id, validatedData);

      // Sync tracking number to order tracking table
      const orderId = updatedRecord.orderId;
      
      // Check if a tracking number already exists for this order
      const [existingTracking] = await db
        .select()
        .from(orderTrackingNumbers)
        .where(eq(orderTrackingNumbers.orderId, orderId))
        .limit(1);

      // Handle tracking number changes (including clearing)
      const trackingChanged = 
        ('trackingNumber' in validatedData) && 
        validatedData.trackingNumber !== existingRecord.trackingNumber;
      
      const carrierProvided = req.body.carrierCompany;
      const carrierChanged = carrierProvided && carrierProvided !== existingTracking?.carrierCompany;

      if (trackingChanged || carrierChanged) {
        if (existingTracking) {
          // If tracking number is cleared (empty or null), delete the record
          if (trackingChanged && !validatedData.trackingNumber) {
            await db
              .delete(orderTrackingNumbers)
              .where(eq(orderTrackingNumbers.id, existingTracking.id));
          } else {
            // Update existing tracking number and/or carrier
            // Use new values if provided, otherwise keep existing
            const updateData: any = {};
            if (trackingChanged) {
              updateData.trackingNumber = validatedData.trackingNumber;
            }
            if (carrierChanged) {
              updateData.carrierCompany = carrierProvided;
            }
            
            if (Object.keys(updateData).length > 0) {
              await db
                .update(orderTrackingNumbers)
                .set(updateData)
                .where(eq(orderTrackingNumbers.id, existingTracking.id));
            }
          }
        } else if (validatedData.trackingNumber) {
          // Create new tracking number if one is provided
          await db.insert(orderTrackingNumbers).values({
            orderId,
            trackingNumber: validatedData.trackingNumber,
            carrierCompany: carrierProvided || "Manufacturing Team",
          });
        }
      }

      // If status changed, create a status update entry
      if (validatedData.status && validatedData.status !== existingRecord.status) {
        await storage.createManufacturingUpdate({
          manufacturingId: id,
          status: validatedData.status,
          notes: req.body.statusNotes || `Status changed from ${existingRecord.status} to ${validatedData.status}`,
          updatedBy: (req as AuthenticatedRequest).user.userData!.id,
          manufacturerId: updatedRecord.manufacturerId || undefined,
        });
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing',
        id,
        'updated',
        existingRecord,
        updatedRecord
      );

      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredRecord = stripFinancialData(updatedRecord, user.role);
      res.json(filteredRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturing record:", error);
      res.status(500).json({ message: "Failed to update manufacturing record" });
    }
  });

  app.delete('/api/manufacturing/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingRecord = await storage.getManufacturingRecord(id);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      await storage.deleteManufacturing(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing',
        id,
        'deleted',
        existingRecord,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting manufacturing record:", error);
      res.status(500).json({ message: "Failed to delete manufacturing record" });
    }
  });
  
  // Duplicate manufacturing structure endpoint (copies everything except quantities)
  app.post('/api/manufacturing/:id/duplicate-structure', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const manufacturingId = parseInt(req.params.id);
      const originalManufacturing = await storage.getManufacturingRecord(manufacturingId);
      
      if (!originalManufacturing) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      // Create a new manufacturing record with reset values
      const newManufacturing = await storage.createManufacturing({
        orderId: originalManufacturing.orderId,
        manufacturerId: originalManufacturing.manufacturerId,
        status: 'awaiting_admin_confirmation' as const,
        assignedTo: originalManufacturing.assignedTo,
        estCompletion: (originalManufacturing as any).estCompletion,
        priority: originalManufacturing.priority,
        qcNotes: `Structure duplicated from manufacturing record #${originalManufacturing.id}`,
      });

      // Create initial status update
      const initialUpdate = await storage.createManufacturingUpdate({
        manufacturingId: newManufacturing.id,
        status: 'awaiting_admin_confirmation',
        notes: `Manufacturing structure duplicated from record #${originalManufacturing.id}`,
        updatedBy: (req as AuthenticatedRequest).user.userData!.id,
        manufacturerId: newManufacturing.manufacturerId || undefined,
        orderId: newManufacturing.orderId,
      });

      // Get the latest update from the original manufacturing to copy line item structure
      const originalUpdates = await storage.getManufacturingUpdates(manufacturingId);
      if (originalUpdates.length > 0) {
        const latestOriginalUpdate = originalUpdates[0];
        
        // Get line items from the latest original update
        const originalLineItems = await db
          .select()
          .from(manufacturingUpdateLineItems)
          .where(eq(manufacturingUpdateLineItems.manufacturingUpdateId, latestOriginalUpdate.id));

        // Create line items with zero quantities for the new update
        if (originalLineItems.length > 0) {
          const newLineItems = originalLineItems.map(item => ({
            manufacturingUpdateId: initialUpdate.id,
            lineItemId: item.lineItemId,
            productName: item.productName,
            variantCode: item.variantCode,
            variantColor: item.variantColor,
            imageUrl: item.imageUrl,
            // Set all quantities to 0
            yxs: 0,
            ys: 0,
            ym: 0,
            yl: 0,
            xs: 0,
            s: 0,
            m: 0,
            l: 0,
            xl: 0,
            xxl: 0,
            xxxl: 0,
            xxxxl: 0,
            descriptors: (item as any).descriptors || [],
          }));

          await db.insert(manufacturingUpdateLineItems).values(newLineItems);
        }
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing',
        newManufacturing.id,
        'created',
        null,
        {
          ...newManufacturing,
          note: `Structure duplicated from manufacturing record #${originalManufacturing.id}`,
        }
      );

      res.json(newManufacturing);
    } catch (error) {
      console.error("Error duplicating manufacturing structure:", error);
      res.status(500).json({ 
        message: "Failed to duplicate manufacturing structure",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/manufacturing/:id/archive', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      const record = await storage.archiveManufacturing(id, user.id);
      
      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'archived',
        null,
        record
      );
      
      const filteredRecord = stripFinancialData(record, user.role);
      res.json(filteredRecord);
    } catch (error) {
      console.error("Error archiving manufacturing record:", error);
      res.status(500).json({ message: "Failed to archive manufacturing record" });
    }
  });
  
  app.post('/api/manufacturing/:id/unarchive', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      const record = await storage.unarchiveManufacturing(id);
      
      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'unarchived',
        null,
        record
      );
      
      const filteredRecord = stripFinancialData(record, user.role);
      res.json(filteredRecord);
    } catch (error) {
      console.error("Error unarchiving manufacturing record:", error);
      res.status(500).json({ message: "Failed to unarchive manufacturing record" });
    }
  });

  // Manufacturing status updates
  app.get('/api/manufacturing-updates', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturingId = req.query.manufacturingId ? parseInt(req.query.manufacturingId as string) : undefined;
      const user = (req as AuthenticatedRequest).user.userData!;
      const updates = await storage.getManufacturingUpdates(manufacturingId, user);
      
      const filteredUpdates = stripFinancialData(updates, user.role);
      res.json(filteredUpdates);
    } catch (error) {
      console.error("Error fetching manufacturing updates:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing updates" });
    }
  });

  app.post('/api/manufacturing-updates', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertManufacturingUpdateSchema.parse({
        ...req.body,
        updatedBy: user.id,
      });

      const update = await storage.createManufacturingUpdate(validatedData);
      
      // Create or update manufacturing update line items from order line items
      if (validatedData.orderId) {
        const orderLineItemsWithDetails = await db
          .select({
            order_line_items: orderLineItems,
            product_variants: productVariants,
            products: products,
          })
          .from(orderLineItems)
          .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .leftJoin(products, eq(productVariants.productId, products.id))
          .where(eq(orderLineItems.orderId, validatedData.orderId));

        if (orderLineItemsWithDetails.length > 0) {
          // Check if line items already exist
          const existingLineItems = await db
            .select()
            .from(manufacturingUpdateLineItems)
            .where(eq(manufacturingUpdateLineItems.manufacturingUpdateId, update.id));

          if (existingLineItems.length === 0) {
            // Create new line items
            const lineItemsToInsert = orderLineItemsWithDetails.map(row => ({
              manufacturingUpdateId: update.id,
              lineItemId: row.order_line_items.id,
              // Snapshot fields
              productName: row.products?.name || 'Unknown Product',
              variantCode: row.product_variants?.variantCode || '',
              variantColor: row.product_variants?.color || '',
              imageUrl: row.order_line_items.imageUrl || row.product_variants?.imageUrl || null,
              // Size distribution
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
              // Workflow fields
              sizesConfirmed: false,
              manufacturerCompleted: false,
            }));

            await db.insert(manufacturingUpdateLineItems).values(lineItemsToInsert);
          }
        }
      }

      // Update the manufacturing record's status if specified
      if (validatedData.status && validatedData.manufacturingId) {
        await storage.updateManufacturing(validatedData.manufacturingId, {
          status: validatedData.status,
        });
      }

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing_update',
        update.id,
        'created',
        null,
        update
      );

      // Notify all manufacturer role users about the new update
      const manufacturerUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'manufacturer'));
      
      for (const manufacturerUser of manufacturerUsers) {
        if (manufacturerUser.id !== user.id) {
          await storage.createNotification({
            userId: manufacturerUser.id,
            title: "New Manufacturing Update",
            message: `${user.name} created a new manufacturing update${update.status ? `: ${update.status}` : ''}${update.notes ? ` - ${update.notes.substring(0, 100)}` : ''}`,
            type: "info",
            link: update.manufacturingId ? `/manufacturing/${update.manufacturingId}` : undefined
          });
        }
      }

      const filteredUpdate = stripFinancialData(update, user.role);
      res.status(201).json(filteredUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing update:", error);
      res.status(500).json({ message: "Failed to create manufacturing update" });
    }
  });

  app.put('/api/manufacturing-updates/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertManufacturingUpdateSchema.partial().parse(req.body);

      const existingUpdate = await storage.getManufacturingUpdateById(id);
      if (!existingUpdate) {
        return res.status(404).json({ message: "Manufacturing update not found" });
      }

      const updated = await storage.updateManufacturingUpdate(id, validatedData);

      // Update the manufacturing record's status if specified
      if (validatedData.status && existingUpdate.manufacturingId) {
        await storage.updateManufacturing(existingUpdate.manufacturingId, {
          status: validatedData.status,
        });
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing_update',
        id,
        'updated',
        existingUpdate,
        updated
      );

      // Notify all manufacturer role users about the update
      const user = (req as AuthenticatedRequest).user.userData!;
      const manufacturerUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'manufacturer'));
      
      for (const manufacturerUser of manufacturerUsers) {
        if (manufacturerUser.id !== user.id) {
          await storage.createNotification({
            userId: manufacturerUser.id,
            title: "Manufacturing Update Changed",
            message: `${user.name} updated a manufacturing update${updated.status ? `: ${updated.status}` : ''}${updated.notes ? ` - ${updated.notes.substring(0, 100)}` : ''}`,
            type: "info",
            link: updated.manufacturingId ? `/manufacturing/${updated.manufacturingId}` : undefined
          });
        }
      }

      const filteredUpdate = stripFinancialData(updated, user.role);
      res.json(filteredUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturing update:", error);
      res.status(500).json({ message: "Failed to update manufacturing update" });
    }
  });

  app.delete('/api/manufacturing-updates/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingUpdate = await storage.getManufacturingUpdateById(id);
      if (!existingUpdate) {
        return res.status(404).json({ message: "Manufacturing update not found" });
      }

      await storage.deleteManufacturingUpdate(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing_update',
        id,
        'deleted',
        existingUpdate,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting manufacturing update:", error);
      res.status(500).json({ message: "Failed to delete manufacturing update" });
    }
  });
  
  // Refresh manufacturing update line items from order
  app.post('/api/manufacturing-updates/:id/refresh-line-items', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      // Only admin and ops users can refresh line items
      if (!['admin', 'ops'].includes(user.role)) {
        return res.status(403).json({ message: "Only admin and ops users can refresh line items" });
      }
      
      // Get the manufacturing update
      const update = await storage.getManufacturingUpdateById(updateId);
      if (!update) {
        return res.status(404).json({ message: "Manufacturing update not found" });
      }
      
      // Get the manufacturing record to find the order
      const manufacturingRecord = await storage.getManufacturingRecord(update.manufacturingId);
      if (!manufacturingRecord || !manufacturingRecord.orderId) {
        return res.status(400).json({ message: "No order associated with this manufacturing update" });
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
        .where(eq(orderLineItems.orderId, manufacturingRecord.orderId));
      
      // Get existing manufacturing update line items
      const existingLineItems = await db
        .select()
        .from(manufacturingUpdateLineItems)
        .where(eq(manufacturingUpdateLineItems.manufacturingUpdateId, updateId));
      
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
          variantCode: row.product_variants?.variantCode || '',
          variantColor: row.product_variants?.color || '',
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
            .update(manufacturingUpdateLineItems)
            .set(updatedData)
            .where(eq(manufacturingUpdateLineItems.id, existing.id));
          updatedCount++;
        } else {
          // Create new line item for newly added order items
          await db.insert(manufacturingUpdateLineItems).values({
            manufacturingUpdateId: updateId,
            lineItemId: row.order_line_items.id,
            ...updatedData,
            sizesConfirmed: false,
            manufacturerCompleted: false,
          });
          createdCount++;
        }
      }
      
      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing_update',
        updateId,
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
      console.error("Error refreshing manufacturing update line items:", error);
      res.status(500).json({ message: "Failed to refresh line items" });
    }
  });

  // Get specific manufacturing record
  app.get('/api/manufacturing/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData;
      const record = await storage.getManufacturingRecord(id, user);

      if (!record) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const filteredRecord = stripFinancialData(record, user?.role || 'guest');
      res.json(filteredRecord);
    } catch (error) {
      console.error("Error fetching manufacturing record:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing record" });
    }
  });

  // Line Item Manufacturers API
  app.get('/api/line-item-manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : undefined;
      
      if (!orderId) {
        return res.status(400).json({ message: "orderId is required" });
      }
      
      const manufacturers = await storage.getLineItemManufacturersByOrder(orderId);
      
      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredManufacturers = stripFinancialData(manufacturers, user.role);
      res.json(filteredManufacturers);
    } catch (error) {
      console.error("Error fetching line item manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch line item manufacturers" });
    }
  });

  app.post('/api/line-item-manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const validatedData = insertOrderLineItemManufacturerSchema.parse(req.body);

      const manufacturer = await storage.assignManufacturerToLineItem(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        manufacturer.id,
        'created',
        null,
        manufacturer
      );

      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredManufacturer = stripFinancialData(manufacturer, user.role);
      res.status(201).json(filteredManufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating line item manufacturer:", error);
      res.status(500).json({ message: "Failed to create line item manufacturer" });
    }
  });

  // Bulk reassign manufacturers for an order
  app.post('/api/line-item-manufacturers/bulk-reassign', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const { orderId, manufacturerId } = req.body;
      
      if (!orderId || !manufacturerId) {
        return res.status(400).json({ message: "orderId and manufacturerId are required" });
      }

      // Get all line items for the order
      const lineItems = await db
        .select({ id: orderLineItems.id })
        .from(orderLineItems)
        .where(eq(orderLineItems.orderId, orderId));

      if (lineItems.length === 0) {
        return res.status(404).json({ message: "No line items found for this order" });
      }

      // Delete existing manufacturer assignments for these line items
      await db
        .delete(orderLineItemManufacturers)
        .where(
          inArray(
            orderLineItemManufacturers.lineItemId,
            lineItems.map(item => item.id)
          )
        );

      // Create new manufacturer assignments
      const newAssignments = lineItems.map(item => ({
        lineItemId: item.id,
        manufacturerId: manufacturerId,
        leadTimeDays: 14,
        costPerUnit: 0,
      }));

      const created = await db
        .insert(orderLineItemManufacturers)
        .values(newAssignments)
        .returning();

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        orderId,
        'bulk_reassigned',
        null,
        { manufacturerId, count: created.length }
      );

      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredCreated = stripFinancialData(created, user.role);
      res.json({ 
        message: `Successfully reassigned ${created.length} line items to manufacturer`,
        assignments: filteredCreated
      });
    } catch (error) {
      console.error("Error bulk reassigning manufacturers:", error);
      res.status(500).json({ message: "Failed to bulk reassign manufacturers" });
    }
  });

  app.put('/api/line-item-manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOrderLineItemManufacturerSchema.partial().parse(req.body);

      const updated = await storage.updateLineItemManufacturer(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        id,
        'updated',
        null,
        updated
      );

      const user = (req as AuthenticatedRequest).user.userData!;
      const filteredUpdate = stripFinancialData(updated, user.role);
      res.json(filteredUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating line item manufacturer:", error);
      res.status(500).json({ message: "Failed to update line item manufacturer" });
    }
  });

  app.delete('/api/line-item-manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLineItemManufacturer(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        id,
        'deleted',
        null,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting line item manufacturer:", error);
      res.status(500).json({ message: "Failed to delete line item manufacturer" });
    }
  });

  // Export manufacturing update as PDF - Moved earlier to ensure proper registration
  app.get('/api/manufacturing-updates/:id/export-pdf', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      console.log(`[PDF EXPORT] Starting PDF export for update ID: ${updateId}`);
      console.log(`[PDF EXPORT] User role: ${(req as AuthenticatedRequest).user.userData?.role}`);
      
      // Get the specific manufacturing update
      const update = await storage.getManufacturingUpdateById(updateId);
      
      if (!update) {
        console.error(`[PDF EXPORT] Manufacturing update ${updateId} not found`);
        return res.status(404).json({ message: "Manufacturing update not found" });
      }

      // Get manufacturing record with better error handling
      let manufacturingRecord;
      try {
        manufacturingRecord = await storage.getManufacturingRecord(update.manufacturingId);
      } catch (dbError) {
        console.error(`[PDF EXPORT] Database error fetching manufacturing record:`, dbError);
        // Try alternative query if column mismatch
        try {
          const [record] = await db
            .select()
            .from(manufacturing)
            .where(eq(manufacturing.id, update.manufacturingId));
          manufacturingRecord = record;
        } catch (fallbackError) {
          console.error(`[PDF EXPORT] Fallback query also failed:`, fallbackError);
          throw dbError;
        }
      }
      
      if (!manufacturingRecord) {
        console.error(`[PDF EXPORT] Manufacturing record ${update.manufacturingId} not found`);
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      // Get order and organization details with error handling
      let order, org;
      try {
        order = manufacturingRecord.orderId ? await storage.getOrder(manufacturingRecord.orderId) : null;
        org = order?.orgId ? await storage.getOrganization(order.orgId) : null;
      } catch (err) {
        console.error(`[PDF EXPORT] Error fetching order/org details:`, err);
        // Continue without order/org details
      }

      // Get line items for this update
      const lineItemsData = await db
        .select()
        .from(manufacturingUpdateLineItems)
        .where(eq(manufacturingUpdateLineItems.manufacturingUpdateId, updateId));
      
      console.log(`[PDF EXPORT] Found ${lineItemsData.length} line items`);
      
      // Get manufacturer assignments for each line item
      const lineItemIds = lineItemsData.map(li => li.lineItemId);
      const manufacturerAssignments = lineItemIds.length > 0 ? await db
        .select({
          lineItemId: orderLineItemManufacturers.lineItemId,
          manufacturerId: orderLineItemManufacturers.manufacturerId,
          manufacturerName: manufacturers.name,
        })
        .from(orderLineItemManufacturers)
        .innerJoin(manufacturers, eq(manufacturers.id, orderLineItemManufacturers.manufacturerId))
        .where(inArray(orderLineItemManufacturers.lineItemId, lineItemIds)) : [];
      
      // Create a map of lineItemId -> manufacturer names
      const manufacturerMap = new Map<number, string[]>();
      manufacturerAssignments.forEach(assignment => {
        if (!manufacturerMap.has(assignment.lineItemId)) {
          manufacturerMap.set(assignment.lineItemId, []);
        }
        manufacturerMap.get(assignment.lineItemId)!.push(assignment.manufacturerName);
      });

      // Create PDF using PDFKit with Rich Habits branding
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'LETTER',
        bufferPages: true
      });
      const chunks: Buffer[] = [];
      
      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // Rich Habits brand colors (approximation based on professional branding)
      const brandBlack = '#000000';
      const brandGray = '#666666';
      const accentColor = '#333333';
      
      // Add Rich Habits logo (smaller, top-right corner)
      try {
        const logoPath = path.join(process.cwd(), 'attached_assets', 'BlackPNG_New_Rich_Habits_Logo_caa84ddc-c1dc-49fa-a3cf-063db73499d3_1761071466643.png');
        if (fs.existsSync(logoPath)) {
          // Position logo in top-right corner, smaller size
          doc.image(logoPath, doc.page.width - 110, 45, { width: 60 });
        }
      } catch (err) {
        console.warn('[PDF EXPORT] Could not load Rich Habits logo:', err);
      }
      
      // Header with company branding
      doc.fontSize(24)
         .fillColor(brandBlack)
         .text('Manufacturing Update', 50, 50, { align: 'left' });
      
      doc.moveTo(50, doc.y + 10)
         .lineTo(doc.page.width - 50, doc.y + 10)
         .strokeColor(accentColor)
         .lineWidth(2)
         .stroke();
      
      doc.moveDown(1);
      
      // Update details in a professional format
      doc.fontSize(11).fillColor(brandGray);
      const detailsY = doc.y;
      doc.text(`Update ID:`, 50, detailsY, { continued: true })
         .fillColor(brandBlack)
         .text(` ${update.id}`);
      
      doc.fillColor(brandGray)
         .text(`Order Code:`, 50, doc.y + 5, { continued: true })
         .fillColor(brandBlack)
         .text(` ${order?.orderCode || 'N/A'}`);
      
      doc.fillColor(brandGray)
         .text(`Organization:`, 50, doc.y + 5, { continued: true })
         .fillColor(brandBlack)
         .text(` ${org?.name || 'N/A'}`);
      
      doc.fillColor(brandGray)
         .text(`Status:`, 50, doc.y + 5, { continued: true })
         .fillColor(brandBlack)
         .text(` ${update.status.replace(/_/g, ' ').toUpperCase()}`);
      
      doc.fillColor(brandGray)
         .text(`Date:`, 50, doc.y + 5, { continued: true })
         .fillColor(brandBlack)
         .text(` ${update.createdAt ? new Date(update.createdAt).toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         }) : 'N/A'}`);
      
      doc.moveDown(2);
      
      // Line items section header
      doc.fontSize(16)
         .fillColor(brandBlack)
         .text('Product Line Items', { underline: true });
      doc.moveDown(0.5);
      
      if (lineItemsData.length === 0) {
        doc.fontSize(10).fillColor(brandGray).text('No line items found');
      } else {
        // Process each line item with images and descriptors
        for (let index = 0; index < lineItemsData.length; index++) {
          const item = lineItemsData[index];
          
          // Check if we need a new page
          if (doc.y > 620) {
            doc.addPage();
          }
          
          // Item number and product name
          doc.fontSize(12)
             .fillColor(brandBlack)
             .text(`${index + 1}. ${item.productName || 'N/A'}`, { underline: true });
          doc.moveDown(0.5);
          
          const itemStartY = doc.y;
          const imageBoxWidth = 120;
          const imageBoxHeight = 120;
          const imageX = doc.page.width - imageBoxWidth - 50;
          let actualImageHeight = imageBoxHeight;
          
          // Try to add order line item image, or show "No Image" box
          let hasImage = false;
          if (item.imageUrl) {
            try {
              // Convert relative URLs to absolute URLs for server-side fetch
              let imageUrl = item.imageUrl;
              if (imageUrl.startsWith('/')) {
                // Relative URL - construct absolute URL using request host
                const protocol = req.protocol || 'http';
                const host = req.get('host') || 'localhost:5000';
                imageUrl = `${protocol}://${host}${imageUrl}`;
              }
              
              console.log(`[PDF EXPORT] Fetching order line item image from: ${imageUrl}`);
              const imageResponse = await fetch(imageUrl);
              
              if (imageResponse.ok) {
                const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                console.log(`[PDF EXPORT] Successfully loaded image (${imageBuffer.length} bytes)`);
                
                // PDFKit automatically handles image sizing and aspect ratio
                // We just need to fit it within our box constraints
                doc.image(imageBuffer, imageX, itemStartY, {
                  fit: [imageBoxWidth, imageBoxHeight],
                  align: 'center',
                  valign: 'center'
                });
                
                hasImage = true;
                console.log(`[PDF EXPORT] Image rendered successfully for item ${item.id}`);
              } else {
                console.warn(`[PDF EXPORT] Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
              }
            } catch (imgErr) {
              console.error(`[PDF EXPORT] Error loading order line item image for item ${item.id}:`, imgErr);
            }
          } else {
            console.log(`[PDF EXPORT] No image URL for item ${item.id}`);
          }
          
          // Save Y position before drawing image (images can affect doc.y)
          const savedY = doc.y;
          
          // If no image loaded, draw "No Image" box
          if (!hasImage) {
            doc.rect(imageX, itemStartY, imageBoxWidth, imageBoxHeight)
               .strokeColor('#CCCCCC')
               .lineWidth(1)
               .stroke();
            
            doc.fontSize(10)
               .fillColor('#999999')
               .text('No Image', imageX, itemStartY + imageBoxHeight / 2 - 5, {
                 width: imageBoxWidth,
                 align: 'center'
               });
          }
          
          // Restore Y position so text isn't affected by image placement
          doc.y = savedY;
          
          // Product details (left side, accounting for image box)
          const textWidth = doc.page.width - imageBoxWidth - 120;
          let currentY = itemStartY;
          
          doc.fontSize(10).fillColor(brandGray);
          doc.text('Variant Code: ', 50, currentY, { continued: true, width: textWidth });
          doc.fillColor(brandBlack).text(item.variantCode || 'N/A', { width: textWidth });
          currentY = doc.y + 5;
          
          doc.fillColor(brandGray);
          doc.text('Color: ', 50, currentY, { continued: true, width: textWidth });
          doc.fillColor(brandBlack).text(item.variantColor || 'N/A', { width: textWidth });
          currentY = doc.y + 5;
          
          // Manufacturer assignment
          const assignedManufacturers = manufacturerMap.get(item.lineItemId) || [];
          doc.fillColor(brandGray);
          doc.text('Manufacturer: ', 50, currentY, { continued: true, width: textWidth });
          doc.fillColor(brandBlack).text(assignedManufacturers.length > 0 ? assignedManufacturers.join(', ') : 'Not Assigned', { width: textWidth });
          currentY = doc.y + 5;
          
          // Size breakdown
          const sizes = [
            item.yxs && `YXS: ${item.yxs}`,
            item.ys && `YS: ${item.ys}`,
            item.ym && `YM: ${item.ym}`,
            item.yl && `YL: ${item.yl}`,
            item.xs && `XS: ${item.xs}`,
            item.s && `S: ${item.s}`,
            item.m && `M: ${item.m}`,
            item.l && `L: ${item.l}`,
            item.xl && `XL: ${item.xl}`,
            item.xxl && `2XL: ${item.xxl}`,
            item.xxxl && `3XL: ${item.xxxl}`,
          ].filter(Boolean).join(', ');
          
          doc.fillColor(brandGray);
          doc.text('Sizes: ', 50, currentY, { continued: true, width: textWidth });
          doc.fillColor(brandBlack).text(sizes || 'No sizes specified', { width: textWidth });
          currentY = doc.y + 8;
          
          // Descriptors section
          if (item.descriptors && Array.isArray(item.descriptors) && item.descriptors.length > 0) {
            doc.fillColor(brandGray);
            doc.text('Descriptors:', 50, currentY, { width: textWidth });
            currentY = doc.y + 3;
            
            item.descriptors.forEach((descriptor: string) => {
              doc.fontSize(9)
                 .fillColor(brandBlack)
                 .text(`  • ${descriptor}`, 55, currentY, { width: textWidth - 5 });
              currentY = doc.y + 2;
            });
          }
          
          // Ensure we move past the image box if text is shorter
          const textEndY = currentY;
          const imageEndY = itemStartY + imageBoxHeight;
          const rowEndY = Math.max(textEndY, imageEndY);
          
          // Move to end of row
          doc.y = rowEndY + 15;
          
          // Draw separator line
          doc.moveTo(50, doc.y)
             .lineTo(doc.page.width - 50, doc.y)
             .strokeColor('#CCCCCC')
             .lineWidth(0.5)
             .stroke();
          
          doc.moveDown(1);
        }
      }
      
      // Footer with Rich Habits branding
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor(brandGray)
           .text(
             `Rich Habits Manufacturing | Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }
      
      // Finalize PDF
      doc.end();
      
      // Wait for PDF generation to complete
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`[PDF EXPORT] PDF generated successfully (${buffer.length} bytes)`);
          resolve(buffer);
        });
        doc.on('error', reject);
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="manufacturing-update-${updateId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[PDF EXPORT] Error:", error);
      console.error("[PDF EXPORT] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Failed to generate PDF export", 
          error: error instanceof Error ? error.message : String(error),
          stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
        });
      }
    }
  });

  // Export manufacturing update attachments as ZIP - Moved earlier to ensure proper registration
  app.get('/api/manufacturing-updates/:id/export-zip', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      console.log(`[ZIP EXPORT] Starting ZIP export for update ID: ${updateId}`);
      console.log(`[ZIP EXPORT] User role: ${(req as AuthenticatedRequest).user.userData?.role}`);
      
      // Get the specific manufacturing update
      console.log(`[ZIP EXPORT] Fetching manufacturing update from database...`);
      const update = await storage.getManufacturingUpdateById(updateId);
      console.log(`[ZIP EXPORT] Update found:`, update ? 'YES' : 'NO');
      
      if (!update) {
        console.error(`[ZIP EXPORT] Manufacturing update ${updateId} not found in database`);
        return res.status(404).json({ message: "Manufacturing update not found" });
      }
      
      console.log(`[ZIP EXPORT] Update details:`, JSON.stringify(update, null, 2));

      // Get manufacturing record to fetch attachments
      const manufacturingId = update.manufacturingId;
      console.log(`[ZIP EXPORT] Fetching attachments for manufacturing ID: ${manufacturingId}`);
      
      let attachments: ManufacturingAttachment[];
      try {
        attachments = await storage.getManufacturingAttachments(manufacturingId);
      } catch (err) {
        console.error(`[ZIP EXPORT] Error fetching attachments:`, err);
        attachments = [];
      }
      
      console.log(`[ZIP EXPORT] Attachments found: ${attachments.length}`);

      if (attachments.length === 0) {
        console.warn(`[ZIP EXPORT] No attachments found for manufacturing ID: ${manufacturingId}`);
        return res.status(404).json({ message: "No attachments found for this manufacturing update" });
      }
      
      console.log(`[ZIP EXPORT] Attachment details:`, JSON.stringify(attachments, null, 2));

      console.log(`[ZIP EXPORT] Creating archive...`);
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      console.log(`[ZIP EXPORT] Setting response headers...`);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="manufacturing-update-${updateId}-attachments.zip"`);

      archive.on('error', (err) => {
        console.error('[ZIP EXPORT] Archive error:', err);
        console.error('[ZIP EXPORT] Archive error stack:', err.stack);
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to create archive" });
        }
      });

      archive.on('warning', (warn) => {
        console.warn('[ZIP EXPORT] Archive warning:', warn);
      });

      archive.on('progress', (progress) => {
        console.log(`[ZIP EXPORT] Archive progress: ${progress.entries.processed}/${progress.entries.total} entries`);
      });

      console.log(`[ZIP EXPORT] Piping archive to response...`);
      archive.pipe(res);

      // Group attachments by category and add to ZIP
      const categories = ['logos', 'psds', 'mockups', 'production_files', 'other'];
      console.log(`[ZIP EXPORT] Processing ${categories.length} categories...`);
      
      let totalFilesAdded = 0;
      let failedFiles = 0;
      
      // Check if ObjectStorageService is available
      let objectStorageService;
      try {
        objectStorageService = new ObjectStorageService();
      } catch (err) {
        console.error('[ZIP EXPORT] ObjectStorageService not available:', err);
        // Add a README explaining the issue
        archive.append('Object storage service is not available. Files cannot be retrieved.', {
          name: 'ERROR_README.txt'
        });
        archive.finalize();
        return;
      }
      
      for (const category of categories) {
        const categoryAttachments = attachments.filter(a => a.category === category);
        console.log(`[ZIP EXPORT] Category '${category}': ${categoryAttachments.length} attachments`);
        
        for (const attachment of categoryAttachments) {
          try {
            console.log(`[ZIP EXPORT] Fetching file from object storage: ${attachment.fileUrl}`);
            
            // Strip /public-objects prefix if present, then remove leading slash
            let filePath = attachment.fileUrl;
            if (filePath.startsWith('/public-objects/')) {
              filePath = filePath.substring('/public-objects/'.length);
            } else if (filePath.startsWith('public-objects/')) {
              filePath = filePath.substring('public-objects/'.length);
            } else {
              filePath = filePath.replace(/^\//, '');
            }
            
            console.log(`[ZIP EXPORT] Searching for file: ${filePath}`);
            
            const file = await objectStorageService.searchPublicObject(filePath);
            
            if (!file) {
              console.warn(`[ZIP EXPORT] File not found in object storage: ${filePath}`);
              // Add a placeholder text file indicating the file wasn't found
              const errorContent = `File not found in object storage\nOriginal URL: ${attachment.fileUrl}\nSearched path: ${filePath}\nDescription: ${attachment.description || 'N/A'}`;
              archive.append(errorContent, { 
                name: `${category}/${attachment.fileName}_NOT_FOUND.txt` 
              });
              failedFiles++;
              continue;
            }
            
            // Download the file as a buffer
            const [fileBuffer] = await file.download();
            const [metadata] = await file.getMetadata();
            
            console.log(`[ZIP EXPORT] Adding file: ${category}/${attachment.fileName} (${fileBuffer.length} bytes)`);
            
            // Add the actual file to the archive
            archive.append(fileBuffer, { 
              name: `${category}/${attachment.fileName}` 
            });
            totalFilesAdded++;
          } catch (err) {
            console.error(`[ZIP EXPORT] Error adding file ${attachment.fileName}:`, err);
            // Add error text file instead
            const errorContent = `Error downloading file: ${err instanceof Error ? err.message : String(err)}\nOriginal URL: ${attachment.fileUrl}`;
            archive.append(errorContent, { 
              name: `${category}/${attachment.fileName}_ERROR.txt` 
            });
            failedFiles++;
          }
        }
      }
      
      console.log(`[ZIP EXPORT] Archive summary: ${totalFilesAdded} files added, ${failedFiles} files failed`);
      
      // Add a summary file
      const summaryContent = `Manufacturing Update Export Summary
======================================
Update ID: ${updateId}
Manufacturing ID: ${manufacturingId}
Export Date: ${new Date().toISOString()}
Total Attachments: ${attachments.length}
Files Added: ${totalFilesAdded}
Failed Files: ${failedFiles}
`;
      archive.append(summaryContent, { name: 'EXPORT_SUMMARY.txt' });
      
      // Finalize the archive
      console.log(`[ZIP EXPORT] Finalizing archive...`);
      archive.finalize();
    } catch (error) {
      console.error("[ZIP EXPORT] Error:", error);
      console.error("[ZIP EXPORT] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Failed to generate ZIP export", 
          error: error instanceof Error ? error.message : String(error),
          details: error instanceof Error ? error.stack : undefined
        });
      }
    }
  });

  // Manufacturing Attachments API
  app.get('/api/manufacturing/:manufacturingId/attachments', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturingId = parseInt(req.params.manufacturingId);
      const attachments = await storage.getManufacturingAttachments(manufacturingId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching manufacturing attachments:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing attachments" });
    }
  });

  app.post('/api/manufacturing/:manufacturingId/attachments', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const manufacturingId = parseInt(req.params.manufacturingId);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      const validatedData = insertManufacturingAttachmentSchema.parse({
        ...req.body,
        manufacturingId,
        uploadedBy: user.id,
      });

      const attachment = await storage.createManufacturingAttachment(validatedData);

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing_attachment',
        attachment.id,
        'created',
        null,
        attachment
      );

      res.status(201).json(attachment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing attachment:", error);
      res.status(500).json({ message: "Failed to create manufacturing attachment" });
    }
  });

  app.delete('/api/manufacturing/attachments/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteManufacturingAttachment(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing_attachment',
        id,
        'deleted',
        null,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting manufacturing attachment:", error);
      res.status(500).json({ message: "Failed to delete manufacturing attachment" });
    }
  });

  // Manufacturers CRUD API
  app.get('/api/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });

  app.post('/api/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const { insertManufacturerSchema } = await import('@shared/schema');
      const validatedData = insertManufacturerSchema.parse(req.body);
      const manufacturer = await storage.createManufacturer(validatedData);
      
      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturer',
        manufacturer.id,
        'created',
        null,
        manufacturer
      );
      
      res.status(201).json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturer:", error);
      res.status(500).json({ message: "Failed to create manufacturer" });
    }
  });

  app.put('/api/manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const { insertManufacturerSchema } = await import('@shared/schema');
      const id = parseInt(req.params.id);
      const validatedData = insertManufacturerSchema.partial().parse(req.body);
      const manufacturer = await storage.updateManufacturer(id, validatedData);
      
      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturer',
        id,
        'updated',
        null,
        manufacturer
      );
      
      res.json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturer:", error);
      res.status(500).json({ message: "Failed to update manufacturer" });
    }
  });
}