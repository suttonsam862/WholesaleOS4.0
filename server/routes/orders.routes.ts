import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import {
  insertOrderSchema,
  insertOrderLineItemSchema,
  orderLineItems
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  loadUserData,
  requirePermission,
  requirePermissionOr,
  type AuthenticatedRequest,
  type UserRole
} from "./shared/middleware";
import { isAuthenticated } from "./shared/middleware";
import { stripFinancialData } from "./shared/utils";
import { ObjectStorageService } from "../objectStorage";
import { cleanupLineItemName, type VariantInfo } from "../services/ai-name-cleanup.service";

export function registerOrdersRoutes(app: Express): void {
  // Bulk order reassignment (first occurrence - appears early in routes.ts)
  app.put('/api/orders/bulk-reassign', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const { orderIds, salespersonId } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs are required" });
      }

      let updatedCount = 0;
      for (const orderId of orderIds) {
        try {
          await storage.updateOrder(orderId, {
            salespersonId: salespersonId || null
          });
          updatedCount++;
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
        }
      }

      // Log activity for bulk operation
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        0, // Bulk operation
        'bulk_reassigned',
        { orderIds, previousSalesperson: 'various' },
        { orderIds, newSalesperson: salespersonId || 'unassigned', count: updatedCount }
      );

      res.json({
        message: `Successfully reassigned ${updatedCount} orders`,
        updated: updatedCount,
        total: orderIds.length
      });
    } catch (error) {
      console.error("Error in bulk reassignment:", error);
      res.status(500).json({ message: "Failed to reassign orders" });
    }
  });

  // Get all orders (with role-based filtering)
  app.get('/api/orders', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      let orders;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin' || user.role === 'ops') {
        // Admin and ops users see all orders
        orders = await storage.getOrders();
      } else if (user.role === 'sales') {
        // Sales users only see their own orders
        orders = await storage.getOrdersBySalesperson(user.id);
      } else {
        // Other roles see all orders (if they have read permission)
        orders = await storage.getOrders();
      }

      // Strip financial data for manufacturer role
      const filteredOrders = stripFinancialData(orders, user.role);
      res.json(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Create new order
  app.post('/api/orders', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    console.log('🔍 [DEBUG] POST /api/orders started');
    try {
      console.log('🔍 [DEBUG] Request body received:', JSON.stringify(req.body, null, 2));
      console.log('🔍 [DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));

      // Check if body is parsed correctly
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        console.error("Request body is not a valid object:", {
          body: req.body,
          type: typeof req.body,
          isArray: Array.isArray(req.body)
        });
        return res.status(400).json({
          message: "Request body must be a valid JSON object",
          receivedBody: req.body,
          bodyType: typeof req.body,
          isArray: Array.isArray(req.body)
        });
      }

      // Check if body has required properties
      if (!req.body.orderName || !req.body.orgId) {
        console.error("Missing required fields in request body");
        return res.status(400).json({
          message: "Missing required fields: orderName and orgId are required",
          receivedFields: Object.keys(req.body)
        });
      }

      // Separate line items from order data
      const { lineItems, ...orderData } = req.body;
      console.log('🔍 [DEBUG] Order data extracted:', JSON.stringify(orderData, null, 2));
      console.log('🔍 [DEBUG] Line items extracted:', JSON.stringify(lineItems, null, 2));

      // Validate required fields before schema validation
      if (!orderData.orderName) {
        return res.status(400).json({
          message: "Order name is required",
          field: "orderName"
        });
      }

      if (!orderData.orgId) {
        return res.status(400).json({
          message: "Organization ID is required",
          field: "orgId"
        });
      }

      // Ensure proper data types
      const processedOrderData = {
        ...orderData,
        orgId: Number(orderData.orgId),
        contactId: orderData.contactId ? Number(orderData.contactId) : null,
        salespersonId: orderData.salespersonId || null,
        priority: orderData.priority || "normal",
        estDelivery: orderData.estDelivery || null,
        notes: orderData.notes || null,
      };

      // Sales users can only create orders for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        processedOrderData.salespersonId = (req as AuthenticatedRequest).user.userData!.id;
      }

      const validatedOrder = insertOrderSchema.parse(processedOrderData);
      console.log('🔍 [DEBUG] ✅ Order schema validation passed!');

      // If line items are provided, validate and create order with line items
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        console.log('🔍 [DEBUG] Processing line items...');

        // Validate each line item
        const validatedLineItems = lineItems.map((item: any, index: number) => {
          console.log(`🔍 [DEBUG] Processing line item ${index}:`, JSON.stringify(item, null, 2));

          // Ensure all size fields have default values and are numbers
          const lineItemData = {
            variantId: Number(item.variantId),
            itemName: item.itemName || null,
            colorNotes: item.colorNotes || null,
            yxs: Number(item.yxs) || 0,
            ys: Number(item.ys) || 0,
            ym: Number(item.ym) || 0,
            yl: Number(item.yl) || 0,
            xs: Number(item.xs) || 0,
            s: Number(item.s) || 0,
            m: Number(item.m) || 0,
            l: Number(item.l) || 0,
            xl: Number(item.xl) || 0,
            xxl: Number(item.xxl) || 0,
            xxxl: Number(item.xxxl) || 0,
            unitPrice: String(item.unitPrice),
            notes: item.notes || null,
          };

          console.log(`🔍 [DEBUG] Processed line item ${index}:`, JSON.stringify(lineItemData, null, 2));

          try {
            const validated = insertOrderLineItemSchema.parse(lineItemData);
            console.log(`🔍 [DEBUG] ✅ Line item ${index} validation passed`);
            return validated;
          } catch (validationError) {
            console.error(`🔍 [DEBUG] ❌ Line item ${index} validation failed:`, validationError);
            throw validationError;
          }
        });

        console.log('🔍 [DEBUG] All line items validated successfully');
        console.log('🔍 [DEBUG] Creating order with line items...');

        const orderWithLineItems = await storage.createOrderWithLineItems(
          validatedOrder,
          validatedLineItems
        );

        console.log('🔍 [DEBUG] Order with line items created successfully:', orderWithLineItems.id);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'order',
          orderWithLineItems.id,
          'created',
          null,
          orderWithLineItems
        );

        res.status(201).json(orderWithLineItems);
      } else {
        console.log('🔍 [DEBUG] Creating order without line items...');

        // Create order without line items
        const order = await storage.createOrder(validatedOrder);

        console.log('🔍 [DEBUG] Order created successfully:', order.id);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'order',
          order.id,
          'created',
          null,
          order
        );

        res.status(201).json(order);
      }
    } catch (error) {
      console.log("=== ORDER CREATION ERROR ===");
      if (error instanceof z.ZodError) {
        console.error("Validation failed for order creation:");
        console.error("- Validation errors:", JSON.stringify(error.errors, null, 2));
        console.error("- Original request body:", JSON.stringify(req.body, null, 2));
        console.error("- Request headers:", JSON.stringify(req.headers, null, 2));
        return res.status(400).json({
          message: "Invalid data",
          errors: error.errors,
          debug: {
            originalBody: req.body,
            bodyType: typeof req.body,
            bodyKeys: Object.keys(req.body || {})
          }
        });
      }
      console.error("Error creating order:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error code:", (error as any)?.code);
      console.log("=== ORDER CREATION ERROR END ===");

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({
          message: "Invalid reference",
          details: "One of the referenced items (organization, salesperson, or variant) does not exist.",
        });
      }

      res.status(500).json({
        message: "Failed to create order",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Duplicate order structure endpoint (copies everything except quantities)
  app.post('/api/orders/:id/duplicate-structure', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const originalOrder = await storage.getOrderWithLineItems(orderId);
      
      if (!originalOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Prepare order data with certain fields reset
      const newOrderData = {
        orderName: `${originalOrder.orderName} (Structure Copy)`,
        orgId: originalOrder.orgId,
        leadId: originalOrder.leadId,
        salespersonId: originalOrder.salespersonId,
        priority: originalOrder.priority,
        estDelivery: originalOrder.estDelivery,
        // Reset workflow-related fields
        status: 'new' as const,
        designApproved: false,
        sizesValidated: false,
        depositReceived: false,
        // Reset invoice/folder references
        invoiceUrl: null,
        orderFolder: null,
        sizeFormLink: null,
        trackingNumber: null,
      };

      // Prepare line items with quantities set to 0
      const newLineItems = originalOrder.lineItems?.map((item: any) => ({
        variantId: item.variantId,
        itemName: item.itemName,
        colorNotes: item.colorNotes,
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
        unitPrice: item.unitPrice,
        notes: item.notes,
      })) || [];

      // Create the new order with line items
      const newOrder = await storage.createOrderWithLineItems(
        newOrderData,
        newLineItems
      );

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        newOrder.id,
        'created',
        null,
        {
          ...newOrder,
          note: `Structure duplicated from order ${originalOrder.orderCode}`,
        }
      );

      res.json(newOrder);
    } catch (error) {
      console.error("Error duplicating order structure:", error);
      res.status(500).json({ 
        message: "Failed to duplicate order structure",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get single order with line items
  app.get('/api/orders/:id', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const order = await storage.getOrderWithLineItems(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can view this order
      const user = (req as AuthenticatedRequest).user.userData!;
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Strip financial data for manufacturer role
      const filteredOrder = stripFinancialData(order, userRole);
      res.json(filteredOrder);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get order line items with manufacturer assignments
  // Allow access for users with orders.read OR manufacturing.read permissions
  app.get('/api/orders/:id/line-items-with-manufacturers', isAuthenticated, loadUserData, requirePermissionOr(
    { resource: 'orders', permission: 'read' },
    { resource: 'manufacturing', permission: 'read' }
  ), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can view this order
      const user = (req as AuthenticatedRequest).user.userData!;
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const lineItemsWithManufacturers = await storage.getOrderLineItemsWithManufacturers(id);

      // Strip financial data for manufacturer role
      const filteredLineItems = stripFinancialData(lineItemsWithManufacturers, userRole);
      res.json(filteredLineItems);
    } catch (error) {
      console.error("Error fetching line items with manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch line items" });
    }
  });

  // Get order line items (simple - without manufacturer data)
  app.get('/api/orders/:id/line-items', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user can view this order
      const user = (req as AuthenticatedRequest).user.userData!;
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const lineItems = await storage.getOrderLineItems(orderId);
      
      // Strip financial data for manufacturer role
      const filteredLineItems = stripFinancialData(lineItems, userRole);
      res.json(filteredLineItems);
    } catch (error) {
      console.error("Error fetching line items:", error);
      res.status(500).json({ message: "Failed to fetch line items" });
    }
  });

  // Update order
  app.put('/api/orders/:id', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      const validatedData = insertOrderSchema.partial().parse(req.body);

      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Simplified status transition validation
      if (validatedData.status === 'production' && existingOrder.status !== 'production') {
        // Check if order has line items (basic validation only)
        const lineItems = await storage.getOrderLineItems(id);
        if (!lineItems || lineItems.length === 0) {
          // Just warn, don't block the transition
          console.warn(`Order ${id} moving to production without line items`);
        }

        // Auto-create manufacturing record if moving to production for first time
        try {
          const existingMfg = await storage.getManufacturingByOrder(id);
          if (!existingMfg) {
            // Create manufacturing record automatically
            await storage.createManufacturing({
              orderId: id,
              status: 'awaiting_admin_confirmation',
              productionNotes: 'Auto-created when order moved to production',
            });
            console.log(`[OrderProduction] Created manufacturing record for order ${id}`);
          }
        } catch (mfgError) {
          // Log but don't fail the order update
          console.error(`[OrderProduction] Failed to create manufacturing record for order ${id}:`, mfgError);
        }
      }

      // Check if user can update this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && existingOrder.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate sizes are filled before moving to invoiced status (warn but don't block)
      if (validatedData.status === 'invoiced' && existingOrder.status === 'waiting_sizes') {
        const orderWithLineItems = await storage.getOrderWithLineItems(id);

        if (!orderWithLineItems || !orderWithLineItems.lineItems || orderWithLineItems.lineItems.length === 0) {
          console.warn(`Order ${id} moving to invoiced status without line items`);
        } else {
          // Check if all line items have at least one size filled
          const hasEmptyLineItems = orderWithLineItems.lineItems.some((item: any) => {
            const totalQty = (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
                            (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
                            (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0);
            return totalQty === 0;
          });

          if (hasEmptyLineItems) {
            console.warn(`Order ${id} moving to invoiced status with some line items missing sizes`);
          }
        }
      }

      // Simplified: No automatic invoice creation - users can create invoices manually when needed
      let autoActionWarnings: string[] = [];
      if (validatedData.status === 'invoiced' && existingOrder.status !== 'invoiced') {
        console.log(`[OrderInvoiced] Order ${id} moved to invoiced status`);
        // Invoice creation is now manual via Finance section
      }

      // Simplified auto-action when moving to production status - only create manufacturing record
      if (validatedData.status === 'production' && existingOrder.status !== 'production') {
        // The basic validation and manufacturing record creation is already handled above
        // No complex cascading actions needed
        console.log(`[OrderProduction] Order ${id} moved to production status`);
      }

      // Clean up empty string date fields before saving
      const cleanedData = {
        ...validatedData,
        estDelivery: validatedData.estDelivery === '' ? null : validatedData.estDelivery,
      };

      const updatedOrder = await storage.updateOrder(id, cleanedData);
      
      // Handle case where order was not found (storage returns null)
      if (!updatedOrder) {
        console.error(`[OrderUpdate] Order ${id} not found during update`);
        return res.status(404).json({ message: `Order with id ${id} not found` });
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        id,
        'updated',
        existingOrder,
        updatedOrder
      );

      // Include warnings in response if any auto-actions failed
      if (autoActionWarnings.length > 0) {
        return res.json({
          ...updatedOrder,
          warnings: autoActionWarnings,
          message: 'Order updated successfully, but some auto-actions failed'
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[OrderUpdate] Validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      
      console.error("[OrderUpdate] Error updating order:", {
        orderId: req.params.id,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        fields: Object.keys(req.body || {})
      });
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update order";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Delete order
  app.delete('/api/orders/:id', isAuthenticated, loadUserData, requirePermission('orders', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      await storage.deleteOrder(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        id,
        'deleted',
        existingOrder,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Add line item to order
  app.post('/api/orders/:orderId/line-items', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Validate orderId
      if (!orderId || isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Validate required fields
      if (!req.body.variantId) {
        return res.status(400).json({ message: "Variant ID is required" });
      }

      // Build line item data - explicitly set orderId from URL params, ignore any from body
      const { orderId: _ignored, ...bodyData } = req.body;
      const lineItemData = {
        ...bodyData,
        orderId: orderId, // Always use the orderId from the URL parameter
      };

      // Normalize image URL if present
      if (lineItemData.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        lineItemData.imageUrl = objectStorageService.normalizeObjectEntityPath(lineItemData.imageUrl);
      }

      const lineItem = await storage.createOrderLineItem(lineItemData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        lineItem.id,
        'created',
        null,
        lineItem
      );

      res.status(201).json(lineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in order line item");
        if (errorObj?.constraint?.includes('variant')) {
          return res.status(400).json({
            message: "Invalid variant",
            details: "The selected variant does not exist or has been deleted.",
            field: "variantId"
          });
        }
        return res.status(400).json({
          message: "Invalid reference",
          details: "One of the referenced items does not exist.",
        });
      }

      res.status(500).json({
        message: "Failed to add line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH endpoint to update order line item directly by ID (used for quick updates like itemName)
  app.patch('/api/order-line-items/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      
      // Normalize image URL BEFORE validation if present
      const dataToValidate = { ...req.body };
      if (dataToValidate.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        dataToValidate.imageUrl = objectStorageService.normalizeObjectEntityPath(dataToValidate.imageUrl);
      }
      
      const validatedData = insertOrderLineItemSchema.partial().parse(dataToValidate);

      // Get the line item to find its order
      const [lineItem] = await db
        .select()
        .from(orderLineItems)
        .where(eq(orderLineItems.id, itemId))
        .limit(1);
        
      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }

      // Get the order to check permissions
      const order = await storage.getOrder(lineItem.orderId);
      if (!order) {
        return res.status(404).json({ message: "Associated order not found" });
      }

      // Check if user can modify this order based on role
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedLineItem = await storage.updateOrderLineItem(itemId, validatedData);

      // Log activity
      await storage.logActivity(
        user.id,
        'order_line_item',
        itemId,
        'updated',
        lineItem,
        updatedLineItem
      );

      res.json(updatedLineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating line item:", error);
      res.status(500).json({
        message: "Failed to update line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update line item
  app.put('/api/orders/:id/line-items/:itemId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);
      
      // Normalize image URL BEFORE validation
      const dataToValidate = { ...req.body };
      if (dataToValidate.imageUrl) {
        const objectStorageService = new ObjectStorageService();
        dataToValidate.imageUrl = objectStorageService.normalizeObjectEntityPath(dataToValidate.imageUrl);
      }
      
      const validatedData = insertOrderLineItemSchema.partial().parse(dataToValidate);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedLineItem = await storage.updateOrderLineItem(itemId, validatedData);

      // Sync itemName to manufacturing update line items if it was updated
      if (validatedData.itemName !== undefined) {
        try {
          // Find all manufacturing update line items for this order line item
          const manufacturingLineItems = await storage.getManufacturingUpdateLineItemsByOrderLineItemId(itemId);
          
          // Update each manufacturing line item with the new itemName
          for (const mfgLineItem of manufacturingLineItems) {
            await storage.updateManufacturingUpdateLineItem(mfgLineItem.id, {
              productName: validatedData.itemName,
            });
          }
        } catch (error) {
          console.error("Error syncing itemName to manufacturing updates:", error);
          // Don't fail the request if sync fails, just log it
        }
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        itemId,
        'updated',
        null,
        updatedLineItem
      );

      res.json(updatedLineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in order line item");
        if (errorObj?.constraint?.includes('variant')) {
          return res.status(400).json({
            message: "Invalid variant",
            details: "The selected variant does not exist or has been deleted.",
            field: "variantId"
          });
        }
        return res.status(400).json({
          message: "Invalid reference",
          details: "One of the referenced items does not exist.",
        });
      }

      res.status(500).json({
        message: "Failed to update line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete line item
  app.delete('/api/orders/:id/line-items/:itemId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteOrderLineItem(itemId);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        itemId,
        'deleted',
        null,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting line item:", error);
      res.status(500).json({ message: "Failed to delete line item" });
    }
  });

  // AI-powered line item name cleanup
  app.post('/api/orders/:id/line-items/:itemId/ai-cleanup-name', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the line item with variant info
      const lineItems = await storage.getOrderLineItemsWithVariants(orderId);
      const lineItem = lineItems.find(item => item.id === itemId);
      
      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }

      // Get organization name
      const organization = order.orgId ? await storage.getOrganization(order.orgId) : null;
      const orgName = organization?.name || "Custom";

      // Build variant info for better AI context
      const variantInfo: VariantInfo | undefined = lineItem.variant ? {
        productName: lineItem.variant.productId ? 
          (await storage.getProduct(lineItem.variant.productId))?.name : undefined,
        variantName: undefined, // product_variants table doesn't have variantName column
        variantCode: lineItem.variant.variantCode || undefined,
        color: lineItem.variant.color || undefined,
      } : undefined;

      // Use AI to clean up the name
      const cleanedName = await cleanupLineItemName(lineItem.itemName || "", orgName, variantInfo);

      // Update the line item with the cleaned name
      const updatedLineItem = await storage.updateOrderLineItem(itemId, { itemName: cleanedName });

      // Sync to manufacturing update line items
      try {
        const manufacturingLineItems = await storage.getManufacturingUpdateLineItemsByOrderLineItemId(itemId);
        for (const mfgLineItem of manufacturingLineItems) {
          await storage.updateManufacturingUpdateLineItem(mfgLineItem.id, {
            productName: cleanedName,
          });
        }
      } catch (error) {
        console.error("Error syncing AI-cleaned itemName to manufacturing updates:", error);
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        itemId,
        'ai_name_cleanup',
        { originalName: lineItem.itemName },
        { cleanedName }
      );

      res.json({
        success: true,
        originalName: lineItem.itemName,
        cleanedName,
        lineItem: updatedLineItem,
      });
    } catch (error) {
      console.error("Error in AI name cleanup:", error);
      res.status(500).json({ 
        message: "Failed to cleanup line item name",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Bulk AI cleanup for all line items in an order
  app.post('/api/orders/:id/ai-cleanup-names', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get organization name
      const organization = order.orgId ? await storage.getOrganization(order.orgId) : null;
      const orgName = organization?.name || "Custom";

      // Get all line items with variant info for this order
      const lineItems = await storage.getOrderLineItemsWithVariants(orderId);
      
      if (lineItems.length === 0) {
        return res.status(400).json({ message: "No line items to cleanup" });
      }

      const results: Array<{ id: number; originalName: string; cleanedName: string }> = [];

      // Process each line item
      for (const lineItem of lineItems) {
        // Build variant info for better AI context
        let variantInfo: VariantInfo | undefined;
        if (lineItem.variant) {
          const product = lineItem.variant.productId ? 
            await storage.getProduct(lineItem.variant.productId) : null;
          variantInfo = {
            productName: product?.name || undefined,
            variantName: undefined, // product_variants table doesn't have variantName column
            variantCode: lineItem.variant.variantCode || undefined,
            color: lineItem.variant.color || undefined,
          };
        }

        const cleanedName = await cleanupLineItemName(lineItem.itemName || "", orgName, variantInfo);
        
        if (cleanedName !== (lineItem.itemName || "")) {
          await storage.updateOrderLineItem(lineItem.id, { itemName: cleanedName });
          
          // Sync to manufacturing updates
          try {
            const manufacturingLineItems = await storage.getManufacturingUpdateLineItemsByOrderLineItemId(lineItem.id);
            for (const mfgLineItem of manufacturingLineItems) {
              await storage.updateManufacturingUpdateLineItem(mfgLineItem.id, {
                productName: cleanedName,
              });
            }
          } catch (error) {
            console.error("Error syncing AI-cleaned itemName to manufacturing updates:", error);
          }

          results.push({
            id: lineItem.id,
            originalName: lineItem.itemName || "",
            cleanedName,
          });
        }
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        orderId,
        'bulk_ai_name_cleanup',
        { itemCount: lineItems.length },
        { cleanedCount: results.length, results }
      );

      res.json({
        success: true,
        totalItems: lineItems.length,
        cleanedItems: results.length,
        results,
      });
    } catch (error) {
      console.error("Error in bulk AI name cleanup:", error);
      res.status(500).json({ 
        message: "Failed to cleanup line item names",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Order-specific activity endpoint
  app.get('/api/orders/:id/activity', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      // Verify order exists and user has access
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can view this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get order-specific activity (filtering by order ID and related entities)
      const activity = await storage.getOrderActivity(orderId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching order activity:", error);
      res.status(500).json({ message: "Failed to fetch order activity" });
    }
  });

  // Bulk reassign orders to different salespeople (admin only) - Second occurrence
  app.put('/api/orders/bulk-reassign', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;

      // Only admins can perform bulk reassignments
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied: Only administrators can reassign orders" });
      }

      const { orderIds, salespersonId } = req.body;

      // Validate input
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs array is required and must not be empty" });
      }

      // Allow null/empty salespersonId for unassigning orders
      if (salespersonId !== null && salespersonId !== '' && typeof salespersonId !== 'string') {
        return res.status(400).json({ message: "Target salesperson ID must be a string or null" });
      }

      // Verify target salesperson exists and has sales role (only if not null/empty)
      if (salespersonId && salespersonId !== '') {
        const targetSalesperson = await storage.getUser(salespersonId);
        if (!targetSalesperson) {
          return res.status(404).json({ message: "Target salesperson not found" });
        }

        if (targetSalesperson.role !== 'sales') {
          return res.status(400).json({ message: "Target user must have sales role" });
        }
      }

      // Process each order
      const results = [];
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;

      for (const orderId of orderIds) {
        try {
          const orderIdNum = parseInt(orderId);

          // Get existing order
          const existingOrder = await storage.getOrder(orderIdNum);
          if (!existingOrder) {
            results.push({ orderId, success: false, error: "Order not found" });
            continue;
          }

          // Update the order with new salesperson
          const updatedOrder = await storage.updateOrder(orderIdNum, {
            salespersonId: salespersonId
          });

          // Log activity
          await storage.logActivity(
            currentUserId,
            'order',
            orderIdNum,
            'reassigned',
            existingOrder,
            updatedOrder
          );

          results.push({ orderId, success: true, order: updatedOrder });
        } catch (error) {
          console.error(`Error reassigning order ${orderId}:`, error);
          results.push({
            orderId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      res.json({
        message: `Reassignment completed: ${successCount} successful, ${failCount} failed`,
        results,
        successCount,
        failCount
      });

    } catch (error) {
      console.error("Error in bulk reassignment:", error);
      res.status(500).json({ message: "Failed to perform bulk reassignment" });
    }
  });

  // Order notes endpoint
  app.post('/api/orders/:id/notes', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { note } = req.body;

      if (!note || !note.trim()) {
        return res.status(400).json({ message: "Note content is required" });
      }

      // Verify order exists and user has access
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Log the note as an activity entry
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        orderId,
        'note_added',
        null,
        { note: note.trim() }
      );

      res.status(201).json({
        success: true,
        message: "Note added successfully"
      });
    } catch (error) {
      console.error("Error adding order note:", error);
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // Get order line item manufacturers (manufacturing-related but accessed via /api/orders)
  app.get('/api/orders/:orderId/line-item-manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const assignments = await storage.getLineItemManufacturersByOrder(orderId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching order line item manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch order line item manufacturers" });
    }
  });

  // =====================================================
  // PUBLIC ORDER FORM ENDPOINTS (No authentication required)
  // =====================================================

  // PUBLIC: Get order data for customer form (no auth required)
  app.get('/api/public/orders/:orderId/form-data', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const formData = await storage.getOrderForPublicForm(orderId);
      if (!formData || !formData.order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get tracking numbers for this order
      const trackingNumbers = await storage.getOrderTrackingNumbers(orderId);
      
      // Only expose safe fields - no financial data, internal notes, etc.
      const safeOrder = {
        id: formData.order.id,
        orderCode: formData.order.orderCode,
        orderName: formData.order.orderName,
        status: formData.order.status,
        estDelivery: formData.order.estDelivery,
        contactName: formData.order.contactName,
        contactEmail: formData.order.contactEmail,
        contactPhone: formData.order.contactPhone,
        shippingAddress: formData.order.shippingAddress,
        billToAddress: formData.order.billToAddress,
      };
      
      // Safe tracking info for customers (just tracking number and carrier)
      const safeTrackingNumbers = trackingNumbers.map(t => ({
        id: t.id,
        trackingNumber: t.trackingNumber,
        carrierCompany: t.carrierCompany,
        createdAt: t.createdAt,
      }));

      const safeOrganization = formData.organization ? {
        id: formData.organization.id,
        name: formData.organization.name,
        logoUrl: formData.organization.logoUrl,
      } : null;

      const safeLineItems = formData.lineItems.map(item => ({
        id: item.id,
        orderId: item.orderId,
        variantId: item.variantId,
        itemName: item.itemName,
        colorNotes: item.colorNotes,
        imageUrl: item.imageUrl,
        yxs: item.yxs || 0,
        ys: item.ys || 0,
        ym: item.ym || 0,
        yl: item.yl || 0,
        xs: item.xs || 0,
        s: item.s || 0,
        m: item.m || 0,
        l: item.l || 0,
        xl: item.xl || 0,
        xxl: item.xxl || 0,
        xxxl: item.xxxl || 0,
        xxxxl: item.xxxxl || 0,
        qtyTotal: item.qtyTotal,
        notes: item.notes,
        productName: item.product?.name,
        variantCode: item.variant?.variantCode,
        variantColor: item.variant?.color,
      }));

      res.json({
        order: safeOrder,
        organization: safeOrganization,
        lineItems: safeLineItems,
        trackingNumbers: safeTrackingNumbers,
      });
    } catch (error) {
      console.error("Error fetching public order form data:", error);
      res.status(500).json({ message: "Failed to fetch order data" });
    }
  });

  // PUBLIC: Generate and download a quote PDF for an order (no auth required)
  app.get('/api/public/orders/:orderId/quote', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Fetch order with line items
      const order = await storage.getOrderWithLineItems(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Fetch organization info
      const organization = order.orgId ? await storage.getOrganization(order.orgId) : null;

      // Calculate subtotal from line items (no tax, no discount)
      let subtotal = 0;
      const lineItemsForQuote = (order.lineItems || []).map((item: any) => {
        const quantity = (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
                         (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
                         (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0) + (item.xxxxl || 0);
        const unitPrice = parseFloat(item.unitPrice || '0');
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;
        return {
          variantId: item.variantId,
          itemName: item.itemName || 'Line Item',
          description: item.notes || '',
          quantity,
          unitPrice: unitPrice.toFixed(2),
        };
      });

      // Generate quote code for this PDF (not persisted to database)
      const quoteCode = `Q-${order.orderCode}`;

      // Generate PDF using jsPDF - no database write, just stream the PDF
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [25, 48, 91];
      const lightGray: [number, number, number] = [245, 245, 245];
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = margin;

      // Header - "QUOTE" title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.setTextColor(...primaryColor);
      doc.text('QUOTE', margin, yPosition + 15);

      // Company name on right
      doc.setFontSize(16);
      doc.text('Rich Habits LLC', pageWidth - margin, yPosition + 10, { align: 'right' });
      yPosition += 25;

      // Company address
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Developing Habits LLC', margin, yPosition);
      yPosition += 5;
      doc.text('3101 Whitehall Rd', margin, yPosition);
      yPosition += 5;
      doc.text('Birmingham, AL 35209', margin, yPosition);
      yPosition += 15;

      // Quote Info Section
      const colWidth = (pageWidth - 2 * margin) / 3;
      const col1X = margin;
      const col3X = margin + 2 * colWidth;
      const sectionStartY = yPosition;

      // BILL TO
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('BILL TO:', col1X, yPosition);
      
      let billToY = yPosition + 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      if (organization) {
        doc.text(organization.name || 'N/A', col1X, billToY);
        billToY += 4;
        if (organization.city || organization.state) {
          const location = [organization.city, organization.state].filter(Boolean).join(', ');
          doc.text(location, col1X, billToY);
        }
      } else {
        doc.text('N/A', col1X, billToY);
      }

      // Quote Info column
      let quoteInfoY = sectionStartY;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('QUOTE #:', col3X, quoteInfoY);
      quoteInfoY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(quoteCode, col3X + 25, quoteInfoY - 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('DATE:', col3X, quoteInfoY);
      quoteInfoY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const quoteDate = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      doc.text(quoteDate, col3X + 25, quoteInfoY - 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('ORDER REF:', col3X, quoteInfoY);
      quoteInfoY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(order.orderCode, col3X + 25, quoteInfoY - 5);

      yPosition = Math.max(billToY + 10, quoteInfoY + 5);

      // Line Items Table
      if (lineItemsForQuote.length > 0) {
        const tableData = lineItemsForQuote.map((item) => {
          const qty = item.quantity.toString();
          const description = item.itemName || 'Item';
          const unitPrice = `$${parseFloat(item.unitPrice).toFixed(2)}`;
          const amount = `$${(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}`;
          return [qty, description, unitPrice, amount];
        });

        (doc as any).autoTable({
          startY: yPosition,
          head: [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'AMOUNT']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left',
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [60, 60, 60],
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 20 },
            1: { halign: 'left', cellWidth: 'auto' },
            2: { halign: 'right', cellWidth: 35 },
            3: { halign: 'right', cellWidth: 35 },
          },
          alternateRowStyles: {
            fillColor: lightGray,
          },
          margin: { left: margin, right: margin },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Totals Section - simplified (no tax, no discount)
      const totalsX = pageWidth - margin - 60;
      const labelsX = totalsX - 40;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);

      // Subtotal
      doc.text('Subtotal:', labelsX, yPosition, { align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
      yPosition += 8;

      // Total (same as subtotal - no tax, no discount)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('TOTAL:', labelsX, yPosition, { align: 'right' });
      doc.text(`$${subtotal.toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
      yPosition += 15;

      // Thank you message
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for your business!', margin, yPosition);

      // Generate PDF buffer
      const pdfBuffer = doc.output('arraybuffer');

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quote-${quoteCode}.pdf"`);
      res.send(Buffer.from(pdfBuffer));

      console.log(`[PUBLIC QUOTE PDF] Generated quote ${quoteCode} for order ${order.orderCode}`);
    } catch (error) {
      console.error("Error generating public order quote:", error);
      res.status(500).json({ message: "Failed to generate quote" });
    }
  });

  // PUBLIC: Submit customer order form (no auth required)
  app.post('/api/public/orders/:orderId/submit-form', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { 
        contactInfo, 
        shippingAddress, 
        billingAddress, 
        additionalInfo,
        uploadedFiles,
        lineItemSizes
      } = req.body;

      // Validate required fields
      if (!contactInfo?.name || !contactInfo?.email) {
        return res.status(400).json({ message: "Contact name and email are required" });
      }

      // Match or create organization if organization name is provided
      let matchedOrgId = order.orgId;
      const orgName = additionalInfo?.organizationName || shippingAddress?.name;
      
      if (orgName && !matchedOrgId) {
        // Try to find existing organization by name
        const existingOrg = await storage.findOrganizationByName(orgName);
        
        if (existingOrg) {
          matchedOrgId = existingOrg.id;
        } else {
          // Create new organization with shipping address info
          const newOrg = await storage.createOrganization({
            name: orgName,
            city: shippingAddress?.city || null,
            state: shippingAddress?.state || null,
            shippingAddress: shippingAddress?.address 
              ? `${shippingAddress.address}, ${shippingAddress.city || ''} ${shippingAddress.state || ''} ${shippingAddress.zip || ''}`.trim()
              : null,
          });
          matchedOrgId = newOrg.id;
        }
      }

      // Match or create contact
      let matchedContactId: number | null = null;
      
      // First try to find by email (most reliable match)
      const existingContact = await storage.findContactByEmail(contactInfo.email);
      
      if (existingContact) {
        matchedContactId = existingContact.id;
        
        // Update contact with latest info if needed (phone, org association)
        if (contactInfo.phone || (matchedOrgId && !existingContact.orgId)) {
          await storage.updateContact(existingContact.id, {
            phone: contactInfo.phone || existingContact.phone,
            orgId: matchedOrgId || existingContact.orgId,
          });
        }
      } else if (matchedOrgId) {
        // If no email match, try to find by name within the organization
        const contactByName = await storage.findContactByNameAndOrg(contactInfo.name, matchedOrgId);
        
        if (contactByName) {
          matchedContactId = contactByName.id;
          // Update with email if not set
          if (!contactByName.email) {
            await storage.updateContact(contactByName.id, {
              email: contactInfo.email,
              phone: contactInfo.phone || contactByName.phone,
            });
          }
        }
      }
      
      // Create new contact if no match found
      if (!matchedContactId) {
        const newContact = await storage.createContact({
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone || null,
          orgId: matchedOrgId || null,
          role: 'customer',
          isPrimary: !matchedOrgId, // Make primary if org is new or no org
        });
        matchedContactId = newContact.id;
      }

      // Build shipping address string for order
      const fullShippingAddress = shippingAddress?.address
        ? [
            shippingAddress.name,
            shippingAddress.address,
            `${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}`.trim(),
            shippingAddress.country || 'USA'
          ].filter(Boolean).join('\n')
        : null;

      // Build billing address string for order
      const fullBillingAddress = billingAddress?.address
        ? [
            billingAddress.name,
            billingAddress.address,
            `${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.zip || ''}`.trim(),
            billingAddress.country || 'USA'
          ].filter(Boolean).join('\n')
        : null;

      // Update order with matched/created organization, contact, and address info
      await storage.updateOrder(orderId, {
        orgId: matchedOrgId || order.orgId,
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone || null,
        shippingAddress: fullShippingAddress || order.shippingAddress,
        billToAddress: fullBillingAddress || order.billToAddress,
      });

      // Create form submission with organization name stored
      const submission = await storage.createOrderFormSubmission({
        orderId,
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone || null,
        shippingName: shippingAddress?.name || null,
        shippingAddress: shippingAddress?.address || null,
        shippingCity: shippingAddress?.city || null,
        shippingState: shippingAddress?.state || null,
        shippingZip: shippingAddress?.zip || null,
        shippingCountry: shippingAddress?.country || 'USA',
        billingName: billingAddress?.name || null,
        billingAddress: billingAddress?.address || null,
        billingCity: billingAddress?.city || null,
        billingState: billingAddress?.state || null,
        billingZip: billingAddress?.zip || null,
        billingCountry: billingAddress?.country || 'USA',
        organizationName: orgName || null,
        specialInstructions: additionalInfo?.notes || null,
        uploadedFiles: uploadedFiles ? Object.entries(uploadedFiles).map(([key, value]: [string, any]) => ({
          fileName: key,
          fileUrl: String(value),
          fileType: key,
          uploadedAt: new Date().toISOString(),
        })) : undefined,
        status: 'submitted',
      });

      // Save line item sizes if provided
      if (lineItemSizes && Array.isArray(lineItemSizes)) {
        const sizeItems = lineItemSizes.map((item: any) => ({
          submissionId: submission.id,
          lineItemId: item.lineItemId,
          yxs: item.yxs || 0,
          ys: item.ys || 0,
          ym: item.ym || 0,
          yl: item.yl || 0,
          xs: item.xs || 0,
          s: item.s || 0,
          m: item.m || 0,
          l: item.l || 0,
          xl: item.xl || 0,
          xxl: item.xxl || 0,
          xxxl: item.xxxl || 0,
          xxxxl: item.xxxxl || 0,
        }));
        await storage.bulkCreateOrderFormLineItemSizes(sizeItems);

        // Also update the actual order line items with the new sizes
        // Note: qtyTotal is a generated column, so we only update the individual size fields
        // Coerce all values to numbers to handle string inputs from frontend
        for (const item of lineItemSizes) {
          if (item.lineItemId) {
            await storage.updateOrderLineItem(item.lineItemId, {
              yxs: Number(item.yxs) || 0,
              ys: Number(item.ys) || 0,
              ym: Number(item.ym) || 0,
              yl: Number(item.yl) || 0,
              xs: Number(item.xs) || 0,
              s: Number(item.s) || 0,
              m: Number(item.m) || 0,
              l: Number(item.l) || 0,
              xl: Number(item.xl) || 0,
              xxl: Number(item.xxl) || 0,
              xxxl: Number(item.xxxl) || 0,
              xxxxl: Number(item.xxxxl) || 0,
            });
          }
        }
      }

      res.status(201).json({ 
        success: true,
        submissionId: submission.id,
        organizationId: matchedOrgId,
        contactId: matchedContactId,
        message: "Form submitted successfully" 
      });
    } catch (error) {
      console.error("Error submitting order form:", error);
      res.status(500).json({ message: "Failed to submit order form" });
    }
  });

  // PUBLIC: Get form submission status (no auth required, but needs submission ID)
  app.get('/api/public/orders/:orderId/form-status', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const submissions = await storage.getOrderFormSubmissions(orderId);
      const latestSubmission = submissions.length > 0 ? submissions[submissions.length - 1] : null;

      res.json({
        hasSubmission: submissions.length > 0,
        submissionCount: submissions.length,
        latestStatus: latestSubmission?.status || null,
        lastSubmittedAt: latestSubmission?.submittedAt || null,
        contactName: latestSubmission?.contactName || null,
      });
    } catch (error) {
      console.error("Error fetching form status:", error);
      res.status(500).json({ message: "Failed to fetch form status" });
    }
  });

  // ============================================
  // PUBLIC CUSTOMER PORTAL ENDPOINTS
  // ============================================

  // PUBLIC: Get comprehensive portal data for customer order view
  app.get('/api/public/orders/:orderId/portal-data', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Fetch order with line items
      const order = await storage.getOrderWithLineItems(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Fetch organization info
      const organization = order.orgId ? await storage.getOrganization(order.orgId) : null;

      // Fetch tracking numbers
      const trackingNumbers = await storage.getTrackingNumbersByOrder(orderId);

      // Fetch manufacturing record
      const manufacturing = await storage.getManufacturingByOrder(orderId);

      // Fetch design jobs for this order
      const designJobs = await storage.getDesignJobsByOrder(orderId);

      // Fetch customer comments
      const comments = await storage.getCustomerComments(orderId);

      // Fetch activity log
      const activityLog = await storage.getOrderActivityLog(orderId);

      // Build line items with product/variant info
      const lineItemsWithProducts = await Promise.all(
        (order.lineItems || []).map(async (item: any) => {
          const variant = item.variantId ? await storage.getProductVariant(item.variantId) : null;
          const product = variant?.productId ? await storage.getProduct(variant.productId) : null;
          return {
            ...item,
            productName: product?.name || null,
            variantCode: variant?.variantCode || null,
            variantColor: variant?.color || null,
          };
        })
      );

      res.json({
        order: {
          id: order.id,
          orderCode: order.orderCode,
          orderName: order.orderName,
          status: order.status,
          estDelivery: order.estDelivery,
          contactName: order.contactName || null,
          contactEmail: order.contactEmail || null,
          contactPhone: order.contactPhone || null,
          shippingAddress: order.shippingAddress || null,
          billToAddress: order.billToAddress || null,
          createdAt: order.createdAt,
        },
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          logoUrl: organization.logoUrl || null,
          brandPrimaryColor: organization.brandPrimaryColor || null,
          brandSecondaryColor: organization.brandSecondaryColor || null,
          brandPantoneCode: organization.brandPantoneCode || null,
        } : null,
        lineItems: lineItemsWithProducts,
        trackingNumbers: trackingNumbers.map((t: any) => ({
          id: t.id,
          trackingNumber: t.trackingNumber,
          carrierCompany: t.carrierCompany || 'Unknown',
          createdAt: t.createdAt,
        })),
        manufacturing: manufacturing ? {
          id: manufacturing.id,
          status: manufacturing.status,
          startDate: manufacturing.startDate || null,
          estCompletion: manufacturing.estCompletion || null,
          actualCompletion: manufacturing.actualCompletion || null,
        } : null,
        designJobs: designJobs.map((job: any) => ({
          id: job.id,
          jobCode: job.jobCode,
          status: job.status,
          brief: job.brief || null,
          renditionUrls: job.renditionUrls || null,
          finalDesignUrls: job.finalDesignUrls || null,
          createdAt: job.createdAt,
        })),
        comments: comments,
        documents: [],
        activityLog: activityLog.slice(0, 20),
      });
    } catch (error) {
      console.error("Error fetching portal data:", error);
      res.status(500).json({ message: "Failed to fetch portal data" });
    }
  });

  // PUBLIC: Submit customer comment
  app.post('/api/public/orders/:orderId/comments', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const comment = await storage.createCustomerComment({
        orderId,
        message: message.trim(),
        isFromCustomer: true,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // PUBLIC: Submit design request from customer
  app.post('/api/public/orders/:orderId/design-requests', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { brief } = req.body;
      if (!brief || typeof brief !== 'string' || brief.trim().length === 0) {
        return res.status(400).json({ message: "Design brief is required" });
      }

      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create design job linked to order
      // Note: jobCode is auto-generated by storage.createDesignJob
      const designJob = await storage.createDesignJob({
        orderId,
        orgId: order.orgId,
        brief: brief.trim(),
        status: 'pending',
      } as any);

      res.status(201).json(designJob);
    } catch (error) {
      console.error("Error creating design request:", error);
      res.status(500).json({ message: "Failed to create design request" });
    }
  });

  // PUBLIC: Get size adjustment requests for an order
  app.get('/api/public/orders/:orderId/size-adjustment-requests', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const requests = await storage.getSizeAdjustmentRequests(orderId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching size adjustment requests:", error);
      res.status(500).json({ message: "Failed to fetch size adjustment requests" });
    }
  });

  // PUBLIC: Submit size adjustment request from customer
  app.post('/api/public/orders/:orderId/size-adjustment-requests', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const { requestMessage } = req.body;
      if (!requestMessage || typeof requestMessage !== 'string' || requestMessage.trim().length === 0) {
        return res.status(400).json({ message: "Request message is required" });
      }

      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create size adjustment request
      const request = await storage.createSizeAdjustmentRequest({
        orderId,
        requestMessage: requestMessage.trim(),
      });

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating size adjustment request:", error);
      res.status(500).json({ message: "Failed to create size adjustment request" });
    }
  });


  // PUBLIC: Generate Order Summary PDF
  app.get('/api/public/orders/:orderId/pdf', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Fetch order with line items
      const order = await storage.getOrderWithLineItems(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Fetch organization info
      const organization = order.orgId ? await storage.getOrganization(order.orgId) : null;

      // Fetch tracking numbers
      const trackingNumbers = await storage.getTrackingNumbersByOrder(orderId);

      // Fetch manufacturing record
      const manufacturing = await storage.getManufacturingByOrder(orderId);

      // Build line items with product info
      const lineItemsWithProducts = await Promise.all(
        (order.lineItems || []).map(async (item: any) => {
          const variant = item.variantId ? await storage.getProductVariant(item.variantId) : null;
          const product = variant?.productId ? await storage.getProduct(variant.productId) : null;
          return {
            ...item,
            productName: product?.name || 'Unknown Product',
            variantCode: variant?.variantCode || '',
            variantColor: variant?.color || '',
          };
        })
      );

      // Import PDFDocument dynamically
      const PDFDocument = (await import('pdfkit')).default;
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Order Summary', { align: 'center' });
        doc.moveDown(0.5);
        
        // Order details
        doc.fontSize(12).font('Helvetica');
        doc.text(`Order #: ${order.orderCode}`, { align: 'center' });
        doc.text(`Order Name: ${order.orderName}`, { align: 'center' });
        doc.moveDown();

        // Line separator
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown();

        // Organization Info
        if (organization) {
          doc.fontSize(14).font('Helvetica-Bold').text('Organization');
          doc.fontSize(10).font('Helvetica');
          doc.text(`Name: ${organization.name}`);
          if (organization.brandPantoneCode) doc.text(`Brand Pantone: ${organization.brandPantoneCode}`);
          doc.moveDown();
        }

        // Order Status
        doc.fontSize(14).font('Helvetica-Bold').text('Order Status');
        doc.fontSize(10).font('Helvetica');
        const statusLabels: Record<string, string> = {
          'new': 'Order Placed',
          'waiting_sizes': 'Awaiting Sizes',
          'invoiced': 'Invoiced',
          'production': 'In Production',
          'shipped': 'Shipped',
          'completed': 'Completed'
        };
        doc.text(`Status: ${statusLabels[order.status] || order.status}`);
        if (order.estDelivery) doc.text(`Estimated Delivery: ${new Date(order.estDelivery).toLocaleDateString()}`);
        if (order.createdAt) doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.moveDown();

        // Contact Information
        if (order.contactName || order.contactEmail || order.contactPhone) {
          doc.fontSize(14).font('Helvetica-Bold').text('Contact Information');
          doc.fontSize(10).font('Helvetica');
          if (order.contactName) doc.text(`Name: ${order.contactName}`);
          if (order.contactEmail) doc.text(`Email: ${order.contactEmail}`);
          if (order.contactPhone) doc.text(`Phone: ${order.contactPhone}`);
          doc.moveDown();
        }

        // Shipping Address
        if (order.shippingAddress) {
          doc.fontSize(14).font('Helvetica-Bold').text('Shipping Address');
          doc.fontSize(10).font('Helvetica');
          doc.text(order.shippingAddress);
          doc.moveDown();
        }

        // Manufacturing Status
        if (manufacturing) {
          doc.fontSize(14).font('Helvetica-Bold').text('Manufacturing Status');
          doc.fontSize(10).font('Helvetica');
          const mfgStatusLabels: Record<string, string> = {
            'awaiting_admin_confirmation': 'Pending Confirmation',
            'confirmed_awaiting_manufacturing': 'Confirmed',
            'cutting_sewing': 'Cutting & Sewing',
            'printing': 'Printing',
            'final_packing_press': 'Final Packing',
            'shipped': 'Shipped',
            'complete': 'Complete'
          };
          doc.text(`Status: ${mfgStatusLabels[manufacturing.status] || manufacturing.status}`);
          if (manufacturing.estCompletion) doc.text(`Est. Completion: ${new Date(manufacturing.estCompletion).toLocaleDateString()}`);
          doc.moveDown();
        }

        // Tracking Information
        if (trackingNumbers.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('Tracking Information');
          doc.fontSize(10).font('Helvetica');
          trackingNumbers.forEach((t: any) => {
            doc.text(`${t.carrierCompany || 'Carrier'}: ${t.trackingNumber}`);
          });
          doc.moveDown();
        }

        // Line Items
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').text('Order Items', { align: 'center' });
        doc.moveDown();

        const sizeLabels = ['YXS', 'YS', 'YM', 'YL', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
        const sizeKeys = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'];

        lineItemsWithProducts.forEach((item: any, index: number) => {
          // Item header
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text(`${index + 1}. ${item.productName || item.itemName || 'Item'}`);
          
          doc.fontSize(9).font('Helvetica');
          if (item.variantCode) doc.text(`   Variant: ${item.variantCode}`);
          if (item.variantColor || item.colorNotes) {
            doc.text(`   Color: ${item.variantColor || item.colorNotes}`);
          }

          // Size table
          const sizes: string[] = [];
          const quantities: number[] = [];
          sizeKeys.forEach((key, i) => {
            const qty = item[key] || 0;
            if (qty > 0) {
              sizes.push(sizeLabels[i]);
              quantities.push(qty);
            }
          });

          if (sizes.length > 0) {
            doc.text(`   Sizes: ${sizes.map((s, i) => `${s}(${quantities[i]})`).join(', ')}`);
            const totalQty = quantities.reduce((sum, q) => sum + q, 0);
            doc.text(`   Total Units: ${totalQty}`);
          }

          if (item.notes) {
            doc.text(`   Notes: ${item.notes}`);
          }
          doc.moveDown(0.5);
        });

        // Calculate grand total
        let grandTotal = 0;
        lineItemsWithProducts.forEach((item: any) => {
          sizeKeys.forEach((key) => {
            grandTotal += item[key] || 0;
          });
        });

        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text(`Grand Total Units: ${grandTotal}`, { align: 'right' });

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('gray');
        doc.text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

        doc.end();
      });

      const filename = `Order-${order.orderCode}-Summary.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Get form submissions for an order
  app.get('/api/orders/:id/form-submissions', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const submissions = await storage.getOrderFormSubmissions(orderId);
      
      const submissionsWithSizes = await Promise.all(
        submissions.map(async (submission) => {
          const sizes = await storage.getOrderFormLineItemSizes(submission.id);
          return { ...submission, lineItemSizes: sizes };
        })
      );

      res.json(submissionsWithSizes);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ message: "Failed to fetch form submissions" });
    }
  });

  // Get latest form submission for an order
  app.get('/api/orders/:id/form-submission/latest', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const submission = await storage.getOrderFormSubmission(orderId);
      if (!submission) {
        return res.json(null);
      }

      const sizes = await storage.getOrderFormLineItemSizes(submission.id);
      res.json({ ...submission, lineItemSizes: sizes });
    } catch (error) {
      console.error("Error fetching latest form submission:", error);
      res.status(500).json({ message: "Failed to fetch form submission" });
    }
  });

  // Update form submission status (e.g., mark as reviewed)
  app.patch('/api/orders/:id/form-submission/:submissionId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const submissionId = parseInt(req.params.submissionId);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { status } = req.body;
      if (!['submitted', 'reviewed', 'approved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const updated = await storage.updateOrderFormSubmission(submissionId, {
        status,
        reviewedAt: status === 'reviewed' || status === 'approved' ? new Date() : undefined,
        reviewedBy: status === 'reviewed' || status === 'approved' ? userId : undefined,
      } as any);

      if (!updated) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating form submission:", error);
      res.status(500).json({ message: "Failed to update form submission" });
    }
  });
}