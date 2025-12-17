import { useState, useCallback, useMemo } from "react";
import { Map, MapPinned, Loader2, AlertTriangle, Building2, Target, ShoppingCart, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClusteredMapCanvas } from "./map/ClusteredMapCanvas";
import { TopHUD } from "./hud/TopHUD";
import { RightDrawer } from "./panels/RightDrawer";
import { OrdersPanel } from "./panels/OrdersPanel";
import { AttentionDashboard } from "./components/AttentionDashboard";
import { useMapFeed, useAttentionData } from "./data/useMapFeed";
import type { MapEntity, MapMode, MapFilters, AttentionItem, EntityType } from "./types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FloatingDock } from "@/components/layout/floating-dock";
import { motion, AnimatePresence } from "framer-motion";

export default function SalesMapShell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<MapMode>("view");
  const isAdminOrOps = user?.role === "admin" || user?.role === "ops";
  const [filters, setFilters] = useState<MapFilters>({
    showOrganizations: true,
    showLeads: true,
    showOrders: true,
    showDesignJobs: false,
    myItemsOnly: false,
    showAttentionOnly: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [highlightedEntity, setHighlightedEntity] = useState<{ type: EntityType; id: number } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAttentionDashboardOpen, setIsAttentionDashboardOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const { data: attentionData, isLoading: attentionLoading } = useAttentionData(true);

  const geocodeMutation = useMutation({
    mutationFn: async () => {
      const orgData = await apiRequest("POST", "/api/sales-map/geocode-organizations");
      const leadData = await apiRequest("POST", "/api/sales-map/geocode-leads");
      return { orgs: orgData, leads: leadData };
    },
    onSuccess: (data) => {
      toast({
        title: "Geocoding Complete",
        description: `Geocoded ${data.orgs.geocoded} organizations and ${data.leads.geocoded} leads`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-map/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-map/orders"] });
    },
    onError: (error) => {
      toast({
        title: "Geocoding Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const { data: feedData, isLoading } = useMapFeed({
    bounds: bounds || undefined,
    filters,
    enabled: !!bounds,
  });

  const handleBoundsChange = useCallback(
    (newBounds: { north: number; south: number; east: number; west: number }) => {
      setBounds(newBounds);
    },
    []
  );

  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom);
  }, []);

  const handleEntityClick = useCallback((entity: MapEntity) => {
    setSelectedEntity(entity);
    setHighlightedEntity(null);
  }, []);

  const handleAttentionItemClick = useCallback((item: AttentionItem) => {
    if (item.lat && item.lng) {
      const entity: MapEntity = {
        id: item.id,
        type: item.type,
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        needsAttention: true,
        attentionReason: item.reason,
      };
      setSelectedEntity(entity);
      setHighlightedEntity({ type: item.type, id: item.id });
    }
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  const allEntities = useMemo(() => {
    const entities: MapEntity[] = [];
    
    if (feedData?.organizations && filters.showOrganizations) {
      let orgs = feedData.organizations;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        orgs = orgs.filter(
          (o) =>
            o.name.toLowerCase().includes(query) ||
            o.city?.toLowerCase().includes(query) ||
            o.state?.toLowerCase().includes(query)
        );
      }
      entities.push(...orgs);
    }

    if (feedData?.leads && filters.showLeads) {
      let leads = feedData.leads;
      if (filters.myItemsOnly && user?.id) {
        leads = leads.filter((l) => l.ownerUserId === user.id);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        leads = leads.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.city?.toLowerCase().includes(query) ||
            l.state?.toLowerCase().includes(query)
        );
      }
      entities.push(...leads);
    }

    if (feedData?.orders && filters.showOrders) {
      entities.push(...feedData.orders);
    }

    if (feedData?.designJobs && filters.showDesignJobs) {
      entities.push(...feedData.designJobs);
    }

    if (filters.showAttentionOnly) {
      return entities.filter(e => e.needsAttention);
    }

    return entities;
  }, [feedData, filters, user?.id, searchQuery]);

  const entityCounts = useMemo(() => ({
    organizations: feedData?.organizations?.length || 0,
    leads: feedData?.leads?.length || 0,
    orders: feedData?.orders?.length || 0,
    designJobs: feedData?.designJobs?.length || 0,
    attention: attentionData?.counts.total || 0,
  }), [feedData, attentionData]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background flex flex-col" data-testid="sales-map-shell">
      <div className="absolute top-4 left-4 z-30">
        <div className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
          <Map className="h-5 w-5 text-primary" />
          <span className="font-semibold">Sales Map</span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">
            BETA
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-30">
        <TopHUD
          mode={mode}
          onModeChange={setMode}
          filters={filters}
          onFiltersChange={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          orgCount={entityCounts.organizations}
          leadCount={entityCounts.leads}
        />
      </div>

      <div className="absolute top-0 bottom-0 left-0 right-0 z-10">
        <ClusteredMapCanvas
          entities={allEntities}
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
          onEntityClick={handleEntityClick}
          selectedEntity={selectedEntity}
          highlightedEntityId={highlightedEntity}
        />
      </div>

      <RightDrawer
        entity={selectedEntity}
        onClose={handleCloseDrawer}
        isOpen={!!selectedEntity}
      />

      <OrdersPanel
        onOrderClick={(order) => {
          if (order.lat && order.lng && order.orgId) {
            setSelectedEntity({
              id: order.orgId,
              type: "organization",
              name: order.orgName || "Unknown",
              lat: order.lat,
              lng: order.lng,
            });
          }
        }}
      />

      <AttentionDashboard
        data={attentionData}
        isLoading={attentionLoading}
        isOpen={isAttentionDashboardOpen}
        onClose={() => setIsAttentionDashboardOpen(false)}
        onItemClick={handleAttentionItemClick}
      />

      <div className="absolute bottom-24 left-4 z-20 flex flex-col gap-2">
        <Button
          variant={isAttentionDashboardOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setIsAttentionDashboardOpen(!isAttentionDashboardOpen)}
          className={cn(
            "bg-background/90 backdrop-blur-lg border-white/10 gap-2",
            isAttentionDashboardOpen && "bg-amber-500 border-amber-500 hover:bg-amber-600"
          )}
          data-testid="toggle-attention-dashboard"
        >
          <AlertTriangle className="h-4 w-4" />
          Attention
          {(attentionData?.counts.total || 0) > 0 && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded text-xs font-bold",
              isAttentionDashboardOpen ? "bg-white/20 text-white" : "bg-red-500 text-white"
            )}>
              {attentionData?.counts.total}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => geocodeMutation.mutate()}
          disabled={geocodeMutation.isPending}
          className="bg-background/90 backdrop-blur-lg border-white/10 gap-2"
          data-testid="geocode-button"
        >
          {geocodeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPinned className="h-4 w-4" />
          )}
          {geocodeMutation.isPending ? "Geocoding..." : "Geocode Missing"}
        </Button>
      </div>

      <div className="absolute bottom-24 right-4 z-20">
        <div className="flex flex-wrap gap-2 p-3 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
          <FilterToggle
            active={filters.showOrganizations}
            onClick={() => setFilters(f => ({ ...f, showOrganizations: !f.showOrganizations }))}
            icon={Building2}
            label="Organizations"
            color="#3b82f6"
            count={entityCounts.organizations}
          />
          <FilterToggle
            active={filters.showLeads}
            onClick={() => setFilters(f => ({ ...f, showLeads: !f.showLeads }))}
            icon={Target}
            label="Leads"
            color="#f59e0b"
            count={entityCounts.leads}
          />
          <FilterToggle
            active={filters.showOrders}
            onClick={() => setFilters(f => ({ ...f, showOrders: !f.showOrders }))}
            icon={ShoppingCart}
            label="Orders"
            color="#22c55e"
            count={entityCounts.orders}
          />
          <FilterToggle
            active={filters.showDesignJobs}
            onClick={() => setFilters(f => ({ ...f, showDesignJobs: !f.showDesignJobs }))}
            icon={Palette}
            label="Design"
            color="#a855f7"
            count={entityCounts.designJobs}
          />
        </div>
      </div>

      {isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm">Loading map data...</span>
          </div>
        </div>
      )}

      <FloatingDock onSearchClick={() => setIsCommandPaletteOpen(true)} user={user} />
    </div>
  );
}

interface FilterToggleProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Building2;
  label: string;
  color: string;
  count: number;
}

function FilterToggle({ active, onClick, icon: Icon, label, color, count }: FilterToggleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200",
        active
          ? "bg-white/10 border border-white/20"
          : "bg-transparent border border-transparent opacity-50 hover:opacity-75"
      )}
      data-testid={`filter-toggle-${label.toLowerCase()}`}
    >
      <div
        className="w-3 h-3 rounded-full"
        style={{ background: active ? color : "#666" }}
      />
      <Icon className="h-4 w-4" style={{ color: active ? color : "#888" }} />
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs opacity-60">({count})</span>
    </motion.button>
  );
}
