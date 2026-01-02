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

  // Archive a lead (soft delete)
  app.post('/api/leads/:id/archive', isAuthenticated, loadUserData, requirePermission('leads', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales') {
        return res.status(403).json({ message: "Sales users cannot archive leads" });
      }

      const archivedLead = await storage.archiveLead(id, userId);

      await storage.logActivity(
        userId,
        'lead',
        id,
        'archived',
        existingLead,
        archivedLead
      );

      res.json({ message: "Lead archived successfully", lead: archivedLead });
    } catch (error) {
      console.error("Error archiving lead:", error);
      res.status(500).json({ message: "Failed to archive lead" });
    }
  });

  // Check lead dependencies before delete
  app.get('/api/leads/:id/dependencies', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dependencies = await storage.getLeadDependencies(id);
      res.json(dependencies);
    } catch (error) {
      console.error("Error checking lead dependencies:", error);
      res.status(500).json({ message: "Failed to check lead dependencies" });
    }
  });

  app.delete('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const forceDelete = req.query.force === 'true';
      const useArchive = req.query.archive === 'true';
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can delete this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales') {
        return res.status(403).json({ message: "Sales users cannot delete leads" });
      }

      // Check for dependencies first
      const dependencies = await storage.getLeadDependencies(id);
      const hasDependencies = dependencies.orders > 0 || dependencies.designJobs > 0;

      // If has dependencies and not force deleting, archive instead or return error
      if (hasDependencies && !forceDelete) {
        if (useArchive) {
          // Archive the lead instead
          const archivedLead = await storage.archiveLead(id, userId);
          await storage.logActivity(userId, 'lead', id, 'archived', existingLead, archivedLead);
          return res.json({ 
            message: "Lead has dependencies and was archived instead of deleted",
            archived: true,
            lead: archivedLead,
            dependencies
          });
        }
        
        return res.status(409).json({ 
          message: "Cannot delete lead with associated records. Use ?archive=true to archive instead, or ?force=true to unlink dependencies and delete.",
          dependencies,
          suggestions: [
            "Archive the lead to hide it from active lists",
            "Force delete to unlink dependencies and permanently remove"
          ]
        });
      }

      // Proceed with deletion
      const result = await storage.deleteLead(id, forceDelete);

      if (!result.success) {
        return res.status(409).json({ 
          message: "Failed to delete lead due to dependencies",
          dependencies: result.dependencies
        });
      }

      // Log activity
      await storage.logActivity(userId, 'lead', id, 'deleted', existingLead, null);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });
}
