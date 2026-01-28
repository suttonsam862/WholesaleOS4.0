/**
 * V6 File Storage Service
 * Handles file uploads, downloads, organization asset libraries, and file linking
 */

import { db } from "../db";
import {
  files,
  fileLinks,
  fileUploads,
  bulkUploadSessions,
  zipJobs,
  organizationStorage,
  type InsertFile,
  type InsertFileLink,
  type File,
  type FileLink,
} from "@shared/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

// File storage configuration
const STORAGE_BASE_PATH = process.env.FILE_STORAGE_PATH || "./uploads";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = [
  // Images
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff",
  // Documents
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv",
  // Design files
  "ai", "psd", "eps", "indd", "sketch", "fig", "xd",
  // Archives
  "zip", "rar", "7z",
  // Other
  "json", "xml",
];

// Folder types for organization
export const FOLDER_TYPES = [
  "logos",
  "brand_guidelines",
  "design_files",
  "misc",
  "customer_uploads",
  "size_sheets",
  "invoices",
  "mockups",
  "production_files",
  "revision_history",
  "customer_feedback",
  "tech_packs",
  "spec_sheets",
  "artwork",
] as const;

export type FolderType = (typeof FOLDER_TYPES)[number];

export interface UploadedFile {
  originalFilename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface FileUploadOptions {
  organizationId?: number;
  folder?: FolderType;
  description?: string;
  tags?: string[];
  uploadedByUserId: string;
}

export interface FileLinkOptions {
  entityType: string;
  entityId: string;
  linkType?: string;
  folder?: string;
  isPrimary?: boolean;
  isCustomerVisible?: boolean;
  sortOrder?: number;
  linkedByUserId: string;
}

export class FileStorageService {
  /**
   * Upload a single file
   */
  async uploadFile(
    file: UploadedFile,
    options: FileUploadOptions
  ): Promise<File> {
    // Validate file extension
    const extension = path.extname(file.originalFilename).toLowerCase().slice(1);
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error(`File extension '${extension}' is not allowed`);
    }

    // Validate file size
    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    // Calculate checksum
    const checksumSha256 = crypto
      .createHash("sha256")
      .update(file.buffer)
      .digest("hex");

    // Check for duplicate by checksum
    const existingFile = await db
      .select()
      .from(files)
      .where(eq(files.checksumSha256, checksumSha256))
      .limit(1);

    if (existingFile.length > 0) {
      // Return existing file instead of duplicating
      return existingFile[0];
    }

    // Generate storage path
    const fileId = crypto.randomUUID();
    const folder = options.folder || "misc";
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const storagePath = path.join(
      folder,
      datePrefix,
      `${fileId}.${extension}`
    );
    const fullPath = path.join(STORAGE_BASE_PATH, storagePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file to storage
    await fs.writeFile(fullPath, file.buffer);

    // Generate thumbnails for images
    let thumbnailPathSm: string | undefined;
    let thumbnailPathMd: string | undefined;
    let thumbnailPathLg: string | undefined;

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      // TODO: Implement thumbnail generation with sharp
      // thumbnailPathSm = await this.generateThumbnail(fullPath, 100);
      // thumbnailPathMd = await this.generateThumbnail(fullPath, 300);
      // thumbnailPathLg = await this.generateThumbnail(fullPath, 800);
    }

    // Insert into database
    const [insertedFile] = await db
      .insert(files)
      .values({
        id: fileId,
        organizationId: options.organizationId,
        originalFilename: file.originalFilename,
        storagePath,
        fileSizeBytes: file.buffer.length,
        mimeType: file.mimeType,
        fileExtension: extension,
        checksumSha256,
        thumbnailPathSm,
        thumbnailPathMd,
        thumbnailPathLg,
        folder,
        description: options.description,
        tags: options.tags,
        uploadedByUserId: options.uploadedByUserId,
      })
      .returning();

    // Update organization storage usage
    if (options.organizationId) {
      await this.updateOrganizationStorage(options.organizationId);
    }

    return insertedFile;
  }

  /**
   * Link a file to an entity
   */
  async linkFile(
    fileId: string,
    options: FileLinkOptions
  ): Promise<FileLink> {
    const [link] = await db
      .insert(fileLinks)
      .values({
        fileId,
        entityType: options.entityType,
        entityId: options.entityId,
        linkType: options.linkType || "attachment",
        folder: options.folder,
        isPrimary: options.isPrimary || false,
        isCustomerVisible: options.isCustomerVisible || false,
        sortOrder: options.sortOrder || 0,
        linkedByUserId: options.linkedByUserId,
      })
      .returning();

    return link;
  }

  /**
   * Upload and link a file in one operation
   */
  async uploadAndLinkFile(
    file: UploadedFile,
    uploadOptions: FileUploadOptions,
    linkOptions: Omit<FileLinkOptions, "linkedByUserId">
  ): Promise<{ file: File; link: FileLink }> {
    const uploadedFile = await this.uploadFile(file, uploadOptions);
    const link = await this.linkFile(uploadedFile.id, {
      ...linkOptions,
      linkedByUserId: uploadOptions.uploadedByUserId,
    });
    return { file: uploadedFile, link };
  }

