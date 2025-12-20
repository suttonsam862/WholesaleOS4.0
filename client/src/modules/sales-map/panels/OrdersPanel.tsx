import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Package, MapPin, ExternalLink, AlertTriangle, Clock, Palette, Target, ShoppingCart, Building2, Filter, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAttentionData } from "../data/useMapFeed";
import type { AttentionItem, EntityType, MapFilters } from "../types";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";

interface MapOrder {
  id: number;
  orderCode: string;
  orgId: number | null;
  orgName?: string;
  status: string;
  estDelivery?: string;
  createdAt: string;
  lat: number | null;
  lng: number | null;
}

interface EntityCounts {
  organizations: number;
  leads: number;
  orders: number;
  designJobs: number;
  attention: number;
}

interface OrdersPanelProps {
  onOrderClick?: (order: MapOrder) => void;
  onAttentionItemClick?: (item: AttentionItem) => void;
  filters?: MapFilters;
  onFiltersChange?: (filters: MapFilters) => void;
  entityCounts?: EntityCounts;
  isMobile?: boolean;
}

type TabType = "orders" | "attention";

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

const entityIcons: Record<EntityType, typeof ShoppingCart> = {
  order: ShoppingCart,
  lead: Target,
  designJob: Palette,
  organization: Package,
};

const entityColors: Record<EntityType, string> = {
  order: "text-green-500",
  lead: "text-amber-500",
  designJob: "text-purple-500",
  organization: "text-blue-500",
};

