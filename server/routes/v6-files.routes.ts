/**
 * V6 File Storage Routes
 * API endpoints for file upload, download, and asset library management
 */

import { Router, Response } from "express";
import multer from "multer";
import { isAuthenticated, loadUserData } from "./shared/middleware";
import { fileStorageService, FOLDER_TYPES, type FolderType } from "../services/file-storage.service";
import { activityLogService } from "../services/activity-log.service";
import { z } from "zod";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// ============================================================================
// File Upload Endpoints
// ============================================================================

/**
 * Upload a single file
 * POST /api/v6/files/upload
 */
router.post(
  "/upload",
  isAuthenticated,
  loadUserData,
  upload.single("file"),
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { organizationId, folder, description, tags, entityType, entityId } = req.body;

      // Upload file
      const uploadedFile = await fileStorageService.uploadFile(
        {
          originalFilename: file.originalname,
          buffer: file.buffer,
          mimeType: file.mimetype,
        },
        {
          organizationId: organizationId ? parseInt(organizationId) : undefined,
          folder: folder as FolderType,
          description,
          tags: tags ? JSON.parse(tags) : undefined,
          uploadedByUserId: userId,
        }
      );

      // If entity provided, link the file
      let link;
      if (entityType && entityId) {
        link = await fileStorageService.linkFile(uploadedFile.id, {
          entityType,
          entityId,
          linkedByUserId: userId,
        });

        // Log the activity
        await activityLogService.logFileUpload(
          entityType,
          entityId,
          userId,
          uploadedFile.originalFilename,
          uploadedFile.id,
          folder
        );
      }

      res.json({ file: uploadedFile, link });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  }
);

/**
 * Upload multiple files
 * POST /api/v6/files/upload-multiple
 */
router.post(
  "/upload-multiple",
  isAuthenticated,
  loadUserData,
  upload.array("files", 20),
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const { organizationId, folder, entityType, entityId } = req.body;
      const results = [];

      for (const file of files) {
        const uploadedFile = await fileStorageService.uploadFile(
          {
            originalFilename: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
          },
          {
            organizationId: organizationId ? parseInt(organizationId) : undefined,
            folder: folder as FolderType,
            uploadedByUserId: userId,
          }
        );

        let link;
        if (entityType && entityId) {
          link = await fileStorageService.linkFile(uploadedFile.id, {
            entityType,
            entityId,
            linkedByUserId: userId,
          });
        }

        results.push({ file: uploadedFile, link });
      }

      // Log bulk upload activity
      if (entityType && entityId) {
        await activityLogService.createActivity({
          entityType,
          entityId,
          activityType: "file_upload",
          userId,
          content: `Uploaded ${files.length} files`,
          metadata: { fileCount: files.length },
        });
      }

      res.json({ files: results });
    } catch (error: any) {
      console.error("Multiple file upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload files" });
    }
  }
);

// ============================================================================
// File Link Endpoints
// ============================================================================

/**
 * Link an existing file to an entity
 * POST /api/v6/files/link
 */
router.post(
  "/link",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const schema = z.object({
        fileId: z.string(),
        entityType: z.string(),
        entityId: z.string(),
        linkType: z.string().optional(),
        folder: z.string().optional(),
        isPrimary: z.boolean().optional(),
        isCustomerVisible: z.boolean().optional(),
        sortOrder: z.number().optional(),
      });

      const data = schema.parse(req.body);

      const link = await fileStorageService.linkFile(data.fileId, {
        entityType: data.entityType,
        entityId: data.entityId,
        linkType: data.linkType,
        folder: data.folder,
        isPrimary: data.isPrimary,
        isCustomerVisible: data.isCustomerVisible,
        sortOrder: data.sortOrder,
        linkedByUserId: userId,
      });

      res.json({ link });
    } catch (error: any) {
      console.error("File link error:", error);
      res.status(500).json({ error: error.message || "Failed to link file" });
    }
  }
);

/**
 * Unlink a file from an entity
 * DELETE /api/v6/files/link/:linkId
 */
router.delete(
  "/link/:linkId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await fileStorageService.unlinkFile(req.params.linkId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("File unlink error:", error);
      res.status(500).json({ error: error.message || "Failed to unlink file" });
    }
  }
);

// ============================================================================
// File Retrieval Endpoints
// ============================================================================

/**
 * Get files for an entity
 * GET /api/v6/files/entity/:entityType/:entityId
 */
