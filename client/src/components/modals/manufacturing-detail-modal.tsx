import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Order, Organization, Manufacturer, ManufacturingUpdateLineItem, ManufacturingFinishedImage } from "@shared/schema";
import { CheckCircle2, Clock, Package, Printer, Scissors, Shirt, ShipIcon, AlertCircle, Upload, Calendar, User, Building2, Phone, Mail, FileText, Trash2, DollarSign, Image as ImageIcon, Plus, X, Pencil, Archive, ArchiveRestore, Download, FileArchive, PackageCheck, Truck, RefreshCcw, Copy, Edit2, Save, ChevronRight, StickyNote, MessageSquare, Ruler, Zap, AlertTriangle, Filter, List, LayoutGrid } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { FabricSubmissionForm, FabricStatusIndicator } from "@/components/FabricSubmissionForm";
import { PantonePicker, PantoneAssignment } from "@/components/manufacturing/pantone-picker";
import { FirstPieceApprovalPanel } from "@/components/manufacturing/FirstPieceApprovalPanel";
import { PantoneSummarySection, PantoneDisplayItem } from "@/components/shared/PantoneSummarySection";
import { Palette } from "lucide-react";

interface ManufacturingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  manufacturingUpdate: any;
}

// Icon mapping for dynamic stage loading
const iconMap: Record<string, any> = {
  Clock,
  PackageCheck,
  Scissors,
  Printer,
  Package,
  Truck,
  ShipIcon,
  CheckCircle2,
  AlertCircle,
};

interface ManufacturingStageConfig {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  allowedRoles: string[];
}

interface FinishedProductImagesProps {
  lineItemId: number;
  canEdit: boolean;
  onImageClick: (url: string) => void;
  createMutation: any;
  deleteMutation: any;
}

function FinishedProductImages({ lineItemId, canEdit, onImageClick, createMutation, deleteMutation }: FinishedProductImagesProps) {
  const { data: finishedImages = [], isLoading } = useQuery<ManufacturingFinishedImage[]>({
    queryKey: ['/api/manufacturing-line-items', lineItemId, 'finished-images'],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing-line-items/${lineItemId}/finished-images`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch finished images');
      return response.json();
    },
  });

  return (
    <div className="border-t pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          Finished Product Images
        </p>
      </div>
      
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading images...</div>
      ) : (
        <>
          {finishedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {finishedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div 
                    className="border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity aspect-square"
                    onClick={() => onImageClick(image.imageUrl)}
                  >
                    <img
                      src={image.imageUrl}
                      alt="Finished product"
                      className="w-full h-full object-cover"
                      data-testid={`img-finished-${image.id}`}
                    />
                  </div>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                      onClick={() => deleteMutation.mutate({ imageId: image.id, lineItemId })}
                      data-testid={`button-delete-finished-${image.id}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {canEdit && (
            <ObjectUploader
              allowedFileTypes={['image/*']}
              onGetUploadParameters={async (file: File) => {
                try {
                  const response = await apiRequest("POST", "/api/upload/image", {
                    filename: file.name,
                    size: file.size,
                    mimeType: file.type
                  }) as any;
                  (file as any).__uploadId = response.uploadId;
                  return { 
                    method: "PUT" as const, 
                    url: response.uploadURL,
                    headers: {
                      'Content-Type': file.type
                    }
                  };
                } catch (error) {
                  console.error("Failed to get upload URL:", error);
                  throw error;
                }
              }}
              onComplete={(result) => {
                if (result.successful?.[0]) {
                  const file = result.successful[0] as any;
                  const uploadId = file.__uploadId;
                  if (uploadId) {
                    createMutation.mutate({ lineItemId, imageUrl: uploadId });
                  }
                }
              }}
              buttonClassName="w-full"
            >
              <div className="flex items-center justify-center gap-2 text-xs" data-testid={`uploader-finished-${lineItemId}`}>
                <Upload className="w-3 h-3" />
                {finishedImages.length > 0 ? 'Add More Images' : 'Upload Finished Product'}
              </div>
            </ObjectUploader>
          )}
          
          {!canEdit && finishedImages.length === 0 && (
            <div className="text-xs text-muted-foreground">No finished product images</div>
          )}
        </>
      )}
    </div>
  );
}

