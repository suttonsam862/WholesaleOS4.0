import { useState, useEffect, useRef, useCallback } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractDominantColors } from "@/lib/colorExtraction";

interface OrgLogoProps {
  src: string | null | undefined;
  orgName: string;
  orgId?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showColorRing?: boolean;
  onColorsExtracted?: (colors: string[]) => void;
  fallbackColors?: string[];
  lazy?: boolean;
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

/**
 * OrgLogo - A reusable component for displaying organization logos
 * with color extraction, lazy loading, and fallback handling
 */
export function OrgLogo({
  src,
  orgName,
  orgId,
  size = "md",
  className,
  showColorRing = false,
  onColorsExtracted,
  fallbackColors,
  lazy = true,
}: OrgLogoProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
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

  // Extract colors from logo
  useEffect(() => {
    if (!src || !isVisible) return;

    const extractColors = async () => {
      const cacheKey = `org-colors-${orgId || src}`;
      
      // Check localStorage cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const colors = JSON.parse(cached);
          setExtractedColors(colors);
          onColorsExtracted?.(colors);
          return;
        } catch {
          // Invalid cache, continue with extraction
        }
      }

      const colors = await extractDominantColors(src);
      setExtractedColors(colors);
      onColorsExtracted?.(colors);
      
      // Cache to localStorage
      if (orgId) {
        localStorage.setItem(cacheKey, JSON.stringify(colors));
      }
    };

    extractColors();
  }, [src, orgId, isVisible, onColorsExtracted]);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  // Reset state when src changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  const colors = extractedColors.length > 0 ? extractedColors : fallbackColors || [];
  const primaryColor = colors[0] || "#6366f1";
  const secondaryColor = colors[1] || colors[0] || "#8b5cf6";

  // Generate initials for fallback
  const initials = orgName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const ringStyle = showColorRing && colors.length >= 2
    ? {
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        padding: "2px",
      }
    : {};

  const containerClasses = cn(
    "relative rounded-lg overflow-hidden flex-shrink-0",
    sizeClasses[size],
    className
  );

  // Not visible yet (lazy loading)
  if (!isVisible) {
    return (
      <div ref={imgRef} className={containerClasses}>
        <div className="w-full h-full bg-muted/50 animate-pulse rounded-lg" />
      </div>
    );
  }

  // No src or error - show fallback
  if (!src || error) {
    return (
      <div
        ref={imgRef}
        className={cn(
          containerClasses,
          "flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 border border-white/10"
        )}
        style={
          colors.length > 0
            ? { background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)` }
            : undefined
        }
      >
        {initials ? (
          <span
            className="font-semibold text-primary"
            style={colors.length > 0 ? { color: primaryColor } : undefined}
          >
            {initials}
          </span>
        ) : (
          <Building2 className={cn(iconSizes[size], "text-muted-foreground")} />
        )}
      </div>
    );
  }

  return (
    <div ref={imgRef} className="flex-shrink-0" style={ringStyle}>
      <div className={cn(containerClasses, showColorRing && "rounded-md")}>
        {loading && (
          <div className="absolute inset-0 bg-muted/30 animate-pulse" />
        )}
        <img
          src={src}
          alt={orgName}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-contain bg-white/90 dark:bg-white/95 transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100"
          )}
          loading={lazy ? "lazy" : "eager"}
        />
      </div>
    </div>
  );
}

/**
 * Hook to use organization colors from extracted logo
 */
export function useOrgColors(
  logoUrl: string | null | undefined,
  orgId?: number
): { colors: string[]; isLoading: boolean } {
  const [colors, setColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!logoUrl) {
      setIsLoading(false);
      return;
    }

    const loadColors = async () => {
      const cacheKey = `org-colors-${orgId || logoUrl}`;
      
      // Check cache first
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setColors(JSON.parse(cached));
          setIsLoading(false);
          return;
        } catch {
          // Continue with extraction
        }
      }

      const extracted = await extractDominantColors(logoUrl);
      setColors(extracted);
      setIsLoading(false);
      
      if (orgId) {
        localStorage.setItem(cacheKey, JSON.stringify(extracted));
      }
    };

    loadColors();
  }, [logoUrl, orgId]);

  return { colors, isLoading };
}
