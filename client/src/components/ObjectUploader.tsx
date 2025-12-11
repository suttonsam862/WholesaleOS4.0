import { useState, useRef } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onGetUploadParameters: (file: any) => Promise<{
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
    uploadId?: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  allowedFileTypes = ['image/*'],
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const uploadIdMapRef = useRef<Map<string, string>>(new Map());
  
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          const result = await onGetUploadParameters(file);
          if (result.uploadId) {
            uploadIdMapRef.current.set(file.id, result.uploadId);
          }
          return {
            method: result.method,
            url: result.url,
            headers: result.headers,
          };
        },
      })
      .on("complete", (result) => {
        const enhancedResult = {
          ...result,
          successful: result.successful?.map((file) => ({
            ...file,
            uploadId: uploadIdMapRef.current.get(file.id),
          })),
        };
        uploadIdMapRef.current.clear();
        onComplete?.(enhancedResult as any);
        setShowModal(false);
      })
  );

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)} 
        className={buttonClassName}
        type="button"
        data-testid="button-upload-image"
      >
        {children}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl h-[600px] p-0" aria-describedby="upload-description">
          <DialogTitle className="sr-only">Upload File</DialogTitle>
          <DialogDescription id="upload-description" className="sr-only">
            Select and upload files. Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB
          </DialogDescription>
          <Dashboard
            uppy={uppy}
            proudlyDisplayPoweredByUppy={false}
            height={580}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}