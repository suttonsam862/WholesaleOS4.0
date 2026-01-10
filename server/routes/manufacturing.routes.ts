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
  manufacturingFinishedImages,
  insertManufacturingFinishedImageSchema,
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

// Create a shared instance of ObjectStorageService for PDF exports
const objectStorageService = new ObjectStorageService();

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
          xxxxl: manufacturingUpdateLineItems.xxxxl,
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

  // Manufacturing Finished Images API
  // Get finished images for a line item
  app.get('/api/manufacturing-line-items/:id/finished-images', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const lineItemId = parseInt(req.params.id);
      
      if (isNaN(lineItemId)) {
        return res.status(400).json({ message: "Invalid line item ID" });
      }

      const images = await storage.getFinishedImages(lineItemId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching finished images:", error);
      res.status(500).json({ message: "Failed to fetch finished images" });
    }
  });

  // Create a finished image record (after upload)
  app.post('/api/manufacturing-line-items/:id/finished-images', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const lineItemId = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      if (isNaN(lineItemId)) {
        return res.status(400).json({ message: "Invalid line item ID" });
      }

      // Verify the line item exists
      const [lineItem] = await db
        .select()
        .from(manufacturingUpdateLineItems)
        .where(eq(manufacturingUpdateLineItems.id, lineItemId))
        .limit(1);

      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }

      // Authorization check for manufacturer users
      if (user.role === 'manufacturer') {
        const [userManufacturer] = await db
          .select()
          .from(userManufacturerAssociations)
          .where(eq(userManufacturerAssociations.userId, user.id))
          .limit(1);

        if (!userManufacturer) {
          return res.status(403).json({ message: "Not authorized to upload images for this line item" });
        }

        // Verify manufacturer is assigned to this line item
        const [assignment] = await db
          .select()
          .from(orderLineItemManufacturers)
          .where(and(
            eq(orderLineItemManufacturers.lineItemId, lineItem.lineItemId),
            eq(orderLineItemManufacturers.manufacturerId, userManufacturer.manufacturerId)
          ))
          .limit(1);

        if (!assignment) {
          return res.status(403).json({ message: "Not authorized to upload images for this line item" });
        }
      }

      const { imageUrl } = req.body;
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: "imageUrl is required" });
      }

      const finishedImage = await storage.createFinishedImage({
        manufacturingUpdateLineItemId: lineItemId,
        imageUrl,
        uploadedBy: user.id,
      });

      res.status(201).json(finishedImage);
    } catch (error) {
      console.error("Error creating finished image:", error);
      res.status(500).json({ message: "Failed to create finished image" });
    }
  });

  // Delete a finished image
  app.delete('/api/manufacturing-finished-images/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      if (isNaN(imageId)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      // Get the image first to check authorization
      const image = await storage.getFinishedImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Finished image not found" });
      }

      // Authorization check for manufacturer users - can only delete their own uploads
      if (user.role === 'manufacturer' && image.uploadedBy !== user.id) {
        return res.status(403).json({ message: "Not authorized to delete this image" });
      }

      await storage.deleteFinishedImage(imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting finished image:", error);
      res.status(500).json({ message: "Failed to delete finished image" });
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
      const user = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertManufacturingSchema.partial().parse(req.body);

      // Validate manufacturing status if provided
      if (validatedData.status && !isValidManufacturingStatus(validatedData.status)) {
        return res.status(400).json({ 
          message: `Invalid manufacturing status. Allowed values: ${getValidManufacturingStatuses().join(', ')}` 
        });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
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
          updatedBy: user.id,
          manufacturerId: updatedRecord.manufacturerId || undefined,
        });
      }

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'updated',
        existingRecord,
        updatedRecord
      );

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
      const user = (req as AuthenticatedRequest).user.userData!;

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      await storage.deleteManufacturing(id);

      // Log activity
      await storage.logActivity(
        user.id,
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
      const user = (req as AuthenticatedRequest).user.userData!;
      const originalManufacturing = await storage.getManufacturingRecord(manufacturingId, user);
      
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
        updatedBy: user.id,
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

  // Update completed product images for manufacturing record
  app.put('/api/manufacturing/:id/completed-images', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      const { completedProductImages } = req.body;

      if (!Array.isArray(completedProductImages)) {
        return res.status(400).json({ message: "completedProductImages must be an array" });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const updatedRecord = await storage.updateManufacturing(id, {
        completedProductImages,
      });

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'updated',
        { completedProductImages: existingRecord.completedProductImages },
        { completedProductImages: updatedRecord.completedProductImages }
      );

      const filteredRecord = stripFinancialData(updatedRecord, user.role);
      res.json(filteredRecord);
    } catch (error) {
      console.error("Error updating completed images:", error);
      res.status(500).json({ message: "Failed to update completed images" });
    }
  });

  // Default materials checklist template
  const DEFAULT_MATERIALS_CHECKLIST = [
    { id: 1, category: 'Fabric', item: 'Main Fabric', status: 'new' as const, checked: false },
    { id: 2, category: 'Fabric', item: 'Lining Fabric', status: 'new' as const, checked: false },
    { id: 3, category: 'Thread', item: 'Primary Thread Color', status: 'new' as const, checked: false },
    { id: 4, category: 'Thread', item: 'Contrast Thread Color', status: 'new' as const, checked: false },
    { id: 5, category: 'Labels', item: 'Brand Labels', status: 'new' as const, checked: false },
    { id: 6, category: 'Labels', item: 'Size Tags', status: 'new' as const, checked: false },
    { id: 7, category: 'Labels', item: 'Care Labels', status: 'new' as const, checked: false },
    { id: 8, category: 'Packaging', item: 'Polybags', status: 'new' as const, checked: false },
    { id: 9, category: 'Packaging', item: 'Cartons', status: 'new' as const, checked: false },
    { id: 10, category: 'Packaging', item: 'Tissue Paper', status: 'new' as const, checked: false },
  ];

  // Get materials checklist for manufacturing record
  app.get('/api/manufacturing/:id/materials-checklist', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      const record = await storage.getManufacturingRecord(id, user);
      if (!record) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      // Return existing checklist or default template
      const checklist = record.materialsChecklist || DEFAULT_MATERIALS_CHECKLIST;
      res.json(checklist);
    } catch (error) {
      console.error("Error fetching materials checklist:", error);
      res.status(500).json({ message: "Failed to fetch materials checklist" });
    }
  });

  // Update materials checklist for manufacturing record
  app.put('/api/manufacturing/:id/materials-checklist', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      const { materialsChecklist } = req.body;

      if (!Array.isArray(materialsChecklist)) {
        return res.status(400).json({ message: "materialsChecklist must be an array" });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const updatedRecord = await storage.updateManufacturing(id, {
        materialsChecklist,
      });

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'updated',
        { materialsChecklist: existingRecord.materialsChecklist },
        { materialsChecklist: updatedRecord.materialsChecklist }
      );

      res.json(updatedRecord.materialsChecklist || DEFAULT_MATERIALS_CHECKLIST);
    } catch (error) {
      console.error("Error updating materials checklist:", error);
      res.status(500).json({ message: "Failed to update materials checklist" });
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
      
      // Get the manufacturing record to find the order (pass user for role-based access)
      const manufacturingRecord = await storage.getManufacturingRecord(update.manufacturingId, user);
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

  // Export manufacturing update as PDF - Manufacturing Order Sheet format
  app.get('/api/manufacturing-updates/:id/export-pdf', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      console.log(`[PDF EXPORT] Starting PDF export for update ID: ${updateId}`);
      
      // Get the specific manufacturing update
      const update = await storage.getManufacturingUpdateById(updateId);
      
      if (!update) {
        console.error(`[PDF EXPORT] Manufacturing update ${updateId} not found`);
        return res.status(404).json({ message: "Manufacturing update not found" });
      }

      // Get manufacturing record with better error handling
      const user = (req as AuthenticatedRequest).user.userData!;
      let manufacturingRecord;
      try {
        manufacturingRecord = await storage.getManufacturingRecord(update.manufacturingId, user);
      } catch (dbError) {
        console.error(`[PDF EXPORT] Database error fetching manufacturing record:`, dbError);
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

      // Get order and organization details
      let order: any = null;
      let org: any = null;
      try {
        order = manufacturingRecord.orderId ? await storage.getOrder(manufacturingRecord.orderId) : null;
        org = order?.orgId ? await storage.getOrganization(order.orgId) : null;
      } catch (err) {
        console.error(`[PDF EXPORT] Error fetching order/org details:`, err);
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

      // Pre-fetch all images using ObjectStorageService for reliability
      // Construct base URL from request for reliable image fetching in any deployment
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      const baseUrl = `${protocol}://${host}`;
      
      const imageCache = new Map<string, Buffer>();
      for (const item of lineItemsData) {
        if (item.imageUrl) {
          try {
            const imageBuffer = await objectStorageService.fetchImageAsBuffer(item.imageUrl, baseUrl);
            if (imageBuffer) {
              imageCache.set(item.imageUrl, imageBuffer);
              console.log(`[PDF EXPORT] Cached image for item ${item.id} (${imageBuffer.length} bytes)`);
            }
          } catch (err) {
            console.warn(`[PDF EXPORT] Failed to cache image for item ${item.id}:`, err);
          }
        }
      }

      // Create PDF using PDFKit - Manufacturing Order Sheet format
      const doc = new PDFDocument({ 
        margin: 40,
        size: 'LETTER',
        bufferPages: true
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      
      // Brand colors
      const brandBlack = '#000000';
      const brandGray = '#666666';
      const lightGray = '#F5F5F5';
      const borderColor = '#DDDDDD';
      const headerBg = '#1a1a2e';

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      // Try to load company logo
      let logoBuffer: Buffer | null = null;
      try {
        const logoPath = path.join(process.cwd(), 'attached_assets', 'BlackPNG_New_Rich_Habits_Logo_caa84ddc-c1dc-49fa-a3cf-063db73499d3_1761071466643.png');
        if (fs.existsSync(logoPath)) {
          logoBuffer = fs.readFileSync(logoPath);
        }
      } catch (err) {
        console.warn('[PDF EXPORT] Could not load company logo:', err);
      }

      // Helper function to draw header on each page
      const drawPageHeader = () => {
        // Header background
        doc.rect(0, 0, pageWidth, 70).fill('#ffffff');
        
        // Logo (left side)
        if (logoBuffer) {
          try {
            doc.image(logoBuffer, margin, 15, { height: 40 });
          } catch (e) {
            console.warn('[PDF EXPORT] Failed to render logo');
          }
        }
        
        // Title (right side)
        doc.fontSize(22)
           .fillColor(brandBlack)
           .text('MANUFACTURING ORDER', margin, 20, { 
             width: contentWidth, 
             align: 'right' 
           });
        
        doc.fontSize(10)
           .fillColor(brandGray)
           .text(`Order: ${order?.orderCode || 'N/A'} | ${org?.name || 'N/A'}`, margin, 45, { 
             width: contentWidth, 
             align: 'right' 
           });
        
        // Header line
        doc.moveTo(margin, 65)
           .lineTo(pageWidth - margin, 65)
           .strokeColor(brandBlack)
           .lineWidth(2)
           .stroke();
      };

      // Draw header on first page
      drawPageHeader();
      doc.y = 80;

      // Order Summary Box
      doc.rect(margin, doc.y, contentWidth, 60)
         .fillAndStroke(lightGray, borderColor);
      
      const summaryY = doc.y + 10;
      const col1 = margin + 15;
      const col2 = margin + contentWidth * 0.35;
      const col3 = margin + contentWidth * 0.65;
      
      doc.fontSize(9).fillColor(brandGray);
      doc.text('Status:', col1, summaryY);
      doc.text('Date:', col2, summaryY);
      doc.text('Total Items:', col3, summaryY);
      
      doc.fontSize(11).fillColor(brandBlack);
      doc.text(update.status.replace(/_/g, ' ').toUpperCase(), col1, summaryY + 14);
      doc.text(update.createdAt ? new Date(update.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      }) : 'N/A', col2, summaryY + 14);
      
      // Calculate total quantity
      let totalQty = 0;
      lineItemsData.forEach(item => {
        totalQty += (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
                   (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
                   (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0) + (item.xxxxl || 0);
      });
      doc.text(`${lineItemsData.length} items (${totalQty} units)`, col3, summaryY + 14);
      
      doc.y = summaryY + 60;

      // Line Items Section
      doc.fontSize(14)
         .fillColor(brandBlack)
         .text('LINE ITEMS', margin, doc.y);
      doc.moveDown(0.5);

      if (lineItemsData.length === 0) {
        doc.fontSize(10).fillColor(brandGray).text('No line items found');
      } else {
        // Process each line item
        for (let index = 0; index < lineItemsData.length; index++) {
          const item = lineItemsData[index];
          
          // Calculate required height for this item
          const itemHeight = 180; // Fixed height per item for consistency
          
          // Check if we need a new page
          if (doc.y + itemHeight > pageHeight - 60) {
            doc.addPage();
            drawPageHeader();
            doc.y = 80;
          }
          
          const itemStartY = doc.y;
          const imageSize = 140;
          const imageX = margin;
          const textX = margin + imageSize + 20;
          const textWidth = contentWidth - imageSize - 30;
          
          // Item container with border
          doc.rect(margin, itemStartY, contentWidth, itemHeight - 10)
             .strokeColor(borderColor)
             .lineWidth(1)
             .stroke();
          
          // Item number badge
          doc.circle(margin + 15, itemStartY + 15, 12)
             .fill(brandBlack);
          doc.fontSize(10)
             .fillColor('#ffffff')
             .text(`${index + 1}`, margin + 8, itemStartY + 10, { width: 14, align: 'center' });
          
          // Product Image (left side)
          let hasImage = false;
          if (item.imageUrl && imageCache.has(item.imageUrl)) {
            try {
              const imageBuffer = imageCache.get(item.imageUrl)!;
              doc.image(imageBuffer, imageX + 10, itemStartY + 30, {
                fit: [imageSize - 20, imageSize - 40],
                align: 'center',
                valign: 'center'
              });
              hasImage = true;
            } catch (imgErr) {
              console.error(`[PDF EXPORT] Error rendering image for item ${item.id}:`, imgErr);
            }
          }
          
          // Fallback "No Image" box
          if (!hasImage) {
            doc.rect(imageX + 10, itemStartY + 30, imageSize - 20, imageSize - 40)
               .strokeColor('#CCCCCC')
               .lineWidth(1)
               .stroke();
            
            doc.fontSize(10)
               .fillColor('#999999')
               .text('No Image', imageX + 10, itemStartY + 30 + (imageSize - 40) / 2 - 5, {
                 width: imageSize - 20,
                 align: 'center'
               });
          }
          
          // Product Details (right side)
          let currentY = itemStartY + 10;
          
          // Product Name
          doc.fontSize(14)
             .fillColor(brandBlack)
             .text(item.productName || 'N/A', textX, currentY, { width: textWidth });
          currentY = doc.y + 5;
          
          // Variant Info Row
          doc.fontSize(9).fillColor(brandGray);
          const variantInfo = [
            item.variantCode && `Code: ${item.variantCode}`,
            item.variantColor && `Color: ${item.variantColor}`,
          ].filter(Boolean).join(' | ');
          doc.text(variantInfo || 'No variant info', textX, currentY, { width: textWidth });
          currentY = doc.y + 8;
          
          // Manufacturer
          const assignedManufacturers = manufacturerMap.get(item.lineItemId) || [];
          doc.fontSize(10).fillColor(brandGray);
          doc.text('Manufacturer: ', textX, currentY, { continued: true });
          doc.fillColor(assignedManufacturers.length > 0 ? brandBlack : '#cc0000')
             .text(assignedManufacturers.length > 0 ? assignedManufacturers.join(', ') : 'NOT ASSIGNED');
          currentY = doc.y + 10;
          
          // Size Breakdown Table
          doc.fontSize(9).fillColor(brandGray).text('SIZE BREAKDOWN:', textX, currentY);
          currentY = doc.y + 5;
          
          // Build sizes array with values
          const sizeData = [
            { label: 'YXS', qty: item.yxs || 0 },
            { label: 'YS', qty: item.ys || 0 },
            { label: 'YM', qty: item.ym || 0 },
            { label: 'YL', qty: item.yl || 0 },
            { label: 'XS', qty: item.xs || 0 },
            { label: 'S', qty: item.s || 0 },
            { label: 'M', qty: item.m || 0 },
            { label: 'L', qty: item.l || 0 },
            { label: 'XL', qty: item.xl || 0 },
            { label: '2XL', qty: item.xxl || 0 },
            { label: '3XL', qty: item.xxxl || 0 },
            { label: '4XL', qty: item.xxxxl || 0 },
          ].filter(s => s.qty > 0);
          
          if (sizeData.length > 0) {
            // Draw size table
            const cellWidth = 35;
            const cellHeight = 28;
            const maxCols = Math.min(sizeData.length, 8);
            const tableWidth = cellWidth * maxCols;
            
            let tableX = textX;
            let tableY = currentY;
            let col = 0;
            
            sizeData.forEach((size, idx) => {
              if (col >= maxCols) {
                col = 0;
                tableY += cellHeight;
              }
              
              const cellX = tableX + (col * cellWidth);
              
              // Cell background
              doc.rect(cellX, tableY, cellWidth, cellHeight)
                 .fillAndStroke(lightGray, borderColor);
              
              // Size label
              doc.fontSize(8)
                 .fillColor(brandGray)
                 .text(size.label, cellX, tableY + 4, { width: cellWidth, align: 'center' });
              
              // Quantity
              doc.fontSize(12)
                 .fillColor(brandBlack)
                 .text(size.qty.toString(), cellX, tableY + 14, { width: cellWidth, align: 'center' });
              
              col++;
            });
            
            // Total quantity box - always show at end of sizes
            const totalItemQty = sizeData.reduce((sum, s) => sum + s.qty, 0);
            
            // If current row still has space, put total there; otherwise put on new row
            let totalX: number;
            let totalY: number;
            if (col < maxCols) {
              totalX = tableX + (col * cellWidth) + 5;
              totalY = tableY;
            } else {
              // Total box goes below on a new line
              totalX = tableX;
              totalY = tableY + cellHeight;
            }
            
            doc.rect(totalX, totalY, 50, cellHeight)
               .fillAndStroke('#1a1a2e', '#1a1a2e');
            
            doc.fontSize(8)
               .fillColor('#ffffff')
               .text('TOTAL', totalX, totalY + 4, { width: 50, align: 'center' });
            
            doc.fontSize(12)
               .fillColor('#ffffff')
               .text(totalItemQty.toString(), totalX, totalY + 14, { width: 50, align: 'center' });
            
            currentY = (col >= maxCols ? totalY : tableY) + cellHeight + 8;
          } else {
            doc.fontSize(10).fillColor('#999999').text('No sizes specified', textX, currentY);
            currentY = doc.y + 10;
          }
          
          // Descriptors
          if (item.descriptors && Array.isArray(item.descriptors) && item.descriptors.length > 0) {
            doc.fontSize(9).fillColor(brandGray).text('Notes:', textX, currentY);
            currentY = doc.y + 2;
            
            item.descriptors.slice(0, 3).forEach((descriptor: string) => {
              doc.fontSize(9)
                 .fillColor(brandBlack)
                 .text(`• ${descriptor}`, textX + 5, currentY, { width: textWidth - 10 });
              currentY = doc.y + 1;
            });
            
            if (item.descriptors.length > 3) {
              doc.fontSize(8)
                 .fillColor(brandGray)
                 .text(`+ ${item.descriptors.length - 3} more...`, textX + 5, currentY);
            }
          }
          
          // Move to next item
          doc.y = itemStartY + itemHeight;
        }
      }
      
      // Footer on all pages
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.moveTo(margin, pageHeight - 40)
           .lineTo(pageWidth - margin, pageHeight - 40)
           .strokeColor(borderColor)
           .lineWidth(0.5)
           .stroke();
        
        doc.fontSize(8)
           .fillColor(brandGray)
           .text(
             `Rich Habits Manufacturing Order | Generated ${new Date().toLocaleDateString('en-US')} | Page ${i + 1} of ${pageCount}`,
             margin,
             pageHeight - 30,
             { width: contentWidth, align: 'center' }
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
      
      // Generate filename
      const filename = `Manufacturing-Order-${order?.orderCode || updateId}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[PDF EXPORT] Error:", error);
      console.error("[PDF EXPORT] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Failed to generate PDF export", 
          error: error instanceof Error ? error.message : String(error)
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

  // ==================== FABRIC SUBMISSION ROUTES ====================

  app.get('/api/fabric-submissions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.manufacturingId) filters.manufacturingId = parseInt(req.query.manufacturingId as string);
      if (req.query.lineItemId) filters.lineItemId = parseInt(req.query.lineItemId as string);
      if (req.query.status) filters.status = req.query.status as string;

      const submissions = await storage.getFabricSubmissions(filters);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching fabric submissions:", error);
      res.status(500).json({ message: "Failed to fetch fabric submissions" });
    }
  });

  app.get('/api/fabric-submissions/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getFabricSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: "Fabric submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error fetching fabric submission:", error);
      res.status(500).json({ message: "Failed to fetch fabric submission" });
    }
  });

  app.post('/api/fabric-submissions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const submission = await storage.createFabricSubmission({
        ...req.body,
        submittedBy: user.id,
      });
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating fabric submission:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create fabric submission" });
    }
  });

  app.post('/api/fabric-submissions/:id/review', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const id = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      const submission = await storage.reviewFabricSubmission(id, user.id, status, reviewNotes);
      res.json(submission);
    } catch (error) {
      console.error("Error reviewing fabric submission:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to review fabric submission" });
    }
  });

  // ==================== PANTONE ASSIGNMENT ROUTES ====================

  app.get('/api/pantone-assignments', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.lineItemId) filters.lineItemId = parseInt(req.query.lineItemId as string);
      if (req.query.manufacturingUpdateId) filters.manufacturingUpdateId = parseInt(req.query.manufacturingUpdateId as string);

      const assignments = await storage.getPantoneAssignments(filters);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching pantone assignments:", error);
      res.status(500).json({ message: "Failed to fetch pantone assignments" });
    }
  });

  app.get('/api/pantone-assignments/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getPantoneAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Pantone assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching pantone assignment:", error);
      res.status(500).json({ message: "Failed to fetch pantone assignment" });
    }
  });

  app.post('/api/pantone-assignments', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const assignment = await storage.createPantoneAssignment({
        ...req.body,
        assignedBy: user.id,
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating pantone assignment:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create pantone assignment" });
    }
  });

  app.put('/api/pantone-assignments/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.updatePantoneAssignment(id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Error updating pantone assignment:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update pantone assignment" });
    }
  });

  app.delete('/api/pantone-assignments/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePantoneAssignment(id);
      res.json({ message: "Pantone assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting pantone assignment:", error);
      res.status(500).json({ message: "Failed to delete pantone assignment" });
    }
  });

  // ==================== FIRST PIECE APPROVAL ROUTES ====================

  // Upload first piece samples (manufacturer or admin only)
  app.post('/api/manufacturing/:id/first-piece/upload', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only manufacturer or admin can upload
      if (user.role !== 'manufacturer' && user.role !== 'admin') {
        return res.status(403).json({ message: "Only manufacturers or admins can upload first piece samples" });
      }

      const { imageUrls } = req.body;
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ message: "imageUrls array is required" });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const existingImages = existingRecord.firstPieceImageUrls || [];
      const updatedRecord = await db
        .update(manufacturing)
        .set({
          firstPieceImageUrls: [...existingImages, ...imageUrls],
          firstPieceStatus: 'awaiting_approval',
          firstPieceUploadedBy: user.id,
          firstPieceUploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(manufacturing.id, id))
        .returning();

      res.json(updatedRecord[0]);
    } catch (error) {
      console.error("Error uploading first piece samples:", error);
      res.status(500).json({ message: "Failed to upload first piece samples" });
    }
  });

  // Approve first piece (ops or admin only)
  app.post('/api/manufacturing/:id/first-piece/approve', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only ops or admin can approve
      if (user.role !== 'ops' && user.role !== 'admin') {
        return res.status(403).json({ message: "Only operations or admins can approve first piece samples" });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      if (existingRecord.firstPieceStatus !== 'awaiting_approval') {
        return res.status(400).json({ message: "First piece is not awaiting approval" });
      }

      const updatedRecord = await db
        .update(manufacturing)
        .set({
          firstPieceStatus: 'approved',
          firstPieceApprovedBy: user.id,
          firstPieceApprovedAt: new Date(),
          firstPieceRejectionNotes: null,
          updatedAt: new Date(),
        })
        .where(eq(manufacturing.id, id))
        .returning();

      res.json(updatedRecord[0]);
    } catch (error) {
      console.error("Error approving first piece:", error);
      res.status(500).json({ message: "Failed to approve first piece" });
    }
  });

  // Reject first piece (ops or admin only)
  app.post('/api/manufacturing/:id/first-piece/reject', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only ops or admin can reject
      if (user.role !== 'ops' && user.role !== 'admin') {
        return res.status(403).json({ message: "Only operations or admins can reject first piece samples" });
      }

      const { rejectionNotes } = req.body;
      if (!rejectionNotes || rejectionNotes.trim() === '') {
        return res.status(400).json({ message: "Rejection notes are required" });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      if (existingRecord.firstPieceStatus !== 'awaiting_approval') {
        return res.status(400).json({ message: "First piece is not awaiting approval" });
      }

      const updatedRecord = await db
        .update(manufacturing)
        .set({
          firstPieceStatus: 'rejected',
          firstPieceRejectionNotes: rejectionNotes,
          updatedAt: new Date(),
        })
        .where(eq(manufacturing.id, id))
        .returning();

      res.json(updatedRecord[0]);
    } catch (error) {
      console.error("Error rejecting first piece:", error);
      res.status(500).json({ message: "Failed to reject first piece" });
    }
  });

  // Reset first piece approval (ops or admin only)
  app.post('/api/manufacturing/:id/first-piece/reset', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only ops or admin can reset
      if (user.role !== 'ops' && user.role !== 'admin') {
        return res.status(403).json({ message: "Only operations or admins can reset first piece approval" });
      }

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const updatedRecord = await db
        .update(manufacturing)
        .set({
          firstPieceStatus: 'pending',
          firstPieceImageUrls: [],
          firstPieceUploadedBy: null,
          firstPieceUploadedAt: null,
          firstPieceApprovedBy: null,
          firstPieceApprovedAt: null,
          firstPieceRejectionNotes: null,
          updatedAt: new Date(),
        })
        .where(eq(manufacturing.id, id))
        .returning();

      res.json(updatedRecord[0]);
    } catch (error) {
      console.error("Error resetting first piece approval:", error);
      res.status(500).json({ message: "Failed to reset first piece approval" });
    }
  });
}