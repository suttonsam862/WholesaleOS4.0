import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Package, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
}

export function OrdersPanel({ onOrderClick }: OrdersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data, isLoading } = useQuery<{ orders: MapOrder[] }>({
    queryKey: ["/api/sales-map/orders"],
  });

  const orders = data?.orders || [];
  const ordersWithLocation = orders.filter(o => o.lat && o.lng);

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    in_progress: "bg-yellow-500",
    design_pending: "bg-purple-500",
    ready_for_production: "bg-orange-500",
    in_production: "bg-amber-500",
    shipped: "bg-green-500",
    delivered: "bg-emerald-500",
    completed: "bg-emerald-600",
    cancelled: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "absolute bottom-4 right-4 z-20 w-80 bg-background/95 backdrop-blur-lg rounded-lg border border-white/10 shadow-xl transition-all duration-300",
        isExpanded ? "max-h-96" : "max-h-12"
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
          <span className="font-medium text-sm">Recent Orders</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            {ordersWithLocation.length} mapped
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="max-h-80 overflow-y-auto px-2 pb-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No recent orders
            </div>
          ) : (
            <div className="space-y-1">
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
          )}
        </div>
      )}
    </div>
  );
}
