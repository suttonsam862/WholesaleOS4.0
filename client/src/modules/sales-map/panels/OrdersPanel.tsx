import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Package, MapPin, ExternalLink, AlertTriangle, Clock, Palette, Target, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAttentionData } from "../data/useMapFeed";
import type { AttentionItem, EntityType } from "../types";

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

interface OrdersPanelProps {
  onOrderClick?: (order: MapOrder) => void;
  onAttentionItemClick?: (item: AttentionItem) => void;
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

export function OrdersPanel({ onOrderClick, onAttentionItemClick }: OrdersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("orders");

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

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 z-20 w-80 bg-background/95 backdrop-blur-lg rounded-lg border border-white/10 shadow-xl transition-all duration-300",
        isExpanded ? "max-h-[450px]" : "max-h-12"
      )}
      data-testid="orders-panel"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors rounded-t-lg"
        data-testid="orders-panel-toggle"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Orders & Attention</span>
          {attentionCount > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
              <AlertTriangle className="h-3 w-3" />
              {attentionCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="flex flex-col">
          <div className="flex border-b border-white/10 px-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors relative",
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
                "flex-1 px-3 py-2 text-xs font-medium transition-colors relative",
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
                        "flex items-center gap-2 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group",
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
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
                          "flex items-start gap-2 p-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer group",
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
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
