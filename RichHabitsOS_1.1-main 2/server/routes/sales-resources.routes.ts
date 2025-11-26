import type { Express } from "express";
import { storage } from "../storage";
import { insertSalesResourceSchema } from "@shared/schema";
import { isAuthenticated, loadUserData, type AuthenticatedRequest } from "./shared/middleware";

export function registerSalesResourcesRoutes(app: Express): void {
  // Get all sales resources
  app.get('/api/sales-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const resources = await storage.getSalesResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching sales resources:", error);
      res.status(500).json({ message: "Failed to fetch sales resources" });
    }
  });

  // Upload new sales resource (admin only)
  app.post('/api/sales-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can upload sales resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can upload sales resources" });
      }

      const validatedData = insertSalesResourceSchema.parse({
        ...req.body,
        uploadedBy: user.id,
      });

      const resource = await storage.createSalesResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating sales resource:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create sales resource" });
    }
  });

  // Delete sales resource (admin only)
  app.delete('/api/sales-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can delete sales resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete sales resources" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteSalesResource(id);
      res.json({ message: "Sales resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales resource:", error);
      res.status(500).json({ message: "Failed to delete sales resource" });
    }
  });

  // Increment download count
  app.post('/api/sales-resources/:id/download', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementResourceDownloads(id);
      res.json({ message: "Download count incremented" });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });
}