export function ManufacturingDetailModal({ isOpen, onClose, manufacturingUpdate }: ManufacturingDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState(manufacturingUpdate?.status || "awaiting_admin_confirmation");
  const [productionNotes, setProductionNotes] = useState(manufacturingUpdate?.productionNotes || "");
  const [qualityNotes, setQualityNotes] = useState(manufacturingUpdate?.qualityNotes || "");
  const [trackingNumber, setTrackingNumber] = useState(manufacturingUpdate?.trackingNumber || "");
  const [carrierCompany, setCarrierCompany] = useState("");
  const [actualCompletionDate, setActualCompletionDate] = useState(manufacturingUpdate?.actualCompletion || "");
  const [editingDescriptors, setEditingDescriptors] = useState<number | null>(null);
  const [newDescriptor, setNewDescriptor] = useState("");
  const [editingLineItemId, setEditingLineItemId] = useState<number | null>(null);
  const [editedItemName, setEditedItemName] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [showPantonePicker, setShowPantonePicker] = useState<number | null>(null);
  
  // Track which manufacturing record we've initialized carrier for
  const carrierInitializedForId = useRef<number | null>(null);

  // Fetch manufacturing stages dynamically
  const { data: manufacturingStages = [] } = useQuery<ManufacturingStageConfig[]>({
    queryKey: ["/api/config/manufacturing-stages"],
    retry: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since stages rarely change
  });

  // Build statusSteps from dynamic data with proper color mapping
  const statusSteps = manufacturingStages.map(stage => {
    // Map hex colors to Tailwind classes (static mapping for Tailwind purge)
    const colorMap: Record<string, string> = {
      '#f59e0b': 'text-amber-500',
      '#3b82f6': 'text-blue-500',
      '#8b5cf6': 'text-purple-500',
      '#ec4899': 'text-pink-500',
      '#06b6d4': 'text-cyan-500',
      '#10b981': 'text-emerald-500',
      '#22c55e': 'text-green-500',
    };
    return {
      key: stage.value,
      label: stage.label,
      icon: iconMap[stage.icon] || Package,
      color: colorMap[stage.color] || 'text-gray-500',
      hexColor: stage.color
    };
  });

  // Get allowed status transitions based on user role
  // Shows ALL stages the user has permission for (not just future ones)
  const getAllowedStatusTransitions = (currentStatus: string, userRole: string) => {
    // Filter to show all stages where the user's role is in allowedRoles
    const allowedStages = manufacturingStages.filter(stage => 
      stage.allowedRoles.includes(userRole)
    );

    return statusSteps.filter(step => 
      allowedStages.some(allowed => allowed.value === step.key)
    );
  };

  // Filter status steps based on user permissions
  const availableStatusOptions = user && manufacturingStages.length > 0 
    ? getAllowedStatusTransitions(manufacturingUpdate?.status || 'awaiting_admin_confirmation', user.role) 
    : statusSteps;

  // Fetch order details
  const { data: order } = useQuery<Order>({
    queryKey: ['/api/orders', manufacturingUpdate?.orderId],
    enabled: !!manufacturingUpdate?.orderId,
  });

  // Fetch order line items with manufacturer assignments
  // Note: This may fail for manufacturer roles if they don't have orders.read
  // The manufacturingLineItems query below is the primary source for manufacturers
  const [lineItemsPermissionError, setLineItemsPermissionError] = useState(false);
  const { data: lineItems = [], isError: lineItemsError } = useQuery<any[]>({
    queryKey: ['/api/orders', manufacturingUpdate?.orderId, 'line-items-with-manufacturers'],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${manufacturingUpdate?.orderId}/line-items-with-manufacturers`, {
        credentials: 'include',
      });
      if (!response.ok) {
        // For 403, set the permission error flag and return empty
        // Manufacturers will use manufacturingLineItems instead
        if (response.status === 403) {
          setLineItemsPermissionError(true);
          return [];
        }
        throw new Error('Failed to fetch line items');
      }
      setLineItemsPermissionError(false);
      return response.json();
    },
    enabled: !!manufacturingUpdate?.orderId,
  });

  // Fetch all manufacturers for the dropdown
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ['/api/manufacturers'],
  });

  // Fetch organization details
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', order?.orgId],
    enabled: !!order?.orgId,
  });

  // Fetch manufacturing updates to get the latest one with line items
  const { data: manufacturingUpdates = [] } = useQuery<any[]>({
    queryKey: ['/api/manufacturing-updates', manufacturingUpdate?.id],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturing-updates?manufacturingId=${manufacturingUpdate?.id}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!manufacturingUpdate?.id,
  });

  // Get the latest manufacturing update (should be the first one created with the manufacturing record)
  const latestUpdate = manufacturingUpdates.length > 0 ? manufacturingUpdates[0] : null;

  // Fetch manufacturing update line items with snapshotted data
  const { data: manufacturingLineItems = [], isLoading: isLoadingManufacturingLineItems } = useQuery<any[]>({
    queryKey: ['/api/manufacturing-update-line-items', latestUpdate?.id],
    queryFn: async () => {
      if (!latestUpdate?.id) return [];
      const response = await fetch(`/api/manufacturing-update-line-items?manufacturingUpdateId=${latestUpdate.id}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      const items = await response.json();
      
      // Items now include snapshotted data: productName, variantCode, variantColor, imageUrl, and sizes
      // No need to fetch additional details
      return items;
    },
    enabled: !!latestUpdate?.id,
  });

  // Fetch order tracking numbers
  const { data: orderTrackingNumbers = [], isFetching: isTrackingFetching } = useQuery<any[]>({
    queryKey: ['/api/orders', manufacturingUpdate?.orderId, 'tracking'],
    enabled: !!manufacturingUpdate?.orderId && isOpen,
  });

  // Fetch Pantone assignments for this manufacturing update
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
    enabled: !!latestUpdate?.id,
  });

  // Reset all state when manufacturing record changes
  useEffect(() => {
    if (isOpen && manufacturingUpdate) {
      setStatus(manufacturingUpdate.status || "awaiting_admin_confirmation");
      setProductionNotes(manufacturingUpdate.productionNotes || "");
      setQualityNotes(manufacturingUpdate.qualityNotes || "");
      setTrackingNumber(manufacturingUpdate.trackingNumber || "");
      setActualCompletionDate(manufacturingUpdate.actualCompletion || "");
      setCarrierCompany(""); // Clear carrier to prevent stale values
      
      // Reset carrier initialization flag to allow reloading
      carrierInitializedForId.current = null;
    }
  }, [isOpen, manufacturingUpdate?.id]);

  // Initialize carrier from tracking data or default (but only once per record, after tracking data loads)
  useEffect(() => {
    if (isOpen && manufacturingUpdate && 
        !isTrackingFetching && // Wait for tracking query to complete
        carrierInitializedForId.current !== manufacturingUpdate.id) {
      // Load from tracking data if available, otherwise use default
      if (orderTrackingNumbers.length > 0) {
        setCarrierCompany(orderTrackingNumbers[0].carrierCompany || "Manufacturing Team");
      } else {
        setCarrierCompany("Manufacturing Team");
      }
      carrierInitializedForId.current = manufacturingUpdate.id;
    }
  }, [isOpen, manufacturingUpdate?.id, orderTrackingNumbers, isTrackingFetching]);

  // Create initial manufacturing update if none exists
  const createInitialUpdateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/manufacturing-updates', {
        manufacturingId: manufacturingUpdate.id,
        status: manufacturingUpdate.status || 'awaiting_admin_confirmation',
        notes: 'Initial manufacturing update created',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-updates'] });
      toast({
        title: "Success",
        description: "Manufacturing update initialized successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize manufacturing update",
        variant: "destructive",
      });
    },
  });

  // Update manufacturing status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', `/api/manufacturing/${manufacturingUpdate.id}`, {
        status,
        productionNotes,
        qualityNotes,
        trackingNumber,
        carrierCompany,
        actualCompletion: actualCompletionDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing'] });
      toast({
        title: "Success",
        description: "Manufacturing record saved successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update manufacturing record",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateStatusMutation.mutate();
  };

  // Delete manufacturing record mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/manufacturing/${manufacturingUpdate.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing'] });
      toast({
        title: "Success",
        description: "Manufacturing record deleted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete manufacturing update",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this manufacturing update? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  // Archive/Unarchive manufacturing record mutation
  // Duplicate manufacturing structure mutation
  const duplicateStructureMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/manufacturing/${manufacturingUpdate?.id}/duplicate-structure`, {
        method: "POST",
      }),
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      toast({
        title: "Success",
        description: `Manufacturing structure duplicated (quantities set to 0)`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate manufacturing structure",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (archive: boolean) => {
      const endpoint = archive 
        ? `/api/manufacturing/${manufacturingUpdate.id}/archive`
        : `/api/manufacturing/${manufacturingUpdate.id}/unarchive`;
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
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/archived/list'] });
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

  const handleArchive = () => {
    const isArchived = manufacturingUpdate?.archived;
    if (isArchived) {
      archiveMutation.mutate(false);
    } else {
      if (confirm("Are you sure you want to archive this manufacturing update? This will move it to the archived section.")) {
        archiveMutation.mutate(true);
      }
    }
  };

  // Update line item descriptors mutation
  // Refresh line items mutation - syncs with latest order data
  const refreshLineItemsMutation = useMutation({
    mutationFn: async () => {
      if (!latestUpdate?.id) {
        throw new Error("No manufacturing update found");
      }
      
      const response = await apiRequest(`/api/manufacturing-updates/${latestUpdate.id}/refresh-line-items`, {
        method: 'POST',
      });
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-update-line-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders', manufacturingUpdate?.orderId, 'line-items-with-manufacturers'] });
      toast({
        title: "Success",
        description: "Line items have been refreshed with the latest order data",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to refresh line items",
        variant: "destructive",
      });
    },
  });

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
      toast({
        title: "Success",
        description: "Descriptors updated successfully",
      });
      setEditingDescriptors(null);
      setNewDescriptor("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update descriptors",
        variant: "destructive",
      });
    },
  });

  const handleAddDescriptor = (lineItemId: number, currentDescriptors: string[] = []) => {
    if (!newDescriptor.trim()) return;
    const updatedDescriptors = [...currentDescriptors, newDescriptor.trim()];
    updateDescriptorsMutation.mutate({ lineItemId, descriptors: updatedDescriptors });
  };

  const handleRemoveDescriptor = (lineItemId: number, currentDescriptors: string[], index: number) => {
    const updatedDescriptors = currentDescriptors.filter((_, i) => i !== index);
    updateDescriptorsMutation.mutate({ lineItemId, descriptors: updatedDescriptors });
  };

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
      toast({
        title: "Success",
        description: "Product name updated successfully",
      });
      setEditingLineItemId(null);
      setEditedItemName("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product name",
        variant: "destructive",
      });
    },
  });

  const handleSaveItemName = (lineItemId: number) => {
    if (!editedItemName.trim()) {
      setEditingLineItemId(null);
      setEditedItemName("");
      return;
    }
    updateLineItemNameMutation.mutate({ lineItemId, itemName: editedItemName.trim() });
  };

  // Update completed product images mutation
  const updateCompletedImagesMutation = useMutation({
    mutationFn: async (images: string[]) => {
      const response = await fetch(`/api/manufacturing/${manufacturingUpdate.id}/completed-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completedProductImages: images }),
      });
      if (!response.ok) throw new Error('Failed to update completed images');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing'] });
      toast({
        title: "Success",
        description: "Completed product images updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update completed product images",
        variant: "destructive",
      });
    },
  });

  // Update mockup image mutation
  const updateMockupImageMutation = useMutation({
    mutationFn: async ({ lineItemId, mockupImageUrl }: { lineItemId: number; mockupImageUrl: string }) => {
      const response = await fetch(`/api/manufacturing-update-line-items/${lineItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mockupImageUrl }),
      });
      if (!response.ok) throw new Error('Failed to update mockup image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-update-line-items'] });
      toast({
        title: "Success",
        description: "Mockup image updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update mockup image",
        variant: "destructive",
      });
    },
  });

  // Create finished product image mutation
  const createFinishedImageMutation = useMutation({
    mutationFn: async ({ lineItemId, imageUrl }: { lineItemId: number; imageUrl: string }) => {
      const response = await fetch(`/api/manufacturing-line-items/${lineItemId}/finished-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to create finished image');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-line-items', variables.lineItemId, 'finished-images'] });
      toast({
        title: "Success",
        description: "Finished product image uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload finished product image",
        variant: "destructive",
      });
    },
  });

  // Delete finished product image mutation
  const deleteFinishedImageMutation = useMutation({
    mutationFn: async ({ imageId, lineItemId }: { imageId: number; lineItemId: number }) => {
      const response = await fetch(`/api/manufacturing-finished-images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete finished image');
      return { imageId, lineItemId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing-line-items', variables.lineItemId, 'finished-images'] });
      toast({
        title: "Success",
        description: "Finished product image deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete finished product image",
        variant: "destructive",
      });
    },
  });

  // Create Pantone assignment mutation
  const createPantoneAssignmentMutation = useMutation({
    mutationFn: async (assignment: PantoneAssignment & { lineItemId: number }) => {
      if (!assignment.lineItemId) {
        throw new Error('Line item ID is required');
      }
      const response = await apiRequest('POST', '/api/pantone-assignments', {
        manufacturingUpdateId: latestUpdate?.id,
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
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pantone-assignments', { manufacturingUpdateId: latestUpdate?.id }] });
      setShowPantonePicker(null);
      toast({
        title: "Success",
        description: "Pantone color assigned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign Pantone color",
        variant: "destructive",
      });
    },
  });

  // Delete Pantone assignment mutation
  const deletePantoneAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/pantone-assignments/${id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pantone-assignments', { manufacturingUpdateId: latestUpdate?.id }] });
      toast({
        title: "Success",
        description: "Pantone color removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove Pantone color",
        variant: "destructive",
      });
    },
  });

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const currentIndex = statusSteps.findIndex(s => s.key === status);
    return ((currentIndex + 1) / statusSteps.length) * 100;
  };

  // Check if user can edit manufacturing details
  const canEdit = user?.role === 'admin' || user?.role === 'ops' || 
    (user?.role === 'manufacturer' && manufacturingUpdate?.assignedManufacturerId === user.id);

  // Check if user can view/refresh line items (more permissive - any manufacturer can view)
  const canViewLineItems = user?.role === 'admin' || user?.role === 'ops' || user?.role === 'manufacturer';
  
  // Check if user can refresh line items (requires manufacturing write)
  const canRefreshLineItems = user?.role === 'admin' || user?.role === 'ops' || user?.role === 'manufacturer';

  // Calculate days overdue
  const calculateOverdue = () => {
    if (!manufacturingUpdate?.estCompletion) return 0;
    const estimated = new Date(manufacturingUpdate.estCompletion);
    const today = new Date();
    const diffTime = today.getTime() - estimated.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const overdueDays = calculateOverdue();

  const currentStage = statusSteps.find(s => s.key === status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="manufacturing-details-description">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Manufacturing - {order?.orderCode || manufacturingUpdate?.id}
          </DialogTitle>
          <div id="manufacturing-details-description" className="sr-only">
            Track and manage production progress for this order
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <StatusBadge status={status}>
                {currentStage?.label || status.replace(/_/g, ' ')}
              </StatusBadge>
              {order?.priority && (
                <Badge variant={order.priority === "high" ? "destructive" : order.priority === "low" ? "secondary" : "default"}>
                  {order.priority} priority
                </Badge>
              )}
              {overdueDays > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {overdueDays} days overdue
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (!latestUpdate?.id) {
                        toast({
                          title: "Error",
                          description: "No manufacturing update found",
                          variant: "destructive",
                        });
                        return;
                      }
                      const response = await fetch(`/api/manufacturing-updates/${latestUpdate.id}/export-pdf`, {
                        credentials: 'include',
                      });
                      if (!response.ok) throw new Error('Export failed');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `manufacturing-update-${latestUpdate.id}.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast({
                        title: "Success",
                        description: "PDF exported successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to export PDF",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-export-pdf"
                  disabled={!latestUpdate}
                  title="Export PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (!latestUpdate?.id) {
                        toast({
                          title: "Error",
                          description: "No manufacturing update found",
                          variant: "destructive",
                        });
                        return;
                      }
                      const response = await fetch(`/api/manufacturing-updates/${latestUpdate.id}/export-zip`, {
                        credentials: 'include',
                      });
                      if (!response.ok) throw new Error('Export failed');
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `manufacturing-update-${latestUpdate.id}-attachments.zip`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast({
                        title: "Success",
                        description: "ZIP exported successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to export ZIP",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="button-export-zip"
                  disabled={!latestUpdate}
                  title="Export ZIP"
                >
                  <FileArchive className="h-4 w-4" />
                </Button>
                {(user?.role === 'admin' || user?.role === 'ops') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateStructureMutation.mutate()}
                    disabled={duplicateStructureMutation.isPending}
                    data-testid="button-duplicate-header"
                    title="Duplicate Structure"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Edit Controls */}
              {canEdit && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateStatusMutation.isPending}
                  data-testid="button-save-header"
                >
                  {updateStatusMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
              )}
              
              {/* Archive/Delete for admin/ops */}
              {(user?.role === 'admin' || user?.role === 'ops') && (
                <>
                  <Button
                    variant={manufacturingUpdate?.archived ? "outline" : "secondary"}
                    size="sm"
                    onClick={handleArchive}
                    disabled={archiveMutation.isPending}
                    data-testid="button-archive-header"
                    title={manufacturingUpdate?.archived ? "Unarchive" : "Archive"}
                  >
                    {manufacturingUpdate?.archived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    data-testid="button-delete-header"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="lineitems" data-testid="tab-lineitems">Line Items</TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">Notes</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="overview" className="space-y-6 mt-0">
              {/* Horizontal Chevron Workflow Steps - Matching Order Modal Style */}
              <Card className="border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Production Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between overflow-x-auto py-2">
                    {statusSteps.map((step, index) => {
                      const currentIndex = statusSteps.findIndex(s => s.key === status);
                      const isCompleted = index < currentIndex;
                      const isCurrent = index === currentIndex;
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex items-center flex-shrink-0">
                          <button
                            type="button"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : isCompleted
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:bg-muted/50'
                            }`}
                            onClick={() => canEdit && setStatus(step.key)}
                            disabled={!canEdit}
                            data-testid={`status-step-${step.key}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
                            {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                          </button>
                          {index < statusSteps.length - 1 && (
                            <ChevronRight className={`w-4 h-4 mx-1 flex-shrink-0 ${
                              index < currentIndex ? 'text-green-500' : 'text-muted-foreground/30'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* First Piece Approval */}
              <FirstPieceApprovalPanel
                manufacturingId={manufacturingUpdate?.id}
                firstPieceStatus={manufacturingUpdate?.firstPieceStatus || "pending"}
                firstPieceImageUrls={manufacturingUpdate?.firstPieceImageUrls || []}
                firstPieceUploadedAt={manufacturingUpdate?.firstPieceUploadedAt}
                firstPieceUploadedBy={manufacturingUpdate?.firstPieceUploadedBy}
                firstPieceApprovedAt={manufacturingUpdate?.firstPieceApprovedAt}
                firstPieceApprovedBy={manufacturingUpdate?.firstPieceApprovedBy}
                firstPieceRejectionNotes={manufacturingUpdate?.firstPieceRejectionNotes}
                canUpload={user?.role === "manufacturer" || user?.role === "admin"}
                canApprove={user?.role === "ops" || user?.role === "admin"}
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
                }}
              />

              {/* Order Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="glass-card border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Order Code</Label>
                      <p className="font-medium">{order?.orderCode}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Order Name</Label>
                      <p className="font-medium">{order?.orderName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Organization</Label>
                      <p className="font-medium">{organization?.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <Badge variant={order?.priority === 'high' ? 'destructive' : order?.priority === 'normal' ? 'default' : 'secondary'}>
                        {order?.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Line Items & Manufacturers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lineItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No line items found</p>
                      ) : (
                        lineItems.map((item, index) => (
                          <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.itemName || `Item ${index + 1}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.variant?.variantCode}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="w-3 h-3 text-muted-foreground" />
                              <span>{item.manufacturer?.name || "Unassigned"}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                canEdit={canEdit}
                isEditing={false}
                onDelete={(id) => deletePantoneAssignmentMutation.mutate(id)}
                onAddClick={() => setActiveTab("lineitems")}
                variant="compact"
              />

              {/* Status Update - Simplified since workflow is clickable */}
              {canEdit && (
                <Card className="border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Production Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="completion">Actual Completion Date</Label>
                        <Input
                          id="completion"
                          type="date"
                          value={actualCompletionDate}
                          onChange={(e) => setActualCompletionDate(e.target.value)}
                          disabled={!canEdit}
                          data-testid="input-completion-date"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Shipping & Tracking Section - Always Visible for Manufacturing */}
              <Card className="border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                      <Truck className="w-4 h-4 text-indigo-500" />
                    </div>
                    Shipping & Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tracking Input Fields - Always editable */}
                  {canEdit && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div>
                        <Label htmlFor="mfg-tracking" className="text-sm font-medium">Tracking Number</Label>
                        <Input
                          id="mfg-tracking"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number"
                          className="mt-1"
                          data-testid="input-mfg-tracking"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mfg-carrier" className="text-sm font-medium">Carrier Company</Label>
                        <Select value={carrierCompany} onValueChange={setCarrierCompany}>
                          <SelectTrigger id="mfg-carrier" className="mt-1" data-testid="select-mfg-carrier">
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
                  )}
                  
                  {/* Existing Order Tracking Numbers */}
                  {orderTrackingNumbers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Current Tracking Numbers:</p>
                      {orderTrackingNumbers.map((tracking: any) => {
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
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg border gap-2"
                            data-testid={`mfg-tracking-item-${tracking.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Truck className="h-4 w-4 text-indigo-500" />
                              </div>
                              <div>
                                <p className="font-bold tracking-wide" data-testid={`mfg-tracking-number-${tracking.id}`}>
                                  {tracking.trackingNumber}
                                </p>
                                <p className="text-xs text-muted-foreground" data-testid={`mfg-carrier-${tracking.id}`}>
                                  {tracking.carrierCompany} • Added {tracking.createdAt && format(new Date(tracking.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            {trackingUrl && (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                                data-testid={`mfg-track-link-${tracking.id}`}
                              >
                                <Truck className="h-3 w-3" />
                                Track on {isUPS ? 'UPS' : isFedEx ? 'FedEx' : 'USPS'}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {orderTrackingNumbers.length === 0 && !trackingNumber && (
                    <p className="text-sm text-muted-foreground italic text-center py-2">
                      No tracking numbers yet. Add one above when shipping.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Production Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Production Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Started Production</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {manufacturingUpdate?.createdAt ? format(new Date(manufacturingUpdate.createdAt), "PPP") : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Estimated Completion</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {manufacturingUpdate?.estCompletion ? format(new Date(manufacturingUpdate.estCompletion), "PPP") : "TBD"}
                      </span>
                    </div>

                    {actualCompletionDate && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-sm">Actual Completion</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(actualCompletionDate), "PPP")}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Current Duration</p>
                      <p className="text-lg font-semibold">
                        {manufacturingUpdate?.createdAt ? 
                          Math.ceil((new Date().getTime() - new Date(manufacturingUpdate.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
                          : 0} days
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lineitems" className="space-y-4 mt-0">
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Line Item Manufacturing Status
                    </CardTitle>
                    {manufacturingUpdates.length > 0 && canRefreshLineItems && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshLineItemsMutation.mutate()}
                        disabled={refreshLineItemsMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-refresh-line-items"
                      >
                        <RefreshCcw className={`w-4 h-4 ${refreshLineItemsMutation.isPending ? 'animate-spin' : ''}`} />
                        {refreshLineItemsMutation.isPending ? 'Refreshing...' : 'Line Item Refresh'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingManufacturingLineItems ? (
                    <p className="text-sm text-muted-foreground">Loading line items...</p>
                  ) : manufacturingUpdates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <Package className="w-12 h-12 text-muted-foreground opacity-50" />
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">No Manufacturing Update Found</p>
                        <p className="text-xs text-muted-foreground max-w-md">
                          This manufacturing record needs an initial update to display line items.
                          Click below to create one.
                        </p>
                      </div>
                      <Button
                        onClick={() => createInitialUpdateMutation.mutate()}
                        disabled={createInitialUpdateMutation.isPending}
                        data-testid="button-create-initial-update"
                      >
                        {createInitialUpdateMutation.isPending ? "Creating..." : "Initialize Manufacturing Update"}
                      </Button>
                    </div>
                  ) : manufacturingLineItems.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">No line items found for this manufacturing update</p>
                      {lineItemsPermissionError && (
                        <p className="text-xs text-amber-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Some order data may not be available due to permission restrictions. Use the refresh button if needed.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {manufacturingLineItems.map((item, index) => {
                        // Use snapshot data directly from manufacturing update line item
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
                        
                        // Display name uses snapshot data
                        const displayName = item.productName && item.variantCode 
                          ? `${item.productName} - ${item.variantCode}` 
                          : item.productName || item.variantCode || `Line Item ${index + 1}`;

                        return (
                          <Card key={item.id} className="border border-white/10 bg-black/20">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    {item.imageUrl && (
                                      <div className="relative group">
                                        <img
                                          src={item.imageUrl}
                                          alt={displayName}
                                          className="h-12 w-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFullScreenImage(item.imageUrl);
                                          }}
                                          data-testid={`img-line-item-${item.id}`}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded">
                                          <ImageIcon className="w-6 h-6 text-white" />
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <h4 className="font-medium text-sm">
                                        {displayName}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {item.variantColor || 'No color specified'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <Badge 
                                  variant={item.manufacturerCompleted ? "default" : "secondary"}
                                  className={`flex items-center gap-1 ${item.manufacturerCompleted ? "bg-green-600" : ""}`}
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
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Quantity</p>
                                  <p className="font-medium">{totalQty} units</p>
                                </div>

                                {item.actualCost && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Actual Cost</p>
                                    <p className="font-medium flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {item.actualCost}
                                    </p>
                                  </div>
                                )}

                                {item.sizesConfirmed && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Sizes Confirmed</p>
                                    <p className="font-medium text-green-600">✓ Yes</p>
                                  </div>
                                )}

                                {item.manufacturerCompletedAt && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Completed Date</p>
                                    <p className="font-medium">
                                      {format(new Date(item.manufacturerCompletedAt), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                )}

                                {item.manufacturerCompletedBy && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Completed By</p>
                                    <p className="font-medium flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {item.manufacturerCompletedBy}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Size Breakdown */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Size Breakdown</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(sizeBreakdown).map(([size, qty]) => (
                                    qty > 0 && (
                                      <Badge key={size} variant="outline" className="text-xs">
                                        {size}: {qty}
                                      </Badge>
                                    )
                                  ))}
                                </div>
                              </div>

                              {/* Fabric Status & Submission */}
                              <div className="border-t pt-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium">Fabric Information</p>
                                  <FabricStatusIndicator lineItemId={item.orderLineItemId || item.id} />
                                </div>
                                {(user?.role === 'manufacturer' || user?.role === 'admin' || user?.role === 'ops') && manufacturingUpdate?.id && (
                                  <FabricSubmissionForm
                                    manufacturingId={manufacturingUpdate.id}
                                    lineItemId={item.orderLineItemId || item.id}
                                    lineItemName={displayName}
                                  />
                                )}
                              </div>

                              {/* Item Image (from order snapshot) */}
                              <div>
                                <p className="text-xs font-medium mb-2">Item Image (Order Snapshot)</p>
                                {item.imageUrl ? (
                                  <div 
                                    className="mt-2 border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" 
                                    style={{ maxHeight: '200px' }}
                                    onClick={() => {
                                      if (item.imageUrl) setFullScreenImage(item.imageUrl);
                                    }}
                                  >
                                    <img
                                      src={item.imageUrl}
                                      alt={`${displayName} image`}
                                      className="w-full h-full object-contain"
                                      data-testid={`img-lineitem-${item.id}`}
                                    />
                                  </div>
                                ) : (
                                  <div className="mt-2 border rounded-lg p-8 text-center text-muted-foreground">
                                    <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    No image available
                                  </div>
                                )}
                              </div>

                              {/* Mockup Image */}
                              <div>
                                <p className="text-xs font-medium mb-2">Mockup Image</p>
                                {item.mockupImageUrl ? (
                                  <div className="relative group">
                                    <div 
                                      className="mt-2 border rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" 
                                      style={{ maxHeight: '200px' }}
                                      onClick={() => setFullScreenImage(item.mockupImageUrl)}
                                    >
                                      <img
                                        src={item.mockupImageUrl}
                                        alt={`Mockup for ${displayName}`}
                                        className="w-full h-full object-contain"
                                        data-testid={`img-mockup-${item.id}`}
                                      />
                                    </div>
                                    {canEdit && (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                        onClick={() => updateMockupImageMutation.mutate({ lineItemId: item.id, mockupImageUrl: '' })}
                                        data-testid={`button-remove-mockup-${item.id}`}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ) : canEdit ? (
                                  <ObjectUploader
                                    allowedFileTypes={['image/*']}
                                    onGetUploadParameters={async (file: File) => {
                                      try {
                                        const response = await apiRequest("POST", "/api/upload/image", {
                                          filename: file.name,
                                          size: file.size,
                                          mimeType: file.type
                                        }) as any;
                                        // Store the uploadId for later use
                                        (file as any).__uploadId = response.uploadId;
                                        return { 
                                          method: "PUT" as const, 
                                          url: response.uploadURL,
                                          headers: {
                                            'Content-Type': file.type
                                          }
                                        };
                                      } catch (error) {
                                        console.error("Failed to get upload URL:", error);
                                        throw error;
                                      }
                                    }}
                                    onComplete={(result) => {
                                      if (result.successful?.[0]) {
                                        const file = result.successful[0] as any;
                                        const uploadId = file.__uploadId;
                                        if (uploadId) {
                                          updateMockupImageMutation.mutate({ lineItemId: item.id, mockupImageUrl: uploadId });
                                        }
                                      }
                                    }}
                                    buttonClassName="w-full"
                                  >
                                    <div className="flex items-center justify-center gap-2 text-xs" data-testid={`uploader-mockup-${item.id}`}>
                                      <Upload className="w-3 h-3" />
                                      Upload Mockup
                                    </div>
                                  </ObjectUploader>
                                ) : (
                                  <div className="mt-2 border rounded-lg p-8 text-center text-muted-foreground">
                                    <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    No mockup available
                                  </div>
                                )}
                              </div>

                              {/* Finished Product Images */}
                              <FinishedProductImages 
                                lineItemId={item.id}
                                canEdit={canEdit}
                                onImageClick={setFullScreenImage}
                                createMutation={createFinishedImageMutation}
                                deleteMutation={deleteFinishedImageMutation}
                              />

                              {/* Descriptors */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium">Descriptors</p>
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => setEditingDescriptors(editingDescriptors === item.id ? null : item.id)}
                                      data-testid={`button-edit-descriptors-${item.id}`}
                                    >
                                      {editingDescriptors === item.id ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    </Button>
                                  )}
                                </div>
                                
                                {item.descriptors && item.descriptors.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mb-2">
                                    {item.descriptors.map((descriptor: string, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
                                        {descriptor}
                                        {canEdit && editingDescriptors === item.id && (
                                          <button
                                            onClick={() => handleRemoveDescriptor(item.id, item.descriptors || [], idx)}
                                            className="ml-1 hover:text-destructive"
                                            data-testid={`button-remove-descriptor-${item.id}-${idx}`}
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {editingDescriptors === item.id && (
                                  <div className="flex gap-2 mt-2">
                                    <Input
                                      placeholder="Add descriptor (e.g., Red)"
                                      value={newDescriptor}
                                      onChange={(e) => setNewDescriptor(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleAddDescriptor(item.id, item.descriptors || []);
                                        }
                                      }}
                                      className="text-xs h-8"
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
                                  <p className="text-xs text-muted-foreground">No descriptors</p>
                                )}
                              </div>

                              {/* Pantone Colors */}
                              <div className="border-t pt-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5" />
                                    Pantone Colors
                                  </p>
                                  {canEdit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2"
                                      onClick={() => setShowPantonePicker(showPantonePicker === item.id ? null : item.id)}
                                      data-testid={`button-add-pantone-${item.id}`}
                                    >
                                      {showPantonePicker === item.id ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                    </Button>
                                  )}
                                </div>

                                {/* Display existing Pantone assignments for this line item */}
                                {(() => {
                                  const lineItemPantones = pantoneAssignments.filter(
                                    (p: any) => p.lineItemId === item.lineItemId
                                  );
                                  return lineItemPantones.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {lineItemPantones.map((pantone: any) => (
                                        <div
                                          key={pantone.id}
                                          className="flex items-center gap-2 px-2 py-1 rounded-md border bg-card"
                                          data-testid={`pantone-chip-${pantone.id}`}
                                        >
                                          <div
                                            className="w-4 h-4 rounded-sm border"
                                            style={{ backgroundColor: pantone.hexValue }}
                                          />
                                          <div className="text-xs">
                                            <span className="font-medium">{pantone.pantoneCode}</span>
                                            {pantone.usageLocation && (
                                              <span className="text-muted-foreground ml-1">
                                                ({pantone.usageLocation.replace(/_/g, ' ')})
                                              </span>
                                            )}
                                          </div>
                                          {canEdit && (
                                            <button
                                              onClick={() => deletePantoneAssignmentMutation.mutate(pantone.id)}
                                              className="ml-1 hover:text-destructive"
                                              data-testid={`button-delete-pantone-${pantone.id}`}
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : !showPantonePicker || showPantonePicker !== item.id ? (
                                    <p className="text-xs text-muted-foreground mb-2">No Pantone colors assigned</p>
                                  ) : null;
                                })()}

                                {/* Pantone Picker */}
                                {showPantonePicker === item.id && (
                                  <div className="mt-3 p-3 border rounded-lg bg-black/5 dark:bg-white/5">
                                    <PantonePicker
                                      mode="wizard"
                                      lineItemImages={item.imageUrl ? [item.imageUrl] : []}
                                      initialImage={item.imageUrl}
                                      onAssign={(assignment) => {
                                        createPantoneAssignmentMutation.mutate({
                                          ...assignment,
                                          lineItemId: item.lineItemId,
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {item.notes && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Manufacturer Notes</p>
                                  <p className="text-sm mt-1 p-2 bg-muted rounded">{item.notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-0">
              <ManufacturingNotesTab
                orderId={manufacturingUpdate?.orderId}
                manufacturingLineItems={manufacturingLineItems}
              />
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-0">
              {/* Production Notes */}
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Production Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={productionNotes}
                    onChange={(e) => setProductionNotes(e.target.value)}
                    placeholder="Add production notes, special instructions, or updates..."
                    className="min-h-[100px]"
                    disabled={!canEdit}
                    data-testid="textarea-production-notes"
                  />
                </CardContent>
              </Card>

              {/* Quality Check Results */}
              <Card className="glass-card border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Quality Check Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={qualityNotes}
                    onChange={(e) => setQualityNotes(e.target.value)}
                    placeholder="Document quality check findings, issues, or approvals..."
                    className="min-h-[100px]"
                    disabled={!canEdit}
                    data-testid="textarea-quality-notes"
                  />
                </CardContent>
              </Card>

              {/* File Attachments - only render when manufacturingUpdate.id exists */}
              {manufacturingUpdate?.id && (
                <FileAttachmentsTab
                  manufacturingId={manufacturingUpdate.id}
                  canEdit={canEdit}
                  onImageClick={(url) => setFullScreenImage(url)}
                />
              )}

              {/* Completed Product Images (only visible when archived) */}
              {manufacturingUpdate?.archived && (
                <Card className="glass-card border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Completed Product Images</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {canEdit && (
                      <div>
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
                            const currentImages = manufacturingUpdate.completedProductImages || [];
                            updateCompletedImagesMutation.mutate([...currentImages, ...uploadedUrls]);
                          }}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center gap-2" data-testid="uploader-completed-images">
                            <Upload className="w-4 h-4" />
                            Upload Completed Product Images
                          </div>
                        </ObjectUploader>
                      </div>
                    )}

                    {manufacturingUpdate?.completedProductImages && manufacturingUpdate.completedProductImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {manufacturingUpdate.completedProductImages.map((imageUrl: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={imageUrl}
                              alt={`Completed product ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => setFullScreenImage(imageUrl)}
                              data-testid={`img-completed-${index}`}
                            />
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                onClick={() => {
                                  const updatedImages = manufacturingUpdate.completedProductImages.filter((_: string, i: number) => i !== index);
                                  updateCompletedImagesMutation.mutate(updatedImages);
                                }}
                                data-testid={`button-remove-completed-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No completed product images uploaded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-close">
            Close
          </Button>
        </div>
      </DialogContent>

      <FullScreenImageViewer
        imageUrl={fullScreenImage || ""}
        isOpen={!!fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
    </Dialog>
  );
}

// Icon mapping for note categories
const noteCategoryIconMap: Record<string, any> = {
  Scissors,
  Ruler,
  Zap,
  AlertTriangle,
  MessageSquare,
};

interface ManufacturingNotesTabProps {
  orderId: number | undefined;
  manufacturingLineItems: any[];
}

function ManufacturingNotesTab({ orderId, manufacturingLineItems }: ManufacturingNotesTabProps) {
  const [groupBy, setGroupBy] = useState<"category" | "lineItem">("category");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterLineItem, setFilterLineItem] = useState<number | null>(null);

  // Fetch note categories
  const { data: noteCategories = [] } = useQuery<any[]>({
    queryKey: ['/api/manufacturing-note-categories'],
  });

  // Fetch order line items directly to get manufacturing notes
  const { data: orderLineItems = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/orders', orderId, 'line-items'],
    enabled: !!orderId,
  });

  // Extract all notes from line items with line item info
  const allNotes: Array<{
    note: any;
    lineItemId: number;
    lineItemName: string;
    variantCode: string;
  }> = [];

  orderLineItems.forEach((lineItem) => {
    const notes = lineItem.manufacturingNotes || [];
    const lineItemName = lineItem.itemName || `Item #${lineItem.id}`;
    const variantCode = lineItem.variant?.variantCode || '';
    
    notes.forEach((note: any) => {
      allNotes.push({
        note,
        lineItemId: lineItem.id,
        lineItemName,
        variantCode,
      });
    });
  });

  // Sort notes by creation date (newest first)
  allNotes.sort((a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime());

  // Apply filters
  const filteredNotes = allNotes.filter((item) => {
    if (filterCategory && item.note.categoryName !== filterCategory) return false;
    if (filterLineItem && item.lineItemId !== filterLineItem) return false;
    return true;
  });

  // Group notes based on groupBy setting
  const groupedNotes: Record<string, typeof filteredNotes> = {};
  
  if (groupBy === "category") {
    filteredNotes.forEach((item) => {
      const key = item.note.categoryName || "Uncategorized";
      if (!groupedNotes[key]) groupedNotes[key] = [];
      groupedNotes[key].push(item);
    });
  } else {
    filteredNotes.forEach((item) => {
      const key = `${item.lineItemName} (${item.variantCode || 'No variant'})`;
      if (!groupedNotes[key]) groupedNotes[key] = [];
      groupedNotes[key].push(item);
    });
  }

  // Get category info (color, icon) by name
  const getCategoryInfo = (categoryName: string) => {
    const category = noteCategories.find((c: any) => c.name === categoryName);
    return {
      color: category?.color || "#6366f1",
      icon: category?.icon || "MessageSquare",
    };
  };

  // Get unique categories for filter
  const uniqueCategories = [...new Set(allNotes.map((n) => n.note.categoryName))].filter(Boolean);
  
  // Get unique line items for filter
  const uniqueLineItems = orderLineItems.map((li) => ({
    id: li.id,
    name: li.itemName || `Item #${li.id}`,
  }));

  if (isLoading) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading notes...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls: Group By Toggle and Filters */}
      <Card className="glass-card border-white/10">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Group By Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Group by:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={groupBy === "category" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setGroupBy("category")}
                  data-testid="button-group-by-category"
                >
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Category
                </Button>
                <Button
                  variant={groupBy === "lineItem" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none"
                  onClick={() => setGroupBy("lineItem")}
                  data-testid="button-group-by-lineitem"
                >
                  <List className="w-4 h-4 mr-1" />
                  Line Item
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={filterCategory || "all"} 
                onValueChange={(val) => setFilterCategory(val === "all" ? null : val)}
              >
                <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Line Item Filter */}
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <Select 
                value={filterLineItem?.toString() || "all"} 
                onValueChange={(val) => setFilterLineItem(val === "all" ? null : parseInt(val))}
              >
                <SelectTrigger className="w-[200px]" data-testid="select-filter-lineitem">
                  <SelectValue placeholder="All Line Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Line Items</SelectItem>
                  {uniqueLineItems.map((li) => (
                    <SelectItem key={li.id} value={li.id.toString()}>{li.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(filterCategory || filterLineItem) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCategory(null);
                  setFilterLineItem(null);
                }}
                data-testid="button-clear-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <StickyNote className="w-4 h-4" />
        <span>{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found</span>
        {allNotes.length !== filteredNotes.length && (
          <span>(filtered from {allNotes.length} total)</span>
        )}
      </div>

      {/* Notes Display */}
      {filteredNotes.length === 0 ? (
        <Card className="glass-card border-white/10">
          <CardContent className="py-12 text-center">
            <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">
              {allNotes.length === 0 
                ? "No manufacturing notes have been added yet"
                : "No notes match the current filters"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedNotes).map(([groupName, notes]) => {
            const categoryInfo = groupBy === "category" ? getCategoryInfo(groupName) : null;
            const CategoryIcon = categoryInfo ? (noteCategoryIconMap[categoryInfo.icon] || MessageSquare) : Package;
            
            return (
              <Card key={groupName} className="glass-card border-white/10 overflow-hidden">
                <CardHeader 
                  className="pb-2"
                  style={groupBy === "category" ? { borderLeft: `4px solid ${categoryInfo?.color}` } : undefined}
                >
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CategoryIcon 
                      className="w-4 h-4" 
                      style={groupBy === "category" ? { color: categoryInfo?.color } : undefined}
                    />
                    {groupName}
                    <Badge variant="secondary" className="ml-2">
                      {notes.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notes.map((item, index) => {
                    const itemCategoryInfo = getCategoryInfo(item.note.categoryName);
                    const ItemIcon = noteCategoryIconMap[itemCategoryInfo.icon] || MessageSquare;
                    
                    return (
                      <div
                        key={item.note.id || index}
                        className="p-3 rounded-lg bg-muted/50 border space-y-2"
                        data-testid={`note-${item.note.id || index}`}
                      >
                        {/* Note Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Show category badge when grouped by line item */}
                            {groupBy === "lineItem" && (
                              <Badge 
                                variant="outline" 
                                className="flex items-center gap-1"
                                style={{ borderColor: itemCategoryInfo.color, color: itemCategoryInfo.color }}
                              >
                                <ItemIcon className="w-3 h-3" />
                                {item.note.categoryName}
                              </Badge>
                            )}
                            
                            {/* Show line item badge when grouped by category */}
                            {groupBy === "category" && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {item.lineItemName}
                                {item.variantCode && (
                                  <span className="text-xs opacity-70">({item.variantCode})</span>
                                )}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Creator and Date */}
                          <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                            <div className="flex items-center gap-1 justify-end">
                              <User className="w-3 h-3" />
                              {item.note.createdByName || "Unknown"}
                            </div>
                            <div>
                              {item.note.createdAt && format(new Date(item.note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </div>
                          </div>
                        </div>
                        
                        {/* Note Text */}
                        <p className="text-sm whitespace-pre-wrap">{item.note.note}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FileAttachmentsTabProps {
  manufacturingId: number;
  canEdit: boolean;
  onImageClick: (url: string) => void;
}

function FileAttachmentsTab({ manufacturingId, canEdit, onImageClick }: FileAttachmentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("logos");

  const categories = [
    { value: "logos", label: "Logos", icon: ImageIcon },
    { value: "psds", label: "PSDs", icon: FileText },
    { value: "mockups", label: "Mockups", icon: ImageIcon },
    { value: "production_files", label: "Production Files", icon: FileText },
    { value: "other", label: "Other", icon: FileText },
  ];

  // Fetch attachments for this manufacturing record
  const { data: attachments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/manufacturing', manufacturingId, 'attachments'],
    enabled: !!manufacturingId,
  });

  // Filter attachments by selected category
  const filteredAttachments = attachments.filter(att => att.category === selectedCategory);

  // Get allowed file types based on category
  const getAllowedFileTypes = () => {
    switch (selectedCategory) {
      case 'psds':
        return ['.psd', '.psb', 'image/vnd.adobe.photoshop', 'application/x-photoshop'];
      case 'logos':
        // Allow both images and ZIP files for logos (bundled files)
        return ['image/*', '.zip', 'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip'];
      case 'mockups':
        return ['image/*'];
      case 'production_files':
        // Allow images, PDFs, and ZIP files for production files
        return ['image/*', '.pdf', 'application/pdf', '.zip', 'application/zip', 'application/x-zip-compressed'];
      case 'other':
        // Allow common file types for other attachments
        return ['image/*', '.pdf', 'application/pdf', '.zip', 'application/zip', '.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      default:
        return ['image/*', '.pdf', '.zip'];
    }
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { fileName: string; fileUrl: string; fileSize: number; fileType: string }) => {
      return apiRequest('POST', `/api/manufacturing/${manufacturingId}/attachments`, {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        category: selectedCategory,
        fileSize: data.fileSize,
        fileType: data.fileType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', manufacturingId, 'attachments'] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return apiRequest('DELETE', `/api/manufacturing/attachments/${attachmentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing', manufacturingId, 'attachments'] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">File Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const count = attachments.filter(att => att.category === cat.value).length;
              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  className="flex flex-col h-auto py-3"
                  onClick={() => setSelectedCategory(cat.value)}
                  data-testid={`button-category-${cat.value}`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{cat.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      {canEdit && (
        <Card className="glass-card border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upload {categories.find(c => c.value === selectedCategory)?.label}</CardTitle>
          </CardHeader>
          <CardContent>
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
                    uploadMutation.mutate({
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
              <div className="flex items-center justify-center gap-2" data-testid={`uploader-${selectedCategory}`}>
                <Upload className="w-4 h-4" />
                Upload {categories.find(c => c.value === selectedCategory)?.label}
              </div>
            </ObjectUploader>
          </CardContent>
        </Card>
      )}

      {/* Files List */}
      <Card className="glass-card border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {categories.find(c => c.value === selectedCategory)?.label} ({filteredAttachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Loading files...</p>
            </div>
          ) : filteredAttachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No {categories.find(c => c.value === selectedCategory)?.label.toLowerCase()} uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`file-${attachment.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isImageFile(attachment.fileType) ? (
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-10 h-10 object-cover rounded cursor-pointer"
                        onClick={() => onImageClick(attachment.fileUrl)}
                        data-testid={`img-preview-${attachment.id}`}
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                      data-testid={`button-download-${attachment.id}`}
                    >
                      Download
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(attachment.id)}
                        disabled={deleteMutation.isPending}
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
        </CardContent>
      </Card>
    </div>
  );
}