  /**
   * Get files linked to an entity
   */
  async getEntityFiles(
    entityType: string,
    entityId: string,
    folder?: string
  ): Promise<(FileLink & { file: File })[]> {
    const conditions = [
      eq(fileLinks.entityType, entityType),
      eq(fileLinks.entityId, entityId),
      sql`${fileLinks.deletedAt} IS NULL`,
    ];

    if (folder) {
      conditions.push(eq(fileLinks.folder, folder));
    }

    const links = await db
      .select()
      .from(fileLinks)
      .innerJoin(files, eq(fileLinks.fileId, files.id))
      .where(and(...conditions))
      .orderBy(fileLinks.sortOrder, desc(fileLinks.createdAt));

    return links.map((row) => ({
      ...row.file_links,
      file: row.files,
    }));
  }

  /**
   * Get organization asset library
   */
  async getOrganizationAssets(
    organizationId: number,
    folder?: FolderType
  ): Promise<File[]> {
    const conditions = [
      eq(files.organizationId, organizationId),
      eq(files.isArchived, false),
    ];

    if (folder) {
      conditions.push(eq(files.folder, folder));
    }

    return db
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.createdAt));
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    return file;
  }

  /**
   * Delete a file link (soft delete)
   */
  async unlinkFile(linkId: string): Promise<void> {
    await db
      .update(fileLinks)
      .set({ deletedAt: new Date() })
      .where(eq(fileLinks.id, linkId));
  }

  /**
   * Archive a file
   */
  async archiveFile(fileId: string, userId: string): Promise<void> {
    await db
      .update(files)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedByUserId: userId,
      })
      .where(eq(files.id, fileId));
  }

  /**
   * Update organization storage usage
   */
  async updateOrganizationStorage(organizationId: number): Promise<void> {
    // Calculate current usage
    const result = await db
      .select({
        totalBytes: sql<number>`COALESCE(SUM(${files.fileSizeBytes}), 0)`,
        fileCount: sql<number>`COUNT(*)`,
      })
      .from(files)
      .where(
        and(
          eq(files.organizationId, organizationId),
          eq(files.isArchived, false)
        )
      );

    const { totalBytes, fileCount } = result[0];

    // Upsert organization storage record
    await db
      .insert(organizationStorage)
      .values({
        organizationId,
        usedBytes: totalBytes,
        fileCount,
        lastCalculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: organizationStorage.organizationId,
        set: {
          usedBytes: totalBytes,
          fileCount,
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Get organization storage stats
   */
  async getOrganizationStorageStats(
    organizationId: number
  ): Promise<{
    usedBytes: number;
    quotaBytes: number;
    fileCount: number;
    usagePercent: number;
  }> {
    const [storage] = await db
      .select()
      .from(organizationStorage)
      .where(eq(organizationStorage.organizationId, organizationId))
      .limit(1);

    if (!storage) {
      return {
        usedBytes: 0,
        quotaBytes: 10737418240, // 10 GB default
        fileCount: 0,
        usagePercent: 0,
      };
    }

    return {
      usedBytes: storage.usedBytes,
      quotaBytes: storage.quotaBytes,
      fileCount: storage.fileCount,
      usagePercent: Math.round((storage.usedBytes / storage.quotaBytes) * 100),
    };
  }

  /**
   * Create a ZIP job for bulk download
   */
  async createZipJob(
    userId: string,
    entityType: string,
    entityId: string,
    folder?: string,
    fileIds?: string[]
  ): Promise<string> {
    const zipFilename = `${entityType}-${entityId}-${Date.now()}.zip`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const [job] = await db
      .insert(zipJobs)
      .values({
        requestedByUserId: userId,
        contextType: entityType,
        contextId: entityId,
        folder,
        fileIds,
        zipFilename,
        status: "pending",
        expiresAt,
      })
      .returning();

    // TODO: Queue background job to generate ZIP

    return job.id;
  }

  /**
   * Get ZIP job status
   */
  async getZipJobStatus(
    jobId: string
  ): Promise<{
    status: string;
    progressPercent: number;
    zipPath?: string;
    failureReason?: string;
  }> {
    const [job] = await db
      .select()
      .from(zipJobs)
      .where(eq(zipJobs.id, jobId))
      .limit(1);

    if (!job) {
      throw new Error("ZIP job not found");
    }

    return {
      status: job.status,
      progressPercent: job.progressPercent,
      zipPath: job.zipPath || undefined,
      failureReason: job.failureReason || undefined,
    };
  }

  /**
   * Get file read stream for download
   */
  async getFileStream(fileId: string): Promise<{
    stream: fs.FileHandle;
    filename: string;
    mimeType: string;
    size: number;
  }> {
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    const fullPath = path.join(STORAGE_BASE_PATH, file.storagePath);
    const handle = await fs.open(fullPath, "r");

    return {
      stream: handle,
      filename: file.originalFilename,
      mimeType: file.mimeType,
      size: file.fileSizeBytes,
    };
  }

  /**
   * Search files by name or tags
   */
  async searchFiles(
    organizationId: number | undefined,
    query: string,
    limit = 50
  ): Promise<File[]> {
    const searchPattern = `%${query}%`;

    const conditions = [
      eq(files.isArchived, false),
      sql`(
        ${files.originalFilename} ILIKE ${searchPattern}
        OR ${files.description} ILIKE ${searchPattern}
        OR EXISTS (SELECT 1 FROM unnest(${files.tags}) AS tag WHERE tag ILIKE ${searchPattern})
      )`,
    ];

    if (organizationId) {
      conditions.push(eq(files.organizationId, organizationId));
    }

    return db
      .select()
      .from(files)
      .where(and(...conditions))
      .orderBy(desc(files.createdAt))
      .limit(limit);
  }
}

// Export singleton instance
export const fileStorageService = new FileStorageService();
