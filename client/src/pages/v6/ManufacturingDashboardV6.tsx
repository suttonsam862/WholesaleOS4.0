/**
 * V6 Manufacturing Dashboard
 * Main work surface for Back-End Ops with funnel view and list view
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNow, isBefore, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Eye,
  Package,
  Factory,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  RefreshCw,
  Send,
  Building2,
  FileText,
  Camera,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

// V6 Components
import {
  StatusBadgeV6,
  MANUFACTURING_STATUS_CONFIG,
  type ManufacturingStatusV6,
} from "@/components/v6";

// Types
interface ManufacturingOrder {
  id: number;
  orderId: number;
  orderCode: string;
  orderName?: string;
  organizationId: number;
  organizationName?: string;
  status: ManufacturingStatusV6;
  manufacturerId?: number;
  manufacturerName?: string;
  totalUnits: number;
  packageSentAt?: string;
  expectedShipDate?: string;
  actualShipDate?: string;
  trackingNumber?: string;
  customerDeadline?: string;
  daysInStatus: number;
  hasIssues?: boolean;
  issueNotes?: string;
  lastUpdateAt?: string;
  createdAt: string;
}

interface Manufacturer {
  id: number;
  name: string;
}

interface SummaryStats {
  new: number;
  accepted: number;
  inProduction: number;
  qc: number;
  readyToShip: number;
  shipped: number;
  overdue: number;
  atRisk: number;
}

const FUNNEL_STAGES: { status: ManufacturingStatusV6; label: string; icon: typeof Package }[] = [
  { status: "new", label: "New", icon: Package },
  { status: "accepted", label: "Accepted", icon: CheckCircle2 },
  { status: "in_production", label: "In Production", icon: Factory },
  { status: "qc", label: "QC", icon: Eye },
  { status: "ready_to_ship", label: "Ready to Ship", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
];

export default function ManufacturingDashboardV6() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"funnel" | "list">("funnel");
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ManufacturingStatusV6 | "">("");
  const [updateNote, setUpdateNote] = useState("");
  const [expectedShipDate, setExpectedShipDate] = useState("");

  // Queries
  const { data: orders = [], isLoading } = useQuery<ManufacturingOrder[]>({
    queryKey: ["/api/manufacturing"],
  });

  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      orderId: number;
      status?: ManufacturingStatusV6;
      expectedShipDate?: string;
      note?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/manufacturing/${data.orderId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      toast({ title: "Manufacturing status updated" });
      setIsUpdateModalOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
      setUpdateNote("");
      setExpectedShipDate("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate summary stats
  const summaryStats = useMemo<SummaryStats>(() => {
    const now = new Date();
    return {
      new: orders.filter((o) => o.status === "new").length,
      accepted: orders.filter((o) => o.status === "accepted").length,
      inProduction: orders.filter((o) => o.status === "in_production").length,
      qc: orders.filter((o) => o.status === "qc").length,
      readyToShip: orders.filter((o) => o.status === "ready_to_ship").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      overdue: orders.filter(
        (o) => o.expectedShipDate && isBefore(new Date(o.expectedShipDate), now) && o.status !== "shipped"
      ).length,
      atRisk: orders.filter(
        (o) =>
          o.customerDeadline &&
          isBefore(new Date(o.customerDeadline), addDays(now, 7)) &&
          o.status !== "shipped"
      ).length,
    };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(term) ||
          o.organizationName?.toLowerCase().includes(term) ||
          o.manufacturerName?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (manufacturerFilter !== "all") {
      result = result.filter((o) => o.manufacturerId === parseInt(manufacturerFilter));
    }

    return result;
  }, [orders, searchTerm, statusFilter, manufacturerFilter]);

  // Group by status for funnel
  const ordersByStatus = useMemo(() => {
    const grouped: Record<ManufacturingStatusV6, ManufacturingOrder[]> = {
      new: [],
      accepted: [],
      in_production: [],
      qc: [],
      ready_to_ship: [],
      shipped: [],
    };

    filteredOrders.forEach((order) => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  }, [filteredOrders]);

  const openUpdateModal = (order: ManufacturingOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setExpectedShipDate(order.expectedShipDate || "");
    setUpdateNote("");
    setIsUpdateModalOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedOrder) return;
    updateMutation.mutate({
      orderId: selectedOrder.id,
      status: newStatus || undefined,
      expectedShipDate: expectedShipDate || undefined,
      note: updateNote || undefined,
    });
  };

  const getOrderStatus = (order: ManufacturingOrder): "ok" | "warning" | "overdue" | "stale" => {
    const now = new Date();
    if (order.expectedShipDate && isBefore(new Date(order.expectedShipDate), now)) {
      return "overdue";
    }
    if (order.daysInStatus > 3) {
      return "stale";
    }
    if (
      order.customerDeadline &&
      isBefore(new Date(order.customerDeadline), addDays(now, 7))
    ) {
      return "warning";
    }
    return "ok";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manufacturing Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} orders in manufacturing
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {FUNNEL_STAGES.map((stage) => {
          const count =
            stage.status === "new"
              ? summaryStats.new
              : stage.status === "accepted"
              ? summaryStats.accepted
              : stage.status === "in_production"
              ? summaryStats.inProduction
              : stage.status === "qc"
              ? summaryStats.qc
              : stage.status === "ready_to_ship"
              ? summaryStats.readyToShip
              : summaryStats.shipped;

          const Icon = stage.icon;

          return (
            <Card
              key={stage.status}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                statusFilter === stage.status && "ring-2 ring-primary"
              )}
              onClick={() =>
                setStatusFilter(statusFilter === stage.status ? "all" : stage.status)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stage.label}</p>
              </CardContent>
            </Card>
          );
        })}
        <Card
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow border-red-500/50",
            statusFilter === "overdue" && "ring-2 ring-red-500"
          )}
          onClick={() => setStatusFilter(statusFilter === "overdue" ? "all" : "overdue")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{summaryStats.overdue}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overdue</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow border-orange-500/50",
            statusFilter === "at-risk" && "ring-2 ring-orange-500"
          )}
          onClick={() => setStatusFilter(statusFilter === "at-risk" ? "all" : "at-risk")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{summaryStats.atRisk}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">At Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Manufacturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Manufacturers</SelectItem>
                {manufacturers.map((mfg) => (
                  <SelectItem key={mfg.id} value={mfg.id.toString()}>
                    {mfg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "funnel" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("funnel")}
                className="rounded-r-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "funnel" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {FUNNEL_STAGES.map((stage) => (
            <FunnelColumn
              key={stage.status}
              status={stage.status}
              label={stage.label}
              orders={ordersByStatus[stage.status]}
              onOrderClick={(order) => setLocation(`/orders/${order.orderId}`)}
              onUpdateClick={openUpdateModal}
              getOrderStatus={getOrderStatus}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected Ship</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                    No manufacturing orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const orderStatus = getOrderStatus(order);
                  return (
                    <TableRow
                      key={order.id}
                      className={cn(
                        "cursor-pointer hover:bg-accent/50",
                        orderStatus === "overdue" && "bg-red-500/5",
                        orderStatus === "stale" && "opacity-60"
                      )}
                      onClick={() => setLocation(`/orders/${order.orderId}`)}
                    >
                      <TableCell className="font-medium">{order.orderCode}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {order.organizationName}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {order.orderName || "-"}
                      </TableCell>
                      <TableCell>{order.totalUnits}</TableCell>
                      <TableCell>{order.manufacturerName || "-"}</TableCell>
                      <TableCell>
                        <StatusBadgeV6 type="manufacturing" status={order.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        {order.expectedShipDate
                          ? format(new Date(order.expectedShipDate), "MMM d")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {order.customerDeadline ? (
                          <span
                            className={cn(
                              orderStatus === "overdue" && "text-red-500 font-medium",
                              orderStatus === "warning" && "text-orange-500"
                            )}
                          >
                            {format(new Date(order.customerDeadline), "MMM d")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{order.daysInStatus}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {orderStatus === "overdue" && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          {orderStatus === "warning" && (
                            <Clock className="w-4 h-4 text-orange-500" />
                          )}
                          {orderStatus === "stale" && (
                            <RefreshCw className="w-4 h-4 text-muted-foreground" />
                          )}
                          {order.hasIssues && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openUpdateModal(order)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLocation(`/orders/${order.orderId}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Order
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              Build Package
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Update Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Manufacturing Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order</span>
                <span className="font-medium">{selectedOrder.orderCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Manufacturer</span>
                <span>{selectedOrder.manufacturerName || "Not assigned"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Status</span>
                <StatusBadgeV6 type="manufacturing" status={selectedOrder.status} size="sm" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {FUNNEL_STAGES.map((stage) => (
                    <Button
                      key={stage.status}
                      variant={newStatus === stage.status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewStatus(stage.status)}
                      className="justify-start"
                    >
                      {stage.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expected Ship Date</label>
                <Input
                  type="date"
                  value={expectedShipDate}
                  onChange={(e) => setExpectedShipDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Update Notes</label>
                <Textarea
                  placeholder="Add notes about this update..."
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Funnel Column Component
interface FunnelColumnProps {
  status: ManufacturingStatusV6;
  label: string;
  orders: ManufacturingOrder[];
  onOrderClick: (order: ManufacturingOrder) => void;
  onUpdateClick: (order: ManufacturingOrder) => void;
  getOrderStatus: (order: ManufacturingOrder) => "ok" | "warning" | "overdue" | "stale";
}

function FunnelColumn({
  status,
  label,
  orders,
  onOrderClick,
  onUpdateClick,
  getOrderStatus,
}: FunnelColumnProps) {
  const statusConfig = MANUFACTURING_STATUS_CONFIG[status];

  return (
    <div className="flex flex-col min-w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", statusConfig.bgColor.replace("/10", ""))} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {orders.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 p-2 bg-muted/30 rounded-lg min-h-[300px]">
        {orders.map((order) => {
          const orderStatus = getOrderStatus(order);
          return (
            <Card
              key={order.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                orderStatus === "overdue" && "border-red-500",
                orderStatus === "stale" && "opacity-60"
              )}
              onClick={() => onOrderClick(order)}
            >
              <CardContent className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <span className="font-medium text-sm">{order.orderCode}</span>
                  <div className="flex gap-1">
                    {orderStatus === "overdue" && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    {orderStatus === "warning" && <Clock className="w-4 h-4 text-orange-500" />}
                    {order.hasIssues && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>

                {/* Customer */}
                <p className="text-sm text-muted-foreground truncate">
                  {order.organizationName}
                </p>

                {/* Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{order.totalUnits} units</span>
                  {order.manufacturerName && <span>{order.manufacturerName}</span>}
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between pt-2 border-t text-xs">
                  {order.expectedShipDate && (
                    <div className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span
                        className={cn(
                          orderStatus === "overdue" && "text-red-500 font-medium"
                        )}
                      >
                        {format(new Date(order.expectedShipDate), "MMM d")}
                      </span>
                    </div>
                  )}
                  {order.customerDeadline && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(order.customerDeadline), "MMM d")}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateClick(order);
                    }}
                  >
                    Update Status
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOrderClick(order);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {orders.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No orders</p>
        )}
      </div>
    </div>
  );
}
