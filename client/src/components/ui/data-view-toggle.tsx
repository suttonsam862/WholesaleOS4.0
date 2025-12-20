import * as React from "react";
import { LayoutList, LayoutGrid } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type DataView = "table" | "cards";

const DATA_VIEW_STORAGE_KEY = "data-view-preference";

export function useDataView(storageKey?: string) {
  const isMobile = useIsMobile();
  const key = storageKey || DATA_VIEW_STORAGE_KEY;
  
  const [view, setViewState] = React.useState<DataView>(() => {
    if (typeof window === "undefined") return "table";
    const stored = localStorage.getItem(key);
    if (stored === "table" || stored === "cards") return stored;
    return isMobile ? "cards" : "table";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      setViewState(isMobile ? "cards" : "table");
    }
  }, [isMobile, key]);

  const setView = React.useCallback((newView: DataView) => {
    setViewState(newView);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, newView);
    }
  }, [key]);

  return { view, setView, isMobile };
}

interface DataViewToggleProps {
  view: DataView;
  onViewChange: (view: DataView) => void;
  className?: string;
  disabled?: boolean;
}

export function DataViewToggle({ 
  view, 
  onViewChange, 
  className,
  disabled = false 
}: DataViewToggleProps) {
  return (
    <ToggleGroup 
      type="single" 
      value={view} 
      onValueChange={(value) => value && onViewChange(value as DataView)}
      className={cn(
        "glass-panel rounded-lg p-1 border border-white/10",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      data-testid="toggle-data-view"
    >
      <ToggleGroupItem 
        value="table" 
        aria-label="Table view"
        className={cn(
          "px-3 py-2 rounded-md transition-all duration-200",
          view === "table" 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        data-testid="toggle-view-table"
      >
        <LayoutList className="h-4 w-4" />
        <span className="ml-2 text-sm font-medium hidden sm:inline">Table</span>
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="cards" 
        aria-label="Cards view"
        className={cn(
          "px-3 py-2 rounded-md transition-all duration-200",
          view === "cards" 
            ? "bg-primary/20 text-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        )}
        data-testid="toggle-view-cards"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-2 text-sm font-medium hidden sm:inline">Cards</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

interface DataViewToggleWithHookProps {
  storageKey?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (view: DataView) => void;
}

export function DataViewToggleWithHook({
  storageKey,
  className,
  disabled,
  onChange
}: DataViewToggleWithHookProps) {
  const { view, setView } = useDataView(storageKey);

  const handleViewChange = (newView: DataView) => {
    setView(newView);
    onChange?.(newView);
  };

  return (
    <DataViewToggle
      view={view}
      onViewChange={handleViewChange}
      className={className}
      disabled={disabled}
    />
  );
}
