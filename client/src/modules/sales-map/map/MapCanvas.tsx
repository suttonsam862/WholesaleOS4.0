import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapEntity } from "../types";

interface MapCanvasProps {
  organizations: MapEntity[];
  leads: MapEntity[];
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onEntityClick?: (entity: MapEntity) => void;
  selectedEntity?: MapEntity | null;
}

const DARK_STYLE = {
  version: 8 as const,
  name: "Dark Premium",
  sources: {
    osm: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const US_CENTER: [number, number] = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 4;

export function MapCanvas({
  organizations,
  leads,
  onBoundsChange,
  onEntityClick,
  selectedEntity,
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);

  const handleBoundsChange = useCallback(() => {
    if (!map.current || !onBoundsChange) return;
    const bounds = map.current.getBounds();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, [onBoundsChange]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_STYLE,
      center: US_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.current.on("load", () => {
      setIsMapReady(true);
      handleBoundsChange();
    });

    map.current.on("moveend", handleBoundsChange);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [handleBoundsChange]);

  useEffect(() => {
    if (!map.current || !isMapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    organizations.forEach((org) => {
      if (!org.lat || !org.lng) return;

      const container = document.createElement("div");
      container.className = "sales-map-marker-container";
      container.style.cssText = `
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      `;

      const el = document.createElement("div");
      el.className = "sales-map-marker org-marker";
      
      const hasLogo = org.logoUrl && org.logoUrl.trim() !== '';
      const pinSize = hasLogo ? 36 : 28;
      
      el.style.cssText = `
        width: ${pinSize}px;
        height: ${pinSize}px;
        background: ${hasLogo ? '#ffffff' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'};
        border: 2px solid rgba(255,255,255,0.9);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      `;
      
      if (hasLogo) {
        const logoImg = document.createElement("img");
        logoImg.src = org.logoUrl!;
        logoImg.alt = org.name;
        logoImg.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        `;
        logoImg.onerror = () => {
          logoImg.style.display = 'none';
          el.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
          const fallbackInitials = document.createElement("span");
          fallbackInitials.textContent = org.name.slice(0, 2).toUpperCase();
          fallbackInitials.style.cssText = `
            color: white;
            font-size: 12px;
            font-weight: bold;
          `;
          el.appendChild(fallbackInitials);
        };
        el.appendChild(logoImg);
      } else {
        const initials = document.createElement("span");
        initials.textContent = org.name.slice(0, 2).toUpperCase();
        initials.style.cssText = `
          color: white;
          font-size: 10px;
          font-weight: bold;
        `;
        el.appendChild(initials);
      }
      
      if (selectedEntity?.id === org.id && selectedEntity?.type === 'organization') {
        el.style.transform = "scale(1.3)";
        el.style.boxShadow = "0 0 20px rgba(59, 130, 246, 0.8)";
      }

      if (org.orderCount && org.orderCount > 0) {
        const badge = document.createElement("div");
        badge.className = "order-count-badge";
        badge.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: 2px solid white;
          border-radius: 9px;
          color: white;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        badge.textContent = String(org.orderCount);
        container.appendChild(badge);
      }

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        if (!(selectedEntity?.id === org.id && selectedEntity?.type === 'organization')) {
          el.style.transform = "scale(1)";
        }
      });
      el.addEventListener("click", () => onEntityClick?.(org));

      container.appendChild(el);

      const marker = new maplibregl.Marker({ element: container })
        .setLngLat([org.lng, org.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return;

      const el = document.createElement("div");
      el.className = "sales-map-marker lead-marker";
      
      const stageColors: Record<string, string> = {
        future_lead: "#6b7280",
        lead: "#f59e0b",
        hot_lead: "#ef4444",
        mock_up: "#8b5cf6",
        mock_up_sent: "#a855f7",
        team_store_or_direct_order: "#22c55e",
        current_clients: "#10b981",
      };
      
      const color = stageColors[lead.stage || ""] || "#f59e0b";
      
      el.style.cssText = `
        width: 18px;
        height: 18px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.8);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 6px ${color}80;
        transition: transform 0.2s, box-shadow 0.2s;
        animation: pulse 2s infinite;
      `;

      if (selectedEntity?.id === lead.id && selectedEntity?.type === 'lead') {
        el.style.transform = "scale(1.3)";
        el.style.boxShadow = `0 0 20px ${color}`;
      }

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        if (!(selectedEntity?.id === lead.id && selectedEntity?.type === 'lead')) {
          el.style.transform = "scale(1)";
        }
      });
      el.addEventListener("click", () => onEntityClick?.(lead));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lead.lng, lead.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [organizations, leads, isMapReady, selectedEntity, onEntityClick]);

  useEffect(() => {
    if (!map.current || !selectedEntity?.lat || !selectedEntity?.lng) return;
    
    map.current.flyTo({
      center: [selectedEntity.lng, selectedEntity.lat],
      zoom: Math.max(map.current.getZoom(), 10),
      duration: 1000,
    });
  }, [selectedEntity]);

  return (
    <div ref={mapContainer} className="w-full h-full" data-testid="map-canvas">
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
