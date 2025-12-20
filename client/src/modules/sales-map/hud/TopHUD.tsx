import { useState } from "react";
import { Search, Filter, Eye, Crosshair, ListTodo, X, AlertTriangle, Building2, Target, ShoppingCart, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { motion } from "framer-motion";

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
  isMobileSheet?: boolean;
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
  isMobileSheet = false,
}: TopHUDProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  if (isMobileSheet) {
    return (
      <div className="space-y-6" data-testid="top-hud-mobile">
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations, leads..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 min-h-[48px] bg-background/50 border-white/10"
              data-testid="mobile-search-input"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => onSearchChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Map Mode</Label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(modeConfig) as [MapMode, typeof modeConfig.view][]).map(
              ([key, config]) => {
                const Icon = config.icon;
                const isActive = mode === key;
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onModeChange(key)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border transition-all min-h-[48px]",
                      isActive
                        ? `${config.color} border-white/20 text-white`
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                    data-testid={`mobile-mode-${key}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </motion.button>
                );
              }
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Entity Filters</Label>
          <div className="space-y-3">
            <FilterRow
              icon={Building2}
              label="Organizations"
              count={orgCount}
              color="#3b82f6"
              checked={filters.showOrganizations}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showOrganizations: checked })}
            />
            <FilterRow
              icon={Target}
              label="Leads"
              count={leadCount}
              color="#f59e0b"
              checked={filters.showLeads}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showLeads: checked })}
            />
            <FilterRow
              icon={ShoppingCart}
              label="Orders"
              count={orderCount}
              color="#22c55e"
              checked={filters.showOrders}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showOrders: checked })}
            />
            <FilterRow
              icon={Palette}
              label="Design Jobs"
              count={designJobCount}
              color="#a855f7"
              checked={filters.showDesignJobs}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, showDesignJobs: checked })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">Additional Filters</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 min-h-[48px]">
              <span className="text-sm">My Items Only</span>
              <Switch
                checked={filters.myItemsOnly}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, myItemsOnly: checked })}
                data-testid="mobile-filter-my-items"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 min-h-[48px]">
              <span className="text-sm">Attention Items Only</span>
              <Switch
                checked={filters.showAttentionOnly}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, showAttentionOnly: checked })}
                data-testid="mobile-filter-attention"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3" data-testid="top-hud">
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
          className="pl-9 bg-background/90 backdrop-blur-xl border-white/10 shadow-lg"
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
            className="bg-background/90 backdrop-blur-xl border-white/10 shadow-lg min-h-[44px]"
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

      <div className="flex items-center gap-1 p-1 bg-background/90 backdrop-blur-xl rounded-lg border border-white/10 shadow-lg">
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
                  "gap-2 min-h-[44px]",
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

      <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-xl rounded-lg border border-white/10 shadow-lg" data-testid="entity-counts">
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

interface FilterRowProps {
  icon: typeof Building2;
  label: string;
  count: number;
  color: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function FilterRow({ icon: Icon, label, count, color, checked, onCheckedChange }: FilterRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl border transition-all min-h-[48px]",
        checked
          ? "bg-white/10 border-white/20"
          : "bg-white/5 border-white/10 opacity-60"
      )}
      data-testid={`mobile-filter-${label.toLowerCase()}`}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: checked ? color : "#666" }}
      />
      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: checked ? color : "#888" }} />
      <span className="flex-1 text-left text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">({count})</span>
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
          checked ? "border-white bg-white" : "border-white/30"
        )}
      >
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
      </div>
    </motion.button>
  );
}
