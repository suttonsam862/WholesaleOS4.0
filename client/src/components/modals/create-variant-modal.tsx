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
import { Button } from "@/components/ui/button";
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

const createVariantSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  variantCode: z.string().min(1, "Variant code is required"),
  color: z.string().optional(),
  size: z.string().optional(),
  material: z.string().optional(),
  msrp: z.string()
    .optional()
    .refine((val) => !val || (val && /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0), "MSRP must be a positive number greater than 0"),
  cost: z.string()
    .optional()
    .refine((val) => !val || (val && /^\d+(\.\d{1,2})?$/.test(val) && parseFloat(val) > 0), "Cost must be a positive number greater than 0"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  defaultManufacturerId: z.number().optional(),
  backupManufacturerId: z.number().optional(),
});

type CreateVariantForm = z.infer<typeof createVariantSchema>;

interface CreateVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: number;
}

export function CreateVariantModal({ isOpen, onClose, productId }: CreateVariantModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const form = useForm<CreateVariantForm>({
    resolver: zodResolver(createVariantSchema),
    defaultValues: {
      productId: productId || undefined,
      variantCode: "",
      color: "",
      size: "",
      material: "",
      msrp: "",
      cost: "",
      imageUrl: "",
      defaultManufacturerId: undefined,
      backupManufacturerId: undefined,
    },
  });

  // Update productId when it changes
  useEffect(() => {
    if (productId) {
      form.setValue("productId", productId);
    }
  }, [productId, form]);

  // Fetch products for the dropdown if no productId is provided
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    enabled: !productId, // Only fetch if no productId provided
  });

  // Fetch manufacturers for the dropdown
  const { data: manufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturers"],
  });

  const createVariantMutation = useMutation({
    mutationFn: (data: CreateVariantForm) => 
      apiRequest("/api/variants", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product variant created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create variant",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateVariantForm) => {
    console.log("Submitting variant data:", data);
    createVariantMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="modal-create-variant">
        <DialogHeader>
          <DialogTitle>Add Product Variant</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!productId && (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-variant-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((product: any) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="variantCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., TSHIRT-001-RED-M"
                      data-testid="input-variant-code"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Red"
                        data-testid="input-variant-color"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="M"
                        data-testid="input-variant-size"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Cotton"
                        data-testid="input-variant-material"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="msrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MSRP</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="29.99"
                        data-testid="input-variant-msrp"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="15.00"
                        data-testid="input-variant-cost"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultManufacturerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Manufacturer</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-primary-manufacturer">
                          <SelectValue placeholder="Select primary manufacturer (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {manufacturers?.map((manufacturer: any) => (
                          <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                            {manufacturer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select manufacturer for production</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backupManufacturerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backup Manufacturer</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                      value={field.value?.toString() || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-backup-manufacturer">
                          <SelectValue placeholder="Select backup manufacturer (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {manufacturers?.map((manufacturer: any) => (
                          <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                            {manufacturer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Optional backup manufacturer</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Product Variant Image</FormLabel>
              {uploadedImageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedImageUrl} 
                    alt="Variant preview" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', uploadedImageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-variant-preview"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setUploadedImageUrl("");
                      form.setValue("imageUrl", "");
                    }}
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
                        const publicUrl = `/public-objects/${uploadId}`;
                        setUploadedImageUrl(publicUrl);
                        form.setValue("imageUrl", publicUrl);
                      }
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    Upload Variant Image
                  </span>
                </ObjectUploader>
              )}
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
                disabled={createVariantMutation.isPending}
                data-testid="button-submit-variant"
              >
                {createVariantMutation.isPending ? "Creating..." : "Add Variant"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}