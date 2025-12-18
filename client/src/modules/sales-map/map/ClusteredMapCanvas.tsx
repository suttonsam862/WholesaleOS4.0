import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapEntity, EntityType } from "../types";
import { ENTITY_COLORS, STAGE_COLORS } from "../components/EntityIcons";

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
const CLUSTER_RADIUS_DEGREES = 0.5;

const ICON_SVGS: Record<EntityType, string> = {
  organization: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  lead: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  order: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  designJob: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="white"/><circle cx="17.5" cy="10.5" r=".5" fill="white"/><circle cx="8.5" cy="7.5" r=".5" fill="white"/><circle cx="6.5" cy="12.5" r=".5" fill="white"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>`,
};

const ATTENTION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;

interface ClusterData {
  key: string;
  entities: MapEntity[];
  centerLat: number;
  centerLng: number;
  breakdown: Record<EntityType, number>;
  hasAttention: boolean;
}

function getZoomBucket(zoom: number): string {
  const showLabels = zoom > 9;
  const sizeTier = zoom > 10 ? 'large' : zoom > 7 ? 'medium' : 'small';
  return `${showLabels}-${sizeTier}`;
}

function getEntityHash(entity: MapEntity, isSelected: boolean, isHighlighted: boolean, zoom: number): string {
  return JSON.stringify({
    type: entity.type,
    id: entity.id,
    name: entity.name,
    lat: entity.lat,
    lng: entity.lng,
    needsAttention: entity.needsAttention,
    attentionReason: entity.attentionReason,
    orderCount: entity.orderCount || 0,
    leadCount: entity.leadCount || 0,
    logoUrl: entity.logoUrl || '',
    stage: entity.stage || '',
    status: entity.status || '',
    city: entity.city || '',
    state: entity.state || '',
    clientType: entity.clientType || '',
    isSelected,
    isHighlighted,
    zoomBucket: getZoomBucket(zoom),
  });
}

function getClusterHash(cluster: ClusterData, zoom: number): string {
  return JSON.stringify({
    key: cluster.key,
    count: cluster.entities.length,
    hasAttention: cluster.hasAttention,
    breakdown: cluster.breakdown,
    centerLat: cluster.centerLat,
    centerLng: cluster.centerLng,
    zoomBucket: getZoomBucket(zoom),
  });
}

function createMarkerElement(
  entity: MapEntity,
  isSelected: boolean,
  isHighlighted: boolean,
  zoom: number,
  onClick: (e: MouseEvent) => void
): { element: HTMLDivElement; iconSize: number } {
  const el = document.createElement('div');
  el.className = 'map-marker';
  el.setAttribute('data-testid', `marker-${entity.type}-${entity.id}`);
  
  const baseSize = zoom > 10 ? 32 : zoom > 7 ? 28 : 24;
  const color = entity.type === 'lead' 
    ? (STAGE_COLORS[entity.stage || 'lead'] || ENTITY_COLORS.lead)
    : ENTITY_COLORS[entity.type];
  
  const scale = isSelected ? 1.3 : isHighlighted ? 1.2 : 1;
  const size = baseSize * scale;
  
  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${entity.type === 'organization' && entity.logoUrl ? 'white' : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`};
    border: 2px solid rgba(255,255,255,0.9);
    box-shadow: ${isSelected 
      ? `0 0 20px ${color}80, 0 4px 12px rgba(0,0,0,0.3)` 
      : `0 2px 8px ${color}40`};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: box-shadow 0.15s ease;
    z-index: ${isSelected ? 1000 : isHighlighted ? 500 : entity.needsAttention ? 100 : 10};
  `;
  
  if (entity.type === 'organization' && entity.logoUrl) {
    const img = document.createElement('img');
    img.src = entity.logoUrl;
    img.alt = entity.name;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
    img.onerror = () => {
      img.style.display = 'none';
      el.innerHTML = ICON_SVGS[entity.type];
      el.style.background = `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`;
    };
    el.appendChild(img);
  } else {
    el.innerHTML = ICON_SVGS[entity.type];
  }
  
  if (entity.needsAttention) {
    const badge = document.createElement('div');
    badge.className = 'attention-badge';
    badge.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 16px;
      height: 16px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid white;
    `;
    badge.innerHTML = ATTENTION_SVG;
    el.appendChild(badge);
  }
  
  if (entity.type === 'organization' && (entity.orderCount || 0) > 0) {
    const countBadge = document.createElement('div');
    countBadge.className = 'count-badge';
    countBadge.style.cssText = `
      position: absolute;
      bottom: -4px;
      right: -4px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: #22c55e;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid white;
      font-size: 10px;
      font-weight: bold;
      color: white;
    `;
    countBadge.textContent = String(entity.orderCount);
    el.appendChild(countBadge);
  }
  
  const baseZIndex = isSelected ? 1000 : isHighlighted ? 500 : entity.needsAttention ? 100 : 10;
  const baseShadow = isSelected 
    ? `0 0 20px ${color}80, 0 4px 12px rgba(0,0,0,0.3)` 
    : `0 2px 8px ${color}40`;
  
  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = `0 0 20px ${color}80, 0 4px 12px rgba(0,0,0,0.4)`;
    el.style.zIndex = String(baseZIndex + 1000);
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = baseShadow;
    el.style.zIndex = String(baseZIndex);
  });
  el.addEventListener('click', onClick);
  
  return { element: el, iconSize: size };
}

