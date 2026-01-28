import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  Building2,
  MoreVertical,
  Bell,
  RefreshCw,
  MessageSquare,
  Camera,
  Flag,
  FileText,
  Loader2,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, isAfter, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StatusBadgeV6 } from "@/components/v6/StatusBadgeV6";

interface ReadyToSendOrder {
  id: number;
  orderNumber: string;
  orderName: string;
  customerName: string;
  organizationName?: string;
  salesRepName: string;
  paymentReceivedAt: string;
  customerDeadline?: string;
  totalUnits: number;
  totalAmount: number;
  products: {
    name: string;
    quantity: number;
    decorationType?: string;
  }[];
  files: {
    sizeBreakdown: boolean;
    designFiles: number;
    techPack: boolean;
    logoVector: boolean;
  };
  targetManufacturer?: {
    id: number;
    name: string;
    leadTimeDays: number;
  };
  estimatedProductionDays: number;
  isFlagged: boolean;
  flagReason?: string;
}

interface InProductionOrder {
  id: number;
  orderNumber: string;
  manufacturerName: string;
  manufacturingStatus: string;
  statusUpdatedAt: string;
  customerDeadline?: string;
  expectedShipDate?: string;
  alertLevel: "ok" | "warning" | "critical";
  totalUnits: number;
}

interface ComingSoonOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  expectedPaymentDate?: string;
  estimatedValue: number;
  productTypes: string[];
}

interface DashboardStats {
  readyToSend: number;
  inProduction: number;
  comingSoon: number;
  shippedThisWeek: number;
  overdueOrders: number;
  atRiskOrders: number;
}

function FileStatusIcon({ present }: { present: boolean }) {
  return present ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <AlertCircle className="h-4 w-4 text-red-500" />
  );
}

function AlertBadge({ level }: { level: "ok" | "warning" | "critical" }) {
  if (level === "ok") return null;
  return level === "critical" ? (
    <Badge variant="destructive" className="text-xs">Critical</Badge>
  ) : (
    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">Warning</Badge>
  );
}

