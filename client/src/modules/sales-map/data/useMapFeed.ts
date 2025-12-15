import { useQuery } from "@tanstack/react-query";
import type { MapFeedResponse, MapFilters } from "../types";

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
  return params.toString();
}

export function useMapFeed({ bounds, zoom, filters, enabled = true }: UseFeedOptions) {
  const queryString = buildQueryString(bounds, filters);
  
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
    ],
    queryFn: async () => {
      const response = await fetch(`/api/sales-map/feed?${queryString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch map feed");
      }
      return response.json();
    },
    enabled: enabled && !!bounds,
    staleTime: 30000,
    refetchInterval: 60000,
  });
}
