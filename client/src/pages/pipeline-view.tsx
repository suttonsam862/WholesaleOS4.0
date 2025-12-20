/**
 * Pipeline View Page
 * 
 * A simplified, readable view of orders organized by grouping.
 * Clean card-based layout instead of complex Gantt timeline.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DataCapsule } from "@/components/DataCapsule";
import {
  OrderStatus,
  ORDER_STATUS_CONFIG,
  VELOCITY_CONFIG,
  calculateVelocity,
} from "@/lib/status-system";

import {
  GitBranch,
  Palette,
  Package,
  AlertTriangle,
  User,
  Building2,
  RefreshCcw,
  LayoutGrid,
  Calendar,
  ChevronRight,
  ChevronDown,
  Filter,
} from "lucide-react";

interface PipelineOrder {
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
  salesperson?: { id: string; name: string };
  designJobs?: any[];
}

type GroupByMode = 'salesperson' | 'designer' | 'status' | 'organization';

interface SwimLane {
  id: string;
  label: string;
  orders: PipelineOrder[];
}

function MobileOrderCard({ 
  order, 
  onClick,
  isExpanded,
  onToggleExpand,
}: { 
  order: PipelineOrder;
  onClick: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
  const velocityConfig = VELOCITY_CONFIG[velocity];
  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  
  const daysUntilDelivery = order.estDelivery 
    ? differenceInDays(new Date(order.estDelivery), new Date())
    : null;
  const isOverdue = daysUntilDelivery !== null && daysUntilDelivery < 0;
  
  return (
    <motion.div
      className={cn(
        "relative rounded-lg transition-all border",
        "bg-white/5 border",
        velocity === 'green' && "border-green-500/30",
        velocity === 'yellow' && "border-yellow-500/30",
        velocity === 'red' && "border-red-500/30",
        velocity === 'grey' && "border-gray-500/30",
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          velocity === 'green' && "bg-green-400",
          velocity === 'yellow' && "bg-yellow-400",
          velocity === 'red' && "bg-red-400 animate-pulse",
          velocity === 'grey' && "bg-gray-400"
        )}
      />
      
      <div 
        className="p-3 pl-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-semibold text-white text-sm">{order.orderCode}</span>
            {isOverdue && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0 shrink-0",
                statusConfig?.bgClass,
                statusConfig?.textClass,
                statusConfig?.borderClass
              )}
            >
              {statusConfig?.label}
            </Badge>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-white/40 transition-transform shrink-0",
            isExpanded && "rotate-180"
          )} />
        </div>
        
        <div className="text-xs text-white/60 truncate mt-1">{order.orderName}</div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 space-y-2 border-t border-white/5">
              {order.organization?.name && (
                <div className="text-xs text-white/40 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  {order.organization.name}
                </div>
              )}
              
              {order.estDelivery && (
                <div className={cn(
                  "text-xs flex items-center gap-1.5",
                  isOverdue ? "text-red-400" : "text-white/40"
                )}>
                  <Calendar className="w-3 h-3" />
                  Due: {format(new Date(order.estDelivery), 'MMM d, yyyy')}
                </div>
              )}
              
              {order.priority !== 'normal' && (
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    order.priority === 'high' && "border-red-500/50 text-red-400",
                    order.priority === 'low' && "border-gray-500/50 text-gray-400"
                  )}
                >
                  {order.priority} priority
                </Badge>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="w-full mt-2 py-2 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                View Full Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function OrderCard({ 
  order, 
  onClick,
}: { 
  order: PipelineOrder;
  onClick: () => void;
}) {
  const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
  const velocityConfig = VELOCITY_CONFIG[velocity];
  const statusConfig = ORDER_STATUS_CONFIG[order.status];
  
  const daysUntilDelivery = order.estDelivery 
    ? differenceInDays(new Date(order.estDelivery), new Date())
    : null;
  const isOverdue = daysUntilDelivery !== null && daysUntilDelivery < 0;
  
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-lg cursor-pointer transition-all group",
        "bg-white/5 hover:bg-white/10 border",
        velocity === 'green' && "border-green-500/30 hover:border-green-500/50",
        velocity === 'yellow' && "border-yellow-500/30 hover:border-yellow-500/50",
        velocity === 'red' && "border-red-500/30 hover:border-red-500/50",
        velocity === 'grey' && "border-gray-500/30 hover:border-gray-500/50",
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
          velocity === 'green' && "bg-green-400",
          velocity === 'yellow' && "bg-yellow-400",
          velocity === 'red' && "bg-red-400 animate-pulse",
          velocity === 'grey' && "bg-gray-400"
        )}
      />
      
      <div className="pl-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">{order.orderCode}</span>
            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
          </div>
          <div className="text-xs text-white/60 truncate mb-2">{order.orderName}</div>
          
          {order.organization?.name && (
            <div className="text-xs text-white/40 truncate flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {order.organization.name}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0",
              statusConfig?.bgClass,
              statusConfig?.textClass,
              statusConfig?.borderClass
            )}
          >
            {statusConfig?.label}
          </Badge>
          
          {order.estDelivery && (
            <span className={cn(
              "text-[10px] flex items-center gap-1",
              isOverdue ? "text-red-400" : "text-white/40"
            )}>
              <Calendar className="w-3 h-3" />
              {format(new Date(order.estDelivery), 'MMM d')}
            </span>
          )}
          
          {order.priority !== 'normal' && (
            <Badge 
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                order.priority === 'high' && "border-red-500/50 text-red-400",
                order.priority === 'low' && "border-gray-500/50 text-gray-400"
              )}
            >
              {order.priority}
            </Badge>
          )}
        </div>
      </div>
      
      <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

function SwimLaneSection({ 
  lane, 
  onOrderClick,
  isMobile,
  expandedOrderId,
  setExpandedOrderId,
}: { 
  lane: SwimLane;
  onOrderClick: (orderId: number) => void;
  isMobile: boolean;
  expandedOrderId: number | null;
  setExpandedOrderId: (id: number | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  
  const velocityStats = useMemo(() => {
    const stats = { green: 0, yellow: 0, red: 0, grey: 0 };
    lane.orders.forEach(order => {
      const velocity = calculateVelocity(order.updatedAt, order.estDelivery, order.status);
      stats[velocity]++;
    });
    return stats;
  }, [lane.orders]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4 sm:mb-6">
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-xs sm:text-sm font-semibold text-white">{lane.label}</h3>
            <Badge variant="outline" className="text-[10px] sm:text-xs text-white/50 border-white/20">
              {lane.orders.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              {velocityStats.green > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400" />
                  <span className="text-[10px] sm:text-xs text-green-400">{velocityStats.green}</span>
                </div>
              )}
              {velocityStats.yellow > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400" />
                  <span className="text-[10px] sm:text-xs text-yellow-400">{velocityStats.yellow}</span>
                </div>
              )}
              {velocityStats.red > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400" />
                  <span className="text-[10px] sm:text-xs text-red-400">{velocityStats.red}</span>
                </div>
              )}
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-white/40 transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2 sm:mt-3">
        {isMobile ? (
          <div className="space-y-2">
            {lane.orders.map((order) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                onClick={() => onOrderClick(order.id)}
                isExpanded={expandedOrderId === order.id}
                onToggleExpand={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {lane.orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onOrderClick(order.id)}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function FilterBar({ 
  groupBy,
  setGroupBy,
  orderCount,
  isMobile,
}: { 
  groupBy: GroupByMode;
  setGroupBy: (mode: GroupByMode) => void;
  orderCount: number;
  isMobile: boolean;
}) {
  const filterButtons = [
    { mode: 'salesperson' as const, icon: User, label: 'Sales', color: 'neon-blue' },
    { mode: 'designer' as const, icon: Palette, label: 'Designer', color: 'purple-400' },
    { mode: 'status' as const, icon: LayoutGrid, label: 'Status', color: 'cyan-400' },
    { mode: 'organization' as const, icon: Building2, label: 'Org', color: 'green-400' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <span className="text-xs sm:text-sm text-white/60 shrink-0">Group by:</span>
        <ScrollArea className="flex-1 sm:flex-none">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            {filterButtons.map(({ mode, icon: Icon, label, color }) => (
              <button
                key={mode}
                onClick={() => setGroupBy(mode)}
                className={cn(
                  "px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm transition-colors flex items-center gap-1 sm:gap-1.5 whitespace-nowrap",
                  groupBy === mode
                    ? `bg-${color}/20 text-${color}`
                    : "text-white/50 hover:text-white"
                )}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                {isMobile ? label.slice(0, 3) : label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      
      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
        <Package className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>{orderCount} active</span>
      </div>
    </div>
  );
}

function VelocityLegend({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <ScrollArea className="w-full">
        <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-lg">
          {Object.entries(VELOCITY_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 shrink-0">
              <div 
                className={cn(
                  "w-2 h-2 rounded-full",
                  key === 'green' && "bg-green-400",
                  key === 'yellow' && "bg-yellow-400",
                  key === 'red' && "bg-red-400",
                  key === 'grey' && "bg-gray-400"
                )}
              />
              <span className={cn("text-[10px]", config.textClass)}>{config.label}</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-lg">
      <span className="text-xs text-white/40 uppercase font-medium">Velocity:</span>
      {Object.entries(VELOCITY_CONFIG).map(([key, config]) => (
        <div key={key} className="flex items-center gap-2">
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              key === 'green' && "bg-green-400",
              key === 'yellow' && "bg-yellow-400",
              key === 'red' && "bg-red-400",
              key === 'grey' && "bg-gray-400"
            )}
          />
          <span className={cn("text-xs", config.textClass)}>{config.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PipelineView() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [groupBy, setGroupBy] = useState<GroupByMode>('salesperson');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const { data: orders = [], isLoading, refetch } = useQuery<PipelineOrder[]>({
    queryKey: ["/api/orders"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: designJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/design-jobs"],
  });

  const enrichedOrders = useMemo(() => {
    return orders
      .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
      .map(order => ({
        ...order,
        organization: organizations.find(org => org.id === order.orgId),
        salesperson: users.find(u => u.id === order.salespersonId),
        designJobs: designJobs.filter(job => job.orderId === order.id),
      }));
  }, [orders, organizations, users, designJobs]);

  const swimLanes = useMemo((): SwimLane[] => {
    const lanes: Map<string, SwimLane> = new Map();
    
    enrichedOrders.forEach(order => {
      let laneId: string;
      let laneLabel: string;
      
      switch (groupBy) {
        case 'salesperson':
          laneId = order.salespersonId || 'unassigned';
          laneLabel = order.salesperson?.name || 'Unassigned';
          break;
        case 'designer':
          const designer = order.designJobs?.[0]?.assignedToId;
          const designerUser = users.find(u => u.id === designer);
          laneId = designer || 'unassigned';
          laneLabel = designerUser?.name || 'No Designer';
          break;
        case 'status':
          laneId = order.status;
          laneLabel = ORDER_STATUS_CONFIG[order.status]?.label || order.status;
          break;
        case 'organization':
          laneId = String(order.orgId || 'no-org');
          laneLabel = order.organization?.name || 'No Organization';
          break;
        default:
          laneId = 'default';
          laneLabel = 'All Orders';
      }
      
      if (!lanes.has(laneId)) {
        lanes.set(laneId, { id: laneId, label: laneLabel, orders: [] });
      }
      
      lanes.get(laneId)!.orders.push(order);
    });
    
    return Array.from(lanes.values())
      .sort((a, b) => {
        if (groupBy === 'status') {
          const aOrder = ORDER_STATUS_CONFIG[a.id as OrderStatus]?.order || 999;
          const bOrder = ORDER_STATUS_CONFIG[b.id as OrderStatus]?.order || 999;
          return aOrder - bOrder;
        }
        return b.orders.length - a.orders.length;
      });
  }, [enrichedOrders, groupBy, users]);

  return (
    <div className="min-h-screen p-3 sm:p-6 pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
              <GitBranch className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">Pipeline View</h1>
              <p className="text-[10px] sm:text-sm text-white/50">Orders grouped by {groupBy}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <VelocityLegend isMobile={isMobile} />
          
          <button
            onClick={() => refetch()}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCcw className={cn("w-3 h-3 sm:w-4 sm:h-4", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <FilterBar
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        orderCount={enrichedOrders.length}
        isMobile={isMobile}
      />

      <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-280px)]">
        <div className="pr-2 sm:pr-4 pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCcw className="w-6 h-6 sm:w-8 sm:h-8 text-white/40 animate-spin" />
            </div>
          ) : swimLanes.length > 0 ? (
            swimLanes.map((lane) => (
              <SwimLaneSection
                key={lane.id}
                lane={lane}
                onOrderClick={setSelectedOrderId}
                isMobile={isMobile}
                expandedOrderId={expandedOrderId}
                setExpandedOrderId={setExpandedOrderId}
              />
            ))
          ) : (
            <div className="flex items-center justify-center py-20 text-white/40">
              <div className="text-center">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm sm:text-base">No active orders to display</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <DataCapsule
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
