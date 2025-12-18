import { useQuery } from "@tanstack/react-query";
import type { MapFeedResponse, MapFilters, AttentionDashboardData } from "../types";

interface UseFeedOptions {
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom?: number;
  filters?: MapFilters;
  enabled?: boolean;
}

function buildQueryString(bounds: UseFeedOptions["bounds"], filters?: MapFilters): string {
  const params = new URLSearchParams();
  if (bounds) {
    params.set("north", String(bounds.north));
    params.set("south", String(bounds.south));
    params.set("east", String(bounds.east));
    params.set("west", String(bounds.west));
  }
  if (filters?.myItemsOnly) {
    params.set("myItemsOnly", "true");
  }
  if (filters?.showOrganizations !== undefined) {
    params.set("showOrganizations", String(filters.showOrganizations));
  }
  if (filters?.showLeads !== undefined) {
    params.set("showLeads", String(filters.showLeads));
  }
  if (filters?.showOrders !== undefined) {
    params.set("showOrders", String(filters.showOrders));
  }
  if (filters?.showDesignJobs !== undefined) {
    params.set("showDesignJobs", String(filters.showDesignJobs));
  }
  if (filters?.showAttentionOnly) {
    params.set("showAttentionOnly", "true");
  }
  return params.toString();
}

export function useMapFeed({ bounds, zoom, filters, enabled = true }: UseFeedOptions) {
  const queryString = buildQueryString(bounds, filters);
  const isEnabled = enabled && !!bounds;
  
  console.log("[useMapFeed] bounds:", bounds, "enabled:", enabled, "isEnabled:", isEnabled);
  
  return useQuery<MapFeedResponse>({
    queryKey: [
      "/api/sales-map/feed",
      bounds?.north,
      bounds?.south,
      bounds?.east,
      bounds?.west,
      zoom,
      filters?.myItemsOnly,
      filters?.showOrganizations,
      filters?.showLeads,
      filters?.showOrders,
      filters?.showDesignJobs,
      filters?.showAttentionOnly,
    ],
    queryFn: async () => {
      console.log("[useMapFeed] Fetching feed with queryString:", queryString);
      try {
        const response = await fetch(`/api/sales-map/feed?${queryString}`);
        console.log("[useMapFeed] Response status:", response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[useMapFeed] Error response body:", errorText);
          throw new Error(`Failed to fetch map feed: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        console.log("[useMapFeed] Feed response:", data);
        return data;
      } catch (err) {
        console.error("[useMapFeed] Fetch error:", err);
        throw err;
      }
    },
    enabled: isEnabled,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useAttentionData(enabled: boolean = true) {
  return useQuery<AttentionDashboardData>({
    queryKey: ["/api/sales-map/attention"],
    queryFn: async () => {
      const response = await fetch("/api/sales-map/attention");
      if (!response.ok) {
        throw new Error("Failed to fetch attention data");
      }
      return response.json();
    },
    enabled,
    staleTime: 60000,
    refetchInterval: 120000,
  });
}
