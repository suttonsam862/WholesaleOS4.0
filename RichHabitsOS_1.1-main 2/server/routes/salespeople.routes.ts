import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest, type UserRole } from "./shared/middleware";
import { insertSalespersonSchema } from "@shared/schema";
import { z } from "zod";

export function registerSalespeopleRoutes(app: Express): void {
  // Salespeople routes
  app.get('/api/salespeople', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const salespeople = await storage.getSalespeopleWithUserData();
      res.json(salespeople);
    } catch (error) {
      console.error("Error fetching salespeople:", error);
      res.status(500).json({ message: "Failed to fetch salespeople" });
    }
  });

  app.get('/api/salespeople/with-metrics', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      console.log('🔍 [API] Fetching salespeople with metrics...');
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      const salespeople = await storage.getSalespeopleWithMetrics();
      console.log('🔍 [API] Found salespeople:', salespeople.length);

      // Sales users can only see their own metrics
      if (userRole === 'sales') {
        const filteredSalespeople = salespeople.filter(sp => sp.userId === userId);
        return res.json(filteredSalespeople);
      }

      // Admin and other roles see all salespeople
      res.json(salespeople);
    } catch (error) {
      console.error("Error fetching salespeople with metrics:", error);
      res.status(500).json({ message: "Failed to fetch salespeople with metrics" });
    }
  });

  app.post('/api/salespeople', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const validatedData = insertSalespersonSchema.parse(req.body);
      const salesperson = await storage.createSalesperson(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        salesperson.id,
        'created',
        null,
        salesperson
      );

      res.status(201).json(salesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating salesperson:", error);
      res.status(500).json({ message: "Failed to create salesperson" });
    }
  });

  app.get('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      res.json(salesperson);
    } catch (error) {
      console.error("Error fetching salesperson:", error);
      res.status(500).json({ message: "Failed to fetch salesperson" });
    }
  });

  app.put('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSalespersonSchema.partial().parse(req.body);

      const existingSalesperson = await storage.getSalesperson(id);
      if (!existingSalesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      const updatedSalesperson = await storage.updateSalesperson(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        id,
        'updated',
        existingSalesperson,
        updatedSalesperson
      );

      res.json(updatedSalesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating salesperson:", error);
      res.status(500).json({ message: "Failed to update salesperson" });
    }
  });

  app.delete('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingSalesperson = await storage.getSalesperson(id);
      if (!existingSalesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      await storage.deleteSalesperson(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        id,
        'deleted',
        existingSalesperson,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      res.status(500).json({ message: "Failed to delete salesperson" });
    }
  });
}
