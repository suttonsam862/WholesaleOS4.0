import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Factory,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  AlertCircle,
  Scissors,
  Ruler,
  Zap,
  AlertTriangle,
  MessageSquare,
  Tag,
  Palette,
  Check,
} from "lucide-react";
import { Link } from "wouter";

type ManufacturingNoteCategory = {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const ICON_OPTIONS = [
  { value: "Scissors", label: "Scissors", icon: Scissors },
  { value: "Ruler", label: "Ruler", icon: Ruler },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "AlertTriangle", label: "Alert Triangle", icon: AlertTriangle },
  { value: "MessageSquare", label: "Message Square", icon: MessageSquare },
  { value: "Tag", label: "Tag", icon: Tag },
  { value: "Factory", label: "Factory", icon: Factory },
  { value: "Palette", label: "Palette", icon: Palette },
] as const;

const getIconComponent = (iconName: string | null) => {
  const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName);
  return iconOption?.icon || MessageSquare;
};

const DEFAULT_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", 
  "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"
];

export default function ManufacturingCategoriesSettings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<ManufacturingNoteCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<ManufacturingNoteCategory | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "MessageSquare",
  });

  const canManage = user?.role === "admin" || user?.role === "ops";

  const { data: categories = [], isLoading } = useQuery<ManufacturingNoteCategory[]>({
    queryKey: ["/api/manufacturing-note-categories"],
    enabled: isAuthenticated,
  });

  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter(c => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories]);

  const inactiveCategories = useMemo(() => {
    return [...categories].filter(c => !c.isActive);
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("/api/manufacturing-note-categories", {
        method: "POST",
        body: {
          ...data,
          sortOrder: sortedCategories.length,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-note-categories"] });
      toast({ title: "Success", description: "Category created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ManufacturingNoteCategory> }) =>
      apiRequest(`/api/manufacturing-note-categories/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-note-categories"] });
      toast({ title: "Success", description: "Category updated successfully" });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/manufacturing-note-categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-note-categories"] });
      toast({ title: "Success", description: "Category archived successfully" });
      setDeleteCategory(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newSortOrder }: { id: number; newSortOrder: number }) => {
      return apiRequest(`/api/manufacturing-note-categories/${id}`, {
        method: "PUT",
        body: { sortOrder: newSortOrder },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing-note-categories"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#6366f1",
      icon: "MessageSquare",
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (category: ManufacturingNoteCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color || "#6366f1",
      icon: category.icon || "MessageSquare",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCategory || !formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editingCategory.id, data: formData });
  };

  const handleMoveUp = (category: ManufacturingNoteCategory, index: number) => {
    if (index === 0) return;
    const prevCategory = sortedCategories[index - 1];
    reorderMutation.mutate({ id: category.id, newSortOrder: prevCategory.sortOrder });
    reorderMutation.mutate({ id: prevCategory.id, newSortOrder: category.sortOrder });
  };

  const handleMoveDown = (category: ManufacturingNoteCategory, index: number) => {
    if (index === sortedCategories.length - 1) return;
    const nextCategory = sortedCategories[index + 1];
    reorderMutation.mutate({ id: category.id, newSortOrder: nextCategory.sortOrder });
    reorderMutation.mutate({ id: nextCategory.id, newSortOrder: category.sortOrder });
  };

  const handleReactivate = (category: ManufacturingNoteCategory) => {
    updateMutation.mutate({ id: category.id, data: { isActive: true } });
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-[#1a1a2e]/50 border-white/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to manage manufacturing categories.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="manufacturing-categories-page">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Factory className="h-8 w-8 text-primary" />
            Manufacturing Note Categories
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage categories for manufacturing notes on order line items
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-category">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a2e]/50 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Factory className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sortedCategories.length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a2e]/50 border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted/50 rounded-lg">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inactiveCategories.length}</p>
                <p className="text-sm text-muted-foreground">Archived</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a1a2e]/50 border-white/10">
        <CardHeader>
          <CardTitle>Active Categories</CardTitle>
          <CardDescription>
            Drag to reorder or use arrows. Categories are used for manufacturing notes on line items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedCategories.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first manufacturing note category to get started.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-category">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedCategories.map((category, index) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#1a1a2e]/30 border border-white/5 hover:border-white/10 transition-colors"
                    data-testid={`category-row-${category.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => handleMoveUp(category, index)}
                        data-testid={`button-move-up-${category.id}`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === sortedCategories.length - 1 || reorderMutation.isPending}
                        onClick={() => handleMoveDown(category, index)}
                        data-testid={`button-move-down-${category.id}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color || "#6366f1" }}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium" data-testid={`text-category-name-${category.id}`}>
                        {category.name}
                      </h4>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Order: {category.sortOrder}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                        data-testid={`button-edit-${category.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteCategory(category)}
                        data-testid={`button-delete-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {inactiveCategories.length > 0 && (
        <Card className="bg-[#1a1a2e]/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Archived Categories</CardTitle>
            <CardDescription>
              These categories are hidden from users but can be reactivated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveCategories.map((category) => {
                const IconComponent = getIconComponent(category.icon);
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border border-white/5 opacity-60"
                    data-testid={`archived-category-row-${category.id}`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center opacity-50"
                      style={{ backgroundColor: category.color || "#6366f1" }}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReactivate(category)}
                      data-testid={`button-reactivate-${category.id}`}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Reactivate
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Add a new manufacturing note category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fabric Change"
                data-testid="input-category-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                data-testid="input-category-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger data-testid="select-category-icon">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.color === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`color-option-${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="custom-color" className="text-sm">Custom:</Label>
                <Input
                  id="custom-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-8 p-0 border-0"
                  data-testid="input-custom-color"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-24"
                  placeholder="#6366f1"
                  data-testid="input-color-hex"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-submit-create">
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the manufacturing note category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fabric Change"
                data-testid="input-edit-category-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                data-testid="input-edit-category-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger data-testid="select-edit-category-icon">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      formData.color === color ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                    data-testid={`edit-color-option-${color}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="edit-custom-color" className="text-sm">Custom:</Label>
                <Input
                  id="edit-custom-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-8 p-0 border-0"
                  data-testid="input-edit-custom-color"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-24"
                  placeholder="#6366f1"
                  data-testid="input-edit-color-hex"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingCategory(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-submit-edit">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive "{deleteCategory?.name}"? 
              This will hide it from users but it can be reactivated later.
              Existing notes using this category will still be visible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategory && deleteMutation.mutate(deleteCategory.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
