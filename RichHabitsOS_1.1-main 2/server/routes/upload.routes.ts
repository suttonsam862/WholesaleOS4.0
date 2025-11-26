import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, type AuthenticatedRequest } from "./shared/middleware";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";
import { FileUploadSecurityService } from "../fileUploadSecurity";

export function registerUploadRoutes(app: Express): void {
  // Serve public objects (e.g., logos, product images)
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    console.log(`📷 [Public Objects] Requesting: ${filePath}`);
    
    try {
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        console.log(`❌ [Public Objects] File not found: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }
      console.log(`✅ [Public Objects] Found file: ${filePath}`);
      await objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      // Check for specific error types
      if (error.message?.includes('PUBLIC_OBJECT_SEARCH_PATHS not set')) {
        console.error("❌ [Public Objects] Object storage not configured properly");
        return res.status(503).json({ 
          error: "Object storage not configured",
          details: "PUBLIC_OBJECT_SEARCH_PATHS environment variable not set" 
        });
      }
      if (error.message?.includes('Replit')) {
        console.error("❌ [Public Objects] Object storage requires Replit environment");
        return res.status(503).json({ 
          error: "Object storage unavailable",
          details: "Object storage requires Replit environment" 
        });
      }
      console.error("❌ [Public Objects] Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects with authentication and ACL check
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = (req as AuthenticatedRequest).user?.userData?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: 'read' as any,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Image upload endpoint
  app.post('/api/upload/image', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { filename, size, mimeType } = req.body;

      if (!filename || !size || !mimeType) {
        return res.status(400).json({ 
          message: "Missing required fields: filename, size, mimeType" 
        });
      }

      // Validate file upload security
      const validationResult = await FileUploadSecurityService.validateFileUpload({
        filename,
        size,
        mimeType,
        fileCategory: 'images'
      });

      if (!validationResult.valid) {
        console.error("File upload validation failed:", validationResult.errors);
        return res.status(400).json({ 
          message: "File validation failed",
          errors: validationResult.errors 
        });
      }

      // Log security warnings if any
      if (validationResult.securityWarnings.length > 0) {
        console.warn("File upload security warnings:", validationResult.securityWarnings);
      }

      // Get presigned URL for upload
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProductImageUploadURL();

      // Use normalizeObjectEntityPath to properly extract the public path
      // This ensures the PUBLIC_OBJECT_SEARCH_PATHS prefix is stripped correctly
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      // Remove the /public-objects/ prefix to get just the object path
      const objectPath = normalizedPath.startsWith('/public-objects/') 
        ? normalizedPath.slice('/public-objects/'.length)
        : normalizedPath;

      console.log(`📤 [UPLOAD] Upload URL: ${uploadURL}`);
      console.log(`📤 [UPLOAD] Normalized path: ${normalizedPath}`);
      console.log(`📤 [UPLOAD] Object path: ${objectPath}`);

      // Log upload request for security audit
      console.log(`📁 [Upload] User ${(req as AuthenticatedRequest).user.userData?.email} requesting upload: ${validationResult.sanitizedFilename}`);
      res.json({
        uploadURL,
        uploadId: objectPath,
        sanitizedFilename: validationResult.sanitizedFilename,
        securityWarnings: validationResult.securityWarnings
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // File upload endpoint for design files (PSDs, AI, etc.) - supports larger files
  app.post('/api/upload/file', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { filename, size, mimeType } = req.body;

      if (!filename || !size || !mimeType) {
        return res.status(400).json({ 
          message: "Missing required fields: filename, size, mimeType" 
        });
      }

      // Validate file upload security for design files
      const validationResult = await FileUploadSecurityService.validateFileUpload({
        filename,
        size,
        mimeType,
        fileCategory: 'design_files'
      });

      if (!validationResult.valid) {
        console.error("File upload validation failed:", validationResult.errors);
        return res.status(400).json({ 
          message: "File validation failed",
          errors: validationResult.errors 
        });
      }

      // Log security warnings if any
      if (validationResult.securityWarnings.length > 0) {
        console.warn("File upload security warnings:", validationResult.securityWarnings);
      }

      // Get presigned URL for upload
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProductImageUploadURL();

      // Use normalizeObjectEntityPath to properly extract the public path
      // This ensures the PUBLIC_OBJECT_SEARCH_PATHS prefix is stripped correctly
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      // Remove the /public-objects/ prefix to get just the object path
      const objectPath = normalizedPath.startsWith('/public-objects/') 
        ? normalizedPath.slice('/public-objects/'.length)
        : normalizedPath;

      console.log(`📤 [FILE UPLOAD] Upload URL: ${uploadURL}`);
      console.log(`📤 [FILE UPLOAD] Normalized path: ${normalizedPath}`);
      console.log(`📤 [FILE UPLOAD] Object path: ${objectPath}`);

      // Log upload request for security audit
      console.log(`📁 [Upload File] User ${(req as AuthenticatedRequest).user.userData?.email} requesting upload: ${validationResult.sanitizedFilename}`);
      console.log(`📁 [Upload File] File size: ${(size / (1024 * 1024)).toFixed(2)}MB`);
      res.json({
        uploadURL,
        uploadId: objectPath,
        sanitizedFilename: validationResult.sanitizedFilename,
        securityWarnings: validationResult.securityWarnings
      });
    } catch (error) {
      console.error("Error generating upload URL for file:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // Update order line item image
  app.patch('/api/order-line-items/:id/image', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { imageUrl } = req.body;

      if (!imageUrl || typeof imageUrl !== 'string') {
        return res.status(400).json({ message: "imageUrl is required" });
      }

      // Update the line item
      const updatedLineItem = await storage.updateOrderLineItem(id, { imageUrl });

      res.json(updatedLineItem);
    } catch (error) {
      console.error("Error updating order line item image:", error);
      res.status(500).json({ message: "Failed to update order line item image" });
    }
  });
}