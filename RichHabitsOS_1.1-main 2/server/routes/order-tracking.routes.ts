import type { Express } from "express";
import { storage } from "../storage";
import { insertOrderTrackingNumberSchema } from "@shared/schema";
import { z } from "zod";
import {
  isAuthenticated,
  loadUserData,
  requirePermission,
  requirePermissionOr,
  type AuthenticatedRequest
} from "./shared/middleware";

export function registerOrderTrackingRoutes(app: Express): void {
  // Get all tracking numbers for an order
  // Users with either 'orders' read OR 'manufacturing' read permission can view tracking
  app.get('/api/orders/:orderId/tracking', 
    isAuthenticated, 
    loadUserData, 
    requirePermissionOr(
      { resource: 'orders', permission: 'read' },
      { resource: 'manufacturing', permission: 'read' }
    ),
    async (req, res) => {
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

      const trackingNumbers = await storage.getOrderTrackingNumbers(orderId);
      res.json(trackingNumbers);
    } catch (error) {
      console.error("Error fetching tracking numbers:", error);
      res.status(500).json({ message: "Failed to fetch tracking numbers" });
    }
  });

  // Add a new tracking number to an order
  app.post('/api/orders/:orderId/tracking', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
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

      // Validate request body using the schema
      const bodySchema = z.object({
        trackingNumber: z.string().min(1, "Tracking number is required"),
        carrierCompany: z.string().min(1, "Carrier company is required"),
      });
      
      const { trackingNumber: trackingNum, carrierCompany } = bodySchema.parse(req.body);

      const trackingNumber = await storage.addOrderTrackingNumber({
        orderId,
        trackingNumber: trackingNum,
        carrierCompany
      });

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        orderId,
        'tracking_added',
        null,
        trackingNumber
      );

      res.status(201).json(trackingNumber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding tracking number:", error);
      res.status(500).json({ message: "Failed to add tracking number" });
    }
  });

  // Delete a tracking number
  app.delete('/api/tracking/:id', isAuthenticated, loadUserData, requirePermission('orders', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tracking number ID" });
      }

      // Note: We might want to get the tracking number before deletion for audit logging
      // but the storage interface doesn't provide a getTrackingNumber method
      await storage.deleteOrderTrackingNumber(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'tracking',
        id,
        'deleted',
        { id },
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tracking number:", error);
      res.status(500).json({ message: "Failed to delete tracking number" });
    }
  });
}
