import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users, Calendar, Briefcase, Edit, UserCheck, UserX, Eye, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { canModify } from "@/lib/permissions";
import { useLocation } from "wouter";

// Designer form interfaces
interface DesignerForm {
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
}

export default function DesignerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDesigner, setSelectedDesigner] = useState<any>(null);
  const [designerForm, setDesignerForm] = useState<DesignerForm>({
    name: "",
    email: "",
    phone: "",
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Get current user for permissions
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user']
  });

  // Get all designers
  const { data: designers = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/designers']
  });

  // Get design jobs for workload analysis
  const { data: designJobs = [] } = useQuery<any[]>({
    queryKey: ['/api/design-jobs']
  });

  // Mutations for CRUD operations
  const createDesignerMutation = useMutation({
    mutationFn: async (data: DesignerForm) => {
      return apiRequest('/api/users', {
        method: 'POST',
        body: {
          ...data,
          role: 'designer'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designer created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create designer",
        variant: "destructive"
      });
    }
  });

  const updateDesignerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DesignerForm> }) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'PUT',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designer updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update designer",
        variant: "destructive"
      });
    }
  });

  const toggleDesignerStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'PUT',
        body: { isActive }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designer status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update designer status",
        variant: "destructive"
      });
    }
  });

  const deleteDesignerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Designer deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete designer",
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const resetForm = () => {
    setDesignerForm({
      name: "",
      email: "",
      phone: "",
      isActive: true
    });
    setSelectedDesigner(null);
  };

  const handleCreateDesigner = () => {
    setIsCreateDialogOpen(true);
    resetForm();
  };

  const handleEditDesigner = (designer: any) => {
    setSelectedDesigner(designer);
    setDesignerForm({
      name: designer.name || "",
      email: designer.email || "",
      phone: designer.phone || "",
      isActive: designer.isActive ?? true
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitCreate = () => {
    if (!designerForm.name || !designerForm.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }
    createDesignerMutation.mutate(designerForm);
  };

  const handleSubmitEdit = () => {
    if (!selectedDesigner || !designerForm.name || !designerForm.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive"
      });
      return;
    }
    updateDesignerMutation.mutate({
      id: selectedDesigner.id,
      data: designerForm
    });
  };

  const handleToggleStatus = (designer: any) => {
    toggleDesignerStatusMutation.mutate({
      id: designer.id,
      isActive: !designer.isActive
    });
  };

  const handleViewJobs = (designer: any) => {
    // Navigate to design jobs page (future enhancement: filter by designer)
    setLocation('/design-jobs');
  };

  const handleAssignJob = (designer: any) => {
    // Navigate to design jobs page with assignments tab
    setLocation('/design-jobs');
  };

  const handleDeleteDesigner = (designer: any) => {
    if (confirm(`Are you sure you want to delete designer "${designer.name}"? This action cannot be undone.`)) {
      deleteDesignerMutation.mutate(designer.id);
    }
  };

  const filteredDesigners = designers.filter(designer =>
    designer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    designer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDesignerWorkload = (designerId: string) => {
    const jobs = designJobs.filter((job: any) => job.assignedDesignerId === designerId);
    const activeJobs = jobs.filter((job: any) => ['assigned', 'in_progress'].includes(job.status));
    const completedJobs = jobs.filter((job: any) => job.status === 'completed');
    return { total: jobs.length, active: activeJobs.length, completed: completedJobs.length };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="designer-management-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Designer Management</h1>
          <p className="text-muted-foreground">Manage designers, track workloads, and assign design jobs</p>
        </div>
        {canModify(currentUser as any, 'designerManagement') && (
          <Button onClick={handleCreateDesigner} data-testid="button-add-designer">
            <Plus className="w-4 h-4 mr-2" />
            Add Designer
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Designers</p>
                <p className="text-2xl font-bold" data-testid="text-total-designers">{designers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold" data-testid="text-active-jobs">
                  {designJobs.filter(job => ['assigned', 'in_progress'].includes(job.status)).length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed This Month</p>
                <p className="text-2xl font-bold" data-testid="text-completed-month">
                  {designJobs.filter(job => job.status === 'completed').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Workload</p>
                <p className="text-2xl font-bold" data-testid="text-avg-workload">
                  {designers.length > 0 ? Math.round(designJobs.length / designers.length) : 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search designers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-designers"
          />
        </div>
      </div>

      {/* Designers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDesigners.map((designer) => {
          const workload = getDesignerWorkload(designer.id);
          return (
            <Card key={designer.id} className="hover:shadow-lg transition-shadow" data-testid={`card-designer-${designer.id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {designer.name?.charAt(0) || 'D'}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-designer-name-${designer.id}`}>
                        {designer.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground" data-testid={`text-designer-email-${designer.id}`}>
                        {designer.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant={designer.isActive ? "default" : "secondary"} data-testid={`badge-designer-status-${designer.id}`}>
                    {designer.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Workload Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-orange-600" data-testid={`text-active-jobs-${designer.id}`}>
                        {workload.active}
                      </p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600" data-testid={`text-completed-jobs-${designer.id}`}>
                        {workload.completed}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600" data-testid={`text-total-jobs-${designer.id}`}>
                        {workload.total}
                      </p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>

                  {/* Workload Indicator */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Workload</span>
                      <span className={cn(
                        "font-medium",
                        workload.active <= 2 ? "text-green-600" : workload.active <= 5 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {workload.active <= 2 ? "Light" : workload.active <= 5 ? "Moderate" : "Heavy"}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all",
                          workload.active <= 2 ? "bg-green-500" : workload.active <= 5 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${Math.min((workload.active / 8) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {canModify(currentUser as any, 'designerManagement') && (
                      <>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditDesigner(designer)}
                            data-testid={`button-edit-${designer.id}`}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant={designer.isActive ? "destructive" : "default"}
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleToggleStatus(designer)}
                            disabled={toggleDesignerStatusMutation.isPending}
                            data-testid={`button-toggle-status-${designer.id}`}
                          >
                            {designer.isActive ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                            {designer.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteDesigner(designer)}
                          disabled={deleteDesignerMutation.isPending}
                          data-testid={`button-delete-${designer.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete Designer
                        </Button>
                      </>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleViewJobs(designer)}
                        data-testid={`button-view-jobs-${designer.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Jobs
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleAssignJob(designer)}
                        data-testid={`button-assign-job-${designer.id}`}
                      >
                        <Briefcase className="w-4 h-4 mr-1" />
                        Assign Job
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDesigners.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No designers found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search criteria" : "Add your first designer to get started"}
          </p>
        </div>
      )}

      {/* Create Designer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Designer</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add a new designer to manage design jobs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={designerForm.name}
                onChange={(e) => setDesignerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter designer name"
                data-testid="input-create-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={designerForm.email}
                onChange={(e) => setDesignerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                data-testid="input-create-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={designerForm.phone}
                onChange={(e) => setDesignerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                data-testid="input-create-phone"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={designerForm.isActive}
                onCheckedChange={(checked) => setDesignerForm(prev => ({ ...prev, isActive: checked }))}
                data-testid="switch-create-active"
              />
              <Label htmlFor="create-active">Active</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createDesignerMutation.isPending}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitCreate}
              disabled={createDesignerMutation.isPending}
              data-testid="button-submit-create"
            >
              {createDesignerMutation.isPending ? "Creating..." : "Create Designer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Designer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Designer</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update designer details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={designerForm.name}
                onChange={(e) => setDesignerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter designer name"
                data-testid="input-edit-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={designerForm.email}
                onChange={(e) => setDesignerForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                data-testid="input-edit-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={designerForm.phone}
                onChange={(e) => setDesignerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                data-testid="input-edit-phone"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={designerForm.isActive}
                onCheckedChange={(checked) => setDesignerForm(prev => ({ ...prev, isActive: checked }))}
                data-testid="switch-edit-active"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateDesignerMutation.isPending}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={updateDesignerMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updateDesignerMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}