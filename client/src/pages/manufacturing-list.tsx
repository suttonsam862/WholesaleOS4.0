import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
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
  Filter,
  X,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import {
  MANUFACTURING_STATUS_CONFIG,
  type ManufacturingStatus,
} from "@/lib/status-system";
import { GlassManufacturingSpreadsheet, type EnrichedManufacturing } from "@/components/manufacturing/GlassManufacturingSpreadsheet";
import { ManufacturingCapsule } from "@/components/ManufacturingCapsule";
import { generateManufacturingPdf } from "@/lib/manufacturing-pdf";
import type { Order, Manufacturing } from "@shared/schema";

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
  const [selectedManufacturingId, setSelectedManufacturingId] = useState<number | null>(null);
  const [isCapsuleOpen, setIsCapsuleOpen] = useState(false);
  
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

  const handleRecordClick = useCallback((record: EnrichedManufacturing) => {
    setSelectedManufacturingId(record.id);
    setIsCapsuleOpen(true);
  }, []);

  const handleDownloadPdf = useCallback(async (record: EnrichedManufacturing) => {
    toast({
      title: "Generating PDF",
      description: `Preparing manufacturing guide for ${record.order?.orderCode || `MFG-${record.id}`}...`,
    });
    
    try {
      await generateManufacturingPdf({
        manufacturing: {
          id: record.id,
          status: record.status,
          estCompletion: record.estCompletion,
          actualCompletion: record.actualCompletion,
          trackingNumber: record.trackingNumber,
          productionNotes: record.productionNotes,
          qualityNotes: record.qualityNotes,
          specialInstructions: record.specialInstructions,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          priority: record.priority,
        },
        order: record.order ? {
          orderCode: record.order.orderCode,
          orderName: record.order.orderName,
          estDelivery: record.order.estDelivery,
          priority: record.order.priority,
        } : null,
        organization: record.organization ? {
          name: record.organization.name,
          city: record.organization.city,
          state: record.organization.state,
          shippingAddress: null,
          logoUrl: record.organization.logoUrl,
        } : null,
        manufacturer: null,
        lineItems: [],
        pantoneColors: [],
      });
      toast({
        title: "Success",
        description: "Manufacturing guide PDF downloaded",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleCloseCapsule = useCallback(() => {
    setIsCapsuleOpen(false);
    setSelectedManufacturingId(null);
  }, []);

  const activeFilters = [
    stageConfig && { key: "status", label: stageConfig.label },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <>
      <div className={cn("min-h-screen", isMobile && "pb-24")}>
        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <Link href="/manufacturing">
              <Button variant="ghost" size="sm" data-testid="link-back-to-hub" className="min-h-[44px] text-white/60 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Manufacturing
              </Button>
            </Link>
          </div>

          <div className="flex flex-col gap-3 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent" data-testid="text-page-title">
                {stageConfig ? stageConfig.label : "All Manufacturing"}
              </h1>
              {stageConfig && (
                <p className="text-sm text-white/60">{stageConfig.description}</p>
              )}
              <p className="text-xs sm:text-sm text-white/40 mt-1">
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
              <RefreshCw className={cn("h-5 w-5 text-neon-blue", isPulling && "animate-spin")} />
              <span className="ml-2 text-sm text-white/60">Refreshing...</span>
            </motion.div>
          )}

          <div className="space-y-3 mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search manufacturing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  "pl-10 min-h-[44px] bg-black/40 border-white/10 text-white placeholder:text-white/40 focus:border-neon-blue/50 focus:ring-neon-blue/20",
                  isMobile && "text-base"
                )}
                data-testid="input-search"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {!statusParam && (
                <Select
                  value={statusParam || "all"}
                  onValueChange={(value) => updateUrlParams("status", value === "all" ? null : value)}
                >
                  <SelectTrigger 
                    className="w-[180px] bg-black/40 border-white/10 text-white" 
                    data-testid="select-status"
                  >
                    <Filter className="h-4 w-4 mr-2 text-white/60" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                    <SelectItem value="all" className="text-white/80 focus:bg-white/10 focus:text-white">All Statuses</SelectItem>
                    {STAGE_CONFIGS.map((stage) => (
                      <SelectItem 
                        key={stage.id} 
                        value={stage.id}
                        className="text-white/80 focus:bg-white/10 focus:text-white"
                      >
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
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {activeFilters.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {activeFilters.map((filter) => (
                    <Badge
                      key={filter.key}
                      variant="secondary"
                      className="shrink-0 cursor-pointer bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 min-h-[32px] px-3"
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

          <GlassManufacturingSpreadsheet
            records={filteredRecords}
            onRecordClick={handleRecordClick}
            onDownloadPdf={handleDownloadPdf}
            isLoading={recordsLoading}
          />
        </div>
      </div>

      <ManufacturingCapsule
        isOpen={isCapsuleOpen}
        onClose={handleCloseCapsule}
        manufacturingId={selectedManufacturingId}
      />
    </>
  );
}