function ReadyToSendCard({
  order,
  onBuildPackage,
  onViewOrder,
  onFlagOrder,
}: {
  order: ReadyToSendOrder;
  onBuildPackage: () => void;
  onViewOrder: () => void;
  onFlagOrder: () => void;
}) {
  const hoursSincePayment = differenceInHours(new Date(), new Date(order.paymentReceivedAt));
  const isOverdue = hoursSincePayment > 48;
  const hasAllFiles = order.files.sizeBreakdown && order.files.designFiles > 0 && order.files.techPack && order.files.logoVector;
  const deadlineFits = !order.customerDeadline ||
    isAfter(new Date(order.customerDeadline), addDays(new Date(), order.estimatedProductionDays + 3));

  return (
    <Card className={cn(
      "transition-all",
      isOverdue && "border-l-4 border-l-red-500",
      order.isFlagged && "border-l-4 border-l-orange-500",
      !hasAllFiles && !isOverdue && !order.isFlagged && "border-l-4 border-l-yellow-500"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{order.orderNumber}</span>
              {isOverdue && <Badge variant="destructive" className="text-xs animate-pulse">OVERDUE</Badge>}
              {order.isFlagged && <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Flagged</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{order.orderName}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewOrder}>
                View Full Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFlagOrder}>
                {order.isFlagged ? "Remove Flag" : "Flag Order"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Customer:</span>
            <p className="font-medium truncate">{order.customerName}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Sales Rep:</span>
            <p className="font-medium">{order.salesRepName}</p>
          </div>
        </div>

        {/* Payment Time */}
        <div className="flex items-center gap-2 text-sm mb-3 p-2 bg-muted/50 rounded">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            Payment received {formatDistanceToNow(new Date(order.paymentReceivedAt), { addSuffix: true })}
          </span>
          {hoursSincePayment > 24 && (
            <span className={cn(
              "text-xs font-medium",
              hoursSincePayment > 48 ? "text-red-600" : "text-yellow-600"
            )}>
              ({Math.floor(hoursSincePayment)}h)
            </span>
          )}
        </div>

        {/* Products & Files */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">PRODUCTS</p>
            <ul className="text-sm space-y-1">
              {order.products.slice(0, 3).map((product, i) => (
                <li key={i} className="truncate">
                  {product.quantity}x {product.name}
                </li>
              ))}
              {order.products.length > 3 && (
                <li className="text-muted-foreground">+{order.products.length - 3} more</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">FILES STATUS</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <FileStatusIcon present={order.files.sizeBreakdown} />
                Size Breakdown
              </li>
              <li className="flex items-center gap-2">
                <FileStatusIcon present={order.files.designFiles > 0} />
                Design Files ({order.files.designFiles})
              </li>
              <li className="flex items-center gap-2">
                <FileStatusIcon present={order.files.techPack} />
                Tech Pack
              </li>
              <li className="flex items-center gap-2">
                <FileStatusIcon present={order.files.logoVector} />
                Logo Vector
              </li>
            </ul>
          </div>
        </div>

        {/* Manufacturing Info */}
        <div className="p-2 bg-muted/50 rounded text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-medium">{order.targetManufacturer?.name || "Not assigned"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Production:</span>
            <span>{order.estimatedProductionDays} days</span>
          </div>
          {order.customerDeadline && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deadline:</span>
              <span className={cn(!deadlineFits && "text-red-600 font-medium")}>
                {format(new Date(order.customerDeadline), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>

        {/* Warning if timeline doesn't fit */}
        {!deadlineFits && order.customerDeadline && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-sm mb-3">
            <AlertTriangle className="h-4 w-4" />
            Timeline may not meet customer deadline
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={!hasAllFiles}
            onClick={onBuildPackage}
          >
            <Package className="h-4 w-4 mr-2" />
            Build Package
          </Button>
          <Button variant="outline" onClick={onViewOrder}>
            View Order
          </Button>
          <Button variant="outline" size="icon" onClick={onFlagOrder}>
            <Flag className={cn("h-4 w-4", order.isFlagged && "text-orange-500 fill-orange-500")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InProductionTable({ orders, onRowClick }: {
  orders: InProductionOrder[];
  onRowClick: (order: InProductionOrder) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">#</TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Manufacturer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead className="w-[60px]">Alert</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No orders in production
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order, index) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onRowClick(order)}
            >
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <span className="text-primary hover:underline">{order.orderNumber}</span>
              </TableCell>
              <TableCell>{order.manufacturerName}</TableCell>
              <TableCell>
                <StatusBadgeV6
                  type="manufacturing"
                  status={order.manufacturingStatus}
                />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(order.statusUpdatedAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                {order.customerDeadline
                  ? format(new Date(order.customerDeadline), "MMM d")
                  : "-"}
              </TableCell>
              <TableCell>
                <AlertBadge level={order.alertLevel} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function BackendOpsDashboardV6() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [selectedOrderForComm, setSelectedOrderForComm] = useState<ReadyToSendOrder | null>(null);
  const [communicationNote, setCommunicationNote] = useState("");

  // Fetch dashboard data
  const { data: readyToSend = [], isLoading: loadingReady } = useQuery<ReadyToSendOrder[]>({
    queryKey: ["/api/v6/dashboard/backend-ops/ready-to-send"],
    refetchInterval: 30000,
  });

  const { data: inProduction = [], isLoading: loadingProduction } = useQuery<InProductionOrder[]>({
    queryKey: ["/api/v6/dashboard/backend-ops/in-production"],
    refetchInterval: 30000,
  });

  const { data: comingSoon = [] } = useQuery<ComingSoonOrder[]>({
    queryKey: ["/api/v6/dashboard/backend-ops/coming-soon"],
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/v6/dashboard/backend-ops/stats"],
    refetchInterval: 60000,
  });

  const handleBuildPackage = (order: ReadyToSendOrder) => {
    navigate(`/v6/manufacturing/package-builder?orderId=${order.id}`);
  };

  const handleViewOrder = (orderId: number) => {
    navigate(`/v6/orders/${orderId}`);
  };

  const handleFlagOrder = (order: ReadyToSendOrder) => {
    toast({
      title: order.isFlagged ? "Flag removed" : "Order flagged",
      description: order.isFlagged
        ? `Flag removed from ${order.orderNumber}`
        : `${order.orderNumber} has been flagged for review`,
    });
  };

  const handleProductionRowClick = (order: InProductionOrder) => {
    navigate(`/v6/orders/${order.id}?tab=manufacturing`);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/v6/dashboard/backend-ops"] });
    toast({ title: "Dashboard refreshed" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Back-End Ops Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy h:mm a")}
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

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{stats?.readyToSend || 0}</p>
              <p className="text-xs text-muted-foreground">Ready to Send</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats?.inProduction || 0}</p>
              <p className="text-xs text-muted-foreground">In Production</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{stats?.comingSoon || 0}</p>
              <p className="text-xs text-muted-foreground">Coming Soon</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats?.shippedThisWeek || 0}</p>
              <p className="text-xs text-muted-foreground">Shipped This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={cn("text-3xl font-bold", (stats?.overdueOrders || 0) > 0 && "text-red-600")}>
                {stats?.overdueOrders || 0}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={cn("text-3xl font-bold", (stats?.atRiskOrders || 0) > 0 && "text-yellow-600")}>
                {stats?.atRiskOrders || 0}
              </p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </CardContent>
          </Card>
        </div>

        {/* Ready to Send Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Ready to Send</h2>
              <Badge variant="secondary">{readyToSend.length}</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/v6/manufacturing")}>
              View All Manufacturing
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {loadingReady ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : readyToSend.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">All packages sent!</h3>
                <p className="text-muted-foreground">
                  No orders currently waiting for manufacturing packages.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {readyToSend.map((order) => (
                <ReadyToSendCard
                  key={order.id}
                  order={order}
                  onBuildPackage={() => handleBuildPackage(order)}
                  onViewOrder={() => handleViewOrder(order.id)}
                  onFlagOrder={() => handleFlagOrder(order)}
                />
              ))}
            </div>
          )}
        </div>

        {/* In Production & Coming Soon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* In Production */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  In Production
                  <Badge variant="outline">{inProduction.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {loadingProduction ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <InProductionTable
                    orders={inProduction}
                    onRowClick={handleProductionRowClick}
                  />
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Coming Soon */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Coming Soon
                  <Badge variant="outline">{comingSoon.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {comingSoon.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders in pipeline
                  </div>
                ) : (
                  <div className="space-y-2">
                    {comingSoon.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{order.orderNumber}</span>
                          <span className="text-sm font-medium">
                            ${order.estimatedValue.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {order.customerName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {order.productTypes.slice(0, 2).map((type, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          {order.expectedPaymentDate && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              Est. {format(new Date(order.expectedPaymentDate), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-card p-4">
          <div className="container mx-auto flex items-center justify-center gap-4">
            <Button variant="outline" onClick={() => setShowCommunicationModal(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
            <Button variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={() => navigate("/manufacturer-management/list")}>
              <Building2 className="h-4 w-4 mr-2" />
              Manufacturer Overview
            </Button>
          </div>
        </div>

        {/* Spacer for fixed action bar */}
        <div className="h-20" />
      </div>

      {/* Communication Log Modal */}
      <Dialog open={showCommunicationModal} onOpenChange={setShowCommunicationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Communication Notes</Label>
              <Textarea
                value={communicationNote}
                onChange={(e) => setCommunicationNote(e.target.value)}
                placeholder="Details of manufacturer communication..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommunicationModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: "Communication logged" });
              setShowCommunicationModal(false);
              setCommunicationNote("");
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
