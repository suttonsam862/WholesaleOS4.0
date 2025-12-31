import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { X } from "lucide-react";

const editProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  categoryId: z.number().min(1, "Category is required"),
  description: z.string().optional(),
  basePrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid price format (e.g., 19.99)")
    .refine((val) => parseFloat(val) > 0, "Base price must be greater than 0"),
  active: z.boolean(),
  primaryImageUrl: z.string().optional(),
  additionalImages: z.array(z.string()).optional(),
});

type EditProductForm = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string>("");
  const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([]);

  const form = useForm<EditProductForm>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      sku: "",
      name: "",
      categoryId: undefined,
      description: "",
      basePrice: "",
      active: true,
      primaryImageUrl: "",
      additionalImages: [],
    },
  });

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  // Update form when product changes
  useEffect(() => {
    if (product) {
      form.setValue("sku", product.sku || "");
      form.setValue("name", product.name || "");
      form.setValue("categoryId", product.categoryId || undefined);
      form.setValue("description", product.description || "");
      form.setValue("basePrice", product.basePrice || "");
      form.setValue("active", product.active ?? true);
      form.setValue("primaryImageUrl", product.primaryImageUrl || "");
      form.setValue("additionalImages", product.additionalImages || []);
      setPrimaryImageUrl(product.primaryImageUrl || "");
      setAdditionalImageUrls(product.additionalImages || []);
    }
  }, [product, form]);

  const editProductMutation = useMutation({
    mutationFn: (data: EditProductForm) => 
      apiRequest("PUT", `/api/catalog/${product.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditProductForm) => {
    editProductMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-edit-product">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter product SKU" 
                        {...field} 
                        data-testid="input-edit-product-sku"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter product name" 
                        {...field} 
                        data-testid="input-edit-product-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-edit-product-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this product..." 
                      {...field} 
                      data-testid="textarea-edit-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-edit-product-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Product is available for sale
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-product-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Primary Product Image (Optional)</FormLabel>
              {primaryImageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={primaryImageUrl} 
                    alt="Product primary preview" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', primaryImageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-product-primary-preview-edit"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setPrimaryImageUrl("");
                      form.setValue("primaryImageUrl", "");
                    }}
                    data-testid="button-remove-product-primary-image-edit"
                  >
                    <X className="w-4 h-4" />
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
                    (file as any).__uploadId = response.uploadId;
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
                      const file = result.successful[0] as any;
                      const uploadId = file.__uploadId;
                      if (uploadId) {
                        setPrimaryImageUrl(uploadId);
                        form.setValue("primaryImageUrl", uploadId);
                      }
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    Upload Primary Image
                  </span>
                </ObjectUploader>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Additional Product Images (Optional)</FormLabel>
              {additionalImageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {additionalImageUrls.map((url, index) => (
                    <div key={index} className="relative inline-block">
                      <img 
                        src={url} 
                        alt={`Additional preview ${index + 1}`} 
                        className="h-24 w-24 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Failed to load image:', url);
                          e.currentTarget.style.display = 'none';
                        }}
                        data-testid={`img-product-additional-preview-${index}-edit`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                        onClick={() => {
                          const newImages = additionalImageUrls.filter((_, i) => i !== index);
                          setAdditionalImageUrls(newImages);
                          form.setValue("additionalImages", newImages);
                        }}
                        data-testid={`button-remove-product-additional-image-${index}-edit`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <ObjectUploader
                maxNumberOfFiles={5}
                onGetUploadParameters={async (file) => {
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
                }}
                onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                  if (result.successful && result.successful.length > 0) {
                    const newUrls: string[] = [];
                    result.successful.forEach((file: any) => {
                      const uploadId = file.__uploadId;
                      if (uploadId) {
                        newUrls.push(uploadId);
                      }
                    });
                    const updatedImages = [...additionalImageUrls, ...newUrls];
                    setAdditionalImageUrls(updatedImages);
                    form.setValue("additionalImages", updatedImages);
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  <i className="fas fa-upload"></i>
                  Upload Additional Images
                </span>
              </ObjectUploader>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-edit-product">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editProductMutation.isPending}
                data-testid="button-save-product"
              >
                {editProductMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}