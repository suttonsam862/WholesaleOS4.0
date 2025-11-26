import { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageViewer } from "@/components/ImageViewer";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ZoomIn, Image as ImageIcon, FileImage, Grid, Layers } from "lucide-react";

interface DesignFile {
  url: string;
  name?: string;
  type?: "logo" | "reference" | "design" | "additional";
}

interface DesignGalleryProps {
  title?: string;
  files: string[];
  category: "logos" | "references" | "designs" | "additional";
  className?: string;
  emptyMessage?: string;
}

/**
 * Checks if URL is an image based on extension or content type hints
 */
function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Extract filename from URL
 */
function extractFileName(url: string): string {
  try {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    // Remove query params
    const cleanName = fileName.split('?')[0];
    return decodeURIComponent(cleanName);
  } catch {
    return url;
  }
}

/**
 * Single image thumbnail with hover effects
 */
function ImageThumbnail({ 
  url, 
  onClick, 
  aspectRatio = "square" 
}: { 
  url: string; 
  onClick: () => void;
  aspectRatio?: "square" | "wide" | "tall";
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    tall: "aspect-[3/4]",
  };

  if (error || !isImageUrl(url)) {
    // Show file icon for non-images
    return (
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative group rounded-xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5",
          "border border-white/10 hover:border-primary/50",
          "flex flex-col items-center justify-center gap-2 p-4",
          "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
          aspectClasses[aspectRatio]
        )}
      >
        <FileImage className="w-8 h-8 text-muted-foreground" />
        <span className="text-xs text-muted-foreground text-center line-clamp-2 px-2">
          {extractFileName(url)}
        </span>
        <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative group rounded-xl overflow-hidden cursor-pointer",
        "border border-white/10 hover:border-primary/50",
        "transition-all duration-300 hover:shadow-xl hover:scale-[1.02]",
        "bg-gradient-to-br from-white/5 to-transparent",
        aspectClasses[aspectRatio]
      )}
    >
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      )}
      
      {/* Image */}
      <img
        src={url}
        alt="Design file"
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          loaded ? "opacity-100" : "opacity-0",
          "group-hover:scale-110"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
      
      {/* Overlay gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )} />
      
      {/* Hover actions */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center gap-3",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )}>
        <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
          <ZoomIn className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Filename badge */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-2",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )}>
        <span className="text-xs text-white/90 truncate block text-center" 
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
          {extractFileName(url)}
        </span>
      </div>
    </div>
  );
}

/**
 * DesignGallery - Artistic gallery for design job files
 */
export function DesignGallery({
  title,
  files,
  category,
  className,
  emptyMessage = "No files uploaded",
}: DesignGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const imageFiles = files.filter(isImageUrl);
  const otherFiles = files.filter(f => !isImageUrl(f));

  const categoryIcons = {
    logos: <Layers className="w-5 h-5" />,
    references: <ImageIcon className="w-5 h-5" />,
    designs: <Grid className="w-5 h-5" />,
    additional: <FileImage className="w-5 h-5" />,
  };

  const categoryColors = {
    logos: "from-violet-500/20 to-purple-500/10",
    references: "from-blue-500/20 to-cyan-500/10",
    designs: "from-emerald-500/20 to-teal-500/10",
    additional: "from-amber-500/20 to-orange-500/10",
  };

  const handleImageClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  if (files.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {categoryIcons[category]}
            <span className="font-medium">{title}</span>
          </div>
        )}
        <div className={cn(
          "rounded-xl border border-dashed border-white/10 p-6",
          "flex flex-col items-center justify-center gap-2 text-center",
          "bg-gradient-to-br",
          categoryColors[category]
        )}>
          {categoryIcons[category]}
          <span className="text-sm text-muted-foreground">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-br",
              categoryColors[category]
            )}>
              {categoryIcons[category]}
            </div>
            <div>
              <span className="font-semibold text-foreground">{title}</span>
              <span className="text-sm text-muted-foreground ml-2">
                ({files.length} {files.length === 1 ? 'file' : 'files'})
              </span>
            </div>
          </div>
          {imageFiles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleImageClick(0)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ZoomIn className="w-4 h-4 mr-1.5" />
              View All
            </Button>
          )}
        </div>
      )}

      {/* Image Grid - Masonry-style layout */}
      {imageFiles.length > 0 && (
        <div className={cn(
          "grid gap-3",
          imageFiles.length === 1 && "grid-cols-1",
          imageFiles.length === 2 && "grid-cols-2",
          imageFiles.length >= 3 && "grid-cols-2 md:grid-cols-3",
          imageFiles.length >= 6 && "grid-cols-3 md:grid-cols-4"
        )}>
          {imageFiles.map((url, index) => (
            <ImageThumbnail
              key={url}
              url={url}
              onClick={() => handleImageClick(index)}
              aspectRatio={
                imageFiles.length === 1 ? "wide" : 
                index === 0 && imageFiles.length === 3 ? "tall" : 
                "square"
              }
            />
          ))}
        </div>
      )}

      {/* Non-image files list */}
      {otherFiles.length > 0 && (
        <div className="space-y-2">
          {imageFiles.length > 0 && (
            <span className="text-xs text-muted-foreground">Other files</span>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {otherFiles.map((url) => (
              <a
                key={url}
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  "bg-white/5 border border-white/10",
                  "hover:bg-white/10 hover:border-primary/30",
                  "transition-all duration-200 group"
                )}
              >
                <FileImage className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">
                  {extractFileName(url)}
                </span>
                <Download className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        images={imageFiles}
        initialIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title={title}
      />
    </div>
  );
}

/**
 * DesignShowcase - Large hero-style display for featured designs
 */
interface DesignShowcaseProps {
  primaryImage?: string;
  title?: string;
  subtitle?: string;
  onViewClick?: () => void;
  className?: string;
}

export function DesignShowcase({
  primaryImage,
  title,
  subtitle,
  onViewClick,
  className,
}: DesignShowcaseProps) {
  const [loaded, setLoaded] = useState(false);

  if (!primaryImage) return null;

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden group cursor-pointer",
      "bg-gradient-to-br from-primary/20 to-primary/5",
      "border border-white/10 hover:border-primary/50",
      "transition-all duration-500 hover:shadow-2xl",
      className
    )}
    onClick={onViewClick}
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={primaryImage}
          alt=""
          className="w-full h-full object-cover scale-150 blur-3xl opacity-30"
        />
      </div>

      {/* Main image */}
      <div className="relative aspect-video flex items-center justify-center p-8">
        {!loaded && (
          <div className="absolute inset-0 bg-muted/30 animate-pulse" />
        )}
        <img
          src={primaryImage}
          alt={title || "Design preview"}
          className={cn(
            "max-w-full max-h-full object-contain rounded-lg shadow-2xl",
            "transition-all duration-500",
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
            "group-hover:scale-105"
          )}
          onLoad={() => setLoaded(true)}
        />
      </div>

      {/* Overlay with info */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 p-6",
        "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
        "transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"
      )}>
        {title && (
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-white/70">{subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
            <ZoomIn className="w-4 h-4 mr-1.5" />
            View Full Size
          </Button>
        </div>
      </div>

      {/* Floating zoom indicator */}
      <div className={cn(
        "absolute top-4 right-4 p-2.5 rounded-full",
        "bg-black/40 backdrop-blur-sm",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )}>
        <ZoomIn className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}
