import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import type { MapEntity, EntityType } from "../types";
import { ENTITY_COLORS, STAGE_COLORS } from "../components/EntityIcons";
import { Building2, Target, ShoppingCart, Palette, AlertTriangle } from "lucide-react";

interface ClusteredMapCanvasProps {
  entities: MapEntity[];
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onZoomChange?: (zoom: number) => void;
  onEntityClick?: (entity: MapEntity) => void;
  selectedEntity?: MapEntity | null;
  highlightedEntityId?: { type: EntityType; id: number } | null;
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
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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
const CLUSTER_BREAKPOINT = 8;

interface FloatingMarkerProps {
  entity: MapEntity;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  position: { x: number; y: number };
  zoom: number;
}

function FloatingMarker({ entity, isSelected, isHighlighted, onClick, position, zoom }: FloatingMarkerProps) {
  const getMarkerStyle = () => {
    const baseSize = zoom > 10 ? 32 : zoom > 7 ? 28 : 24;
    const scale = isSelected ? 1.3 : isHighlighted ? 1.2 : 1;
    
    switch (entity.type) {
      case "organization":
        return {
          Icon: Building2,
          color: ENTITY_COLORS.organization,
          size: baseSize,
          scale,
        };
      case "lead":
        return {
          Icon: Target,
          color: STAGE_COLORS[entity.stage || "lead"] || ENTITY_COLORS.lead,
          size: baseSize - 4,
          scale,
        };
      case "order":
        return {
          Icon: ShoppingCart,
          color: ENTITY_COLORS.order,
          size: baseSize - 2,
          scale,
        };
      case "designJob":
        return {
          Icon: Palette,
          color: ENTITY_COLORS.designJob,
          size: baseSize - 2,
          scale,
        };
    }
  };

  const style = getMarkerStyle();
  const showAttention = entity.needsAttention;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: style.scale, 
        opacity: 1,
        filter: isSelected ? "drop-shadow(0 0 12px " + style.color + ")" : "none",
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring", 
        damping: 20, 
        stiffness: 300,
      }}
      whileHover={{ scale: style.scale * 1.15 }}
      whileTap={{ scale: style.scale * 0.95 }}
      onClick={onClick}
      className="absolute cursor-pointer"
      style={{
        left: position.x - style.size / 2,
        top: position.y - style.size / 2,
        zIndex: isSelected ? 1000 : isHighlighted ? 500 : entity.needsAttention ? 100 : 10,
      }}
      data-testid={`marker-${entity.type}-${entity.id}`}
    >
      <div
        className="relative rounded-full flex items-center justify-center transition-shadow duration-200"
        style={{
          width: style.size,
          height: style.size,
          background: entity.type === "organization" && entity.logoUrl 
            ? "white" 
            : `linear-gradient(135deg, ${style.color} 0%, ${style.color}cc 100%)`,
          border: `2px solid rgba(255,255,255,0.9)`,
          boxShadow: isSelected 
            ? `0 0 20px ${style.color}80, 0 4px 12px rgba(0,0,0,0.3)` 
            : `0 2px 8px ${style.color}40`,
        }}
      >
        {entity.type === "organization" && entity.logoUrl ? (
          <img 
            src={entity.logoUrl} 
            alt={entity.name} 
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <style.Icon 
            className="text-white" 
            size={style.size * 0.5} 
          />
        )}
        
        {showAttention && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-white"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}
        
        {entity.type === "organization" && (entity.orderCount || 0) > 0 && (
          <div 
            className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 bg-green-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border border-white"
          >
            {entity.orderCount}
          </div>
        )}
      </div>
      
      {zoom > 9 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap"
        >
          <span className="text-xs font-medium text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
            {entity.name.length > 20 ? entity.name.slice(0, 18) + "..." : entity.name}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

interface ClusterMarkerProps {
  count: number;
  position: { x: number; y: number };
  heatLevel: number;
  onClick: () => void;
  entityBreakdown: Record<EntityType, number>;
}

function ClusterMarker({ count, position, heatLevel, onClick, entityBreakdown }: ClusterMarkerProps) {
  const size = Math.min(60 + count * 0.5, 100);
  
  const sortedTypes = Object.entries(entityBreakdown)
    .filter(([_, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]) as [EntityType, number][];
  
  const dominantType = sortedTypes[0]?.[0] || "organization";
  const dominantColor = ENTITY_COLORS[dominantType];
  const dominantColorLight = `${dominantColor}cc`;
  
  const hasAttention = heatLevel > 0.6;
  
  const total = Object.values(entityBreakdown).reduce((a, b) => a + b, 0);
  const pieSegments: { type: EntityType; percent: number; color: string }[] = sortedTypes.map(([type, c]) => ({
    type: type as EntityType,
    percent: (c / total) * 100,
    color: ENTITY_COLORS[type as EntityType],
  }));
  
  const generatePieGradient = () => {
    if (pieSegments.length === 0) return dominantColor;
    if (pieSegments.length === 1) return pieSegments[0].color;
    
    let gradient = "conic-gradient(";
    let cumulative = 0;
    pieSegments.forEach((seg, i) => {
      const start = cumulative;
      cumulative += seg.percent;
      gradient += `${seg.color} ${start}% ${cumulative}%`;
      if (i < pieSegments.length - 1) gradient += ", ";
    });
    gradient += ")";
    return gradient;
  };
  
  const topIcons = sortedTypes.slice(0, 3);
  const IconMap: Record<EntityType, typeof Building2> = {
    organization: Building2,
    lead: Target,
    order: ShoppingCart,
    designJob: Palette,
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
      }}
      exit={{ 
        scale: 1.5, 
        opacity: 0,
        filter: "blur(8px)",
      }}
      transition={{ 
        type: "spring", 
        damping: 15, 
        stiffness: 200,
      }}
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className="absolute cursor-pointer"
      style={{
        left: position.x - size / 2,
        top: position.y - size / 2,
        zIndex: 50,
      }}
      data-testid={`cluster-${count}`}
    >
      <motion.div
        animate={{
          boxShadow: [
            `0 0 20px ${dominantColor}40, 0 0 40px ${dominantColor}20`,
            `0 0 30px ${dominantColor}60, 0 0 60px ${dominantColor}30`,
            `0 0 20px ${dominantColor}40, 0 0 40px ${dominantColor}20`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: generatePieGradient(),
          border: "3px solid rgba(255,255,255,0.5)",
        }}
      >
        <div 
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            background: `radial-gradient(circle at 30% 30%, ${dominantColorLight}, ${dominantColor} 80%)`,
          }}
        >
          <span className="text-white font-bold text-lg drop-shadow-lg">
            {count > 999 ? "999+" : count}
          </span>
        </div>
        
        {hasAttention && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
          >
            <AlertTriangle className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.div>
      
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 flex gap-1.5 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
        {topIcons.map(([type, c]) => {
          const Icon = IconMap[type as EntityType];
          return (
            <div 
              key={type}
              className="flex items-center gap-0.5"
              title={`${c} ${type}s`}
            >
              <div 
                className="w-3 h-3 rounded-full flex items-center justify-center"
                style={{ background: ENTITY_COLORS[type as EntityType] }}
              >
                <Icon className="w-2 h-2 text-white" />
              </div>
              <span className="text-[10px] text-white font-medium">{c}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ClusteredMapCanvas({
  entities,
  onBoundsChange,
  onZoomChange,
  onEntityClick,
  selectedEntity,
  highlightedEntityId,
}: ClusteredMapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [markerPositions, setMarkerPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const rafRef = useRef<number | null>(null);
  const isMovingRef = useRef(false);

  const updateMarkerPositions = useCallback(() => {
    if (!map.current) return;
    
    const newPositions = new Map<string, { x: number; y: number }>();
    
    entities.forEach((entity) => {
      if (!entity.lat || !entity.lng) return;
      const point = map.current!.project([entity.lng, entity.lat]);
      newPositions.set(`${entity.type}-${entity.id}`, { x: point.x, y: point.y });
    });
    
    setMarkerPositions(newPositions);
  }, [entities]);

  const throttledUpdatePositions = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      updateMarkerPositions();
      rafRef.current = null;
    });
  }, [updateMarkerPositions]);

  const handleMapMove = useCallback(() => {
    if (!map.current || !onBoundsChange) return;
    const bounds = map.current.getBounds();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    updateMarkerPositions();
  }, [onBoundsChange, updateMarkerPositions]);

  const handleZoom = useCallback(() => {
    if (!map.current) return;
    const zoom = map.current.getZoom();
    setCurrentZoom(zoom);
    onZoomChange?.(zoom);
    updateMarkerPositions();
  }, [onZoomChange, updateMarkerPositions]);

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
      handleMapMove();
    });

    map.current.once("idle", () => {
      handleMapMove();
    });

    map.current.on("movestart", () => {
      isMovingRef.current = true;
    });

    map.current.on("move", throttledUpdatePositions);

    map.current.on("moveend", () => {
      isMovingRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      handleMapMove();
    });
    
    map.current.on("zoomend", handleZoom);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      map.current?.remove();
      map.current = null;
    };
  }, [handleMapMove, handleZoom, throttledUpdatePositions]);

  useEffect(() => {
    if (isMapReady) {
      updateMarkerPositions();
    }
  }, [entities, isMapReady, updateMarkerPositions]);

  useEffect(() => {
    if (!map.current || !selectedEntity?.lat || !selectedEntity?.lng) return;
    
    map.current.flyTo({
      center: [selectedEntity.lng, selectedEntity.lat],
      zoom: Math.max(map.current.getZoom(), 10),
      duration: 1000,
    });
  }, [selectedEntity]);

  const clusters = useMemo(() => {
    if (currentZoom >= CLUSTER_BREAKPOINT || !map.current) return [];
    
    const gridSize = 100;
    const clusterMap = new Map<string, {
      entities: MapEntity[];
      centerX: number;
      centerY: number;
      breakdown: Record<EntityType, number>;
      hasAttention: boolean;
    }>();
    
    entities.forEach((entity) => {
      const pos = markerPositions.get(`${entity.type}-${entity.id}`);
      if (!pos) return;
      
      const gridX = Math.floor(pos.x / gridSize);
      const gridY = Math.floor(pos.y / gridSize);
      const key = `${gridX}-${gridY}`;
      
      if (!clusterMap.has(key)) {
        clusterMap.set(key, {
          entities: [],
          centerX: 0,
          centerY: 0,
          breakdown: { organization: 0, lead: 0, order: 0, designJob: 0 },
          hasAttention: false,
        });
      }
      
      const cluster = clusterMap.get(key)!;
      cluster.entities.push(entity);
      cluster.centerX += pos.x;
      cluster.centerY += pos.y;
      cluster.breakdown[entity.type]++;
      if (entity.needsAttention) cluster.hasAttention = true;
    });
    
    return Array.from(clusterMap.entries())
      .filter(([_, cluster]) => cluster.entities.length > 1)
      .map(([key, cluster]) => ({
        key,
        count: cluster.entities.length,
        position: {
          x: cluster.centerX / cluster.entities.length,
          y: cluster.centerY / cluster.entities.length,
        },
        breakdown: cluster.breakdown,
        hasAttention: cluster.hasAttention,
        heatLevel: Math.min(cluster.entities.length / 20, 1),
        entityIds: new Set(cluster.entities.map(e => `${e.type}-${e.id}`)),
      }));
  }, [entities, markerPositions, currentZoom]);

  const clusteredEntityIds = useMemo(() => {
    const ids = new Set<string>();
    clusters.forEach(c => c.entityIds.forEach(id => ids.add(id)));
    return ids;
  }, [clusters]);

  const visibleEntities = useMemo(() => {
    if (currentZoom >= CLUSTER_BREAKPOINT) return entities;
    return entities.filter(e => !clusteredEntityIds.has(`${e.type}-${e.id}`));
  }, [entities, clusteredEntityIds, currentZoom]);

  const handleClusterClick = useCallback((cluster: typeof clusters[0]) => {
    if (!map.current) return;
    
    const currentZoomLevel = map.current.getZoom();
    map.current.flyTo({
      center: map.current.unproject([cluster.position.x, cluster.position.y]),
      zoom: Math.min(currentZoomLevel + 3, 15),
      duration: 800,
    });
  }, []);

  return (
    <div className="relative w-full h-full" data-testid="clustered-map-canvas">
      <div ref={mapContainer} className="w-full h-full" />
      
      {isMapReady && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence mode="sync">
            {clusters.map((cluster) => (
              <div key={cluster.key} className="pointer-events-auto">
                <ClusterMarker
                  count={cluster.count}
                  position={cluster.position}
                  heatLevel={cluster.heatLevel}
                  entityBreakdown={cluster.breakdown}
                  onClick={() => handleClusterClick(cluster)}
                />
              </div>
            ))}
            
            {visibleEntities.map((entity) => {
              const pos = markerPositions.get(`${entity.type}-${entity.id}`);
              if (!pos) return null;
              
              return (
                <div key={`${entity.type}-${entity.id}`} className="pointer-events-auto">
                  <FloatingMarker
                    entity={entity}
                    isSelected={selectedEntity?.id === entity.id && selectedEntity?.type === entity.type}
                    isHighlighted={highlightedEntityId?.id === entity.id && highlightedEntityId?.type === entity.type}
                    onClick={() => onEntityClick?.(entity)}
                    position={pos}
                    zoom={currentZoom}
                  />
                </div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
          50% { filter: drop-shadow(0 0 16px currentColor); }
        }
      `}</style>
    </div>
  );
}
