/**
 * Manufacturing Page
 * 
 * Displays manufacturing records with board/list views,
 * status workflow, and Pantone color picker integration.
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Factory, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Calendar,
  Palette,
  LayoutGrid,
  List,
  Scissors,
  Printer,
  Truck,
  PackageCheck,
  RefreshCcw,
  Eye,
  Archive,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import { format } from "date-fns";
import type { Manufacturing, Order } from "@shared/schema";
import { cn } from "@/lib/utils";
import { PantonePicker } from "@/components/manufacturing/pantone-picker";
import { ManufacturingCapsule } from "@/components/ManufacturingCapsule";
import { CreateManufacturingModal } from "@/components/modals/create-manufacturing-modal";
import { DataCapsule } from "@/components/DataCapsule";
import { OrgLogo } from "@/components/ui/org-logo";
import { SplitView } from "@/components/layout/split-view";
import { Users, Download } from "lucide-react";
import {
  MANUFACTURING_STATUS_CONFIG,
  ManufacturingStatus,
  calculateVelocity,
  VELOCITY_CONFIG,
} from "@/lib/status-system";

// Icon mapping for dynamic stage loading
const iconMap: Record<string, any> = {
  Clock,
  PackageCheck,
  Scissors,
  Printer,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
};

interface ManufacturingStageConfig {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  allowedRoles: string[];
}

export default function Manufacturing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { canAccess } = usePermissions();
  const isMobile = useIsMobile();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPantoneModalOpen, setIsPantoneModalOpen] = useState(false);
  const [selectedManufacturing, setSelectedManufacturing] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [quickViewRecord, setQuickViewRecord] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // View and filter states
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(!isMobile);

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

  // Fetch manufacturing stages dynamically
  const { data: manufacturingStages = [] } = useQuery<ManufacturingStageConfig[]>({
    queryKey: ["/api/config/manufacturing-stages"],
    retry: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Fetch manufacturing records - use the correct endpoint
  const { data: manufacturingRecords = [], isLoading: recordsLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  // Fetch orders for enrichment
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  // Fetch organizations for display - only if user has permission
  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    retry: false,
    enabled: canAccess("organizations"),
  });

  // Build statusConfig from dynamic data
  const statusConfig = useMemo(() => {
    const config: Record<string, { label: string; icon: any; color: string; textColor: string; hexColor: string; }> = {};
    manufacturingStages.forEach(stage => {
      const Icon = iconMap[stage.icon] || Package;
      config[stage.value] = {
        label: stage.label,
        icon: Icon,
        color: `bg-[${stage.color}]/20`,
        textColor: `text-[${stage.color}]`,
        hexColor: stage.color,
      };
    });
    return config;
  }, [manufacturingStages]);

  // Enrich manufacturing records with order data
  const enrichedRecords = useMemo(() => {
    return manufacturingRecords.map(record => {
      const order = orders.find(o => o.id === record.orderId);
      const organization = order?.orgId ? organizations.find(org => org.id === order.orgId) : null;
      return {
        ...record,
        order,
        organization,
      };
    });
  }, [manufacturingRecords, orders, organizations]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter(record => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          record.order?.orderCode?.toLowerCase().includes(query) ||
          record.order?.orderName?.toLowerCase().includes(query) ||
          record.organization?.name?.toLowerCase().includes(query) ||
          record.batchNumber?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== "all" && record.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [enrichedRecords, searchQuery, statusFilter]);

  // Group records by status for board view
  const recordsByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    manufacturingStages.forEach(stage => {
      grouped[stage.value] = [];
    });
    
    filteredRecords.forEach(record => {
      if (grouped[record.status]) {
        grouped[record.status].push(record);
      } else {
        // Fallback for unknown status
        if (!grouped['other']) grouped['other'] = [];
        grouped['other'].push(record);
      }
    });
    
    return grouped;
  }, [filteredRecords, manufacturingStages]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = enrichedRecords.length;
    const inProgress = enrichedRecords.filter(r => 
      r.status === 'cutting_sewing' || r.status === 'printing'
    ).length;
    const completed = enrichedRecords.filter(r => r.status === 'complete').length;
    const awaitingConfirmation = enrichedRecords.filter(r => 
      r.status === 'awaiting_admin_confirmation'
    ).length;
    
    return { total, inProgress, completed, awaitingConfirmation };
  }, [enrichedRecords]);

  const handleOpenDetail = (record: any) => {
    setSelectedManufacturing(record);
    setIsDetailModalOpen(true);
  };

  const handleQuickView = (record: any) => {
    setQuickViewRecord(record);
    setIsQuickViewOpen(true);
  };

  if (isLoading || recordsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-[500px] bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-[calc(100vh-64px)] space-y-4", isMobile ? "p-3" : "p-6")}>
      {/* Header - Matching Orders Page */}
      <div className="space-y-4 flex-shrink-0">
        <div className={cn("flex items-start justify-between gap-4", isMobile && "flex-col")}>
          <div>
            <h1 className={cn("font-bold tracking-tight gradient-text", isMobile ? "text-2xl" : "text-3xl")} data-testid="text-page-title">
              Manufacturing
            </h1>
            <p className={cn("text-muted-foreground mt-1", isMobile && "text-sm")}>
              Track production and manufacturing orders efficiently.
            </p>
          </div>
          {isMobile ? (
            <ScrollArea className="w-full">
              <div className="flex items-center gap-2 pb-2">
                <Button 
                  variant="outline"
                  onClick={() => refetch()}
                  className="border-white/10 hover:bg-white/5 h-11 min-h-[44px] shrink-0"
                  size="sm"
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => setIsPantoneModalOpen(true)} 
                  variant="outline"
                  className="border-white/10 hover:bg-white/5 h-11 min-h-[44px] shrink-0"
                  size="sm"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Pantone
                </Button>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)} 
                  data-testid="button-create-order"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.3)] h-11 min-h-[44px] shrink-0"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => refetch()}
                className="border-white/10 hover:bg-white/5"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => setIsPantoneModalOpen(true)} 
                variant="outline"
                className="border-white/10 hover:bg-white/5"
              >
                <Palette className="w-4 h-4 mr-2" />
                Pantone
              </Button>
              <Button 
                onClick={() => setIsCreateModalOpen(true)} 
                data-testid="button-create-order"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.3)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Record
              </Button>
            </div>
          )}
        </div>

        {/* Filters - Collapsible on Mobile */}
        {isMobile ? (
          <Collapsible open={isFiltersExpanded} onOpenChange={setIsFiltersExpanded}>
            <Card className="glass-card border-white/10">
              <CollapsibleTrigger asChild>
                <CardContent className="p-3 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters</span>
                    {statusFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs">{statusFilter}</Badge>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isFiltersExpanded && "rotate-180")} />
                </CardContent>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-3 pt-0 space-y-3">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-black/20 border-white/10 focus:border-primary/50 h-11 min-h-[44px]"
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="flex-1 bg-black/20 border-white/10 text-white h-11 min-h-[44px]" data-testid="select-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {manufacturingStages.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                      <button
                        onClick={() => setViewMode("board")}
                        className={cn(
                          "p-2.5 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
                          viewMode === "board"
                            ? "bg-primary/20 text-primary"
                            : "text-white/40 hover:text-white"
                        )}
                        data-testid="button-view-board"
                      >
                        <LayoutGrid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "p-2.5 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center",
                          viewMode === "list"
                            ? "bg-primary/20 text-primary"
                            : "text-white/40 hover:text-white"
                        )}
                        data-testid="button-view-list"
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ) : (
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by order, organization, batch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-black/20 border-white/10 focus:border-primary/50"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-black/20 border-white/10 text-white" data-testid="select-status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {manufacturingStages.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                    <button
                      onClick={() => setViewMode("board")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "board"
                          ? "bg-primary/20 text-primary"
                          : "text-white/40 hover:text-white"
                      )}
                      data-testid="button-view-board"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-2 rounded-md transition-colors",
                        viewMode === "list"
                          ? "bg-primary/20 text-primary"
                          : "text-white/40 hover:text-white"
                      )}
                      data-testid="button-view-list"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {viewMode === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 h-full">
            {manufacturingStages.map((stage) => {
              const records = recordsByStatus[stage.value] || [];
              const Icon = iconMap[stage.icon] || Package;
              
              return (
                <div key={stage.value} className="flex-shrink-0 w-72">
                  {/* Column Header */}
                  <div 
                    className="p-3 rounded-t-xl border border-b-0"
                    style={{ 
                      backgroundColor: `${stage.color}15`,
                      borderColor: `${stage.color}30`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: stage.color }} />
                        <span className="font-medium text-sm" style={{ color: stage.color }}>
                          {stage.label}
                        </span>
                      </div>
                      <Badge variant="outline" style={{ borderColor: `${stage.color}50`, color: stage.color }}>
                        {records.length}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Cards */}
                  <div 
                    className="p-2 rounded-b-xl border border-t-0 min-h-[400px] max-h-[calc(100vh-320px)] overflow-y-auto bg-slate-900/50"
                    style={{ borderColor: `${stage.color}30` }}
                  >
                    <AnimatePresence>
                      {records.map((record, index) => (
                        <ManufacturingCard
                          key={record.id}
                          record={record}
                          stageConfig={stage}
                          onClick={() => handleOpenDetail(record)}
                          index={index}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {records.length === 0 && (
                      <div className="flex items-center justify-center h-24 text-white/30 text-sm">
                        No records
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <SplitView
            sidebar={
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="font-semibold text-foreground">Manufacturing List</h3>
                  <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
                    {filteredRecords.length}
                  </Badge>
                </div>
                
                {filteredRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No manufacturing records found
                  </div>
                ) : (
                  filteredRecords.map((record) => {
                    const stageConfig = manufacturingStages.find(s => s.value === record.status);
                    const Icon = stageConfig ? iconMap[stageConfig.icon] || Package : Package;

                    return (
                      <div
                        key={record.id}
                        onClick={() => setSelectedManufacturing(record)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-white/5 group relative overflow-hidden",
                          selectedManufacturing?.id === record.id 
                            ? "bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(0,243,255,0.1)]" 
                            : "bg-black/20 border-white/5 hover:border-white/10"
                        )}
                        data-testid={`manufacturing-item-${record.id}`}
                      >
                        {/* Status Indicator Line */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={{ backgroundColor: stageConfig?.color || '#666' }}
                        />

                        <div className="flex justify-between items-start mb-1 pl-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {record.order?.orderCode || `#${record.orderId}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {record.createdAt ? format(new Date(record.createdAt), 'MMM dd') : ''}
                          </span>
                        </div>
                        
                        <div className="pl-2 mb-2">
                          <p className="text-xs font-medium text-foreground/90 truncate">{record.order?.orderName}</p>
                          {record.organization && (
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              {record.organization.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pl-2 mt-2">
                          <Badge 
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-1"
                            style={{ 
                              borderColor: `${stageConfig?.color}50`, 
                              color: stageConfig?.color,
                              backgroundColor: `${stageConfig?.color}15`
                            }}
                          >
                            <Icon className="w-3 h-3" />
                            {stageConfig?.label || record.status}
                          </Badge>
                          {record.priority === 'high' || record.priority === 'urgent' ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-400 border-red-500/30">
                              {record.priority === 'urgent' ? 'Urgent' : 'High Priority'}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            }
            content={
              selectedManufacturing ? (
                <div className="space-y-6">
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold gradient-text">
                        {selectedManufacturing.order?.orderCode || `Manufacturing #${selectedManufacturing.id}`}
                      </h2>
                      <p className="text-lg text-foreground/80 mt-1">{selectedManufacturing.order?.orderName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickView(selectedManufacturing)}
                        className="border-primary/50 bg-primary/10 hover:bg-primary/20"
                        data-testid="button-quick-view"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Quick View
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(() => {
                      const stageConfig = manufacturingStages.find(s => s.value === selectedManufacturing.status);
                      const Icon = stageConfig ? iconMap[stageConfig.icon] || Package : Package;
                      return (
                        <Card className="glass-card border-white/10">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div 
                              className="p-3 rounded-full"
                              style={{ backgroundColor: `${stageConfig?.color}20` }}
                            >
                              <Icon className="w-6 h-6" style={{ color: stageConfig?.color }} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                              <p className="text-lg font-semibold text-foreground">{stageConfig?.label || selectedManufacturing.status}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}

                    <Card className="glass-card border-white/10">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Completion</p>
                          <p className="text-lg font-semibold text-foreground">
                            {selectedManufacturing.estCompletion ? format(new Date(selectedManufacturing.estCompletion), 'MMM dd, yyyy') : 'TBD'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card border-white/10">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className={cn("p-3 rounded-full", 
                          selectedManufacturing.priority === 'urgent' ? "bg-red-500/10 text-red-500" :
                          selectedManufacturing.priority === 'high' ? "bg-orange-500/10 text-orange-500" : 
                          selectedManufacturing.priority === 'low' ? "bg-green-500/10 text-green-500" : 
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Priority</p>
                          <p className="text-lg font-semibold capitalize text-foreground">{selectedManufacturing.priority || 'Normal'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Organization Details */}
                  {selectedManufacturing.organization && (
                    <Card className="glass-card border-white/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Organization Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <OrgLogo
                            src={selectedManufacturing.organization.logoUrl}
                            orgName={selectedManufacturing.organization.name}
                            orgId={selectedManufacturing.organization.id}
                            size="lg"
                          />
                          <div>
                            <p className="font-semibold text-foreground">{selectedManufacturing.organization.name}</p>
                            {selectedManufacturing.organization.city && selectedManufacturing.organization.state && (
                              <p className="text-sm text-muted-foreground">
                                {selectedManufacturing.organization.city}, {selectedManufacturing.organization.state}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a manufacturing record</p>
                    <p className="text-sm">Choose a record from the list to view details</p>
                  </div>
                </div>
              )
            }
          />
        )}
      </div>

      {/* Modals */}
      <CreateManufacturingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ManufacturingCapsule
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedManufacturing(null);
        }}
        manufacturingId={selectedManufacturing?.id || null}
      />

      <DataCapsule
        isOpen={isQuickViewOpen && quickViewRecord !== null}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewRecord(null);
        }}
        orderId={quickViewRecord?.orderId || 0}
        onOpenFullView={() => {
          if (quickViewRecord) {
            setSelectedManufacturing(quickViewRecord);
            setIsDetailModalOpen(true);
          }
          setIsQuickViewOpen(false);
          setQuickViewRecord(null);
        }}
      />

      {/* Pantone Picker Modal */}
      <Dialog open={isPantoneModalOpen} onOpenChange={setIsPantoneModalOpen}>
        <DialogContent className="glass-panel border-white/10 max-w-4xl w-full h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Pantone Color Picker</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload an image and pick a color to find the closest Pantone match.
            </DialogDescription>
          </DialogHeader>
          <PantonePicker onSelect={(pantone) => {
            toast({
              title: "Pantone Selected",
              description: `Selected ${pantone.name} (${pantone.code})`,
            });
            setIsPantoneModalOpen(false);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Manufacturing Card Component for Board View
function ManufacturingCard({ 
  record, 
  stageConfig,
  onClick,
  index 
}: { 
  record: any;
  stageConfig: ManufacturingStageConfig;
  onClick: () => void;
  index: number;
}) {
  const velocity = calculateVelocity(record.updatedAt, record.estCompletion, record.status);
  const velocityConfig = VELOCITY_CONFIG[velocity];
  
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200",
        "bg-white/5 border hover:bg-white/10",
        velocityConfig.borderClass,
        velocity !== 'grey' && velocityConfig.glowClass
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {record.order?.orderCode || `Order #${record.orderId}`}
          </div>
          <div className="text-xs text-white/50 truncate">
            {record.order?.orderName}
          </div>
        </div>
        
        {/* Velocity dot */}
        <div 
          className={cn(
            "w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1",
            velocity === 'green' && "bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
            velocity === 'yellow' && "bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]",
            velocity === 'red' && "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse",
            velocity === 'grey' && "bg-gray-400"
          )}
          title={velocityConfig.label}
        />
      </div>
      
      {/* Organization */}
      {record.organization?.name && (
        <div className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
          <OrgLogo
            src={record.organization?.logoUrl}
            orgName={record.organization.name}
            orgId={record.organization?.id}
            size="xs"
          />
          <span className="truncate">{record.organization.name}</span>
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] px-1.5 py-0",
            record.priority === 'urgent' && "border-red-500/50 text-red-400",
            record.priority === 'high' && "border-orange-500/50 text-orange-400",
            record.priority === 'normal' && "border-blue-500/50 text-blue-400",
            record.priority === 'low' && "border-gray-500/50 text-gray-400",
          )}
        >
          {record.priority}
        </Badge>
        
        {record.estCompletion && (
          <span className="text-white/40 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(record.estCompletion), 'MMM d')}
          </span>
        )}
      </div>
    </motion.div>
  );
}
