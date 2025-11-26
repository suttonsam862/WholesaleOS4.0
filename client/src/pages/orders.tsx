import { SplitView } from "@/components/layout/split-view";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { OrderDetailModal } from "@/components/modals/order-detail-modal";
import { CreateOrderModal } from "@/components/modals/create-order-modal";
import { DataCapsule } from "@/components/DataCapsule";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasPermission, canModify } from "@/lib/permissions";
import { KanbanSkeleton } from "@/components/ui/loading-skeletons";
import { Search, Plus, Download, LayoutGrid, Users, Package, Calendar, Clock, AlertCircle, CheckCircle2, Truck, Eye, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { OrgLogo } from "@/components/ui/org-logo";
import { OrgColorPalette } from "@/components/ui/org-branded-card";

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
  logoUrl: string | null;
}

interface Salesperson {
  id: number;
  userId: string;
  territory: string | null;
  quotaMonthly: string | null;
  active: boolean;
  notes: string | null;
  userName?: string;
  userEmail?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "New", color: "text-blue-400 border-blue-400/30 bg-blue-400/10", icon: Package },
  waiting_sizes: { label: "Waiting Sizes", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", icon: Clock },
  invoiced: { label: "Invoiced", color: "text-purple-400 border-purple-400/30 bg-purple-400/10", icon: AlertCircle },
  production: { label: "Production", color: "text-orange-400 border-orange-400/30 bg-orange-400/10", icon: LayoutGrid },
  shipped: { label: "Shipped", color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10", icon: Truck },
  completed: { label: "Completed", color: "text-green-400 border-green-400/30 bg-green-400/10", icon: CheckCircle2 },
};

export default function Orders() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // State for modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

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

  // Fetch orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  // Fetch organizations for display
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Fetch salespeople for reassignment (admin only)
  const { data: salespeople = [] } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespeople"],
    retry: false,
    enabled: isAuthenticated && hasPermission(user, "salespeople", "read"),
  });

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Role-based filtering for sales users
      if (user?.role === 'sales' && order.salespersonId !== user.id) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const org = organizations.find(o => o.id === order.orgId);
        if (!(
          order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.orderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org?.name.toLowerCase().includes(searchTerm.toLowerCase())
        )) {
          return false;
        }
      }

      // Status filter
      if (statusFilter && statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter && priorityFilter !== "all" && order.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [orders, organizations, searchTerm, statusFilter, priorityFilter, user]);

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredOrders.map(order => {
      const org = organizations.find(o => o.id === order.orgId);
      return {
        "Order Code": order.orderCode,
        "Order Name": order.orderName,
        "Organization": org?.name || "",
        "Status": order.status,
        "Priority": order.priority,
        "Est. Delivery": order.estDelivery || "TBD",
        "Created": format(new Date(order.createdAt), "yyyy-MM-dd"),
      };
    });

    if (csvData.length === 0) {
      toast({
        title: "No data to export",
        description: "No orders to export",
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
    a.download = `orders_${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Orders exported successfully",
    });
  };

  if (isLoading || ordersLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">Loading orders...</p>
        </div>
        <KanbanSkeleton columns={6} cardsPerColumn={3} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      <div className="space-y-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text" data-testid="heading-orders">
              Production Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your production workflow efficiently.
            </p>
          </div>
          {canModify(user, 'orders') && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              data-testid="button-create-order"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="glass-card border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, name or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-black/20 border-white/10 focus:border-primary/50"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-black/20 border-white/10 text-white" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px] bg-black/20 border-white/10 text-white" data-testid="select-priority-filter">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportToCSV}
                  disabled={filteredOrders.length === 0}
                  className="border-white/10 hover:bg-white/5"
                  title="Export CSV"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-h-0">
        <SplitView
          sidebar={
            <div className="space-y-3 pb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="font-semibold text-foreground">Orders List</h3>
                <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
                  {filteredOrders.length}
                </Badge>
              </div>
              
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No orders found
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const org = organizations.find(o => o.id === order.orgId);
                  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:bg-white/5 group relative overflow-hidden",
                        selectedOrder?.id === order.id 
                          ? "bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(0,243,255,0.1)]" 
                          : "bg-black/20 border-white/5 hover:border-white/10"
                      )}
                    >
                      {/* Status Indicator Line */}
                      <div className={cn("absolute left-0 top-0 bottom-0 w-1", status.color.split(' ')[2].replace('bg-', 'bg-opacity-100 bg-'))} />

                      <div className="flex justify-between items-start mb-1 pl-2">
                        <span className="font-medium text-sm text-foreground truncate">{order.orderCode}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), 'MMM dd')}</span>
                      </div>
                      
                      <div className="pl-2 mb-2">
                        <p className="text-xs font-medium text-foreground/90 truncate">{order.orderName}</p>
                        {org && (
                          <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3" />
                            {org.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pl-2 mt-2">
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 flex items-center gap-1", status.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                        {order.priority === 'high' && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 bg-red-500/20 text-red-400 border-red-500/30">
                            High Priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          }
          content={
            selectedOrder ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold gradient-text">
                      {selectedOrder.orderCode}
                    </h2>
                    <p className="text-lg text-foreground/80 mt-1">{selectedOrder.orderName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickViewOpen(true)}
                      className="border-white/10 hover:bg-white/5"
                      data-testid="button-quick-view"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Quick View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsDetailModalOpen(true);
                      }}
                      className="border-primary/50 bg-primary/10 hover:bg-primary/20"
                      data-testid="button-full-details"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Order
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="glass-card border-white/10">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn("p-3 rounded-full", STATUS_CONFIG[selectedOrder.status]?.color)}>
                        {(() => {
                          const Icon = STATUS_CONFIG[selectedOrder.status]?.icon || Package;
                          return <Icon className="w-6 h-6" />;
                        })()}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                        <p className="text-lg font-semibold text-foreground">{STATUS_CONFIG[selectedOrder.status]?.label}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Delivery</p>
                        <p className="text-lg font-semibold text-foreground">
                          {selectedOrder.estDelivery ? format(new Date(selectedOrder.estDelivery), 'MMM dd, yyyy') : 'TBD'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn("p-3 rounded-full", 
                        selectedOrder.priority === 'high' ? "bg-red-500/10 text-red-500" : 
                        selectedOrder.priority === 'low' ? "bg-green-500/10 text-green-500" : 
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Priority</p>
                        <p className="text-lg font-semibold capitalize text-foreground">{selectedOrder.priority}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card border-white/10 h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const org = organizations.find(o => o.id === selectedOrder.orgId);
                        return org ? (
                          <>
                            <div className="flex items-center gap-4">
                              <OrgLogo
                                src={org.logoUrl}
                                orgName={org.name}
                                orgId={org.id}
                                size="xl"
                                showColorRing
                                className="shadow-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-lg font-medium text-foreground">{org.name}</p>
                                <p className="text-sm text-muted-foreground">{org.city}, {org.state}</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Organization not found</p>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card className="glass-card border-white/10 h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Progress Checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded bg-white/5">
                        <span className="text-sm text-foreground">Design Approved</span>
                        {selectedOrder.designApproved ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-white/5">
                        <span className="text-sm text-foreground">Sizes Validated</span>
                        {selectedOrder.sizesValidated ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-white/5">
                        <span className="text-sm text-foreground">Deposit Received</span>
                        {selectedOrder.depositReceived ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <Package className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Select an order to view details</p>
                <p className="text-sm">Choose an order from the list on the left</p>
              </div>
            )
          }
        />
      </div>

      {/* Modals */}
      {selectedOrder && (
        <>
          <OrderDetailModal
            orderId={selectedOrder.id}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
            }}
          />
          <DataCapsule
            isOpen={isQuickViewOpen}
            onClose={() => setIsQuickViewOpen(false)}
            orderId={selectedOrder.id}
            onOpenFullView={(orderId) => {
              setIsQuickViewOpen(false);
              setIsDetailModalOpen(true);
            }}
          />
        </>
      )}

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}