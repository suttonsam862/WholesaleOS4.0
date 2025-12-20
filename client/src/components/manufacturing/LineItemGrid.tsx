import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import { Upload, Image as ImageIcon, Check, Package, Hash, Eye } from "lucide-react";
import { useState } from "react";
import { FullScreenImageViewer } from "@/components/FullScreenImageViewer";
import { cn } from "@/lib/utils";

interface LineItem {
  id: number;
  itemName?: string;
  colorNotes?: string;
  imageUrl?: string;
  yxs: number;
  ys: number;
  ym: number;
  yl: number;
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  variantId: number;
  orderId: number;
  manufacturer?: {
    id: number;
    name: string;
  };
  manufacturerAssignment?: {
    id: number;
    lineItemId: number;
    manufacturerId: number;
  };
}

interface LineItemGridProps {
  lineItems: LineItem[];
  productVariants: any[];
  orderId: number;
}

interface UploadingState {
  [key: number]: boolean;
}

export function LineItemGrid({ lineItems, productVariants, orderId }: LineItemGridProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState<UploadingState>({});
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const uploadImageMutation = useMutation({
    mutationFn: async ({ lineItemId, file }: { lineItemId: number; file: File }) => {
      // Step 1: Get presigned URL
      const uploadResponse = await apiRequest("/api/upload/image", {
        method: "POST",
        body: {
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        },
      });

      const { uploadURL, uploadId, sanitizedFilename } = uploadResponse as any;

      // Step 2: Upload file to object storage
      const uploadResult = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      // Step 3: Construct the public URL
      const imageUrl = `/public-objects/${uploadId}`;

      // Step 4: Update line item with image URL
      await apiRequest(`/api/orders/${orderId}/line-items/${lineItemId}`, {
        method: "PUT",
        body: { imageUrl },
      });

      return imageUrl;
    },
    onSuccess: (imageUrl, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-line-items", orderId] });
      setUploading(prev => ({ ...prev, [variables.lineItemId]: false }));
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: (error, variables) => {
      setUploading(prev => ({ ...prev, [variables.lineItemId]: false }));
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (lineItemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploading(prev => ({ ...prev, [lineItemId]: true }));
      uploadImageMutation.mutate({ lineItemId, file });
    }
  };

  const getSizeLabel = (size: string): string => {
    const sizeMap: { [key: string]: string } = {
      yxs: "YXS",
      ys: "YS",
      ym: "YM",
      yl: "YL",
      xs: "XS",
      s: "S",
      m: "M",
      l: "L",
      xl: "XL",
      xxl: "2XL",
      xxxl: "3XL",
      xxxxl: "4XL",
    };
    return sizeMap[size] || size.toUpperCase();
  };

  const calculateTotalQty = (item: LineItem): number => {
    return item.yxs + item.ys + item.ym + item.yl + 
           item.xs + item.s + item.m + item.l + 
           item.xl + item.xxl + item.xxxl + item.xxxxl;
  };

  const getSizeBreakdown = (item: LineItem): { size: string; qty: number }[] => {
    const sizes = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'];
    return sizes
      .map(size => ({ size, qty: (item as any)[size] || 0 }))
      .filter(s => s.qty > 0);
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {lineItems.map((item, index) => {
          const variant = productVariants.find((v: any) => v.id === item.variantId);
          const sizeBreakdown = getSizeBreakdown(item);
          const totalQty = calculateTotalQty(item);
          const isUploading = uploading[item.id];
          const isExpanded = expandedItem === item.id;

          return (
            <MobileDataCard
              key={item.id}
              index={index}
              title={item.itemName || variant?.variantCode || 'Line Item'}
              subtitle={item.colorNotes}
              status={item.manufacturer ? {
                value: "assigned",
                label: item.manufacturer.name
              } : {
                value: "unassigned",
                label: "Unassigned"
              }}
              metadata={[
                {
                  label: "Total",
                  value: totalQty,
                  icon: <Hash className="h-3 w-3" />
                },
                {
                  label: "Sizes",
                  value: sizeBreakdown.length,
                  icon: <Package className="h-3 w-3" />
                }
              ]}
              onClick={() => setExpandedItem(isExpanded ? null : item.id)}
              data-testid={`mobile-line-item-${item.id}`}
              actions={item.imageUrl ? [
                {
                  label: "View",
                  icon: <Eye className="h-4 w-4" />,
                  onClick: () => setFullScreenImage(item.imageUrl || null),
                  variant: "default"
                }
              ] : []}
            />
          );
        })}

        {expandedItem && (
          <Card className="glass-card border-white/10">
            <CardContent className="p-4 space-y-4">
              {(() => {
                const item = lineItems.find(i => i.id === expandedItem);
                if (!item) return null;
                const sizeBreakdown = getSizeBreakdown(item);
                const isUploading = uploading[item.id];
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Size Breakdown</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedItem(null)}
                        className="h-8 text-xs"
                      >
                        Close
                      </Button>
                    </div>
                    
                    <ScrollArea className="w-full">
                      <div className="flex gap-2 pb-2">
                        {sizeBreakdown.map((sizeInfo) => (
                          <div
                            key={sizeInfo.size}
                            className="border rounded-md p-2 text-center min-w-[60px] shrink-0"
                            data-testid={`size-${sizeInfo.size}-${item.id}`}
                          >
                            <div className="text-xs font-semibold text-muted-foreground">
                              {getSizeLabel(sizeInfo.size)}
                            </div>
                            <div className="text-lg font-bold">{sizeInfo.qty}</div>
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>

                    {item.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={item.imageUrl}
                          alt={item.itemName || 'Line item'}
                          className="w-full h-40 object-cover rounded-md border cursor-pointer"
                          onClick={() => setFullScreenImage(item.imageUrl || null)}
                          data-testid={`img-manufacturing-line-item-${item.id}`}
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-md p-4 text-center">
                        <Label htmlFor={`image-upload-mobile-${item.id}`} className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            className="h-11 min-h-[44px]"
                            asChild
                          >
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {isUploading ? "Uploading..." : "Upload Image"}
                            </span>
                          </Button>
                        </Label>
                        <Input
                          id={`image-upload-mobile-${item.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(item.id, e)}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {fullScreenImage && (
          <FullScreenImageViewer
            isOpen={!!fullScreenImage}
            imageUrl={fullScreenImage}
            onClose={() => setFullScreenImage(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lineItems.map((item) => {
        const variant = productVariants.find((v: any) => v.id === item.variantId);
        const sizeBreakdown = getSizeBreakdown(item);
        const totalQty = calculateTotalQty(item);
        const isUploading = uploading[item.id];

        return (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left: Item Details & Image Upload */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">
                      {item.itemName || variant?.variantCode || 'Item'}
                    </h4>
                    {item.colorNotes && (
                      <p className="text-xs text-muted-foreground mt-1">{item.colorNotes}</p>
                    )}
                    {item.manufacturer && (
                      <Badge 
                        variant="outline" 
                        className="mt-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800"
                        data-testid={`badge-manufacturer-${item.id}`}
                      >
                        {item.manufacturer.name}
                      </Badge>
                    )}
                    {!item.manufacturer && (
                      <Badge 
                        variant="outline" 
                        className="mt-2 bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700"
                        data-testid={`badge-no-manufacturer-${item.id}`}
                      >
                        Unassigned
                      </Badge>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor={`image-upload-${item.id}`} className="text-xs">
                      Line Item Image
                    </Label>
                    {item.imageUrl ? (
                      <div className="relative">
                        <img 
                          src={item.imageUrl}
                          alt={item.itemName || 'Line item'}
                          className="w-full h-32 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setFullScreenImage(item.imageUrl || null)}
                          data-testid={`img-manufacturing-line-item-${item.id}`}
                          title="Click to view full size"
                          onError={(e) => {
                            console.error('Failed to load image:', item.imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            <Check className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        </div>
                        <Input
                          id={`image-upload-${item.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(item.id, e)}
                          className="mt-2"
                          data-testid={`input-image-${item.id}`}
                          disabled={isUploading}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="border-2 border-dashed rounded-md p-4 text-center">
                          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground mb-2">No image uploaded</p>
                          <Label
                            htmlFor={`image-upload-${item.id}`}
                            className="cursor-pointer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isUploading}
                              data-testid={`button-upload-${item.id}`}
                              asChild
                            >
                              <span>
                                <Upload className="w-3 h-3 mr-1" />
                                {isUploading ? "Uploading..." : "Upload Image"}
                              </span>
                            </Button>
                          </Label>
                        </div>
                        <Input
                          id={`image-upload-${item.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(item.id, e)}
                          className="hidden"
                          data-testid={`input-image-${item.id}`}
                          disabled={isUploading}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle: Size Breakdown */}
                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h5 className="text-xs font-medium text-muted-foreground">Size Breakdown</h5>
                    <Badge variant="outline">Total: {totalQty}</Badge>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {sizeBreakdown.map((sizeInfo) => (
                      <div
                        key={sizeInfo.size}
                        className="border rounded-md p-2 text-center"
                        data-testid={`size-${sizeInfo.size}-${item.id}`}
                      >
                        <div className="text-xs font-semibold text-muted-foreground">
                          {getSizeLabel(sizeInfo.size)}
                        </div>
                        <div className="text-lg font-bold">{sizeInfo.qty}</div>
                      </div>
                    ))}
                  </div>
                  {sizeBreakdown.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sizes specified
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {fullScreenImage && (
        <FullScreenImageViewer
          isOpen={!!fullScreenImage}
          imageUrl={fullScreenImage}
          onClose={() => setFullScreenImage(null)}
        />
      )}
    </div>
  );
}
