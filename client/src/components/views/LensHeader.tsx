import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface LensHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  lensName?: string;
  lensColor?: string;
  backHref?: string;
  clearHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export function LensHeader({
  title,
  subtitle,
  icon: Icon,
  lensName,
  lensColor = "bg-primary",
  backHref,
  clearHref,
  children,
  className,
}: LensHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {Icon && (
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", lensColor)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white" data-testid="text-lens-title">{title}</h1>
              {lensName && (
                <Badge 
                  className={cn("text-xs font-medium", lensColor, "text-white")}
                  data-testid="badge-lens-name"
                >
                  View: {lensName}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {clearHref && lensName && (
            <Link href={clearHref}>
              <Button variant="outline" size="sm" className="text-muted-foreground" data-testid="button-clear-filter">
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
