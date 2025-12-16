import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Calculator, Package, TruckIcon, AlertCircle, CheckCircle, DollarSign, Edit2, Save, X, UserCheck, Mail, Printer, Copy, Truck, Factory, Users, MessageSquare, Settings, AlertTriangle, Image as ImageIcon, Upload, Expand, Palette, Eye, FileText, FolderOpen, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { isAdmin, isOps, canModify } from "@/lib/permissions";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { useLocation } from "wouter";
import type { UploadResult } from "@uppy/core";
import { ClientLinkPanel } from "@/components/shared/ClientLinkPanel";
import { IssueRequestTrigger } from "@/components/shared/IssueRequestModal";
import { PantoneSummarySection, PantoneDisplayItem } from "@/components/shared/PantoneSummarySection";

interface OrderLineItem {
  id: number;
  orderId: number;
  variantId: number;
  itemName?: string;
  colorNotes?: string;
  imageUrl?: string;
  yxs: number;
  ys: number;
  ym: number;
  yl: number;
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  unitPrice: string;
  qtyTotal: number;
  lineTotal: string;
  notes?: string;
}

interface ProductVariant {
  id: number;
  productId: number;
  variantCode: string;
  color?: string;
  size?: string;
  material?: string;
  msrp?: string;
  cost?: string;
  imageUrl?: string;
  defaultManufacturerId?: number;
  backupManufacturerId?: number;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  description?: string;
  basePrice: string;
  active: boolean;
}

interface OrderDetailModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
}

const SIZE_COLUMNS = [
  { key: "yxs", label: "YXS" },
  { key: "ys", label: "YS" },
  { key: "ym", label: "YM" },
  { key: "yl", label: "YL" },
  { key: "xs", label: "XS" },
  { key: "s", label: "S" },
  { key: "m", label: "M" },
  { key: "l", label: "L" },
  { key: "xl", label: "XL" },
  { key: "xxl", label: "2XL" },
  { key: "xxxl", label: "3XL" },
  { key: "xxxxl", label: "4XL" },
];

const STATUS_WORKFLOW = [
  { value: "new", label: "New", icon: AlertCircle },
  { value: "waiting_sizes", label: "Waiting Sizes", icon: Package },
  { value: "invoiced", label: "Invoiced", icon: DollarSign },
  { value: "production", label: "In Production", icon: Package },
  { value: "shipped", label: "Shipped", icon: TruckIcon },
  { value: "completed", label: "Completed", icon: CheckCircle },
];

