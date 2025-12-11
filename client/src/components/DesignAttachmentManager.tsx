import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { ImageViewer } from "@/components/ImageViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Eye, Trash2, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttachmentCategory {
  id: string;
  label: string;
  urls: string[];
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number;
}

interface DesignAttachmentManagerProps {
  logoUrls?: string[];
  designReferenceUrls?: string[];
  additionalFileUrls?: string[];
  designStyleUrl?: string;
  finalDesignUrls?: string[];
  onUpdate: (updates: {
    logoUrls?: string[];
    designReferenceUrls?: string[];
    additionalFileUrls?: string[];
    designStyleUrl?: string;
    finalDesignUrls?: string[];
  }) => void;
  readonly?: boolean;
}

export function DesignAttachmentManager({
  logoUrls = [],
  designReferenceUrls = [],
  additionalFileUrls = [],
  designStyleUrl,
  finalDesignUrls = [],
  onUpdate,
  readonly = false
}: DesignAttachmentManagerProps) {
  const { toast } = useToast();
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  const categories: AttachmentCategory[] = [
    {
      id: "logos",
      label: "Logos",
      urls: logoUrls,
      maxFiles: 10,
      acceptedTypes: ["image/*"],
      maxFileSize: 10 * 1024 * 1024
    },
    {
      id: "references",
      label: "Design References",
      urls: designReferenceUrls,
      maxFiles: 20,
      acceptedTypes: ["image/*"],
      maxFileSize: 10 * 1024 * 1024
    },
    {
      id: "files",
      label: "Additional Files",
      urls: additionalFileUrls,
      maxFiles: 20,
      acceptedTypes: ["image/*", "application/pdf", ".pdf", ".ai", ".psd", ".svg"],
      maxFileSize: 100 * 1024 * 1024
    },
    {
      id: "final",
      label: "Final Design",
      urls: finalDesignUrls,
      maxFiles: 10,
      acceptedTypes: ["image/*", "application/pdf", ".pdf", ".ai", ".psd", ".svg", ".eps", ".psb", ".indd"],
      maxFileSize: 100 * 1024 * 1024
    }
  ];

  const handleUploadComplete = (categoryId: string, result: any) => {
    if (!result.successful || result.successful.length === 0) {
      return;
    }

    const uploadedUrls = result.successful.map((file: any) => {
      const uploadId = file.uploadId;
      if (uploadId) {
        return `/public-objects/${uploadId}`;
      }
      return null;
    }).filter(Boolean) as string[];
    
    if (uploadedUrls.length === 0) {
      toast({
        title: "Upload failed",
        description: "Could not process uploaded files",
        variant: "destructive"
      });
      return;
    }
    
    const updates: any = {};
    if (categoryId === "logos") {
      updates.logoUrls = [...logoUrls, ...uploadedUrls];
    } else if (categoryId === "references") {
      updates.designReferenceUrls = [...designReferenceUrls, ...uploadedUrls];
    } else if (categoryId === "files") {
      updates.additionalFileUrls = [...additionalFileUrls, ...uploadedUrls];
    } else if (categoryId === "final") {
      updates.finalDesignUrls = [...finalDesignUrls, ...uploadedUrls];
    }

    onUpdate(updates);
    toast({
      title: "Upload successful",
      description: `${uploadedUrls.length} file${uploadedUrls.length === 1 ? '' : 's'} uploaded successfully`
    });
  };

  const handleGetUploadUrl = async (file: any, categoryId?: string) => {
    const isDesignFile = /\.(psd|ai|eps|psb|indd|pdf|sketch|fig)$/i.test(file.name) ||
      ['application/x-photoshop', 'image/vnd.adobe.photoshop', 'application/photoshop',
       'application/postscript', 'application/illustrator', 'application/pdf',
       'application/octet-stream', 'application/x-indesign'].includes(file.type);
    
    const endpoint = isDesignFile ? '/api/upload/file' : '/api/upload/image';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        mimeType: file.type
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
      uploadId: data.uploadId,
      headers: {
        'Content-Type': file.type
      }
    };
  };

  const handleView = (categoryId: string, urls: string[]) => {
    const category = categories.find(c => c.id === categoryId);
    setViewerImages(urls);
    setViewerTitle(category?.label || "Images");
    setActiveCategory(categoryId);
    setViewerOpen(true);
  };

  const handleDelete = (categoryId: string, index: number) => {
    const updates: any = {};
    
    if (categoryId === "logos") {
      updates.logoUrls = logoUrls.filter((_, i) => i !== index);
    } else if (categoryId === "references") {
      updates.designReferenceUrls = designReferenceUrls.filter((_, i) => i !== index);
    } else if (categoryId === "files") {
      updates.additionalFileUrls = additionalFileUrls.filter((_, i) => i !== index);
    } else if (categoryId === "final") {
      updates.finalDesignUrls = finalDesignUrls.filter((_, i) => i !== index);
    }

    onUpdate(updates);
    toast({
      title: "File removed",
      description: "The file has been removed successfully"
    });
  };

  const handleViewerDelete = (imageUrl: string, index: number) => {
    handleDelete(activeCategory, index);
    setViewerImages(prev => prev.filter((_, i) => i !== index));
    if (viewerImages.length <= 1) {
      setViewerOpen(false);
    }
  };

  const isImageFile = (url: string, categoryId: string) => {
    // Check file extension
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
      return true;
    }
    
    // For /objects/ URLs (which don't have extensions), check the category
    // Logos and references categories only accept images
    // Final and files categories can have both images and other file types
    if (url.startsWith('/objects/') || url.startsWith('/public-objects/')) {
      return categoryId === 'logos' || categoryId === 'references' || categoryId === 'style';
    }
    
    return false;
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id} data-testid={`attachment-category-${category.id}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium" data-testid={`category-title-${category.id}`}>
                {category.label}
              </CardTitle>
              <Badge variant="secondary" data-testid={`category-count-${category.id}`}>
                {category.urls.length} {category.urls.length === 1 ? 'file' : 'files'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {category.urls.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {category.urls.map((url, index) => {
                  const count = category.urls.length;
                  const sizeClass = count === 1 
                    ? 'w-full max-w-xs h-48' 
                    : count === 2 
                    ? 'w-[calc(50%-0.375rem)] h-40' 
                    : count === 3 
                    ? 'w-[calc(33.333%-0.5rem)] h-36'
                    : count === 4
                    ? 'w-[calc(25%-0.5625rem)] h-32'
                    : 'w-[calc(20%-0.6rem)] h-28';
                  
                  return (
                  <div
                    key={index}
                    className={`relative group rounded-lg border overflow-hidden bg-muted flex-shrink-0 ${sizeClass}`}
                    data-testid={`attachment-${category.id}-${index}`}
                  >
                    {isImageFile(url, category.id) ? (
                      <img
                        src={url}
                        alt={`${category.label} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // If image fails to load, hide it and show file icon instead
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center';
                            fallback.innerHTML = '<svg class="h-12 w-12 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <File className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {isImageFile(url, category.id) && (
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => handleView(category.id, category.urls)}
                          data-testid={`button-view-${category.id}-${index}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {!readonly && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(category.id, index)}
                          data-testid={`button-delete-${category.id}-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
            
            {!readonly && (
              <ObjectUploader
                maxNumberOfFiles={category.maxFiles || 10}
                maxFileSize={category.maxFileSize || 10485760}
                allowedFileTypes={category.acceptedTypes}
                onGetUploadParameters={handleGetUploadUrl}
                onComplete={(result) => handleUploadComplete(category.id, result)}
                buttonClassName="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload {category.label}
              </ObjectUploader>
            )}
          </CardContent>
        </Card>
      ))}

      {designStyleUrl && (
        <Card data-testid="design-style-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Design Style Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative group rounded-lg border overflow-hidden aspect-video bg-muted">
              {isImageFile(designStyleUrl, 'style') ? (
                <img
                  src={designStyleUrl}
                  alt="Design Style Guide"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <File className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {isImageFile(designStyleUrl, 'style') && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleView("style", [designStyleUrl])}
                    data-testid="button-view-style-guide"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {!readonly && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onUpdate({ designStyleUrl: undefined })}
                    data-testid="button-delete-style-guide"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title={viewerTitle}
        onDelete={!readonly ? handleViewerDelete : undefined}
      />
    </div>
  );
}