router.get(
  "/entity/:entityType/:entityId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;
      const { folder } = req.query;

      const files = await fileStorageService.getEntityFiles(
        entityType,
        entityId,
        folder as string | undefined
      );

      res.json({ files });
    } catch (error: any) {
      console.error("Get entity files error:", error);
      res.status(500).json({ error: error.message || "Failed to get files" });
    }
  }
);

/**
 * Get organization asset library
 * GET /api/v6/files/organization/:orgId/assets
 */
router.get(
  "/organization/:orgId/assets",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const organizationId = parseInt(req.params.orgId);
      const { folder } = req.query;

      const files = await fileStorageService.getOrganizationAssets(
        organizationId,
        folder as FolderType | undefined
      );

      res.json({ files });
    } catch (error: any) {
      console.error("Get organization assets error:", error);
      res.status(500).json({ error: error.message || "Failed to get assets" });
    }
  }
);

/**
 * Get organization storage stats
 * GET /api/v6/files/organization/:orgId/storage
 */
router.get(
  "/organization/:orgId/storage",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const organizationId = parseInt(req.params.orgId);
      const stats = await fileStorageService.getOrganizationStorageStats(organizationId);
      res.json(stats);
    } catch (error: any) {
      console.error("Get storage stats error:", error);
      res.status(500).json({ error: error.message || "Failed to get storage stats" });
    }
  }
);

/**
 * Get a single file by ID
 * GET /api/v6/files/:fileId
 */
router.get(
  "/:fileId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const file = await fileStorageService.getFileById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json({ file });
    } catch (error: any) {
      console.error("Get file error:", error);
      res.status(500).json({ error: error.message || "Failed to get file" });
    }
  }
);

/**
 * Download a file
 * GET /api/v6/files/:fileId/download
 */
router.get(
  "/:fileId/download",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { stream, filename, mimeType, size } = await fileStorageService.getFileStream(
        req.params.fileId
      );

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", size);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const fileHandle = stream;
      const readStream = fileHandle.createReadStream();
      readStream.pipe(res);

      readStream.on("end", () => {
        fileHandle.close();
      });
    } catch (error: any) {
      console.error("File download error:", error);
      res.status(500).json({ error: error.message || "Failed to download file" });
    }
  }
);

// ============================================================================
// File Management Endpoints
// ============================================================================

/**
 * Archive a file
 * POST /api/v6/files/:fileId/archive
 */
router.post(
  "/:fileId/archive",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await fileStorageService.archiveFile(req.params.fileId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Archive file error:", error);
      res.status(500).json({ error: error.message || "Failed to archive file" });
    }
  }
);

/**
 * Search files
 * GET /api/v6/files/search
 */
router.get(
  "/search",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { q, organizationId, limit } = req.query;

      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query required" });
      }

      const files = await fileStorageService.searchFiles(
        organizationId ? parseInt(organizationId as string) : undefined,
        q,
        limit ? parseInt(limit as string) : 50
      );

      res.json({ files });
    } catch (error: any) {
      console.error("Search files error:", error);
      res.status(500).json({ error: error.message || "Failed to search files" });
    }
  }
);

// ============================================================================
// ZIP Download Endpoints
// ============================================================================

/**
 * Create a ZIP download job
 * POST /api/v6/files/zip
 */
router.post(
  "/zip",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId, folder, fileIds } = req.body;

      const jobId = await fileStorageService.createZipJob(
        userId,
        entityType,
        entityId,
        folder,
        fileIds
      );

      res.json({ jobId });
    } catch (error: any) {
      console.error("Create ZIP job error:", error);
      res.status(500).json({ error: error.message || "Failed to create ZIP job" });
    }
  }
);

/**
 * Get ZIP job status
 * GET /api/v6/files/zip/:jobId
 */
router.get(
  "/zip/:jobId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const status = await fileStorageService.getZipJobStatus(req.params.jobId);
      res.json(status);
    } catch (error: any) {
      console.error("Get ZIP status error:", error);
      res.status(500).json({ error: error.message || "Failed to get ZIP status" });
    }
  }
);

/**
 * Get available folder types
 * GET /api/v6/files/folders
 */
router.get(
  "/folders",
  isAuthenticated,
  loadUserData,
  (req: any, res: Response) => {
    const userId = req.user?.userData?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.json({ folders: FOLDER_TYPES });
  }
);

export default router;
