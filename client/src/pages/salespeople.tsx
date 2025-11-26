import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CreateSalespersonModal } from "@/components/modals/create-salesperson-modal";
import { SalespersonDetailModal } from "@/components/modals/salesperson-detail-modal";
import { SalespersonWorkflowDashboard } from "@/components/salespeople/salesperson-workflow-dashboard";
import { OrderDetailModal } from "@/components/modals/order-detail-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Edit,
  Trash2,
  FileText,
  Mail,
  Phone,
  Package,
  ArrowRightLeft,
  Eye,
  UserCheck,
  RefreshCw
} from "lucide-react";

interface Salesperson {
  id: number;
  userId: string;
  territory: string | null;
  quotaMonthly: string | null;
  commissionRate: string | null;
  active: boolean;
  notes: string | null;
  defaultOrgScope: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  totalLeads: number;
  leadsWon: number;
  ordersCount: number;
  revenue: number;
  quotaAttainment: number;
}

interface Order {
  id: number;
  orderCode: string;
  orgId: number;
  leadId: number | null;
  salespersonId: string | null;
  orderName: string;
  status: "new" | "waiting_sizes" | "invoiced" | "production" | "shipped" | "completed";
  designApproved: boolean;
  sizesValidated: boolean;
  depositReceived: boolean;
  estDelivery: string | null;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
}

