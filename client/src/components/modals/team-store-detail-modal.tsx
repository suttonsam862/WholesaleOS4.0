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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Order, Organization, User, TeamStoreLineItem } from "@shared/schema";
import { 
  CheckCircle2, Clock, Package, AlertCircle, Calendar, 
  User as UserIcon, Building2, FileText, Trash2, Archive, 
  ArchiveRestore, Save, X, Store, RefreshCw, DollarSign
} from "lucide-react";

interface TeamStoreDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamStore: any;
}

// Icon mapping for dynamic stage loading
const iconMap: Record<string, any> = {
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  Store,
};

interface TeamStoreStageConfig {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  allowedRoles: string[];
}

export function TeamStoreDetailModal({ isOpen, onClose, teamStore }: TeamStoreDetailModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("details");
  const [status, setStatus] = useState(teamStore?.status || "pending");
  const [storeName, setStoreName] = useState(teamStore?.storeName || "");
  const [storeOpenDate, setStoreOpenDate] = useState(teamStore?.storeOpenDate || "");
  const [storeCloseDate, setStoreCloseDate] = useState(teamStore?.storeCloseDate || "");
  const [notes, setNotes] = useState(teamStore?.notes || "");
  const [specialInstructions, setSpecialInstructions] = useState(teamStore?.specialInstructions || "");
  const [totalRevenue, setTotalRevenue] = useState(teamStore?.totalRevenue || "0");

  useEffect(() => {
    setStatus(teamStore?.status || "pending");
    setStoreName(teamStore?.storeName || "");
    setStoreOpenDate(teamStore?.storeOpenDate || "");
    setStoreCloseDate(teamStore?.storeCloseDate || "");
    setNotes(teamStore?.notes || "");
    setSpecialInstructions(teamStore?.specialInstructions || "");
    setTotalRevenue(teamStore?.totalRevenue || "0");
  }, [teamStore]);

  // Fetch team store stages dynamically
  const { data: teamStoreStages = [] } = useQuery<TeamStoreStageConfig[]>({
    queryKey: ["/api/config/team-store-stages"],
    retry: false,
    staleTime: 1000 * 60 * 60,
  });

  // Build statusSteps from dynamic data
  const statusSteps = teamStoreStages.map(stage => {
    const colorMap: Record<string, string> = {
      '#f59e0b': 'text-amber-500',
      '#3b82f6': 'text-blue-500',
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

  // Get allowed status transitions based on current status and user role
  const getAllowedStatusTransitions = (currentStatus: string, userRole: string) => {
    const currentStageIndex = teamStoreStages.findIndex(s => s.value === currentStatus);
    const currentStage = teamStoreStages[currentStageIndex];
    
    if (!currentStage) return statusSteps;

    // Always include current status
    const allowedStages = [currentStage];

    // Check if user can progress to next stage
    if (currentStageIndex < teamStoreStages.length - 1) {
      const nextStage = teamStoreStages[currentStageIndex + 1];
      if (nextStage.allowedRoles.includes(userRole)) {
        allowedStages.push(nextStage);
      }
    }

    // Admin/ops can also go to previous stage or any stage
    if (userRole === 'admin' || userRole === 'ops') {
      return statusSteps;
    }

    return statusSteps.filter(step => 
      allowedStages.some(allowed => allowed.value === step.key)
    );
  };

  // Filter status steps based on user permissions
  const availableStatusOptions = user && teamStoreStages.length > 0 
    ? getAllowedStatusTransitions(teamStore?.status || 'pending', user.role) 
    : statusSteps;

  // Fetch order details
  const { data: order } = useQuery<Order>({
    queryKey: ['/api/orders', teamStore?.orderId],
    enabled: !!teamStore?.orderId,
  });

  // Fetch organization details
  const { data: organization } = useQuery<Organization>({
    queryKey: ['/api/organizations', order?.orgId],
    enabled: !!order?.orgId,
  });

  // Fetch salesperson details
  const { data: salesperson } = useQuery<User | undefined>({
    queryKey: ['/api/users', teamStore?.salespersonId],
    queryFn: async () => {
      const users = await fetch('/api/users').then(r => r.json());
      return users.find((u: User) => u.id === teamStore?.salespersonId);
    },
    enabled: !!teamStore?.salespersonId,
  });

  // Fetch team store line items
  const { data: lineItems = [] } = useQuery<TeamStoreLineItem[]>({
    queryKey: ['/api/team-stores', teamStore?.id, 'line-items'],
    enabled: !!teamStore?.id,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/team-stores/${teamStore.id}`, {
        method: 'PUT',
        body: {
          storeName,
          status,
          storeOpenDate: storeOpenDate || null,
          storeCloseDate: storeCloseDate || null,
          notes,
          specialInstructions,
          totalRevenue,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores/archived/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores", teamStore.id] });
      toast({
        title: "Success",
        description: "Team store updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team store",
        variant: "destructive",
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/team-stores/${teamStore.id}/archive`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores/archived/list"] });
      toast({
        title: "Success",
        description: "Team store archived successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive team store",
        variant: "destructive",
      });
    },
  });

  // Unarchive mutation
  const unarchiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/team-stores/${teamStore.id}/unarchive`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores/archived/list"] });
      toast({
        title: "Success",
        description: "Team store unarchived successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unarchive team store",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/team-stores/${teamStore.id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores/archived/list"] });
      toast({
        title: "Success",
        description: "Team store deleted successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team store",
        variant: "destructive",
      });
    },
  });

  // Refresh line items mutation
  const refreshLineItemsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/team-stores/${teamStore.id}/refresh-line-items`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/team-stores', teamStore.id, 'line-items'] });
      toast({
        title: "Success",
        description: "Line items refreshed successfully",
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

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleArchive = () => {
    if (confirm('Are you sure you want to archive this team store?')) {
      archiveMutation.mutate();
    }
  };

  const handleUnarchive = () => {
    if (confirm('Are you sure you want to unarchive this team store?')) {
      unarchiveMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this team store? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const sizeColumns = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
  const sizeLabels: Record<string, string> = {
    yxs: 'YXS', ys: 'YS', ym: 'YM', yl: 'YL',
    xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL', xxl: 'XXL', xxxl: 'XXXL'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]" data-testid="dialog-team-store-detail">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            Team Store Details
          </DialogTitle>
          <DialogDescription>
            {teamStore?.storeCode}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-list-detail">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="order" data-testid="tab-order">Order Info</TabsTrigger>
            <TabsTrigger value="lineitems" data-testid="tab-lineitems">Line Items</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName" data-testid="label-store-name">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    data-testid="input-store-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" data-testid="label-status">Status</Label>
                  <Select value={status} onValueChange={setStatus} data-testid="select-status">
                    <SelectTrigger id="status" data-testid="select-trigger-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatusOptions.map(option => (
                        <SelectItem key={option.key} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeOpenDate" data-testid="label-open-date">Store Open Date</Label>
                  <Input
                    id="storeOpenDate"
                    type="date"
                    value={storeOpenDate}
                    onChange={(e) => setStoreOpenDate(e.target.value)}
                    data-testid="input-open-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeCloseDate" data-testid="label-close-date">Store Close Date</Label>
                  <Input
                    id="storeCloseDate"
                    type="date"
                    value={storeCloseDate}
                    onChange={(e) => setStoreCloseDate(e.target.value)}
                    data-testid="input-close-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" data-testid="label-notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions" data-testid="label-special-instructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                  data-testid="textarea-special-instructions"
                />
              </div>

              <div className="space-y-2">
                <Label>Total Revenue</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalRevenue}
                    onChange={(e) => setTotalRevenue(e.target.value)}
                    className="pl-9"
                    placeholder="0.00"
                    data-testid="input-team-store-revenue"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Total revenue generated by this team store</p>
              </div>
            </TabsContent>

            <TabsContent value="order" className="space-y-4">
              {order && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Order Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Order Code:</span>
                          <span className="text-sm font-medium" data-testid="text-order-code">{order.orderCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Order Name:</span>
                          <span className="text-sm font-medium" data-testid="text-order-name">{order.orderName}</span>
                        </div>
                        {organization && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Organization:</span>
                            <span className="text-sm font-medium" data-testid="text-org-name">{organization.name}</span>
                          </div>
                        )}
                        {salesperson && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Salesperson:</span>
                            <span className="text-sm font-medium" data-testid="text-salesperson-name">{salesperson.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Order Status:</span>
                          <Badge variant="secondary" data-testid="badge-order-status">{order.status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lineitems" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Line Items</CardTitle>
                    {(user?.role === 'admin' || user?.role === 'ops') && teamStore?.orderId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshLineItemsMutation.mutate()}
                        disabled={refreshLineItemsMutation.isPending}
                        className="flex items-center gap-2"
                        data-testid="button-refresh-line-items"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshLineItemsMutation.isPending ? 'animate-spin' : ''}`} />
                        {refreshLineItemsMutation.isPending ? 'Refreshing...' : 'Line Item Refresh'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {lineItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No line items found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lineItems.map((item) => (
                        <Card key={item.id} data-testid={`card-line-item-${item.id}`}>
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start gap-4">
                                {item.imageUrl && (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.productName || 'Product'} 
                                    className="w-16 h-16 object-cover rounded"
                                    data-testid={`img-product-${item.id}`}
                                  />
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold" data-testid={`text-product-name-${item.id}`}>
                                    {item.productName}
                                  </h4>
                                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                    <div data-testid={`text-variant-code-${item.id}`}>
                                      Code: {item.variantCode}
                                    </div>
                                    {item.variantColor && (
                                      <div data-testid={`text-variant-color-${item.id}`}>
                                        Color: {item.variantColor}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="border-t pt-3">
                                <div className="text-sm font-medium mb-2">Sizes:</div>
                                <div className="grid grid-cols-11 gap-2 text-xs">
                                  {sizeColumns.map(size => (
                                    <div key={size} className="text-center">
                                      <div className="font-medium mb-1">{sizeLabels[size]}</div>
                                      <div 
                                        className="bg-muted rounded px-2 py-1"
                                        data-testid={`text-size-${size}-${item.id}`}
                                      >
                                        {(item as any)[size] || 0}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            {teamStore?.archived ? (
              <Button
                variant="outline"
                onClick={handleUnarchive}
                disabled={unarchiveMutation.isPending}
                data-testid="button-unarchive"
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Unarchive
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleArchive}
                disabled={archiveMutation.isPending}
                data-testid="button-archive"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
