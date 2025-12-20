import { useState, useCallback, useMemo } from "react";
import { Map, MapPinned, Loader2, AlertTriangle, Filter, Menu, X } from "lucide-react";
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
import { MobileFloatingDock } from "@/components/layout/mobile-floating-dock";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";

export default function SalesMapShell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(4);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  }>({
    north: 49.384358,
    south: 24.396308,
    east: -66.93457,
    west: -125.0,
  });

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
    bounds,
    filters,
    enabled: true,
  });

  console.log("[SalesMapShell] feedData:", feedData);
  console.log("[SalesMapShell] allEntities count:", feedData ? (feedData.organizations?.length || 0) + (feedData.leads?.length || 0) + (feedData.orders?.length || 0) : 0);

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

  const getEntityUrl = useCallback((type: string, id: number) => {
    switch (type) {
      case "order": return `/orders/${id}`;
      case "lead": return `/leads/${id}`;
      case "designJob": return `/design-jobs/${id}`;
      case "organization": return `/organizations/${id}`;
      default: return "#";
    }
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
    } else {
      window.open(getEntityUrl(item.type, item.id), "_blank");
    }
  }, [getEntityUrl]);

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

  const activeFilterCount = useMemo(() => {
    return (filters.showOrganizations ? 1 : 0) +
      (filters.showLeads ? 1 : 0) +
      (filters.showOrders ? 1 : 0) +
      (filters.showDesignJobs ? 1 : 0) +
      (filters.myItemsOnly ? 1 : 0) +
      (filters.showAttentionOnly ? 1 : 0);
  }, [filters]);

  return (
    <div className="relative w-screen overflow-hidden bg-background flex flex-col" style={{ height: isMobile ? "100dvh" : "calc(100vh - 5rem)" }} data-testid="sales-map-shell">
      <div className={cn(
        "absolute z-30",
        isMobile ? "top-2 left-2 right-2" : "top-4 left-4"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg",
          isMobile && "justify-between"
        )}>
          <div className="flex items-center gap-2">
            <Map className={cn("text-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            <span className={cn("font-semibold", isMobile && "text-sm")}>Sales Map</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">
              BETA
            </span>
          </div>
          
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileControlsOpen(true)}
              className="h-10 w-10 min-h-[44px] min-w-[44px]"
              data-testid="mobile-controls-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {!isMobile && (
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
            orderCount={entityCounts.orders}
            designJobCount={entityCounts.designJobs}
          />
        </div>
      )}

      <div className="absolute top-0 bottom-0 left-0 right-0 z-10">
        <ClusteredMapCanvas
          entities={allEntities}
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
          onEntityClick={handleEntityClick}
          selectedEntity={selectedEntity}
          highlightedEntityId={highlightedEntity}
          isMobile={isMobile}
        />
      </div>

      <RightDrawer
        entity={selectedEntity}
        onClose={handleCloseDrawer}
        isOpen={!!selectedEntity}
        isMobile={isMobile}
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
        onAttentionItemClick={handleAttentionItemClick}
        filters={filters}
        onFiltersChange={setFilters}
        entityCounts={entityCounts}
        isMobile={isMobile}
      />

      <AttentionDashboard
        data={attentionData}
        isLoading={attentionLoading}
        isOpen={isAttentionDashboardOpen}
        onClose={() => setIsAttentionDashboardOpen(false)}
        onItemClick={handleAttentionItemClick}
      />

      {!isMobile && (
        <div className="absolute bottom-32 left-4 z-20 flex flex-col gap-2">
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
      )}

      {isMobile && (
        <div className="absolute bottom-24 left-2 z-20 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAttentionDashboardOpen(!isAttentionDashboardOpen)}
            className={cn(
              "flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-3 rounded-xl",
              "bg-background/90 backdrop-blur-xl border border-white/10 shadow-lg",
              isAttentionDashboardOpen && "bg-amber-500 border-amber-500"
            )}
            data-testid="mobile-attention-button"
          >
            <AlertTriangle className="h-5 w-5" />
            {(attentionData?.counts.total || 0) > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded text-xs font-bold min-w-[20px] text-center",
                isAttentionDashboardOpen ? "bg-white/20 text-white" : "bg-red-500 text-white"
              )}>
                {attentionData?.counts.total}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {isLoading && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 z-10",
          isMobile ? "bottom-28" : "bottom-4"
        )}>
          <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm">Loading map data...</span>
          </div>
        </div>
      )}

      {isMobile ? (
        <MobileFloatingDock onSearchClick={() => setIsCommandPaletteOpen(true)} user={user} />
      ) : (
        <FloatingDock onSearchClick={() => setIsCommandPaletteOpen(true)} user={user} />
      )}

      <Drawer open={isMobileControlsOpen} onOpenChange={setIsMobileControlsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-white/10">
            <DrawerTitle>Map Controls</DrawerTitle>
            <DrawerDescription>Configure filters and search</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-6 overflow-y-auto">
            <TopHUD
              mode={mode}
              onModeChange={setMode}
              filters={filters}
              onFiltersChange={setFilters}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              orgCount={entityCounts.organizations}
              leadCount={entityCounts.leads}
              orderCount={entityCounts.orders}
              designJobCount={entityCounts.designJobs}
              isMobileSheet
            />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
              <Button
                variant="outline"
                onClick={() => {
                  geocodeMutation.mutate();
                  setIsMobileControlsOpen(false);
                }}
                disabled={geocodeMutation.isPending}
                className="w-full min-h-[48px] gap-2"
                data-testid="mobile-geocode-button"
              >
                {geocodeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPinned className="h-4 w-4" />
                )}
                {geocodeMutation.isPending ? "Geocoding..." : "Geocode Missing Locations"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-lg font-bold text-blue-500">{entityCounts.organizations}</div>
                <div className="text-xs text-muted-foreground">Organizations</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-lg font-bold text-amber-500">{entityCounts.leads}</div>
                <div className="text-xs text-muted-foreground">Leads</div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <div className="text-lg font-bold text-green-500">{entityCounts.orders}</div>
                <div className="text-xs text-muted-foreground">Orders</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-lg font-bold text-purple-500">{entityCounts.designJobs}</div>
                <div className="text-xs text-muted-foreground">Design Jobs</div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
