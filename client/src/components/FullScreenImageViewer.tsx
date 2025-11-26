import { useEffect } from "react";
import { X, Download } from "lucide-react";

interface FullScreenImageViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FullScreenImageViewer({ imageUrl, isOpen, onClose }: FullScreenImageViewerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = imageUrl.split('/').pop() || 'download.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="fullscreen-image-viewer"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        data-testid="button-close-viewer"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        className="absolute top-4 right-16 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
        data-testid="button-download-image"
      >
        <Download className="w-6 h-6 text-white" />
      </button>
      
      <img
        src={imageUrl}
        alt="Full screen view"
        className="max-w-[95vw] max-h-[95vh] object-contain"
        onClick={(e) => e.stopPropagation()}
        data-testid="img-fullscreen"
      />
    </div>
  );
}
