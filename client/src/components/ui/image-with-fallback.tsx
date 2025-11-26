import { useState, useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  lazy?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallbackSrc,
  fallbackIcon,
  onLoad,
  onError,
  lazy = true,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
    onError?.();
  };

  // Not visible yet (lazy loading)
  if (!isVisible) {
    return (
      <div ref={imgRef} className={cn("relative overflow-hidden bg-muted/20 animate-pulse", className)}>
        <div className="w-full h-full" />
      </div>
    );
  }

  if (error || !src) {
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={cn("object-cover", className)}
          loading={lazy ? "lazy" : "eager"}
          {...props}
        />
      );
    }

    return (
      <div
        ref={imgRef}
        className={cn(
          "flex items-center justify-center bg-muted/50 text-muted-foreground",
          className
        )}
      >
        {fallbackIcon || <ImageOff className="w-1/3 h-1/3 opacity-50" />}
      </div>
    );
  }

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        loading={lazy ? "lazy" : "eager"}
        {...props}
      />
    </div>
  );
}
