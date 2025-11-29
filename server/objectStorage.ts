import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      // Get the ACL policy for the object.
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `${
          isPublic ? "public" : "private"
        }, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  // Gets an object as a Buffer (for PDF embedding, etc.)
  async getObjectAsBuffer(file: File): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = file.createReadStream();

      stream.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on("error", (err) => {
        reject(err);
      });
    });
  }

  // Fetches an image from a URL path (supports both object storage and relative URLs)
  // baseUrl should be derived from the request (e.g., "https://myapp.repl.co")
  async fetchImageAsBuffer(imagePath: string, baseUrl?: string): Promise<Buffer | null> {
    try {
      // Handle external URLs first (https://)
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        const response = await fetch(imagePath);
        if (response.ok) {
          return Buffer.from(await response.arrayBuffer());
        }
        console.warn(`[ObjectStorage] Failed to fetch external URL: ${imagePath} - ${response.status}`);
        return null;
      }

      // Handle object storage paths - try direct access first, then HTTP fallback
      if (imagePath.startsWith("/objects/")) {
        try {
          const file = await this.getObjectEntityFile(imagePath);
          return await this.getObjectAsBuffer(file);
        } catch (objErr) {
          console.warn(`[ObjectStorage] Object storage lookup failed for ${imagePath}, trying HTTP fallback`);
          // Fall through to HTTP fallback below
        }
      }

      // Handle public object paths - try direct access first, then HTTP fallback
      if (imagePath.startsWith("/public-objects/")) {
        try {
          const relativePath = imagePath.replace("/public-objects/", "");
          const file = await this.searchPublicObject(relativePath);
          if (file) {
            return await this.getObjectAsBuffer(file);
          }
        } catch (pubErr) {
          console.warn(`[ObjectStorage] Public object lookup failed for ${imagePath}, trying HTTP fallback`);
          // Fall through to HTTP fallback below
        }
      }

      // HTTP fallback for all relative paths (including failed object storage lookups)
      if (imagePath.startsWith("/")) {
        // Use provided baseUrl, or environment-derived URL, or localhost as fallback
        let serverUrl: string;
        if (baseUrl) {
          serverUrl = baseUrl;
        } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
          serverUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        } else {
          serverUrl = "http://localhost:5000";
        }
        
        const fullUrl = `${serverUrl}${imagePath}`;
        console.log(`[ObjectStorage] Fetching via HTTP: ${fullUrl}`);
        
        try {
          const response = await fetch(fullUrl);
          if (response.ok) {
            return Buffer.from(await response.arrayBuffer());
          }
          console.warn(`[ObjectStorage] HTTP fetch failed: ${fullUrl} - ${response.status}`);
        } catch (httpErr) {
          console.warn(`[ObjectStorage] HTTP fetch error for ${fullUrl}:`, httpErr);
        }
        return null;
      }

      console.warn(`[ObjectStorage] Unknown image path format: ${imagePath}`);
      return null;
    } catch (error) {
      console.error(`[ObjectStorage] Error fetching image as buffer: ${imagePath}`, error);
      return null;
    }
  }

  // Gets the upload URL for an object entity.
  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    // Sign URL for PUT method with TTL
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the upload URL for product images
  async getProductImageUploadURL(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    const publicPaths = this.getPublicObjectSearchPaths();
    if (publicPaths.length === 0) {
      // Fallback to private directory
      const privateDir = this.getPrivateObjectDir();
      const objectName = `products/${year}/${month}/img_${timestamp}_${randomStr}`;
      const fullPath = `${privateDir}/${objectName}`;
      const { bucketName, objectName: objName } = parseObjectPath(fullPath);
      
      return signObjectURL({
        bucketName,
        objectName: objName,
        method: "PUT",
        ttlSec: 900,
      });
    }

    // Use public path for product images
    const publicPath = publicPaths[0];
    const objectName = `products/${year}/${month}/img_${timestamp}_${randomStr}`;
    const fullPath = `${publicPath}/${objectName}`;
    const { bucketName, objectName: objName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName: objName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  // Gets the object entity file from the object path.
  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(
    rawPath: string,
  ): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
  
    // Extract the path from the URL by removing query parameters and domain
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
  
    // Try to match against private object directory
    try {
      let objectEntityDir = this.getPrivateObjectDir();
      if (!objectEntityDir.endsWith("/")) {
        objectEntityDir = `${objectEntityDir}/`;
      }
    
      if (rawObjectPath.startsWith(objectEntityDir)) {
        // Extract the entity ID from the path
        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
      }
    } catch (e) {
      // Private dir not set, continue
    }

    // Try to match against public paths
    try {
      const publicPaths = this.getPublicObjectSearchPaths();
      for (const publicPath of publicPaths) {
        if (rawObjectPath.startsWith(publicPath)) {
          // Return the path after the public path prefix
          const relativePath = rawObjectPath.slice(publicPath.length);
          return `/public-objects${relativePath}`;
        }
      }
    } catch (e) {
      // Public paths not set, continue
    }
  
    return rawObjectPath;
  }

  // Tries to set the ACL policy for the object entity and return the normalized path.
  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/objects/")) {
      // Public files don't need ACL policy
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  // Checks if the user can access the object entity.
  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = await response.json();
  return signedURL;
}