export function OrderDetailModal({ orderId, isOpen, onClose }: OrderDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState<number | null>(null);
  const [editingLineItemData, setEditingLineItemData] = useState<Partial<OrderLineItem> | null>(null);
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [lineItemImages, setLineItemImages] = useState<Record<number, string>>({});
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [newTrackingNumber, setNewTrackingNumber] = useState("");
  const [newCarrierCompany, setNewCarrierCompany] = useState("");
  const [isAddingTracking, setIsAddingTracking] = useState(false);

  // Form state for editing order fields
  const [formData, setFormData] = useState<any>({});

  const { user } = useAuth();
  const { hasPermission } = usePermissions();


  // New line item form state
  const [newLineItem, setNewLineItem] = useState<Partial<OrderLineItem>>({
    yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0,
  });

  // Fetch order with line items
  const { data: order, isLoading: orderLoading } = useQuery<any>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: isOpen && !!orderId,
  });

  // Check if manufacturing updates exist for this order
  const { data: manufacturingUpdates = [] } = useQuery<any[]>({
    queryKey: [`/api/manufacturing-updates`, orderId],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing-updates?orderId=${orderId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen && !!orderId,
  });

  const hasManufacturingUpdates = manufacturingUpdates.length > 0;
  const canEditLineItems = true;

  // Initialize form data and line item images when order loads
  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        orderName: order.orderName || '',
        status: order.status || 'new',
        priority: order.priority || 'normal',
        trackingNumber: order.trackingNumber || '',
        estDelivery: order.estDelivery || '',
        salespersonId: order.salespersonId || '',
        designApproved: order.designApproved || false,
        sizesValidated: order.sizesValidated || false,
        depositReceived: order.depositReceived || false,
        invoiceUrl: order.invoiceUrl || '',
        orderFolder: order.orderFolder || '',
        orgId: order.orgId || null,
        contactName: order.contactName || '',
        contactEmail: order.contactEmail || '',
        contactPhone: order.contactPhone || '',
        shippingAddress: order.shippingAddress || '',
        billToAddress: order.billToAddress || '',
      });

      // Initialize line item images from database
      if (order.lineItems) {
        const images: Record<number, string> = {};
        order.lineItems.forEach((item: OrderLineItem) => {
          if (item.imageUrl) {
            images[item.id] = item.imageUrl;
          }
        });
        setLineItemImages(images);
      }
    }
  }, [order, isOpen]);

  // Fetch products and variants for the dropdown
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isOpen,
  });

  const { data: variants = [], isLoading: isLoadingVariants } = useQuery<ProductVariant[]>({
    queryKey: ["/api/variants"],
    enabled: isOpen,
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    enabled: isOpen,
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: isOpen,
  });

  // Fetch salespeople for reassignment (admin only)
  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/salespeople"],
    enabled: isOpen && isAdmin(user),
  });

  // Fetch order-specific activity
  const { data: orderActivity = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/activity`],
    enabled: isOpen && activeTab === "activity" && !!orderId,
  });

  // Fetch tracking numbers
  const { data: trackingNumbers = [] } = useQuery<any[]>({
    queryKey: [`/api/orders/${orderId}/tracking`],
    enabled: isOpen && !!orderId,
  });

  // Fetch design jobs for this order
  const { data: orderDesignJobs = [], isLoading: designJobsLoading } = useQuery<any[]>({
    queryKey: [`/api/design-jobs/order/${orderId}`],
    enabled: isOpen && !!orderId,
  });

  // Fetch pantone assignments for this order's line items (batched by orderId on server)
  const { data: pantoneAssignments = [] } = useQuery<any[]>({
    queryKey: ['/api/pantone-assignments', { orderId }],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await fetch(`/api/pantone-assignments?orderId=${orderId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen && !!orderId,
  });

  // Update order mutation - now includes ALL editable fields
  const updateOrderMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/orders/${orderId}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/activity`] });
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    },
  });

  // Add line item mutation
  const addLineItemMutation = useMutation({
    mutationFn: (lineItem: any) => {
      return apiRequest(`/api/orders/${orderId}/line-items`, {
        method: "POST",
        body: lineItem,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: "Line item added successfully",
      });
      setShowAddLineItem(false);
      setNewLineItem({
        yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add line item",
        variant: "destructive",
      });
    },
  });

  // Update line item mutation
  const updateLineItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) =>
      apiRequest(`/api/orders/${orderId}/line-items/${itemId}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: "Line item updated successfully",
      });
      setEditingLineItem(null);
      setEditingLineItemData(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update line item",
        variant: "destructive",
      });
    },
  });

  // Delete line item mutation
  const deleteLineItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiRequest(`/api/orders/${orderId}/line-items/${itemId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: "Line item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete line item",
        variant: "destructive",
      });
    },
  });

  // Clone order mutation
  const cloneOrderMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/orders", {
        method: "POST",
        body: {
          ...order,
          orderCode: undefined, // Will be auto-generated
          orderName: `${order.orderName} (Copy)`,
          status: "new",
          createdAt: undefined,
          updatedAt: undefined,
        }
      }),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: `Order cloned as ${newOrder.orderCode}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clone order",
        variant: "destructive",
      });
    },
  });

  // Duplicate order structure mutation (copies everything except quantities)
  const duplicateOrderStructureMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/orders/${orderId}/duplicate-structure`, {
        method: "POST",
      }),
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: `Order structure duplicated as ${newOrder.orderCode} (quantities set to 0)`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate order structure",
        variant: "destructive",
      });
    },
  });

  // Recalculate prices mutation
  const recalculatePricesMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/orders/${orderId}/recalculate-prices`, {
        method: "POST",
      }),
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: result.updatedCount > 0
          ? `Updated prices for ${result.updatedCount} line items`
          : "All prices are already current",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to recalculate prices",
        variant: "destructive",
      });
    },
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (note: string) =>
      apiRequest(`/api/orders/${orderId}/notes`, {
        method: "POST",
        body: { note }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/activity`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: "Note added successfully",
      });
      setNewNote("");
      setIsAddingNote(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
      setIsAddingNote(false);
    },
  });

  // Add tracking number mutation
  const addTrackingMutation = useMutation({
    mutationFn: (data: { trackingNumber: string; carrierCompany: string }) =>
      apiRequest(`/api/orders/${orderId}/tracking`, {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/tracking`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: "Tracking number added successfully",
      });
      setNewTrackingNumber("");
      setNewCarrierCompany("");
      setIsAddingTracking(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add tracking number",
        variant: "destructive",
      });
    },
  });

  // Delete tracking number mutation
  const deleteTrackingMutation = useMutation({
    mutationFn: (trackingId: number) =>
      apiRequest(`/api/tracking/${trackingId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}/tracking`] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      toast({
        title: "Success",
        description: "Tracking number deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tracking number",
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/orders/${orderId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  // Calculate price based on variant MSRP
  const calculatePrice = (variantId: number) => {
    const variant = variants.find(v => v.id === variantId);
    return variant?.msrp || "0";
  };

  // Calculate total quantity for a line item
  const calculateTotalQuantity = (item: Partial<OrderLineItem>) => {
    return (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
           (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
           (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0) + (item.xxxxl || 0);
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    if (!order?.lineItems) return { subtotal: "0", total: "0" };

    let subtotal = 0;

    order.lineItems.forEach((item: OrderLineItem) => {
      const quantity = calculateTotalQuantity(item);
      const lineTotal = parseFloat(item.unitPrice) * quantity;
      subtotal += lineTotal;
    });

    return {
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2),
    };
  };

  const totals = calculateOrderTotals();

  // Check if a variant has manufacturer assignment
  const hasManufacturerAssignment = (variant: ProductVariant | undefined) => {
    if (!variant) return false;
    const hasAssignment = !!(variant.defaultManufacturerId || variant.backupManufacturerId);
    return hasAssignment;
  };

  // Count line items without manufacturer assignments
  const lineItemsWithoutManufacturer = order?.lineItems?.filter((item: OrderLineItem) => {
    const variant = variants.find(v => v.id === item.variantId);
    return !hasManufacturerAssignment(variant);
  }).length || 0;

  const handleAddLineItem = () => {
    if (!newLineItem.variantId) {
      toast({
        title: "Error",
        description: "Please select a product variant",
        variant: "destructive",
      });
      return;
    }

    const unitPrice = calculatePrice(newLineItem.variantId);
    const quantity = calculateTotalQuantity(newLineItem);

    // Prepare line item data with all required fields
    const lineItemData = {
      variantId: newLineItem.variantId,
      itemName: newLineItem.itemName || '',
      colorNotes: newLineItem.colorNotes || '',
      yxs: newLineItem.yxs || 0,
      ys: newLineItem.ys || 0,
      ym: newLineItem.ym || 0,
      yl: newLineItem.yl || 0,
      xs: newLineItem.xs || 0,
      s: newLineItem.s || 0,
      m: newLineItem.m || 0,
      l: newLineItem.l || 0,
      xl: newLineItem.xl || 0,
      xxl: newLineItem.xxl || 0,
      xxxl: newLineItem.xxxl || 0,
      xxxxl: newLineItem.xxxxl || 0,
      unitPrice,
      qtyTotal: quantity,
      lineTotal: (parseFloat(unitPrice) * quantity).toFixed(2),
      notes: newLineItem.notes || '',
    };

    addLineItemMutation.mutate(lineItemData);
  };

  const org = organizations.find(o => o.id === order?.orgId);
  const contact = contacts.find(c => c.orgId === order?.orgId);
  const assignedSalesperson = salespeople.find(s => s.userId === order?.salespersonId);

  // Quick action handlers
  const handleQuickStatusUpdate = (newStatus: string) => {
    updateOrderMutation.mutate({ status: newStatus });
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Handle form save
  const handleSaveForm = () => {
    updateOrderMutation.mutate(formData);
  };

  // Handle note submission
  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note",
        variant: "destructive",
      });
      return;
    }
    setIsAddingNote(true);
    addNoteMutation.mutate(newNote.trim());
  };

  const handleAddTracking = () => {
    if (!newTrackingNumber.trim() || !newCarrierCompany.trim()) {
      toast({
        title: "Error",
        description: "Please enter both tracking number and carrier company",
        variant: "destructive",
      });
      return;
    }
    addTrackingMutation.mutate({
      trackingNumber: newTrackingNumber.trim(),
      carrierCompany: newCarrierCompany.trim()
    });
  };

  const handleDeleteTracking = (trackingId: number) => {
    if (confirm("Delete this tracking number?")) {
      deleteTrackingMutation.mutate(trackingId);
    }
  };

  const handleDeleteOrder = () => {
    if (confirm(`Are you sure you want to delete order ${order?.orderCode}? This action cannot be undone.`)) {
      deleteOrderMutation.mutate();
    }
  };

  const handlePrintOrder = () => {
    const printContent = `
      <html>
        <head>
          <title>Order ${order.orderCode}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order ${order.orderCode}</h1>
            <p>${order.orderName}</p>
            <p>Organization: ${org?.name}</p>
            <p>Status: ${order.status}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Total Qty</th>
                <th>Unit Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.lineItems?.map((item: any) => {
                // Display product name and variant code if available, otherwise fall back to itemName
                const itemDisplay = item.product && item.variant
                  ? `${item.product.name} (${item.variant.code})`
                  : item.itemName || 'Item';
                return `
                  <tr>
                    <td>${itemDisplay}</td>
                    <td>${calculateTotalQuantity(item)}</td>
                    <td>$${item.unitPrice}</td>
                    <td>$${(parseFloat(item.unitPrice) * calculateTotalQuantity(item)).toFixed(2)}</td>
                  </tr>
                `;
              }).join('') || ''}
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: right;">
            <strong>Total: $${totals.total}</strong>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendEmail = () => {
    const subject = `Order ${order.orderCode} - ${order.orderName}`;
    const body = `Order Details:\n\nOrder Code: ${order.orderCode}\nOrder Name: ${order.orderName}\nOrganization: ${org?.name}\nStatus: ${order.status}\nTotal: $${totals.total}`;

    const mailtoUrl = `mailto:${contact?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  if (orderLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="order-details-description">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Order {order.orderCode}
          </DialogTitle>
          <div id="order-details-description" className="sr-only">
            View and edit order details, line items, and order status
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={order.status}>
                {order.status.replace('_', ' ')}
              </StatusBadge>
              <Badge variant={order.priority === "high" ? "destructive" : order.priority === "low" ? "secondary" : "default"}>
                {order.priority} priority
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintOrder}
                  data-testid="button-print-order"
                  title="Print Order"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendEmail}
                  data-testid="button-email-order"
                  title="Email Order"
                  disabled={!contact?.email}
                >
                  <Mail className="h-4 w-4" />
                </Button>
                {(isAdmin(user) || isOps(user)) && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cloneOrderMutation.mutate()}
                      data-testid="button-clone-order"
                      title="Clone Order"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateOrderStructureMutation.mutate()}
                      data-testid="button-duplicate-structure"
                      title="Duplicate Order Structure (Zero Quantities)"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Structure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => recalculatePricesMutation.mutate()}
                      data-testid="button-recalculate-prices"
                      title="Recalculate prices based on current price breaks"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Status Quick Actions */}
              {canModify(user, 'orders') && !isEditing && (
                <div className="flex items-center gap-1 mr-2">
                  {order.status === "new" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStatusUpdate("waiting_sizes")}
                      data-testid="button-quick-waiting-sizes"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Waiting Sizes
                    </Button>
                  )}
                  {order.status === "waiting_sizes" && order.invoiceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStatusUpdate("invoiced")}
                      data-testid="button-quick-invoiced"
                      title="Mark order as invoiced (invoice must exist)"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Mark Invoiced
                    </Button>
                  )}
                  {order.status === "waiting_sizes" && !order.invoiceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      data-testid="button-quick-invoiced-disabled"
                      title="Create an invoice first before marking as invoiced"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Invoice Required
                    </Button>
                  )}
                  {order.status === "invoiced" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStatusUpdate("production")}
                      data-testid="button-quick-production"
                      title="Move order to production (creates manufacturing tracking)"
                    >
                      <Factory className="h-4 w-4 mr-1" />
                      Start Production
                    </Button>
                  )}
                  {order.status === "production" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickStatusUpdate("shipped")}
                      data-testid="button-quick-shipped"
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      Ship
                    </Button>
                  )}
                </div>
              )}

              {/* Finance & Manufacturing Actions */}
              {canModify(user, 'orders') && !isEditing && (
                <div className="flex items-center gap-1 mr-2">
                  {/* Invoice Creation - only show if order is waiting_sizes or new and not yet invoiced */}
                  {(order.status === "waiting_sizes" || order.status === "new") && !order.invoiceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to finance page to create invoice
                        window.location.href = `/finance?createInvoice=${orderId}`;
                      }}
                      data-testid="button-create-invoice"
                      title="Create invoice for this order"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Create Invoice
                    </Button>
                  )}

                  {/* Manufacturing Update - only show if order is invoiced or in production */}
                  {(order.status === "invoiced" || order.status === "production") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to manufacturing page to create update
                        window.location.href = `/manufacturing?createUpdate=${orderId}`;
                      }}
                      data-testid="button-add-manufacturing-update"
                      title="Add manufacturing update for this order"
                    >
                      <Factory className="h-4 w-4 mr-1" />
                      Manufacturing Update
                    </Button>
                  )}
                  
                  {/* Issue & Change Request buttons - for Sales role only */}
                  {user?.role === "sales" && (
                    <IssueRequestTrigger
                      entityType="order"
                      entityId={orderId}
                      entityCode={order.orderCode || order.orderNumber}
                    />
                  )}
                </div>
              )}

              {/* Edit Controls */}
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-order"
                  disabled={!canModify(user, 'orders')}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveForm}
                    disabled={updateOrderMutation.isPending}
                    data-testid="button-save-order"
                  >
                    {updateOrderMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel-edit"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Order Details</TabsTrigger>
            <TabsTrigger value="line-items" data-testid="tab-line-items">Line Items & Sizes</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity & Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="details" className="space-y-4">
              {/* Prominent Tracking Display for Salespeople */}
              {trackingNumbers.length > 0 && (
                <Card className="border-2 border-indigo-500/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shadow-lg" data-testid="prominent-tracking-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Truck className="h-5 w-5 text-indigo-500" />
                      Shipment Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trackingNumbers.map((tracking: any) => {
                        const carrierLower = (tracking.carrierCompany || '').toLowerCase();
                        const isUPS = carrierLower.includes('ups');
                        const isFedEx = carrierLower.includes('fedex');
                        const isUSPS = carrierLower.includes('usps');
                        
                        let trackingUrl = '';
                        if (isUPS) {
                          trackingUrl = `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking.trackingNumber)}`;
                        } else if (isFedEx) {
                          trackingUrl = `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking.trackingNumber)}`;
                        } else if (isUSPS) {
                          trackingUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(tracking.trackingNumber)}`;
                        }

                        return (
                          <div 
                            key={tracking.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-indigo-200 dark:border-indigo-800 gap-3"
                            data-testid={`prominent-tracking-${tracking.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <p className="font-bold text-lg tracking-wide" data-testid={`prominent-tracking-number-${tracking.id}`}>
                                  {tracking.trackingNumber}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <TruckIcon className="h-3 w-3" />
                                  {tracking.carrierCompany}
                                </p>
                              </div>
                            </div>
                            {trackingUrl && (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-md"
                                data-testid={`track-package-link-${tracking.id}`}
                              >
                                <TruckIcon className="h-4 w-4" />
                                Track on {isUPS ? 'UPS' : isFedEx ? 'FedEx' : 'USPS'}
                              </a>
                            )}
                            {!trackingUrl && (
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Visit {tracking.carrierCompany} to track
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(tracking.trackingNumber);
                                    toast({
                                      title: "Copied!",
                                      description: "Tracking number copied to clipboard",
                                    });
                                  }}
                                  data-testid={`copy-tracking-${tracking.id}`}
                                >
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy Number
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <ClientLinkPanel
                entityType="order"
                entityId={orderId}
                entityCode={order.orderCode || order.orderNumber}
                contactEmail={order.contactEmail || contact?.email}
                contactPhone={order.contactPhone || contact?.phone}
                contactName={order.contactName || contact?.name}
                onPreview={() => {
                  window.open(`/customer-portal/${orderId}`, '_blank');
                }}
              />

              {/* Pantone Colors Summary */}
              <PantoneSummarySection
                pantones={pantoneAssignments.map((p: any) => ({
                  id: p.id,
                  pantoneCode: p.pantoneCode,
                  pantoneName: p.pantoneName,
                  hexValue: p.hexValue,
                  usageLocation: p.usageLocation,
                  matchQuality: p.matchQuality,
                  lineItemId: p.lineItemId,
                } as PantoneDisplayItem))}
                canEdit={false}
                isEditing={false}
                variant="compact"
                showQuickAction={order?.manufacturingRecords?.length > 0}
                quickActionLabel="View in Manufacturing"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Organization</span>
                      {isEditing ? (
                        <Select
                          value={formData.orgId?.toString() || ''}
                          onValueChange={(value) => handleFormChange('orgId', value ? parseInt(value) : null)}
                        >
                          <SelectTrigger className="w-48" data-testid="select-organization">
                            <SelectValue placeholder="Select organization" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No Organization</SelectItem>
                            {organizations.map((o: any) => (
                              <SelectItem key={o.id} value={o.id.toString()}>
                                {o.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium" data-testid="text-organization">{org?.name || (order.orgId ? `Org #${order.orgId}` : 'No organization')}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Contact Name</span>
                      {isEditing ? (
                        <Input
                          value={formData.contactName || ''}
                          onChange={(e) => handleFormChange('contactName', e.target.value)}
                          className="w-48 h-8"
                          placeholder="Contact name"
                          data-testid="input-contact-name"
                        />
                      ) : (
                        <span className="font-medium" data-testid="text-contact">{order.contactName || contact?.name || "No contact"}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Email</span>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.contactEmail || ''}
                          onChange={(e) => handleFormChange('contactEmail', e.target.value)}
                          className="w-48 h-8"
                          placeholder="Email address"
                          data-testid="input-contact-email"
                        />
                      ) : (
                        <span className="font-medium text-blue-600" data-testid="text-email">
                          {order.contactEmail || contact?.email || "—"}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Phone</span>
                      {isEditing ? (
                        <Input
                          type="tel"
                          value={formData.contactPhone || ''}
                          onChange={(e) => handleFormChange('contactPhone', e.target.value)}
                          className="w-48 h-8"
                          placeholder="Phone number"
                          data-testid="input-contact-phone"
                        />
                      ) : (
                        <span className="font-medium" data-testid="text-phone">
                          {order.contactPhone || contact?.phone || "—"}
                        </span>
                      )}
                    </div>
                    {isAdmin(user) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Salesperson</span>
                        {isEditing ? (
                          <Select
                            value={formData.salespersonId || ''}
                            onValueChange={(value) => handleFormChange('salespersonId', value || null)}
                          >
                            <SelectTrigger className="w-48" data-testid="select-salesperson">
                              <SelectValue placeholder="Assign salesperson" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {salespeople.map((sp: any) => (
                                <SelectItem key={sp.userId} value={sp.userId}>
                                  {sp.name || sp.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="font-medium" data-testid="text-salesperson">
                            {assignedSalesperson?.name || assignedSalesperson?.email || order.salespersonName || "Unassigned"}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Order Name</span>
                      {isEditing ? (
                        <Input
                          value={formData.orderName || ''}
                          onChange={(e) => handleFormChange('orderName', e.target.value)}
                          className="w-48 h-8"
                          data-testid="input-order-name"
                        />
                      ) : (
                        <span className="font-medium" data-testid="text-order-name">{order.orderName}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="font-medium">{format(new Date(order.createdAt), "PP")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Updated</span>
                      <span className="font-medium">{format(new Date(order.updatedAt), "PP")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Status & Workflow</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      {isEditing ? (
                        <Select
                          value={formData.status || order.status}
                          onValueChange={(value) => handleFormChange('status', value)}
                        >
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_WORKFLOW.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2" data-testid="text-status">
                          {STATUS_WORKFLOW.find(s => s.value === order.status)?.icon && (
                            <>{(() => {
                              const Icon = STATUS_WORKFLOW.find(s => s.value === order.status)?.icon;
                              return Icon ? <Icon className="h-4 w-4" /> : null;
                            })()}</>
                          )}
                          <span>{order.status.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      {isEditing ? (
                        <Select
                          value={formData.priority || order.priority}
                          onValueChange={(value) => handleFormChange('priority', value)}
                        >
                          <SelectTrigger className="w-32" data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={order.priority === "high" ? "destructive" : order.priority === "low" ? "secondary" : "default"} data-testid="badge-priority">
                          {order.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Est. Delivery</span>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.estDelivery || ''}
                          onChange={(e) => handleFormChange('estDelivery', e.target.value)}
                          className="w-40 h-8"
                          data-testid="input-delivery-date"
                        />
                      ) : (
                        <span className="font-medium" data-testid="text-delivery-date">
                          {order.estDelivery ? format(new Date(order.estDelivery), "PP") : "TBD"}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Tracking Numbers</span>
                          {canModify(user, 'orders') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsAddingTracking(!isAddingTracking)}
                              data-testid="button-add-tracking"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Tracking
                            </Button>
                          )}
                        </div>

                        {/* Add tracking form */}
                        {isAddingTracking && (
                          <Card className="p-3 bg-muted/30">
                            <div className="space-y-2">
                              <div>
                                <Label htmlFor="tracking-number" className="text-xs">Tracking Number</Label>
                                <Input
                                  id="tracking-number"
                                  value={newTrackingNumber}
                                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                                  placeholder="Enter tracking number"
                                  className="h-8"
                                  data-testid="input-new-tracking-number"
                                />
                              </div>
                              <div>
                                <Label htmlFor="carrier-company" className="text-xs">Carrier Company</Label>
                                <Input
                                  id="carrier-company"
                                  value={newCarrierCompany}
                                  onChange={(e) => setNewCarrierCompany(e.target.value)}
                                  placeholder="e.g., UPS, FedEx, USPS"
                                  className="h-8"
                                  data-testid="input-carrier-company"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleAddTracking}
                                  disabled={addTrackingMutation.isPending}
                                  data-testid="button-save-tracking"
                                  className="flex-1"
                                >
                                  {addTrackingMutation.isPending ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                  ) : (
                                    <Save className="h-3 w-3 mr-1" />
                                  )}
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setIsAddingTracking(false);
                                    setNewTrackingNumber("");
                                    setNewCarrierCompany("");
                                  }}
                                  data-testid="button-cancel-tracking"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* List tracking numbers */}
                        {trackingNumbers.length > 0 ? (
                          <div className="space-y-2">
                            {trackingNumbers.map((tracking: any) => (
                              <div
                                key={tracking.id}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded-md border"
                                data-testid={`tracking-item-${tracking.id}`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <TruckIcon className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium" data-testid={`tracking-number-${tracking.id}`}>
                                        {tracking.trackingNumber}
                                      </p>
                                      <p className="text-xs text-muted-foreground" data-testid={`carrier-${tracking.id}`}>
                                        {tracking.carrierCompany}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                {canModify(user, 'orders') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteTracking(tracking.id)}
                                    disabled={deleteTrackingMutation.isPending}
                                    data-testid={`button-delete-tracking-${tracking.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic" data-testid="text-no-tracking">
                            No tracking numbers added
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Workflow Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Design & Validation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Design Approved</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.designApproved}
                            onChange={(e) => handleFormChange('designApproved', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                            data-testid="checkbox-design-approved"
                          />
                          <span className="text-sm">{formData.designApproved ? "Yes" : "No"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {order.designApproved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="font-medium" data-testid="text-design-approved">
                            {order.designApproved ? "Yes" : "Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sizes Validated</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.sizesValidated}
                            onChange={(e) => handleFormChange('sizesValidated', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                            data-testid="checkbox-sizes-validated"
                          />
                          <span className="text-sm">{formData.sizesValidated ? "Yes" : "No"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {order.sizesValidated ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="font-medium" data-testid="text-sizes-validated">
                            {order.sizesValidated ? "Yes" : "Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Deposit Received</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.depositReceived}
                            onChange={(e) => handleFormChange('depositReceived', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300"
                            data-testid="checkbox-deposit-received"
                          />
                          <span className="text-sm">{formData.depositReceived ? "Yes" : "No"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {order.depositReceived ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                          )}
                          <span className="font-medium" data-testid="text-deposit-received">
                            {order.depositReceived ? "Yes" : "Pending"}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Shipping Address</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.shippingAddress || ''}
                          onChange={(e) => handleFormChange('shippingAddress', e.target.value)}
                          placeholder="Enter shipping address..."
                          className="min-h-[80px]"
                          data-testid="textarea-shipping-address"
                        />
                      ) : (
                        <div className="text-sm whitespace-pre-line bg-muted/30 rounded-md p-2" data-testid="text-shipping-address">
                          {order.shippingAddress || "No shipping address set"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Billing Address</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.billToAddress || ''}
                          onChange={(e) => handleFormChange('billToAddress', e.target.value)}
                          placeholder="Enter billing address..."
                          className="min-h-[80px]"
                          data-testid="textarea-billing-address"
                        />
                      ) : (
                        <div className="text-sm whitespace-pre-line bg-muted/30 rounded-md p-2" data-testid="text-billing-address">
                          {order.billToAddress || "No billing address set"}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents & Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Available Links */}
                    <div className="flex flex-wrap gap-2">
                      {order.invoiceUrl && (
                        <a
                          href={order.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          data-testid="link-invoice"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">Invoice</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {order.sizeFormLink && (
                        <a
                          href={order.sizeFormLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          data-testid="link-size-form"
                        >
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">Size Form</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {order.orderFolder && (
                        <a
                          href={order.orderFolder}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                          data-testid="link-order-folder"
                        >
                          <FolderOpen className="h-4 w-4" />
                          <span className="text-sm font-medium">Order Folder</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    
                    {/* Show message if no links available */}
                    {!order.invoiceUrl && !order.sizeFormLink && !order.orderFolder && (
                      <p className="text-sm text-muted-foreground italic py-2">
                        No documents or links attached to this order yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Admin Controls */}
              {isAdmin(user) && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Admin Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reassign Salesperson</Label>
                      <Select
                        value={order.salespersonId || "unassigned"}
                        onValueChange={(value) => {
                          updateOrderMutation.mutate({ salespersonId: value === "unassigned" ? null : value });
                        }}
                      >
                        <SelectTrigger data-testid="select-reassign-salesperson">
                          <SelectValue placeholder="Select salesperson" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {salespeople.map((sp) => (
                            <SelectItem key={sp.id} value={sp.userId}>
                              {sp.userName || sp.userEmail || `User ${sp.userId}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Design Jobs Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Design Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {designJobsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading design jobs...</div>
                  ) : orderDesignJobs.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic" data-testid="text-no-design-jobs">
                      No design jobs associated with this order
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="design-jobs-list">
                      {orderDesignJobs.map((job: any) => {
                        const statusColors: Record<string, string> = {
                          pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                          assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                          in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                          review: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                          approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                          rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                          completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
                        };

                        const handleNavigateToJob = () => {
                          onClose();
                          setLocation(`/design-jobs/${job.id}`);
                        };

                        return (
                          <div
                            key={job.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={handleNavigateToJob}
                            data-testid={`design-job-${job.id}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{job.jobCode}</span>
                                <Badge className={`text-xs ${statusColors[job.status] || statusColors.pending}`}>
                                  {job.status.replace('_', ' ')}
                                </Badge>
                                {job.urgency === 'rush' && (
                                  <Badge variant="destructive" className="text-xs">Rush</Badge>
                                )}
                                {job.urgency === 'high' && (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">High Priority</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {job.designer?.name ? (
                                  <span>Assigned to: <span className="font-medium">{job.designer.name}</span></span>
                                ) : (
                                  <span className="italic">Unassigned</span>
                                )}
                                {job.deadline && (
                                  <span className="ml-3">Due: {format(new Date(job.deadline), "PP")}</span>
                                )}
                              </div>
                              {job.brief && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{job.brief}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavigateToJob();
                                }}
                                data-testid={`button-view-design-job-${job.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Order Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="font-medium" data-testid="text-subtotal">${totals.subtotal}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className="text-xl font-bold" data-testid="text-total">${totals.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="line-items" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Line Items</h3>
                <Button
                  size="sm"
                  onClick={() => setShowAddLineItem(true)}
                  data-testid="button-add-line-item"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line Item
                </Button>
              </div>

              {!isLoadingVariants && lineItemsWithoutManufacturer > 0 && (
                <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-medium" data-testid="text-manufacturer-warning-count">
                        {lineItemsWithoutManufacturer} {lineItemsWithoutManufacturer === 1 ? 'item needs' : 'items need'} manufacturer assignment{lineItemsWithoutManufacturer === 1 ? '' : 's'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showAddLineItem && (
                <Card className="mb-4 border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Add New Line Item</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Product Variant</Label>
                      <Select
                        onValueChange={(value) => setNewLineItem({ ...newLineItem, variantId: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {variants.map((variant) => {
                            const product = products.find(p => p.id === variant.productId);
                            return (
                              <SelectItem key={variant.id} value={variant.id.toString()}>
                                {product?.name || 'Unknown Product'} - {variant.variantCode} ({variant.color})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Size Quantities</Label>
                      <div className="grid grid-cols-12 gap-1 mt-2">
                        {SIZE_COLUMNS.map((size) => (
                          <div key={size.key} className="min-w-0">
                            <Label className="text-xs block text-center truncate">{size.label}</Label>
                            <Input
                              type="number"
                              min="0"
                              value={(newLineItem as any)[size.key] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewLineItem({
                                  ...newLineItem,
                                  [size.key]: val === '' ? 0 : parseInt(val) || 0,
                                });
                              }}
                              className="h-8 text-sm text-center px-1 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              data-testid={`input-size-${size.key}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Qty: </span>
                        <span className="font-medium">{calculateTotalQuantity(newLineItem)}</span>
                        {newLineItem.variantId && (
                          <>
                            <span className="text-muted-foreground ml-4">Unit Price: </span>
                            <span className="font-medium">
                              ${calculatePrice(newLineItem.variantId)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddLineItem(false);
                            setNewLineItem({
                              yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0,
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddLineItem}
                          disabled={addLineItemMutation.isPending}
                        >
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.lineItems && order.lineItems.length > 0 ? (
                <div className="space-y-4">
                  {order.lineItems.map((item: OrderLineItem) => {
                    const variant = variants.find(v => v.id === item.variantId);
                    const product = variant ? products.find(p => p.id === variant.productId) : null;
                    const isItemEditing = editingLineItem === item.id;
                    const displayItem = isItemEditing && editingLineItemData ? editingLineItemData : item;
                    const currentPrice = calculatePrice(item.variantId);

                    return (
                      <Card key={item.id} className={isItemEditing ? "border-primary" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {displayItem.imageUrl ? (
                                <div className="relative group">
                                  <img
                                    src={displayItem.imageUrl}
                                    alt={product?.name}
                                    className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (displayItem.imageUrl) setFullScreenImage(displayItem.imageUrl);
                                    }}
                                    data-testid={`img-line-item-${item.id}`}
                                    onError={(e) => {
                                      console.error('Failed to load line item image:', displayItem.imageUrl);
                                      // Don't hide on error, let it show broken image or retry
                                    }}
                                  />
                                  <button
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (displayItem.imageUrl) setFullScreenImage(displayItem.imageUrl);
                                    }}
                                    data-testid={`button-expand-image-${item.id}`}
                                  >
                                    <Expand className="w-6 h-6 text-white" />
                                  </button>
                                </div>
                              ) : variant?.imageUrl ? (
                                <div className="relative group">
                                  <img
                                    src={variant.imageUrl}
                                    alt={product?.name}
                                    className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (variant.imageUrl) setFullScreenImage(variant.imageUrl);
                                    }}
                                    data-testid={`img-line-item-${item.id}`}
                                  />
                                  <button
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (variant.imageUrl) setFullScreenImage(variant.imageUrl);
                                    }}
                                    data-testid={`button-expand-image-${item.id}`}
                                  >
                                    <Expand className="w-6 h-6 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex flex-col gap-1 flex-1">
                                {isItemEditing ? (
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Item Name</Label>
                                    <Input
                                      value={editingLineItemData?.itemName || ''}
                                      onChange={(e) => {
                                        if (!editingLineItemData) return;
                                        setEditingLineItemData({
                                          ...editingLineItemData,
                                          itemName: e.target.value,
                                        });
                                      }}
                                      placeholder={`${product?.name || "Unknown Product"} - ${variant?.variantCode} (${variant?.color})`}
                                      className="h-8 text-sm"
                                      data-testid={`input-item-name-${item.id}`}
                                    />
                                  </div>
                                ) : (
                                  <CardTitle className="text-sm font-medium">
                                    {item.itemName || `${product?.name || "Unknown Product"} - ${variant?.variantCode} (${variant?.color})`}
                                  </CardTitle>
                                )}
                                {!isLoadingVariants && !hasManufacturerAssignment(variant) && (
                                  <Badge
                                    variant="outline"
                                    className="w-fit border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"
                                    data-testid={`badge-no-manufacturer-${item.id}`}
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    No Manufacturer Assigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {calculateTotalQuantity(displayItem)} units
                              </Badge>
                              <Badge variant="outline">
                                {isItemEditing && editingLineItemData
                                  ? (parseFloat(currentPrice) * calculateTotalQuantity(editingLineItemData)).toFixed(2)
                                  : item.lineTotal}
                              </Badge>
                              {!isItemEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingLineItem(item.id);
                                      setEditingLineItemData({ ...item });
                                    }}
                                    disabled={!canEditLineItems}
                                    data-testid={`button-edit-line-item-${item.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteLineItemMutation.mutate(item.id)}
                                    disabled={!canEditLineItems}
                                    data-testid={`button-delete-line-item-${item.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      if (!editingLineItemData) return;
                                      const unitPrice = calculatePrice(item.variantId);

                                      // Extract only the fields that should be updated
                                      // Exclude auto-managed and computed fields (qtyTotal and lineTotal are generated columns)
                                      const { 
                                        id, 
                                        orderId, 
                                        createdAt, 
                                        updatedAt,
                                        qtyTotal,  // Computed column - don't send
                                        lineTotal, // Computed column - don't send
                                        product,   // Joined data - don't send
                                        variant,   // Joined data - don't send
                                        ...updateFields 
                                      } = editingLineItemData as any;

                                      updateLineItemMutation.mutate({
                                        itemId: item.id,
                                        data: {
                                          ...updateFields,
                                          unitPrice,
                                        },
                                      });
                                    }}
                                    data-testid={`button-save-line-item-${item.id}`}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingLineItem(null);
                                      setEditingLineItemData(null);
                                    }}
                                    data-testid={`button-cancel-edit-line-item-${item.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-12 gap-1">
                            {SIZE_COLUMNS.map((size) => (
                              <div key={size.key} className="min-w-0">
                                <Label className="text-xs text-muted-foreground block text-center truncate">{size.label}</Label>
                                {isItemEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingLineItemData ? (editingLineItemData as any)[size.key] || 0 : 0}
                                    onChange={(e) => {
                                      if (!editingLineItemData) return;
                                      setEditingLineItemData({
                                        ...editingLineItemData,
                                        [size.key]: parseInt(e.target.value) || 0,
                                      });
                                    }}
                                    className="h-8 text-sm text-center px-1 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    data-testid={`input-edit-size-${size.key}-${item.id}`}
                                  />
                                ) : (
                                  <div className="h-8 px-1 py-1 text-center text-sm font-medium border rounded min-w-[2.5rem]">
                                    {(item as any)[size.key] || 0}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-3 border-t space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm">
                                <span className="text-muted-foreground">Unit Price: </span>
                                <span className="font-medium">${item.unitPrice}</span>
                                {item.notes && (
                                  <span className="ml-4 text-muted-foreground">
                                    Notes: {item.notes}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-medium">
                                Total: ${isItemEditing && editingLineItemData
                                  ? (parseFloat(currentPrice) * calculateTotalQuantity(editingLineItemData)).toFixed(2)
                                  : item.lineTotal}
                              </div>
                            </div>
                            {isItemEditing && (
                              <div className="space-y-2">
                                <Label className="text-xs">Custom Image for This Line Item</Label>
                                <ObjectUploader
                                  allowedFileTypes={['image/*']}
                                  maxFileSize={5242880}
                                  onGetUploadParameters={async (file) => {
                                    try {
                                      const response = await apiRequest("POST", "/api/upload/image", {
                                        filename: file.name,
                                        size: file.size,
                                        mimeType: file.type
                                      }) as any;

                                      // Store the uploadId on the file's meta for later use
                                      (file as any).meta = {
                                        ...(file as any).meta,
                                        uploadId: response.uploadId
                                      };

                                      return {
                                        method: 'PUT' as const,
                                        url: response.uploadURL,
                                        headers: {
                                          'Content-Type': file.type
                                        }
                                      };
                                    } catch (error) {
                                      console.error('Error getting upload parameters:', error);
                                      toast({
                                        title: "Upload failed",
                                        description: "Failed to get upload parameters",
                                        variant: "destructive",
                                      });
                                      throw error;
                                    }
                                  }}
                                  onComplete={(result) => {
                                    const file = result.successful?.[0];
                                    if (file) {
                                      const uploadId = (file as any).meta?.uploadId;

                                      if (!uploadId) {
                                        console.error("Upload ID missing from file meta:", file);
                                        toast({
                                          title: "Upload failed",
                                          description: "Missing upload information",
                                          variant: "destructive",
                                        });
                                        return;
                                      }

                                      // Construct the public URL directly from the uploadId
                                      const imageUrl = `/public-objects/${uploadId}`;

                                      // Update the editing line item data with the new image URL
                                      if (editingLineItemData) {
                                        setEditingLineItemData({
                                          ...editingLineItemData,
                                          imageUrl: imageUrl
                                        });
                                      }

                                      toast({
                                        title: "Success",
                                        description: "Image uploaded successfully",
                                      });
                                    }
                                  }}
                                  buttonClassName="w-full"
                                >
                                  <span className="flex items-center justify-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload Custom Image
                                  </span>
                                </ObjectUploader>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No line items added yet</p>
                      <p className="text-sm mt-2">Add products to this order to get started</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Activity Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground border-l-2 border-blue-200 pl-3">
                        <div className="font-medium text-foreground">Order Created</div>
                        <div>{format(new Date(order.createdAt), "PPP 'at' p")}</div>
                      </div>
                      {order.updatedAt !== order.createdAt && (
                        <div className="text-sm text-muted-foreground border-l-2 border-green-200 pl-3">
                          <div className="font-medium text-foreground">Last Updated</div>
                          <div>{format(new Date(order.updatedAt), "PPP 'at' p")}</div>
                        </div>
                      )}
                      {order.status === "invoiced" && (
                        <div className="text-sm text-muted-foreground border-l-2 border-purple-200 pl-3">
                          <div className="font-medium text-foreground">Invoiced</div>
                          <div>Order has been invoiced and payment is pending</div>
                        </div>
                      )}
                      {order.status === "production" && (
                        <div className="text-sm text-muted-foreground border-l-2 border-orange-200 pl-3">
                          <div className="font-medium text-foreground">In Production</div>
                          <div>Order is currently being manufactured</div>
                        </div>
                      )}
                      {order.status === "shipped" && (
                        <div className="text-sm text-muted-foreground border-l-2 border-blue-200 pl-3">
                          <div className="font-medium text-foreground">Shipped</div>
                          <div>Order has been shipped{order.trackingNumber && ` - Tracking: ${order.trackingNumber}`}</div>
                        </div>
                      )}
                      {order.status === "completed" && (
                        <div className="text-sm text-muted-foreground border-l-2 border-green-200 pl-3">
                          <div className="font-medium text-foreground">Completed</div>
                          <div>Order has been delivered and completed</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Internal Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Add Note Form */}
                      {canModify(user, 'orders') && (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Add an internal note about this order..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="min-h-[80px]"
                            data-testid="textarea-new-note"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={handleAddNote}
                              disabled={!newNote.trim() || isAddingNote || addNoteMutation.isPending}
                              data-testid="button-add-note"
                            >
                              {isAddingNote || addNoteMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1" />
                              )}
                              Add Note
                            </Button>
                            {newNote.trim() && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewNote("")}
                                data-testid="button-clear-note"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Activity Notes from backend */}
                      <div className="space-y-3">
                        {orderActivity && orderActivity.length > 0 ? (
                          orderActivity.map((activity) => {
                            const afterData = activity.afterJson ? JSON.parse(activity.afterJson) : null;
                            const isNote = activity.action === 'note_added' && afterData?.note;

                            return (
                              <div key={activity.id} className="text-sm text-muted-foreground border-l-2 border-gray-200 pl-3">
                                <div className="font-medium text-foreground mb-1">
                                  {isNote ? 'Internal Note' : `${activity.entity.replace('_', ' ')} ${activity.action.replace('_', ' ')}`}
                                </div>
                                <div>
                                  {isNote ? afterData.note : `${activity.entity} was ${activity.action.replace('_', ' ')}`}
                                </div>
                                <div className="text-xs mt-1" data-testid={`activity-${activity.id}-timestamp`}>
                                  {format(new Date(activity.createdAt), "PPP 'at' p")}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            <div className="font-medium text-foreground mb-1">System Note</div>
                            <div>Order automatically created from lead #{order.leadId || 'N/A'}</div>
                            <div className="text-xs mt-1">{format(new Date(order.createdAt), "PPP 'at' p")}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Order Total: <span className="font-bold text-foreground text-lg">${totals.total}</span>
              </div>
              {(isAdmin(user) || isOps(user)) && hasPermission('orders', 'delete') && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteOrder}
                  disabled={deleteOrderMutation.isPending}
                  data-testid="button-delete-order"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <FullScreenImageViewer
        imageUrl={fullScreenImage || ""}
        isOpen={!!fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
    </Dialog>
  );
}