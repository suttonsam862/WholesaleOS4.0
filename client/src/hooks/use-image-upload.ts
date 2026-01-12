import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

interface UseImageUploadOptions {
  initialUrl?: string;
  onUploadComplete?: (publicUrl: string) => void;
}

interface UseImageUploadReturn {
  uploadedUrl: string;
  setUploadedUrl: (url: string) => void;
  getUploadParameters: (file: File) => Promise<{
    method: "PUT";
    url: string;
    headers: Record<string, string>;
  }>;
  handleUploadComplete: (result: any) => string | null;
  resetUpload: () => void;
}

/**
 * Hook for handling image uploads with correct URL pattern.
 * 
 * IMPORTANT: This hook ensures that:
 * 1. The uploadId is stored in the file object during upload
 * 2. The public URL is constructed from uploadId, NOT the signed uploadURL
 * 3. The public URL uses the format: /public-objects/${uploadId}
 * 
 * NEVER use result.successful[0].uploadURL for persistence - it's a signed URL that expires!
 */
export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const [uploadedUrl, setUploadedUrl] = useState<string>(options.initialUrl || "");

  const getUploadParameters = useCallback(async (file: File) => {
    const response = await apiRequest("POST", "/api/upload/image", {
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    }) as { uploadURL: string; uploadId: string };

    // Store uploadId in file object for retrieval in onComplete
    (file as any).__uploadId = response.uploadId;

    return {
      method: "PUT" as const,
      url: response.uploadURL,
      headers: {
        "Content-Type": file.type,
      },
    };
  }, []);

  const handleUploadComplete = useCallback((result: any): string | null => {
    if (result.successful?.[0]) {
      const uploadId = (result.successful[0] as any).__uploadId;
      if (uploadId) {
        const publicUrl = `/public-objects/${uploadId}`;
        setUploadedUrl(publicUrl);
        options.onUploadComplete?.(publicUrl);
        return publicUrl;
      }
    }
    return null;
  }, [options.onUploadComplete]);

  const resetUpload = useCallback(() => {
    setUploadedUrl("");
  }, []);

  return {
    uploadedUrl,
    setUploadedUrl,
    getUploadParameters,
    handleUploadComplete,
    resetUpload,
  };
}

/**
 * Helper function to get upload parameters for ObjectUploader.
 * Use this in onGetUploadParameters callback.
 * 
 * @example
 * onGetUploadParameters={async (file) => {
 *   const response = await apiRequest("POST", "/api/upload/image", {...});
 *   (file as any).__uploadId = response.uploadId;
 *   return { method: "PUT", url: response.uploadURL, headers: {...} };
 * }}
 */
export async function getImageUploadParams(file: File, endpoint = "/api/upload/image") {
  const response = await apiRequest("POST", endpoint, {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
  }) as { uploadURL: string; uploadId: string };

  (file as any).__uploadId = response.uploadId;

  return {
    method: "PUT" as const,
    url: response.uploadURL,
    headers: {
      "Content-Type": file.type,
    },
  };
}

/**
 * Helper function to extract public URL from upload result.
 * Use this in onComplete callback.
 * 
 * @example
 * onComplete={(result) => {
 *   const publicUrl = getPublicUrlFromUploadResult(result);
 *   if (publicUrl) {
 *     setImageUrl(publicUrl);
 *     form.setValue("imageUrl", publicUrl);
 *   }
 * }}
 */
export function getPublicUrlFromUploadResult(result: any): string | null {
  if (result.successful?.[0]) {
    const uploadId = (result.successful[0] as any).__uploadId;
    if (uploadId) {
      return `/public-objects/${uploadId}`;
    }
  }
  return null;
}

/**
 * Helper to get multiple public URLs from a multi-file upload result.
 */
export function getPublicUrlsFromUploadResult(result: any): string[] {
  const urls: string[] = [];
  result.successful?.forEach((file: any) => {
    const uploadId = file.__uploadId;
    if (uploadId) {
      urls.push(`/public-objects/${uploadId}`);
    }
  });
  return urls;
}
