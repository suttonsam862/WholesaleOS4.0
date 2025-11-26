import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import { extractDominantColors } from "@/lib/colorExtraction";
import { createGradient, getReadableTextColorForGradient } from "@/lib/contrastUtils";

interface Organization {
  id: number;
  name: string;
  logoUrl?: string | null;
  brandPrimaryColor?: string | null;
  brandSecondaryColor?: string | null;
}

interface OrgBrandedCardProps {
  organization: Organization;
  children?: ReactNode;
  className?: string;
  showLogo?: boolean;
  logoSize?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "compact" | "gradient" | "subtle";
  onClick?: () => void;
  header?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * OrgBrandedCard - A card component that displays organization branding
 * with gradient backgrounds extracted from the organization's logo
 */
export function OrgBrandedCard({
  organization,
  children,
  className,
  showLogo = true,
  logoSize = "md",
  variant = "default",
  onClick,
  header,
  headerClassName,
  contentClassName,
}: OrgBrandedCardProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [textClass, setTextClass] = useState<string>("text-foreground");

  useEffect(() => {
    const loadColors = async () => {
      // Check localStorage cache first
      const cacheKey = `org-colors-${organization.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedColors = JSON.parse(cached);
          setColors(cachedColors);
          if (variant === "gradient") {
            setTextClass(getReadableTextColorForGradient(cachedColors));
          }
          return;
        } catch {
          // Continue with extraction
        }
      }

      // Use brand colors as fallback if no logo
      if (!organization.logoUrl) {
        const fallbackColors = [
          organization.brandPrimaryColor || "#6366f1",
          organization.brandSecondaryColor || "#8b5cf6",
        ].filter(Boolean) as string[];
        setColors(fallbackColors);
        if (variant === "gradient") {
          setTextClass(getReadableTextColorForGradient(fallbackColors));
        }
        return;
      }

      // Extract colors from logo
      const extracted = await extractDominantColors(organization.logoUrl);
      setColors(extracted);
      localStorage.setItem(cacheKey, JSON.stringify(extracted));
      
      if (variant === "gradient") {
        setTextClass(getReadableTextColorForGradient(extracted));
      }
    };

    loadColors();
  }, [organization.id, organization.logoUrl, organization.brandPrimaryColor, organization.brandSecondaryColor, variant]);

  const getBackgroundStyle = () => {
    if (colors.length === 0) return {};

    switch (variant) {
      case "gradient":
        return { background: createGradient(colors, "135deg") };
      case "subtle":
        return { 
          background: `linear-gradient(135deg, ${colors[0]}15 0%, ${colors[1] || colors[0]}10 100%)`,
          borderColor: `${colors[0]}30`,
        };
      default:
        return {};
    }
  };

  const cardClasses = cn(
    "overflow-hidden transition-all duration-300",
    variant === "gradient" && "border-0 shadow-lg",
    variant === "subtle" && "border",
    onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
    className
  );

  return (
    <Card
      className={cardClasses}
      style={getBackgroundStyle()}
      onClick={onClick}
    >
      {(header || showLogo) && (
        <CardHeader className={cn("flex flex-row items-center gap-3 pb-2", headerClassName)}>
          {showLogo && (
            <OrgLogo
              src={organization.logoUrl}
              orgName={organization.name}
              orgId={organization.id}
              size={logoSize}
              showColorRing={variant === "default"}
              onColorsExtracted={setColors}
            />
          )}
          {header && (
            <div className={cn("flex-1 min-w-0", variant === "gradient" && textClass)}>
              {header}
            </div>
          )}
        </CardHeader>
      )}
      {children && (
        <CardContent className={cn(variant === "gradient" && textClass, contentClassName)}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * OrgColorPalette - Displays the extracted color palette from an organization's logo
 */
interface OrgColorPaletteProps {
  colors: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
  showHex?: boolean;
}

export function OrgColorPalette({
  colors,
  size = "md",
  className,
  showHex = false,
}: OrgColorPaletteProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  if (colors.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {colors.map((color, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              sizeClasses[size],
              "rounded-full border border-white/20 shadow-sm"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
          {showHex && (
            <span className="text-[10px] text-muted-foreground font-mono">
              {color}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * OrgGradientBadge - A small badge with organization gradient background
 */
interface OrgGradientBadgeProps {
  organization: Organization;
  children: ReactNode;
  className?: string;
}

export function OrgGradientBadge({
  organization,
  children,
  className,
}: OrgGradientBadgeProps) {
  const [colors, setColors] = useState<string[]>([]);
  const [textClass, setTextClass] = useState<string>("text-white");

  useEffect(() => {
    const loadColors = async () => {
      const cacheKey = `org-colors-${organization.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedColors = JSON.parse(cached);
          setColors(cachedColors);
          setTextClass(getReadableTextColorForGradient(cachedColors));
          return;
        } catch {
          // Continue with extraction
        }
      }

      if (!organization.logoUrl) {
        const fallback = [organization.brandPrimaryColor || "#6366f1"];
        setColors(fallback);
        return;
      }

      const extracted = await extractDominantColors(organization.logoUrl);
      setColors(extracted);
      setTextClass(getReadableTextColorForGradient(extracted));
    };

    loadColors();
  }, [organization]);

  const gradientStyle = colors.length > 0
    ? { background: createGradient(colors, "135deg") }
    : { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        textClass,
        className
      )}
      style={gradientStyle}
    >
      {children}
    </span>
  );
}

/**
 * OrgLogoWithName - Displays org logo with name, common pattern
 */
interface OrgLogoWithNameProps {
  organization: Organization;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: string;
}

export function OrgLogoWithName({
  organization,
  size = "md",
  className,
  showSubtitle,
}: OrgLogoWithNameProps) {
  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <OrgLogo
        src={organization.logoUrl}
        orgName={organization.name}
        orgId={organization.id}
        size={size}
      />
      <div className="min-w-0 flex-1">
        <div className={cn("font-medium truncate", textSizes[size])}>
          {organization.name}
        </div>
        {showSubtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {showSubtitle}
          </div>
        )}
      </div>
    </div>
  );
}
