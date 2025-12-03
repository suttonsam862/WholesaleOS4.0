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
  type AuthenticatedRequest,
  type UserRole
} from "./shared/middleware";
import { isAuthenticated } from "./shared/middleware";
import { stripFinancialData } from "./shared/utils";
import { ObjectStorageService } from "../objectStorage";

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

      console.log('🔍 [DEBUG] Processed order data:', JSON.stringify(processedOrderData, null, 2));
      console.log('🔍 [DEBUG] Attempting insertOrderSchema.parse()...');

      const validatedOrder = insertOrderSchema.parse(processedOrderData);
      console.log('🔍 [DEBUG] ✅ Order schema validation passed!');
      console.log('🔍 [DEBUG] Validated order:', JSON.stringify(validatedOrder, null, 2));

      // Sales users can only create orders for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedOrder.salespersonId = (req as AuthenticatedRequest).user.userData!.id;
      }

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
  app.get('/api/orders/:id/line-items-with-manufacturers', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
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
        const existingMfg = await storage.getManufacturingByOrder(id);
        if (!existingMfg) {
          // Create manufacturing record automatically
          await storage.createManufacturing({
            orderId: id,
            status: 'awaiting_admin_confirmation',
            productionNotes: 'Auto-created when order moved to production',
          });
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
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
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
      });
    } catch (error) {
      console.error("Error fetching form status:", error);
      res.status(500).json({ message: "Failed to fetch form status" });
    }
  });
}