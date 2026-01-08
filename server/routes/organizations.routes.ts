import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, requirePermissionOr, type AuthenticatedRequest } from "./shared/middleware";
import { insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";
import { geocodeUSCity } from "../utils/geocoding";

async function autoGeocode(data: { city?: string | null; state?: string | null }): Promise<{ geoLat?: string; geoLng?: string }> {
  if (data.city && data.state) {
    const coords = geocodeUSCity(data.city, data.state);
    if (coords) {
      return { geoLat: String(coords.lat), geoLng: String(coords.lng) };
    }
  }
  return {};
}

export function registerOrganizationRoutes(app: Express): void {
  // Organizations
  app.get('/api/organizations', isAuthenticated, loadUserData, requirePermission('organizations', 'read'), async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      // Organizations are viewable by all who have read permission
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post('/api/organizations', isAuthenticated, loadUserData, requirePermission('organizations', 'write'), async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      
      // Auto-geocode if city/state provided and no geo coordinates
      const geoData = await autoGeocode(validatedData);
      const dataWithGeo = { ...validatedData, ...geoData };
      
      const organization = await storage.createOrganization(dataWithGeo);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'organization',
        organization.id,
        'created',
        null,
        organization
      );

      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating organization:", error);
      // Ensure we always return JSON
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create organization" });
      }
    }
  });

  app.get('/api/organizations/:id', isAuthenticated, loadUserData, requirePermissionOr({ resource: 'organizations', permission: 'read' }, { resource: 'manufacturing', permission: 'read' }), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.put('/api/organizations/:id', isAuthenticated, loadUserData, requirePermission('organizations', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOrganizationSchema.partial().parse(req.body);

      const existingOrg = await storage.getOrganization(id);
      if (!existingOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Auto-geocode if city/state changed
      let dataWithGeo = { ...validatedData };
      const cityChanged = validatedData.city && validatedData.city !== existingOrg.city;
      const stateChanged = validatedData.state && validatedData.state !== existingOrg.state;
      
      if (cityChanged || stateChanged) {
        const newCity = validatedData.city || existingOrg.city;
        const newState = validatedData.state || existingOrg.state;
        const geoData = await autoGeocode({ city: newCity, state: newState });
        dataWithGeo = { ...validatedData, ...geoData };
      }

      const updatedOrg = await storage.updateOrganization(id, dataWithGeo);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'organization',
        id,
        'updated',
        existingOrg,
        updatedOrg
      );

      res.json(updatedOrg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  // Archive organization (soft delete)
  app.put('/api/organizations/:id/archive', isAuthenticated, loadUserData, requirePermission('organizations', 'delete'), async (req, res) => {
    console.log(`[ARCHIVE ROUTE] Starting organization archive process for ID: ${req.params.id}`);
    
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      if (isNaN(id)) {
        console.error(`[ARCHIVE ROUTE] Invalid organization ID provided: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const existingOrg = await storage.getOrganization(id);
      if (!existingOrg) {
        console.error(`[ARCHIVE ROUTE] Organization with ID ${id} not found`);
        return res.status(404).json({ message: "Organization not found" });
      }

      console.log(`[ARCHIVE ROUTE] Archiving organization: ${existingOrg.name} (ID: ${id})`);
      const archived = await storage.archiveOrganization(id, userId);
      console.log(`[ARCHIVE ROUTE] Organization archived successfully`);

      // Log activity
      await storage.logActivity(
        userId,
        'organization',
        id,
        'archived',
        existingOrg,
        archived
      );

      res.json(archived);
    } catch (error) {
      console.error(`[ARCHIVE ROUTE] Error archiving organization:`, error);
      res.status(500).json({ message: "Failed to archive organization", error: (error as Error).message });
    }
  });

  // Unarchive organization
  app.put('/api/organizations/:id/unarchive', isAuthenticated, loadUserData, requirePermission('organizations', 'delete'), async (req, res) => {
    console.log(`[UNARCHIVE ROUTE] Starting organization unarchive process for ID: ${req.params.id}`);
    
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      if (isNaN(id)) {
        console.error(`[UNARCHIVE ROUTE] Invalid organization ID provided: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const existingOrg = await storage.getOrganization(id);
      if (!existingOrg) {
        console.error(`[UNARCHIVE ROUTE] Organization with ID ${id} not found`);
        return res.status(404).json({ message: "Organization not found" });
      }

      console.log(`[UNARCHIVE ROUTE] Unarchiving organization: ${existingOrg.name} (ID: ${id})`);
      const unarchived = await storage.unarchiveOrganization(id);
      console.log(`[UNARCHIVE ROUTE] Organization unarchived successfully`);

      // Log activity
      await storage.logActivity(
        userId,
        'organization',
        id,
        'unarchived',
        existingOrg,
        unarchived
      );

      res.json(unarchived);
    } catch (error) {
      console.error(`[UNARCHIVE ROUTE] Error unarchiving organization:`, error);
      res.status(500).json({ message: "Failed to unarchive organization", error: (error as Error).message });
    }
  });

  // Legacy delete endpoint - redirect to archive
  app.delete('/api/organizations/:id', isAuthenticated, loadUserData, requirePermission('organizations', 'delete'), async (req, res) => {
    console.log(`[DELETE ROUTE] Legacy delete endpoint called - redirecting to archive`);
    console.log(`[DELETE ROUTE] Organization ID: ${req.params.id}`);

    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      if (isNaN(id)) {
        console.error(`[DELETE ROUTE] Invalid organization ID provided: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid organization ID" });
      }

      const existingOrg = await storage.getOrganization(id);
      if (!existingOrg) {
        console.error(`[DELETE ROUTE] Organization with ID ${id} not found`);
        return res.status(404).json({ message: "Organization not found" });
      }

      // Archive instead of delete
      console.log(`[DELETE ROUTE] Archiving organization instead of deleting: ${existingOrg.name} (ID: ${id})`);
      await storage.archiveOrganization(id, userId);
      console.log(`[DELETE ROUTE] Organization archived successfully`);

      // Log activity
      await storage.logActivity(
        userId,
        'organization',
        id,
        'archived',
        existingOrg,
        null
      );

      console.log(`[DELETE ROUTE] Organization ${id} archived (soft delete), sending 204 response`);
      res.status(204).send();
    } catch (error) {
      console.error(`[DELETE ROUTE] Error archiving organization:`, error);
      res.status(500).json({ message: "Failed to archive organization", error: (error as Error).message });
    }
  });
}
