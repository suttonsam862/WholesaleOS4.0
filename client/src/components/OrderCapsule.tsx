/**
 * Order Capsule Component
 *
 * A unified modal for viewing and managing Orders with full editing capabilities,
 * glass design, progress indicator, role-based modules, and actionable items everywhere.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { isAdmin, isOps, canModify } from "@/lib/permissions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useLocation } from "wouter";
import {
  OrderStatus,
  DesignJobStatus,
  ManufacturingStatus,
  VelocityIndicator,
  ORDER_STATUS_CONFIG,
  DESIGN_JOB_STATUS_CONFIG,
  MANUFACTURING_STATUS_CONFIG,
  VELOCITY_CONFIG,
  calculateVelocity,
  calculateProgressBlocks,
  calculateETA,
} from "@/lib/status-system";

import {
  Package,
  Palette,
  Factory,
  MessageSquare,
  Clock,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Truck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Scissors,
  Printer,
  PackageCheck,
  Edit2,
  Save,
  X,
  Copy,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Image as ImageIcon,
  Expand,
  ZoomIn,
  Plus,
  Trash2,
  Link2,
  ExternalLink,
  Send,
  Calculator,
  Settings,
  Upload,
  Paperclip,
  Lock,
  Search,
  Ruler,
  Zap,
  Tag,
  type LucideIcon,
} from "lucide-react";

import type { StageId, UserRole } from "@/lib/ordersStageConfig";
import {
  getDefaultModule,
  getVisibleModules,
  type ModuleId
} from "@/lib/orderDetailConfig";

interface OrderCapsuleProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  /** Stage context from URL - used for stage-aware defaults */
  stage?: StageId;
}

interface ManufacturingNote {
  id: string;
  categoryId: number;
  categoryName: string;
  note: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

interface ManufacturingNoteCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean | null;
  sortOrder: number | null;
}

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
  manufacturingNotes?: ManufacturingNote[];
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
  { value: "new", label: "New", icon: AlertTriangle },
  { value: "waiting_sizes", label: "Waiting Sizes", icon: Package },
  { value: "design_created", label: "Design Created", icon: Palette },
  { value: "sizes_validated", label: "Sizes Confirmed", icon: CheckCircle2 },
  { value: "invoiced", label: "Invoiced", icon: DollarSign },
  { value: "production", label: "In Production", icon: Factory },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelled", icon: AlertCircle },
];

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Scissors: Scissors,
  Ruler: Ruler,
  Zap: Zap,
  AlertTriangle: AlertTriangle,
  MessageSquare: MessageSquare,
  Package: Package,
  Tag: Tag,
  Factory: Factory,
  Settings: Settings,
  FileText: FileText,
};

function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  return (iconName && CATEGORY_ICON_MAP[iconName]) || MessageSquare;
}

