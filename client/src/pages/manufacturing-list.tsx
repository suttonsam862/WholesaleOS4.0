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
  Filter,
  X,
  RefreshCw,
  Factory,
  Calendar,
  Package
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { OrgLogo } from "@/components/ui/org-logo";
import {
  MANUFACTURING_STATUS_CONFIG,
  type ManufacturingStatus,
} from "@/lib/status-system";
import type { Order, Manufacturing } from "@shared/schema";

interface Organization {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
}

interface EnrichedManufacturing extends Manufacturing {
  order?: Order;
  organization?: Organization;
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

function getStageDescription(stageId: string): string {
  const descriptions: Record<string, string> = {
    awaiting_admin_confirmation: "Orders awaiting admin confirmation",
    confirmed_awaiting_manufacturing: "Confirmed and ready for production",
    cutting_sewing: "In cutting and sewing phase",
    printing: "In printing phase",
    final_packing_press: "Final packing and pressing",
    shipped: "Shipped to customer",
    complete: "Manufacturing complete",
  };
  return descriptions[stageId] || "Manufacturing records";
}

const STAGE_CONFIGS = Object.entries(MANUFACTURING_STATUS_CONFIG).map(([id, config]) => ({
  id,
  label: config.label,
  description: getStageDescription(id),
}));

export default function ManufacturingList() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const isMobile = useIsMobile();
  const [isPulling, setIsPulling] = useState(false);
  
  const params = new URLSearchParams(searchString);
  const statusParam = params.get("status");
  const searchParam = params.get("search") || "";

  const [searchTerm, setSearchTerm] = useState(searchParam);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const stageConfig = statusParam ? STAGE_CONFIGS.find(s => s.id === statusParam) : null;

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

