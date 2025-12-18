import { useState } from "react";
import { Search, Filter, Eye, Crosshair, ListTodo, X, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { MapMode, MapFilters } from "../types";
import { cn } from "@/lib/utils";

interface TopHUDProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  orgCount: number;
  leadCount: number;
  orderCount: number;
  designJobCount: number;
}

const modeConfig = {
  view: { icon: Eye, label: "View", color: "bg-blue-500" },
  find_leads: { icon: Crosshair, label: "Find Leads", color: "bg-green-500" },
  work_queue: { icon: ListTodo, label: "Work Queue", color: "bg-amber-500" },
  attention: { icon: AlertTriangle, label: "Attention", color: "bg-red-500" },
};

export function TopHUD({
  mode,
  onModeChange,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  orgCount,
  leadCount,
  orderCount,
  designJobCount,
}: TopHUDProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3" data-testid="top-hud">
      <div
        className={cn(
          "relative flex-1 max-w-md transition-all",
          isSearchFocused && "max-w-lg"
        )}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations, leads..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className="pl-9 bg-background/90 backdrop-blur-lg border-white/10"
          data-testid="search-input"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => onSearchChange("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-background/90 backdrop-blur-lg border-white/10"
            data-testid="filter-button"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Entity Types</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.showOrganizations}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, showOrganizations: checked })
            }
            data-testid="filter-organizations"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Organizations ({orgCount})
            </span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.showLeads}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, showLeads: checked })
            }
            data-testid="filter-leads"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Leads ({leadCount})
            </span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.showOrders}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, showOrders: checked })
            }
            data-testid="filter-orders"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Orders ({orderCount})
            </span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.showDesignJobs}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, showDesignJobs: checked })
            }
            data-testid="filter-design-jobs"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Design Jobs ({designJobCount})
            </span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Filters</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filters.myItemsOnly}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, myItemsOnly: checked })
            }
            data-testid="filter-my-items"
          >
            My Items Only
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.showAttentionOnly}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, showAttentionOnly: checked })
            }
            data-testid="filter-attention"
          >
            Attention Items Only
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-1 p-1 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
        {(Object.entries(modeConfig) as [MapMode, typeof modeConfig.view][]).map(
          ([key, config]) => {
            const Icon = config.icon;
            const isActive = mode === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onModeChange(key)}
                className={cn(
                  "gap-2",
                  isActive && config.color
                )}
                data-testid={`mode-${key}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{config.label}</span>
              </Button>
            );
          }
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10" data-testid="entity-counts">
        <div className="flex items-center gap-1.5" title="Organizations">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm font-medium">{orgCount}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5" title="Leads">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm font-medium">{leadCount}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5" title="Orders">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium">{orderCount}</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5" title="Design Jobs">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-sm font-medium">{designJobCount}</span>
        </div>
      </div>
    </div>
  );
}
