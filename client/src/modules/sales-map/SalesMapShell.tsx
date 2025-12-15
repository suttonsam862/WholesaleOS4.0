import { useState, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Map, MapPinned, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapCanvas } from "./map/MapCanvas";
import { TopHUD } from "./hud/TopHUD";
import { RightDrawer } from "./panels/RightDrawer";
import { CollapsibleSidebar } from "./panels/CollapsibleSidebar";
import { OrdersPanel } from "./panels/OrdersPanel";
import { useMapFeed } from "./data/useMapFeed";
import type { MapEntity, MapMode, MapFilters } from "./types";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SalesMapShell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<MapMode>("view");
  const [filters, setFilters] = useState<MapFilters>({
    showOrganizations: true,
    showLeads: true,
    myItemsOnly: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [bounds, setBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const geocodeMutation = useMutation({
    mutationFn: async () => {
      const orgRes = await apiRequest("POST", "/api/sales-map/geocode-organizations");
      const orgData = await orgRes.json();
      const leadRes = await apiRequest("POST", "/api/sales-map/geocode-leads");
      const leadData = await leadRes.json();
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

  const handleEntityClick = useCallback((entity: MapEntity) => {
    setSelectedEntity(entity);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedEntity(null);
  }, []);

  const displayedOrganizations = useMemo(() => {
    if (!feedData?.organizations) return [];
    let orgs = feedData.organizations;

    if (!filters.showOrganizations) return [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      orgs = orgs.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.city?.toLowerCase().includes(query) ||
          o.state?.toLowerCase().includes(query)
      );
    }

    return orgs;
  }, [feedData?.organizations, filters.showOrganizations, searchQuery]);

  const displayedLeads = useMemo(() => {
    if (!feedData?.leads) return [];
    let leads = feedData.leads;

    if (!filters.showLeads) return [];

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

    return leads;
  }, [feedData?.leads, filters.showLeads, filters.myItemsOnly, user?.id, searchQuery]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background" data-testid="sales-map-shell">
      <CollapsibleSidebar
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />

      <div
        className={cn(
          "absolute top-4 z-30 transition-all duration-300",
          sidebarExpanded ? "left-60" : "left-20"
        )}
      >
        <Link href="/sales/home">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/90 backdrop-blur-lg border-white/10 gap-2"
            data-testid="back-to-sales-home"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Home
          </Button>
        </Link>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
          <Map className="h-5 w-5 text-primary" />
          <span className="font-semibold">Sales Map</span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-medium">
            BETA
          </span>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-16 right-4 z-10 transition-all duration-300",
          sidebarExpanded ? "left-60" : "left-20"
        )}
      >
        <TopHUD
          mode={mode}
          onModeChange={setMode}
          filters={filters}
          onFiltersChange={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          orgCount={displayedOrganizations.length}
          leadCount={displayedLeads.length}
        />
      </div>

      <div
        className={cn(
          "absolute top-0 bottom-0 right-0 transition-all duration-300",
          sidebarExpanded ? "left-56" : "left-14"
        )}
      >
        <MapCanvas
          organizations={displayedOrganizations}
          leads={displayedLeads}
          onBoundsChange={handleBoundsChange}
          onEntityClick={handleEntityClick}
          selectedEntity={selectedEntity}
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

      <div
        className={cn(
          "absolute bottom-4 z-20 transition-all duration-300",
          sidebarExpanded ? "left-60" : "left-20"
        )}
      >
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
          {geocodeMutation.isPending ? "Geocoding..." : "Geocode Missing Locations"}
        </Button>
      </div>

      {isLoading && (
        <div
          className={cn(
            "absolute bottom-4 z-10 transition-all duration-300",
            sidebarExpanded ? "left-60" : "left-20"
          )}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-lg rounded-lg border border-white/10">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm">Loading map data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
