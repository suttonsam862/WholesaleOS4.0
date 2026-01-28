/**
 * V6 Order List Page
 * Enhanced order management with filtering, sorting, bulk actions, and saved views
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { canModify, hasPermission } from "@/lib/permissions";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Search,
  Plus,
  Download,
  Filter,
  Columns,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  AlertTriangle,
  X,
  Calendar as CalendarIcon,
  ArrowUpDown,
  Building2,
  User,
  DollarSign,
} from "lucide-react";

// V6 Components
import {
  StatusBadgeV6,
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_GROUPS,
  type OrderStatusV6,
} from "@/components/v6";

// Types
interface Order {
  id: number;
  orderCode: string;
  orderName: string;
  organizationId: number;
  organizationName?: string;
  contactId?: number;
  contactName?: string;
  salespersonId?: string;
  salespersonName?: string;
  status: OrderStatusV6;
  paymentStatus?: string;
  totalAmount?: number;
  paidAmount?: number;
  requestedDeliveryDate?: string;
  internalDeadline?: string;
  isRush?: boolean;
  isSample?: boolean;
  lineItemCount?: number;
  totalQuantity?: number;
  customerPo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: number;
  name: string;
}

interface Salesperson {
  userId: string;
  userName?: string;
  userEmail?: string;
}

type SortField = "orderCode" | "orderName" | "organizationName" | "status" | "totalAmount" | "requestedDeliveryDate" | "createdAt";
type SortDirection = "asc" | "desc";

const DEFAULT_VISIBLE_COLUMNS = [
  "checkbox",
  "orderCode",
  "orderName",
  "organization",
  "status",
  "payment",
  "total",
  "deliveryDate",
  "created",
  "actions",
];

const ALL_COLUMNS = [
  { id: "checkbox", label: "", width: "48px", sortable: false },
  { id: "orderCode", label: "Order #", width: "130px", sortable: true },
  { id: "orderName", label: "Order Name", width: "flex", sortable: true },
  { id: "organization", label: "Organization", width: "180px", sortable: true },
  { id: "status", label: "Status", width: "140px", sortable: true },
  { id: "payment", label: "Payment", width: "120px", sortable: true },
  { id: "total", label: "Total", width: "100px", sortable: true },
  { id: "deliveryDate", label: "Delivery Date", width: "110px", sortable: true },
  { id: "created", label: "Created", width: "110px", sortable: true },
  { id: "salesperson", label: "Salesperson", width: "140px", sortable: true },
  { id: "designStatus", label: "Design Status", width: "130px", sortable: false },
  { id: "mfgStatus", label: "Mfg Status", width: "130px", sortable: false },
  { id: "internalStatus", label: "Internal Status", width: "130px", sortable: false },
  { id: "customerPo", label: "Customer PO", width: "120px", sortable: false },
  { id: "lineItems", label: "Line Items", width: "90px", sortable: false },
  { id: "totalQty", label: "Total Qty", width: "90px", sortable: false },
  { id: "updated", label: "Updated", width: "110px", sortable: true },
  { id: "actions", label: "", width: "80px", sortable: false },
];

const SAVED_VIEWS = [
  { id: "all", label: "All Orders", filters: {} },
  { id: "my-orders", label: "My Orders", filters: { myOrders: true } },
  { id: "pre-payment", label: "Pre-Payment", filters: { statusGroup: "pre-payment" } },
  { id: "in-production", label: "In Production", filters: { statusGroup: "post-payment" } },
  { id: "rush", label: "Rush Orders", filters: { isRush: true } },
  { id: "this-week", label: "This Week's Deadlines", filters: { deliveryThisWeek: true } },
];

export default function OrderListV6() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [salespersonFilter, setSalespersonFilter] = useState<string>("");
  const [organizationFilter, setOrganizationFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ from?: Date; to?: Date }>({});
  const [selectedView, setSelectedView] = useState("all");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const { data: salespeople = [] } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespeople"],
    enabled: hasPermission(user, "salespeople", "read"),
  });

  // Bulk status change mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async (data: { orderIds: number[]; status: OrderStatusV6; note?: string }) => {
      const res = await apiRequest("POST", "/api/orders/bulk-status", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status updated",
        description: `Updated ${data.successCount} orders`,
      });
      setSelectedOrders([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtering and sorting
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.orderCode.toLowerCase().includes(term) ||
          order.orderName?.toLowerCase().includes(term) ||
          order.organizationName?.toLowerCase().includes(term) ||
          order.customerPo?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((order) => statusFilter.includes(order.status));
    }

    // Payment filter
    if (paymentFilter.length > 0) {
      result = result.filter((order) => paymentFilter.includes(order.paymentStatus || "pending"));
    }

    // Salesperson filter
    if (salespersonFilter) {
      result = result.filter((order) => order.salespersonId === salespersonFilter);
    }

    // Organization filter
    if (organizationFilter) {
      result = result.filter((order) => order.organizationId === parseInt(organizationFilter));
    }

    // Date range filter
    if (dateRangeFilter.from || dateRangeFilter.to) {
      result = result.filter((order) => {
        const date = new Date(order.createdAt);
        if (dateRangeFilter.from && date < dateRangeFilter.from) return false;
        if (dateRangeFilter.to && date > dateRangeFilter.to) return false;
        return true;
      });
    }

    // My Orders view
    if (selectedView === "my-orders" && user) {
      result = result.filter((order) => order.salespersonId === user.id);
    }

    // Rush orders view
    if (selectedView === "rush") {
      result = result.filter((order) => order.isRush);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "organizationName") {
        aVal = a.organizationName || "";
        bVal = b.organizationName || "";
      }

      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    orders,
    searchTerm,
    statusFilter,
    paymentFilter,
    salespersonFilter,
    organizationFilter,
    dateRangeFilter,
    selectedView,
    sortField,
    sortDirection,
    user,
  ]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return field;
      }
      setSortDirection("asc");
      return field;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedOrders(filteredOrders.map((o) => o.id));
      } else {
        setSelectedOrders([]);
      }
    },
    [filteredOrders]
  );

  const handleSelectOrder = useCallback((orderId: number, checked: boolean) => {
    setSelectedOrders((prev) =>
      checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  }, []);

  const handleBulkStatusChange = useCallback(
    (status: OrderStatusV6) => {
      bulkStatusMutation.mutate({ orderIds: selectedOrders, status });
    },
    [selectedOrders, bulkStatusMutation]
  );

  const handleExportCSV = useCallback(() => {
    const ordersToExport = selectedOrders.length > 0
      ? filteredOrders.filter((o) => selectedOrders.includes(o.id))
      : filteredOrders;

    if (ordersToExport.length === 0) {
      toast({ title: "No orders to export" });
      return;
    }

    const csvData = ordersToExport.map((order) => ({
      "Order Code": order.orderCode,
      "Order Name": order.orderName || "",
      "Organization": order.organizationName || "",
      "Status": ORDER_STATUS_CONFIG[order.status]?.label || order.status,
      "Total": order.totalAmount || 0,
      "Delivery Date": order.requestedDeliveryDate
        ? format(new Date(order.requestedDeliveryDate), "yyyy-MM-dd")
        : "",
      "Created": format(new Date(order.createdAt), "yyyy-MM-dd"),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).map((v) => `"${v}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported successfully" });
  }, [filteredOrders, selectedOrders, toast]);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter([]);
    setPaymentFilter([]);
    setSalespersonFilter("");
    setOrganizationFilter("");
    setDateRangeFilter({});
    setSelectedView("all");
  }, []);

  const hasActiveFilters =
    searchTerm ||
    statusFilter.length > 0 ||
    paymentFilter.length > 0 ||
    salespersonFilter ||
    organizationFilter ||
    dateRangeFilter.from ||
    dateRangeFilter.to;

  if (ordersLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length} orders
            {selectedOrders.length > 0 && ` (${selectedOrders.length} selected)`}
          </p>
        </div>
        {canModify(user, "orders") && (
          <Button onClick={() => setLocation("/orders/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Saved Views */}
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                {SAVED_VIEWS.map((view) => (
                  <SelectItem key={view.id} value={view.id}>
                    {view.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={cn(hasActiveFilters && "border-primary")}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {
                    [
                      statusFilter.length > 0,
                      paymentFilter.length > 0,
                      !!salespersonFilter,
                      !!organizationFilter,
                      !!dateRangeFilter.from || !!dateRangeFilter.to,
                    ].filter(Boolean).length
                  }
                </Badge>
              )}
              {isFiltersOpen ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </Button>

            {/* Column Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Columns className="w-4 h-4 mr-2" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2" align="end">
                <div className="space-y-1">
                  {ALL_COLUMNS.filter((col) => col.id !== "checkbox" && col.id !== "actions").map(
                    (col) => (
                      <label
                        key={col.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer"
                      >
                        <Checkbox
                          checked={visibleColumns.includes(col.id)}
                          onCheckedChange={(checked) =>
                            setVisibleColumns((prev) =>
                              checked
                                ? [...prev, col.id]
                                : prev.filter((id) => id !== col.id)
                            )
                          }
                        />
                        <span className="text-sm">{col.label}</span>
                      </label>
                    )
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Expanded Filters */}
          {isFiltersOpen && (
            <div className="flex items-center gap-3 flex-wrap pt-3 border-t">
              {/* Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    Status
                    {statusFilter.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1">
                        {statusFilter.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-2 max-h-[400px] overflow-auto" align="start">
                  {Object.entries(ORDER_STATUS_GROUPS).map(([groupName, statuses]) => (
                    <div key={groupName} className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase px-2 py-1">
                        {groupName}
                      </p>
                      {statuses.map((status) => (
                        <label
                          key={status}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer"
                        >
                          <Checkbox
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) =>
                              setStatusFilter((prev) =>
                                checked ? [...prev, status] : prev.filter((s) => s !== status)
                              )
                            }
                          />
                          <StatusBadgeV6 type="order" status={status} size="sm" />
                        </label>
                      ))}
                    </div>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Payment Status Filter */}
              <Select
                value={paymentFilter[0] || "all"}
                onValueChange={(v) => setPaymentFilter(v === "all" ? [] : [v])}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deposit_received">Deposit Received</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="fully_paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>

              {/* Salesperson Filter */}
              {salespeople.length > 0 && (
                <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                  <SelectTrigger className="w-[150px] h-8">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Salespeople</SelectItem>
                    {salespeople.map((sp) => (
                      <SelectItem key={sp.userId} value={sp.userId}>
                        {sp.userName || sp.userEmail}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Organization Filter */}
              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger className="w-[180px] h-8">
                  <Building2 className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateRangeFilter.from ? (
                      dateRangeFilter.to ? (
                        <>
                          {format(dateRangeFilter.from, "LLL dd")} -{" "}
                          {format(dateRangeFilter.to, "LLL dd")}
                        </>
                      ) : (
                        format(dateRangeFilter.from, "LLL dd, yyyy")
                      )
                    ) : (
                      "Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRangeFilter.from,
                      to: dateRangeFilter.to,
                    }}
                    onSelect={(range) =>
                      setDateRangeFilter({ from: range?.from, to: range?.to })
                    }
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && !isFiltersOpen && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
              {statusFilter.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1">
                  {ORDER_STATUS_CONFIG[status as OrderStatusV6]?.label || status}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() =>
                      setStatusFilter((prev) => prev.filter((s) => s !== status))
                    }
                  />
                </Badge>
              ))}
              {paymentFilter.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  Payment: {paymentFilter[0]}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setPaymentFilter([])}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedOrders.length === filteredOrders.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                {selectedOrders.length} order{selectedOrders.length !== 1 && "s"} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Change Status
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(ORDER_STATUS_GROUPS).map(([groupName, statuses]) => (
                    <SelectGroup key={groupName}>
                      <SelectLabel>{groupName}</SelectLabel>
                      {statuses.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleBulkStatusChange(status)}
                        >
                          <StatusBadgeV6 type="order" status={status} size="sm" />
                        </DropdownMenuItem>
                      ))}
                    </SelectGroup>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                Export
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedOrders([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.includes("checkbox") && (
                <TableHead className="w-[48px]">
                  <Checkbox
                    checked={
                      filteredOrders.length > 0 &&
                      selectedOrders.length === filteredOrders.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {visibleColumns.includes("orderCode") && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() => handleSort("orderCode")}
                  >
                    Order #
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("orderName") && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() => handleSort("orderName")}
                  >
                    Order Name
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("organization") && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() => handleSort("organizationName")}
                  >
                    Organization
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("status") && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("payment") && (
                <TableHead>Payment</TableHead>
              )}
              {visibleColumns.includes("total") && (
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3"
                    onClick={() => handleSort("totalAmount")}
                  >
                    Total
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("deliveryDate") && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() => handleSort("requestedDeliveryDate")}
                  >
                    Delivery
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("created") && (
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </Button>
                </TableHead>
              )}
              {visibleColumns.includes("actions") && (
                <TableHead className="w-[80px]"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    "cursor-pointer hover:bg-accent/50",
                    selectedOrders.includes(order.id) && "bg-primary/5"
                  )}
                  onClick={() => setLocation(`/orders/${order.id}`)}
                >
                  {visibleColumns.includes("checkbox") && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOrder(order.id, checked as boolean)
                        }
                      />
                    </TableCell>
                  )}
                  {visibleColumns.includes("orderCode") && (
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {order.orderCode}
                        {order.isRush && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            RUSH
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.includes("orderName") && (
                    <TableCell className="max-w-[200px] truncate">
                      {order.orderName || "-"}
                    </TableCell>
                  )}
                  {visibleColumns.includes("organization") && (
                    <TableCell className="max-w-[180px] truncate">
                      {order.organizationName || "-"}
                    </TableCell>
                  )}
                  {visibleColumns.includes("status") && (
                    <TableCell>
                      <StatusBadgeV6 type="order" status={order.status} size="sm" />
                    </TableCell>
                  )}
                  {visibleColumns.includes("payment") && (
                    <TableCell>
                      <StatusBadgeV6
                        type="payment"
                        status={order.paymentStatus || "pending"}
                        size="sm"
                        showIcon={false}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.includes("total") && (
                    <TableCell className="text-right font-medium">
                      {order.totalAmount
                        ? `$${order.totalAmount.toLocaleString()}`
                        : "-"}
                    </TableCell>
                  )}
                  {visibleColumns.includes("deliveryDate") && (
                    <TableCell>
                      {order.requestedDeliveryDate
                        ? format(new Date(order.requestedDeliveryDate), "MMM d, yyyy")
                        : "-"}
                    </TableCell>
                  )}
                  {visibleColumns.includes("created") && (
                    <TableCell>
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  )}
                  {visibleColumns.includes("actions") && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setLocation(`/orders/${order.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {canModify(user, "orders") && (
                            <DropdownMenuItem
                              onClick={() => setLocation(`/orders/${order.id}/edit`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
        {/* Add pagination controls here when implementing server-side pagination */}
      </div>
    </div>
  );
}