function ProgressBar({ blocks }: { blocks: ReturnType<typeof calculateProgressBlocks> }) {
  return (
    <div className="flex items-center gap-1">
      {blocks.map((block, index) => (
        <div key={index} className="flex items-center">
          <motion.div
            className={cn(
              "relative h-8 w-16 rounded-md border flex items-center justify-center text-xs font-medium transition-all duration-300",
              block.filled
                ? block.current
                  ? "bg-gradient-to-r from-neon-blue/30 to-neon-purple/30 border-neon-blue/50 text-white"
                  : "bg-green-500/20 border-green-500/40 text-green-400"
                : "bg-white/5 border-white/10 text-white/40"
            )}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {block.current && (
              <motion.div
                className="absolute inset-0 rounded-md bg-neon-blue/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <span className="relative z-10">{block.label}</span>
          </motion.div>
          {index < blocks.length - 1 && (
            <ChevronRight className={cn(
              "w-4 h-4 mx-0.5",
              block.filled ? "text-green-400/60" : "text-white/20"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

function VelocityIndicatorBadge({ velocity }: { velocity: VelocityIndicator }) {
  const config = VELOCITY_CONFIG[velocity];
  return (
    <motion.div
      className={cn(
        "px-3 py-1.5 rounded-full border text-sm font-medium",
        config.bgClass,
        config.borderClass,
        config.textClass,
        config.glowClass
      )}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
    >
      {config.label}
    </motion.div>
  );
}

function ModuleTab({
  label,
  icon: Icon,
  active,
  onClick,
  badge
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 whitespace-nowrap min-h-[44px]",
        active
          ? "bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50 text-white shadow-lg shadow-neon-blue/10"
          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
      )}
      data-testid={`tab-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="px-1.5 py-0.5 text-xs rounded-full bg-neon-blue/30 text-neon-blue flex-shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  className = ""
}: {
  icon: any;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    default: "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white",
    primary: "bg-neon-blue/10 border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20",
    success: "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20",
    warning: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20",
    danger: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/40 mb-0.5">{label}</div>
        <div className="text-sm text-white truncate">{value || '—'}</div>
      </div>
    </div>
  );
}

function ManufacturingStageIndicator({ status }: { status: ManufacturingStatus | null }) {
  const stages = [
    { key: 'awaiting_admin_confirmation', label: 'Queue', icon: Clock },
    { key: 'confirmed_awaiting_manufacturing', label: 'Confirmed', icon: PackageCheck },
    { key: 'cutting_sewing', label: 'Cut/Sew', icon: Scissors },
    { key: 'printing', label: 'Print', icon: Printer },
    { key: 'final_packing_press', label: 'Pack', icon: Package },
    { key: 'shipped', label: 'Ship', icon: Truck },
    { key: 'complete', label: 'Done', icon: CheckCircle2 },
  ];

  const currentIndex = stages.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isComplete = currentIndex >= index;
        const isCurrent = currentIndex === index;

        return (
          <div key={stage.key} className="flex items-center">
            <motion.div
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px]",
                isComplete ? "opacity-100" : "opacity-40"
              )}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: isComplete ? 1 : 0.4 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isCurrent
                  ? "bg-neon-blue/30 border-neon-blue text-neon-blue shadow-[0_0_15px_rgba(0,186,255,0.4)]"
                  : isComplete
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-white/5 border-white/20 text-white/40"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-medium whitespace-nowrap",
                isCurrent ? "text-neon-blue" : isComplete ? "text-green-400" : "text-white/40"
              )}>
                {stage.label}
              </span>
            </motion.div>
            {index < stages.length - 1 && (
              <div className={cn(
                "w-6 h-0.5 mx-1",
                currentIndex > index ? "bg-green-500/50" : "bg-white/10"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function OrderCapsule({ isOpen, onClose, orderId, stage }: OrderCapsuleProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const userRole = (user?.role || 'sales') as UserRole;

  // Role-aware: admin/ops see advanced sections by default
  const shouldShowAdvancedByDefault = userRole === 'admin' || userRole === 'ops' || userRole === 'finance';

  const [activeModule, setActiveModule] = useState<ModuleId>(() =>
    getDefaultModule(userRole, stage)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [editingLineItem, setEditingLineItem] = useState<number | null>(null);
  const [editingLineItemData, setEditingLineItemData] = useState<Partial<OrderLineItem> | null>(null);
  const [showAddLineItem, setShowAddLineItem] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(shouldShowAdvancedByDefault);

  const [newLineItem, setNewLineItem] = useState<Partial<OrderLineItem>>({
    yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [salespersonPopoverOpen, setSalespersonPopoverOpen] = useState(false);
  const [addNoteOpenFor, setAddNoteOpenFor] = useState<number | null>(null);
  const [newManufacturingNote, setNewManufacturingNote] = useState({ categoryId: "", note: "" });

  // Fetch order data
  const { data: order, isLoading: orderLoading } = useQuery<any>({
    queryKey: ['/api/orders', orderId],
    enabled: isOpen && !!orderId,
  });

  // Fetch organization
  const { data: organization } = useQuery<any>({
    queryKey: ["/api/organizations", order?.orgId],
    enabled: isOpen && !!order?.orgId,
  });

  // Fetch line items
  const { data: lineItems = [], isLoading: lineItemsLoading, error: lineItemsError } = useQuery<any[]>({
    queryKey: ['/api/orders', orderId, 'line-items'],
    enabled: isOpen && !!orderId,
  });

  // Track which orderId we've initialized for (to reset on order change)
  const initializedForOrderId = useRef<number | null>(null);

  // Reset initialization state when orderId changes
  useEffect(() => {
    if (orderId !== initializedForOrderId.current) {
      initializedForOrderId.current = null;
    }
  }, [orderId]);

  // Initialize showAdvanced and activeModule once per order when data loads
  useEffect(() => {
    if (order && isOpen && user?.role && initializedForOrderId.current !== orderId) {
      // Set role-aware defaults for showAdvanced
      const shouldShow = userRole === 'admin' || userRole === 'ops' || userRole === 'finance';
      setShowAdvanced(shouldShow);

      // Compute stage-aware module default with fallback
      const computedModule = getDefaultModule(userRole, stage, order.status);
      const visible = getVisibleModules(userRole);
      const newModule = visible.includes(computedModule)
        ? computedModule
        : visible[0] || "overview";
      setActiveModule(newModule);

      // Mark as initialized for this order
      initializedForOrderId.current = orderId;
    }
  }, [order, isOpen, user?.role, userRole, stage, orderId]);

  // Reset popover states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSalespersonPopoverOpen(false);
    }
  }, [isOpen]);

  // Fetch design jobs
  const { data: designJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/design-jobs"],
    enabled: isOpen && !!orderId,
    select: (data) => data.filter((job: any) => job.orderId === orderId),
  });

  // Fetch manufacturing
  const { data: manufacturingData = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturing"],
    enabled: isOpen && !!orderId,
    select: (data) => data.filter((m: any) => m.orderId === orderId),
  });

  const manufacturing = manufacturingData[0] || null;

  // Fetch products and variants
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: isOpen,
  });

  const { data: variants = [] } = useQuery<any[]>({
    queryKey: ["/api/variants"],
    enabled: isOpen,
  });

  // Fetch activity
  const { data: orderActivity = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', orderId, 'activity'],
    enabled: isOpen && activeModule === "activity" && !!orderId,
  });

  // Fetch tracking numbers
  const { data: trackingNumbers = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', orderId, 'tracking'],
    enabled: isOpen && !!orderId,
  });

  // Fetch contacts
  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/contacts"],
    enabled: isOpen,
  });

  // Fetch users (for designer names)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: isOpen,
  });

  // Fetch manufacturing note categories
  const { data: manufacturingNoteCategories = [] } = useQuery<ManufacturingNoteCategory[]>({
    queryKey: ["/api/manufacturing-note-categories"],
    enabled: isOpen,
  });

  // Fetch form submissions - API returns { ...submission, lineItemSizes: [...] } or null
  // Note: 404 is expected when order has no form submissions yet - silently handled
  const { data: formSubmissionData } = useQuery<{
    id: number;
    orderId: number;
    submittedAt: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    shippingName: string | null;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingState: string | null;
    shippingZip: string | null;
    shippingCountry: string | null;
    billingName: string | null;
    billingAddress: string | null;
    billingCity: string | null;
    billingState: string | null;
    billingZip: string | null;
    billingCountry: string | null;
    sameAsShipping: boolean | null;
    organizationName: string | null;
    purchaseOrderNumber: string | null;
    specialInstructions: string | null;
    status: string;
    lineItemSizes: Array<{
      id: number;
      submissionId: number;
      lineItemId: number;
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
      itemNotes: string | null;
    }>;
  } | null>({
    queryKey: ['/api/orders', orderId, 'form-submission', 'latest'],
    enabled: isOpen && !!orderId,
    meta: { silent: true },
    retry: false,
  });

  // Initialize form data when order loads
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
        shippingAddress: order.shippingAddress || '',
        billToAddress: order.billToAddress || '',
        contactName: order.contactName || '',
        contactEmail: order.contactEmail || '',
        contactPhone: order.contactPhone || '',
      });
    }
  }, [order, isOpen]);

  // Mutations
  const updateOrderMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/orders/${orderId}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Success", description: "Order updated successfully" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    },
  });

  const addLineItemMutation = useMutation({
    mutationFn: (lineItem: any) =>
      apiRequest(`/api/orders/${orderId}/line-items`, { method: "POST", body: lineItem }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId, 'line-items'] });
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId] });
      toast({ title: "Success", description: "Line item added successfully" });
      setShowAddLineItem(false);
      setNewLineItem({ yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0 });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add line item", variant: "destructive" });
    },
  });

  const updateLineItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: any }) =>
      apiRequest(`/api/orders/${orderId}/line-items/${itemId}`, { method: "PUT", body: data }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId, 'line-items'] });
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId] });
      toast({ title: "Success", description: "Line item updated successfully" });
      setEditingLineItem(null);
      setEditingLineItemData(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update line item", variant: "destructive" });
    },
  });

  const deleteLineItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiRequest(`/api/orders/${orderId}/line-items/${itemId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId, 'line-items'] });
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId] });
      toast({ title: "Success", description: "Line item deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete line item", variant: "destructive" });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) =>
      apiRequest(`/api/orders/${orderId}/notes`, { method: "POST", body: { note } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'activity'] });
      toast({ title: "Success", description: "Note added" });
      setNewNote("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/orders/${orderId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Success", description: "Order deleted successfully" });
      setShowDeleteConfirm(false);
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" });
    },
  });

  const addManufacturingNoteMutation = useMutation({
    mutationFn: ({ lineItemId, categoryId, note }: { lineItemId: number; categoryId: number; note: string }) =>
      apiRequest(`/api/order-line-items/${lineItemId}/manufacturing-notes`, { 
        method: "PATCH", 
        body: { categoryId, note } 
      }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId, 'line-items'] });
      toast({ title: "Success", description: "Manufacturing note added" });
      setAddNoteOpenFor(null);
      setNewManufacturingNote({ categoryId: "", note: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add manufacturing note", variant: "destructive" });
    },
  });

  const removeManufacturingNoteMutation = useMutation({
    mutationFn: ({ lineItemId, noteId }: { lineItemId: number; noteId: string }) =>
      apiRequest(`/api/order-line-items/${lineItemId}/manufacturing-notes/${noteId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['/api/orders', orderId, 'line-items'] });
      toast({ title: "Success", description: "Manufacturing note removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove manufacturing note", variant: "destructive" });
    },
  });

  // Calculate velocity
  const velocity = useMemo(() => {
    if (!order) return 'grey' as VelocityIndicator;
    return calculateVelocity(order.updatedAt, order.estDelivery, order.status);
  }, [order]);

  // Calculate progress blocks
  const progressBlocks = useMemo(() => {
    if (!order) return [];
    const orderStatus = order.status as OrderStatus;
    const designStatus = designJobs[0]?.status as DesignJobStatus | null || null;
    const mfgStatus = manufacturing?.status as ManufacturingStatus | null || null;
    return calculateProgressBlocks(orderStatus, designStatus, mfgStatus);
  }, [order, designJobs, manufacturing]);

  // Role-based module visibility - uses centralized config
  const visibleModules = useMemo(() => {
    return getVisibleModules(userRole);
  }, [userRole]);

  const toggleItem = (id: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helpers
  const calculateTotalQuantity = (item: Partial<OrderLineItem>) => {
    return (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
           (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
           (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0) + (item.xxxxl || 0);
  };

  const calculatePrice = (variantId: number) => {
    const variant = variants.find((v: any) => v.id === variantId);
    return variant?.msrp || "0";
  };

  const totalValue = lineItems.reduce((sum: number, item: any) => sum + parseFloat(item.lineTotal || '0'), 0);

  // Form link generation - now uses customer portal
  const getFormLink = () => {
    if (!orderId) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/customer-portal/${orderId}`;
  };

  const handleCopyLink = async () => {
    const link = getFormLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ title: "Link Copied!", description: "The customer portal link has been copied to your clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const handleEmailLink = () => {
    const link = getFormLink();
    const contact = contacts.find((c: any) => c.orgId === order?.orgId);
    const subject = encodeURIComponent(`Rich Habits Custom Order Portal: ${order?.orderCode}`);
    const body = encodeURIComponent(
      `Hi${contact?.name ? ` ${contact.name}` : ''},\n\n` +
      `Please access your Rich Habits Custom Order Portal using the link below to view your order details, submit sizes, and track your order:\n\n` +
      `${link}\n\n` +
      `Order: ${order?.orderCode}\n` +
      `${order?.orderName}\n\n` +
      `Thank you for choosing Rich Habits!`
    );
    window.location.href = `mailto:${contact?.email || order?.contactEmail || ""}?subject=${subject}&body=${body}`;
  };

  const handlePreviewForm = () => {
    if (orderId) {
      window.open(`/customer-portal/${orderId}`, '_blank');
    }
  };

  // Quick status actions
  const handleQuickStatusUpdate = (newStatus: string) => {
    updateOrderMutation.mutate({ status: newStatus });
  };

  // Save form
  const handleSaveForm = () => {
    updateOrderMutation.mutate(formData);
  };

  // Handle add line item
  const handleAddLineItem = () => {
    if (!newLineItem.variantId) {
      toast({ title: "Error", description: "Please select a product variant", variant: "destructive" });
      return;
    }
    const unitPrice = calculatePrice(newLineItem.variantId);
    const quantity = calculateTotalQuantity(newLineItem);
    const lineItemData = {
      variantId: newLineItem.variantId,
      itemName: newLineItem.itemName || '',
      colorNotes: newLineItem.colorNotes || '',
      ...Object.fromEntries(SIZE_COLUMNS.map(s => [s.key, newLineItem[s.key as keyof OrderLineItem] || 0])),
      unitPrice,
      qtyTotal: quantity,
      lineTotal: (parseFloat(unitPrice) * quantity).toFixed(2),
      notes: newLineItem.notes || '',
    };
    addLineItemMutation.mutate(lineItemData);
  };

  if (!orderId || (!order && !orderLoading)) return null;

  if (orderLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0">
          <VisuallyHidden.Root>
            <DialogTitle>Order Details - Loading</DialogTitle>
            <DialogDescription>Loading order details, please wait</DialogDescription>
          </VisuallyHidden.Root>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const orderStatusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Order Details - {order.orderCode}</DialogTitle>
          <DialogDescription>View and manage order {order.orderCode} details, line items, and status</DialogDescription>
        </VisuallyHidden.Root>
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5" />
          <div className="absolute inset-0 border border-white/10 rounded-2xl" />

          {/* Velocity glow effect */}
          <div
            className="absolute inset-0 opacity-20 rounded-2xl"
            style={{ boxShadow: `inset 0 0 60px ${VELOCITY_CONFIG[velocity].color}20` }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col max-h-[90vh]">

            {/* ========== HEADER ========== */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{order.orderCode}</h2>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium border",
                      orderStatusConfig?.bgClass,
                      orderStatusConfig?.textClass,
                      orderStatusConfig?.borderClass
                    )}>
                      {orderStatusConfig?.label || order.status}
                    </div>
                    <VelocityIndicatorBadge velocity={velocity} />
                  </div>
                  <p className="text-white/60">{order.orderName}</p>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 text-sm transition-colors"
                      data-testid="button-edit-mode"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveForm}
                        disabled={updateOrderMutation.isPending}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-blue/20 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/30 text-sm transition-colors"
                        data-testid="button-save"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {hasPermission('orders', 'delete') && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm transition-colors"
                      data-testid="button-delete-order"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress blocks */}
              <div className="mb-4">
                <ProgressBar blocks={progressBlocks} />
              </div>

              {/* Quick Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status transitions */}
                {canModify(user, 'orders') && !isEditing && (
                  <>
                    {order.status === "new" && (
                      <ActionButton
                        icon={Package}
                        label="Mark Waiting Sizes"
                        onClick={() => handleQuickStatusUpdate("waiting_sizes")}
                        variant="warning"
                      />
                    )}
                    {order.status === "waiting_sizes" && (
                      <ActionButton
                        icon={DollarSign}
                        label="Mark Invoiced"
                        onClick={() => handleQuickStatusUpdate("invoiced")}
                        variant="primary"
                        disabled={!order.invoiceUrl}
                      />
                    )}
                    {order.status === "invoiced" && (
                      <ActionButton
                        icon={Factory}
                        label="Start Production"
                        onClick={() => handleQuickStatusUpdate("production")}
                        variant="primary"
                      />
                    )}
                    {order.status === "production" && (
                      <ActionButton
                        icon={Truck}
                        label="Mark Shipped"
                        onClick={() => handleQuickStatusUpdate("shipped")}
                        variant="success"
                      />
                    )}
                  </>
                )}

                {/* Key metrics */}
                <div className="flex items-center gap-4 ml-auto text-sm">
                  <div className="flex items-center gap-2 text-white/60">
                    <Calendar className="w-4 h-4" />
                    <span>ETA: </span>
                    <span className={cn(
                      "font-medium",
                      velocity === 'red' ? "text-red-400" :
                      velocity === 'yellow' ? "text-yellow-400" : "text-white"
                    )}>
                      {calculateETA(order.estDelivery)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Building2 className="w-4 h-4" />
                    <span>{organization?.name || 'No organization'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <Package className="w-4 h-4" />
                    <span>{lineItems.length} items</span>
                  </div>
                  <div className="flex items-center gap-2 text-neon-cyan font-medium">
                    <DollarSign className="w-4 h-4" />
                    <span>${totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========== MODULE TABS ========== */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto">
              {visibleModules.includes('overview') && (
                <ModuleTab label="Overview" icon={FileText} active={activeModule === 'overview'} onClick={() => setActiveModule('overview')} />
              )}
              {visibleModules.includes('line-items') && (
                <ModuleTab label="Line Items" icon={Package} active={activeModule === 'line-items'} onClick={() => setActiveModule('line-items')} badge={lineItems.length} />
              )}
              {visibleModules.includes('design') && (
                <ModuleTab label="Design" icon={Palette} active={activeModule === 'design'} onClick={() => setActiveModule('design')} badge={designJobs.length} />
              )}
              {visibleModules.includes('manufacturing') && (
                <ModuleTab label="Manufacturing" icon={Factory} active={activeModule === 'manufacturing'} onClick={() => setActiveModule('manufacturing')} />
              )}
              {visibleModules.includes('form-link') && (
                <ModuleTab label="Customer Form" icon={Link2} active={activeModule === 'form-link'} onClick={() => setActiveModule('form-link')} />
              )}
              {visibleModules.includes('activity') && (
                <ModuleTab label="Activity" icon={MessageSquare} active={activeModule === 'activity'} onClick={() => setActiveModule('activity')} />
              )}
            </div>

            {/* ========== MODULE CONTENT ========== */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {activeModule === 'overview' && (
                  <OverviewModule
                    key="overview"
                    order={order}
                    organization={organization}
                    lineItems={lineItems}
                    isEditing={isEditing}
                    formData={formData}
                    setFormData={setFormData}
                    trackingNumbers={trackingNumbers}
                    contacts={contacts}
                    showAdvanced={showAdvanced}
                    setShowAdvanced={setShowAdvanced}
                    userRole={userRole}
                    users={users}
                    updateOrderMutation={updateOrderMutation}
                    salespersonPopoverOpen={salespersonPopoverOpen}
                    setSalespersonPopoverOpen={setSalespersonPopoverOpen}
                  />
                )}
                {activeModule === 'line-items' && (
                  <LineItemsModule
                    key="line-items"
                    orderId={orderId}
                    lineItems={lineItems}
                    products={products}
                    variants={variants}
                    expandedItems={expandedItems}
                    toggleItem={toggleItem}
                    setSelectedImage={setSelectedImage}
                    isEditing={isEditing}
                    editingLineItem={editingLineItem}
                    editingLineItemData={editingLineItemData}
                    setEditingLineItem={setEditingLineItem}
                    setEditingLineItemData={setEditingLineItemData}
                    showAddLineItem={showAddLineItem}
                    setShowAddLineItem={setShowAddLineItem}
                    newLineItem={newLineItem}
                    setNewLineItem={setNewLineItem}
                    handleAddLineItem={handleAddLineItem}
                    updateLineItemMutation={updateLineItemMutation}
                    deleteLineItemMutation={deleteLineItemMutation}
                    addLineItemMutation={addLineItemMutation}
                    calculateTotalQuantity={calculateTotalQuantity}
                    calculatePrice={calculatePrice}
                  />
                )}
                {activeModule === 'design' && (
                  <DesignModule key="design" designJobs={designJobs} order={order} users={users} />
                )}
                {activeModule === 'manufacturing' && (
                  <ManufacturingModule key="manufacturing" manufacturing={manufacturing} order={order} />
                )}
                {activeModule === 'form-link' && (
                  <FormLinkModule
                    key="form-link"
                    order={order}
                    lineItems={lineItems}
                    getFormLink={getFormLink}
                    handleCopyLink={handleCopyLink}
                    handleEmailLink={handleEmailLink}
                    handlePreviewForm={handlePreviewForm}
                    copied={copied}
                    formSubmissionData={formSubmissionData}
                  />
                )}
                {activeModule === 'activity' && (
                  <ActivityModule
                    key="activity"
                    orderId={orderId}
                    orderActivity={orderActivity}
                    newNote={newNote}
                    setNewNote={setNewNote}
                    addNoteMutation={addNoteMutation}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* ========== FOOTER ========== */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-white/40">
                Last updated: {order.updatedAt ? format(new Date(order.updatedAt), 'MMM d, yyyy h:mm a') : 'Never'}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-white/60 border-white/20">
                  ID: {order.id}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fullscreen Image Viewer */}
        <FullScreenImageViewer
          imageUrl={selectedImage || ''}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Order</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete order <span className="font-semibold text-white">{order?.orderCode}</span>?
              This action cannot be undone. All line items, manufacturing records, and related data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderMutation.mutate()}
              disabled={deleteOrderMutation.isPending}
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
              data-testid="button-confirm-delete"
            >
              {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

// =============================================================================
// MODULE COMPONENTS
// =============================================================================

function OverviewModule({
  order,
  organization,
  lineItems,
  isEditing,
  formData,
  setFormData,
  trackingNumbers,
  contacts,
  showAdvanced,
  setShowAdvanced,
  userRole,
  users,
  updateOrderMutation,
  salespersonPopoverOpen,
  setSalespersonPopoverOpen
}: {
  order: any;
  organization: any;
  lineItems: any[];
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  trackingNumbers: any[];
  contacts: any[];
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  userRole: UserRole;
  users: any[];
  updateOrderMutation: any;
  salespersonPopoverOpen: boolean;
  setSalespersonPopoverOpen: (open: boolean) => void;
}) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const lineItemsWithImages = lineItems.filter((item: any) => item.imageUrl);
  const contact = contacts.find((c: any) => c.orgId === order?.orgId);

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const getStatusStyle = (status: string) => {
    const statusConfig = ORDER_STATUS_CONFIG[status as OrderStatus];
    if (statusConfig) {
      return cn(statusConfig.bgClass, statusConfig.textClass, statusConfig.borderClass);
    }
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Key Status Header - Prominently displays salesperson, status, priority */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-neon-cyan/5 border border-white/10">
        <div className="grid grid-cols-4 gap-4">
          {/* Status */}
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Status</div>
            <div className={cn(
              "inline-block px-3 py-1.5 rounded-full text-sm font-medium border",
              getStatusStyle(order.status)
            )}>
              {ORDER_STATUS_CONFIG[order.status as OrderStatus]?.label || order.status?.replace('_', ' ')}
            </div>
          </div>

          {/* Priority */}
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Priority</div>
            <div className={cn(
              "inline-block px-3 py-1.5 rounded-full text-sm font-medium border capitalize",
              getPriorityStyle(order.priority)
            )}>
              {order.priority || 'Normal'}
            </div>
          </div>

          {/* Salesperson */}
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Salesperson</div>
            <Popover open={salespersonPopoverOpen} onOpenChange={setSalespersonPopoverOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="flex items-center justify-center gap-2 w-full hover:bg-white/5 rounded-lg p-1 transition-colors cursor-pointer"
                  data-testid="button-edit-salesperson"
                >
                  <div className="w-7 h-7 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-neon-purple" />
                  </div>
                  <span className="text-sm text-white font-medium">
                    {(() => {
                      if (!order.salespersonId) return 'Unassigned';
                      const salesperson = users.find((u: any) => u.id === order.salespersonId);
                      if (salesperson) {
                        return `${salesperson.firstName || ''} ${salesperson.lastName || ''}`.trim() || salesperson.email || 'Unknown';
                      }
                      return 'Unknown';
                    })()}
                  </span>
                  <Edit2 className="w-3 h-3 text-white/40" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-slate-800 border-white/10" align="center">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-white">Assign Salesperson</div>
                  <Select
                    value={order.salespersonId || ""}
                    onValueChange={(value) => {
                      const newSalespersonId = value === "unassigned" ? null : value;
                      updateOrderMutation.mutate({ salespersonId: newSalespersonId });
                      setSalespersonPopoverOpen(false);
                    }}
                    disabled={updateOrderMutation.isPending}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-salesperson">
                      <SelectValue placeholder="Select salesperson" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="unassigned" className="text-white/60">Unassigned</SelectItem>
                      {users
                        .filter((u: any) => u.role === 'sales' || u.role === 'admin')
                        .map((u: any) => (
                          <SelectItem key={u.id} value={u.id} className="text-white">
                            {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {updateOrderMutation.isPending && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-neon-blue"></div>
                      Saving...
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Est. Delivery */}
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Est. Delivery</div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-neon-cyan" />
              <span className={cn(
                "text-sm font-medium",
                order.estDelivery && new Date(order.estDelivery) < new Date() ? "text-red-400" : "text-white"
              )}>
                {order.estDelivery ? format(new Date(order.estDelivery), 'MMM d, yyyy') : 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Milestones */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                {order.designApproved ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                )}
                <span className={cn("text-sm", order.designApproved ? "text-green-400" : "text-white/50")}>
                  Design Approved
                </span>
              </div>
              <div className="flex items-center gap-2">
                {order.sizesValidated ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                )}
                <span className={cn("text-sm", order.sizesValidated ? "text-green-400" : "text-white/50")}>
                  Sizes Validated
                </span>
              </div>
              <div className="flex items-center gap-2">
                {order.depositReceived ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                )}
                <span className={cn("text-sm", order.depositReceived ? "text-green-400" : "text-white/50")}>
                  Deposit Received
                </span>
              </div>
            </div>
            <div className="text-xs text-white/40">
              Order Code: <span className="text-neon-blue font-mono">{order.orderCode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      {lineItemsWithImages.length > 0 && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-neon-cyan" />
            Product Images ({lineItemsWithImages.length})
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {lineItemsWithImages.slice(0, 12).map((item: any, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-neon-blue/50 transition-all"
                onClick={() => setSelectedImage(item.imageUrl)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.itemName || 'Product'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="text-[10px] text-white truncate">{item.itemName}</div>
                  </div>
                  <div className="absolute top-1 right-1">
                    <ZoomIn className="w-3 h-3 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Order Details */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-neon-blue" />
            Order Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/50">Order Name</span>
              {isEditing ? (
                <Input
                  value={formData.orderName || ''}
                  onChange={(e) => handleFormChange('orderName', e.target.value)}
                  className="w-48 h-8 bg-white/5 border-white/10"
                />
              ) : (
                <span className="text-sm text-white">{order.orderName}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/50">Status</span>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(v) => handleFormChange('status', v)}>
                  <SelectTrigger className="w-48 h-8 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_WORKFLOW.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-white capitalize">{order.status?.replace('_', ' ')}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/50">Priority</span>
              {isEditing ? (
                <Select value={formData.priority} onValueChange={(v) => handleFormChange('priority', v)}>
                  <SelectTrigger className="w-48 h-8 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-white capitalize">{order.priority}</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/50">Est. Delivery</span>
              {isEditing ? (
                <Input
                  type="date"
                  value={formData.estDelivery || ''}
                  onChange={(e) => handleFormChange('estDelivery', e.target.value)}
                  className="w-48 h-8 bg-white/5 border-white/10"
                />
              ) : (
                <span className="text-sm text-white">
                  {order.estDelivery ? format(new Date(order.estDelivery), 'MMM d, yyyy') : '—'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neon-purple" />
            Customer
          </h3>
          <div className="space-y-2">
            <InfoRow label="Organization" value={organization?.name} icon={Building2} />
            <InfoRow label="Contact" value={contact?.name || order?.contactName} icon={User} />
            <InfoRow label="Email" value={contact?.email || order?.contactEmail} icon={Mail} />
            <InfoRow label="Phone" value={contact?.phone || order?.contactPhone} icon={Phone} />
          </div>
        </div>

        {/* Tracking - visible for ops/admin by default */}
        {(userRole === 'admin' || userRole === 'ops' || showAdvanced) && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-neon-cyan" />
              Tracking
              {trackingNumbers.length > 0 && (
                <Badge variant="outline" className="ml-2 text-green-400 border-green-400/30">
                  {trackingNumbers.length} tracking number{trackingNumbers.length > 1 ? 's' : ''}
                </Badge>
              )}
            </h3>
            {trackingNumbers.length > 0 ? (
              <div className="space-y-1">
                {trackingNumbers.map((t: any) => (
                  <div key={t.id} className="text-sm text-white flex items-center gap-2">
                    <span className="text-neon-blue">{t.carrierCompany}:</span>
                    <span>{t.trackingNumber}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No tracking added</p>
            )}
          </div>
        )}

        {/* Workflow Status - visible for ops/admin by default */}
        {(userRole === 'admin' || userRole === 'ops' || showAdvanced) && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Workflow Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70 flex items-center gap-2">
                  Design Approved
                  {order.designApproved && <span className="sr-only">(Complete)</span>}
                </span>
                {isEditing ? (
                  <Switch
                    checked={formData.designApproved}
                    onCheckedChange={(v) => handleFormChange('designApproved', v)}
                    aria-label="Toggle design approved status"
                  />
                ) : (
                  order.designApproved ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" aria-label="Design approved" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20" aria-label="Design not approved" />
                  )
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70 flex items-center gap-2">
                  Sizes Validated
                  {order.sizesValidated && <span className="sr-only">(Complete)</span>}
                </span>
                {isEditing ? (
                  <Switch
                    checked={formData.sizesValidated}
                    onCheckedChange={(v) => handleFormChange('sizesValidated', v)}
                    aria-label="Toggle sizes validated status"
                  />
                ) : (
                  order.sizesValidated ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" aria-label="Sizes validated" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20" aria-label="Sizes not validated" />
                  )
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/70 flex items-center gap-2">
                  Deposit Received
                  {order.depositReceived && <span className="sr-only">(Complete)</span>}
                </span>
                {isEditing ? (
                  <Switch
                    checked={formData.depositReceived}
                    onCheckedChange={(v) => handleFormChange('depositReceived', v)}
                    aria-label="Toggle deposit received status"
                  />
                ) : (
                  order.depositReceived ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" aria-label="Deposit received" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white/20" aria-label="Deposit not received" />
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Section Toggle */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger asChild>
          <button
            id={order?.id ? `advanced-sections-trigger-${order.id}` : "advanced-sections-trigger"}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors py-2"
            aria-expanded={showAdvanced}
            aria-controls={order?.id ? `advanced-sections-content-${order.id}` : "advanced-sections-content"}
            aria-label={showAdvanced ? "Hide advanced options" : "Show advanced options"}
            data-testid="button-toggle-advanced"
          >
            {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Settings className="w-4 h-4" />
            <span>{showAdvanced ? "Hide Advanced" : "Show Advanced"}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          id={order?.id ? `advanced-sections-content-${order.id}` : "advanced-sections-content"}
          role="region"
          aria-labelledby={order?.id ? `advanced-sections-trigger-${order.id}` : "advanced-sections-trigger"}
        >
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-6 mt-4"
          >
            {/* Shipping Address */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-neon-cyan" />
                Shipping Address
              </h3>
              <div className="space-y-3">
                <div>
                  {isEditing ? (
                    <Textarea
                      value={formData.shippingAddress || ''}
                      onChange={(e) => handleFormChange('shippingAddress', e.target.value)}
                      className="bg-white/5 border-white/10 text-sm"
                      rows={3}
                      aria-label="Shipping address"
                    />
                  ) : (
                    <p className="text-sm text-white whitespace-pre-line">{order.shippingAddress || '—'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-neon-purple" />
                Billing Address
              </h3>
              <div className="space-y-3">
                <div>
                  {isEditing ? (
                    <Textarea
                      value={formData.billToAddress || ''}
                      onChange={(e) => handleFormChange('billToAddress', e.target.value)}
                      className="bg-white/5 border-white/10 text-sm"
                      rows={3}
                      aria-label="Billing address"
                    />
                  ) : (
                    <p className="text-sm text-white whitespace-pre-line">{order.billToAddress || '—'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice/Folder Links */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neon-blue" />
                Documents & Links
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Invoice URL</span>
                  {isEditing ? (
                    <Input
                      value={formData.invoiceUrl || ''}
                      onChange={(e) => handleFormChange('invoiceUrl', e.target.value)}
                      className="w-48 h-8 bg-white/5 border-white/10"
                      placeholder="https://..."
                      aria-label="Invoice URL"
                    />
                  ) : order.invoiceUrl ? (
                    <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-blue hover:underline flex items-center gap-1">
                      View Invoice <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-white/40">—</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Order Folder</span>
                  {isEditing ? (
                    <Input
                      value={formData.orderFolder || ''}
                      onChange={(e) => handleFormChange('orderFolder', e.target.value)}
                      className="w-48 h-8 bg-white/5 border-white/10"
                      placeholder="https://..."
                      aria-label="Order folder URL"
                    />
                  ) : order.orderFolder ? (
                    <a href={order.orderFolder} target="_blank" rel="noopener noreferrer" className="text-sm text-neon-blue hover:underline flex items-center gap-1">
                      Open Folder <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-sm text-white/40">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Order Totals */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-green-400" />
                Order Totals
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Line Items</span>
                  <span className="text-sm text-white">{lineItems.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Total Quantity</span>
                  <span className="text-sm text-white">
                    {lineItems.reduce((sum: number, item: any) => sum + (item.qtyTotal || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2">
                  <span className="text-sm font-medium text-white">Total Value</span>
                  <span className="text-lg font-bold text-neon-cyan">
                    ${lineItems.reduce((sum: number, item: any) => sum + parseFloat(item.lineTotal || '0'), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      <FullScreenImageViewer
        imageUrl={selectedImage || ''}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </motion.div>
  );
}

function LineItemsModule({
  orderId,
  lineItems,
  products,
  variants,
  expandedItems,
  toggleItem,
  setSelectedImage,
  isEditing,
  editingLineItem,
  editingLineItemData,
  setEditingLineItem,
  setEditingLineItemData,
  showAddLineItem,
  setShowAddLineItem,
  newLineItem,
  setNewLineItem,
  handleAddLineItem,
  updateLineItemMutation,
  deleteLineItemMutation,
  addLineItemMutation,
  calculateTotalQuantity,
  calculatePrice,
}: any) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState('');
  const [variantSearch, setVariantSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);

  // AI Name Cleanup mutation
  const aiCleanupMutation = useMutation({
    mutationFn: () => apiRequest(`/api/orders/${orderId}/ai-cleanup-names`, { method: "POST" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId, 'line-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
      toast({
        title: "AI Name Cleanup Complete",
        description: `Cleaned up ${data.cleanedItems} of ${data.totalItems} line item names`
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cleanup names", variant: "destructive" });
    },
  });

  // Debug: Log received lineItems
  console.log('[LineItemsModule] Received lineItems:', lineItems, 'isArray:', Array.isArray(lineItems), 'length:', lineItems?.length);

  const totalValue = lineItems.reduce((sum: number, item: any) => sum + parseFloat(item.lineTotal || '0'), 0);
  const totalQty = lineItems.reduce((sum: number, item: any) => sum + (item.qtyTotal || 0), 0);

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredVariants = variants.filter((v: any) => {
    if (!selectedProductId) return false;
    if (v.productId !== selectedProductId) return false;
    return v.variantCode?.toLowerCase().includes(variantSearch.toLowerCase()) ||
           v.variantName?.toLowerCase().includes(variantSearch.toLowerCase()) ||
           v.color?.toLowerCase().includes(variantSearch.toLowerCase());
  });

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);
  const selectedVariant = variants.find((v: any) => v.id === newLineItem.variantId);

  const handleSelectProduct = (product: any) => {
    setSelectedProductId(product.id);
    setProductSearch(product.name);
    setShowProductDropdown(false);
    setVariantSearch('');
    setNewLineItem((prev: any) => ({ ...prev, variantId: null, itemName: product.name }));
  };

  const handleSelectVariant = (variant: any) => {
    setNewLineItem((prev: any) => ({
      ...prev,
      variantId: variant.id,
      itemName: `${selectedProduct?.name} - ${variant.variantCode}`
    }));
    setVariantSearch(variant.variantCode || variant.variantName || '');
    setShowVariantDropdown(false);
  };

  const resetProductSelection = () => {
    setSelectedProductId(null);
    setProductSearch('');
    setVariantSearch('');
    setNewLineItem((prev: any) => ({ ...prev, variantId: null, itemName: '' }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
          <p className="text-sm text-white/50">{lineItems.length} items • {totalQty} units • ${totalValue.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          {lineItems.length > 0 && (
            <button
              onClick={() => aiCleanupMutation.mutate()}
              disabled={aiCleanupMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-sm transition-colors disabled:opacity-50"
              data-testid="button-ai-cleanup-names"
              title="Clean up line item names using AI"
            >
              {aiCleanupMutation.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-purple-400/20 border-t-purple-400 rounded-full"
                />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              AI Cleanup Names
            </button>
          )}
          <button
            onClick={() => setShowAddLineItem(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 text-sm transition-colors"
            data-testid="button-add-line-item"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Add Line Item Form - with Product/Variant Search */}
      {showAddLineItem && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20"
        >
          <h4 className="text-sm font-semibold text-white mb-4">Add New Line Item</h4>

          {/* Step 1: Search Product */}
          <div className="mb-4">
            <Label className="text-xs text-white/50 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neon-blue/30 text-neon-blue flex items-center justify-center text-[10px] font-bold">1</span>
              Search Product
            </Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                    if (!e.target.value) resetProductSelection();
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                  className="pl-10 pr-10 bg-white/5 border-white/10"
                  placeholder="Type to search products..."
                  data-testid="input-product-search"
                />
                {selectedProductId && (
                  <button
                    onClick={resetProductSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Product Dropdown */}
              {showProductDropdown && productSearch && !selectedProductId && (
                <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-[#0f0f2a] border border-white/20 shadow-xl">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 10).map((product: any) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                      >
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-white/40" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-white font-medium">{product.name}</div>
                          <div className="text-xs text-white/40">{product.category}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-white/40">No products found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Select Variant (only shown after product is selected) */}
          {selectedProductId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Label className="text-xs text-white/50 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-neon-purple/30 text-neon-purple flex items-center justify-center text-[10px] font-bold">2</span>
                Select Variant
                <span className="text-neon-blue ml-2">({selectedProduct?.name})</span>
              </Label>
              <div className="relative">
                <div className="relative">
                  <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    value={variantSearch}
                    onChange={(e) => {
                      setVariantSearch(e.target.value);
                      setShowVariantDropdown(true);
                    }}
                    onFocus={() => setShowVariantDropdown(true)}
                    onBlur={() => setTimeout(() => setShowVariantDropdown(false), 200)}
                    className="pl-10 bg-white/5 border-white/10"
                    placeholder="Search variants by code, name, or color..."
                    data-testid="input-variant-search"
                  />
                </div>

                {/* Variant Dropdown */}
                {showVariantDropdown && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-[#0f0f2a] border border-white/20 shadow-xl">
                    {filteredVariants.length > 0 ? (
                      filteredVariants.map((variant: any) => (
                        <button
                          key={variant.id}
                          onClick={() => handleSelectVariant(variant)}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between",
                            newLineItem.variantId === variant.id && "bg-neon-blue/10 border-l-2 border-neon-blue"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded border border-white/20"
                              style={{ backgroundColor: variant.colorHex || '#666' }}
                            />
                            <div>
                              <div className="text-sm text-white font-medium">{variant.variantCode}</div>
                              <div className="text-xs text-white/40">{variant.color || variant.variantName}</div>
                            </div>
                          </div>
                          <div className="text-xs text-neon-cyan">${variant.basePrice}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-white/40">
                        {variantSearch ? 'No variants match your search' : 'Type to search variants'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Show all variants if nothing typed */}
              {!variantSearch && !showVariantDropdown && filteredVariants.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {filteredVariants.slice(0, 8).map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => handleSelectVariant(variant)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-2",
                        newLineItem.variantId === variant.id
                          ? "bg-neon-blue/20 border-neon-blue/50 text-neon-blue"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: variant.colorHex || '#666' }}
                      />
                      {variant.variantCode}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Selected Item Preview */}
          {selectedVariant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-lg bg-neon-blue/10 border border-neon-blue/30 flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-neon-blue flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{selectedProduct?.name}</div>
                <div className="text-xs text-white/50">Variant: {selectedVariant.variantCode} • ${selectedVariant.basePrice}/unit</div>
              </div>
            </motion.div>
          )}

          {/* Item Name Override */}
          <div className="mb-4">
            <Label className="text-xs text-white/50">Custom Item Name (Optional)</Label>
            <Input
              value={newLineItem.itemName || ''}
              onChange={(e) => setNewLineItem((prev: any) => ({ ...prev, itemName: e.target.value }))}
              className="mt-1 bg-white/5 border-white/10"
              placeholder="Override the default item name..."
              data-testid="input-item-name"
            />
          </div>

          {/* Size Grid */}
          <div className="mb-4">
            <Label className="text-xs text-white/50 mb-2 block">Sizes</Label>
            <div className="flex flex-wrap gap-2">
              {SIZE_COLUMNS.map((size) => (
                <div key={size.key} className="flex flex-col items-center">
                  <span className="text-[10px] text-white/40 mb-1">{size.label}</span>
                  <Input
                    type="number"
                    min="0"
                    value={newLineItem[size.key as keyof typeof newLineItem] || 0}
                    onChange={(e) => setNewLineItem((prev: any) => ({ ...prev, [size.key]: parseInt(e.target.value) || 0 }))}
                    className="w-14 h-8 text-center bg-white/5 border-white/10 text-sm px-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddLineItem(false);
                setNewLineItem({ yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0 });
                resetProductSelection();
              }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleAddLineItem();
                resetProductSelection();
              }}
              disabled={addLineItemMutation.isPending || !newLineItem.variantId}
              className="px-3 py-2 rounded-lg bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-sm disabled:opacity-50"
            >
              {addLineItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Line Items List */}
      {lineItems.length > 0 ? (
        <div className="space-y-2">
          {lineItems.map((item: any, index: number) => {
            const variant = variants.find((v: any) => v.id === item.variantId);
            const product = variant ? products.find((p: any) => p.id === variant.productId) : null;
            const isItemEditing = editingLineItem === item.id;
            const displayItem = isItemEditing && editingLineItemData ? editingLineItemData : item;

            return (
              <Collapsible
                key={item.id}
                open={expandedItems.has(item.id)}
                onOpenChange={() => toggleItem(item.id)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "rounded-lg border transition-all",
                    expandedItems.has(item.id)
                      ? "bg-white/10 border-neon-blue/30"
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 text-left">
                      <div className="flex items-center gap-3">
                        {displayItem.imageUrl ? (
                          <div className="relative group">
                            <img
                              src={displayItem.imageUrl}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover border border-white/10"
                            />
                            <div
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(displayItem.imageUrl);
                              }}
                            >
                              <Expand className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                            <Package className="w-5 h-5 text-white/40" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-white font-medium">{displayItem.itemName || product?.name || 'Unnamed Item'}</div>
                          <div className="text-xs text-white/40 flex items-center gap-2">
                            {displayItem.colorNotes && <span>{displayItem.colorNotes}</span>}
                            {variant?.variantCode && <span className="text-neon-blue/70">{variant.variantCode}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-white">{displayItem.qtyTotal || calculateTotalQuantity(displayItem)} units</div>
                          <div className="text-xs text-neon-cyan">${displayItem.lineTotal}</div>
                        </div>
                        {/* Quick Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLineItem(item.id);
                              setEditingLineItemData({ ...item });
                            }}
                            className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this line item?')) {
                                deleteLineItemMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <motion.div animate={{ rotate: expandedItems.has(item.id) ? 180 : 0 }}>
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        </motion.div>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-3 pb-3 pt-0"
                    >
                      <div className="border-t border-white/10 pt-3">
                        {isItemEditing ? (
                          <div className="space-y-4">
                            {/* Edit Item Name */}
                            <div>
                              <Label className="text-xs text-white/50 mb-2 block">Item Name</Label>
                              <Input
                                value={editingLineItemData?.itemName || ''}
                                onChange={(e) => setEditingLineItemData((prev: any) => ({ ...prev, itemName: e.target.value }))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Enter item name"
                                data-testid={`input-line-item-name-${item.id}`}
                              />
                            </div>

                            {/* Edit Size Grid */}
                            <div>
                              <Label className="text-xs text-white/50 mb-2 block">Edit Sizes</Label>
                              <div className="flex flex-wrap gap-2">
                                {SIZE_COLUMNS.map((size) => (
                                  <div key={size.key} className="flex flex-col items-center">
                                    <span className="text-[10px] text-white/40 mb-1">{size.label}</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={editingLineItemData?.[size.key as keyof OrderLineItem] || 0}
                                      onChange={(e) => setEditingLineItemData((prev: any) => ({ ...prev, [size.key]: parseInt(e.target.value) || 0 }))}
                                      className="w-14 h-8 text-center bg-white/5 border-white/10 text-sm px-1"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Upload Custom Graphic */}
                            <div>
                              <Label className="text-xs text-white/50 mb-2 block">Line Item Graphic</Label>
                              <div className="flex items-center gap-3">
                                {editingLineItemData?.imageUrl && (
                                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 bg-white/5">
                                    <img
                                      src={editingLineItemData.imageUrl}
                                      alt="Line item graphic"
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={() => setEditingLineItemData((prev: any) => ({ ...prev, imageUrl: '' }))}
                                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
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
                                      const imageUrl = `/public-objects/${uploadId}`;
                                      setEditingLineItemData((prev: any) => ({ ...prev, imageUrl }));
                                      toast({
                                        title: "Success",
                                        description: "Graphic uploaded successfully",
                                      });
                                    }
                                  }}
                                  buttonClassName="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors"
                                >
                                  <span className="flex items-center gap-2 text-sm">
                                    <Upload className="w-4 h-4" />
                                    {editingLineItemData?.imageUrl ? 'Replace Graphic' : 'Upload Graphic'}
                                  </span>
                                </ObjectUploader>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingLineItem(null);
                                  setEditingLineItemData(null);
                                }}
                                className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/60 text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (editingLineItemData) {
                                    const unitPrice = calculatePrice(item.variantId);
                                    const cleanedData = {
                                      variantId: editingLineItemData.variantId,
                                      itemName: editingLineItemData.itemName,
                                      colorNotes: editingLineItemData.colorNotes,
                                      imageUrl: editingLineItemData.imageUrl,
                                      notes: editingLineItemData.notes,
                                      yxs: editingLineItemData.yxs || 0,
                                      ys: editingLineItemData.ys || 0,
                                      ym: editingLineItemData.ym || 0,
                                      yl: editingLineItemData.yl || 0,
                                      xs: editingLineItemData.xs || 0,
                                      s: editingLineItemData.s || 0,
                                      m: editingLineItemData.m || 0,
                                      l: editingLineItemData.l || 0,
                                      xl: editingLineItemData.xl || 0,
                                      xxl: editingLineItemData.xxl || 0,
                                      xxxl: editingLineItemData.xxxl || 0,
                                      xxxxl: editingLineItemData.xxxxl || 0,
                                      unitPrice,
                                    };
                                    console.log('[LineItem Save] Sending data:', JSON.stringify(cleanedData, null, 2));
                                    console.log('[LineItem Save] Item ID:', item.id);
                                    updateLineItemMutation.mutate({
                                      itemId: item.id,
                                      data: cleanedData
                                    });
                                  }
                                }}
                                disabled={updateLineItemMutation.isPending}
                                className="px-3 py-1.5 rounded bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-sm"
                              >
                                {updateLineItemMutation.isPending ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-white/50 mb-2">Size Breakdown</div>
                              <div className="flex flex-wrap gap-1.5">
                                {SIZE_COLUMNS.map(size => {
                                  const qty = item[size.key] || 0;
                                  if (qty === 0) return null;
                                  return (
                                    <span
                                      key={size.key}
                                      className="px-2 py-1 text-xs rounded bg-white/10 text-white/80 border border-white/10"
                                    >
                                      {size.label}: {qty}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-white/50 mb-2">Pricing</div>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-white/70">
                                  <span>Unit Price:</span>
                                  <span>${item.unitPrice}</span>
                                </div>
                                <div className="flex justify-between text-white font-medium">
                                  <span>Line Total:</span>
                                  <span className="text-neon-cyan">${item.lineTotal}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Manufacturing Notes Section */}
                        {!isItemEditing && (
                          <div className="mt-3 pt-3 border-t border-white/10" data-testid={`manufacturing-notes-section-${item.id}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs text-white/50 flex items-center gap-1.5">
                                <Factory className="w-3 h-3" />
                                Manufacturing Notes
                              </div>
                              <Popover 
                                open={addNoteOpenFor === item.id} 
                                onOpenChange={(open) => {
                                  if (open) {
                                    setAddNoteOpenFor(item.id);
                                  } else {
                                    setAddNoteOpenFor(null);
                                    setNewManufacturingNote({ categoryId: "", note: "" });
                                  }
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                    data-testid={`btn-add-manufacturing-note-${item.id}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Note
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  className="w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 p-4"
                                  align="end"
                                >
                                  <div className="space-y-3">
                                    <div className="text-sm font-medium text-white">Add Manufacturing Note</div>
                                    
                                    <div>
                                      <Label className="text-xs text-white/50 mb-1.5 block">Category</Label>
                                      <Select
                                        value={newManufacturingNote.categoryId}
                                        onValueChange={(value) => setNewManufacturingNote(prev => ({ ...prev, categoryId: value }))}
                                      >
                                        <SelectTrigger 
                                          className="bg-white/5 border-white/10 text-white"
                                          data-testid={`select-note-category-${item.id}`}
                                        >
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-white/10">
                                          {manufacturingNoteCategories.filter(c => c.isActive !== false).map((category) => {
                                            const CategoryIcon = getCategoryIcon(category.icon);
                                            return (
                                              <SelectItem 
                                                key={category.id} 
                                                value={category.id.toString()}
                                                className="text-white hover:bg-white/10"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <div 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: category.color || '#6366f1' }} 
                                                  />
                                                  <CategoryIcon className="w-3 h-3" style={{ color: category.color || '#6366f1' }} />
                                                  <span>{category.name}</span>
                                                </div>
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-xs text-white/50 mb-1.5 block">Note</Label>
                                      <Textarea
                                        value={newManufacturingNote.note}
                                        onChange={(e) => setNewManufacturingNote(prev => ({ ...prev, note: e.target.value }))}
                                        placeholder="Enter manufacturing note..."
                                        className="bg-white/5 border-white/10 text-white min-h-[80px] resize-none"
                                        data-testid={`input-note-text-${item.id}`}
                                      />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        onClick={() => {
                                          setAddNoteOpenFor(null);
                                          setNewManufacturingNote({ categoryId: "", note: "" });
                                        }}
                                        className="px-3 py-1.5 text-xs rounded bg-white/5 border border-white/10 text-white/60 hover:text-white"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (newManufacturingNote.categoryId && newManufacturingNote.note.trim()) {
                                            addManufacturingNoteMutation.mutate({
                                              lineItemId: item.id,
                                              categoryId: parseInt(newManufacturingNote.categoryId),
                                              note: newManufacturingNote.note.trim(),
                                            });
                                          }
                                        }}
                                        disabled={!newManufacturingNote.categoryId || !newManufacturingNote.note.trim() || addManufacturingNoteMutation.isPending}
                                        className="px-3 py-1.5 text-xs rounded bg-neon-blue/20 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        data-testid={`btn-save-manufacturing-note-${item.id}`}
                                      >
                                        {addManufacturingNoteMutation.isPending ? 'Saving...' : 'Save'}
                                      </button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>

                            {/* Display existing manufacturing notes */}
                            {item.manufacturingNotes && item.manufacturingNotes.length > 0 ? (
                              <div className="flex flex-wrap gap-2" data-testid={`manufacturing-notes-list-${item.id}`}>
                                {item.manufacturingNotes.map((note: ManufacturingNote) => {
                                  const category = manufacturingNoteCategories.find(c => c.id === note.categoryId);
                                  const NoteIcon = getCategoryIcon(category?.icon);
                                  const categoryColor = category?.color || '#6366f1';
                                  
                                  return (
                                    <div
                                      key={note.id}
                                      className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs"
                                      style={{
                                        backgroundColor: `${categoryColor}15`,
                                        borderColor: `${categoryColor}40`,
                                      }}
                                      data-testid={`manufacturing-note-badge-${note.id}`}
                                    >
                                      <NoteIcon className="w-3 h-3 flex-shrink-0" style={{ color: categoryColor }} />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-medium text-white/90 truncate max-w-[200px]">
                                          {note.note}
                                        </span>
                                        <span className="text-[10px] text-white/40">
                                          {note.categoryName} • {note.createdByName}
                                        </span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeManufacturingNoteMutation.mutate({
                                            lineItemId: item.id,
                                            noteId: note.id,
                                          });
                                        }}
                                        className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
                                        data-testid={`btn-remove-note-${note.id}`}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-white/30 italic">
                                No manufacturing notes
                              </div>
                            )}
                          </div>
                        )}

                        {item.notes && !isItemEditing && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="text-xs text-white/50 mb-1">Notes</div>
                            <div className="text-sm text-white/70">{item.notes}</div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </CollapsibleContent>
                </motion.div>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No line items yet</p>
          <button
            onClick={() => setShowAddLineItem(true)}
            className="mt-4 text-neon-blue hover:underline text-sm"
          >
            Add your first item
          </button>
        </div>
      )}
    </motion.div>
  );
}

function DesignModule({ designJobs, order, onDesignJobsChange, users = [] }: { designJobs: any[]; order: any; onDesignJobsChange?: () => void; users?: any[] }) {
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'choose' | 'search' | 'create'>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allDesignJobs = [], isLoading: isLoadingJobs } = useQuery<any[]>({
    queryKey: ['/api/design-jobs'],
    enabled: dialogMode === 'search',
  });

  const availableJobs = allDesignJobs.filter((job: any) =>
    !job.orderId || job.orderId === null
  ).filter((job: any) =>
    !searchQuery ||
    job.jobCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.brief?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const attachJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return await apiRequest(`/api/design-jobs/${jobId}`, {
        method: 'PUT',
        body: { orderId: order.id },
      });
    },
    onSuccess: () => {
      toast({
        title: "Design job attached",
        description: "The design job has been linked to this order.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', order.id, 'design-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/design-jobs'] });
      setShowAttachDialog(false);
      setDialogMode('choose');
      setSearchQuery('');
      onDesignJobsChange?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to attach",
        description: error.message || "Could not attach the design job.",
        variant: "destructive",
      });
    },
  });

  const toggleJobExpand = (jobId: number) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'rush': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleOpenDialog = () => {
    setShowAttachDialog(true);
    setDialogMode('choose');
    setSearchQuery('');
  };

  const handleCloseDialog = () => {
    setShowAttachDialog(false);
    setDialogMode('choose');
    setSearchQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Design Jobs</h3>
          <span className="text-sm text-white/40">({designJobs.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            icon={Plus}
            label="Attach Design Job"
            onClick={handleOpenDialog}
            variant="primary"
          />
          <div className={cn(
            "px-3 py-1.5 rounded-full text-sm border",
            order.designApproved
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          )}>
            {order.designApproved ? 'Design Approved' : 'Pending Approval'}
          </div>
        </div>
      </div>

      {designJobs.length > 0 ? (
        <div className="space-y-4">
          {designJobs.map((job: any) => {
            const statusConfig = DESIGN_JOB_STATUS_CONFIG[job.status as DesignJobStatus];
            const isExpanded = expandedJobs.has(job.id);
            const hasRenditions = job.renditionUrls && job.renditionUrls.length > 0;
            const hasReferenceFiles = job.referenceFiles && job.referenceFiles.length > 0;

            return (
              <motion.div
                key={job.id}
                layout
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                {/* Job Header - Always visible */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => toggleJobExpand(job.id)}
                  data-testid={`design-job-header-${job.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-white font-medium">{job.jobCode || `Job #${job.id}`}</div>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium border",
                          statusConfig?.bgClass,
                          statusConfig?.textClass,
                          statusConfig?.borderClass
                        )}>
                          {statusConfig?.label || job.status}
                        </div>
                        {job.urgency && job.urgency !== 'normal' && (
                          <div className={cn("px-2 py-0.5 rounded text-xs font-medium border", getUrgencyStyle(job.urgency))}>
                            {job.urgency.toUpperCase()}
                          </div>
                        )}
                      </div>
                      {job.brief && (
                        <p className="text-sm text-white/60 line-clamp-2">{job.brief}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {hasRenditions && (
                        <div className="flex items-center gap-1 text-xs text-neon-cyan">
                          <ImageIcon className="w-3 h-3" />
                          <span>{job.renditionCount || job.renditionUrls?.length || 0}</span>
                        </div>
                      )}
                      <ChevronDown className={cn(
                        "w-5 h-5 text-white/40 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </div>

                  {/* Quick Info Row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                    {job.assignedDesignerId && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Assigned</span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {format(new Date(job.deadline), 'MMM d')}</span>
                      </div>
                    )}
                    {job.priority && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span className="capitalize">{job.priority} priority</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-4">
                        {/* Requirements */}
                        {job.requirements && (
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-neon-blue" />
                              <span className="text-xs font-medium text-white/70 uppercase">Requirements</span>
                            </div>
                            <p className="text-sm text-white/80">{job.requirements}</p>
                          </div>
                        )}

                        {/* Designer & Dates Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-neon-purple" />
                              <span className="text-xs font-medium text-white/70 uppercase">Assigned Designer</span>
                            </div>
                            <p className="text-sm text-white">
                              {job.assignedDesignerId ? users.find(u => u.id === job.assignedDesignerId)?.name || 'Unknown Designer' : 'Unassigned'}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-neon-cyan" />
                              <span className="text-xs font-medium text-white/70 uppercase">Timeline</span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-white/50">Created:</span>
                                <span className="text-white">
                                  {job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy') : '—'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/50">Deadline:</span>
                                <span className={cn(
                                  "text-white",
                                  job.deadline && new Date(job.deadline) < new Date() && "text-red-400"
                                )}>
                                  {job.deadline ? format(new Date(job.deadline), 'MMM d, yyyy') : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Renditions / Design Files */}
                        {hasRenditions && (
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-3">
                              <ImageIcon className="w-4 h-4 text-neon-cyan" />
                              <span className="text-xs font-medium text-white/70 uppercase">
                                Renditions ({job.renditionUrls.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {job.renditionUrls.slice(0, 8).map((url: string, idx: number) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/10 group relative cursor-pointer">
                                  <img src={url} alt={`Rendition ${idx + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reference Files */}
                        {hasReferenceFiles && (
                          <div className="p-3 rounded-lg bg-white/5">
                            <div className="flex items-center gap-2 mb-3">
                              <Paperclip className="w-4 h-4 text-white/60" />
                              <span className="text-xs font-medium text-white/70 uppercase">
                                Reference Files ({job.referenceFiles.length})
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {job.referenceFiles.map((file: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>File {idx + 1}</span>
                                  <ExternalLink className="w-3 h-3 text-white/40" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Client Feedback */}
                        {job.clientFeedback && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs font-medium text-yellow-400 uppercase">Client Feedback</span>
                            </div>
                            <p className="text-sm text-white/80">{job.clientFeedback}</p>
                          </div>
                        )}

                        {/* Internal Notes */}
                        {job.internalNotes && (
                          <div className="p-3 rounded-lg bg-white/5 border-l-2 border-neon-purple">
                            <div className="flex items-center gap-2 mb-2">
                              <Lock className="w-4 h-4 text-neon-purple" />
                              <span className="text-xs font-medium text-neon-purple uppercase">Internal Notes</span>
                            </div>
                            <p className="text-sm text-white/80">{job.internalNotes}</p>
                          </div>
                        )}

                        {/* Final Links */}
                        {job.finalLink && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-green-400" />
                                <span className="text-xs font-medium text-green-400 uppercase">Final Approved Design</span>
                              </div>
                              <a
                                href={job.finalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-green-400 hover:underline"
                              >
                                View Final
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Palette className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-4">No design jobs attached to this order</p>
          <ActionButton
            icon={Plus}
            label="Attach Design Job"
            onClick={handleOpenDialog}
            variant="primary"
            className="mx-auto"
          />
        </div>
      )}

      {/* Attach Design Job Dialog */}
      {showAttachDialog && (
        <Dialog open={showAttachDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="bg-[#0a0a1f] border-white/10 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <VisuallyHidden.Root>
              <DialogTitle>Attach Design Job</DialogTitle>
              <DialogDescription>Select or create a design job to attach to this order</DialogDescription>
            </VisuallyHidden.Root>
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-neon-blue" />
                {dialogMode === 'choose' && 'Attach Design Job'}
                {dialogMode === 'search' && 'Find Existing Design Job'}
                {dialogMode === 'create' && 'Create New Design Job'}
              </DialogTitle>
              <DialogDescription className="text-white/60 sr-only">
                Select or create a design job to attach to this order
              </DialogDescription>
            </DialogHeader>

            {dialogMode === 'choose' && (
              <div className="py-6 text-center text-white/60">
                <p className="mb-6">Select an existing design job or create a new one to attach to this order.</p>
                <div className="flex justify-center gap-4">
                  <ActionButton
                    icon={Search}
                    label="Find Existing"
                    onClick={() => setDialogMode('search')}
                    variant="default"
                  />
                  <ActionButton
                    icon={Plus}
                    label="Create New"
                    onClick={() => setDialogMode('create')}
                    variant="primary"
                  />
                </div>
              </div>
            )}

            {dialogMode === 'search' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10"
                    placeholder="Search by job code, brief, or status..."
                    data-testid="input-design-job-search"
                    autoFocus
                  />
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 max-h-[400px]">
                  {isLoadingJobs ? (
                    <div className="text-center py-8 text-white/40">
                      <div className="animate-spin w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full mx-auto mb-3" />
                      <p>Loading design jobs...</p>
                    </div>
                  ) : availableJobs.length > 0 ? (
                    availableJobs.map((job: any) => {
                      const statusConfig = DESIGN_JOB_STATUS_CONFIG[job.status as DesignJobStatus];
                      return (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "p-4 rounded-lg bg-white/5 border border-white/10 transition-all group",
                            attachJobMutation.isPending
                              ? "opacity-50 cursor-wait"
                              : "hover:border-neon-blue/50 cursor-pointer"
                          )}
                          onClick={() => !attachJobMutation.isPending && attachJobMutation.mutate(job.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{job.jobCode || `Job #${job.id}`}</span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium border",
                                  statusConfig?.bgClass,
                                  statusConfig?.textClass,
                                  statusConfig?.borderClass
                                )}>
                                  {statusConfig?.label || job.status}
                                </span>
                                {job.urgency && job.urgency !== 'normal' && (
                                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", getUrgencyStyle(job.urgency))}>
                                    {job.urgency.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {job.brief && (
                                <p className="text-sm text-white/60 line-clamp-2">{job.brief}</p>
                              )}
                              <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-white/40">
                                {job.organization?.name && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {job.organization.name}
                                  </span>
                                )}
                                {job.designer && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {job.designer.firstName} {job.designer.lastName}
                                  </span>
                                )}
                                {job.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Due: {format(new Date(job.deadline), 'MMM d, yyyy')}
                                  </span>
                                )}
                                {job.createdAt && (
                                  <span>Created: {format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                                )}
                              </div>
                            </div>
                            <button
                              className="px-3 py-1.5 rounded-lg bg-neon-blue/20 border border-neon-blue/50 text-neon-blue text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                attachJobMutation.mutate(job.id);
                              }}
                              disabled={attachJobMutation.isPending}
                            >
                              {attachJobMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-3 h-3" />
                                  Attach
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <Palette className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="mb-2">No unattached design jobs found</p>
                      <p className="text-sm text-white/30">
                        {searchQuery ? 'Try a different search term' : 'All design jobs are already attached to orders'}
                      </p>
                      <button
                        onClick={() => setDialogMode('create')}
                        className="mt-4 text-neon-blue hover:underline text-sm"
                      >
                        Create a new design job instead
                      </button>
                    </div>
                  )}
                </div>

                {/* Back Button */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => setDialogMode('choose')}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to options
                  </button>
                </div>
              </div>
            )}

            {dialogMode === 'create' && (
              <div className="py-6 text-center text-white/60">
                <Palette className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="mb-4">Create a new design job for this order.</p>
                <p className="text-sm text-white/40 mb-6">
                  This feature will be available soon. For now, create design jobs from the Design Jobs page and attach them here.
                </p>
                <button
                  onClick={() => setDialogMode('choose')}
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white mx-auto"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to options
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}

function ManufacturingModule({ manufacturing, order }: { manufacturing: any; order: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {manufacturing ? (
        <>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Production Stage</h3>
            <ManufacturingStageIndicator status={manufacturing.status as ManufacturingStatus} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neon-blue" />
                Schedule
              </h3>
              <div className="space-y-1">
                <InfoRow
                  label="Start Date"
                  value={manufacturing.startDate ? format(new Date(manufacturing.startDate), 'MMM d, yyyy') : null}
                  icon={Calendar}
                />
                <InfoRow
                  label="Est. Completion"
                  value={manufacturing.estCompletion ? format(new Date(manufacturing.estCompletion), 'MMM d, yyyy') : null}
                  icon={Clock}
                />
                <InfoRow label="Batch Number" value={manufacturing.batchNumber} icon={Package} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-neon-purple" />
                Notes
              </h3>
              <div className="space-y-2">
                {manufacturing.productionNotes && (
                  <div className="text-sm text-white/60 p-2 rounded bg-white/5">
                    {manufacturing.productionNotes}
                  </div>
                )}
                {manufacturing.qualityNotes && (
                  <div className="text-sm text-white/60 p-2 rounded bg-white/5">
                    <span className="text-neon-cyan text-xs uppercase font-medium">QC: </span>
                    {manufacturing.qualityNotes}
                  </div>
                )}
                {!manufacturing.productionNotes && !manufacturing.qualityNotes && (
                  <div className="text-sm text-white/40 italic">No notes added</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-white/40">
          <Factory className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-4">Manufacturing record not yet created</p>
          <p className="text-sm">Order must be approved and ready for production</p>
        </div>
      )}
    </motion.div>
  );
}

interface FormSubmissionDataType {
  id: number;
  orderId: number;
  submittedAt: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  billingName: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZip: string | null;
  billingCountry: string | null;
  sameAsShipping: boolean | null;
  organizationName: string | null;
  purchaseOrderNumber: string | null;
  specialInstructions: string | null;
  status: string;
  lineItemSizes: Array<{
    id: number;
    submissionId: number;
    lineItemId: number;
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
    itemNotes: string | null;
  }>;
}

function FormLinkModule({
  order,
  lineItems,
  getFormLink,
  handleCopyLink,
  handleEmailLink,
  handlePreviewForm,
  copied,
  formSubmissionData,
}: {
  order: any;
  lineItems: any[];
  getFormLink: () => string;
  handleCopyLink: () => void;
  handleEmailLink: () => void;
  handlePreviewForm: () => void;
  copied: boolean;
  formSubmissionData?: FormSubmissionDataType | null;
}) {
  const [showSubmission, setShowSubmission] = useState(true);
  const hasSubmission = formSubmissionData !== null && formSubmissionData !== undefined;

  const getSubmissionTotal = () => {
    if (!formSubmissionData?.lineItemSizes) return 0;
    return formSubmissionData.lineItemSizes.reduce((sum, item) => {
      return sum + item.yxs + item.ys + item.ym + item.yl +
             item.xs + item.s + item.m + item.l +
             item.xl + item.xxl + item.xxxl + item.xxxxl;
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Customer Submission Section - Show when submission exists */}
      {hasSubmission && formSubmissionData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-neon-cyan/10 border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-white font-semibold">Customer Submission Received</h4>
                <p className="text-xs text-white/50">
                  {formSubmissionData.submittedAt
                    ? format(new Date(formSubmissionData.submittedAt), 'MMM d, yyyy h:mm a')
                    : 'Unknown date'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSubmission(!showSubmission)}
              className="px-3 py-1.5 rounded-lg border bg-white/5 border-white/10 text-sm text-white/70 hover:bg-white/10 flex items-center gap-1"
              data-testid="toggle-submission-details"
            >
              {showSubmission ? 'Hide Details' : 'Show Details'}
              <ChevronDown className={cn("w-4 h-4 transition-transform", showSubmission && "rotate-180")} />
            </button>
          </div>

          <AnimatePresence>
            {showSubmission && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-neon-blue" />
                      <span className="text-xs text-white/50">Contact</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-white">{formSubmissionData.contactName || 'Not provided'}</div>
                      <div className="text-xs text-white/60">{formSubmissionData.contactEmail}</div>
                      {formSubmissionData.contactPhone && (
                        <div className="text-xs text-white/60">{formSubmissionData.contactPhone}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-neon-cyan" />
                      <span className="text-xs text-white/50">Size Totals</span>
                    </div>
                    <div className="text-2xl font-bold text-neon-cyan">{getSubmissionTotal()}</div>
                    <div className="text-xs text-white/50">total units submitted</div>
                  </div>
                </div>

                {/* Shipping Address */}
                {formSubmissionData.shippingAddress && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-neon-purple" />
                      <span className="text-xs text-white/50">Shipping Address</span>
                    </div>
                    <div className="text-sm text-white/80">
                      {formSubmissionData.shippingName && (
                        <div>{formSubmissionData.shippingName}</div>
                      )}
                      <div>{formSubmissionData.shippingAddress}</div>
                      <div>
                        {formSubmissionData.shippingCity}, {formSubmissionData.shippingState} {formSubmissionData.shippingZip}
                      </div>
                      <div>{formSubmissionData.shippingCountry}</div>
                    </div>
                  </div>
                )}

                {/* Size Breakdown per Line Item */}
                {formSubmissionData.lineItemSizes && formSubmissionData.lineItemSizes.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <h5 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Size Selections by Item
                    </h5>
                    <div className="space-y-3">
                      {formSubmissionData.lineItemSizes.map((response) => {
                        const lineItem = lineItems.find((li: any) => li.id === response.lineItemId);
                        const itemTotal = response.yxs + response.ys + response.ym + response.yl +
                                        response.xs + response.s + response.m + response.l +
                                        response.xl + response.xxl + response.xxxl + response.xxxxl;
                        return (
                          <div key={response.id} className="p-2 rounded-lg bg-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white">{lineItem?.itemName || 'Unknown Item'}</span>
                              <span className="text-xs text-neon-cyan">{itemTotal} units</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { k: 'yxs', l: 'YXS', v: response.yxs },
                                { k: 'ys', l: 'YS', v: response.ys },
                                { k: 'ym', l: 'YM', v: response.ym },
                                { k: 'yl', l: 'YL', v: response.yl },
                                { k: 'xs', l: 'XS', v: response.xs },
                                { k: 's', l: 'S', v: response.s },
                                { k: 'm', l: 'M', v: response.m },
                                { k: 'l', l: 'L', v: response.l },
                                { k: 'xl', l: 'XL', v: response.xl },
                                { k: 'xxl', l: '2XL', v: response.xxl },
                                { k: 'xxxl', l: '3XL', v: response.xxxl },
                                { k: 'xxxxl', l: '4XL', v: response.xxxxl },
                              ].filter(s => s.v > 0).map((size) => (
                                <span key={size.k} className="px-2 py-0.5 rounded bg-neon-blue/20 text-neon-blue text-xs">
                                  {size.l}: {size.v}
                                </span>
                              ))}
                            </div>
                            {response.itemNotes && (
                              <div className="mt-2 text-xs text-white/50 italic">{response.itemNotes}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {(formSubmissionData.organizationName || formSubmissionData.purchaseOrderNumber || formSubmissionData.specialInstructions) && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-white/50" />
                      <span className="text-xs font-medium text-white/50 uppercase">Additional Information</span>
                    </div>
                    {formSubmissionData.organizationName && (
                      <div className="text-sm text-white/80 mb-1">
                        <span className="text-white/50">Organization:</span> {formSubmissionData.organizationName}
                      </div>
                    )}
                    {formSubmissionData.purchaseOrderNumber && (
                      <div className="text-sm text-white/80 mb-1">
                        <span className="text-white/50">PO#:</span> {formSubmissionData.purchaseOrderNumber}
                      </div>
                    )}
                    {formSubmissionData.specialInstructions && (
                      <div className="text-sm text-white/80 mt-2 p-2 rounded bg-white/5">
                        {formSubmissionData.specialInstructions}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Show Link Generator if no submission yet */}
      {!hasSubmission && (
        <>
          {/* Hero Section */}
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neon-blue/30">
              <Link2 className="w-10 h-10 text-neon-blue" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Customer Order Form</h3>
            <p className="text-white/60 max-w-md mx-auto">
              Generate a link to send to your customer. They can fill out sizes, contact info, and shipping details.
            </p>
          </div>

          {/* Preview of what customer sees */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-neon-cyan" />
              Items in Form ({lineItems.length})
            </h4>
            {lineItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 mb-4">
                {lineItems.slice(0, 8).map((item: any) => (
                  <div key={item.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full aspect-square object-cover rounded-lg mb-2" />
                    ) : (
                      <div className="w-full aspect-square bg-white/10 rounded-lg mb-2 flex items-center justify-center">
                        <Package className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="text-xs text-white truncate">{item.itemName || 'Item'}</div>
                    <div className="text-[10px] text-white/50">{item.qtyTotal} units</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-white/40">
                <p className="text-sm">Add line items to generate a form</p>
              </div>
            )}
          </div>

          {/* Info about what form collects */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-sm font-semibold text-white/80 mb-3">Form Collects</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Size selections per item</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Contact information</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Shipping address</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Billing address</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Additional notes</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>Logo file uploads</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Link Display & Actions - Always visible */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20">
        <Label className="text-xs text-white/50 mb-2 block">
          {hasSubmission ? 'Form Link (customer has already submitted)' : 'Form Link'}
        </Label>
        <div className="flex gap-2 mb-4">
          <Input
            value={getFormLink()}
            readOnly
            className="flex-1 bg-white/5 border-white/10 font-mono text-sm"
            data-testid="input-form-link"
          />
          <button
            onClick={handleCopyLink}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              copied
                ? "bg-green-500/20 border-green-500/50 text-green-400"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            )}
            data-testid="button-copy-link"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ActionButton
            icon={Copy}
            label="Copy Link"
            onClick={handleCopyLink}
            variant={copied ? "success" : "default"}
          />
          <ActionButton
            icon={Mail}
            label="Email Link"
            onClick={handleEmailLink}
            variant="primary"
          />
          <ActionButton
            icon={ExternalLink}
            label="Preview"
            onClick={handlePreviewForm}
            variant="default"
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActivityModule({
  orderId,
  orderActivity,
  newNote,
  setNewNote,
  addNoteMutation,
}: {
  orderId: number;
  orderActivity: any[];
  newNote: string;
  setNewNote: (note: string) => void;
  addNoteMutation: any;
}) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'notes' | 'changes'>('all');
  const [noteType, setNoteType] = useState<'general' | 'internal' | 'customer'>('general');

  const getActivityIcon = (action: string) => {
    if (action === 'note_added') return MessageSquare;
    if (action.includes('status')) return AlertCircle;
    if (action.includes('created')) return Plus;
    if (action.includes('updated')) return Edit2;
    return FileText;
  };

  const getActivityColor = (action: string) => {
    if (action === 'note_added') return 'text-neon-blue bg-neon-blue/20';
    if (action.includes('status')) return 'text-neon-purple bg-neon-purple/20';
    if (action.includes('created')) return 'text-green-400 bg-green-500/20';
    if (action.includes('updated')) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-white/60 bg-white/10';
  };

  const filteredActivity = orderActivity.filter(activity => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'notes') return activity.action === 'note_added';
    if (activeFilter === 'changes') return activity.action !== 'note_added';
    return true;
  });

  const notes = orderActivity.filter(a => a.action === 'note_added');
  const changes = orderActivity.filter(a => a.action !== 'note_added');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Activity & Notes</h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-neon-blue/20 text-neon-blue">
            {notes.length} Notes
          </span>
          <span className="px-2 py-1 rounded-full bg-neon-purple/20 text-neon-purple">
            {changes.length} Changes
          </span>
        </div>
      </div>

      {/* Add Note Section */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-xs text-white/70 font-medium uppercase">Add New Note</Label>
          <div className="flex gap-1">
            {['general', 'internal', 'customer'].map((type) => (
              <button
                key={type}
                onClick={() => setNoteType(type as any)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-all",
                  noteType === type
                    ? type === 'general' ? "bg-neon-blue/30 text-neon-blue border border-neon-blue/50"
                    : type === 'internal' ? "bg-neon-purple/30 text-neon-purple border border-neon-purple/50"
                    : "bg-neon-cyan/30 text-neon-cyan border border-neon-cyan/50"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={`Add a ${noteType} note...`}
            className="flex-1 bg-white/5 border-white/10 text-sm min-h-[80px] resize-none"
            data-testid="input-activity-note"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (newNote.trim()) {
                  addNoteMutation.mutate(newNote.trim());
                }
              }}
              disabled={!newNote.trim() || addNoteMutation.isPending}
              className="px-4 py-3 rounded-lg bg-neon-blue/20 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/30 disabled:opacity-50 transition-all"
              data-testid="button-add-note"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'all', label: 'All Activity', count: orderActivity.length },
          { id: 'notes', label: 'Notes', count: notes.length },
          { id: 'changes', label: 'Changes', count: changes.length },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeFilter === filter.id
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            {filter.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              activeFilter === filter.id ? "bg-white/20" : "bg-white/10"
            )}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      {filteredActivity.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredActivity.map((activity: any, index: number) => {
            const IconComponent = getActivityIcon(activity.action);
            const colorClass = getActivityColor(activity.action);
            const isNote = activity.action === 'note_added';

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-4 rounded-xl border transition-all hover:bg-white/5",
                  isNote
                    ? "bg-gradient-to-r from-white/5 to-transparent border-l-2 border-l-neon-blue border-white/10"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">
                          {activity.userName || 'System'}
                        </span>
                        {isNote && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neon-blue/20 text-neon-blue uppercase">
                            Note
                          </span>
                        )}
                        {!isNote && (
                          <span className="text-xs text-white/40">
                            {activity.action?.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/40 whitespace-nowrap">
                        {activity.createdAt ? format(new Date(activity.createdAt), 'MMM d, h:mm a') : ''}
                      </span>
                    </div>

                    {/* Note or Details */}
                    <div className="text-sm text-white/80">
                      {isNote ? (
                        <p className="whitespace-pre-wrap">{activity.newValue?.note || activity.details}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          {activity.oldValue && activity.newValue && (
                            <>
                              <span className="text-white/40 line-through">{JSON.stringify(activity.oldValue)}</span>
                              <ChevronRight className="w-3 h-3 text-white/30" />
                              <span className="text-white">{JSON.stringify(activity.newValue)}</span>
                            </>
                          )}
                          {activity.details && !activity.oldValue && (
                            <span>{activity.details}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-white/40">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="mb-2">No activity yet</p>
          <p className="text-sm text-white/30">Add the first note to get started</p>
        </div>
      )}
    </motion.div>
  );
}

export default OrderCapsule;