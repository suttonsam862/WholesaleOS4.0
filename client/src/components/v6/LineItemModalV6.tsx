import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SizeGrid, SizeQuantities, ADULT_SIZES, YOUTH_SIZES } from "./SizeGrid";

// Size preset options
const SIZE_PRESETS = [
  { id: "adult", name: "Adult Sizes (XS-4XL)" },
  { id: "youth", name: "Youth Sizes (YXS-YL)" },
  { id: "all", name: "All Sizes" },
];
import { Loader2, AlertCircle, Package, Palette, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LineItemModalV6Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  lineItem?: LineItem | null;
  onSuccess?: () => void;
}

interface LineItem {
  id: number;
  orderId: number;
  productType: string;
  styleName: string;
  styleNumber?: string;
  color: string;
  description?: string;
  quantities: SizeQuantities;
  unitPrice: number;
  decorationType?: string;
  decorationDetails?: string;
  notes?: string;
}

interface FormData {
  productType: string;
  styleName: string;
  styleNumber: string;
  color: string;
  description: string;
  quantities: SizeQuantities;
  unitPrice: string;
  decorationType: string;
  decorationDetails: string;
  notes: string;
}

const PRODUCT_TYPES = [
  "Jersey",
  "T-Shirt",
  "Hoodie",
  "Sweatshirt",
  "Polo",
  "Tank Top",
  "Shorts",
  "Pants",
  "Hat",
  "Bag",
  "Other",
];

const DECORATION_TYPES = [
  "Screen Print",
  "Embroidery",
  "Heat Transfer",
  "Sublimation",
  "DTG",
  "Vinyl",
  "None",
];

const COLORS = [
  "Black",
  "White",
  "Navy",
  "Royal Blue",
  "Red",
  "Maroon",
  "Forest Green",
  "Kelly Green",
  "Gold",
  "Athletic Gold",
  "Purple",
  "Orange",
  "Gray",
  "Charcoal",
  "Pink",
  "Carolina Blue",
  "Custom",
];

const initialFormData: FormData = {
  productType: "",
  styleName: "",
  styleNumber: "",
  color: "",
  description: "",
  quantities: {},
  unitPrice: "",
  decorationType: "",
  decorationDetails: "",
  notes: "",
};

