import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { ProductFamily, InsertProductFamily, Manufacturer, ProductFamilyManufacturer, insertProductFamilySchema } from "@shared/schema";
import { DECORATION_METHOD_LABELS } from "@shared/constants";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Clock,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Factory
} from "lucide-react";
import { z } from "zod";

// Form schema
const productFamilyFormSchema = insertProductFamilySchema.extend({
  decorationMethods: z.array(z.string()).optional(),
});

type ProductFamilyFormData = z.infer<typeof productFamilyFormSchema>;

type ProductFamilyWithAssignments = ProductFamily & {
  manufacturerAssignments?: (ProductFamilyManufacturer & { manufacturer: Manufacturer })[];
};

export default function ProductFamiliesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<ProductFamily | null>(null);
  const [expandedFamilies, setExpandedFamilies] = useState<Set<number>>(new Set());

  // Fetch product families
  const { data: families = [], isLoading } = useQuery<ProductFamily[]>({
    queryKey: ["/api/product-families"],
    queryFn: async () => {
      const res = await fetch("/api/product-families?includeInactive=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch product families");
      return res.json();
    },
  });

  // Fetch manufacturers for assignment
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  // Fetch manufacturer assignments for expanded families
  const expandedFamiliesArray = Array.from(expandedFamilies);
  const { data: familyAssignments = {} } = useQuery<Record<number, (ProductFamilyManufacturer & { manufacturer: Manufacturer })[]>>({
    queryKey: ["/api/product-family-assignments", expandedFamiliesArray],
    queryFn: async () => {
      const assignments: Record<number, (ProductFamilyManufacturer & { manufacturer: Manufacturer })[]> = {};
      for (const familyId of expandedFamiliesArray) {
        const res = await fetch(`/api/product-families/${familyId}/manufacturers`, { credentials: "include" });
        if (res.ok) {
          assignments[familyId] = await res.json();
        }
      }
      return assignments;
    },
    enabled: expandedFamilies.size > 0,
  });

  // Filter families by search term
  const filteredFamilies = families.filter(family =>
    family.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Form for create/edit
  const form = useForm<ProductFamilyFormData>({
    resolver: zodResolver(productFamilyFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      decorationMethods: [],
      defaultLeadTimeDays: 14,
      defaultMinOrderQty: 12,
      isActive: true,
      sortOrder: 0,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductFamilyFormData) => {
      const res = await fetch("/api/product-families", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create product family");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-families"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Product family created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product family",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFamilyFormData & { id: number }) => {
      const { id, ...updateData } = data;
      const res = await fetch(`/api/product-families/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product family");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-families"] });
      setIsEditModalOpen(false);
      setSelectedFamily(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product family updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product family",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/product-families/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete product family");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-families"] });
      setIsDeleteDialogOpen(false);
      setSelectedFamily(null);
      toast({
        title: "Success",
        description: "Product family deactivated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product family",
        variant: "destructive",
      });
    },
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/product-families/seed", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to seed product families");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-families"] });
      toast({
        title: "Success",
        description: "Product families seeded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed product families",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (family: ProductFamily) => {
    setSelectedFamily(family);
    form.reset({
      code: family.code,
      name: family.name,
      description: family.description || "",
      decorationMethods: family.decorationMethods || [],
      defaultLeadTimeDays: family.defaultLeadTimeDays || 14,
      defaultMinOrderQty: family.defaultMinOrderQty || 12,
      isActive: family.isActive ?? true,
      sortOrder: family.sortOrder || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (family: ProductFamily) => {
    setSelectedFamily(family);
    setIsDeleteDialogOpen(true);
  };

  const toggleExpand = (familyId: number) => {
    const newExpanded = new Set(expandedFamilies);
    if (newExpanded.has(familyId)) {
      newExpanded.delete(familyId);
    } else {
      newExpanded.add(familyId);
    }
    setExpandedFamilies(newExpanded);
  };

  const decorationMethodOptions = Object.entries(DECORATION_METHOD_LABELS);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="h-8 w-8 text-purple-400" />
            Product Families
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage product categories and manufacturer routing
          </p>
        </div>
        <div className="flex gap-2">
          {families.length === 0 && (
            <Button
              onClick={() => seedMutation.mutate()}
              variant="outline"
              disabled={seedMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {seedMutation.isPending ? "Seeding..." : "Seed Default Families"}
            </Button>
          )}
          <Button onClick={() => {
            form.reset();
            setIsCreateModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Family
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/10 bg-purple-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-400">Total Families</p>
              <h3 className="text-2xl font-bold text-white">{families.length}</h3>
            </div>
            <Layers className="h-8 w-8 text-purple-400 opacity-50" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-green-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Active</p>
              <h3 className="text-2xl font-bold text-white">
                {families.filter(f => f.isActive).length}
              </h3>
            </div>
            <Package className="h-8 w-8 text-green-400 opacity-50" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-blue-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">Manufacturers</p>
              <h3 className="text-2xl font-bold text-white">{manufacturers.length}</h3>
            </div>
            <Factory className="h-8 w-8 text-blue-400 opacity-50" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-amber-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-400">Avg Lead Time</p>
              <h3 className="text-2xl font-bold text-white">
                {families.length > 0
                  ? Math.round(families.reduce((sum, f) => sum + (f.defaultLeadTimeDays || 14), 0) / families.length)
                  : 0} days
              </h3>
            </div>
            <Clock className="h-8 w-8 text-amber-400 opacity-50" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search product families..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="glass-card border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Decoration Methods</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Min Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredFamilies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No product families found
                </TableCell>
              </TableRow>
            ) : (
              filteredFamilies.map((family) => (
                <>
                  <TableRow key={family.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(family.id)}
                      >
                        {expandedFamilies.has(family.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-purple-400">
                      {family.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{family.name}</div>
                        {family.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {family.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {family.decorationMethods?.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {DECORATION_METHOD_LABELS[method as keyof typeof DECORATION_METHOD_LABELS] || method}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {family.defaultLeadTimeDays || 14} days
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {family.defaultMinOrderQty || 12}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={family.isActive ? "default" : "secondary"}
                        className={family.isActive ? "bg-green-500/20 text-green-400" : ""}
                      >
                        {family.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(family)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(family)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded row showing manufacturer assignments */}
                  {expandedFamilies.has(family.id) && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-black/20 p-4">
                        <div className="pl-8">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Assigned Manufacturers
                          </h4>
                          {familyAssignments[family.id]?.length > 0 ? (
                            <div className="grid gap-2">
                              {familyAssignments[family.id].map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                >
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="text-xs">
                                      Priority {assignment.priority}
                                    </Badge>
                                    <span className="font-medium">
                                      {assignment.manufacturer.name}
                                    </span>
                                    {assignment.leadTimeDays && (
                                      <span className="text-sm text-muted-foreground">
                                        {assignment.leadTimeDays} days
                                      </span>
                                    )}
                                    {assignment.canDoRush && (
                                      <Badge variant="secondary" className="text-xs">
                                        Rush
                                      </Badge>
                                    )}
                                  </div>
                                  <Badge
                                    variant={assignment.isActive ? "default" : "secondary"}
                                    className={assignment.isActive ? "bg-green-500/20 text-green-400" : ""}
                                  >
                                    {assignment.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No manufacturers assigned yet
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedFamily(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Product Family" : "Create Product Family"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen
                ? "Update the product family details below."
                : "Add a new product family for manufacturer routing."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {
              if (isEditModalOpen && selectedFamily) {
                updateMutation.mutate({ ...data, id: selectedFamily.id });
              } else {
                createMutation.mutate(data);
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="CCS" {...field} />
                      </FormControl>
                      <FormDescription>Short unique identifier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Custom Cut & Sew Sublimation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this product family..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="decorationMethods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Decoration Methods</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {decorationMethodOptions.map(([value, label]) => (
                        <Badge
                          key={value}
                          variant={field.value?.includes(value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const current = field.value || [];
                            if (current.includes(value)) {
                              field.onChange(current.filter(v => v !== value));
                            } else {
                              field.onChange([...current, value]);
                            }
                          }}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="defaultLeadTimeDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Lead Time (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 14)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="defaultMinOrderQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Min Order Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 12)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive families won't be used for routing
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedFamily(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEditModalOpen
                    ? "Update"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Product Family?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate "{selectedFamily?.name}". The family can be reactivated later.
              Existing products and orders will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFamily && deleteMutation.mutate(selectedFamily.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
