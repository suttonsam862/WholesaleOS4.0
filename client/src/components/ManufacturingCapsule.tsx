/**
 * Manufacturing Capsule Component
 *
 * A unified modal for viewing and managing Manufacturing records with full editing capabilities,
 * glass design, progress indicator, role-based modules, and actionable items everywhere.
 * Matches OrderCapsule's design patterns and aesthetic.
 */

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { PantonePicker, PantoneAssignment } from "@/components/manufacturing/pantone-picker";
import { PantoneSummarySection, PantoneDisplayItem } from "@/components/shared/PantoneSummarySection";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FirstPieceApprovalPanel } from "@/components/manufacturing/FirstPieceApprovalPanel";
import { FabricSubmissionForm, FabricStatusIndicator } from "@/components/FabricSubmissionForm";
import {
  ManufacturingStatus,
  MANUFACTURING_STATUS_CONFIG,
  VELOCITY_CONFIG,
  VelocityIndicator,
  calculateVelocity,
} from "@/lib/status-system";
import { generateManufacturingPdf } from "@/lib/manufacturing-pdf";

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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  ZoomIn,
  Plus,
  Trash2,
  Upload,
  Paperclip,
  RefreshCcw,
  Archive,
  ArchiveRestore,
  Download,
  Pencil,
  Layers,
  Camera,
  ClipboardCheck,
  ShieldCheck,
  Timer,
  MapPin,
  Circle,
  CheckCircle,
  Tag,
  Box,
  Ruler,
  Eye,
} from "lucide-react";

interface ManufacturingCapsuleProps {
  isOpen: boolean;
  onClose: () => void;
  manufacturingId: number | null;
}

type ModuleId = "overview" | "line-items" | "pantone" | "documents" | "activity" | "materials" | "qc" | "timeline" | "shipping";

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

