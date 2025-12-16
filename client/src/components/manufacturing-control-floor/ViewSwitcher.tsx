import { LayoutGrid, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewSwitcherProps {
  view: "tiles" | "floor";
  onViewChange: (view: "tiles" | "floor") => void;
  className?: string;
}

export function ViewSwitcher({ view, onViewChange, className }: ViewSwitcherProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted/50 rounded-lg", className)} data-testid="view-switcher">
      <Button
        variant={view === "tiles" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("tiles")}
        className={cn(
          "gap-2 transition-all",
          view === "tiles" 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-muted text-muted-foreground"
        )}
        data-testid="button-view-tiles"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Tiles</span>
      </Button>
      <Button
        variant={view === "floor" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("floor")}
        className={cn(
          "gap-2 transition-all",
          view === "floor" 
            ? "bg-primary text-primary-foreground shadow-sm" 
            : "hover:bg-muted text-muted-foreground"
        )}
        data-testid="button-view-floor"
      >
        <Factory className="h-4 w-4" />
        <span className="hidden sm:inline">Floor</span>
      </Button>
    </div>
  );
}