  const { data: manufacturingRecords = [], isLoading: recordsLoading, refetch } = useQuery<Manufacturing[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
    enabled: isAuthenticated,
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

  const orderMap = useMemo(() => {
    const map = new Map<number, Order>();
    for (const order of orders) {
      map.set(order.id, order);
    }
    return map;
  }, [orders]);

  const enrichedRecords: EnrichedManufacturing[] = useMemo(() => {
    return manufacturingRecords.map(record => {
      const order = orderMap.get(record.orderId);
      const organization = order?.orgId ? orgMap.get(order.orgId) : undefined;
      return {
        ...record,
        order,
        organization,
      };
    });
  }, [manufacturingRecords, orderMap, orgMap]);

  const userRole = user?.role;

  const filteredRecords = useMemo(() => {
    let result = enrichedRecords;

    if (userRole === "sales") {
      result = result.filter((record) => record.order?.salespersonId === user?.id);
    }

    if (statusParam) {
      result = result.filter((record) => record.status === statusParam);
    }

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((record) => {
        return (
          record.order?.orderCode?.toLowerCase().includes(searchLower) ||
          record.order?.orderName?.toLowerCase().includes(searchLower) ||
          record.organization?.name?.toLowerCase().includes(searchLower) ||
          record.batchNumber?.toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [enrichedRecords, statusParam, debouncedSearch, userRole, user?.id]);

  const updateUrlParams = useCallback((key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchString);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setLocation(`/manufacturing/list?${newParams.toString()}`);
  }, [searchString, setLocation]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setLocation("/manufacturing/list");
  }, [setLocation]);

  const hasActiveFilters = statusParam || debouncedSearch;

  const handlePullToRefresh = useCallback(async () => {
    setIsPulling(true);
    await refetch();
    setTimeout(() => setIsPulling(false), 500);
  }, [refetch]);

  const navigateToOrderDetail = useCallback((record: EnrichedManufacturing) => {
    if (record.orderId) {
      const returnUrl = `/manufacturing/list${searchString ? `?${searchString}` : ""}`;
      setLocation(`/orders/${record.orderId}?from=${encodeURIComponent(returnUrl)}`);
    }
  }, [searchString, setLocation]);

  const getStatusConfig = (status: string) => {
    return MANUFACTURING_STATUS_CONFIG[status as ManufacturingStatus] || {
      label: status,
      bgClass: 'bg-gray-500/10',
      textClass: 'text-gray-500',
      borderClass: 'border-gray-500/30',
    };
  };

  if (recordsLoading) {
    return (
      <div className={cn("p-4 sm:p-6", isMobile && "pb-24")}>
        <div className="mb-4 sm:mb-6">
          <Link href="/manufacturing">
            <Button variant="ghost" size="sm" data-testid="link-back-to-hub" className="min-h-[44px]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manufacturing
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-20 sm:h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeFilters = [
    stageConfig && { key: "status", label: stageConfig.label },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <div className={cn("p-4 sm:p-6", isMobile && "pb-24")}>
      <div className="mb-4 sm:mb-6">
        <Link href="/manufacturing">
          <Button variant="ghost" size="sm" data-testid="link-back-to-hub" className="min-h-[44px]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manufacturing
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-page-title">
            {stageConfig ? stageConfig.label : "All Manufacturing"}
          </h1>
          {stageConfig && (
            <p className="text-sm text-muted-foreground">{stageConfig.description}</p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {isMobile && (
        <motion.div
          initial={false}
          animate={{ 
            height: isPulling ? 48 : 0,
            opacity: isPulling ? 1 : 0
          }}
          className="flex items-center justify-center overflow-hidden"
        >
          <RefreshCw className={cn("h-5 w-5 text-primary", isPulling && "animate-spin")} />
          <span className="ml-2 text-sm text-muted-foreground">Refreshing...</span>
        </motion.div>
      )}

      <div className="space-y-3 mb-4 sm:mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search manufacturing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("pl-10 min-h-[44px]", isMobile && "text-base")}
            data-testid="input-search"
          />
        </div>

        {isMobile ? (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {!statusParam && (
                <Select
                  value={statusParam || "all"}
                  onValueChange={(value) => updateUrlParams("status", value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-auto min-w-[120px] min-h-[44px]" data-testid="select-status">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STAGE_CONFIGS.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  data-testid="button-clear-filters"
                  className="min-h-[44px] shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        ) : (
          <div className="flex flex-wrap gap-3">
            {!statusParam && (
              <Select
                value={statusParam || "all"}
                onValueChange={(value) => updateUrlParams("status", value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]" data-testid="select-status">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STAGE_CONFIGS.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}

        {activeFilters.length > 0 && (
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {activeFilters.map((filter) => (
                <Badge
                  key={filter.key}
                  variant="secondary"
                  className="shrink-0 cursor-pointer hover:bg-secondary/80 min-h-[32px] px-3"
                  onClick={() => updateUrlParams(filter.key, null)}
                >
                  {filter.label}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <p className="text-muted-foreground">No manufacturing records found matching your filters.</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2 min-h-[44px]">
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-3 data-card-stack">
          <AnimatePresence>
            {filteredRecords.map((record, index) => {
              const statusConfig = getStatusConfig(record.status);

              return (
                <MobileDataCard
                  key={record.id}
                  index={index}
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {record.order?.orderCode || `#${record.orderId}`}
                      </span>
                    </div>
                  }
                  subtitle={record.order?.orderName || "Unknown Order"}
                  status={{
                    value: record.status,
                    label: statusConfig.label,
                  }}
                  metadata={[
                    {
                      label: "Org",
                      value: record.organization?.name || "Unknown",
                      icon: <Factory className="h-3 w-3" />,
                    },
                    {
                      label: "Batch",
                      value: record.batchNumber || "N/A",
                      icon: <Package className="h-3 w-3" />,
                    },
                  ]}
                  onClick={() => navigateToOrderDetail(record)}
                  data-testid={`card-manufacturing-${record.id}`}
                />
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const statusConfig = getStatusConfig(record.status);

            return (
              <Card
                key={record.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                  "focus-visible:ring-2 focus-visible:ring-ring"
                )}
                tabIndex={0}
                role="button"
                onClick={() => navigateToOrderDetail(record)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateToOrderDetail(record);
                  }
                }}
                data-testid={`card-manufacturing-${record.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <OrgLogo
                        orgId={record.organization?.id || 0}
                        orgName={record.organization?.name || "Organization"}
                        src={record.organization?.logoUrl}
                        size="md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground" data-testid={`text-order-code-${record.id}`}>
                          {record.order?.orderCode || `#${record.orderId}`}
                        </span>
                        {record.batchNumber && (
                          <Badge variant="outline" className="text-xs">
                            Batch: {record.batchNumber}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold truncate" data-testid={`text-order-name-${record.id}`}>
                        {record.order?.orderName || "Unknown Order"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {record.organization?.name || "Unknown Organization"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(statusConfig.textClass, statusConfig.borderClass)}
                      >
                        {statusConfig.label}
                      </Badge>
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
