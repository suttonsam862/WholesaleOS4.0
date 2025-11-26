import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest, type UserRole } from "./shared/middleware";
import { insertDesignJobSchema, insertDesignResourceSchema } from "@shared/schema";
import { z } from "zod";

export function registerDesignRoutes(app: Express): void {
  // Design Jobs API
  app.get('/api/design-jobs', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const includeArchived = req.query.includeArchived === 'true';
      let designJobs;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin') {
        // Admin users see all design jobs
        designJobs = await storage.getDesignJobs();
      } else if (user.role === 'designer') {
        // Designer users only see jobs assigned to them
        designJobs = await storage.getDesignJobsByDesigner(user.id);
      } else if (user.role === 'sales') {
        // Sales users only see jobs assigned to them
        designJobs = await storage.getDesignJobsBySalesperson(user.id);
      } else {
        // Other roles see all design jobs (if they have read permission)
        designJobs = await storage.getDesignJobs();
      }

      // Filter out archived jobs unless explicitly requested
      if (!includeArchived) {
        designJobs = designJobs.filter((job: any) => !job.archived);
      }

      res.json(designJobs);
    } catch (error) {
      console.error("Error fetching design jobs:", error);
      res.status(500).json({ message: "Failed to fetch design jobs" });
    }
  });

  // Get archived design jobs only
  app.get('/api/design-jobs/archived', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      let designJobs;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin') {
        // Admin users see all design jobs
        designJobs = await storage.getDesignJobs();
      } else if (user.role === 'designer') {
        // Designer users only see jobs assigned to them
        designJobs = await storage.getDesignJobsByDesigner(user.id);
      } else if (user.role === 'sales') {
        // Sales users only see jobs assigned to them
        designJobs = await storage.getDesignJobsBySalesperson(user.id);
      } else {
        // Other roles see all design jobs (if they have read permission)
        designJobs = await storage.getDesignJobs();
      }

      // Filter to only show archived jobs
      const archivedJobs = designJobs.filter((job: any) => job.archived);

      res.json(archivedJobs);
    } catch (error) {
      console.error("Error fetching archived design jobs:", error);
      res.status(500).json({ message: "Failed to fetch archived design jobs" });
    }
  });

  // Bulk design job assignment endpoint (must come before :id routes)
  app.put('/api/design-jobs/bulk-reassign', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const { jobIds, designerId } = req.body;

      // Validate input - create immutable copy to prevent mutation
      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ message: "Job IDs array is required and must not be empty" });
      }

      // Create immutable copy and validate each ID upfront
      const validatedJobIds: number[] = [];
      for (let i = 0; i < jobIds.length; i++) {
        const rawId = jobIds[i];
        
        // Strict type checking and conversion
        let numId: number;
        if (typeof rawId === 'number' && Number.isFinite(rawId)) {
          numId = Math.floor(rawId); // Ensure integer
        } else if (typeof rawId === 'string' && /^\d+$/.test(rawId)) {
          numId = parseInt(rawId, 10);
        } else {
          console.error(`Invalid job ID at index ${i}:`, rawId, typeof rawId);
          return res.status(400).json({ 
            message: `Invalid job ID at position ${i + 1}: must be a positive integer`,
            invalidValue: rawId
          });
        }
        
        if (numId <= 0 || !Number.isInteger(numId)) {
          return res.status(400).json({ 
            message: `Invalid job ID at position ${i + 1}: must be a positive integer`,
            invalidValue: rawId
          });
        }
        
        validatedJobIds.push(numId);
      }

      // Allow null/empty designerId for unassigning jobs
      if (designerId !== null && designerId !== '' && typeof designerId !== 'string') {
        return res.status(400).json({ message: "Target designer ID must be a string or null" });
      }

      // Verify target designer exists and has designer role (only if not null/empty)
      let targetDesigner = null;
      if (designerId && designerId !== '') {
        targetDesigner = await storage.getUser(designerId);
        if (!targetDesigner) {
          return res.status(404).json({ message: "Target designer not found" });
        }

        if (targetDesigner.role !== 'designer') {
          return res.status(400).json({ message: "Target user must have designer role" });
        }
      }

      // Process each design job with isolated error handling
      const results = [];
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;
      const finalDesignerId = designerId === '' || designerId === null ? null : designerId;

      // Process jobs sequentially to avoid connection pool issues
      for (let i = 0; i < validatedJobIds.length; i++) {
        const jobIdNum = validatedJobIds[i];
        
        try {
          // Extra validation before database call
          if (!Number.isInteger(jobIdNum) || jobIdNum <= 0) {
            throw new Error(`Invalid job ID: ${jobIdNum}`);
          }

          // Get existing job with explicit type
          const existingJob = await storage.getDesignJob(jobIdNum);
          if (!existingJob) {
            results.push({ jobId: jobIdNum, success: false, error: "Design job not found" });
            continue;
          }

          // Update the job with new designer
          const updatedJob = await storage.updateDesignJob(jobIdNum, { 
            assignedDesignerId: finalDesignerId
          });

          // Log activity
          await storage.logActivity(
            currentUserId,
            'design_job',
            jobIdNum,
            'reassigned',
            existingJob,
            updatedJob
          );

          results.push({ jobId: jobIdNum, success: true, job: updatedJob });
        } catch (error) {
          console.error(`Error reassigning design job ${jobIdNum} (validated):`, error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.push({ jobId: jobIdNum, success: false, error: errorMessage });
        }
      }

      // Count successes and failures
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      const isUnassignAction = finalDesignerId === null;
      const actionDescription = isUnassignAction
        ? "unassigned"
        : `assigned to ${targetDesigner?.name || targetDesigner?.email}`;

      res.json({
        message: `Bulk reassignment completed: ${successCount} jobs ${actionDescription}, ${failureCount} failed`,
        results,
        summary: { 
          total: validatedJobIds.length, 
          succeeded: successCount, 
          failed: failureCount,
          action: isUnassignAction ? "unassigned" : "assigned",
          targetDesigner: targetDesigner ? { id: targetDesigner.id, name: targetDesigner.name } : null
        }
      });
    } catch (error) {
      console.error("Error in bulk design job reassignment:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reassign design jobs";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.get('/api/design-jobs/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getDesignJob(id);
      if (!job) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can view this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      if (userRole === 'designer' && job.assignedDesignerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === 'sales' && job.salespersonId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching design job:", error);
      res.status(500).json({ message: "Failed to fetch design job" });
    }
  });

  app.post('/api/design-jobs', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      // Sanitize empty strings to undefined for optional date fields
      const sanitizedBody = {
        ...req.body,
        deadline: req.body.deadline === '' ? undefined : req.body.deadline,
      };
      
      // Exclude jobCode from validation since it's auto-generated
      const validatedData = insertDesignJobSchema.omit({ jobCode: true }).parse(sanitizedBody);
      const job = await storage.createDesignJob(validatedData as any);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        job.id,
        'created',
        null,
        job
      );

      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating design job:", error);
      res.status(500).json({ message: "Failed to create design job" });
    }
  });

  app.put('/api/design-jobs/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Sanitize empty strings to undefined for optional date fields
      const sanitizedBody = {
        ...req.body,
        deadline: req.body.deadline === '' ? undefined : req.body.deadline,
      };
      
      const validatedData = insertDesignJobSchema.partial().parse(sanitizedBody);

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.updateDesignJob(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'updated',
        existingJob,
        updatedJob
      );

      res.json(updatedJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating design job:", error);
      res.status(500).json({ message: "Failed to update design job" });
    }
  });

  app.put('/api/design-jobs/:id/status', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!['pending', 'assigned', 'in_progress', 'review', 'approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.updateDesignJobStatus(id, status);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'status_updated',
        { status: existingJob.status },
        { status: updatedJob.status }
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating design job status:", error);
      res.status(500).json({ message: "Failed to update design job status" });
    }
  });

  // Archive design job
  app.put('/api/design-jobs/:id/archive', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can archive this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.updateDesignJob(id, { 
        archived: true,
        archivedAt: new Date()
      });

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'archived',
        existingJob,
        updatedJob
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error archiving design job:", error);
      res.status(500).json({ message: "Failed to archive design job" });
    }
  });

  // Unarchive design job
  app.put('/api/design-jobs/:id/unarchive', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can unarchive this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.updateDesignJob(id, { 
        archived: false,
        archivedAt: null
      });

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'unarchived',
        existingJob,
        updatedJob
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error unarchiving design job:", error);
      res.status(500).json({ message: "Failed to unarchive design job" });
    }
  });

  app.post('/api/design-jobs/:id/renditions', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Rendition URL required" });
      }

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.addDesignJobRendition(id, url);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'rendition_added',
        { renditionCount: existingJob.renditionCount },
        { renditionCount: updatedJob.renditionCount }
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error adding rendition:", error);
      res.status(500).json({ message: "Failed to add rendition" });
    }
  });

  // Update design job attachments
  app.put('/api/design-jobs/:id/attachments', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { logoUrls, designReferenceUrls, additionalFileUrls, designStyleUrl } = req.body;

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      if (userRole === 'designer' && existingJob.assignedDesignerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === 'sales' && existingJob.salespersonId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData: any = {};
      if (logoUrls !== undefined) updateData.logoUrls = logoUrls;
      if (designReferenceUrls !== undefined) updateData.designReferenceUrls = designReferenceUrls;
      if (additionalFileUrls !== undefined) updateData.additionalFileUrls = additionalFileUrls;
      if (designStyleUrl !== undefined) updateData.designStyleUrl = designStyleUrl;

      const updatedJob = await storage.updateDesignJob(id, updateData);

      // Log activity
      await storage.logActivity(
        userId,
        'design_job',
        id,
        'attachments_updated',
        existingJob,
        updatedJob
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating design job attachments:", error);
      res.status(500).json({ message: "Failed to update design job attachments" });
    }
  });

  app.delete('/api/design-jobs/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      await storage.deleteDesignJob(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'deleted',
        existingJob,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting design job:", error);
      res.status(500).json({ message: "Failed to delete design job" });
    }
  });

  // Design job comments endpoints
  app.get('/api/design-jobs/:id/comments', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const job = await storage.getDesignJob(id);
      if (!job) {
        return res.status(404).json({ message: "Design job not found" });
      }

      const comments = await storage.getDesignJobComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching design job comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/design-jobs/:id/comments', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { comment, isInternal } = req.body;

      const job = await storage.getDesignJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Design job not found" });
      }

      const newComment = await storage.createDesignJobComment({
        jobId,
        userId: (req as AuthenticatedRequest).user.userData!.id,
        comment,
        isInternal: isInternal || false,
      });

      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Design Resources routes
  app.get('/api/design-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const resources = await storage.getDesignResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching design resources:", error);
      res.status(500).json({ message: "Failed to fetch design resources" });
    }
  });

  app.get('/api/design-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getDesignResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Design resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error fetching design resource:", error);
      res.status(500).json({ message: "Failed to fetch design resource" });
    }
  });

  app.post('/api/design-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can upload design resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can upload design resources" });
      }

      // Add uploadedBy and defaults before validation
      const dataToValidate = {
        ...req.body,
        uploadedBy: user.id,
        downloads: 0,
      };

      const validatedData = insertDesignResourceSchema.parse(dataToValidate);

      const resource = await storage.createDesignResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating design resource:", error);
      res.status(500).json({ message: "Failed to create design resource" });
    }
  });

  app.put('/api/design-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can update design resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update design resources" });
      }

      const id = parseInt(req.params.id);
      const validatedData = insertDesignResourceSchema.partial().parse(req.body);

      const resource = await storage.updateDesignResource(id, validatedData);
      res.json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating design resource:", error);
      res.status(500).json({ message: "Failed to update design resource" });
    }
  });

  app.delete('/api/design-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can delete design resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete design resources" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteDesignResource(id);
      res.json({ message: "Design resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting design resource:", error);
      res.status(500).json({ message: "Failed to delete design resource" });
    }
  });

  app.post('/api/design-resources/:id/download', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementDesignResourceDownloads(id);
      res.json({ message: "Download count incremented" });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });
}
