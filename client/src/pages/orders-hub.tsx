import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionDeck } from "@/components/actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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
      <div className={cn("p-4 sm:p-6", isMobile && "pb-24")}>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Orders</h1>
          <p className="text-sm text-muted-foreground">Loading your workflow...</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className={cn("h-32 sm:h-40", isMobile ? "p-3" : "p-6")} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-4 sm:p-6", isMobile && "pb-24")}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">Orders</h1>
          <p className="text-sm text-muted-foreground">Select a workflow stage to view orders</p>
        </div>
        <Link href="/orders/list">
          <Button 
            variant="outline" 
            data-testid="link-all-orders"
            className={cn("min-h-[44px]", isMobile && "w-full")}
          >
            <List className="h-4 w-4 mr-2" />
            View All Orders
          </Button>
        </Link>
      </div>

      {isMobile ? (
        <ScrollArea className="w-full whitespace-nowrap mb-4">
          <div className="flex gap-2 pb-3">
            <ActionDeck hubId="orders" />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <ActionDeck hubId="orders" />
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                  "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                  stage.borderColorClass,
                  "border-2 min-h-[44px]"
                )}
                tabIndex={0}
                role="button"
                aria-label={`${stage.label}: ${count} orders`}
              >
                <CardContent className={cn(isMobile ? "p-3" : "p-6")}>
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className={cn(
                      "rounded-lg",
                      isMobile ? "p-2" : "p-3",
                      stage.bgColorClass
                    )}>
                      <Icon className={cn(
                        isMobile ? "h-5 w-5" : "h-6 w-6",
                        stage.colorClass
                      )} aria-hidden="true" />
                    </div>
                    <span
                      className={cn(
                        isMobile ? "text-2xl" : "text-3xl",
                        "font-bold",
                        count > 0 ? stage.colorClass : "text-muted-foreground"
                      )}
                      data-testid={`count-stage-${stage.id}`}
                    >
                      {count}
                    </span>
                  </div>
                  <h3 className={cn(
                    "font-semibold mb-0.5 sm:mb-1",
                    isMobile ? "text-sm" : "text-lg"
                  )} data-testid={`label-stage-${stage.id}`}>
                    {stage.label}
                  </h3>
                  <p className={cn(
                    "text-muted-foreground mb-2 sm:mb-3 line-clamp-2",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {stage.description}
                  </p>
                  <div className={cn(
                    "flex items-center font-medium text-primary",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    View orders
                    <ArrowRight className={cn(
                      "ml-1",
                      isMobile ? "h-3 w-3" : "h-4 w-4"
                    )} aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className={cn(
        "mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/50 rounded-lg",
        isMobile && "mb-20"
      )}>
        <p className="text-xs sm:text-sm text-muted-foreground">
          <strong>Tip:</strong> Click on any stage above to see orders in that workflow state. 
          Use "View All Orders" for a complete list with advanced filters.
        </p>
      </div>
    </div>
  );
}
