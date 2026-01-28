/**
 * V6 File Section Component
 * File management interface with upload, preview, and organization
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Upload,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  ChevronDown,
  FolderOpen,
  Link2,
  X,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

export type FileFolder =
  | "size_sheets"
  | "customer_assets"
  | "tech_packs"
  | "approvals"
  | "design_files"
  | "invoices"
  | "mockups"
  | "production_files"
  | "other";

const FOLDER_CONFIG: Record<FileFolder, { label: string; icon: LucideIcon }> = {
  size_sheets: { label: "Size Sheets", icon: FileSpreadsheet },
  customer_assets: { label: "Customer Assets", icon: ImageIcon },
  tech_packs: { label: "Tech Packs", icon: FileText },
  approvals: { label: "Approvals", icon: FileText },
  design_files: { label: "Design Files", icon: FileCode },
  invoices: { label: "Invoices", icon: FileText },
  mockups: { label: "Mockups", icon: ImageIcon },
  production_files: { label: "Production Files", icon: FileCode },
  other: { label: "Other", icon: File },
};

const FILE_ICONS: Record<string, LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileCode,
  ai: FileCode,
  psd: FileCode,
  zip: FileArchive,
  rar: FileArchive,
};

interface FileRecord {
  id: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  folder?: string;
  description?: string;
  tags?: string[];
  uploadedByUserId: string;
  uploadedByName?: string;
  createdAt: string;
  url?: string;
}

interface FileLink {
  id: string;
  fileId: string;
  entityType: string;
  entityId: string;
  linkType?: string;
  folder?: string;
  isPrimary?: boolean;
  isCustomerVisible?: boolean;
  sortOrder?: number;
  linkedByUserId: string;
  linkedByName?: string;
  createdAt: string;
  file: FileRecord;
}

interface FileSectionProps {
  entityType: string;
  entityId: string;
  organizationId?: number;
  allowUpload?: boolean;
  allowDelete?: boolean;
  showFolders?: FileFolder[];
  defaultFolder?: FileFolder;
  compact?: boolean;
  className?: string;
}

export function FileSection({
  entityType,
  entityId,
  organizationId,
  allowUpload = true,
  allowDelete = true,
  showFolders,
  defaultFolder = "other",
  compact = false,
  className,
}: FileSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState<FileFolder | "all">("all");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch files
  const { data: fileLinks = [], isLoading } = useQuery<FileLink[]>({
    queryKey: [`/api/v6/files/entity/${entityType}/${entityId}`],
    queryFn: async () => {
      const res = await fetch(`/api/v6/files/entity/${entityType}/${entityId}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      return data.files || [];
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/v6/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/files/entity/${entityType}/${entityId}`] });
      toast({ title: "File uploaded successfully" });
      setUploading(false);
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      setUploadProgress(0);
    },
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const res = await apiRequest("DELETE", `/api/v6/files/link/${linkId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/files/entity/${entityType}/${entityId}`] });
      toast({ title: "File removed" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = useCallback(
    async (files: FileList | null, folder: FileFolder = defaultFolder) => {
      if (!files || files.length === 0) return;

      setUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("entityType", entityType);
        formData.append("entityId", entityId);
        formData.append("folder", folder);
        if (organizationId) {
          formData.append("organizationId", organizationId.toString());
        }

        await uploadMutation.mutateAsync(formData);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
    },
    [entityType, entityId, organizationId, defaultFolder, uploadMutation]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemove = (linkId: string) => {
    if (window.confirm("Remove this file from the entity?")) {
      unlinkMutation.mutate(linkId);
    }
  };

  // Group files by folder
  const filesByFolder = fileLinks.reduce<Record<string, FileLink[]>>((acc, link) => {
    const folder = link.folder || link.file.folder || "other";
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(link);
    return acc;
  }, {});

  // Filter files based on selected folder
  const filteredFiles =
    selectedFolder === "all"
      ? fileLinks
      : fileLinks.filter((link) => (link.folder || link.file.folder || "other") === selectedFolder);

  // Available folders for filter
  const availableFolders = showFolders || (Object.keys(filesByFolder) as FileFolder[]);

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        {/* Folder filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              {selectedFolder === "all"
                ? "All Files"
                : FOLDER_CONFIG[selectedFolder]?.label || selectedFolder}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setSelectedFolder("all")}>
              All Files ({fileLinks.length})
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {availableFolders.map((folder) => {
              const config = FOLDER_CONFIG[folder as FileFolder];
              const count = filesByFolder[folder]?.length || 0;
              if (!config) return null;
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={folder}
                  onClick={() => setSelectedFolder(folder as FileFolder)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label} ({count})
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Upload button */}
        {allowUpload && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload File
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(FOLDER_CONFIG).map(([folder, config]) => {
                if (showFolders && !showFolders.includes(folder as FileFolder)) return null;
                const Icon = config.icon;
                return (
                  <DropdownMenuItem key={folder} asChild>
                    <label className="flex items-center cursor-pointer">
                      <Icon className="w-4 h-4 mr-2" />
                      {config.label}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files, folder as FileFolder)}
                      />
                    </label>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="text-muted-foreground">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Drag and drop zone */}
      {allowUpload && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-border",
            compact && "p-2"
          )}
        >
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or use the upload button
          </p>
        </div>
      )}

      {/* File list */}
      {filteredFiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No files{selectedFolder !== "all" && ` in ${FOLDER_CONFIG[selectedFolder]?.label}`}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((link) => (
            <FileItem
              key={link.id}
              link={link}
              compact={compact}
              allowDelete={allowDelete}
              onPreview={() => setPreviewFile(link.file)}
              onRemove={() => handleRemove(link.id)}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <FilePreviewDialog
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}

interface FileItemProps {
  link: FileLink;
  compact?: boolean;
  allowDelete?: boolean;
  onPreview?: () => void;
  onRemove?: () => void;
}

function FileItem({ link, compact = false, allowDelete = true, onPreview, onRemove }: FileItemProps) {
  const file = link.file;
  const extension = file.originalFilename.split(".").pop()?.toLowerCase() || "";
  const Icon = FILE_ICONS[extension] || File;
  const folder = link.folder || file.folder;
  const folderConfig = folder ? FOLDER_CONFIG[folder as FileFolder] : null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(extension);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg border bg-background/50 hover:bg-accent/50 transition-colors group",
        compact && "p-1.5"
      )}
    >
      {/* Icon/Thumbnail */}
      <div
        className={cn(
          "flex-shrink-0 rounded-md bg-muted/50 flex items-center justify-center",
          compact ? "w-8 h-8" : "w-10 h-10"
        )}
      >
        {isImage && file.url ? (
          <img
            src={file.url}
            alt={file.originalFilename}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <Icon className={cn("text-muted-foreground", compact ? "w-4 h-4" : "w-5 h-5")} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium truncate", compact ? "text-xs" : "text-sm")}>
            {file.originalFilename}
          </span>
          {folderConfig && !compact && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              {folderConfig.label}
            </Badge>
          )}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(file.sizeBytes)}</span>
            <span>-</span>
            <span>{formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}</span>
            {file.uploadedByName && (
              <>
                <span>by</span>
                <span>{file.uploadedByName}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isImage && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onPreview}>
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {file.url && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
            <a href={file.url} download={file.originalFilename}>
              <Download className="w-4 h-4" />
            </a>
          </Button>
        )}
        {allowDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface FilePreviewDialogProps {
  file: FileRecord | null;
  onClose: () => void;
}

function FilePreviewDialog({ file, onClose }: FilePreviewDialogProps) {
  if (!file) return null;

  const extension = file.originalFilename.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(extension);

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{file.originalFilename}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          {isImage && file.url ? (
            <img
              src={file.url}
              alt={file.originalFilename}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <File className="w-16 h-16 mx-auto mb-4" />
              <p>Preview not available</p>
              {file.url && (
                <Button asChild className="mt-4">
                  <a href={file.url} download={file.originalFilename}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact file list for sidebar
interface CompactFileListProps {
  entityType: string;
  entityId: string;
  limit?: number;
  className?: string;
}

export function CompactFileList({
  entityType,
  entityId,
  limit = 5,
  className,
}: CompactFileListProps) {
  const { data: fileLinks = [], isLoading } = useQuery<FileLink[]>({
    queryKey: [`/api/v6/files/entity/${entityType}/${entityId}`],
    queryFn: async () => {
      const res = await fetch(`/api/v6/files/entity/${entityType}/${entityId}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      return data.files || [];
    },
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-1", className)}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  const displayFiles = fileLinks.slice(0, limit);
  const hasMore = fileLinks.length > limit;

  return (
    <div className={cn("space-y-1", className)}>
      {displayFiles.length === 0 ? (
        <p className="text-xs text-muted-foreground">No files</p>
      ) : (
        <>
          {displayFiles.map((link) => {
            const file = link.file;
            const extension = file.originalFilename.split(".").pop()?.toLowerCase() || "";
            const Icon = FILE_ICONS[extension] || File;
            return (
              <div key={link.id} className="flex items-center gap-2 text-xs">
                <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{file.originalFilename}</span>
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex-shrink-0"
                  >
                    View
                  </a>
                )}
              </div>
            );
          })}
          {hasMore && (
            <p className="text-xs text-muted-foreground">
              +{fileLinks.length - limit} more files
            </p>
          )}
        </>
      )}
    </div>
  );
}
