import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const createProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  categoryId: z.number().min(1, "Category is required"),
  style: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.string()
    .regex(/^\d+\.?\d*$/, "Must be a valid price format (e.g., 19.99)")
    .refine((val) => parseFloat(val) > 0, "Base price must be greater than 0"),
  minOrderQty: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: number;
}

export function CreateProductModal({ isOpen, onClose, categoryId }: CreateProductModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: "",
      name: "",
      categoryId: categoryId || undefined,
      style: "",
      description: "",
      basePrice: "",
      minOrderQty: 1,
      active: true,
    },
    mode: "onChange",
  });

  // Update categoryId when it changes
  useEffect(() => {
    if (categoryId) {
      form.setValue("categoryId", categoryId);
    }
  }, [categoryId, form]);

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductForm) => {
      // Clean up data - remove empty strings for optional fields
      const cleanedData: any = { ...data };
      
      // Handle optional string fields
      if (!cleanedData.sku || cleanedData.sku === "") {
        delete cleanedData.sku;
      }
      if (!cleanedData.style || cleanedData.style === "") {
        delete cleanedData.style;
      }
      if (!cleanedData.description || cleanedData.description === "") {
        delete cleanedData.description;
      }
      
      // Ensure required fields are present and valid
      if (!cleanedData.name || cleanedData.name.trim() === "") {
        throw new Error("Product name is required");
      }
      
      if (!cleanedData.categoryId || isNaN(Number(cleanedData.categoryId))) {
        throw new Error("Valid category ID is required");
      }
      
      if (!cleanedData.basePrice || cleanedData.basePrice === "" || isNaN(Number(cleanedData.basePrice))) {
        throw new Error("Valid base price is required");
      }
      
      // Ensure minOrderQty is a valid number
      if (!cleanedData.minOrderQty || isNaN(Number(cleanedData.minOrderQty))) {
        cleanedData.minOrderQty = 1;
      }
      
      // Convert numeric strings to proper types for validation
      cleanedData.categoryId = Number(cleanedData.categoryId);
      cleanedData.minOrderQty = Number(cleanedData.minOrderQty);
      
      const product = await apiRequest("/api/catalog", {
        method: "POST",
        body: cleanedData
      }) as any;
      return product;
    },
    onSuccess: async (product: any) => {
      setCreatedProductId(product.id);
      
      // If there are images, update the product with them
      if (primaryImageUrl || additionalImages.length > 0) {
        try {
          await apiRequest("PUT", `/api/products/${product.id}/images`, {
            primaryImageUrl: primaryImageUrl || null,
            additionalImages: additionalImages.length > 0 ? additionalImages : null,
          });
        } catch {
          toast({
            title: "Warning",
            description: "Product created but images could not be saved",
            variant: "destructive",
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/catalog"] });
      toast({
        title: "Success",
        description: "Product created successfully" + (product.sku ? ` with SKU: ${product.sku}` : ""),
      });
      form.reset();
      setPrimaryImageUrl("");
      setAdditionalImages([]);
      setCreatedProductId(null);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateProductForm) => {
    createProductMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-product" aria-describedby="create-product-description">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <p id="create-product-description" className="text-sm text-muted-foreground">
            Create a new product in your catalog with details, pricing, and optional images.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Leave blank to auto-generate"
                        data-testid="input-product-sku"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Auto-generated if left blank</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="19.99"
                        data-testid="input-product-price"
                        onChange={(e) => {
                          // Allow only numbers and one decimal point
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = value.split('.');
                          if (parts.length > 2) {
                            return; // Don't allow multiple decimal points
                          }
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Classic T-Shirt"
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
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
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Classic, Modern, Sport"
                        data-testid="input-product-style"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="minOrderQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Order Quantity</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      placeholder="1"
                      onChange={(e) => {
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 1 : value);
                      }}
                      data-testid="input-product-min-order-qty"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Minimum quantity that can be ordered</p>
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
                      {...field}
                      placeholder="Brief description of the product"
                      data-testid="textarea-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div className="space-y-3">
              <FormLabel>Product Images (Optional)</FormLabel>
              
              {/* Primary Image */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Primary Image</p>
                {primaryImageUrl && (
                  <div className="relative inline-block">
                    <img 
                      src={primaryImageUrl} 
                      alt="Primary product" 
                      className="h-20 w-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      data-testid="img-product-primary"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                      onClick={() => setPrimaryImageUrl("")}
                    >
                      <i className="fas fa-times text-xs"></i>
                    </Button>
                  </div>
                )}
                {!primaryImageUrl && (
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
                        const uploadId = (result.successful[0] as any).__uploadId;
                        if (uploadId) {
                          setPrimaryImageUrl(uploadId);
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

              {/* Additional Images */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Additional Images</p>
                {additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {additionalImages.map((img, index) => (
                      <div key={index} className="relative inline-block">
                        <img 
                          src={img} 
                          alt={`Product ${index + 1}`} 
                          className="h-16 w-16 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          data-testid={`img-product-additional-${index}`}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-destructive text-destructive-foreground"
                          onClick={() => {
                            setAdditionalImages(additionalImages.filter((_, i) => i !== index));
                          }}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {additionalImages.length < 5 && (
                  <ObjectUploader
                    maxNumberOfFiles={5 - additionalImages.length}
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
                      const newImages = result.successful?.map((file: any) => file.__uploadId).filter(Boolean) || [];
                      setAdditionalImages([...additionalImages, ...newImages]);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <i className="fas fa-images"></i>
                      Add Gallery Images ({additionalImages.length}/5)
                    </span>
                  </ObjectUploader>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
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
                disabled={createProductMutation.isPending}
                data-testid="button-create-product"
              >
                {createProductMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}