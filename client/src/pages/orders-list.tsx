import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  Filter,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STAGE_CONFIGS,
  getStageConfig,
  getOrderStage,
  type Order,
  type StageId,
  type UserRole,
} from "@/lib/ordersStageConfig";
import { OrgLogo } from "@/components/ui/org-logo";

interface Organization {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function OrdersList() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const params = new URLSearchParams(searchString);
  const stageParam = params.get("stage") as StageId | null;
  const statusParam = params.get("status");
  const priorityParam = params.get("priority");
  const searchParam = params.get("search") || "";
  const salespersonParam = params.get("salesperson");

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const navigateToOrder = useCallback((orderId: number) => {
    const returnUrl = `/orders/list${searchString ? `?${searchString}` : ""}`;
    setLocation(`/orders/${orderId}?from=${encodeURIComponent(returnUrl)}`);
  }, [searchString, setLocation]);

  const stageConfig = stageParam ? getStageConfig(stageParam) : null;

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

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
    enabled: isAuthenticated,
  });

  const orgMap = useMemo(() => {
    const map = new Map<number, Organization>();
    for (const org of organizations) {
      map.set(org.id, org);
    }
    return map;
  }, [organizations]);

  const userRole = (user?.role || "sales") as UserRole;

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (userRole === "sales") {
      result = result.filter((order) => order.salespersonId === user?.id);
    }

    if (salespersonParam === "me" && user?.id) {
      result = result.filter((order) => order.salespersonId === user.id);
    } else if (salespersonParam && salespersonParam !== "me") {
      result = result.filter((order) => order.salespersonId === salespersonParam);
    }

    if (stageConfig) {
      result = result.filter(stageConfig.filter);
    }

    if (statusParam) {
      const statuses = statusParam.split(",");
      result = result.filter((order) => statuses.includes(order.status));
    }

    if (priorityParam) {
      const priorities = priorityParam.split(",");
      result = result.filter((order) => priorities.includes(order.priority));
    }

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((order) => {
        const org = orgMap.get(order.orgId);
        return (
          order.orderCode.toLowerCase().includes(searchLower) ||
          order.orderName.toLowerCase().includes(searchLower) ||
          org?.name.toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [orders, stageConfig, statusParam, priorityParam, debouncedSearch, userRole, user?.id, salespersonParam, orgMap]);

  const updateUrlParams = useCallback((key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchString);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setLocation(`/orders/list?${newParams.toString()}`);
  }, [searchString, setLocation]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setLocation("/orders/list");
  }, [setLocation]);

  const hasActiveFilters = stageParam || statusParam || priorityParam || debouncedSearch || salespersonParam;

  if (ordersLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="link-back-to-hub">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/orders">
          <Button variant="ghost" size="sm" data-testid="link-back-to-hub">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {stageConfig ? stageConfig.label : "All Orders"}
          </h1>
          {stageConfig && (
            <p className="text-muted-foreground">{stageConfig.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        {!stageParam && (
          <Select
            value={stageParam || "all"}
            onValueChange={(value) => updateUrlParams("stage", value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-stage">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGE_CONFIGS.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={priorityParam || "all"}
          onValueChange={(value) => updateUrlParams("priority", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[140px]" data-testid="select-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No orders found matching your filters.</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const org = orgMap.get(order.orgId);
            const orderStage = getOrderStage(order);
            const StageIcon = orderStage?.icon;

            return (
              <Card
                key={order.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                  "focus-visible:ring-2 focus-visible:ring-ring"
                )}
                tabIndex={0}
                role="button"
                onClick={() => navigateToOrder(order.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateToOrder(order.id);
                  }
                }}
                data-testid={`card-order-${order.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <OrgLogo
                        orgId={order.orgId}
                        orgName={org?.name || "Organization"}
                        src={org?.logoUrl}
                        size="md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground" data-testid={`text-order-code-${order.id}`}>
                          {order.orderCode}
                        </span>
                        {order.priority === "high" && (
                          <Badge variant="destructive" className="text-xs">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold truncate" data-testid={`text-order-name-${order.id}`}>
                        {order.orderName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {org?.name || "Unknown Organization"}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-3">
                      <div className="flex items-center gap-1.5" title="Design Approved">
                        {order.designApproved ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Design</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Sizes Validated">
                        {order.sizesValidated ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Sizes</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Deposit Received">
                        {order.depositReceived ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Deposit</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {orderStage && StageIcon && (
                        <Badge
                          variant="outline"
                          className={cn(orderStage.colorClass, orderStage.borderColorClass)}
                        >
                          <StageIcon className="h-3 w-3 mr-1" />
                          {orderStage.label}
                        </Badge>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
