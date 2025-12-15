import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Plus, X, ChevronRight, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export interface PantoneDisplayItem {
  id: number;
  pantoneCode: string;
  pantoneName: string;
  hexValue: string;
  usageLocation?: string;
  matchQuality?: string;
  lineItemId?: number;
}

interface PantoneSummarySectionProps {
  pantones: PantoneDisplayItem[];
  isEditing?: boolean;
  canEdit?: boolean;
  onDelete?: (id: number) => void;
  onAddClick?: () => void;
  showQuickAction?: boolean;
  quickActionPath?: string;
  quickActionLabel?: string;
  variant?: "compact" | "full";
  className?: string;
}

const MATCH_QUALITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30" },
  very_close: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/30" },
  good: { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30" },
  approximate: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
  not_recommended: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30" },
};

export function PantoneSummarySection({
  pantones,
  isEditing = false,
  canEdit = false,
  onDelete,
  onAddClick,
  showQuickAction = false,
  quickActionPath,
  quickActionLabel = "Manage Pantones",
  variant = "full",
  className,
}: PantoneSummarySectionProps) {
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const displayPantones = variant === "compact" && !isExpanded 
    ? pantones.slice(0, 4) 
    : pantones;
  const hasMore = variant === "compact" && pantones.length > 4;

  if (pantones.length === 0 && !canEdit) {
    return null;
  }

  return (
    <Card className={cn("border-white/10", className)} data-testid="pantone-summary-section">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-500" />
            Pantone Colors
            {pantones.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-2">
                {pantones.length}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showQuickAction && quickActionPath && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setLocation(quickActionPath)}
                data-testid="button-pantone-quick-action"
              >
                {quickActionLabel}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            {canEdit && onAddClick && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onAddClick}
                data-testid="button-add-pantone"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pantones.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Palette className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No Pantone colors assigned</p>
            {canEdit && onAddClick && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onAddClick}
                data-testid="button-add-pantone-empty"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Pantone Color
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {displayPantones.map((pantone) => {
                const qualityColors = pantone.matchQuality 
                  ? MATCH_QUALITY_COLORS[pantone.matchQuality] || MATCH_QUALITY_COLORS.good
                  : null;

                return (
                  <div
                    key={pantone.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card transition-all",
                      qualityColors && `${qualityColors.border}`,
                      isEditing && "pr-1"
                    )}
                    data-testid={`pantone-item-${pantone.id}`}
                  >
                    <div
                      className="w-5 h-5 rounded-sm border shadow-sm"
                      style={{ backgroundColor: pantone.hexValue }}
                      data-testid={`pantone-swatch-${pantone.id}`}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-tight">
                        {pantone.pantoneCode}
                      </span>
                      {pantone.usageLocation && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          {pantone.usageLocation.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    {isEditing && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive ml-1"
                        onClick={() => onDelete(pantone.id)}
                        data-testid={`button-delete-pantone-${pantone.id}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            
            {hasMore && !isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setIsExpanded(true)}
                data-testid="button-expand-pantones"
              >
                <Eye className="w-3 h-3 mr-1" />
                Show {pantones.length - 4} more
              </Button>
            )}
            
            {hasMore && isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setIsExpanded(false)}
                data-testid="button-collapse-pantones"
              >
                Show less
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PantoneInlineDisplay({
  pantones,
  maxDisplay = 3,
  onViewAll,
}: {
  pantones: PantoneDisplayItem[];
  maxDisplay?: number;
  onViewAll?: () => void;
}) {
  if (pantones.length === 0) return null;

  const displayPantones = pantones.slice(0, maxDisplay);
  const remaining = pantones.length - maxDisplay;

  return (
    <div className="flex items-center gap-1" data-testid="pantone-inline-display">
      {displayPantones.map((pantone) => (
        <div
          key={pantone.id}
          className="w-4 h-4 rounded-sm border shadow-sm cursor-pointer hover:scale-110 transition-transform"
          style={{ backgroundColor: pantone.hexValue }}
          title={`${pantone.pantoneCode} - ${pantone.pantoneName}`}
          data-testid={`pantone-inline-${pantone.id}`}
        />
      ))}
      {remaining > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1 text-xs text-muted-foreground"
          onClick={onViewAll}
          data-testid="button-view-more-pantones"
        >
          +{remaining}
        </Button>
      )}
    </div>
  );
}
