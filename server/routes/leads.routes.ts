import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest, type UserRole } from "./shared/middleware";
import { insertLeadSchema } from "@shared/schema";
import { z } from "zod";

export function registerLeadRoutes(app: Express): void {
  // Leads
  app.get('/api/leads', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      let leads;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin') {
        // Admin users see all leads
        leads = await storage.getLeads();
      } else if (user.role === 'sales') {
        // Sales users only see their own leads
        leads = await storage.getLeadsBySalesperson(user.id);
      } else {
        // Other roles see all leads (if they have read permission)
        leads = await storage.getLeads();
      }

      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/leads', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      // Remove leadCode from validation since it's auto-generated
      const { leadCode, ...dataToValidate } = req.body;
      const validatedData = insertLeadSchema.parse(dataToValidate);

      // Sales users can only create leads for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedData.ownerUserId = (req as AuthenticatedRequest).user.userData!.id;
      }

      const lead = await storage.createLead(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'lead',
        lead.id,
        'created',
        null,
        lead
      );

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Leads owners endpoint for dropdown filtering (accessible to all roles with leads permission)
  app.get('/api/leads/owners', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Return minimal user data for dropdowns - only id and name
      const ownerOptions = users.map(user => ({
        id: user.id,
        name: user.name
      }));
      res.json(ownerOptions);
    } catch (error) {
      console.error("Error fetching lead owners:", error);
      res.status(500).json({ message: "Failed to fetch lead owners" });
    }
  });

  app.get('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can view this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && lead.ownerUserId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.put('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLeadSchema.partial().parse(req.body);

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can update this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && existingLead.ownerUserId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedLead = await storage.updateLead(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'lead',
        id,
        'updated',
        existingLead,
        updatedLead
      );

      res.json(updatedLead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can delete this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales') {
        return res.status(403).json({ message: "Sales users cannot delete leads" });
      }

      await storage.deleteLead(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'lead',
        id,
        'deleted',
        existingLead,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });
}
