import type { Express, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import { insertDesignProjectSchema, createDesignProjectClientSchema, insertDesignVersionSchema, insertDesignLayerSchema, insertDesignTemplateSchema, insertDesignLockedOverlaySchema, insertDesignGenerationRequestSchema, insertDesignAiTrainingSetSchema, insertDesignAiTrainingImageSchema, insertDesignStylePresetSchema, type DesignProject } from "@shared/schema";
import { z } from "zod";
import { generateBaseDesign, generateTypographyIteration } from "../services/design-generation.service";
import { generateCompositeImages } from "../services/image-composite.service";

// Helper to verify project ownership - returns project if authorized, null if not
async function verifyProjectAccess(
  projectId: number,
  userId: string,
  userRole: string,
  res: Response
): Promise<DesignProject | null> {
  const project = await storage.getDesignProject(projectId);
  if (!project) {
    res.status(404).json({ message: "Design project not found" });
    return null;
  }
  // Admin can access all projects, otherwise must be owner
  if (userRole !== 'admin' && project.userId !== userId) {
    res.status(403).json({ message: "Access denied - you don't own this project" });
    return null;
  }
  return project;
}

export function registerDesignLabRoutes(app: Express): void {
  // ==================== DESIGN PROJECTS ====================

  // GET /api/design-lab/projects - List user's projects with pagination
  app.get('/api/design-lab/projects', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      let projects = await storage.getDesignProjects(user.role === 'admin' ? undefined : user.id);
      
      // Filter out archived unless requested
      if (req.query.includeArchived !== 'true') {
        projects = projects.filter(p => p.status !== 'archived');
      }

      const total = projects.length;
      const paginated = projects.slice((page - 1) * limit, page * limit);

      res.json({
        projects: paginated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      });
    } catch (error) {
      console.error("Error fetching design projects:", error);
      res.status(500).json({ message: "Failed to fetch design projects" });
    }
  });

  // POST /api/design-lab/projects - Create new project
  app.post('/api/design-lab/projects', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const parsed = createDesignProjectClientSchema.parse(req.body);
      
      const project = await storage.createDesignProject({
        ...parsed,
        userId: user.id,
      });

      // Auto-bootstrap version v1 so users can add layers immediately
      const version = await storage.createDesignVersion({
        projectId: project.id,
        versionNumber: 1,
        name: 'Initial Version',
        createdBy: user.id,
      });

      // Update project with the current version
      const updatedProject = await storage.updateDesignProject(project.id, { 
        currentVersionId: version.id 
      });

      res.status(201).json({ 
        ...updatedProject, 
        currentVersion: version, 
        layers: [] 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating design project:", error);
      res.status(500).json({ message: "Failed to create design project" });
    }
  });

  // GET /api/design-lab/projects/:id - Get project with current version and layers
  app.get('/api/design-lab/projects/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      let project = await verifyProjectAccess(id, user.id, user.role, res);
      if (!project) return; // Response already sent by helper

      // Get current version and its layers if available
      let currentVersion = null;
      let layers: any[] = [];
      
      if (project.currentVersionId) {
        currentVersion = await storage.getDesignVersion(project.currentVersionId);
        if (currentVersion) {
          layers = await storage.getDesignLayers(currentVersion.id);
        }
      }

      // Auto-bootstrap version if none exists (for legacy projects)
      if (!currentVersion) {
        const existingVersions = await storage.getDesignVersions(id);
        if (existingVersions.length > 0) {
          // Use the latest existing version
          currentVersion = existingVersions[existingVersions.length - 1];
          layers = await storage.getDesignLayers(currentVersion.id);
          // Update project reference
          const updated = await storage.updateDesignProject(id, { currentVersionId: currentVersion.id });
          if (updated) project = updated;
        } else {
          // Create initial version
          currentVersion = await storage.createDesignVersion({
            projectId: id,
            versionNumber: 1,
            name: 'Initial Version',
            createdBy: user.id,
          });
          const updated = await storage.updateDesignProject(id, { currentVersionId: currentVersion.id });
          if (updated) project = updated;
          layers = [];
        }
      }

      res.json({ ...project, currentVersion, layers });
    } catch (error) {
      console.error("Error fetching design project:", error);
      res.status(500).json({ message: "Failed to fetch design project" });
    }
  });

  // PATCH /api/design-lab/projects/:id - Update project
  app.patch('/api/design-lab/projects/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const existing = await verifyProjectAccess(id, user.id, user.role, res);
      if (!existing) return; // Response already sent

      const allowedFields = ['name', 'description', 'status', 'currentVersionId', 'thumbnailUrl', 'variantId', 'designJobId', 'orgId'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignProject(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design project:", error);
      res.status(500).json({ message: "Failed to update design project" });
    }
  });

  // DELETE /api/design-lab/projects/:id - Soft delete (archive)
  app.delete('/api/design-lab/projects/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const existing = await verifyProjectAccess(id, user.id, user.role, res);
      if (!existing) return; // Response already sent

      await storage.updateDesignProject(id, { status: 'archived' as any });
      res.json({ message: "Project archived successfully" });
    } catch (error) {
      console.error("Error archiving design project:", error);
      res.status(500).json({ message: "Failed to archive design project" });
    }
  });

  // ==================== DESIGN VERSIONS ====================

  // GET /api/design-lab/projects/:projectId/versions - List all versions
  app.get('/api/design-lab/projects/:projectId/versions', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await verifyProjectAccess(projectId, user.id, user.role, res);
      if (!project) return;

      const versions = await storage.getDesignVersions(projectId);
      res.json(versions);
    } catch (error) {
      console.error("Error fetching design versions:", error);
      res.status(500).json({ message: "Failed to fetch design versions" });
    }
  });

  // POST /api/design-lab/projects/:projectId/versions - Create new version
  app.post('/api/design-lab/projects/:projectId/versions', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await verifyProjectAccess(projectId, user.id, user.role, res);
      if (!project) return;

      // Get the latest version number
      const existingVersions = await storage.getDesignVersions(projectId);
      const nextVersionNumber = existingVersions.length > 0 
        ? Math.max(...existingVersions.map(v => v.versionNumber)) + 1 
        : 1;

      // Create new version
      const parsed = insertDesignVersionSchema.omit({ projectId: true, versionNumber: true, createdBy: true }).parse(req.body);
      const version = await storage.createDesignVersion({
        ...parsed,
        projectId,
        versionNumber: nextVersionNumber,
        createdBy: user.id,
      });

      // Copy layers from previous version if requested and source version exists
      const copyFromVersionId = req.body.copyFromVersionId;
      if (copyFromVersionId) {
        const sourceLayers = await storage.getDesignLayers(copyFromVersionId);
        for (const layer of sourceLayers) {
          await storage.createDesignLayer({
            versionId: version.id,
            layerType: layer.layerType as any,
            name: layer.name,
            imageUrl: layer.imageUrl ?? undefined,
            position: layer.position,
            textContent: layer.textContent ?? undefined,
            textStyle: layer.textStyle,
            view: layer.view as any,
            zIndex: layer.zIndex ?? undefined,
            isVisible: layer.isVisible ?? undefined,
            isLocked: layer.isLocked ?? undefined,
            opacity: layer.opacity ?? undefined,
            blendMode: layer.blendMode ?? undefined,
          });
        }
      }

      // Update project's current version
      await storage.updateDesignProject(projectId, { currentVersionId: version.id });

      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating design version:", error);
      res.status(500).json({ message: "Failed to create design version" });
    }
  });

  // POST /api/design-lab/projects/:projectId/versions/:versionId/restore - Restore a version as current
  app.post('/api/design-lab/projects/:projectId/versions/:versionId/restore', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const projectId = parseInt(req.params.projectId);
      const versionId = parseInt(req.params.versionId);
      
      if (isNaN(projectId) || isNaN(versionId)) {
        return res.status(400).json({ message: "Invalid project or version ID" });
      }

      const project = await verifyProjectAccess(projectId, user.id, user.role, res);
      if (!project) return;

      const version = await storage.getDesignVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Design version not found" });
      }

      if (version.projectId !== projectId) {
        return res.status(400).json({ message: "Version does not belong to this project" });
      }

      const updated = await storage.updateDesignProject(projectId, { currentVersionId: versionId });

      const layers = await storage.getDesignLayers(versionId);
      
      res.json({ 
        message: "Version restored successfully",
        project: updated,
        currentVersion: version,
        layers 
      });
    } catch (error) {
      console.error("Error restoring design version:", error);
      res.status(500).json({ message: "Failed to restore design version" });
    }
  });

  // GET /api/design-lab/projects/:projectId/versions/:versionId - Get version with layers
  app.get('/api/design-lab/projects/:projectId/versions/:versionId', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const projectId = parseInt(req.params.projectId);
      const versionId = parseInt(req.params.versionId);
      if (isNaN(projectId) || isNaN(versionId)) {
        return res.status(400).json({ message: "Invalid project or version ID" });
      }

      const project = await verifyProjectAccess(projectId, user.id, user.role, res);
      if (!project) return;

      const version = await storage.getDesignVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Design version not found" });
      }
      if (version.projectId !== projectId) {
        return res.status(400).json({ message: "Version does not belong to this project" });
      }

      const layers = await storage.getDesignLayers(versionId);
      res.json({ ...version, layers });
    } catch (error) {
      console.error("Error fetching design version:", error);
      res.status(500).json({ message: "Failed to fetch design version" });
    }
  });

  // PATCH /api/design-lab/projects/:projectId/versions/:versionId - Update version
  app.patch('/api/design-lab/projects/:projectId/versions/:versionId', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const projectId = parseInt(req.params.projectId);
      const versionId = parseInt(req.params.versionId);
      if (isNaN(projectId) || isNaN(versionId)) {
        return res.status(400).json({ message: "Invalid project or version ID" });
      }

      const project = await verifyProjectAccess(projectId, user.id, user.role, res);
      if (!project) return;

      const existing = await storage.getDesignVersion(versionId);
      if (!existing) {
        return res.status(404).json({ message: "Design version not found" });
      }
      if (existing.projectId !== projectId) {
        return res.status(400).json({ message: "Version does not belong to this project" });
      }

      const allowedFields = ['name', 'frontImageUrl', 'backImageUrl', 'compositeFrontUrl', 'compositeBackUrl', 'layerData', 'generationPrompt', 'generationProvider', 'generationDuration'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignVersion(versionId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design version:", error);
      res.status(500).json({ message: "Failed to update design version" });
    }
  });

  // ==================== DESIGN LAYERS ====================

  // GET /api/design-lab/versions/:versionId/layers - Get all layers
  app.get('/api/design-lab/versions/:versionId/layers', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const versionId = parseInt(req.params.versionId);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: "Invalid version ID" });
      }

      // Verify ownership through version -> project
      const version = await storage.getDesignVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Design version not found" });
      }
      const project = await verifyProjectAccess(version.projectId, user.id, user.role, res);
      if (!project) return;

      const layers = await storage.getDesignLayers(versionId);
      res.json(layers);
    } catch (error) {
      console.error("Error fetching design layers:", error);
      res.status(500).json({ message: "Failed to fetch design layers" });
    }
  });

  // POST /api/design-lab/versions/:versionId/layers - Add layer
  app.post('/api/design-lab/versions/:versionId/layers', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const versionId = parseInt(req.params.versionId);
      if (isNaN(versionId)) {
        return res.status(400).json({ message: "Invalid version ID" });
      }

      const version = await storage.getDesignVersion(versionId);
      if (!version) {
        return res.status(404).json({ message: "Design version not found" });
      }

      // Verify ownership through version -> project
      const project = await verifyProjectAccess(version.projectId, user.id, user.role, res);
      if (!project) return;

      const parsed = insertDesignLayerSchema.omit({ versionId: true }).parse(req.body);
      const layer = await storage.createDesignLayer({
        ...parsed,
        versionId,
      });

      res.status(201).json(layer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating design layer:", error);
      res.status(500).json({ message: "Failed to create design layer" });
    }
  });

  // PATCH /api/design-lab/layers/:layerId - Update layer
  app.patch('/api/design-lab/layers/:layerId', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const layerId = parseInt(req.params.layerId);
      if (isNaN(layerId)) {
        return res.status(400).json({ message: "Invalid layer ID" });
      }

      const existing = await storage.getDesignLayer(layerId);
      if (!existing) {
        return res.status(404).json({ message: "Design layer not found" });
      }

      // Verify ownership through layer -> version -> project
      const version = await storage.getDesignVersion(existing.versionId);
      if (!version) {
        return res.status(404).json({ message: "Design version not found" });
      }
      const project = await verifyProjectAccess(version.projectId, user.id, user.role, res);
      if (!project) return;

      const allowedFields = ['name', 'imageUrl', 'position', 'textContent', 'textStyle', 'view', 'zIndex', 'isVisible', 'isLocked', 'opacity', 'blendMode', 'prompt', 'referenceImageUrl', 'bbox'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignLayer(layerId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design layer:", error);
      res.status(500).json({ message: "Failed to update design layer" });
    }
  });

  // DELETE /api/design-lab/layers/:layerId - Remove layer
  app.delete('/api/design-lab/layers/:layerId', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const layerId = parseInt(req.params.layerId);
      if (isNaN(layerId)) {
        return res.status(400).json({ message: "Invalid layer ID" });
      }

      const existing = await storage.getDesignLayer(layerId);
      if (!existing) {
        return res.status(404).json({ message: "Design layer not found" });
      }

      // Verify ownership through layer -> version -> project
      const version = await storage.getDesignVersion(existing.versionId);
      if (!version) {
        return res.status(404).json({ message: "Design version not found" });
      }
      const project = await verifyProjectAccess(version.projectId, user.id, user.role, res);
      if (!project) return;

      await storage.deleteDesignLayer(layerId);
      res.json({ message: "Layer deleted successfully" });
    } catch (error) {
      console.error("Error deleting design layer:", error);
      res.status(500).json({ message: "Failed to delete design layer" });
    }
  });

  // ==================== DESIGN TEMPLATES (Admin only) ====================

  // GET /api/design-lab/templates - List all templates
  app.get('/api/design-lab/templates', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const templates = await storage.getDesignTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching design templates:", error);
      res.status(500).json({ message: "Failed to fetch design templates" });
    }
  });

  // GET /api/design-lab/templates/variant/:variantId - Get templates for variant
  app.get('/api/design-lab/templates/variant/:variantId', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      if (isNaN(variantId)) {
        return res.status(400).json({ message: "Invalid variant ID" });
      }

      const templates = await storage.getDesignTemplates(variantId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching design templates for variant:", error);
      res.status(500).json({ message: "Failed to fetch design templates" });
    }
  });

  // POST /api/design-lab/templates - Create template (admin only)
  app.post('/api/design-lab/templates', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create design templates" });
      }

      const parsed = insertDesignTemplateSchema.parse(req.body);
      const template = await storage.createDesignTemplate({
        ...parsed,
        createdBy: user.id,
      });

      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating design template:", error);
      res.status(500).json({ message: "Failed to create design template" });
    }
  });

  // PATCH /api/design-lab/templates/:id - Update template (admin only)
  app.patch('/api/design-lab/templates/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update design templates" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const existing = await storage.getDesignTemplate(id);
      if (!existing) {
        return res.status(404).json({ message: "Design template not found" });
      }

      const allowedFields = ['name', 'templateType', 'baseImageUrl', 'focusAreaMask', 'isActive', 'variantId'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignTemplate(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design template:", error);
      res.status(500).json({ message: "Failed to update design template" });
    }
  });

  // DELETE /api/design-lab/templates/:id - Deactivate template (admin only)
  app.delete('/api/design-lab/templates/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete design templates" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const existing = await storage.getDesignTemplate(id);
      if (!existing) {
        return res.status(404).json({ message: "Design template not found" });
      }

      await storage.updateDesignTemplate(id, { isActive: false });
      res.json({ message: "Template deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating design template:", error);
      res.status(500).json({ message: "Failed to deactivate design template" });
    }
  });

  // ==================== LOCKED OVERLAYS (Admin only) ====================

  // GET /api/design-lab/overlays - List all overlays
  app.get('/api/design-lab/overlays', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const overlays = await storage.getDesignLockedOverlays();
      res.json(overlays);
    } catch (error) {
      console.error("Error fetching design overlays:", error);
      res.status(500).json({ message: "Failed to fetch design overlays" });
    }
  });

  // GET /api/design-lab/overlays/variant/:variantId - Get overlays for variant
  app.get('/api/design-lab/overlays/variant/:variantId', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      if (isNaN(variantId)) {
        return res.status(400).json({ message: "Invalid variant ID" });
      }

      const overlays = await storage.getDesignLockedOverlays(variantId);
      res.json(overlays);
    } catch (error) {
      console.error("Error fetching design overlays for variant:", error);
      res.status(500).json({ message: "Failed to fetch design overlays" });
    }
  });

  // POST /api/design-lab/overlays - Create overlay (admin only)
  app.post('/api/design-lab/overlays', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create design overlays" });
      }

      const parsed = insertDesignLockedOverlaySchema.parse(req.body);
      const overlay = await storage.createDesignLockedOverlay({
        ...parsed,
        createdBy: user.id,
      });

      res.status(201).json(overlay);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating design overlay:", error);
      res.status(500).json({ message: "Failed to create design overlay" });
    }
  });

  // PATCH /api/design-lab/overlays/:id - Update overlay (admin only)
  app.patch('/api/design-lab/overlays/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update design overlays" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid overlay ID" });
      }

      const existing = await storage.getDesignLockedOverlay(id);
      if (!existing) {
        return res.status(404).json({ message: "Design overlay not found" });
      }

      const allowedFields = ['name', 'overlayImageUrl', 'position', 'templateType', 'zIndex', 'isActive', 'variantId'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignLockedOverlay(id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design overlay:", error);
      res.status(500).json({ message: "Failed to update design overlay" });
    }
  });

  // DELETE /api/design-lab/overlays/:id - Deactivate overlay (admin only)
  app.delete('/api/design-lab/overlays/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete design overlays" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid overlay ID" });
      }

      const existing = await storage.getDesignLockedOverlay(id);
      if (!existing) {
        return res.status(404).json({ message: "Design overlay not found" });
      }

      await storage.updateDesignLockedOverlay(id, { isActive: false });
      res.json({ message: "Overlay deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating design overlay:", error);
      res.status(500).json({ message: "Failed to deactivate design overlay" });
    }
  });

  // ==================== GENERATION REQUESTS ====================

  // POST /api/design-lab/generate - Start AI generation request
  app.post('/api/design-lab/generate', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const { 
        projectId, 
        prompt, 
        requestType = 'base_generation', 
        style = 'athletic', 
        productType,
        textContent,
        fontFamily,
        fontSize,
        textColor,
        focusArea,
        // New extended workflow parameters
        primaryColor,
        stylePresetId,
        promptModifier,
        designTheme,
        keyElements,
        thingsToAvoid
      } = req.body;

      // Validate based on request type
      if (requestType === 'base_generation') {
        if (!projectId || !prompt) {
          return res.status(400).json({ message: "projectId and prompt are required for base_generation" });
        }
      } else if (requestType === 'typography_iteration') {
        if (!projectId || !textContent) {
          return res.status(400).json({ message: "projectId and textContent are required for typography_iteration" });
        }
      } else {
        return res.status(400).json({ message: "Invalid requestType. Must be 'base_generation' or 'typography_iteration'" });
      }

      // Verify project exists and user has access
      const project = await storage.getDesignProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (project.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Build input config based on request type
      const inputConfig = requestType === 'typography_iteration' 
        ? { textContent, fontFamily, fontSize, textColor, focusArea }
        : { 
            style, 
            productType, 
            primaryColor, 
            stylePresetId, 
            promptModifier, 
            designTheme, 
            keyElements, 
            thingsToAvoid 
          };

      // Create generation request record
      const generationRequest = await storage.createDesignGenerationRequest({
        projectId,
        prompt: requestType === 'typography_iteration' ? textContent : prompt,
        requestType,
        inputConfig,
        status: 'processing',
        progress: 0,
        aiProvider: 'openai',
      });

      // Update project status
      await storage.updateDesignProject(projectId, { status: 'generating' });

      // Start async generation (don't await - return immediately)
      (async () => {
        try {
          await storage.updateDesignGenerationRequest(generationRequest.id, { progress: 10 });

          // Get existing versions for numbering
          const versions = await storage.getDesignVersions(projectId);
          const nextVersionNumber = versions.length + 1;

          let newVersion;

          if (requestType === 'typography_iteration') {
            // For typography iteration, get the current version's image as base
            let baseImageBase64 = '';
            if (project.currentVersionId) {
              const currentVersion = await storage.getDesignVersion(project.currentVersionId);
              if (currentVersion?.frontImageUrl) {
                // Extract base64 from data URL if present
                const dataUrlMatch = currentVersion.frontImageUrl.match(/^data:image\/\w+;base64,(.+)$/);
                baseImageBase64 = dataUrlMatch ? dataUrlMatch[1] : currentVersion.frontImageUrl;
              }
            }

            await storage.updateDesignGenerationRequest(generationRequest.id, { progress: 30 });

            const typographyResult = await generateTypographyIteration({
              baseImageBase64,
              textContent,
              fontFamily,
              fontSize,
              textColor,
              focusArea: focusArea as 'chest' | 'back' | 'sleeve' | 'full' | undefined,
              style,
            });

            await storage.updateDesignGenerationRequest(generationRequest.id, { progress: 80 });

            newVersion = await storage.createDesignVersion({
              projectId,
              versionNumber: nextVersionNumber,
              name: `Typography v${nextVersionNumber}`,
              frontImageUrl: `data:image/png;base64,${typographyResult.modifiedImageBase64}`,
              generationPrompt: textContent,
              generationProvider: typographyResult.provider,
              generationDuration: typographyResult.durationMs,
              createdBy: user.id,
            });

            // Complete the generation request
            await storage.updateDesignGenerationRequest(generationRequest.id, {
              status: 'completed',
              progress: 100,
              versionId: newVersion.id,
              modelVersion: 'gpt-image-1',
              durationMs: typographyResult.durationMs,
              resultImageUrls: [
                `data:image/png;base64,${typographyResult.modifiedImageBase64.substring(0, 100)}...`,
              ],
            });
          } else {
            // Base generation - with extended workflow parameters
            const result = await generateBaseDesign({
              prompt,
              style: style as 'athletic' | 'modern' | 'vintage' | 'bold',
              productType,
              // Extended workflow parameters
              primaryColor,
              stylePresetId,
              stylePresetModifier: promptModifier,
              designTheme,
              keyElements,
              thingsToAvoid,
            });

            await storage.updateDesignGenerationRequest(generationRequest.id, { progress: 80 });

            newVersion = await storage.createDesignVersion({
              projectId,
              versionNumber: nextVersionNumber,
              name: `Generated v${nextVersionNumber}`,
              frontImageUrl: `data:image/png;base64,${result.frontImageBase64}`,
              backImageUrl: `data:image/png;base64,${result.backImageBase64}`,
              generationPrompt: prompt,
              generationProvider: result.provider,
              generationDuration: result.durationMs,
              createdBy: user.id,
            });

            // Complete the generation request
            await storage.updateDesignGenerationRequest(generationRequest.id, {
              status: 'completed',
              progress: 100,
              versionId: newVersion.id,
              modelVersion: result.modelVersion,
              durationMs: result.durationMs,
              resultImageUrls: [
                `data:image/png;base64,${result.frontImageBase64.substring(0, 100)}...`,
                `data:image/png;base64,${result.backImageBase64.substring(0, 100)}...`,
              ],
            });
          }

          // Generate composite images if variant has templates
          try {
            const compositeResult = await generateCompositeImages(
              projectId,
              newVersion.frontImageUrl || undefined,
              newVersion.backImageUrl || undefined
            );
            
            if (compositeResult.compositeFrontUrl || compositeResult.compositeBackUrl) {
              await storage.updateDesignVersion(newVersion.id, {
                compositeFrontUrl: compositeResult.compositeFrontUrl,
                compositeBackUrl: compositeResult.compositeBackUrl,
              });
            }
          } catch (compositeError) {
            console.warn(`Composite generation failed for version ${newVersion.id}:`, compositeError);
          }

          // Update project with new version
          await storage.updateDesignProject(projectId, {
            currentVersionId: newVersion.id,
            status: 'in_progress',
          });

          console.log(`Generation ${generationRequest.requestCode} completed successfully`);
        } catch (error) {
          console.error(`Generation ${generationRequest.requestCode} failed:`, error);
          await storage.updateDesignGenerationRequest(generationRequest.id, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Generation failed',
          });
          await storage.updateDesignProject(projectId, { status: 'draft' });
        }
      })();

      // Return immediately with the request info
      res.status(202).json({
        message: "Generation started",
        request: generationRequest,
        pollUrl: `/api/design-lab/generate/${generationRequest.id}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating generation request:", error);
      res.status(500).json({ message: "Failed to create generation request" });
    }
  });

  // GET /api/design-lab/generate/:requestId - Get generation status/progress
  app.get('/api/design-lab/generate/:requestId', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        // Try as code
        const request = await storage.getDesignGenerationRequestByCode(req.params.requestId);
        if (!request) {
          return res.status(404).json({ message: "Generation request not found" });
        }
        return res.json(request);
      }

      const request = await storage.getDesignGenerationRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Generation request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching generation request:", error);
      res.status(500).json({ message: "Failed to fetch generation request" });
    }
  });

  // POST /api/design-lab/generate/:requestId/cancel - Cancel pending generation
  app.post('/api/design-lab/generate/:requestId/cancel', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      const existing = await storage.getDesignGenerationRequest(requestId);
      if (!existing) {
        return res.status(404).json({ message: "Generation request not found" });
      }

      if (existing.status !== 'pending' && existing.status !== 'processing') {
        return res.status(400).json({ message: "Cannot cancel request that is not pending or processing" });
      }

      const updated = await storage.updateDesignGenerationRequest(requestId, { 
        status: 'cancelled' as any 
      });

      res.json({ message: "Generation request cancelled", request: updated });
    } catch (error) {
      console.error("Error cancelling generation request:", error);
      res.status(500).json({ message: "Failed to cancel generation request" });
    }
  });

  // ==================== FINALIZE PROJECT ====================

  // POST /api/design-lab/projects/:id/finalize - Finalize a project and optionally attach to design job
  app.post('/api/design-lab/projects/:id/finalize', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const user = (req as AuthenticatedRequest).user.userData!;
      const { designJobId } = req.body;

      const project = await storage.getDesignProject(id);
      if (!project) {
        return res.status(404).json({ message: "Design project not found" });
      }

      if (project.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!project.currentVersionId) {
        return res.status(400).json({ message: "Cannot finalize project without a design version" });
      }

      const currentVersion = await storage.getDesignVersion(project.currentVersionId);
      if (!currentVersion) {
        return res.status(400).json({ message: "Current version not found" });
      }

      const updates: any = {
        status: 'finalized',
      };

      if (designJobId !== undefined) {
        const parsedJobId = parseInt(designJobId);
        if (!isNaN(parsedJobId)) {
          const designJob = await storage.getDesignJob(parsedJobId);
          if (!designJob) {
            return res.status(404).json({ message: "Design job not found" });
          }
          updates.designJobId = parsedJobId;

          const renditionUrls: string[] = [];
          if (currentVersion.frontImageUrl) {
            renditionUrls.push(currentVersion.frontImageUrl);
          }
          if (currentVersion.backImageUrl) {
            renditionUrls.push(currentVersion.backImageUrl);
          }
          if (currentVersion.compositeFrontUrl) {
            renditionUrls.push(currentVersion.compositeFrontUrl);
          }
          if (currentVersion.compositeBackUrl) {
            renditionUrls.push(currentVersion.compositeBackUrl);
          }

          const existingRenditions = designJob.renditionUrls || [];
          const updatedRenditions = [...existingRenditions, ...renditionUrls];

          await storage.updateDesignJob(parsedJobId, {
            renditionUrls: updatedRenditions,
            renditionCount: updatedRenditions.length,
            status: 'completed',
          });
        } else if (designJobId === null) {
          updates.designJobId = null;
        }
      }

      const updated = await storage.updateDesignProject(id, updates);
      if (!updated) {
        return res.status(500).json({ message: "Failed to update project" });
      }

      let currentVersionData = null;
      let layers: any[] = [];
      if (updated.currentVersionId) {
        currentVersionData = await storage.getDesignVersion(updated.currentVersionId);
        if (currentVersionData) {
          layers = await storage.getDesignLayers(currentVersionData.id);
        }
      }

      res.json({ 
        ...updated, 
        currentVersion: currentVersionData, 
        layers,
        message: "Project finalized successfully" 
      });
    } catch (error) {
      console.error("Error finalizing design project:", error);
      res.status(500).json({ message: "Failed to finalize design project" });
    }
  });

  // ==================== AI TRAINING SETS (ADMIN) ====================

  // GET /api/design-lab/admin/training-sets - List all training sets
  app.get('/api/design-lab/admin/training-sets', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const trainingSets = await storage.getDesignAiTrainingSets();
      res.json(trainingSets);
    } catch (error) {
      console.error("Error fetching training sets:", error);
      res.status(500).json({ message: "Failed to fetch training sets" });
    }
  });

  // POST /api/design-lab/admin/training-sets - Create training set
  app.post('/api/design-lab/admin/training-sets', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const parsed = insertDesignAiTrainingSetSchema.parse({
        ...req.body,
        createdBy: user.id,
      });

      const trainingSet = await storage.createDesignAiTrainingSet(parsed);
      res.status(201).json(trainingSet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating training set:", error);
      res.status(500).json({ message: "Failed to create training set" });
    }
  });

  // GET /api/design-lab/admin/training-sets/:id - Get training set with images
  app.get('/api/design-lab/admin/training-sets/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid training set ID" });
      }

      const trainingSet = await storage.getDesignAiTrainingSet(id);
      if (!trainingSet) {
        return res.status(404).json({ message: "Training set not found" });
      }

      const images = await storage.getDesignAiTrainingImages(id);
      res.json({ ...trainingSet, images });
    } catch (error) {
      console.error("Error fetching training set:", error);
      res.status(500).json({ message: "Failed to fetch training set" });
    }
  });

  // PATCH /api/design-lab/admin/training-sets/:id - Update training set
  app.patch('/api/design-lab/admin/training-sets/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid training set ID" });
      }

      const allowedFields = ['name', 'description', 'category', 'status'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignAiTrainingSet(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Training set not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating training set:", error);
      res.status(500).json({ message: "Failed to update training set" });
    }
  });

  // DELETE /api/design-lab/admin/training-sets/:id - Delete training set
  app.delete('/api/design-lab/admin/training-sets/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid training set ID" });
      }

      await storage.deleteDesignAiTrainingSet(id);
      res.json({ message: "Training set deleted successfully" });
    } catch (error) {
      console.error("Error deleting training set:", error);
      res.status(500).json({ message: "Failed to delete training set" });
    }
  });

  // ==================== AI TRAINING IMAGES (ADMIN) ====================

  // POST /api/design-lab/admin/training-sets/:id/images - Add training image
  app.post('/api/design-lab/admin/training-sets/:id/images', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const trainingSetId = parseInt(req.params.id);
      if (isNaN(trainingSetId)) {
        return res.status(400).json({ message: "Invalid training set ID" });
      }

      const trainingSet = await storage.getDesignAiTrainingSet(trainingSetId);
      if (!trainingSet) {
        return res.status(404).json({ message: "Training set not found" });
      }

      const parsed = insertDesignAiTrainingImageSchema.parse({
        ...req.body,
        trainingSetId,
        uploadedBy: user.id,
      });

      const image = await storage.createDesignAiTrainingImage(parsed);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error adding training image:", error);
      res.status(500).json({ message: "Failed to add training image" });
    }
  });

  // DELETE /api/design-lab/admin/training-images/:id - Delete training image
  app.delete('/api/design-lab/admin/training-images/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }

      await storage.deleteDesignAiTrainingImage(id);
      res.json({ message: "Training image deleted successfully" });
    } catch (error) {
      console.error("Error deleting training image:", error);
      res.status(500).json({ message: "Failed to delete training image" });
    }
  });

  // ==================== STYLE PRESETS (ADMIN + PUBLIC) ====================

  // GET /api/design-lab/style-presets - List all active style presets (public)
  app.get('/api/design-lab/style-presets', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const presets = await storage.getDesignStylePresets();
      res.json(presets);
    } catch (error) {
      console.error("Error fetching style presets:", error);
      res.status(500).json({ message: "Failed to fetch style presets" });
    }
  });

  // POST /api/design-lab/admin/style-presets - Create style preset (admin)
  app.post('/api/design-lab/admin/style-presets', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const parsed = insertDesignStylePresetSchema.parse(req.body);
      const preset = await storage.createDesignStylePreset(parsed);
      res.status(201).json(preset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating style preset:", error);
      res.status(500).json({ message: "Failed to create style preset" });
    }
  });

  // PATCH /api/design-lab/admin/style-presets/:id - Update style preset (admin)
  app.patch('/api/design-lab/admin/style-presets/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid preset ID" });
      }

      const allowedFields = ['name', 'description', 'promptModifier', 'thumbnailUrl', 'sortOrder', 'category'];
      const updates: any = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      const updated = await storage.updateDesignStylePreset(id, updates);
      if (!updated) {
        return res.status(404).json({ message: "Style preset not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating style preset:", error);
      res.status(500).json({ message: "Failed to update style preset" });
    }
  });

  // DELETE /api/design-lab/admin/style-presets/:id - Delete style preset (admin)
  app.delete('/api/design-lab/admin/style-presets/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid preset ID" });
      }

      await storage.deleteDesignStylePreset(id);
      res.json({ message: "Style preset deleted successfully" });
    } catch (error) {
      console.error("Error deleting style preset:", error);
      res.status(500).json({ message: "Failed to delete style preset" });
    }
  });
}
