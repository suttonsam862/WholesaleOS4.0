/**
 * Order Map Page
 * 
 * A spatial, zone-based view of all orders showing their current position
 * in the workflow. Features velocity indicators, auto-clustering, and heat map mode.
 * 
 * Access: Admin and Ops roles only
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass";
import { DataCapsule } from "@/components/DataCapsule";
import {
  WorkflowZone,
  VelocityIndicator,
  OrderStatus,
  WORKFLOW_ZONES,
  ORDER_STATUS_CONFIG,
  VELOCITY_CONFIG,
  calculateVelocity,
  groupByZone,
  getZonesInOrder,
  getZoneStats,
} from "@/lib/status-system";

import {
  Map,
  LayoutGrid,
  Flame,
  Eye,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Calendar,
  RefreshCcw,
  Settings,
  ChevronDown,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface OrderMapOrder {
  id: number;
  orderCode: string;
  orderName: string;
  status: OrderStatus;
  orgId: number | null;
  salespersonId: string | null;
  estDelivery: string | null;
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'normal' | 'high';
  organization?: { name: string };
  salesperson?: { name: string };
}

type ViewMode = 'zones' | 'heatmap';

// =============================================================================
// ZONE COMPONENT
// =============================================================================

function ZoneColumn({ 
  zone, 
  orders, 
  onOrderClick,
  viewMode,
  showVelocity,
}: { 
  zone: WorkflowZone; 
  orders: OrderMapOrder[];
  onOrderClick: (orderId: number) => void;
  viewMode: ViewMode;
  showVelocity: boolean;
}) {
  const zoneConfig = WORKFLOW_ZONES[zone];
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Calculate velocity counts
  const velocityCounts = useMemo(() => {
    const counts: Record<VelocityIndicator, number> = { green: 0, yellow: 0, red: 0, grey: 0 };
    orders.forEach(order => {
      const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
      counts[velocity]++;
    });
    return counts;
  }, [orders]);

  // Auto-collapse if too many orders (cluster mode)
  const shouldCluster = orders.length > 8;
  const displayOrders = shouldCluster && !isExpanded ? orders.slice(0, 6) : orders;
  
  return (
    <motion.div
      className="flex-shrink-0 w-72"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Zone Header */}
      <div 
        className={cn(
          "p-3 rounded-t-xl border border-b-0 transition-colors",
          zoneConfig.bgClass,
          zoneConfig.borderClass
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              orders.length > 0 ? "animate-pulse" : "",
            )}
            style={{ backgroundColor: zoneConfig.color }}
            />
            <h3 className={cn("font-semibold text-sm", zoneConfig.textClass)}>
              {zoneConfig.shortLabel}
            </h3>
          </div>
          <span className={cn(
            "text-lg font-bold",
            zoneConfig.textClass
          )}>
            {orders.length}
          </span>
        </div>
        
        {/* Velocity mini-indicators */}
        {showVelocity && orders.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            {velocityCounts.green > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {velocityCounts.green}
              </span>
            )}
            {velocityCounts.yellow > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                {velocityCounts.yellow}
              </span>
            )}
            {velocityCounts.red > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {velocityCounts.red}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Orders List */}
      <div className={cn(
        "p-2 rounded-b-xl border border-t-0 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto",
        "bg-slate-900/50 backdrop-blur-sm",
        zoneConfig.borderClass
      )}>
        <AnimatePresence>
          {displayOrders.map((order, index) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onClick={() => onOrderClick(order.id)}
              index={index}
              viewMode={viewMode}
            />
          ))}
        </AnimatePresence>
        
        {/* Cluster indicator */}
        {shouldCluster && !isExpanded && orders.length > 6 && (
          <motion.button
            onClick={() => setIsExpanded(true)}
            className="w-full p-2 mt-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>+{orders.length - 6} more</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
        
        {orders.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            No orders in this zone
          </div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// ORDER CARD COMPONENT
// =============================================================================

function OrderCard({ 
  order, 
  onClick,
  index,
  viewMode,
}: { 
  order: OrderMapOrder; 
  onClick: () => void;
  index: number;
  viewMode: ViewMode;
}) {
  const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
  const velocityConfig = VELOCITY_CONFIG[velocity];
  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  
  // Calculate days since update
  const daysSinceUpdate = useMemo(() => {
    const updated = new Date(order.updatedAt);
    const now = new Date();
    return Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  }, [order.updatedAt]);

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200",
        "bg-white/5 border hover:bg-white/10",
        velocityConfig.borderClass,
        velocity !== 'grey' && velocityConfig.glowClass
      )}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {order.orderCode}
          </div>
          <div className="text-xs text-white/50 truncate">
            {order.orderName}
          </div>
        </div>
        
        {/* Velocity dot */}
        <div 
          className={cn(
            "w-3 h-3 rounded-full flex-shrink-0 mt-1",
            velocity === 'green' && "bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            velocity === 'yellow' && "bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]",
            velocity === 'red' && "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse",
            velocity === 'grey' && "bg-gray-400"
          )}
          title={velocityConfig.label}
        />
      </div>
      
      {/* Meta info */}
      <div className="flex items-center justify-between text-xs">
        <span className={cn(
          "px-1.5 py-0.5 rounded",
          statusConfig?.bgClass,
          statusConfig?.textClass
        )}>
          {statusConfig?.label || order.status}
        </span>
        
        <span className="text-white/40 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {daysSinceUpdate === 0 ? 'today' : `${daysSinceUpdate}d ago`}
        </span>
      </div>
      
      {/* Organization */}
      {order.organization?.name && (
        <div className="mt-2 text-xs text-white/40 truncate">
          {order.organization.name}
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// HEAT MAP VIEW
// =============================================================================

function HeatMapView({ 
  ordersByZone,
  onOrderClick,
}: { 
  ordersByZone: Record<WorkflowZone, OrderMapOrder[]>;
  onOrderClick: (orderId: number) => void;
}) {
  const zones = getZonesInOrder();
  
  // Calculate heat intensity based on problem orders (yellow + red velocity)
  const getHeatIntensity = (orders: OrderMapOrder[]): number => {
    if (orders.length === 0) return 0;
    
    let problemCount = 0;
    orders.forEach(order => {
      const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
      if (velocity === 'yellow') problemCount += 1;
      if (velocity === 'red') problemCount += 2;
    });
    
    return Math.min(problemCount / orders.length, 1);
  };
  
  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {zones.filter(z => z.id !== 'completed').map((zone) => {
        const orders = ordersByZone[zone.id] || [];
        const heatIntensity = getHeatIntensity(orders);
        
        return (
          <motion.div
            key={zone.id}
            className={cn(
              "relative p-6 rounded-xl border transition-all cursor-pointer",
              "bg-slate-900/50 backdrop-blur-sm",
              zone.borderClass
            )}
            style={{
              boxShadow: heatIntensity > 0 
                ? `inset 0 0 ${40 * heatIntensity}px rgba(239, 68, 68, ${0.3 * heatIntensity})`
                : undefined,
            }}
            whileHover={{ scale: 1.02 }}
          >
            {/* Heat overlay */}
            {heatIntensity > 0 && (
              <div 
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 pointer-events-none"
                style={{ opacity: heatIntensity * 0.5 }}
              />
            )}
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-semibold", zone.textClass)}>
                  {zone.shortLabel}
                </h3>
                <span className="text-2xl font-bold text-white">
                  {orders.length}
                </span>
              </div>
              
              {/* Problem indicator */}
              {heatIntensity > 0.3 && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Needs attention</span>
                </div>
              )}
              
              {/* Quick stats */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {['green', 'yellow', 'red'].map((v) => {
                  const count = orders.filter(o => 
                    calculateVelocity(o.updatedAt, o.estDelivery, o.status) === v
                  ).length;
                  return (
                    <div 
                      key={v}
                      className={cn(
                        "p-2 rounded text-center",
                        v === 'green' && "bg-green-500/10 text-green-400",
                        v === 'yellow' && "bg-yellow-500/10 text-yellow-400",
                        v === 'red' && "bg-red-500/10 text-red-400"
                      )}
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// =============================================================================
// STATS BAR COMPONENT
// =============================================================================

function StatsBar({ orders }: { orders: OrderMapOrder[] }) {
  const stats = useMemo(() => {
    const velocityCounts: Record<VelocityIndicator, number> = { green: 0, yellow: 0, red: 0, grey: 0 };
    let overdueCount = 0;
    
    orders.forEach(order => {
      const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
      velocityCounts[velocity]++;
      
      if (order.estDelivery && new Date(order.estDelivery) < new Date()) {
        overdueCount++;
      }
    });
    
    return { velocityCounts, overdueCount, total: orders.length };
  }, [orders]);
  
  return (
    <div className="flex items-center gap-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-neon-blue" />
        <span className="text-sm text-white/60">Total:</span>
        <span className="text-lg font-bold text-white">{stats.total}</span>
      </div>
      
      <div className="h-6 w-px bg-white/10" />
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-sm text-green-400">{stats.velocityCounts.green}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          <span className="text-sm text-yellow-400">{stats.velocityCounts.yellow}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-sm text-red-400">{stats.velocityCounts.red}</span>
        </div>
      </div>
      
      {stats.overdueCount > 0 && (
        <>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{stats.overdueCount} overdue</span>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OrderMap() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('zones');
  const [showVelocity, setShowVelocity] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  // Fetch all orders
  const { data: orders = [], isLoading, refetch } = useQuery<OrderMapOrder[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch organizations for enrichment
  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  // Enrich orders with organization data
  const enrichedOrders = useMemo(() => {
    return orders.map(order => ({
      ...order,
      organization: organizations.find(org => org.id === order.orgId),
    }));
  }, [orders, organizations]);

  // Group orders by zone
  const ordersByZone = useMemo(() => {
    return groupByZone(enrichedOrders, 'order');
  }, [enrichedOrders]);

  // Check access
  if (user?.role !== 'admin' && user?.role !== 'ops') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <GlassCard className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-white/60">
            Order Map is only available to Admin and Operations roles.
          </p>
        </GlassCard>
      </div>
    );
  }

  const zones = getZonesInOrder();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
              <Map className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Order Map</h1>
              <p className="text-sm text-white/50">Real-time workflow visualization</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Stats Bar */}
          <StatsBar orders={enrichedOrders} />
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('zones')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'zones' 
                  ? "bg-neon-blue/20 text-neon-blue" 
                  : "text-white/40 hover:text-white"
              )}
              title="Zone View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'heatmap' 
                  ? "bg-neon-blue/20 text-neon-blue" 
                  : "text-white/40 hover:text-white"
              )}
              title="Heat Map View"
            >
              <Flame className="w-4 h-4" />
            </button>
          </div>
          
          {/* Velocity Toggle */}
          <button
            onClick={() => setShowVelocity(!showVelocity)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              showVelocity 
                ? "bg-neon-purple/20 border-neon-purple/30 text-neon-purple" 
                : "bg-white/5 border-white/10 text-white/40"
            )}
            title="Toggle Velocity Indicators"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
          
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'zones' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {zones.map((zone) => (
            <ZoneColumn
              key={zone.id}
              zone={zone.id}
              orders={ordersByZone[zone.id] || []}
              onOrderClick={setSelectedOrderId}
              viewMode={viewMode}
              showVelocity={showVelocity}
            />
          ))}
        </div>
      ) : (
        <HeatMapView 
          ordersByZone={ordersByZone}
          onOrderClick={setSelectedOrderId}
        />
      )}

      {/* Data Capsule Modal */}
      <DataCapsule
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
