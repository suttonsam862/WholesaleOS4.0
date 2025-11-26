import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient as defaultQueryClient } from "@/lib/queryClient";
import { Manufacturer, insertManufacturerSchema, InsertManufacturer } from "@shared/schema";
import { Building2, Plus, Search, Edit, Trash2, Mail, Phone, Clock, Package } from "lucide-react";
import { z } from "zod";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function ManufacturerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);

  // Fetch manufacturers
  const { data: manufacturers = [], isLoading } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  // Filter manufacturers by search term
  const filteredManufacturers = manufacturers.filter(manufacturer =>
    manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manufacturer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertManufacturer) => {
      return await apiRequest("/api/manufacturers", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Manufacturer created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create manufacturer",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertManufacturer> }) => {
      return await apiRequest(`/api/manufacturers/${id}`, {
        method: "PUT",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsEditModalOpen(false);
      setSelectedManufacturer(null);
      toast({
        title: "Success",
        description: "Manufacturer updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update manufacturer",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/manufacturers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      setIsDeleteDialogOpen(false);
      setSelectedManufacturer(null);
      toast({
        title: "Success",
        description: "Manufacturer deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete manufacturer",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsEditModalOpen(true);
  };

  const handleDelete = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6" data-testid="manufacturer-management-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Building2 className="h-8 w-8" />
            Manufacturer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage manufacturing partners and vendors
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="button-add-manufacturer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Manufacturer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Manufacturers</CardTitle>
          <CardDescription>
            {filteredManufacturers.length} manufacturer{filteredManufacturers.length !== 1 ? 's' : ''} found
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, contact, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-manufacturers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading manufacturers...</div>
          ) : filteredManufacturers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No manufacturers found matching your search" : "No manufacturers yet. Add your first manufacturer to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManufacturers.map((manufacturer) => (
                    <TableRow key={manufacturer.id} data-testid={`row-manufacturer-${manufacturer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-manufacturer-name-${manufacturer.id}`}>
                        {manufacturer.name}
                      </TableCell>
                      <TableCell data-testid={`text-contact-name-${manufacturer.id}`}>
                        {manufacturer.contactName || "-"}
                      </TableCell>
                      <TableCell data-testid={`text-email-${manufacturer.id}`}>
                        {manufacturer.email ? (
                          <a href={`mailto:${manufacturer.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {manufacturer.email}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell data-testid={`text-phone-${manufacturer.id}`}>
                        {manufacturer.phone ? (
                          <a href={`tel:${manufacturer.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {manufacturer.phone}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell data-testid={`text-lead-time-${manufacturer.id}`}>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          {manufacturer.leadTimeDays} days
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-min-order-${manufacturer.id}`}>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Package className="h-3 w-3" />
                          {manufacturer.minOrderQty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(manufacturer)}
                            data-testid={`button-edit-${manufacturer.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(manufacturer)}
                            data-testid={`button-delete-${manufacturer.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Manufacturer Modal */}
      <ManufacturerFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        title="Add New Manufacturer"
        description="Enter the details of the new manufacturing partner"
      />

      {/* Edit Manufacturer Modal */}
      {selectedManufacturer && (
        <ManufacturerFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedManufacturer(null);
          }}
          onSubmit={(data) => updateMutation.mutate({ id: selectedManufacturer.id, data })}
          isPending={updateMutation.isPending}
          title="Edit Manufacturer"
          description="Update the manufacturer details"
          defaultValues={selectedManufacturer}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-manufacturer">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedManufacturer?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedManufacturer && deleteMutation.mutate(selectedManufacturer.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Manufacturer Form Modal Component
interface ManufacturerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertManufacturer) => void;
  isPending: boolean;
  title: string;
  description: string;
  defaultValues?: Manufacturer;
}

function ManufacturerFormModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  title,
  description,
  defaultValues,
}: ManufacturerFormModalProps) {
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string>("");

  const form = useForm<InsertManufacturer>({
    resolver: zodResolver(insertManufacturerSchema),
    defaultValues: (defaultValues || {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      notes: "",
      logoUrl: "",
      leadTimeDays: 14,
      minOrderQty: 1,
    }) as any,
  });

  // Update logo URL when defaultValues change
  useEffect(() => {
    if (defaultValues?.logoUrl) {
      setUploadedLogoUrl(defaultValues.logoUrl);
      form.setValue("logoUrl", defaultValues.logoUrl);
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: InsertManufacturer) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-manufacturer-form">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturer Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ABC Manufacturing Co." 
                      {...field} 
                      data-testid="input-manufacturer-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Smith" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-contact-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="contact@manufacturer.com" 
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+1 (555) 123-4567" 
                      {...field} 
                      value={field.value || ""}
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="leadTimeDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Time (Days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        {...field}
                        value={field.value || 14}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 14)}
                        data-testid="input-lead-time"
                      />
                    </FormControl>
                    <FormDescription>
                      Typical production lead time in days
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="minOrderQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        {...field}
                        value={field.value || 1}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-min-order-qty"
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum order quantity required
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control as any}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this manufacturer..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Manufacturer Logo (Optional)</FormLabel>
              {uploadedLogoUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedLogoUrl} 
                    alt="Manufacturer logo" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load logo:', uploadedLogoUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-manufacturer-logo-preview"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setUploadedLogoUrl("");
                      form.setValue("logoUrl", "");
                    }}
                    data-testid="button-remove-manufacturer-logo"
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <ObjectUploader
                  maxNumberOfFiles={1}
                  onGetUploadParameters={async (file) => {
                    const response = await apiRequest("POST", "/api/upload/image", {
                      filename: file.name,
                      size: file.size,
                      mimeType: file.type
                    }) as any;
                    return {
                      method: "PUT" as const,
                      url: response.uploadURL,
                      headers: {
                        'Content-Type': file.type
                      }
                    };
                  }}
                  onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                    if (result.successful?.[0]) {
                      const url = (result.successful[0] as any).uploadURL;
                      setUploadedLogoUrl(url);
                      form.setValue("logoUrl", url);
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    Upload Logo
                  </span>
                </ObjectUploader>
              )}
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-submit"
              >
                {isPending ? "Saving..." : defaultValues ? "Update Manufacturer" : "Create Manufacturer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