export function LineItemModalV6({
  open,
  onOpenChange,
  orderId,
  lineItem,
  onSuccess,
}: LineItemModalV6Props) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [sizePreset, setSizePreset] = useState<string>("adult");
  const [customColor, setCustomColor] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("product");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!lineItem;

  // Load existing line item data when editing
  useEffect(() => {
    if (lineItem && open) {
      setFormData({
        productType: lineItem.productType || "",
        styleName: lineItem.styleName || "",
        styleNumber: lineItem.styleNumber || "",
        color: lineItem.color || "",
        description: lineItem.description || "",
        quantities: lineItem.quantities || {},
        unitPrice: lineItem.unitPrice?.toString() || "",
        decorationType: lineItem.decorationType || "",
        decorationDetails: lineItem.decorationDetails || "",
        notes: lineItem.notes || "",
      });
      // Check if color is custom
      if (lineItem.color && !COLORS.includes(lineItem.color)) {
        setCustomColor(lineItem.color);
      }
    } else if (!lineItem && open) {
      setFormData(initialFormData);
      setCustomColor("");
    }
  }, [lineItem, open]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        orderId,
        productType: data.productType,
        styleName: data.styleName,
        styleNumber: data.styleNumber || null,
        color: data.color === "Custom" ? customColor : data.color,
        description: data.description || null,
        quantities: data.quantities,
        unitPrice: parseFloat(data.unitPrice) || 0,
        decorationType: data.decorationType || null,
        decorationDetails: data.decorationDetails || null,
        notes: data.notes || null,
      };

      const url = isEditing
        ? `/api/v6/orders/${orderId}/line-items/${lineItem!.id}`
        : `/api/v6/orders/${orderId}/line-items`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${isEditing ? "update" : "create"} line item`);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v6/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/v6/orders"] });
      toast({
        title: isEditing ? "Line item updated" : "Line item added",
        description: `${formData.styleName} has been ${isEditing ? "updated" : "added"} to the order.`,
      });
      handleClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productType) {
      newErrors.productType = "Product type is required";
    }

    if (!formData.styleName.trim()) {
      newErrors.styleName = "Style name is required";
    }

    if (!formData.color || (formData.color === "Custom" && !customColor.trim())) {
      newErrors.color = "Color is required";
    }

    const totalQty = Object.values(formData.quantities).reduce((sum, q) => sum + q, 0);
    if (totalQty === 0) {
      newErrors.quantities = "At least one size quantity is required";
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = "Valid unit price is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      // Switch to tab with first error
      if (errors.productType || errors.styleName || errors.color) {
        setActiveTab("product");
      } else if (errors.quantities) {
        setActiveTab("sizes");
      } else if (errors.unitPrice) {
        setActiveTab("pricing");
      }
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setCustomColor("");
    setErrors({});
    setActiveTab("product");
    onOpenChange(false);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const totalQuantity = Object.values(formData.quantities).reduce((sum, q) => sum + q, 0);
  const lineTotal = totalQuantity * (parseFloat(formData.unitPrice) || 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Line Item" : "Add Line Item"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="product" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Product
            </TabsTrigger>
            <TabsTrigger value="sizes" className="flex items-center gap-2">
              <span className="text-xs font-bold">S-XL</span>
              Sizes
            </TabsTrigger>
            <TabsTrigger value="decoration" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Decoration
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
          </TabsList>

          {/* Product Tab */}
          <TabsContent value="product" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Product Type *</Label>
                <Select
                  value={formData.productType}
                  onValueChange={(val) => updateField("productType", val)}
                >
                  <SelectTrigger className={cn(errors.productType && "border-red-500")}>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productType && (
                  <p className="text-sm text-red-500">{errors.productType}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Select
                  value={formData.color}
                  onValueChange={(val) => updateField("color", val)}
                >
                  <SelectTrigger className={cn(errors.color && "border-red-500")}>
                    <SelectValue placeholder="Select color..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.color === "Custom" && (
                  <Input
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Enter custom color..."
                    className="mt-2"
                  />
                )}
                {errors.color && (
                  <p className="text-sm text-red-500">{errors.color}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="styleName">Style Name *</Label>
                <Input
                  id="styleName"
                  value={formData.styleName}
                  onChange={(e) => updateField("styleName", e.target.value)}
                  className={cn(errors.styleName && "border-red-500")}
                  placeholder="e.g., Gildan 5000"
                />
                {errors.styleName && (
                  <p className="text-sm text-red-500">{errors.styleName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="styleNumber">Style Number</Label>
                <Input
                  id="styleNumber"
                  value={formData.styleNumber}
                  onChange={(e) => updateField("styleNumber", e.target.value)}
                  placeholder="e.g., G500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Additional details about this item..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Sizes Tab */}
          <TabsContent value="sizes" className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <Label>Size Preset</Label>
                <p className="text-sm text-muted-foreground">
                  Choose which sizes to display
                </p>
              </div>
              <Select value={sizePreset} onValueChange={setSizePreset}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {errors.quantities && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{errors.quantities}</span>
              </div>
            )}

            <SizeGrid
              value={formData.quantities}
              onChange={(newQuantities) => {
                updateField("quantities", newQuantities);
                if (errors.quantities) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.quantities;
                    return next;
                  });
                }
              }}
              showYouthSizes={sizePreset === "youth" || sizePreset === "all"}
              showAdultSizes={sizePreset === "adult" || sizePreset === "all"}
            />

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Total quantity across all sizes
              </span>
              <span className="text-lg font-semibold">{totalQuantity} units</span>
            </div>
          </TabsContent>

          {/* Decoration Tab */}
          <TabsContent value="decoration" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decorationType">Decoration Type</Label>
              <Select
                value={formData.decorationType}
                onValueChange={(val) => updateField("decorationType", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decoration type..." />
                </SelectTrigger>
                <SelectContent>
                  {DECORATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decorationDetails">Decoration Details</Label>
              <Textarea
                id="decorationDetails"
                value={formData.decorationDetails}
                onChange={(e) => updateField("decorationDetails", e.target.value)}
                placeholder="Logo placement, print locations, color specifications, etc."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Notes for production team..."
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => updateField("unitPrice", e.target.value)}
                    className={cn("pl-7", errors.unitPrice && "border-red-500")}
                    placeholder="0.00"
                  />
                </div>
                {errors.unitPrice && (
                  <p className="text-sm text-red-500">{errors.unitPrice}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Total Quantity</Label>
                <Input value={totalQuantity} disabled />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium">Line Item Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="text-right">
                  ${parseFloat(formData.unitPrice || "0").toFixed(2)}
                </span>
                <span className="text-muted-foreground">Quantity:</span>
                <span className="text-right">{totalQuantity} units</span>
                <span className="text-muted-foreground font-medium">Line Total:</span>
                <span className="text-right font-semibold text-lg">
                  ${lineTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Size breakdown */}
            {totalQuantity > 0 && (
              <div className="space-y-2">
                <Label>Size Breakdown</Label>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  {Object.entries(formData.quantities)
                    .filter(([, qty]) => qty > 0)
                    .map(([size, qty]) => (
                      <div
                        key={size}
                        className="flex justify-between p-2 bg-muted rounded"
                      >
                        <span>{size}</span>
                        <span className="font-medium">{qty}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {totalQuantity > 0 && (
              <span>
                {totalQuantity} units @ ${parseFloat(formData.unitPrice || "0").toFixed(2)} ={" "}
                <span className="font-semibold">${lineTotal.toFixed(2)}</span>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LineItemModalV6;