export function OrdersPanel({ onOrderClick, onAttentionItemClick, filters, onFiltersChange, entityCounts, isMobile = false }: OrdersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [showFilters, setShowFilters] = useState(false);
  const [panelHeight, setPanelHeight] = useState(isMobile ? "collapsed" : "expanded");

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ orders: MapOrder[] }>({
    queryKey: ["/api/sales-map/orders"],
  });

  const { data: attentionData, isLoading: attentionLoading } = useAttentionData(true);

  const orders = ordersData?.orders || [];
  const ordersWithLocation = orders.filter(o => o.lat && o.lng);

  const allAttentionItems = useMemo(() => {
    if (!attentionData) return [];
    
    const items: AttentionItem[] = [
      ...(attentionData.overdueOrders || []),
      ...(attentionData.stalledDesignJobs || []),
      ...(attentionData.hotLeads || []),
      ...(attentionData.urgentOrders || []),
    ];

    return items.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sevA = severityOrder[a.severity] ?? 4;
      const sevB = severityOrder[b.severity] ?? 4;
      if (sevA !== sevB) return sevA - sevB;

      const daysA = a.daysOverdue ?? 0;
      const daysB = b.daysOverdue ?? 0;
      return daysB - daysA;
    });
  }, [attentionData]);

  const attentionCount = attentionData?.counts.total || 0;

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    pending: "bg-blue-400",
    confirmed: "bg-cyan-500",
    in_progress: "bg-yellow-500",
    design_pending: "bg-purple-500",
    ready_for_production: "bg-orange-500",
    in_production: "bg-amber-500",
    shipped: "bg-green-500",
    delivered: "bg-emerald-500",
    completed: "bg-emerald-600",
    cancelled: "bg-red-500",
  };

  const handleAttentionClick = (item: AttentionItem) => {
    onAttentionItemClick?.(item);
  };

  const getEntityUrl = (type: EntityType, id: number) => {
    switch (type) {
      case "order": return `/orders/${id}`;
      case "lead": return `/leads/${id}`;
      case "designJob": return `/design-jobs/${id}`;
      case "organization": return `/organizations/${id}`;
      default: return "#";
    }
  };

  const activeFilterCount = filters
    ? (filters.showOrganizations ? 1 : 0) +
      (filters.showLeads ? 1 : 0) +
      (filters.showOrders ? 1 : 0) +
      (filters.showDesignJobs ? 1 : 0)
    : 0;

  const toggleFilter = (key: keyof MapFilters) => {
    if (onFiltersChange && filters) {
      onFiltersChange({ ...filters, [key]: !filters[key] });
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.velocity.y > 100 || info.offset.y > 50) {
      setIsExpanded(false);
    } else if (info.velocity.y < -100 || info.offset.y < -50) {
      setIsExpanded(true);
    }
  };

  if (isMobile) {
    return (
      <motion.div
        className={cn(
          "fixed left-2 right-2 z-30 bg-background/95 backdrop-blur-xl rounded-t-2xl border border-white/10 border-b-0 shadow-xl",
          "safe-area-bottom"
        )}
        style={{ bottom: "72px" }}
        initial={false}
        animate={{
          height: isExpanded ? "50vh" : "56px",
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        data-testid="orders-panel-mobile"
      >
        <motion.div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors" />
        </motion.div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-4 py-2 min-h-[44px]"
          data-testid="orders-panel-toggle-mobile"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Recent Activity</span>
            {attentionCount > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {attentionCount}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex border-b border-white/10 px-2">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={cn(
                    "flex-1 px-3 py-3 text-sm font-medium transition-colors relative min-h-[48px]",
                    activeTab === "orders"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  data-testid="tab-orders-mobile"
                >
                  Recent Orders
                  <span className="ml-1 text-xs opacity-60">({ordersWithLocation.length})</span>
                  {activeTab === "orders" && (
                    <motion.div layoutId="mobile-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("attention")}
                  className={cn(
                    "flex-1 px-3 py-3 text-sm font-medium transition-colors relative min-h-[48px]",
                    activeTab === "attention"
                      ? "text-red-400"
                      : "text-muted-foreground"
                  )}
                  data-testid="tab-attention-mobile"
                >
                  <span className="flex items-center justify-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Attention
                    {attentionCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {attentionCount}
                      </span>
                    )}
                  </span>
                  {activeTab === "attention" && (
                    <motion.div layoutId="mobile-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400 rounded-full" />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4">
                {activeTab === "orders" ? (
                  ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      No recent orders
                    </div>
                  ) : (
                    <div className="space-y-1 pt-2">
                      {orders.slice(0, 20).map((order) => (
                        <motion.button
                          key={order.id}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl w-full text-left min-h-[56px]",
                            "bg-white/5 hover:bg-white/10 transition-colors",
                            !order.lat && "opacity-60"
                          )}
                          onClick={() => order.lat && order.lng && onOrderClick?.(order)}
                          data-testid={`order-item-mobile-${order.id}`}
                        >
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full flex-shrink-0",
                              statusColors[order.status] || "bg-gray-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-mono text-primary">
                                {order.orderCode}
                              </span>
                              {order.lat && order.lng && (
                                <MapPin className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {order.orgName || "Unknown Org"}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </motion.button>
                      ))}
                    </div>
                  )
                ) : (
                  attentionLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-400 border-t-transparent" />
                    </div>
                  ) : allAttentionItems.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No items need attention
                    </div>
                  ) : (
                    <div className="space-y-1 pt-2">
                      {allAttentionItems.map((item, index) => {
                        const Icon = entityIcons[item.type] || Package;
                        const iconColor = entityColors[item.type] || "text-gray-500";
                        
                        return (
                          <motion.button
                            key={`${item.type}-${item.id}-${index}`}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-xl w-full text-left min-h-[56px]",
                              "bg-white/5 hover:bg-white/10 transition-colors",
                              !item.lat && "opacity-70"
                            )}
                            onClick={() => handleAttentionClick(item)}
                            data-testid={`attention-item-mobile-${item.type}-${item.id}`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="relative">
                                <Icon className={cn("h-5 w-5", iconColor)} />
                                <div
                                  className={cn(
                                    "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full",
                                    severityColors[item.severity] || "bg-gray-500"
                                  )}
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium truncate">
                                  {item.name}
                                </span>
                                {item.lat && item.lng && (
                                  <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {item.daysOverdue !== undefined && item.daysOverdue > 0 && (
                                  <Clock className="h-3 w-3 text-red-400" />
                                )}
                                <span className="truncate">{item.reason}</span>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </motion.button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "absolute bottom-24 right-4 z-30 w-80 max-w-[calc(100vw-2rem)] bg-background/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl transition-all duration-300",
        isExpanded ? "max-h-[500px]" : "max-h-12"
      )}
      data-testid="orders-panel"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity min-h-[44px]"
          data-testid="orders-panel-toggle"
        >
          <Package className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Map Controls</span>
          {attentionCount > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {attentionCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        
        {filters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-9 px-2 gap-1 min-h-[44px]",
              showFilters && "bg-white/10"
            )}
            data-testid="toggle-filters"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="text-xs">{activeFilterCount}</span>
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="flex flex-col">
          {showFilters && filters && (
            <div className="flex flex-wrap gap-1.5 p-2 border-b border-white/10 bg-white/5">
              <FilterChip
                active={filters.showOrganizations}
                onClick={() => toggleFilter("showOrganizations")}
                icon={Building2}
                label="Orgs"
                color="#3b82f6"
                count={entityCounts?.organizations || 0}
              />
              <FilterChip
                active={filters.showLeads}
                onClick={() => toggleFilter("showLeads")}
                icon={Target}
                label="Leads"
                color="#f59e0b"
                count={entityCounts?.leads || 0}
              />
              <FilterChip
                active={filters.showOrders}
                onClick={() => toggleFilter("showOrders")}
                icon={ShoppingCart}
                label="Orders"
                color="#22c55e"
                count={entityCounts?.orders || 0}
              />
              <FilterChip
                active={filters.showDesignJobs}
                onClick={() => toggleFilter("showDesignJobs")}
                icon={Palette}
                label="Design"
                color="#a855f7"
                count={entityCounts?.designJobs || 0}
              />
            </div>
          )}
          
          <div className="flex border-b border-white/10 px-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors relative min-h-[44px]",
                activeTab === "orders"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="tab-orders"
            >
              Recent Orders
              <span className="ml-1 text-xs opacity-60">({ordersWithLocation.length})</span>
              {activeTab === "orders" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("attention")}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors relative min-h-[44px]",
                activeTab === "attention"
                  ? "text-red-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="tab-attention"
            >
              <span className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Needs Attention
                {attentionCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {attentionCount}
                  </span>
                )}
              </span>
              {activeTab === "attention" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400 rounded-full" />
              )}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto px-2 pb-2">
            {activeTab === "orders" ? (
              ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No recent orders
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  {orders.slice(0, 20).map((order) => (
                    <div
                      key={order.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group min-h-[44px]",
                        !order.lat && "opacity-60"
                      )}
                      onClick={() => order.lat && order.lng && onOrderClick?.(order)}
                      data-testid={`order-item-${order.id}`}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          statusColors[order.status] || "bg-gray-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono text-primary">
                            {order.orderCode}
                          </span>
                          {order.lat && order.lng && (
                            <MapPin className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {order.orgName || "Unknown Org"}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/orders/${order.id}`, "_blank");
                        }}
                        data-testid={`order-link-${order.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : (
              attentionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-400 border-t-transparent" />
                </div>
              ) : allAttentionItems.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No items need attention
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  {allAttentionItems.map((item, index) => {
                    const Icon = entityIcons[item.type] || Package;
                    const iconColor = entityColors[item.type] || "text-gray-500";
                    
                    return (
                      <div
                        key={`${item.type}-${item.id}-${index}`}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group min-h-[44px]",
                          !item.lat && "opacity-70"
                        )}
                        onClick={() => handleAttentionClick(item)}
                        data-testid={`attention-item-${item.type}-${item.id}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="relative">
                            <Icon className={cn("h-4 w-4", iconColor)} />
                            <div
                              className={cn(
                                "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                                severityColors[item.severity] || "bg-gray-500"
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium truncate">
                              {item.name}
                            </span>
                            {item.lat && item.lng && (
                              <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {item.daysOverdue !== undefined && item.daysOverdue > 0 && (
                              <Clock className="h-3 w-3 text-red-400" />
                            )}
                            <span className="truncate">{item.reason}</span>
                          </div>
                          {item.deadline && (
                            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                              Due: {new Date(item.deadline).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(getEntityUrl(item.type, item.id), "_blank");
                          }}
                          data-testid={`attention-link-${item.type}-${item.id}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {activeTab === "attention" && allAttentionItems.length > 0 && (
            <div className="px-3 py-2 border-t border-white/10 flex gap-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Critical
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                High
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Medium
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Building2;
  label: string;
  color: string;
  count: number;
}

function FilterChip({ active, onClick, icon: Icon, label, color, count }: FilterChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-200 text-xs min-h-[36px]",
        active
          ? "bg-white/10 border border-white/20"
          : "bg-transparent border border-transparent opacity-50 hover:opacity-75"
      )}
      data-testid={`filter-chip-${label.toLowerCase()}`}
    >
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{ background: active ? color : "#666" }}
      />
      <Icon className="h-3.5 w-3.5" style={{ color: active ? color : "#888" }} />
      <span className="font-medium">{label}</span>
      <span className="opacity-60">({count})</span>
    </motion.button>
  );
}
