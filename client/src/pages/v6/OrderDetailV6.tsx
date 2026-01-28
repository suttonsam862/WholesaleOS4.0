/**
 * V6 Order Detail Page
 * Complete order view with all sections, line items, and activity
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { canModify } from "@/lib/permissions";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Copy,
  FileText,
  Trash2,
  Printer,
  Download,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Palette,
  Factory,
  Truck,
  Plus,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  PauseCircle,
  Flag,
} from "lucide-react";

// V6 Components
import {
  StatusBadgeV6,
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_GROUPS,
  isValidOrderTransition,
  type OrderStatusV6,
} from "@/components/v6";
import { SizeDisplay, SizeTable, type SizeQuantities } from "@/components/v6";
import { ActivityFeed, ActivityTimeline } from "@/components/v6";
import { FileSection, CompactFileList } from "@/components/v6";
import { ValidationPanel, ValidationBadge } from "@/components/v6";

// Types
interface LineItem {
  id: number;
  orderId: number;
  productId?: number;
  productName: string;
  styleNumber?: string;
  color?: string;
  colorNotes?: string;
  decorationType?: string;
  decorationLocations?: string[];
  unitPrice: number;
  sizes: SizeQuantities;
  totalQuantity: number;
  lineTotal: number;
  specialInstructions?: string;
  imageUrl?: string;
}

interface DesignJob {
  id: number;
  jobCode: string;
  title: string;
  status: string;
  designerName?: string;
}

interface Order {
  id: number;
  orderCode: string;
  orderName: string;
  organizationId: number;
  organizationName?: string;
  organizationLogoUrl?: string;
  contactId?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  salespersonId?: string;
  salespersonName?: string;
  opsOwnerId?: string;
  opsOwnerName?: string;
  status: OrderStatusV6;
  paymentStatus?: string;
  totalAmount?: number;
  depositRequired?: number;
  paidAmount?: number;
  balanceDue?: number;
  requestedDeliveryDate?: string;
  internalDeadline?: string;
  isRush?: boolean;
  isSample?: boolean;
  isReorder?: boolean;
  taxExempt?: boolean;
  customerPo?: string;
  specialInstructions?: string;
  internalNotes?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  lineItems?: LineItem[];
  designJobs?: DesignJob[];
  manufacturingStatus?: string;
  manufacturerName?: string;
  expectedShipDate?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

export default function OrderDetailV6() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/orders/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const orderId = params?.id ? parseInt(params.id, 10) : null;

  // State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatusV6 | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [expandedLineItem, setExpandedLineItem] = useState<number | null>(null);

  // Fetch order
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async (data: { status: OrderStatusV6; note?: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Status updated" });
      setIsStatusModalOpen(false);
      setSelectedStatus(null);
      setStatusNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = () => {
    if (selectedStatus) {
      statusMutation.mutate({
        status: selectedStatus,
        note: statusNote || undefined,
      });
    }
  };

  const getValidTransitions = (currentStatus: OrderStatusV6): OrderStatusV6[] => {
    const allStatuses = Object.keys(ORDER_STATUS_CONFIG) as OrderStatusV6[];
    return allStatuses.filter((status) => isValidOrderTransition(currentStatus, status));
  };

  if (!match || !orderId) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setLocation("/orders")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="mt-8 text-center text-muted-foreground">
          Order not found
        </div>
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const validTransitions = getValidTransitions(order.status);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.orderCode}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.orderCode}</h1>
            {order.isRush && (
              <Badge variant="destructive" className="gap-1">
                <Flag className="w-3 h-3" />
                RUSH
              </Badge>
            )}
            {order.isSample && (
              <Badge variant="secondary">Sample</Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground">
            {order.organizationName} - {order.orderName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canModify(user, "orders") && (
            <Button variant="outline" onClick={() => setLocation(`/orders/${orderId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Order
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Send className="w-4 h-4 mr-2" />
                Send to Manufacturing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PauseCircle className="w-4 h-4 mr-2" />
                Put On Hold
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <StatusBadgeV6 type="order" status={order.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Payment:</span>
                <StatusBadgeV6
                  type="payment"
                  status={order.paymentStatus || "pending"}
                />
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Created: {format(new Date(order.createdAt), "MMM d, yyyy")}</span>
              </div>
              {order.requestedDeliveryDate && (
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span>
                    Delivery: {format(new Date(order.requestedDeliveryDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{order.salespersonName || "Unassigned"}</span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>${order.totalAmount?.toLocaleString() || "0"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Organization</h4>
                  <div className="flex items-center gap-3">
                    {order.organizationLogoUrl ? (
                      <img
                        src={order.organizationLogoUrl}
                        alt={order.organizationName}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{order.organizationName}</p>
                      <a
                        href={`/organizations/${order.organizationId}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View Organization
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Primary Contact</h4>
                  <div className="space-y-1">
                    <p className="font-medium">{order.contactName || "Not specified"}</p>
                    {order.contactEmail && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${order.contactEmail}`} className="hover:underline">
                          {order.contactEmail}
                        </a>
                      </div>
                    )}
                    {order.contactPhone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${order.contactPhone}`} className="hover:underline">
                          {order.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Shipping Address</h4>
                  {order.shippingAddress ? (
                    <div className="text-sm text-muted-foreground">
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                        {order.shippingAddress.zip}
                      </p>
                      {order.shippingAddress.country && (
                        <p>{order.shippingAddress.country}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Billing Address</h4>
                  {order.billingAddress ? (
                    <div className="text-sm text-muted-foreground">
                      <p>{order.billingAddress.street}</p>
                      <p>
                        {order.billingAddress.city}, {order.billingAddress.state}{" "}
                        {order.billingAddress.zip}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Same as shipping</p>
                  )}
                </div>
              </div>

              {/* Order Details */}
              {(order.customerPo || order.specialInstructions) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {order.customerPo && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Customer PO</h4>
                        <p className="text-sm">{order.customerPo}</p>
                      </div>
                    )}
                    {order.specialInstructions && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Special Instructions</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Line Items
              </CardTitle>
              {canModify(user, "orders") && (
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Line Item
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {order.lineItems && order.lineItems.length > 0 ? (
                <div className="space-y-4">
                  {order.lineItems.map((item, index) => (
                    <Collapsible
                      key={item.id}
                      open={expandedLineItem === item.id}
                      onOpenChange={(open) =>
                        setExpandedLineItem(open ? item.id : null)
                      }
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/50">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-muted-foreground w-8">
                                #{index + 1}
                              </span>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.styleNumber && `${item.styleNumber} • `}
                                  {item.color}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <SizeDisplay sizes={item.sizes} maxDisplay={4} />
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  ${item.lineTotal.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {item.totalQuantity} x ${item.unitPrice}
                                </p>
                              </div>
                              {expandedLineItem === item.id ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 pt-0 border-t">
                            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Size breakdown */}
                              <div>
                                <h5 className="text-sm font-medium mb-3">Size Breakdown</h5>
                                <SizeTable sizes={item.sizes} />
                              </div>
                              {/* Other details */}
                              <div className="space-y-4">
                                {item.decorationType && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Decoration</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {item.decorationType}
                                      {item.decorationLocations?.length && (
                                        <>
                                          {" - "}
                                          {item.decorationLocations.join(", ")}
                                        </>
                                      )}
                                    </p>
                                  </div>
                                )}
                                {item.colorNotes && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">Color Notes</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {item.colorNotes}
                                    </p>
                                  </div>
                                )}
                                {item.specialInstructions && (
                                  <div>
                                    <h5 className="text-sm font-medium mb-1">
                                      Special Instructions
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                      {item.specialInstructions}
                                    </p>
                                  </div>
                                )}
                                {canModify(user, "orders") && (
                                  <div className="flex gap-2 pt-2">
                                    <Button size="sm" variant="outline">
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No line items yet</p>
                  {canModify(user, "orders") && (
                    <Button size="sm" variant="outline" className="mt-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Line Item
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Design Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Design Status
              </CardTitle>
              {canModify(user, "orders") && (
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Design Job
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {order.designJobs && order.designJobs.length > 0 ? (
                <div className="space-y-3">
                  {order.designJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                      onClick={() => setLocation(`/design-jobs/${job.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{job.jobCode}</p>
                          <p className="text-sm text-muted-foreground">{job.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadgeV6 type="design" status={job.status} size="sm" />
                        {job.designerName && (
                          <span className="text-sm text-muted-foreground">
                            {job.designerName}
                          </span>
                        )}
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No design jobs linked to this order</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manufacturing Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Manufacturing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.manufacturingStatus ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadgeV6
                      type="manufacturing"
                      status={order.manufacturingStatus}
                    />
                  </div>
                  {order.manufacturerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Manufacturer</span>
                      <span className="font-medium">{order.manufacturerName}</span>
                    </div>
                  )}
                  {order.expectedShipDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expected Ship</span>
                      <span>{format(new Date(order.expectedShipDate), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tracking</span>
                      <a href="#" className="text-primary hover:underline">
                        {order.trackingNumber}
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      View Manufacturing Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Update Status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Factory className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Not yet in manufacturing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Order Total</span>
                <span className="font-medium">${order.totalAmount?.toLocaleString() || "0"}</span>
              </div>
              {order.depositRequired && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deposit Required (50%)</span>
                  <span>${order.depositRequired.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Paid</span>
                <span className="text-green-600 font-medium">
                  ${order.paidAmount?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Balance Due</span>
                <span className="font-bold">
                  ${order.balanceDue?.toLocaleString() || order.totalAmount?.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline">
                  View Invoices
                </Button>
                <Button size="sm" variant="outline">
                  Record Payment
                </Button>
                <Button size="sm" variant="outline">
                  Send Reminder
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileSection
                entityType="order"
                entityId={orderId.toString()}
                organizationId={order.organizationId}
                showFolders={["size_sheets", "customer_assets", "tech_packs", "approvals", "invoices", "other"]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline status={order.status} />
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Validation
              </CardTitle>
              <ValidationBadge entityType="order" entityId={orderId.toString()} />
            </CardHeader>
            <CardContent>
              <ValidationPanel
                entityType="order"
                entityId={orderId.toString()}
                compact
              />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setIsStatusModalOpen(true)}
              >
                Update Status
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Send to Manufacturing
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Create Invoice
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Add Note
              </Button>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                entityType="order"
                entityId={orderId.toString()}
                limit={10}
                compact
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Change Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Status</span>
              <StatusBadgeV6 type="order" status={order.status} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={selectedStatus || ""}
                onValueChange={(v) => setSelectedStatus(v as OrderStatusV6)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {validTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <StatusBadgeV6 type="order" status={status} size="sm" />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || statusMutation.isPending}
            >
              {statusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Status Timeline Component
interface OrderStatusTimelineProps {
  status: OrderStatusV6;
}

function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  const milestones = [
    { status: "draft", label: "Created" },
    { status: "quote", label: "Quote Sent" },
    { status: "customer_approved", label: "Customer Approved" },
    { status: "deposit_received", label: "Payment Received" },
    { status: "in_production", label: "In Production" },
    { status: "shipped", label: "Shipped" },
    { status: "delivered", label: "Delivered" },
  ];

  // Find current milestone index
  const allStatuses = Object.keys(ORDER_STATUS_CONFIG) as OrderStatusV6[];
  const currentIndex = allStatuses.indexOf(status);

  const getMilestoneStatus = (milestoneStatus: string): "completed" | "current" | "pending" => {
    const milestoneIndex = allStatuses.indexOf(milestoneStatus as OrderStatusV6);
    if (milestoneIndex < currentIndex) return "completed";
    if (milestoneIndex === currentIndex || milestoneStatus === status) return "current";
    return "pending";
  };

  return (
    <div className="space-y-3">
      {milestones.map((milestone, index) => {
        const milestoneStatus = getMilestoneStatus(milestone.status);
        const isLast = index === milestones.length - 1;

        return (
          <div key={milestone.status} className="flex items-start gap-3">
            {/* Icon */}
            <div className="relative">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  milestoneStatus === "completed" && "bg-green-500",
                  milestoneStatus === "current" && "bg-primary ring-4 ring-primary/20",
                  milestoneStatus === "pending" && "bg-muted border-2 border-muted-foreground/30"
                )}
              >
                {milestoneStatus === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : milestoneStatus === "current" ? (
                  <Clock className="w-3 h-3 text-primary-foreground" />
                ) : null}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-1/2 top-6 bottom-0 w-px -translate-x-1/2 h-6",
                    milestoneStatus === "completed" ? "bg-green-500" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
            {/* Label */}
            <div className="pt-0.5">
              <p
                className={cn(
                  "text-sm",
                  milestoneStatus === "current" && "font-medium",
                  milestoneStatus === "pending" && "text-muted-foreground"
                )}
              >
                {milestone.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