export default function Salespeople() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("team");
  const [searchTerm, setSearchTerm] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSalespeople, setSelectedSalespeople] = useState<number[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Order assignment states
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [targetSalespersonId, setTargetSalespersonId] = useState<string | undefined>(undefined);
  const [expandedSalespeople, setExpandedSalespeople] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  // Check permissions
  const canEdit = user?.role === 'admin';
  const canView = user?.role === 'admin' || user?.role === 'sales' || user?.role === 'ops';

  console.log('🔍 [Salespeople] User role:', user?.role);
  console.log('🔍 [Salespeople] Can view:', canView);
  console.log('🔍 [Salespeople] Can edit:', canEdit);
  console.log('🔍 [Salespeople] Is authenticated:', isAuthenticated);

  // Fetch salespeople with metrics
  const { data: salespeople = [], isLoading: salespeopleLoading, error: salespeopleError } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespeople/with-metrics"],
    retry: false,
    enabled: isAuthenticated && canView,
  });

  // Log any errors
  if (salespeopleError) {
    console.error('🔍 [Salespeople] Query error:', salespeopleError);
  }

  // Fetch orders for assignment tab
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
    enabled: isAuthenticated && canView && activeTab === "assignments",
  });

  // Fetch organizations for order display
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
    enabled: isAuthenticated && canView && activeTab === "assignments",
  });

  // Filter salespeople based on search and filters
  const filteredSalespeople = useMemo(() => {
    return salespeople.filter(sp => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          sp.userName?.toLowerCase().includes(searchLower) ||
          sp.userEmail?.toLowerCase().includes(searchLower) ||
          sp.territory?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }

      // Territory filter
      if (territoryFilter !== "all" && sp.territory !== territoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !sp.active) return false;
        if (statusFilter === "inactive" && sp.active) return false;
      }

      return true;
    });
  }, [salespeople, searchTerm, territoryFilter, statusFilter]);

  // Get unique territories for filter
  const territories = useMemo(() => {
    const uniqueTerritories = new Set(salespeople.map(sp => sp.territory).filter(Boolean));
    return Array.from(uniqueTerritories);
  }, [salespeople]);

  // Calculate team statistics
  const teamStats = useMemo(() => {
    const activeSalespeople = salespeople.filter(sp => sp.active);
    const totalRevenue = salespeople.reduce((sum, sp) => sum + sp.revenue, 0);
    const totalQuota = salespeople.reduce((sum, sp) => sum + parseFloat(sp.quotaMonthly || "0"), 0);
    const avgQuotaAttainment = activeSalespeople.length > 0
      ? activeSalespeople.reduce((sum, sp) => sum + sp.quotaAttainment, 0) / activeSalespeople.length
      : 0;

    return {
      total: salespeople.length,
      active: activeSalespeople.length,
      totalRevenue,
      avgQuotaAttainment,
      totalQuota,
    };
  }, [salespeople]);

  // Delete salesperson mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/salespeople/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople/with-metrics"] });
      toast({
        title: "Success",
        description: "Salesperson deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete salesperson",
        variant: "destructive",
      });
    },
  });

  // Bulk update territory
  const bulkUpdateTerritoryMutation = useMutation({
    mutationFn: async ({ ids, territory }: { ids: number[]; territory: string }) => {
      const promises = ids.map(id =>
        apiRequest(`/api/salespeople/${id}`, { method: "PUT", body: { territory } })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople/with-metrics"] });
      setSelectedSalespeople([]);
      toast({
        title: "Success",
        description: "Territories updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update territories",
        variant: "destructive",
      });
    },
  });

  // Bulk order reassignment mutation
  const bulkReassignOrdersMutation = useMutation({
    mutationFn: async ({ orderIds, salespersonId }: { orderIds: number[]; salespersonId: string }) => {
      return apiRequest("/api/orders/bulk-reassign", { method: "PUT", body: { orderIds, salespersonId } });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/salespeople/with-metrics"] });
      setSelectedOrders([]);
      toast({
        title: "Success",
        description: data.message || "Orders reassigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reassign orders",
        variant: "destructive",
      });
    },
  });

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredSalespeople.map(sp => ({
      "Name": sp.userName || "",
      "Email": sp.userEmail || "",
      "Phone": sp.userPhone || "",
      "Territory": sp.territory || "",
      "Status": sp.active ? "Active" : "Inactive",
      "Monthly Quota": sp.quotaMonthly || "0",
      "Total Leads": sp.totalLeads,
      "Leads Won": sp.leadsWon,
      "Orders": sp.ordersCount,
      "Revenue": sp.revenue.toFixed(2),
      "Quota Attainment %": sp.quotaAttainment.toFixed(1),
      "Created": format(new Date(sp.createdAt), "yyyy-MM-dd"),
    }));

    if (csvData.length === 0) {
      toast({
        title: "No data to export",
        description: "No salespeople to export",
      });
      return;
    }

    const csvContent = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salespeople_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Sales team data exported successfully",
    });
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    setSelectedSalespeople(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSalespeople.length === filteredSalespeople.length) {
      setSelectedSalespeople([]);
    } else {
      setSelectedSalespeople(filteredSalespeople.map(sp => sp.id));
    }
  };

  // Helper functions for order assignments
  const organizeOrdersBySalesperson = () => {
    const organized: { [key: string]: Order[] } = {};
    const unassigned: Order[] = [];

    orders.forEach(order => {
      if (order.salespersonId) {
        if (!organized[order.salespersonId]) {
          organized[order.salespersonId] = [];
        }
        organized[order.salespersonId].push(order);
      } else {
        unassigned.push(order);
      }
    });

    return { organized, unassigned };
  };

  const { organized: ordersBySalesperson, unassigned: unassignedOrders } = organizeOrdersBySalesperson();

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSalespersonExpansion = (userId: string) => {
    setExpandedSalespeople(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getOrderStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "new": return "text-blue-600 bg-blue-50";
      case "waiting_sizes": return "text-yellow-600 bg-yellow-50";
      case "invoiced": return "text-green-600 bg-green-50";
      case "production": return "text-purple-600 bg-purple-50";
      case "shipped": return "text-indigo-600 bg-indigo-50";
      case "completed": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getOrderPriorityColor = (priority: Order["priority"]) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "normal": return "text-blue-600 bg-blue-50";
      case "low": return "text-gray-600 bg-gray-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const calculateSalespersonOrderStats = (orders: Order[]) => {
    const total = orders.length;
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, statusCounts };
  };

  const handleBulkReassign = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No orders selected",
        description: "Please select orders to reassign",
        variant: "destructive",
      });
      return;
    }

    // Require explicit selection - block action if no selection made
    if (targetSalespersonId === undefined || targetSalespersonId === "") {
      toast({
        title: "Selection required",
        description: "Please select either a salesperson to assign orders to, or choose to unassign orders",
        variant: "destructive",
      });
      return;
    }

    const isUnassignAction = targetSalespersonId === "UNASSIGN";
    const targetSalesperson = isUnassignAction ? null : salespeople.find(sp => sp.userId === targetSalespersonId);

    const confirmMessage = isUnassignAction
      ? `Are you sure you want to unassign ${selectedOrders.length} selected orders? They will be moved to the unassigned pool.`
      : `Reassign ${selectedOrders.length} selected orders to ${targetSalesperson?.userName || targetSalesperson?.userEmail}?`;

    if (confirm(confirmMessage)) {
      // Send appropriate value to API: null for unassign, userId for assignment
      const apiSalespersonId = isUnassignAction ? "" : targetSalespersonId;
      bulkReassignOrdersMutation.mutate({
        orderIds: selectedOrders,
        salespersonId: apiSalespersonId
      });
    }
  };

  console.log('🔍 [Salespeople] Auth loading:', authLoading);
  console.log('🔍 [Salespeople] Salespeople loading:', salespeopleLoading);
  console.log('🔍 [Salespeople] Salespeople data length:', salespeople?.length);

  if (authLoading || salespeopleLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Loading salespeople data... (Auth: {authLoading ? 'loading' : 'ready'}, Data: {salespeopleLoading ? 'loading' : 'ready'})
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view the sales team management page.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Current role: {user?.role || 'Unknown'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if there's an API error
  if (salespeopleError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Sales Team</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading the sales team data.
            </p>
            <p className="text-xs text-red-600 mb-4">
              {salespeopleError instanceof Error ? salespeopleError.message : 'Unknown error'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" data-testid="heading-salespeople">Sales Team</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canEdit && (
            <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-salesperson">
              <Plus className="w-4 h-4 mr-2" />
              Add Salesperson
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card data-testid="card-total-salespeople">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-salespeople">
                  {teamStats.total}
                </p>
                <p className="text-sm text-muted-foreground">Total Salespeople</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-salespeople">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-active-salespeople">
                  {teamStats.active}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-revenue">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-revenue">
                  ${teamStats.totalRevenue.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-quota-achieved">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-quota-achieved">
                  {teamStats.avgQuotaAttainment.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">Avg Quota</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-territories">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-territories">
                  {territories.length}
                </p>
                <p className="text-sm text-muted-foreground">Territories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team" data-testid="tab-team-management">
            Team Management
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-order-assignments">
            Order Assignments
          </TabsTrigger>
          <TabsTrigger value="workflow" data-testid="tab-my-workflow">
            My Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          {/* Filters */}
          <Card className="mb-6" data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or territory..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-salespeople"
              />
            </div>
            <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]" data-testid="select-territory-filter">
                <SelectValue placeholder="All Territories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Territories</SelectItem>
                {territories.map(territory => (
                  <SelectItem key={territory} value={territory!}>
                    {territory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {selectedSalespeople.length > 0 && canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" data-testid="button-bulk-actions">
                    Bulk Actions ({selectedSalespeople.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    const newTerritory = prompt("Enter new territory:");
                    if (newTerritory) {
                      bulkUpdateTerritoryMutation.mutate({
                        ids: selectedSalespeople,
                        territory: newTerritory
                      });
                    }
                  }}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Reassign Territory
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setSelectedSalespeople([])}
                  >
                    Clear Selection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salespeople Table */}
      <Card data-testid="card-salespeople-table">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                  {canEdit && (
                    <th className="px-6 py-3">
                      <Checkbox
                        checked={selectedSalespeople.length === filteredSalespeople.length && filteredSalespeople.length > 0}
                        onCheckedChange={toggleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3">Salesperson</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Monthly Quota</th>
                  <th className="px-6 py-3">Commission %</th>
                  <th className="px-6 py-3">Leads</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3">Revenue</th>
                  <th className="px-6 py-3">Performance</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSalespeople.length === 0 ? (
                  <tr>
                    <td className="px-6 py-12 text-center text-muted-foreground" colSpan={canEdit ? 11 : 10}>
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No salespeople found</h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm || territoryFilter !== "all" || statusFilter !== "all"
                            ? "Try adjusting your filters"
                            : "Add your first salesperson to start managing your sales team."}
                        </p>
                        {canEdit && !searchTerm && territoryFilter === "all" && statusFilter === "all" && (
                          <Button onClick={() => setIsCreateModalOpen(true)} data-testid="button-add-first-salesperson">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Salesperson
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSalespeople.map((sp) => (
                    <tr 
                      key={sp.id} 
                      className="hover:bg-muted/10 transition-colors cursor-pointer" 
                      data-testid={`row-salesperson-${sp.id}`}
                      onClick={() => {
                        setSelectedSalespersonId(sp.id);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {canEdit && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedSalespeople.includes(sp.id)}
                            onCheckedChange={() => toggleSelection(sp.id)}
                            data-testid={`checkbox-salesperson-${sp.id}`}
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {(sp.userName || sp.userEmail || 'SP').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold" data-testid={`text-salesperson-name-${sp.id}`}>
                              {sp.userName || sp.userEmail || 'Unknown Salesperson'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {sp.territory || "No territory assigned"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-1">
                          {sp.userEmail && (
                            <div className="flex items-center text-sm text-muted-foreground" data-testid={`text-salesperson-email-${sp.id}`}>
                              <Mail className="w-3 h-3 mr-2" />
                              <a href={`mailto:${sp.userEmail}`} className="hover:text-primary hover:underline">
                                {sp.userEmail}
                              </a>
                            </div>
                          )}
                          {sp.userPhone && (
                            <div className="flex items-center text-sm text-muted-foreground" data-testid={`text-salesperson-phone-${sp.id}`}>
                              <Phone className="w-3 h-3 mr-2" />
                              <a href={`tel:${sp.userPhone}`} className="hover:text-primary hover:underline">
                                {sp.userPhone}
                              </a>
                            </div>
                          )}
                          {!sp.userEmail && !sp.userPhone && (
                            <span className="text-sm text-muted-foreground">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium" data-testid={`text-quota-${sp.id}`}>
                          ${parseFloat(sp.quotaMonthly || "0").toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium" data-testid={`text-commission-rate-${sp.id}`}>
                          {(parseFloat(sp.commissionRate || "0") * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div data-testid={`text-leads-total-${sp.id}`}>
                            <span className="font-medium">{sp.totalLeads}</span> total
                          </div>
                          <div className="text-muted-foreground" data-testid={`text-leads-won-${sp.id}`}>
                            <span className="text-green-600">{sp.leadsWon}</span> won
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium" data-testid={`text-orders-${sp.id}`}>
                          {sp.ordersCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium" data-testid={`text-revenue-${sp.id}`}>
                          ${sp.revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {sp.quotaAttainment >= 100 ? (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : sp.quotaAttainment >= 75 ? (
                              <TrendingUp className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm font-medium" data-testid={`text-quota-attainment-${sp.id}`}>
                              {sp.quotaAttainment.toFixed(0)}%
                            </span>
                          </div>
                          <Progress
                            value={Math.min(sp.quotaAttainment, 100)}
                            className="h-1.5"
                            data-testid={`progress-quota-${sp.id}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={sp.active ? "default" : "secondary"}
                          className={sp.active ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                          data-testid={`badge-status-${sp.id}`}
                        >
                          {sp.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-${sp.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSalespersonId(sp.id);
                                setIsDetailModalOpen(true);
                              }}
                              data-testid={`button-view-${sp.id}`}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {canEdit && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this salesperson?")) {
                                      deleteMutation.mutate(sp.id);
                                    }
                                  }}
                                  data-testid={`button-delete-${sp.id}`}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {/* Order Assignment Controls */}
          <Card data-testid="card-assignment-controls">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Order Assignments</span>
                  <Badge variant="outline">
                    {orders.length} Total Orders
                  </Badge>
                  <Badge variant="outline">
                    {unassignedOrders.length} Unassigned
                  </Badge>
                </div>
                {selectedOrders.length > 0 && canEdit && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedOrders.length} orders selected
                    </span>
                    <Select value={targetSalespersonId} onValueChange={setTargetSalespersonId}>
                      <SelectTrigger className="w-48" data-testid="select-target-salesperson">
                        <SelectValue placeholder="Select action..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGN">
                          🔄 Unassign orders (move to unassigned pool)
                        </SelectItem>
                        <hr className="my-2" />
                        {salespeople.filter(sp => sp.active).map((salesperson) => (
                          <SelectItem key={salesperson.userId} value={salesperson.userId}>
                            👤 {salesperson.userName || salesperson.userEmail}
                            {salesperson.territory && ` (${salesperson.territory})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkReassign}
                      disabled={bulkReassignOrdersMutation.isPending}
                      data-testid="button-bulk-reassign-orders"
                    >
                      {bulkReassignOrdersMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                      )}
                      Reassign
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedOrders([])}
                      data-testid="button-clear-selection"
                    >
                      Clear Selection
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {ordersLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Unassigned Orders Section */}
              {unassignedOrders.length > 0 && (
                <Card data-testid="card-unassigned-orders">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Unassigned Orders</h3>
                          <p className="text-sm text-muted-foreground">
                            {unassignedOrders.length} orders need salesperson assignment
                          </p>
                        </div>
                      </div>
                      {canEdit && unassignedOrders.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const orderIds = unassignedOrders.map(o => o.id);
                            setSelectedOrders(prev =>
                              prev.length === orderIds.length && orderIds.every(id => prev.includes(id))
                                ? prev.filter(id => !orderIds.includes(id))
                                : Array.from(new Set([...prev, ...orderIds]))
                            );
                          }}
                          data-testid="button-select-all-unassigned"
                        >
                          Select All
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unassignedOrders.map((order) => {
                        const org = organizations.find(o => o.id === order.orgId);
                        const isSelected = selectedOrders.includes(order.id);

                        return (
                          <div
                            key={order.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => canEdit && toggleOrderSelection(order.id)}
                            data-testid={`card-unassigned-order-${order.id}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {canEdit && (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleOrderSelection(order.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`checkbox-order-${order.id}`}
                                  />
                                )}
                                <span className="font-medium text-sm">{order.orderCode}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderId(order.id);
                                  setIsOrderDetailModalOpen(true);
                                }}
                                data-testid={`button-view-order-${order.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                            <h4 className="font-medium text-sm mb-1 truncate">{order.orderName}</h4>
                            <p className="text-xs text-muted-foreground mb-2 truncate">{org?.name}</p>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getOrderStatusColor(order.status)}`}
                                data-testid={`badge-status-${order.id}`}
                              >
                                {order.status.replace('_', ' ')}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getOrderPriorityColor(order.priority)}`}
                                data-testid={`badge-priority-${order.id}`}
                              >
                                {order.priority}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Salespeople with Assigned Orders */}
              {salespeople.filter(sp => ordersBySalesperson[sp.userId]?.length > 0).map((salesperson) => {
                const salespersonOrders = ordersBySalesperson[salesperson.userId] || [];
                const stats = calculateSalespersonOrderStats(salespersonOrders);
                const isExpanded = expandedSalespeople.has(salesperson.userId);

                return (
                  <Card key={salesperson.userId} data-testid={`card-salesperson-orders-${salesperson.userId}`}>
                    <CardContent className="p-0">
                      <div
                        className="p-6 cursor-pointer hover:bg-muted/50 transition-colors border-b"
                        onClick={() => toggleSalespersonExpansion(salesperson.userId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                {(salesperson.userName || salesperson.userEmail || 'SP').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold" data-testid={`text-salesperson-name-${salesperson.userId}`}>
                                {salesperson.userName || salesperson.userEmail || 'Unknown Salesperson'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {salesperson.territory || "No territory assigned"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold" data-testid={`text-orders-count-${salesperson.userId}`}>
                                {stats.total} Orders
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {Object.entries(stats.statusCounts).slice(0, 3).map(([status, count]) => (
                                  <span key={status} className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${getOrderStatusColor(status as Order["status"]).split(' ')[1]}`} />
                                    {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const orderIds = salespersonOrders.map(o => o.id);
                                  setSelectedOrders(prev =>
                                    prev.length === orderIds.length && orderIds.every(id => prev.includes(id))
                                      ? prev.filter(id => !orderIds.includes(id))
                                      : Array.from(new Set([...prev, ...orderIds]))
                                  );
                                }}
                                data-testid={`button-select-all-${salesperson.userId}`}
                              >
                                Select All
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              {isExpanded ?
                                <XCircle className="w-4 h-4" /> :
                                <CheckCircle className="w-4 h-4" />
                              }
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-6 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {salespersonOrders.map((order) => {
                              const org = organizations.find(o => o.id === order.orgId);
                              const isSelected = selectedOrders.includes(order.id);

                              return (
                                <div
                                  key={order.id}
                                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                  }`}
                                  onClick={() => canEdit && toggleOrderSelection(order.id)}
                                  data-testid={`card-assigned-order-${order.id}`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {canEdit && (
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() => toggleOrderSelection(order.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          data-testid={`checkbox-assigned-order-${order.id}`}
                                        />
                                      )}
                                      <span className="font-medium text-sm">{order.orderCode}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOrderId(order.id);
                                        setIsOrderDetailModalOpen(true);
                                      }}
                                      data-testid={`button-view-assigned-order-${order.id}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <h4 className="font-medium text-sm mb-1 truncate">{order.orderName}</h4>
                                  <p className="text-xs text-muted-foreground mb-2 truncate">{org?.name}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getOrderStatusColor(order.status)}`}
                                      data-testid={`badge-assigned-status-${order.id}`}
                                    >
                                      {order.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${getOrderPriorityColor(order.priority)}`}
                                      data-testid={`badge-assigned-priority-${order.id}`}
                                    >
                                      {order.priority}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Empty State */}
              {orders.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                    <p className="text-muted-foreground">
                      There are no orders to manage at this time.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          {user?.role === 'sales' ? (
            <SalespersonWorkflowDashboard />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Workflow Dashboard</h3>
                  <p className="text-muted-foreground">
                    This workflow dashboard is only available for sales users.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateSalespersonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedSalespersonId && (
        <SalespersonDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedSalespersonId(null);
          }}
          salespersonId={selectedSalespersonId}
        />
      )}

      {selectedOrderId && (
        <OrderDetailModal
          isOpen={isOrderDetailModalOpen}
          onClose={() => {
            setIsOrderDetailModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
}