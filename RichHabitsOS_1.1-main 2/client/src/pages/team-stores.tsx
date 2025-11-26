import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { TeamStore, Order, User, Organization } from "@shared/schema";
import { 
  Package, Plus, Search, Clock, CheckCircle2, Store, Calendar,
  Building2, User as UserIcon, TrendingUp, BarChart3, ShoppingBag
} from "lucide-react";
import { TeamStoreDetailModal } from "@/components/modals/team-store-detail-modal";
import { CreateTeamStoreModal } from "@/components/modals/create-team-store-modal";

// Icon mapping for dynamic stage loading
const iconMap: Record<string, any> = {
  Clock,
  Package,
  CheckCircle2,
  Store,
  ShoppingBag
};

interface TeamStoreStageConfig {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  allowedRoles: string[];
}

export default function TeamStores() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [archiveTab, setArchiveTab] = useState<"active" | "archived">("active");

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

  // Fetch active team stores
  const { data: activeTeamStores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/team-stores"],
    retry: false,
    enabled: isAuthenticated && archiveTab === "active",
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Fetch archived team stores
  const { data: archivedTeamStores = [], isLoading: archivedLoading } = useQuery<any[]>({
    queryKey: ["/api/team-stores/archived/list"],
    retry: false,
    enabled: isAuthenticated && archiveTab === "archived",
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Determine which records to use based on active tab
  const teamStores = archiveTab === "active" ? activeTeamStores : archivedTeamStores;

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: salespeople = [] } = useQuery<User[]>({
    queryKey: ["/api/users/for-assignment"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch team store stages dynamically
  const { data: teamStoreStages = [] } = useQuery<TeamStoreStageConfig[]>({
    queryKey: ["/api/config/team-store-stages"],
    retry: false,
    staleTime: 1000 * 60 * 60,
  });

  // Build statusConfig from dynamic data
  const statusConfig = useMemo(() => {
    const config: Record<string, { label: string; icon: any; color: string; textColor: string; hexColor: string; }> = {};
    teamStoreStages.forEach(stage => {
      const Icon = iconMap[stage.icon] || Package;
      const colorMap: Record<string, { bg: string; text: string }> = {
        '#f59e0b': { bg: 'bg-amber-500', text: 'text-amber-700' },
        '#3b82f6': { bg: 'bg-blue-500', text: 'text-blue-700' },
        '#22c55e': { bg: 'bg-green-500', text: 'text-green-700' },
      };
      const colors = colorMap[stage.color] || { bg: 'bg-gray-500', text: 'text-gray-700' };
      config[stage.value] = {
        label: stage.label,
        icon: Icon,
        color: colors.bg,
        textColor: colors.text,
        hexColor: stage.color
      };
    });
    return config;
  }, [teamStoreStages]);

  const statusOrder = useMemo(() => {
    return teamStoreStages
      .sort((a, b) => a.order - b.order)
      .map(stage => stage.value);
  }, [teamStoreStages]);

  // Filter and sort data
  const filteredStores = useMemo(() => {
    let filtered = teamStores;

    // Archive filter
    if (archiveTab === "active") {
      filtered = filtered.filter(store => !store.archived);
    } else {
      filtered = filtered.filter(store => store.archived === true);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(store => {
        const order = orders.find((o: any) => o.id === store.orderId);
        const org = organizations.find((org: any) => org.id === store.orgId);
        return (
          store.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          store.storeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order?.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(store => store.status === statusFilter);
    }

    // Salesperson filter
    if (salespersonFilter !== "all") {
      filtered = filtered.filter(store => store.salespersonId === salespersonFilter);
    }

    // Date range filter
    if (dateRangeFilter.start && dateRangeFilter.end) {
      const startDate = startOfDay(new Date(dateRangeFilter.start));
      const endDate = endOfDay(new Date(dateRangeFilter.end));
      filtered = filtered.filter(store => {
        if (!store.storeOpenDate) return false;
        const storeDate = new Date(store.storeOpenDate);
        return isAfter(storeDate, startDate) && isBefore(storeDate, endDate);
      });
    }

    return filtered;
  }, [teamStores, orders, organizations, searchTerm, statusFilter, salespersonFilter, dateRangeFilter, archiveTab]);

  // Group stores by status for board view
  const storesByStatus = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    statusOrder.forEach(status => {
      grouped[status] = filteredStores.filter(store => store.status === status);
    });
    return grouped;
  }, [filteredStores, statusOrder]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredStores.length;
    const active = filteredStores.filter(s => s.status !== 'completed').length;
    const completed = filteredStores.filter(s => s.status === 'completed').length;
    const pending = filteredStores.filter(s => s.status === 'pending').length;

    return { total, active, completed, pending };
  }, [filteredStores]);

  const handleCardClick = (store: any) => {
    setSelectedStore(store);
    setIsDetailModalOpen(true);
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  if (isLoading || storesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="team-stores-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Team Stores</h1>
          <p className="text-muted-foreground">Manage team gear stores and orders</p>
        </div>
        <Button onClick={handleCreateClick} data-testid="button-create-team-store">
          <Plus className="mr-2 h-4 w-4" />
          Create Team Store
        </Button>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="metric-total-stores">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-stores">{metrics.total}</div>
          </CardContent>
        </Card>
        <Card data-testid="metric-active-stores">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-stores">{metrics.active}</div>
          </CardContent>
        </Card>
        <Card data-testid="metric-completed-stores">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-stores">{metrics.completed}</div>
          </CardContent>
        </Card>
        <Card data-testid="metric-pending-stores">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-stores">{metrics.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
              <SelectTrigger data-testid="select-trigger-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {teamStoreStages.map(stage => (
                  <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={salespersonFilter} onValueChange={setSalespersonFilter} data-testid="select-salesperson-filter">
              <SelectTrigger data-testid="select-trigger-salesperson">
                <SelectValue placeholder="All Salespeople" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespeople</SelectItem>
                {salespeople.filter(sp => sp.role === 'sales').map(sp => (
                  <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRangeFilter.start}
              onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
              placeholder="Start Date"
              data-testid="input-date-start"
            />
            <Input
              type="date"
              value={dateRangeFilter.end}
              onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
              placeholder="End Date"
              data-testid="input-date-end"
            />
          </div>
        </CardContent>
      </Card>

      {/* Archive Tabs */}
      <Tabs value={archiveTab} onValueChange={(v) => setArchiveTab(v as "active" | "archived")} data-testid="tabs-archive">
        <TabsList data-testid="tabs-list-archive">
          <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
          <TabsTrigger value="archived" data-testid="tab-archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {/* Kanban Board */}
          <div className="grid gap-6 md:grid-cols-3" data-testid="kanban-board">
            {statusOrder.map(status => {
              const statusInfo = statusConfig[status];
              const stores = storesByStatus[status] || [];
              const Icon = statusInfo?.icon || Package;

              return (
                <Card key={status} className="flex flex-col" data-testid={`column-${status}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${statusInfo?.textColor || 'text-gray-700'}`} />
                        <CardTitle className="text-base">{statusInfo?.label || status}</CardTitle>
                      </div>
                      <Badge variant="secondary" data-testid={`badge-count-${status}`}>{stores.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <ScrollArea className="h-[600px] pr-4">
                      {stores.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground" data-testid={`empty-state-${status}`}>
                          No stores in this stage
                        </div>
                      ) : (
                        stores.map((store) => {
                          const order = orders.find((o: any) => o.id === store.orderId);
                          const salesperson = salespeople.find((sp: any) => sp.id === store.salespersonId);
                          const org = organizations.find((org: any) => org.id === store.orgId);

                          return (
                            <Card 
                              key={store.id} 
                              className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleCardClick(store)}
                              data-testid={`card-team-store-${store.id}`}
                            >
                              <CardContent className="p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1 flex-1">
                                    <h4 className="font-semibold text-sm" data-testid={`text-store-name-${store.id}`}>
                                      {store.storeName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground" data-testid={`text-store-code-${store.id}`}>
                                      {store.storeCode}
                                    </p>
                                  </div>
                                  <StatusBadge 
                                    status={store.status}
                                    data-testid={`badge-status-${store.id}`}
                                  >
                                    {statusConfig[store.status]?.label || store.status}
                                  </StatusBadge>
                                </div>
                                
                                <div className="space-y-1.5 text-xs">
                                  {order && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Package className="h-3 w-3" />
                                      <span data-testid={`text-order-code-${store.id}`}>{order.orderCode}</span>
                                    </div>
                                  )}
                                  {org && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Building2 className="h-3 w-3" />
                                      <span data-testid={`text-org-name-${store.id}`}>{org.name}</span>
                                    </div>
                                  )}
                                  {salesperson && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <UserIcon className="h-3 w-3" />
                                      <span data-testid={`text-salesperson-${store.id}`}>{salesperson.name}</span>
                                    </div>
                                  )}
                                  {store.storeOpenDate && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span data-testid={`text-dates-${store.id}`}>
                                        {format(new Date(store.storeOpenDate), 'MMM dd')}
                                        {store.storeCloseDate && ` - ${format(new Date(store.storeCloseDate), 'MMM dd')}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {archivedLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading archived stores...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No archived team stores found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {filteredStores.map((store) => {
                const order = orders.find((o: any) => o.id === store.orderId);
                const salesperson = salespeople.find((sp: any) => sp.id === store.salespersonId);
                const org = organizations.find((org: any) => org.id === store.orgId);

                return (
                  <Card 
                    key={store.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(store)}
                    data-testid={`card-archived-store-${store.id}`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold text-sm">{store.storeName}</h4>
                          <p className="text-xs text-muted-foreground">{store.storeCode}</p>
                        </div>
                        <StatusBadge status={store.status}>
                          {statusConfig[store.status]?.label || store.status}
                        </StatusBadge>
                      </div>
                      
                      <div className="space-y-1.5 text-xs">
                        {order && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="h-3 w-3" />
                            <span>{order.orderCode}</span>
                          </div>
                        )}
                        {org && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{org.name}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {isDetailModalOpen && selectedStore && (
        <TeamStoreDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedStore(null);
          }}
          teamStore={selectedStore}
        />
      )}
      
      {isCreateModalOpen && (
        <CreateTeamStoreModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
