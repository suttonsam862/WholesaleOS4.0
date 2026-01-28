import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  Palette,
  MessageSquare,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Bell,
  Download,
  RefreshCw,
  User,
  Building2,
  Package,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { format, formatDistanceToNow, isAfter, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StatusBadgeV6 } from "@/components/v6/StatusBadgeV6";
import { CreateOrderModalV6 } from "@/components/v6/CreateOrderModalV6";

interface DashboardOrder {
  id: number;
  orderNumber: string;
  orderName: string;
  customerId: number;
  customerName: string;
  organizationName?: string;
  status: string;
  paymentStatus: string;
  totalUnits: number;
  totalAmount: number;
  dueDate?: string;
  eventDate?: string;
  isRush: boolean;
  createdAt: string;
  updatedAt: string;
  verification: {
    sizesVerified: boolean;
    sizesUploaded: boolean;
    itemsVerified: boolean;
    designStatus: string;
    lastCustomerContact?: string;
    validationStatus: "passed" | "warnings" | "errors" | "not_run";
    validationErrorCount: number;
    validationWarningCount: number;
    completedCount: number;
    totalCount: number;
  };
  products: { name: string; quantity: number }[];
  lastActivity?: {
    message: string;
    timestamp: string;
  };
}

interface DashboardStats {
  totalPrePayment: number;
  needsAction: number;
  waitingOnCustomer: number;
  waitingOnDesign: number;
  approachingDeadline: number;
  overdue: number;
}

const VERIFICATION_STEPS = [
  { key: "sizes", label: "Sizes", icon: FileSpreadsheet },
  { key: "items", label: "Items", icon: Package },
  { key: "design", label: "Design", icon: Palette },
  { key: "contact", label: "Contact", icon: MessageSquare },
];

function VerificationChip({
  status,
  label,
}: {
  status: "verified" | "in_progress" | "not_started" | "na";
  label: string;
}) {
  const colors = {
    verified: "bg-green-100 text-green-700 border-green-200",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
    not_started: "bg-gray-100 text-gray-600 border-gray-200",
    na: "bg-gray-50 text-gray-400 border-gray-100",
  };

  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full border font-medium",
        colors[status]
      )}
    >
      {label}
    </span>
  );
}

function ValidationIcon({ status, errorCount, warningCount }: {
  status: string;
  errorCount: number;
  warningCount: number;
}) {
  if (status === "errors") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <AlertCircle className="h-5 w-5 text-red-500" />
        </TooltipTrigger>
        <TooltipContent>
          {errorCount} validation error{errorCount !== 1 ? "s" : ""}
        </TooltipContent>
      </Tooltip>
    );
  }
  if (status === "warnings") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        </TooltipTrigger>
        <TooltipContent>
          {warningCount} validation warning{warningCount !== 1 ? "s" : ""}
        </TooltipContent>
      </Tooltip>
    );
  }
  if (status === "passed") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </TooltipTrigger>
        <TooltipContent>All validations passed</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger>
        <HelpCircle className="h-5 w-5 text-gray-400" />
      </TooltipTrigger>
      <TooltipContent>Validation not run</TooltipContent>
    </Tooltip>
  );
}