function createLabelElement(entity: MapEntity): HTMLDivElement {
  const label = document.createElement('div');
  label.className = 'map-marker-label';
  label.style.cssText = `
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 100%;
    margin-top: 4px;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.9);
    background: rgba(0,0,0,0.6);
    padding: 2px 8px;
    border-radius: 4px;
    backdrop-filter: blur(4px);
    pointer-events: none;
  `;
  label.textContent = entity.name.length > 20 ? entity.name.slice(0, 18) + '...' : entity.name;
  return label;
}

function createClusterElement(
  cluster: ClusterData,
  zoom: number,
  onClick: (e: MouseEvent) => void
): { element: HTMLDivElement; iconSize: number } {
  const el = document.createElement('div');
  el.className = 'map-cluster';
  el.setAttribute('data-testid', `cluster-${cluster.entities.length}`);
  
  const count = cluster.entities.length;
  const size = Math.min(60 + count * 0.5, 100);
  
  const sortedTypes = Object.entries(cluster.breakdown)
    .filter(([_, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]) as [EntityType, number][];
  
  const dominantType = sortedTypes[0]?.[0] || 'organization';
  const dominantColor = ENTITY_COLORS[dominantType];
  
  const total = Object.values(cluster.breakdown).reduce((a, b) => a + b, 0);
  const pieSegments = sortedTypes.map(([type, c]) => ({
    type: type as EntityType,
    percent: (c / total) * 100,
    color: ENTITY_COLORS[type as EntityType],
  }));
  
  let gradient = dominantColor;
  if (pieSegments.length > 1) {
    let cumulative = 0;
    const parts = pieSegments.map((seg) => {
      const start = cumulative;
      cumulative += seg.percent;
      return `${seg.color} ${start}% ${cumulative}%`;
    });
    gradient = `conic-gradient(${parts.join(', ')})`;
  }
  
  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${gradient};
    border: 3px solid rgba(255,255,255,0.5);
    box-shadow: 0 0 20px ${dominantColor}40, 0 0 40px ${dominantColor}20;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: box-shadow 0.15s ease;
    z-index: 50;
  `;
  
  const inner = document.createElement('div');
  inner.className = 'cluster-inner';
  inner.style.cssText = `
    width: ${size * 0.7}px;
    height: ${size * 0.7}px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, ${dominantColor}cc, ${dominantColor} 80%);
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  const countText = document.createElement('span');
  countText.className = 'cluster-count';
  countText.style.cssText = `
    color: white;
    font-weight: bold;
    font-size: 16px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  `;
  countText.textContent = count > 999 ? '999+' : String(count);
  inner.appendChild(countText);
  el.appendChild(inner);
  
  if (cluster.hasAttention) {
    const badge = document.createElement('div');
    badge.className = 'attention-badge';
    badge.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    badge.innerHTML = ATTENTION_SVG;
    el.appendChild(badge);
  }
  
  const legend = document.createElement('div');
  legend.className = 'cluster-legend';
  legend.style.cssText = `
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 6px;
    display: flex;
    gap: 6px;
    background: rgba(0,0,0,0.5);
    padding: 4px 8px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
  `;
  
  sortedTypes.slice(0, 3).forEach(([type, c]) => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; align-items: center; gap: 2px;';
    item.title = `${c} ${type}s`;
    
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${ENTITY_COLORS[type as EntityType]};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const num = document.createElement('span');
    num.style.cssText = 'font-size: 10px; color: white; font-weight: 500;';
    num.textContent = String(c);
    
    item.appendChild(dot);
    item.appendChild(num);
    legend.appendChild(item);
  });
  
  el.appendChild(legend);
  
  el.addEventListener('mouseenter', () => {
    el.style.boxShadow = `0 0 30px ${dominantColor}80, 0 0 60px ${dominantColor}40, 0 4px 12px rgba(0,0,0,0.4)`;
    el.style.zIndex = '1050';
  });
  el.addEventListener('mouseleave', () => {
    el.style.boxShadow = `0 0 20px ${dominantColor}40, 0 0 40px ${dominantColor}20`;
    el.style.zIndex = '50';
  });
  el.addEventListener('click', onClick);
  
  return { element: el, iconSize: size };
}