const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = true,
  className = ""
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("min-w-0 overflow-hidden", className)}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-neon-cyan flex-shrink-0" />
          <span className="font-medium text-white">{title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-white/60 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

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

export function ManufacturingCapsule({ isOpen, onClose, manufacturingId }: ManufacturingCapsuleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeModule, setActiveModule] = useState<ModuleId>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPantonePicker, setShowPantonePicker] = useState<number | null>(null);
  const [editingDescriptors, setEditingDescriptors] = useState<number | null>(null);
  const [newDescriptor, setNewDescriptor] = useState("");
  const [editingLineItemId, setEditingLineItemId] = useState<number | null>(null);
  const [editedItemName, setEditedItemName] = useState("");
  const [selectedAttachmentCategory, setSelectedAttachmentCategory] = useState<string>("logos");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'ops' || user?.role === 'manufacturer';

  // Fetch manufacturing record
  const { data: manufacturing, isLoading: manufacturingLoading } = useQuery<any>({
    queryKey: ['/api/manufacturing', manufacturingId],
    enabled: isOpen && !!manufacturingId,
  });

  // Fetch order details
  const { data: order } = useQuery<any>({
    queryKey: ['/api/orders', manufacturing?.orderId],
    enabled: isOpen && !!manufacturing?.orderId,
  });

  // Fetch organization
  const { data: organization } = useQuery<any>({
    queryKey: ["/api/organizations", order?.orgId],
    enabled: isOpen && !!order?.orgId,
  });

  // Fetch manufacturer
  const { data: manufacturers = [] } = useQuery<any[]>({
    queryKey: ['/api/manufacturers'],
    enabled: isOpen,
  });

  const manufacturer = manufacturers.find((m: any) => m.id === manufacturing?.manufacturerId);

  // Fetch manufacturing updates
  const { data: manufacturingUpdates = [] } = useQuery<any[]>({
    queryKey: ['/api/manufacturing-updates', manufacturingId],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing-updates?manufacturingId=${manufacturingId}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen && !!manufacturingId,
  });

  const latestUpdate = manufacturingUpdates.length > 0 ? manufacturingUpdates[0] : null;

  // Fetch manufacturing line items
  const { data: manufacturingLineItems = [], isLoading: lineItemsLoading } = useQuery<any[]>({
    queryKey: ['/api/manufacturing-update-line-items', latestUpdate?.id],
    queryFn: async () => {
      if (!latestUpdate?.id) return [];
      const response = await fetch(`/api/manufacturing-update-line-items?manufacturingUpdateId=${latestUpdate.id}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen && !!latestUpdate?.id,
  });

  // Fetch order tracking numbers
  const { data: orderTrackingNumbers = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', manufacturing?.orderId, 'tracking'],
    enabled: isOpen && !!manufacturing?.orderId,
  });

  // Fetch Pantone assignments
  const { data: pantoneAssignments = [] } = useQuery<any[]>({
    queryKey: ['/api/pantone-assignments', { manufacturingUpdateId: latestUpdate?.id }],
    queryFn: async () => {
      if (!latestUpdate?.id) return [];
      const response = await fetch(`/api/pantone-assignments?manufacturingUpdateId=${latestUpdate.id}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen && !!latestUpdate?.id,
  });

  // Initialize form data
  useEffect(() => {
    if (manufacturing && isOpen) {
      setFormData({
        status: manufacturing.status || 'awaiting_admin_confirmation',
        productionNotes: manufacturing.productionNotes || '',
        qualityNotes: manufacturing.qualityNotes || '',
        trackingNumber: manufacturing.trackingNumber || '',
        carrierCompany: '',
        actualCompletion: manufacturing.actualCompletion || '',
      });
    }
  }, [manufacturing, isOpen]);

  // Reset module when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveModule("overview");
      setIsEditing(false);
      setExpandedItems(new Set());
    }
  }, [isOpen]);

  // Update manufacturing mutation
  const updateManufacturingMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/manufacturing/${manufacturingId}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', manufacturingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      toast({ title: "Success", description: "Manufacturing record updated successfully" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update manufacturing record", variant: "destructive" });
    },
  });

  // Delete manufacturing mutation
  const deleteManufacturingMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/manufacturing/${manufacturingId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      toast({ title: "Success", description: "Manufacturing record deleted successfully" });
      setShowDeleteConfirm(false);
      onClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete manufacturing record", variant: "destructive" });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (archive: boolean) => {
      const endpoint = archive 
        ? `/api/manufacturing/${manufacturingId}/archive`
        : `/api/manufacturing/${manufacturingId}/unarchive`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update archive status');
      return response.json();
    },
    onSuccess: (_, archive) => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing'] });
      toast({
        title: "Success",
        description: `Manufacturing record ${archive ? 'archived' : 'unarchived'} successfully`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update archive status",
        variant: "destructive",
      });
    },
  });

  // Create Pantone assignment mutation
  const createPantoneAssignmentMutation = useMutation({
    mutationFn: async (assignment: PantoneAssignment & { lineItemId: number }) => {
      if (!latestUpdate?.id) {
        throw new Error("No manufacturing update found. Please refresh the page and try again.");
      }
      return apiRequest('/api/pantone-assignments', {
        method: 'POST',
        body: {
          manufacturingUpdateId: latestUpdate.id,
          lineItemId: assignment.lineItemId,
          pantoneCode: assignment.pantoneCode,
          pantoneName: assignment.pantoneName,
          pantoneType: assignment.pantoneType,
          hexValue: assignment.hexValue,
          rgbR: assignment.rgbR,
          rgbG: assignment.rgbG,
          rgbB: assignment.rgbB,
          usageLocation: assignment.usageLocation,
          usageNotes: assignment.usageNotes,
          matchQuality: assignment.matchQuality,
          matchDistance: assignment.matchDistance,
          sampledFromImageUrl: assignment.sampledFromImageUrl,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pantone-assignments', { manufacturingUpdateId: latestUpdate?.id }] });
      setShowPantonePicker(null);
      toast({ title: "Success", description: "Pantone color assigned successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to assign Pantone color", variant: "destructive" });
    },
  });

  // Delete Pantone assignment mutation
  const deletePantoneAssignmentMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/pantone-assignments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pantone-assignments', { manufacturingUpdateId: latestUpdate?.id }] });
      toast({ title: "Success", description: "Pantone assignment removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove Pantone assignment", variant: "destructive" });
    },
  });

  // Refresh line items mutation
  const refreshLineItemsMutation = useMutation({
    mutationFn: async () => {
      if (!latestUpdate?.id) throw new Error("No manufacturing update found");
      return apiRequest(`/api/manufacturing-updates/${latestUpdate.id}/refresh-line-items`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-update-line-items'] });
      toast({ title: "Success", description: "Line items have been refreshed with the latest order data" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to refresh line items", variant: "destructive" });
    },
  });

  // Update line item descriptors mutation
  const updateDescriptorsMutation = useMutation({
    mutationFn: async ({ lineItemId, descriptors }: { lineItemId: number; descriptors: string[] }) => {
      const response = await fetch(`/api/manufacturing-update-line-items/${lineItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ descriptors }),
      });
      if (!response.ok) throw new Error('Failed to update descriptors');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-update-line-items'] });
      toast({ title: "Success", description: "Descriptors updated successfully" });
      setEditingDescriptors(null);
      setNewDescriptor("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update descriptors", variant: "destructive" });
    },
  });

  // Update line item name mutation
  const updateLineItemNameMutation = useMutation({
    mutationFn: async ({ lineItemId, itemName }: { lineItemId: number; itemName: string }) => {
      const response = await fetch(`/api/order-line-items/${lineItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ itemName }),
      });
      if (!response.ok) throw new Error('Failed to update item name');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-update-line-items'] });
      toast({ title: "Success", description: "Product name updated successfully" });
      setEditingLineItemId(null);
      setEditedItemName("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product name", variant: "destructive" });
    },
  });

  // Update completed product images mutation
  const updateCompletedImagesMutation = useMutation({
    mutationFn: async (images: string[]) => {
      const response = await fetch(`/api/manufacturing/${manufacturingId}/completed-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completedProductImages: images }),
      });
      if (!response.ok) throw new Error('Failed to update completed images');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', manufacturingId] });
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing'] });
      toast({ title: "Success", description: "Completed product images updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update completed product images", variant: "destructive" });
    },
  });

  // Helper functions for line item editing
  const handleAddDescriptor = (lineItemId: number, currentDescriptors: string[] = []) => {
    if (!newDescriptor.trim()) return;
    const updatedDescriptors = [...currentDescriptors, newDescriptor.trim()];
    updateDescriptorsMutation.mutate({ lineItemId, descriptors: updatedDescriptors });
  };

  const handleRemoveDescriptor = (lineItemId: number, currentDescriptors: string[], index: number) => {
    const updatedDescriptors = currentDescriptors.filter((_, i) => i !== index);
    updateDescriptorsMutation.mutate({ lineItemId, descriptors: updatedDescriptors });
  };

  const handleSaveItemName = (lineItemId: number) => {
    if (!editedItemName.trim()) {
      setEditingLineItemId(null);
      setEditedItemName("");
      return;
    }
    updateLineItemNameMutation.mutate({ lineItemId, itemName: editedItemName.trim() });
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    updateManufacturingMutation.mutate(formData);
  };

  const handleArchive = () => {
    const isArchived = manufacturing?.archived;
    if (isArchived) {
      archiveMutation.mutate(false);
    } else {
      archiveMutation.mutate(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (!manufacturing) return;
    
    setIsGeneratingPdf(true);
    try {
      await generateManufacturingPdf({
        manufacturing: {
          id: manufacturing.id,
          status: manufacturing.status,
          estCompletion: manufacturing.estCompletion,
          actualCompletion: manufacturing.actualCompletion,
          trackingNumber: manufacturing.trackingNumber,
          productionNotes: manufacturing.productionNotes,
          qualityNotes: manufacturing.qualityNotes,
          specialInstructions: manufacturing.specialInstructions,
          createdAt: manufacturing.createdAt,
          updatedAt: manufacturing.updatedAt,
          priority: manufacturing.priority,
        },
        order: order ? {
          orderCode: order.orderCode,
          orderName: order.orderName,
          estDelivery: order.estDelivery,
          priority: order.priority,
        } : null,
        organization: organization ? {
          name: organization.name,
          city: organization.city,
          state: organization.state,
          shippingAddress: organization.shippingAddress,
          logoUrl: organization.logoUrl,
        } : null,
        manufacturer: manufacturer ? {
          name: manufacturer.name,
        } : null,
        lineItems: manufacturingLineItems.map((item: any) => ({
          id: item.id,
          orderLineItemId: item.orderLineItemId,
          itemName: item.itemName,
          variantName: item.variantName,
          sku: item.sku,
          descriptors: item.descriptors,
          yxs: item.yxs,
          ys: item.ys,
          ym: item.ym,
          yl: item.yl,
          xs: item.xs,
          s: item.s,
          m: item.m,
          l: item.l,
          xl: item.xl,
          xxl: item.xxl,
          xxxl: item.xxxl,
          xxxxl: item.xxxxl,
          totalQty: item.totalQty,
        })),
        pantoneColors: pantoneAssignments.map((p: any) => ({
          id: p.id,
          pantoneCode: p.pantoneCode,
          pantoneName: p.pantoneName,
          hexValue: p.hexValue,
          usageLocation: p.usageLocation,
          usageNotes: p.usageNotes,
        })),
      });
      toast({ title: "Success", description: "Manufacturing guide PDF downloaded" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Calculate velocity
  const velocity = manufacturing
    ? calculateVelocity(manufacturing.updatedAt, manufacturing.estCompletion, manufacturing.status)
    : 'grey';

  if (!isOpen) return null;

  const isLoading = manufacturingLoading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-transparent border-0">
      <VisuallyHidden.Root>
        <DialogTitle>Manufacturing Details - M-{manufacturing?.id}</DialogTitle>
        <DialogDescription>View and manage manufacturing record details for order {order?.orderName}</DialogDescription>
      </VisuallyHidden.Root>

      <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-full min-w-0 overflow-hidden"
        >
          {/* Glass Container */}
          <div className="relative rounded-2xl overflow-hidden w-full max-w-full min-w-0">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5" />

            {/* Content */}
            <div className="relative flex flex-col max-h-[90vh]">
              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
                    <span className="text-white/60">Loading manufacturing details...</span>
                  </div>
                </div>
              )}

              {!manufacturing && !isLoading && (
                <div className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Manufacturing Not Found</h3>
                  <p className="text-white/60">The requested manufacturing record could not be found.</p>
                  <Button onClick={onClose} className="mt-4">Close</Button>
                </div>
              )}

              {manufacturing && (
                <>
                  {/* ========== HEADER ========== */}
                  <div className="p-6 border-b border-white/10 overflow-hidden">
                    <div className="flex flex-col gap-4 mb-4">
                      {/* Top Row: ID, Title, and Close button */}
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: ID Badge and Title */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 shrink-0"
                          >
                            <span className="text-lg font-bold text-white">M-{manufacturing.id}</span>
                          </motion.div>
                          <div className="min-w-0">
                            <h2 className="text-xl font-semibold text-white truncate">
                              {order?.orderName || `Order #${manufacturing.orderId}`}
                            </h2>
                            <p className="text-sm text-white/50 truncate">
                              {organization?.name || 'No organization'} • Created {format(new Date(manufacturing.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>

                        {/* Close button */}
                        <button
                          onClick={onClose}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                          data-testid="button-close-capsule"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <VelocityIndicatorBadge velocity={velocity} />
                        {canEdit && (
                          <>
                            {isEditing ? (
                              <>
                                <ActionButton
                                  icon={X}
                                  label="Cancel"
                                  onClick={() => setIsEditing(false)}
                                  variant="default"
                                />
                                <ActionButton
                                  icon={Save}
                                  label="Save"
                                  onClick={handleSave}
                                  variant="success"
                                  disabled={updateManufacturingMutation.isPending}
                                />
                              </>
                            ) : (
                              <>
                                <ActionButton
                                  icon={Edit2}
                                  label="Edit"
                                  onClick={() => setIsEditing(true)}
                                  variant="primary"
                                />
                                <ActionButton
                                  icon={manufacturing?.archived ? ArchiveRestore : Archive}
                                  label={manufacturing?.archived ? "Unarchive" : "Archive"}
                                  onClick={handleArchive}
                                  variant="warning"
                                  disabled={archiveMutation.isPending}
                                />
                                <ActionButton
                                  icon={Trash2}
                                  label="Delete"
                                  onClick={() => setShowDeleteConfirm(true)}
                                  variant="danger"
                                />
                                <button
                                  onClick={handleDownloadPdf}
                                  disabled={isGeneratingPdf}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                  data-testid="button-download-pdf"
                                >
                                  <Download className={cn("w-4 h-4", isGeneratingPdf && "animate-pulse")} />
                                  <span>{isGeneratingPdf ? "Generating..." : "Download"}</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status & Stage Indicator */}
                    <div className="flex items-center gap-4 mb-4">
                      <Badge
                        className={cn(
                          "px-3 py-1.5 text-sm font-medium",
                          MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.bgClass,
                          MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.textClass,
                          MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.borderClass
                        )}
                      >
                        {MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.label || manufacturing.status}
                      </Badge>
                      {manufacturing.priority === 'high' && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          High Priority
                        </Badge>
                      )}
                    </div>

                    {/* Manufacturing Stage Indicator */}
                    <ManufacturingStageIndicator status={manufacturing.status} />
                  </div>

                  {/* ========== MODULE TABS WITH SCROLL BUTTONS ========== */}
                  <div className="px-6 py-3 border-b border-white/10 max-w-full overflow-hidden">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const container = document.getElementById('module-tabs-scroll');
                          if (container) container.scrollBy({ left: -150, behavior: 'smooth' });
                        }}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
                        data-testid="button-scroll-tabs-left"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div 
                        id="module-tabs-scroll"
                        className="flex items-center gap-2 overflow-x-auto max-w-full flex-1 scrollbar-thin scrollbar-thumb-white/20 scroll-smooth"
                      >
                        <ModuleTab label="Overview" icon={FileText} active={activeModule === 'overview'} onClick={() => setActiveModule('overview')} />
                        <ModuleTab label="Line Items" icon={Package} active={activeModule === 'line-items'} onClick={() => setActiveModule('line-items')} badge={manufacturingLineItems.length} />
                        <ModuleTab label="Pantone" icon={Palette} active={activeModule === 'pantone'} onClick={() => setActiveModule('pantone')} badge={pantoneAssignments.length} />
                        <ModuleTab label="Documents" icon={Paperclip} active={activeModule === 'documents'} onClick={() => setActiveModule('documents')} />
                        <ModuleTab label="Activity" icon={MessageSquare} active={activeModule === 'activity'} onClick={() => setActiveModule('activity')} />
                        <ModuleTab label="Materials" icon={ClipboardCheck} active={activeModule === 'materials'} onClick={() => setActiveModule('materials')} />
                        <ModuleTab label="QC" icon={ShieldCheck} active={activeModule === 'qc'} onClick={() => setActiveModule('qc')} />
                        <ModuleTab label="Timeline" icon={Timer} active={activeModule === 'timeline'} onClick={() => setActiveModule('timeline')} />
                        <ModuleTab label="Shipping" icon={Truck} active={activeModule === 'shipping'} onClick={() => setActiveModule('shipping')} />
                      </div>
                      <button
                        onClick={() => {
                          const container = document.getElementById('module-tabs-scroll');
                          if (container) container.scrollBy({ left: 150, behavior: 'smooth' });
                        }}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
                        data-testid="button-scroll-tabs-right"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ========== MODULE CONTENT ========== */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0 max-w-full">
                    <AnimatePresence mode="wait">
                      {activeModule === 'overview' && (
                        <OverviewModule
                          key="overview"
                          manufacturing={manufacturing}
                          order={order}
                          organization={organization}
                          manufacturer={manufacturer}
                          isEditing={isEditing}
                          formData={formData}
                          setFormData={setFormData}
                          orderTrackingNumbers={orderTrackingNumbers}
                          pantoneAssignments={pantoneAssignments}
                          latestUpdate={latestUpdate}
                          canEdit={canEdit}
                        />
                      )}
                      {activeModule === 'line-items' && (
                        <LineItemsModule
                          key="line-items"
                          manufacturingLineItems={manufacturingLineItems}
                          expandedItems={expandedItems}
                          toggleItem={toggleItem}
                          setSelectedImage={setSelectedImage}
                          isLoading={lineItemsLoading}
                          latestUpdate={latestUpdate}
                          canEdit={canEdit}
                          refreshLineItemsMutation={refreshLineItemsMutation}
                          onPantoneClick={(lineItemId) => setShowPantonePicker(lineItemId)}
                          editingDescriptors={editingDescriptors}
                          setEditingDescriptors={setEditingDescriptors}
                          newDescriptor={newDescriptor}
                          setNewDescriptor={setNewDescriptor}
                          editingLineItemId={editingLineItemId}
                          setEditingLineItemId={setEditingLineItemId}
                          editedItemName={editedItemName}
                          setEditedItemName={setEditedItemName}
                          handleAddDescriptor={handleAddDescriptor}
                          handleRemoveDescriptor={handleRemoveDescriptor}
                          handleSaveItemName={handleSaveItemName}
                          updateDescriptorsMutation={updateDescriptorsMutation}
                        />
                      )}
                      {activeModule === 'pantone' && (
                        <PantoneModule
                          key="pantone"
                          pantoneAssignments={pantoneAssignments}
                          manufacturingLineItems={manufacturingLineItems}
                          canEdit={canEdit}
                          onDelete={(id) => deletePantoneAssignmentMutation.mutate(id)}
                          onAddClick={(lineItemId) => setShowPantonePicker(lineItemId)}
                          showPantonePicker={showPantonePicker}
                          setShowPantonePicker={setShowPantonePicker}
                          latestUpdate={latestUpdate}
                          onAssign={(assignment) => createPantoneAssignmentMutation.mutate(assignment)}
                        />
                      )}
                      {activeModule === 'documents' && (
                        <DocumentsModule
                          key="documents"
                          manufacturing={manufacturing}
                          canEdit={canEdit}
                          latestUpdate={latestUpdate}
                          setSelectedImage={setSelectedImage}
                        />
                      )}
                      {activeModule === 'activity' && (
                        <ActivityModule
                          key="activity"
                          manufacturingUpdates={manufacturingUpdates}
                          manufacturing={manufacturing}
                        />
                      )}
                      {activeModule === 'materials' && (
                        <MaterialsModule
                          key="materials"
                          manufacturing={manufacturing}
                          canEdit={canEdit}
                        />
                      )}
                      {activeModule === 'qc' && (
                        <QCModule
                          key="qc"
                          manufacturing={manufacturing}
                          canEdit={canEdit}
                        />
                      )}
                      {activeModule === 'timeline' && (
                        <TimelineModule
                          key="timeline"
                          manufacturing={manufacturing}
                          manufacturingUpdates={manufacturingUpdates}
                          order={order}
                        />
                      )}
                      {activeModule === 'shipping' && (
                        <ShippingModule
                          key="shipping"
                          manufacturing={manufacturing}
                          order={order}
                          organization={organization}
                          orderTrackingNumbers={orderTrackingNumbers}
                        />
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ========== FOOTER ========== */}
                  <div className="p-4 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-white/40">
                      Last updated: {manufacturing.updatedAt ? format(new Date(manufacturing.updatedAt), 'MMM d, yyyy h:mm a') : 'Never'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-white/60 border-white/20">
                        ID: {manufacturing.id}
                      </Badge>
                      {order?.orderCode && (
                        <Badge variant="outline" className="text-neon-blue border-neon-blue/30">
                          Order: {order.orderCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                </>
              )}
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
            <AlertDialogTitle className="text-white">Delete Manufacturing Record</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete manufacturing record <span className="font-semibold text-white">M-{manufacturingId}</span>?
              This action cannot be undone.
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
              onClick={() => deleteManufacturingMutation.mutate()}
              disabled={deleteManufacturingMutation.isPending}
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
              data-testid="button-confirm-delete"
            >
              {deleteManufacturingMutation.isPending ? "Deleting..." : "Delete Record"}
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
  manufacturing,
  order,
  organization,
  manufacturer,
  isEditing,
  formData,
  setFormData,
  orderTrackingNumbers,
  pantoneAssignments,
  latestUpdate,
  canEdit,
}: {
  manufacturing: any;
  order: any;
  organization: any;
  manufacturer: any;
  isEditing: boolean;
  formData: any;
  setFormData: (data: any) => void;
  orderTrackingNumbers: any[];
  pantoneAssignments: any[];
  latestUpdate: any;
  canEdit: boolean;
}) {
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const statusOptions = [
    { value: 'awaiting_admin_confirmation', label: 'Awaiting Admin Confirmation' },
    { value: 'confirmed_awaiting_manufacturing', label: 'Confirmed - Awaiting Manufacturing' },
    { value: 'cutting_sewing', label: 'Cutting & Sewing' },
    { value: 'printing', label: 'Printing' },
    { value: 'final_packing_press', label: 'Final Packing & Press' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'complete', label: 'Complete' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Key Status Header */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-neon-cyan/5 border border-white/10">
        <div className="flex flex-wrap gap-3">
          {/* Status */}
          <div className="flex-1 min-w-[150px] text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Status</div>
            {isEditing ? (
              <Select value={formData.status} onValueChange={(v) => handleFormChange('status', v)}>
                <SelectTrigger className="w-full h-8 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className={cn(
                "inline-block px-3 py-1.5 rounded-full text-sm font-medium border",
                MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.bgClass,
                MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.textClass,
                MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.borderClass
              )}>
                {MANUFACTURING_STATUS_CONFIG[manufacturing.status as ManufacturingStatus]?.label || manufacturing.status}
              </div>
            )}
          </div>

          {/* Manufacturer */}
          <div className="flex-1 min-w-[150px] text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Manufacturer</div>
            <div className="flex items-center justify-center gap-2 overflow-hidden">
              <Factory className="w-4 h-4 text-neon-purple flex-shrink-0" />
              <span className="text-sm text-white font-medium truncate">
                {manufacturer?.name || 'Not assigned'}
              </span>
            </div>
          </div>

          {/* Est. Completion */}
          <div className="flex-1 min-w-[150px] text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Est. Completion</div>
            <div className="flex items-center justify-center gap-2 overflow-hidden">
              <Calendar className="w-4 h-4 text-neon-cyan flex-shrink-0" />
              <span className={cn(
                "text-sm font-medium truncate",
                manufacturing.estCompletion && new Date(manufacturing.estCompletion) < new Date() ? "text-red-400" : "text-white"
              )}>
                {manufacturing.estCompletion ? format(new Date(manufacturing.estCompletion), 'MMM d, yyyy') : 'Not set'}
              </span>
            </div>
          </div>

          {/* Duration */}
          <div className="flex-1 min-w-[150px] text-center p-3 rounded-lg bg-white/5">
            <div className="text-xs text-white/50 uppercase font-medium mb-2">Duration</div>
            <div className="flex items-center justify-center gap-2 overflow-hidden">
              <Clock className="w-4 h-4 text-white/60 flex-shrink-0" />
              <span className="text-sm text-white font-medium truncate">
                {manufacturing.createdAt
                  ? `${Math.ceil((new Date().getTime() - new Date(manufacturing.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`
                  : '—'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pantone Summary */}
      {pantoneAssignments.length > 0 && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-neon-purple" />
            Pantone Colors ({pantoneAssignments.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {pantoneAssignments.slice(0, 8).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
              >
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: p.hexValue }}
                />
                <span className="text-xs text-white font-medium">{p.pantoneCode}</span>
                <span className="text-xs text-white/50">{p.usageLocation}</span>
              </div>
            ))}
            {pantoneAssignments.length > 8 && (
              <div className="px-3 py-1.5 text-xs text-white/50">
                +{pantoneAssignments.length - 8} more
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0 max-w-full">
        {/* Order & Organization Details */}
        <CollapsibleSection title="Order Details" icon={Package} defaultOpen={true}>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-0 overflow-hidden">
            <div className="space-y-2">
              <InfoRow label="Order Code" value={order?.orderCode} icon={Package} />
              <InfoRow label="Order Name" value={order?.orderName} icon={FileText} />
              <InfoRow label="Organization" value={organization?.name} icon={Building2} />
              <InfoRow label="Est. Delivery" value={order?.estDelivery ? format(new Date(order.estDelivery), 'MMM d, yyyy') : '—'} icon={Calendar} />
            </div>
          </div>
        </CollapsibleSection>

        {/* Timeline */}
        <CollapsibleSection title="Timeline" icon={Clock} defaultOpen={true}>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-0 overflow-hidden">
            <div className="space-y-2">
              <InfoRow label="Created" value={format(new Date(manufacturing.createdAt), 'MMM d, yyyy')} icon={Calendar} />
              <InfoRow label="Est. Completion" value={manufacturing.estCompletion ? format(new Date(manufacturing.estCompletion), 'MMM d, yyyy') : '—'} icon={Calendar} />
              {isEditing ? (
                <div className="pt-2">
                  <Label className="text-xs text-white/50">Actual Completion</Label>
                  <Input
                    type="date"
                    value={formData.actualCompletion || ''}
                    onChange={(e) => handleFormChange('actualCompletion', e.target.value)}
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
              ) : (
                <InfoRow label="Actual Completion" value={manufacturing.actualCompletion ? format(new Date(manufacturing.actualCompletion), 'MMM d, yyyy') : '—'} icon={CheckCircle2} />
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Tracking */}
        <CollapsibleSection title="Tracking" icon={Truck} defaultOpen={false}>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-0 overflow-hidden">
            {orderTrackingNumbers.length > 0 && (
              <div className="mb-3">
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  {orderTrackingNumbers.length} tracking number{orderTrackingNumbers.length > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-white/50">Tracking Number</Label>
                  <Input
                    value={formData.trackingNumber || ''}
                    onChange={(e) => handleFormChange('trackingNumber', e.target.value)}
                    placeholder="Enter tracking number"
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/50">Carrier</Label>
                  <Select value={formData.carrierCompany} onValueChange={(v) => handleFormChange('carrierCompany', v)}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="Manufacturing Team">Manufacturing Team (Local)</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : orderTrackingNumbers.length > 0 ? (
              <div className="space-y-2">
                {orderTrackingNumbers.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <div>
                      <span className="text-sm text-white font-mono">{t.trackingNumber}</span>
                      <span className="text-xs text-white/50 ml-2">{t.carrierCompany}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No tracking numbers yet</p>
            )}
          </div>
        </CollapsibleSection>

        {/* Notes */}
        <CollapsibleSection title="Notes" icon={MessageSquare} defaultOpen={false}>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 min-w-0 overflow-hidden">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-white/50">Production Notes</Label>
                  <Textarea
                    value={formData.productionNotes || ''}
                    onChange={(e) => handleFormChange('productionNotes', e.target.value)}
                    placeholder="Add production notes..."
                    className="mt-1 bg-white/5 border-white/10 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/50">Quality Notes</Label>
                  <Textarea
                    value={formData.qualityNotes || ''}
                    onChange={(e) => handleFormChange('qualityNotes', e.target.value)}
                    placeholder="Add quality notes..."
                    className="mt-1 bg-white/5 border-white/10 min-h-[80px]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-white/40 mb-1">Production Notes</div>
                  <p className="text-sm text-white">{manufacturing.productionNotes || 'No production notes'}</p>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Quality Notes</div>
                  <p className="text-sm text-white">{manufacturing.qualityNotes || 'No quality notes'}</p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      {/* First Piece Approval Panel - Show when status is cutting_sewing or later */}
      {latestUpdate && ['cutting_sewing', 'printing', 'final_packing_press', 'shipped', 'complete'].includes(manufacturing.status) && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neon-blue" />
            First Piece Approval
          </h3>
          <FirstPieceApprovalPanel
            manufacturingId={manufacturing.id}
            firstPieceStatus={latestUpdate.firstPieceStatus || 'pending'}
            firstPieceImageUrls={latestUpdate.firstPieceImageUrls}
            firstPieceUploadedAt={latestUpdate.firstPieceUploadedAt}
            firstPieceUploadedBy={latestUpdate.firstPieceUploadedByUser?.firstName || latestUpdate.firstPieceUploadedByUser?.email}
            firstPieceApprovedAt={latestUpdate.firstPieceApprovedAt}
            firstPieceApprovedBy={latestUpdate.firstPieceApprovedByUser?.firstName || latestUpdate.firstPieceApprovedByUser?.email}
            firstPieceRejectionNotes={latestUpdate.firstPieceRejectionNotes}
            canUpload={canEdit}
            canApprove={canEdit}
          />
        </div>
      )}

      {/* Fabric Submissions are managed at the line item level in the Line Items module */}
    </motion.div>
  );
}

function LineItemsModule({
  manufacturingLineItems,
  expandedItems,
  toggleItem,
  setSelectedImage,
  isLoading,
  latestUpdate,
  canEdit,
  refreshLineItemsMutation,
  onPantoneClick,
  editingDescriptors,
  setEditingDescriptors,
  newDescriptor,
  setNewDescriptor,
  editingLineItemId,
  setEditingLineItemId,
  editedItemName,
  setEditedItemName,
  handleAddDescriptor,
  handleRemoveDescriptor,
  handleSaveItemName,
  updateDescriptorsMutation,
}: {
  manufacturingLineItems: any[];
  expandedItems: Set<number>;
  toggleItem: (id: number) => void;
  setSelectedImage: (url: string) => void;
  isLoading: boolean;
  latestUpdate: any;
  canEdit: boolean;
  refreshLineItemsMutation: any;
  onPantoneClick: (lineItemId: number) => void;
  editingDescriptors: number | null;
  setEditingDescriptors: (id: number | null) => void;
  newDescriptor: string;
  setNewDescriptor: (value: string) => void;
  editingLineItemId: number | null;
  setEditingLineItemId: (id: number | null) => void;
  editedItemName: string;
  setEditedItemName: (value: string) => void;
  handleAddDescriptor: (lineItemId: number, currentDescriptors: string[]) => void;
  handleRemoveDescriptor: (lineItemId: number, currentDescriptors: string[], index: number) => void;
  handleSaveItemName: (lineItemId: number) => void;
  updateDescriptorsMutation: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-neon-blue" />
          Line Items ({manufacturingLineItems.length})
        </h3>
        {canEdit && latestUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshLineItemsMutation.mutate()}
            disabled={refreshLineItemsMutation.isPending}
            className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCcw className={cn("w-4 h-4", refreshLineItemsMutation.isPending && "animate-spin")} />
            {refreshLineItemsMutation.isPending ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
        </div>
      ) : manufacturingLineItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-white/60">No line items found</p>
          <p className="text-sm text-white/40">Line items will appear here once the manufacturing update is initialized</p>
        </div>
      ) : (
        <div className="space-y-3">
          {manufacturingLineItems.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            const displayName = item.productName && item.variantCode
              ? `${item.productName} - ${item.variantCode}`
              : item.productName || item.variantCode || `Line Item ${index + 1}`;

            const sizeBreakdown = {
              YXS: item.yxs || 0,
              YS: item.ys || 0,
              YM: item.ym || 0,
              YL: item.yl || 0,
              XS: item.xs || 0,
              S: item.s || 0,
              M: item.m || 0,
              L: item.l || 0,
              XL: item.xl || 0,
              '2XL': item.xxl || 0,
              '3XL': item.xxxl || 0,
            };

            const totalQty = Object.values(sizeBreakdown).reduce((sum, qty) => sum + qty, 0);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <Collapsible open={isExpanded} onOpenChange={() => toggleItem(item.id)}>
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      {item.imageUrl && (
                        <div
                          className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-neon-blue/50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(item.imageUrl);
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-white">{displayName}</h4>
                        <p className="text-xs text-white/50">{item.variantColor || 'No color specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-white/60 border-white/20">
                        {totalQty} units
                      </Badge>
                      <Badge
                        className={cn(
                          "flex items-center gap-1",
                          item.manufacturerCompleted
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        )}
                      >
                        {item.manufacturerCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Complete
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            In Progress
                          </>
                        )}
                      </Badge>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-white/40 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 pt-0 border-t border-white/10 space-y-4">
                      {/* Product Name Editing */}
                      {canEdit && (
                        <div className="border-b border-white/10 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/50 flex items-center gap-1.5">
                              <Pencil className="w-3 h-3" />
                              Product Name
                            </p>
                            {editingLineItemId === item.orderLineItemId ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-green-400 hover:text-green-300"
                                  onClick={() => handleSaveItemName(item.orderLineItemId)}
                                  data-testid={`button-save-name-${item.id}`}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-red-400 hover:text-red-300"
                                  onClick={() => {
                                    setEditingLineItemId(null);
                                    setEditedItemName("");
                                  }}
                                  data-testid={`button-cancel-name-${item.id}`}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-white/60 hover:text-white"
                                onClick={() => {
                                  setEditingLineItemId(item.orderLineItemId);
                                  setEditedItemName(item.productName || "");
                                }}
                                data-testid={`button-edit-name-${item.id}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {editingLineItemId === item.orderLineItemId ? (
                            <Input
                              value={editedItemName}
                              onChange={(e) => setEditedItemName(e.target.value)}
                              placeholder="Enter product name"
                              className="bg-white/5 border-white/10 text-sm"
                              data-testid={`input-name-${item.id}`}
                            />
                          ) : (
                            <p className="text-sm text-white">{item.productName || 'No product name'}</p>
                          )}
                        </div>
                      )}

                      {/* Descriptors Section */}
                      <div className="border-b border-white/10 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-white/50 flex items-center gap-1.5">
                            <Layers className="w-3 h-3" />
                            Descriptors
                          </p>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-white/60 hover:text-white"
                              onClick={() => setEditingDescriptors(editingDescriptors === item.id ? null : item.id)}
                              data-testid={`button-toggle-descriptors-${item.id}`}
                            >
                              {editingDescriptors === item.id ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            </Button>
                          )}
                        </div>
                        {item.descriptors && item.descriptors.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.descriptors.map((desc: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs text-white/80 border-white/20 flex items-center gap-1"
                              >
                                {desc}
                                {canEdit && (
                                  <button
                                    onClick={() => handleRemoveDescriptor(item.id, item.descriptors, idx)}
                                    className="ml-1 hover:text-red-400"
                                    data-testid={`button-remove-descriptor-${item.id}-${idx}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {editingDescriptors === item.id && (
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={newDescriptor}
                              onChange={(e) => setNewDescriptor(e.target.value)}
                              placeholder="Add descriptor..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newDescriptor.trim()) {
                                  handleAddDescriptor(item.id, item.descriptors || []);
                                }
                              }}
                              className="text-xs h-8 bg-white/5 border-white/10"
                              data-testid={`input-new-descriptor-${item.id}`}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={() => handleAddDescriptor(item.id, item.descriptors || [])}
                              disabled={!newDescriptor.trim()}
                              data-testid={`button-add-descriptor-${item.id}`}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                        {(!item.descriptors || item.descriptors.length === 0) && editingDescriptors !== item.id && (
                          <p className="text-xs text-white/40">No descriptors</p>
                        )}
                      </div>

                      {/* Size Breakdown */}
                      <div>
                        <p className="text-xs text-white/50 mb-2">Size Breakdown</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(sizeBreakdown).map(([size, qty]) => (
                            qty > 0 && (
                              <Badge key={size} variant="outline" className="text-xs text-white/80 border-white/20">
                                {size}: {qty}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPantoneClick(item.orderLineItemId || item.id)}
                          className="flex items-center gap-2 bg-neon-purple/10 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/20"
                        >
                          <Palette className="w-4 h-4" />
                          Add Pantone
                        </Button>
                        {item.imageUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImage(item.imageUrl)}
                            className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                          >
                            <ZoomIn className="w-4 h-4" />
                            View Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function PantoneModule({
  pantoneAssignments,
  manufacturingLineItems,
  canEdit,
  onDelete,
  onAddClick,
  showPantonePicker,
  setShowPantonePicker,
  latestUpdate,
  onAssign,
}: {
  pantoneAssignments: any[];
  manufacturingLineItems: any[];
  canEdit: boolean;
  onDelete: (id: number) => void;
  onAddClick: (lineItemId: number) => void;
  showPantonePicker: number | null;
  setShowPantonePicker: (id: number | null) => void;
  latestUpdate: any;
  onAssign: (assignment: PantoneAssignment & { lineItemId: number }) => void;
}) {
  const lineItemImages = manufacturingLineItems
    .filter((item) => item.imageUrl)
    .map((item) => item.imageUrl);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-neon-purple" />
          Pantone Colors ({pantoneAssignments.length})
        </h3>
      </div>

      {/* Pantone Picker Modal */}
      {showPantonePicker !== null && (
        <div className="p-4 rounded-xl bg-white/5 border border-neon-purple/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white">Add Pantone Color</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPantonePicker(null)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <PantonePicker
            lineItemImages={lineItemImages}
            onAssign={(assignment) => {
              onAssign({ ...assignment, lineItemId: showPantonePicker });
            }}
            mode="wizard"
          />
        </div>
      )}

      {/* Pantone Assignments List */}
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
        canEdit={canEdit}
        isEditing={false}
        onDelete={onDelete}
        onAddClick={() => {
          if (manufacturingLineItems.length > 0) {
            onAddClick(manufacturingLineItems[0].orderLineItemId || manufacturingLineItems[0].id);
          }
        }}
        variant="full"
      />

      {/* Line Items for Adding Pantones */}
      {canEdit && !showPantonePicker && manufacturingLineItems.length > 0 && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4">Add Pantone to Line Item</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 max-w-full">
            {manufacturingLineItems.map((item) => {
              const displayName = item.productName && item.variantCode
                ? `${item.productName} - ${item.variantCode}`
                : item.productName || item.variantCode || 'Line Item';

              return (
                <button
                  key={item.id}
                  onClick={() => onAddClick(item.orderLineItemId || item.id)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-neon-purple/30 hover:bg-neon-purple/5 transition-colors text-left min-w-0 overflow-hidden"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-lg object-cover border border-white/10"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{displayName}</p>
                    <p className="text-xs text-white/50">{item.variantColor || 'No color'}</p>
                  </div>
                  <Plus className="w-4 h-4 text-neon-purple" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function DocumentsModule({
  manufacturing,
  canEdit,
  latestUpdate,
  setSelectedImage,
}: {
  manufacturing: any;
  canEdit: boolean;
  latestUpdate: any;
  setSelectedImage: (url: string) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("logos");

  const completedImages = manufacturing.completedProductImages || [];

  const categories = [
    { value: "logos", label: "Logos", icon: ImageIcon },
    { value: "psds", label: "PSDs", icon: FileText },
    { value: "mockups", label: "Mockups", icon: ImageIcon },
    { value: "production_files", label: "Production Files", icon: FileText },
    { value: "other", label: "Other", icon: FileText },
  ];

  // Fetch attachments for this manufacturing record
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery<any[]>({
    queryKey: ['/api/manufacturing', latestUpdate?.id, 'attachments'],
    queryFn: async () => {
      if (!latestUpdate?.id) return [];
      const response = await fetch(`/api/manufacturing/${latestUpdate.id}/attachments`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!latestUpdate?.id,
  });

  const filteredAttachments = attachments.filter((att: any) => att.category === selectedCategory);

  const getAllowedFileTypes = () => {
    switch (selectedCategory) {
      case 'psds':
        return ['.psd', '.psb', 'image/vnd.adobe.photoshop', 'application/x-photoshop'];
      case 'logos':
        return ['image/*', '.zip', 'application/zip', 'application/x-zip-compressed'];
      case 'mockups':
        return ['image/*'];
      case 'production_files':
        return ['image/*', '.pdf', 'application/pdf', '.zip', 'application/zip'];
      case 'other':
        return ['image/*', '.pdf', 'application/pdf', '.zip', 'application/zip', '.doc', '.docx'];
      default:
        return ['image/*', '.pdf', '.zip'];
    }
  };

  const updateCompletedImagesMutation = useMutation({
    mutationFn: async (images: string[]) => {
      const response = await fetch(`/api/manufacturing/${manufacturing.id}/completed-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completedProductImages: images }),
      });
      if (!response.ok) throw new Error('Failed to update completed images');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', manufacturing.id] });
      toast({ title: "Success", description: "Images updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update images", variant: "destructive" });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (data: { fileName: string; fileUrl: string; fileSize: number; fileType: string }) => {
      return apiRequest('POST', `/api/manufacturing/${latestUpdate.id}/attachments`, {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        category: selectedCategory,
        fileSize: data.fileSize,
        fileType: data.fileType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', latestUpdate?.id, 'attachments'] });
      toast({ title: "Success", description: "File uploaded successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return apiRequest('DELETE', `/api/manufacturing/attachments/${attachmentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', latestUpdate?.id, 'attachments'] });
      toast({ title: "Success", description: "File deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
    },
  });

  const isImageFile = (fileType: string) => fileType?.startsWith('image/');

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Paperclip className="w-5 h-5 text-neon-cyan" />
        Documents & Images
      </h3>

      {/* File Categories */}
      {latestUpdate && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4">File Categories</h4>
          <div className="flex flex-wrap gap-2 min-w-0 max-w-full">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = attachments.filter((att: any) => att.category === cat.value).length;
              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  className={cn(
                    "flex flex-col h-auto py-3 flex-1 min-w-[60px] max-w-[100px]",
                    selectedCategory === cat.value
                      ? "bg-neon-blue/20 border-neon-blue text-neon-blue"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  )}
                  onClick={() => setSelectedCategory(cat.value)}
                  data-testid={`button-category-${cat.value}`}
                >
                  <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                  <span className="text-xs truncate">{cat.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs bg-white/10">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {canEdit && latestUpdate && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4">
            Upload {categories.find(c => c.value === selectedCategory)?.label}
          </h4>
          <ObjectUploader
            allowedFileTypes={getAllowedFileTypes()}
            maxNumberOfFiles={10}
            maxFileSize={104857600}
            onGetUploadParameters={async (file: any) => {
              try {
                const response = await apiRequest("POST", "/api/upload/file", {
                  filename: file.name,
                  size: file.size,
                  mimeType: file.type
                }) as any;
                file.__uploadId = response.uploadId;
                return { method: "PUT" as const, url: response.uploadURL };
              } catch (error) {
                console.error("Failed to get upload URL:", error);
                throw error;
              }
            }}
            onComplete={(result) => {
              result.successful?.forEach((file: any) => {
                const uploadId = file.__uploadId;
                if (uploadId) {
                  uploadAttachmentMutation.mutate({
                    fileName: file.name,
                    fileUrl: `/public-objects/${uploadId}`,
                    fileSize: file.size,
                    fileType: file.type,
                  });
                }
              });
            }}
            buttonClassName="w-full"
          >
            <div className="flex items-center justify-center gap-2 py-2" data-testid={`uploader-${selectedCategory}`}>
              <Upload className="w-4 h-4" />
              Upload {categories.find(c => c.value === selectedCategory)?.label}
            </div>
          </ObjectUploader>
        </div>
      )}

      {/* Files List */}
      {latestUpdate && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-semibold text-white/80 mb-4">
            {categories.find(c => c.value === selectedCategory)?.label} ({filteredAttachments.length})
          </h4>
          {attachmentsLoading ? (
            <div className="text-center py-8 text-white/50">
              <p className="text-sm">Loading files...</p>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No {categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  data-testid={`file-${attachment.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isImageFile(attachment.fileType) ? (
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-10 h-10 object-cover rounded cursor-pointer border border-white/10"
                        onClick={() => setSelectedImage(attachment.fileUrl)}
                        data-testid={`img-preview-${attachment.id}`}
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-white/40" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{attachment.fileName}</p>
                      <p className="text-xs text-white/50">
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                      data-testid={`button-download-${attachment.id}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
                        onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                        data-testid={`button-delete-${attachment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Product Images */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-neon-blue" />
          Completed Product Images ({completedImages.length})
        </h4>

        {canEdit && (
          <div className="mb-4">
            <ObjectUploader
              maxNumberOfFiles={10}
              maxFileSize={10485760}
              onGetUploadParameters={async (file: any) => {
                try {
                  const response = await apiRequest("POST", "/api/upload/image", {
                    filename: file.name,
                    size: file.size,
                    mimeType: file.type
                  }) as any;
                  file.__uploadId = response.uploadId;
                  return { method: "PUT" as const, url: response.uploadURL };
                } catch (error) {
                  console.error("Failed to get upload URL:", error);
                  throw error;
                }
              }}
              onComplete={(result) => {
                const uploadedUrls = result.successful?.map((file: any) => {
                  const uploadId = file.__uploadId;
                  return uploadId ? `/public-objects/${uploadId}` : null;
                }).filter(Boolean) || [];
                updateCompletedImagesMutation.mutate([...completedImages, ...uploadedUrls]);
              }}
              buttonClassName="w-full"
            >
              <div className="flex items-center justify-center gap-2 py-2" data-testid="uploader-completed-images">
                <Upload className="w-4 h-4" />
                Upload Completed Product Images
              </div>
            </ObjectUploader>
          </div>
        )}

        {completedImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 min-w-0 max-w-full">
            {completedImages.map((url: string, index: number) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 min-w-0">
                <img
                  src={url}
                  alt={`Completed ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setSelectedImage(url)}
                  data-testid={`img-completed-${index}`}
                />
                {canEdit && (
                  <button
                    onClick={() => {
                      const newImages = completedImages.filter((_: string, i: number) => i !== index);
                      updateCompletedImagesMutation.mutate(newImages);
                    }}
                    className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    data-testid={`button-remove-completed-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-white/50">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No completed product images uploaded yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ActivityModule({
  manufacturingUpdates,
  manufacturing,
}: {
  manufacturingUpdates: any[];
  manufacturing: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-neon-cyan" />
        Activity History
      </h3>

      <div className="space-y-3">
        {manufacturingUpdates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/60">No activity history yet</p>
          </div>
        ) : (
          manufacturingUpdates.map((update: any, index: number) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    MANUFACTURING_STATUS_CONFIG[update.status as ManufacturingStatus]?.bgClass || "bg-white/10"
                  )}>
                    <Clock className={cn(
                      "w-4 h-4",
                      MANUFACTURING_STATUS_CONFIG[update.status as ManufacturingStatus]?.textClass || "text-white/60"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Status changed to {MANUFACTURING_STATUS_CONFIG[update.status as ManufacturingStatus]?.label || update.status}
                    </p>
                    {update.notes && (
                      <p className="text-sm text-white/60 mt-1">{update.notes}</p>
                    )}
                    <p className="text-xs text-white/40 mt-2">
                      {format(new Date(update.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function MaterialsModule({
  manufacturing,
  canEdit,
}: {
  manufacturing: any;
  canEdit: boolean;
}) {
  const [checklist, setChecklist] = useState([
    { id: 1, category: 'Fabric', item: 'Main Fabric', status: 'received', checked: true },
    { id: 2, category: 'Fabric', item: 'Lining Fabric', status: 'pending', checked: false },
    { id: 3, category: 'Thread', item: 'Primary Thread Color', status: 'received', checked: true },
    { id: 4, category: 'Thread', item: 'Contrast Thread Color', status: 'ordered', checked: false },
    { id: 5, category: 'Labels', item: 'Brand Labels', status: 'pending', checked: false },
    { id: 6, category: 'Labels', item: 'Size Tags', status: 'received', checked: true },
    { id: 7, category: 'Labels', item: 'Care Labels', status: 'received', checked: true },
    { id: 8, category: 'Packaging', item: 'Polybags', status: 'ordered', checked: false },
    { id: 9, category: 'Packaging', item: 'Cartons', status: 'pending', checked: false },
    { id: 10, category: 'Packaging', item: 'Tissue Paper', status: 'received', checked: true },
  ]);

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ordered': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  const categories = ['Fabric', 'Thread', 'Labels', 'Packaging'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
      data-testid="module-materials"
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-neon-blue" />
        Materials Checklist
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 max-w-full">
        {categories.map((category) => (
          <div
            key={category}
            className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 overflow-hidden"
            data-testid={`materials-category-${category.toLowerCase()}`}
          >
            <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
              {category === 'Fabric' && <Ruler className="w-4 h-4 text-neon-purple" />}
              {category === 'Thread' && <Circle className="w-4 h-4 text-neon-cyan" />}
              {category === 'Labels' && <Tag className="w-4 h-4 text-neon-blue" />}
              {category === 'Packaging' && <Box className="w-4 h-4 text-neon-green" />}
              {category}
            </h4>
            <div className="space-y-2">
              {checklist.filter(item => item.category === category).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  data-testid={`material-item-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => canEdit && toggleCheck(item.id)}
                      disabled={!canEdit}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        item.checked
                          ? "bg-green-500/30 border-green-500 text-green-400"
                          : "bg-white/5 border-white/30 text-transparent hover:border-white/50"
                      )}
                      data-testid={`checkbox-${item.id}`}
                    >
                      {item.checked && <CheckCircle className="w-3 h-3" />}
                    </button>
                    <span className={cn(
                      "text-sm",
                      item.checked ? "text-white/60 line-through" : "text-white"
                    )}>
                      {item.item}
                    </span>
                  </div>
                  <Badge
                    className={cn("text-xs capitalize", getStatusColor(item.status))}
                    data-testid={`status-${item.id}`}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-neon-cyan/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            <span className="text-white font-semibold">{checklist.filter(i => i.checked).length}</span> of {checklist.length} materials ready
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="text-xs text-white/60">Received ({checklist.filter(i => i.status === 'received').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <span className="text-xs text-white/60">Pending ({checklist.filter(i => i.status === 'pending').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/50" />
              <span className="text-xs text-white/60">Ordered ({checklist.filter(i => i.status === 'ordered').length})</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QCModule({
  manufacturing,
  canEdit,
}: {
  manufacturing: any;
  canEdit: boolean;
}) {
  const [qcChecklist, setQcChecklist] = useState({
    preProduction: [
      { id: 1, item: 'Pattern accuracy verified', checked: false },
      { id: 2, item: 'Fabric quality approved', checked: true },
      { id: 3, item: 'Color matching confirmed', checked: true },
      { id: 4, item: 'Measurements validated', checked: false },
    ],
    inProcess: [
      { id: 5, item: 'Seam quality check', checked: true },
      { id: 6, item: 'Stitch density verified', checked: false },
      { id: 7, item: 'Print alignment checked', checked: false },
      { id: 8, item: 'Thread tension correct', checked: true },
    ],
    finalInspection: [
      { id: 9, item: 'Final measurements', checked: false },
      { id: 10, item: 'Label placement correct', checked: false },
      { id: 11, item: 'No visible defects', checked: false },
      { id: 12, item: 'Packaging complete', checked: false },
    ],
  });

  const [defects, setDefects] = useState([
    { id: 1, type: 'Stitch Issue', severity: 'minor', notes: 'Minor loose stitching on collar - resolved', resolved: true },
    { id: 2, type: 'Color Variation', severity: 'minor', notes: 'Slight shade difference in batch 2', resolved: false },
  ]);

  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const toggleCheck = (section: keyof typeof qcChecklist, id: number) => {
    setQcChecklist(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const allChecks = [...qcChecklist.preProduction, ...qcChecklist.inProcess, ...qcChecklist.finalInspection];
  const checkedCount = allChecks.filter(c => c.checked).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
      data-testid="module-qc"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-neon-green" />
          Quality Control
        </h3>
        <Badge
          className={cn(
            "px-3 py-1.5",
            approvalStatus === 'approved' && "bg-green-500/20 text-green-400 border-green-500/30",
            approvalStatus === 'pending' && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            approvalStatus === 'rejected' && "bg-red-500/20 text-red-400 border-red-500/30"
          )}
          data-testid="qc-approval-status"
        >
          {approvalStatus === 'approved' && <CheckCircle2 className="w-4 h-4 mr-1" />}
          {approvalStatus === 'pending' && <Clock className="w-4 h-4 mr-1" />}
          {approvalStatus === 'rejected' && <AlertCircle className="w-4 h-4 mr-1" />}
          {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0 max-w-full">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 overflow-hidden" data-testid="qc-section-pre-production">
          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-neon-blue flex-shrink-0" />
            Pre-Production
          </h4>
          <div className="space-y-2">
            {qcChecklist.preProduction.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                data-testid={`qc-item-${item.id}`}
              >
                <button
                  onClick={() => canEdit && toggleCheck('preProduction', item.id)}
                  disabled={!canEdit}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    item.checked
                      ? "bg-green-500/30 border-green-500 text-green-400"
                      : "bg-white/5 border-white/30"
                  )}
                  data-testid={`qc-checkbox-${item.id}`}
                >
                  {item.checked && <CheckCircle className="w-3 h-3" />}
                </button>
                <span className={cn("text-sm", item.checked ? "text-white/60" : "text-white")}>
                  {item.item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 overflow-hidden" data-testid="qc-section-in-process">
          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
            <Factory className="w-4 h-4 text-neon-purple flex-shrink-0" />
            In-Process
          </h4>
          <div className="space-y-2">
            {qcChecklist.inProcess.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                data-testid={`qc-item-${item.id}`}
              >
                <button
                  onClick={() => canEdit && toggleCheck('inProcess', item.id)}
                  disabled={!canEdit}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    item.checked
                      ? "bg-green-500/30 border-green-500 text-green-400"
                      : "bg-white/5 border-white/30"
                  )}
                  data-testid={`qc-checkbox-${item.id}`}
                >
                  {item.checked && <CheckCircle className="w-3 h-3" />}
                </button>
                <span className={cn("text-sm", item.checked ? "text-white/60" : "text-white")}>
                  {item.item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 overflow-hidden" data-testid="qc-section-final-inspection">
          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neon-cyan flex-shrink-0" />
            Final Inspection
          </h4>
          <div className="space-y-2">
            {qcChecklist.finalInspection.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                data-testid={`qc-item-${item.id}`}
              >
                <button
                  onClick={() => canEdit && toggleCheck('finalInspection', item.id)}
                  disabled={!canEdit}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    item.checked
                      ? "bg-green-500/30 border-green-500 text-green-400"
                      : "bg-white/5 border-white/30"
                  )}
                  data-testid={`qc-checkbox-${item.id}`}
                >
                  {item.checked && <CheckCircle className="w-3 h-3" />}
                </button>
                <span className={cn("text-sm", item.checked ? "text-white/60" : "text-white")}>
                  {item.item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 max-w-full overflow-hidden" data-testid="qc-defects-section">
        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          Defect Tracking ({defects.length})
        </h4>
        {defects.length === 0 ? (
          <p className="text-sm text-white/50">No defects recorded</p>
        ) : (
          <div className="space-y-2">
            {defects.map((defect) => (
              <div
                key={defect.id}
                className={cn(
                  "p-3 rounded-lg border",
                  defect.resolved
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-yellow-500/5 border-yellow-500/20"
                )}
                data-testid={`defect-${defect.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{defect.type}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs capitalize",
                        defect.severity === 'minor' ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {defect.severity}
                    </Badge>
                    {defect.resolved && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">Resolved</Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-white/60">{defect.notes}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-neon-green/5 via-neon-blue/5 to-neon-purple/5 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            <span className="text-white font-semibold">{checkedCount}</span> of {allChecks.length} checks completed
          </div>
          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-green to-neon-cyan"
              initial={{ width: 0 }}
              animate={{ width: `${(checkedCount / allChecks.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineModule({
  manufacturing,
  manufacturingUpdates,
  order,
}: {
  manufacturing: any;
  manufacturingUpdates: any[];
  order: any;
}) {
  const milestones = [
    {
      id: 1,
      label: 'Order Received',
      estimatedDate: manufacturing.createdAt,
      actualDate: manufacturing.createdAt,
      completed: true,
    },
    {
      id: 2,
      label: 'Production Started',
      estimatedDate: manufacturing.createdAt,
      actualDate: manufacturingUpdates.find((u: any) => u.status === 'confirmed_awaiting_manufacturing')?.createdAt,
      completed: ['confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'final_packing_press', 'shipped', 'complete'].includes(manufacturing.status),
    },
    {
      id: 3,
      label: 'Cutting & Sewing',
      estimatedDate: null,
      actualDate: manufacturingUpdates.find((u: any) => u.status === 'cutting_sewing')?.createdAt,
      completed: ['cutting_sewing', 'printing', 'final_packing_press', 'shipped', 'complete'].includes(manufacturing.status),
    },
    {
      id: 4,
      label: 'Printing',
      estimatedDate: null,
      actualDate: manufacturingUpdates.find((u: any) => u.status === 'printing')?.createdAt,
      completed: ['printing', 'final_packing_press', 'shipped', 'complete'].includes(manufacturing.status),
    },
    {
      id: 5,
      label: 'Final Packing',
      estimatedDate: null,
      actualDate: manufacturingUpdates.find((u: any) => u.status === 'final_packing_press')?.createdAt,
      completed: ['final_packing_press', 'shipped', 'complete'].includes(manufacturing.status),
    },
    {
      id: 6,
      label: 'Shipped',
      estimatedDate: manufacturing.estCompletion,
      actualDate: manufacturingUpdates.find((u: any) => u.status === 'shipped')?.createdAt,
      completed: ['shipped', 'complete'].includes(manufacturing.status),
    },
    {
      id: 7,
      label: 'Complete',
      estimatedDate: order?.estDelivery,
      actualDate: manufacturing.actualCompletion || manufacturingUpdates.find((u: any) => u.status === 'complete')?.createdAt,
      completed: manufacturing.status === 'complete',
    },
  ];

  const completedCount = milestones.filter(m => m.completed).length;
  const progressPercentage = (completedCount / milestones.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
      data-testid="module-timeline"
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Timer className="w-5 h-5 text-neon-purple" />
        Timeline Tracker
      </h3>

      <div className="p-4 rounded-xl bg-gradient-to-r from-neon-blue/5 via-neon-purple/5 to-neon-cyan/5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Overall Progress</span>
          <span className="text-sm font-semibold text-white">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4" data-testid="timeline-milestones">
        <h4 className="text-sm font-semibold text-white/80 mb-4">Milestones</h4>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-10"
                data-testid={`milestone-${milestone.id}`}
              >
                <div
                  className={cn(
                    "absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    milestone.completed
                      ? "bg-green-500/30 border-green-500 text-green-400"
                      : "bg-white/5 border-white/30"
                  )}
                >
                  {milestone.completed && <CheckCircle className="w-3 h-3" />}
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      milestone.completed ? "text-white" : "text-white/60"
                    )}>
                      {milestone.label}
                    </span>
                    {milestone.completed && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">Complete</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    {milestone.estimatedDate && (
                      <div className="flex items-center gap-1 text-white/50">
                        <Calendar className="w-3 h-3" />
                        Est: {format(new Date(milestone.estimatedDate), 'MMM d, yyyy')}
                      </div>
                    )}
                    {milestone.actualDate && (
                      <div className="flex items-center gap-1 text-neon-cyan">
                        <CheckCircle2 className="w-3 h-3" />
                        Actual: {format(new Date(milestone.actualDate), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4" data-testid="timeline-status-history">
        <h4 className="text-sm font-semibold text-white/80 mb-4">Status Transitions</h4>
        {manufacturingUpdates.length === 0 ? (
          <p className="text-sm text-white/50">No status transitions recorded yet</p>
        ) : (
          <div className="space-y-2">
            {manufacturingUpdates.slice(0, 5).map((update: any, index: number) => (
              <div
                key={update.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                data-testid={`status-transition-${update.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    MANUFACTURING_STATUS_CONFIG[update.status as ManufacturingStatus]?.textClass?.replace('text-', 'bg-') || "bg-white/40"
                  )} />
                  <span className="text-sm text-white">
                    {MANUFACTURING_STATUS_CONFIG[update.status as ManufacturingStatus]?.label || update.status}
                  </span>
                </div>
                <span className="text-xs text-white/50">
                  {format(new Date(update.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ShippingModule({
  manufacturing,
  order,
  organization,
  orderTrackingNumbers,
}: {
  manufacturing: any;
  order: any;
  organization: any;
  orderTrackingNumbers: any[];
}) {
  const shippingStatus = manufacturing.status === 'shipped' 
    ? 'in_transit' 
    : manufacturing.status === 'complete' 
      ? 'delivered' 
      : 'pending';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered': return { label: 'Delivered', bgClass: 'bg-green-500/20', textClass: 'text-green-400', borderClass: 'border-green-500/30' };
      case 'in_transit': return { label: 'In Transit', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400', borderClass: 'border-blue-500/30' };
      case 'pending': return { label: 'Pending', bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/30' };
      default: return { label: 'Unknown', bgClass: 'bg-white/10', textClass: 'text-white/60', borderClass: 'border-white/20' };
    }
  };

  const statusConfig = getStatusConfig(shippingStatus);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
      data-testid="module-shipping"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-neon-cyan" />
          Shipping Info
        </h3>
        <Badge
          className={cn("px-3 py-1.5", statusConfig.bgClass, statusConfig.textClass, statusConfig.borderClass)}
          data-testid="shipping-status"
        >
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0 max-w-full">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 overflow-hidden" data-testid="shipping-address">
          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neon-blue flex-shrink-0" />
            Ship-To Address
          </h4>
          {organization ? (
            <div className="space-y-2">
              <p className="text-sm text-white font-medium">{organization.name}</p>
              {organization.shippingAddress ? (
                <p className="text-sm text-white/70 whitespace-pre-line">{organization.shippingAddress}</p>
              ) : (
                <>
                  {organization.address && <p className="text-sm text-white/70">{organization.address}</p>}
                  <p className="text-sm text-white/70">
                    {[organization.city, organization.state, organization.zip].filter(Boolean).join(', ')}
                  </p>
                </>
              )}
              {organization.phone && (
                <p className="text-xs text-white/50 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {organization.phone}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-white/50">No shipping address available</p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 overflow-hidden" data-testid="shipping-dates">
          <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-neon-purple flex-shrink-0" />
            Delivery Dates
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/50">Estimated Completion</p>
              <p className="text-sm text-white">
                {manufacturing.estCompletion ? format(new Date(manufacturing.estCompletion), 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/50">Order Est. Delivery</p>
              <p className="text-sm text-white">
                {order?.estDelivery ? format(new Date(order.estDelivery), 'MMM d, yyyy') : 'Not set'}
              </p>
            </div>
            {manufacturing.actualCompletion && (
              <div>
                <p className="text-xs text-white/50">Actual Completion</p>
                <p className="text-sm text-neon-green">
                  {format(new Date(manufacturing.actualCompletion), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-w-0 max-w-full overflow-hidden" data-testid="shipping-tracking">
        <h4 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-neon-cyan flex-shrink-0" />
          Tracking Numbers ({orderTrackingNumbers.length})
        </h4>
        {orderTrackingNumbers.length === 0 ? (
          <div className="text-center py-6 text-white/50">
            <Truck className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No tracking numbers added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderTrackingNumbers.map((tracking: any) => (
              <div
                key={tracking.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                data-testid={`tracking-${tracking.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-mono text-white">{tracking.trackingNumber}</p>
                    <p className="text-xs text-white/50">{tracking.carrierCompany || 'Unknown Carrier'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-xs capitalize",
                      tracking.status === 'delivered' ? "bg-green-500/20 text-green-400" :
                      tracking.status === 'in_transit' ? "bg-blue-500/20 text-blue-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    )}
                  >
                    {tracking.status || 'Pending'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                    onClick={() => {
                      navigator.clipboard.writeText(tracking.trackingNumber);
                    }}
                    data-testid={`copy-tracking-${tracking.id}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {manufacturing.trackingNumber && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-neon-cyan/5 via-neon-blue/5 to-neon-purple/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
              <Truck className="w-6 h-6 text-neon-cyan" />
            </div>
            <div>
              <p className="text-xs text-white/50">Manufacturing Tracking</p>
              <p className="text-lg font-mono text-white">{manufacturing.trackingNumber}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