function OrderCard({ order, onAction }: { order: DashboardOrder; onAction: (action: string, order: DashboardOrder) => void }) {
  const [, navigate] = useLocation();

  const isOverdue = order.dueDate && isAfter(new Date(), new Date(order.dueDate));
  const isApproaching = order.dueDate && !isOverdue &&
    isAfter(addDays(new Date(), 7), new Date(order.dueDate));

  const getVerificationStatus = (key: string) => {
    switch (key) {
      case "sizes":
        if (order.verification.sizesVerified) return "verified";
        if (order.verification.sizesUploaded) return "in_progress";
        return "not_started";
      case "items":
        return order.verification.itemsVerified ? "verified" : "not_started";
      case "design":
        if (order.verification.designStatus === "approved") return "verified";
        if (order.verification.designStatus === "n/a") return "na";
        if (["assigned", "in_progress", "pending_approval"].includes(order.verification.designStatus)) return "in_progress";
        return "not_started";
      case "contact":
        if (!order.verification.lastCustomerContact) return "not_started";
        const daysSinceContact = Math.floor(
          (Date.now() - new Date(order.verification.lastCustomerContact).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceContact <= 7 ? "verified" : "in_progress";
      default:
        return "not_started";
    }
  };

  const progressPercent = (order.verification.completedCount / order.verification.totalCount) * 100;

  const getPrimaryAction = () => {
    if (!order.verification.sizesUploaded) return { label: "Upload Sizes", action: "upload_sizes" };
    if (!order.verification.sizesVerified) return { label: "Verify Sizes", action: "verify_sizes" };
    if (!order.verification.itemsVerified) return { label: "Verify Items", action: "verify_items" };
    if (order.verification.designStatus === "not_created") return { label: "Create Design Job", action: "create_design" };
    return { label: "View Order", action: "view" };
  };

  const primaryAction = getPrimaryAction();

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        isOverdue && "border-l-4 border-l-red-500",
        isApproaching && !isOverdue && "border-l-4 border-l-yellow-500",
        order.verification.validationStatus === "errors" && "border-l-4 border-l-red-500"
      )}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <ValidationIcon
              status={order.verification.validationStatus}
              errorCount={order.verification.validationErrorCount}
              warningCount={order.verification.validationWarningCount}
            />
            <div>
              <button
                onClick={() => navigate(`/v6/orders/${order.id}`)}
                className="font-semibold text-primary hover:underline"
              >
                {order.orderNumber}
              </button>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {order.customerName}
                {order.organizationName && ` (${order.organizationName})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.isRush && (
              <Badge variant="destructive" className="text-xs">Rush</Badge>
            )}
            {order.dueDate && (
              <Badge variant={isOverdue ? "destructive" : isApproaching ? "secondary" : "outline"} className="text-xs">
                {isOverdue ? "OVERDUE" : format(new Date(order.dueDate), "MMM d")}
              </Badge>
            )}
          </div>
        </div>

        {/* Product Summary */}
        <div className="mb-3">
          <p className="text-sm">
            {order.products[0]?.name || "No products"}
            {order.products.length > 1 && (
              <span className="text-muted-foreground"> (+{order.products.length - 1} more)</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground">{order.totalUnits} units</p>
        </div>

        {/* Verification Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Verification Progress</span>
            <span className="font-medium">{order.verification.completedCount}/{order.verification.totalCount}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Verification Chips */}
        <div className="flex flex-wrap gap-1 mb-3">
          {VERIFICATION_STEPS.map((step) => (
            <VerificationChip
              key={step.key}
              status={getVerificationStatus(step.key)}
              label={step.label}
            />
          ))}
        </div>

        {/* Last Activity */}
        {order.lastActivity && (
          <p className="text-xs text-muted-foreground mb-3 truncate">
            {order.lastActivity.message} · {formatDistanceToNow(new Date(order.lastActivity.timestamp), { addSuffix: true })}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => onAction(primaryAction.action, order)}>
            {primaryAction.label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/v6/orders/${order.id}`)}
          >
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction("contact_customer", order)}>
                Contact Customer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("add_note", order)}>
                Add Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("flag", order)}>
                Flag for Review
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value, icon: Icon, variant = "default" }: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "warning" | "error";
}) {
  const colors = {
    default: "text-foreground",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <Icon className={cn("h-5 w-5", colors[variant])} />
      <div>
        <p className={cn("text-2xl font-bold", colors[variant])}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function FrontendOpsDashboardV6() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [waitingOnCustomerOpen, setWaitingOnCustomerOpen] = useState(false);
  const [waitingOnDesignOpen, setWaitingOnDesignOpen] = useState(false);

  // Fetch dashboard data
  const { data: orders = [], isLoading: loadingOrders } = useQuery<DashboardOrder[]>({
    queryKey: ["/api/v6/dashboard/frontend-ops/orders"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/v6/dashboard/frontend-ops/stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Separate orders into queues
  const { needsAction, waitingOnCustomer, waitingOnDesign } = useMemo(() => {
    const needsAction: DashboardOrder[] = [];
    const waitingOnCustomer: DashboardOrder[] = [];
    const waitingOnDesign: DashboardOrder[] = [];

    orders.forEach((order) => {
      // Waiting on customer: no contact in 7+ days
      if (order.verification.lastCustomerContact) {
        const daysSinceContact = Math.floor(
          (Date.now() - new Date(order.verification.lastCustomerContact).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceContact > 7) {
          waitingOnCustomer.push(order);
          return;
        }
      }

      // Waiting on design
      if (["assigned", "in_progress", "pending_approval"].includes(order.verification.designStatus)) {
        waitingOnDesign.push(order);
        return;
      }

      // Everything else needs action
      needsAction.push(order);
    });

    return { needsAction, waitingOnCustomer, waitingOnDesign };
  }, [orders]);

  const handleOrderAction = (action: string, order: DashboardOrder) => {
    switch (action) {
      case "view":
        navigate(`/v6/orders/${order.id}`);
        break;
      case "upload_sizes":
        navigate(`/v6/orders/${order.id}?action=upload_sizes`);
        break;
      case "verify_sizes":
        navigate(`/v6/orders/${order.id}?action=verify_sizes`);
        break;
      case "verify_items":
        navigate(`/v6/orders/${order.id}?action=verify_items`);
        break;
      case "create_design":
        navigate(`/v6/design-jobs/new?orderId=${order.id}`);
        break;
      case "contact_customer":
        toast({ title: "Opening customer contact..." });
        break;
      case "add_note":
        toast({ title: "Opening note editor..." });
        break;
      case "flag":
        toast({ title: "Order flagged for review" });
        break;
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/v6/dashboard/frontend-ops"] });
    toast({ title: "Dashboard refreshed" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Front-End Ops Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 p-4 bg-card rounded-lg border">
              <Button onClick={() => setShowCreateOrder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
              <Button variant="outline" onClick={() => navigate("/v6/design-jobs/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Design Job
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Validation
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            {/* Orders Needing Action */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Orders Needing Action
                {needsAction.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{needsAction.length}</Badge>
                )}
              </h2>

              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : needsAction.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground mb-4">
                      No orders currently need your immediate action.
                    </p>
                    <Button onClick={() => setShowCreateOrder(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Order
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {needsAction.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAction={handleOrderAction}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Waiting Sections */}
            <div className="space-y-4">
              {/* Waiting on Customer */}
              <Collapsible open={waitingOnCustomerOpen} onOpenChange={setWaitingOnCustomerOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {waitingOnCustomerOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">Waiting on Customer</span>
                      <Badge variant="outline">{waitingOnCustomer.length}</Badge>
                    </div>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {waitingOnCustomer.slice(0, 5).map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAction={handleOrderAction}
                      />
                    ))}
                  </div>
                  {waitingOnCustomer.length > 5 && (
                    <Button variant="link" className="mt-2">
                      View all {waitingOnCustomer.length} orders
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Waiting on Design */}
              <Collapsible open={waitingOnDesignOpen} onOpenChange={setWaitingOnDesignOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full p-4 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      {waitingOnDesignOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">Waiting on Design</span>
                      <Badge variant="outline">{waitingOnDesign.length}</Badge>
                    </div>
                    <Palette className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {waitingOnDesign.slice(0, 5).map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAction={handleOrderAction}
                      />
                    ))}
                  </div>
                  {waitingOnDesign.length > 5 && (
                    <Button variant="link" className="mt-2">
                      View all {waitingOnDesign.length} orders
                    </Button>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Today's Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today's Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatCard
                  label="Pre-Payment Orders"
                  value={stats?.totalPrePayment || 0}
                  icon={Package}
                />
                <StatCard
                  label="Needs Action"
                  value={stats?.needsAction || 0}
                  icon={AlertCircle}
                  variant={stats?.needsAction ? "warning" : "default"}
                />
                <StatCard
                  label="Approaching Deadline"
                  value={stats?.approachingDeadline || 0}
                  icon={Clock}
                  variant={stats?.approachingDeadline ? "warning" : "default"}
                />
                <StatCard
                  label="Overdue"
                  value={stats?.overdue || 0}
                  icon={AlertTriangle}
                  variant={stats?.overdue ? "error" : "default"}
                />
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.overdue || 0) > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {stats?.overdue} overdue order{stats?.overdue !== 1 ? "s" : ""}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No alerts at this time
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModalV6
        open={showCreateOrder}
        onOpenChange={setShowCreateOrder}
        onSuccess={(orderId) => navigate(`/v6/orders/${orderId}`)}
      />
    </div>
  );
}
