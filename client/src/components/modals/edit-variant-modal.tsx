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

const editVariantSchema = z.object({
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
  imageUrl: z.string().optional().or(z.literal("")),
  frontTemplateUrl: z.string().optional().or(z.literal("")),
  backTemplateUrl: z.string().optional().or(z.literal("")),
  defaultManufacturerId: z.number().optional(),
  backupManufacturerId: z.number().optional(),
});

type EditVariantForm = z.infer<typeof editVariantSchema>;

interface EditVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: any;
}

export function EditVariantModal({ isOpen, onClose, variant }: EditVariantModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedFrontTemplateUrl, setUploadedFrontTemplateUrl] = useState<string>("");
  const [uploadedBackTemplateUrl, setUploadedBackTemplateUrl] = useState<string>("");

  const form = useForm<EditVariantForm>({
    resolver: zodResolver(editVariantSchema),
    defaultValues: {
      productId: undefined,
      variantCode: "",
      color: "",
      size: "",
      material: "",
      msrp: "",
      cost: "",
      imageUrl: "",
      frontTemplateUrl: "",
      backTemplateUrl: "",
      defaultManufacturerId: undefined,
      backupManufacturerId: undefined,
    },
  });

  // Fetch products for the dropdown
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Fetch manufacturers for the dropdown
  const { data: manufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturers"],
  });

  // Update form when variant changes
  useEffect(() => {
    if (variant) {
      form.setValue("productId", variant.productId || undefined);
      form.setValue("variantCode", variant.variantCode || "");
      form.setValue("color", variant.color || "");
      form.setValue("size", variant.size || "");
      form.setValue("material", variant.material || "");
      form.setValue("msrp", variant.msrp || "");
      form.setValue("cost", variant.cost || "");
      form.setValue("imageUrl", variant.imageUrl || "");
      form.setValue("frontTemplateUrl", variant.frontTemplateUrl || "");
      form.setValue("backTemplateUrl", variant.backTemplateUrl || "");
      form.setValue("defaultManufacturerId", variant.defaultManufacturerId || undefined);
      form.setValue("backupManufacturerId", variant.backupManufacturerId || undefined);
    }
  }, [variant, form]);

  const editVariantMutation = useMutation({
    mutationFn: (data: EditVariantForm) => 
      apiRequest(`/api/variants/${variant.id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product variant updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product variant",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditVariantForm) => {
    editVariantMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" data-testid="modal-edit-variant">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Product Variant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
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
                      <SelectTrigger data-testid="select-edit-variant-product">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product: any) => (
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
            <FormField
              control={form.control}
              name="variantCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter variant code (e.g., SHIRT-001-BLU-L)" 
                      {...field} 
                      data-testid="input-edit-variant-code"
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
                        placeholder="e.g., Blue" 
                        {...field} 
                        data-testid="input-edit-variant-color"
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
                        placeholder="e.g., L" 
                        {...field} 
                        data-testid="input-edit-variant-size"
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
                        placeholder="e.g., Cotton" 
                        {...field} 
                        data-testid="input-edit-variant-material"
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
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-edit-variant-msrp"
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
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        data-testid="input-edit-variant-cost"
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
                        <SelectTrigger data-testid="select-edit-primary-manufacturer">
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
                    <p className="text-xs text-muted-foreground">Select manufacturer for production (optional)</p>
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
                        <SelectTrigger data-testid="select-edit-backup-manufacturer">
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
              {(uploadedImageUrl || variant?.imageUrl) ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedImageUrl || variant?.imageUrl} 
                    alt="Variant preview" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', uploadedImageUrl || variant?.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-variant-preview-edit"
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

            <div className="space-y-2">
              <FormLabel>Front Template (for AI Design)</FormLabel>
              <p className="text-xs text-muted-foreground">Upload a template image of the front of the product for AI mockup generation</p>
              {(uploadedFrontTemplateUrl || variant?.frontTemplateUrl) ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedFrontTemplateUrl || variant?.frontTemplateUrl} 
                    alt="Front template preview" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', uploadedFrontTemplateUrl || variant?.frontTemplateUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-front-template-preview-edit"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setUploadedFrontTemplateUrl("");
                      form.setValue("frontTemplateUrl", "");
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
                        setUploadedFrontTemplateUrl(publicUrl);
                        form.setValue("frontTemplateUrl", publicUrl);
                      }
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    Upload Front Template
                  </span>
                </ObjectUploader>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Back Template (for AI Design)</FormLabel>
              <p className="text-xs text-muted-foreground">Upload a template image of the back of the product for AI mockup generation</p>
              {(uploadedBackTemplateUrl || variant?.backTemplateUrl) ? (
                <div className="relative inline-block">
                  <img 
                    src={uploadedBackTemplateUrl || variant?.backTemplateUrl} 
                    alt="Back template preview" 
                    className="h-32 w-32 object-cover rounded-lg border"
                    onError={(e) => {
                      console.error('Failed to load image:', uploadedBackTemplateUrl || variant?.backTemplateUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    data-testid="img-back-template-preview-edit"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => {
                      setUploadedBackTemplateUrl("");
                      form.setValue("backTemplateUrl", "");
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
                        setUploadedBackTemplateUrl(publicUrl);
                        form.setValue("backTemplateUrl", publicUrl);
                      }
                    }
                  }}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-upload"></i>
                    Upload Back Template
                  </span>
                </ObjectUploader>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t sticky bottom-0 bg-background pb-1">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-edit-variant">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editVariantMutation.isPending}
                data-testid="button-save-variant"
              >
                {editVariantMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}