function calculateClusters(
  entities: MapEntity[],
  radiusDegrees: number
): { clusters: ClusterData[]; unclusteredEntities: MapEntity[] } {
  const clustered = new Set<string>();
  const clusters: ClusterData[] = [];
  
  const entitiesWithCoords = entities.filter(e => e.lat && e.lng);
  
  entitiesWithCoords.forEach((entity, i) => {
    const key = `${entity.type}-${entity.id}`;
    if (clustered.has(key)) return;
    
    const nearby: MapEntity[] = [entity];
    clustered.add(key);
    
    for (let j = i + 1; j < entitiesWithCoords.length; j++) {
      const other = entitiesWithCoords[j];
      const otherKey = `${other.type}-${other.id}`;
      if (clustered.has(otherKey)) continue;
      
      const latDiff = Math.abs(entity.lat - other.lat);
      const lngDiff = Math.abs(entity.lng - other.lng);
      
      if (latDiff < radiusDegrees && lngDiff < radiusDegrees) {
        nearby.push(other);
        clustered.add(otherKey);
      }
    }
    
    if (nearby.length > 1) {
      const breakdown: Record<EntityType, number> = { 
        organization: 0, 
        lead: 0, 
        order: 0, 
        designJob: 0 
      };
      let totalLat = 0, totalLng = 0;
      let hasAttention = false;
      
      nearby.forEach(e => {
        breakdown[e.type]++;
        totalLat += e.lat;
        totalLng += e.lng;
        if (e.needsAttention) hasAttention = true;
      });
      
      clusters.push({
        key: `cluster-${i}`,
        entities: nearby,
        centerLat: totalLat / nearby.length,
        centerLng: totalLng / nearby.length,
        breakdown,
        hasAttention,
      });
    }
  });
  
  const unclusteredEntities = entitiesWithCoords.filter(
    e => !clustered.has(`${e.type}-${e.id}`) || 
      clusters.every(c => c.entities.length === 1 || !c.entities.includes(e))
  );
  
  const singleEntityFromClusters = clusters
    .filter(c => c.entities.length === 1)
    .flatMap(c => c.entities);
  
  return {
    clusters: clusters.filter(c => c.entities.length > 1),
    unclusteredEntities: [...unclusteredEntities, ...singleEntityFromClusters],
  };
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
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const markerHashRef = useRef<Map<string, string>>(new Map());
  const clusterMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const clusterHashRef = useRef<Map<string, string>>(new Map());
  const labelsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  const onBoundsChangeRef = useRef(onBoundsChange);
  const onZoomChangeRef = useRef(onZoomChange);
  
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);
  
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_STYLE,
      center: US_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });
    
    map.current = mapInstance;

    mapInstance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    mapInstance.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    const handleMoveEnd = () => {
      const bounds = mapInstance.getBounds();
      onBoundsChangeRef.current?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };
    
    const handleZoomEnd = () => {
      const zoom = mapInstance.getZoom();
      setCurrentZoom(zoom);
      onZoomChangeRef.current?.(zoom);
    };

    mapInstance.on("load", () => {
      setIsMapReady(true);
      handleMoveEnd();
    });

    mapInstance.on("moveend", handleMoveEnd);
    mapInstance.on("zoomend", handleZoomEnd);

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current.clear();
      clusterMarkersRef.current.forEach(m => m.remove());
      clusterMarkersRef.current.clear();
      labelsRef.current.clear();
      mapInstance.remove();
      map.current = null;
    };
  }, []);

  const clusterRadius = useMemo(() => {
    if (currentZoom >= 12) return 0;
    if (currentZoom >= 10) return 0.05;
    if (currentZoom >= 8) return 0.1;
    if (currentZoom >= 6) return 0.3;
    return CLUSTER_RADIUS_DEGREES;
  }, [currentZoom]);

  const { clusters, unclusteredEntities } = useMemo(() => {
    if (clusterRadius === 0) {
      return { clusters: [], unclusteredEntities: entities.filter(e => e.lat && e.lng) };
    }
    return calculateClusters(entities, clusterRadius);
  }, [entities, clusterRadius]);

  const onEntityClickRef = useRef(onEntityClick);
  useEffect(() => {
    onEntityClickRef.current = onEntityClick;
  }, [onEntityClick]);

  // Debug: Add a test marker at a known location (New York City)
  useEffect(() => {
    if (!map.current || !isMapReady) return;
    
    // Test marker at NYC: lat 40.7128, lng -74.0060
    const testEl = document.createElement('div');
    testEl.style.cssText = `
      width: 40px;
      height: 40px;
      background: red;
      border: 4px solid yellow;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 10px;
    `;
    testEl.textContent = 'NYC';
    
    const testMarker = new maplibregl.Marker({ element: testEl })
      .setLngLat([-74.0060, 40.7128]) // NYC coordinates
      .addTo(map.current);
      
    console.log('[MapDebug] Added test marker at NYC [-74.0060, 40.7128]');
    
    return () => { testMarker.remove(); };
  }, [isMapReady]);

  useEffect(() => {
    if (!map.current || !isMapReady) return;
    
    const currentMarkerKeys = new Set<string>();
    const currentClusterKeys = new Set<string>();
    
    unclusteredEntities.forEach(entity => {
      if (!entity.lat || !entity.lng) return;
      
      const key = `${entity.type}-${entity.id}`;
      currentMarkerKeys.add(key);
      
      const isSelected = selectedEntity?.id === entity.id && selectedEntity?.type === entity.type;
      const isHighlighted = highlightedEntityId?.id === entity.id && highlightedEntityId?.type === entity.type;
      
      const newHash = getEntityHash(entity, isSelected, isHighlighted, currentZoom);
      const existingHash = markerHashRef.current.get(key);
      const existingMarker = markersRef.current.get(key);
      
      if (existingMarker && existingHash === newHash) {
        existingMarker.setLngLat([entity.lng, entity.lat]);
        return;
      }
      
      if (existingMarker) {
        existingMarker.remove();
        markersRef.current.delete(key);
        markerHashRef.current.delete(key);
        labelsRef.current.delete(key);
      }
      
      const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        onEntityClickRef.current?.(entity);
      };
      
      const { element: el, iconSize } = createMarkerElement(entity, isSelected, isHighlighted, currentZoom, handleClick);
      
      // Add label at higher zoom levels
      if (currentZoom > 9) {
        const label = createLabelElement(entity);
        el.appendChild(label);
        labelsRef.current.set(key, label);
      }
      
      // Use anchor 'bottom' and offset to ensure coordinate is at icon center
      // This avoids getBoundingClientRect issues with absolute positioned children
      // In MapLibre, negative y offset moves marker UP
      const marker = new maplibregl.Marker({ 
        element: el, 
        anchor: 'bottom',
        offset: [0, -(iconSize / 2)] // Negative to shift UP by half icon size
      })
        .setLngLat([entity.lng, entity.lat])
        .addTo(map.current!);
      
      markersRef.current.set(key, marker);
      markerHashRef.current.set(key, newHash);
    });
    
    clusters.forEach(cluster => {
      currentClusterKeys.add(cluster.key);
      
      const newHash = getClusterHash(cluster, currentZoom);
      const existingHash = clusterHashRef.current.get(cluster.key);
      const existingMarker = clusterMarkersRef.current.get(cluster.key);
      
      if (existingMarker && existingHash === newHash) {
        existingMarker.setLngLat([cluster.centerLng, cluster.centerLat]);
        return;
      }
      
      if (existingMarker) {
        existingMarker.remove();
        clusterMarkersRef.current.delete(cluster.key);
        clusterHashRef.current.delete(cluster.key);
      }
      
      const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (map.current) {
          map.current.flyTo({
            center: [cluster.centerLng, cluster.centerLat],
            zoom: Math.min(map.current.getZoom() + 3, 15),
            duration: 800,
          });
        }
      };
      
      const { element: el, iconSize } = createClusterElement(cluster, currentZoom, handleClick);
      
      // Use anchor 'bottom' and offset to ensure coordinate is at icon center
      // Cluster always has legend below, so we use the icon size for offset
      // In MapLibre, negative y offset moves marker UP
      const marker = new maplibregl.Marker({ 
        element: el, 
        anchor: 'bottom',
        offset: [0, -(iconSize / 2)] // Negative to shift UP by half icon size
      })
        .setLngLat([cluster.centerLng, cluster.centerLat])
        .addTo(map.current!);
      
      clusterMarkersRef.current.set(cluster.key, marker);
      clusterHashRef.current.set(cluster.key, newHash);
    });
    
    markersRef.current.forEach((marker, key) => {
      if (!currentMarkerKeys.has(key)) {
        marker.remove();
        markersRef.current.delete(key);
        markerHashRef.current.delete(key);
        labelsRef.current.delete(key);
      }
    });
    
    clusterMarkersRef.current.forEach((marker, key) => {
      if (!currentClusterKeys.has(key)) {
        marker.remove();
        clusterMarkersRef.current.delete(key);
        clusterHashRef.current.delete(key);
      }
    });
  }, [unclusteredEntities, clusters, selectedEntity, highlightedEntityId, currentZoom, isMapReady]);

  const prevSelectedEntityRef = useRef<{ type: EntityType; id: number } | null>(null);
  
  useEffect(() => {
    if (!map.current || !selectedEntity?.lat || !selectedEntity?.lng) {
      prevSelectedEntityRef.current = null;
      return;
    }
    
    const prevEntity = prevSelectedEntityRef.current;
    const isSameEntity = prevEntity && 
      prevEntity.type === selectedEntity.type && 
      prevEntity.id === selectedEntity.id;
    
    if (!isSameEntity) {
      map.current.flyTo({
        center: [selectedEntity.lng, selectedEntity.lat],
        zoom: Math.max(map.current.getZoom(), 10),
        duration: 1000,
      });
      prevSelectedEntityRef.current = { type: selectedEntity.type, id: selectedEntity.id };
    }
  }, [selectedEntity]);

  return (
    <div className="relative w-full h-full" data-testid="clustered-map-canvas">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
