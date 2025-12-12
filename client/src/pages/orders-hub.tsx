import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STAGE_CONFIGS,
  getVisibleStages,
  computeStageCounts,
  type Order,
  type UserRole,
} from "@/lib/ordersStageConfig";

export default function OrdersHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const userRole = (user?.role || "sales") as UserRole;

  const visibleStages = useMemo(() => {
    return getVisibleStages(userRole);
  }, [userRole]);

  const stageCounts = useMemo(() => {
    let filteredOrders = orders;
    if (userRole === "sales") {
      filteredOrders = orders.filter((order) => order.salespersonId === user?.id);
    }
    return computeStageCounts(filteredOrders, userRole);
  }, [orders, userRole, user?.id]);

  if (ordersLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Orders</h1>
          <p className="text-muted-foreground">Loading your workflow...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-40" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Orders</h1>
          <p className="text-muted-foreground">Select a workflow stage to view orders</p>
        </div>
        <Link href="/orders/list">
          <Button variant="outline" data-testid="link-all-orders">
            <List className="h-4 w-4 mr-2" />
            View All Orders
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleStages.map((stage) => {
          const count = stageCounts[stage.id];
          const Icon = stage.icon;
          
          return (
            <Link
              key={stage.id}
              href={`/orders/list?stage=${stage.id}`}
              data-testid={`tile-stage-${stage.id}`}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring",
                  stage.borderColorClass,
                  "border-2"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${stage.label}: ${count} orders`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-3 rounded-lg", stage.bgColorClass)}>
                      <Icon className={cn("h-6 w-6", stage.colorClass)} aria-hidden="true" />
                    </div>
                    <span
                      className={cn(
                        "text-3xl font-bold",
                        count > 0 ? stage.colorClass : "text-muted-foreground"
                      )}
                      data-testid={`count-stage-${stage.id}`}
                    >
                      {count}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1" data-testid={`label-stage-${stage.id}`}>
                    {stage.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {stage.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    View orders
                    <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Click on any stage above to see orders in that workflow state. 
          Use "View All Orders" for a complete list with advanced filters.
        </p>
      </div>
    </div>
  );
}
