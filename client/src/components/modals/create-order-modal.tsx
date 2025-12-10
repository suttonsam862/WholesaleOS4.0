import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GlassButton, GlassInput, GlassCard, GlassTextarea } from "@/components/ui/glass";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calculator, X, ChevronRight, ChevronLeft, ShoppingCart, User, Calendar } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}
// ...existing code...


interface Organization {
  id: number;
  name: string;
  city?: string;
  state?: string;
}

interface Contact {
  id: number;
  orgId: number;
  name: string;
  email?: string;
  phone?: string;
}

interface ProductVariant {
  id: number;
  productId: number;
  variantCode: string;
  color?: string;
  size?: string;
  material?: string;
  msrp?: string;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  basePrice: string;
}

interface Salesperson {
  id: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  email?: string;
  territory?: string;
  active?: boolean;
}

interface Category {
  id: number;
  name: string;
}

const SIZE_COLUMNS = [
  { key: "yxs", label: "YXS" },
  { key: "ys", label: "YS" },
  { key: "ym", label: "YM" },
  { key: "yl", label: "YL" },
  { key: "xs", label: "XS" },
  { key: "s", label: "S" },
  { key: "m", label: "M" },
  { key: "l", label: "L" },
  { key: "xl", label: "XL" },
  { key: "xxl", label: "2XL" },
  { key: "xxxl", label: "3XL" },
  { key: "xxxxl", label: "4XL" },
];

export function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    orderName: "",
    orgId: null as number | null,
    contactId: null as number | null,
    salespersonId: null as string | null,
    priority: "normal" as "low" | "normal" | "high",
    estDelivery: "",
    notes: "",
  });

  const [lineItems, setLineItems] = useState<any[]>([]);
  const [currentLineItem, setCurrentLineItem] = useState({
    variantId: null as number | null,
    yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0,
    notes: "",
  });

  const [orgSearchOpen, setOrgSearchOpen] = useState(false);
  const [orgSearch, setOrgSearch] = useState("");
  const [variantSearchOpen, setVariantSearchOpen] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");

  // Fetch data
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    enabled: isOpen,
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: isOpen,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isOpen,
  });

  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ["/api/variants"],
    enabled: isOpen,
  });

  const { data: salespeople = [] } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespeople"],
    enabled: isOpen,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: isOpen,
  });

  // Filter variants based on search text
  const filteredVariants = variants.filter((variant) => {
    if (!variantSearch.trim()) return true;
    const product = products.find(p => p.id === variant.productId);
    const category = product ? categories.find(c => c.id === product.categoryId) : null;
    const searchLower = variantSearch.toLowerCase();
    return (
      product?.name.toLowerCase().includes(searchLower) ||
      variant.variantCode?.toLowerCase().includes(searchLower) ||
      variant.color?.toLowerCase().includes(searchLower) ||
      product?.sku?.toLowerCase().includes(searchLower) ||
      category?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Filter contacts by organization
  const filteredContacts = formData.orgId
    ? contacts.filter(c => c.orgId === formData.orgId)
    : [];

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔍 [CreateOrderModal] Sending order creation request:', data);

      // Create order with line items in a single request
      const requestPayload = {
        orderName: data.orderName,
        orgId: data.orgId,
        contactId: data.contactId,
        salespersonId: data.salespersonId,
        priority: data.priority,
        estDelivery: data.estDelivery,
        status: "new",
        notes: data.notes,
        lineItems: data.lineItems,
      };

      console.log('🔍 [CreateOrderModal] Request payload:', JSON.stringify(requestPayload, null, 2));

      // Don't double-stringify - apiRequest will handle JSON serialization
      const response = await apiRequest("/api/orders", {
        method: "POST",
        body: requestPayload, // Pass object directly, not stringified
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      handleReset();
      onClose();
    },
    onError: (error: any) => {
      console.error('🔍 [CreateOrderModal] Order creation error:', error);
      console.error('🔍 [CreateOrderModal] Error details:', {
        status: error?.status,
        statusText: error?.statusText,
        data: error?.response?.data,
        message: error?.message
      });

      // Parse error response properly
      let errorMessage = 'Unknown error occurred';
      let validationErrors = null;

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.errors) {
          validationErrors = errorData.errors;
          errorMessage = `Validation failed: ${validationErrors.map((err: any) => err.message || err.path?.join('.') + ' ' + err.message).join(', ')}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      console.error('🔍 [CreateOrderModal] Parsed error message:', errorMessage);
      if (validationErrors) {
        console.error('🔍 [CreateOrderModal] Validation errors:', validationErrors);
      }

      toast({
        title: "Error",
        description: `Failed to create order: ${errorMessage}`,
        variant: "destructive",
      });
    },
  });

  // Calculate price based on variant MSRP
  const calculatePrice = (variantId: number) => {
    const variant = variants.find(v => v.id === variantId);
    return variant?.msrp || "0";
  };

  // Calculate total quantity for current line item
  const calculateTotalQuantity = () => {
    return currentLineItem.yxs + currentLineItem.ys + currentLineItem.ym + currentLineItem.yl +
           currentLineItem.xs + currentLineItem.s + currentLineItem.m + currentLineItem.l +
           currentLineItem.xl + currentLineItem.xxl + currentLineItem.xxxl + currentLineItem.xxxxl;
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    return lineItems.reduce((total, item) => {
      const qty = item.yxs + item.ys + item.ym + item.yl + item.xs + item.s + item.m + item.l + item.xl + item.xxl + item.xxxl + item.xxxxl;
      return total + (parseFloat(item.unitPrice) * qty);
    }, 0).toFixed(2);
  };

  // Add line item to order
  const handleAddLineItem = () => {
    if (!currentLineItem.variantId) {
      toast({
        title: "Error",
        description: "Please select a product variant",
        variant: "destructive",
      });
      return;
    }

    const quantity = calculateTotalQuantity();
    // Always use variant MSRP as unit price, regardless of quantity
    const unitPrice = calculatePrice(currentLineItem.variantId);
    const variant = variants.find(v => v.id === currentLineItem.variantId);
    const product = variant ? products.find(p => p.id === variant.productId) : null;

    // Validate that we have a valid variant and product
    if (!variant) {
      toast({
        title: "Error",
        description: "Selected variant is no longer available",
        variant: "destructive",
      });
      return;
    }

    // Ensure all size quantities are valid numbers
    const cleanSizes = {
      yxs: Math.max(0, currentLineItem.yxs || 0),
      ys: Math.max(0, currentLineItem.ys || 0),
      ym: Math.max(0, currentLineItem.ym || 0),
      yl: Math.max(0, currentLineItem.yl || 0),
      xs: Math.max(0, currentLineItem.xs || 0),
      s: Math.max(0, currentLineItem.s || 0),
      m: Math.max(0, currentLineItem.m || 0),
      l: Math.max(0, currentLineItem.l || 0),
      xl: Math.max(0, currentLineItem.xl || 0),
      xxl: Math.max(0, currentLineItem.xxl || 0),
      xxxl: Math.max(0, currentLineItem.xxxl || 0),
      xxxxl: Math.max(0, currentLineItem.xxxxl || 0),
    };

    const recalculatedQty = Object.values(cleanSizes).reduce((sum, qty) => sum + qty, 0);

    setLineItems([...lineItems, {
      ...cleanSizes,
      variantId: currentLineItem.variantId,
      unitPrice: unitPrice,
      variantName: `${product?.name || ""} - ${variant?.variantCode}${variant?.color ? ` (${variant.color})` : ''}`,
      totalQty: recalculatedQty,
      lineTotal: recalculatedQty > 0 ? (parseFloat(unitPrice) * recalculatedQty).toFixed(2) : "0.00",
      notes: currentLineItem.notes || "",
      colorNotes: variant?.color || null,
    }]);

    // Reset current line item
    setCurrentLineItem({
      variantId: null,
      yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0,
      notes: "",
    });
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.orderName || !formData.orgId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item",
        variant: "destructive",
      });
      return;
    }

    // Ensure proper data types and clean data before submission
    const cleanedFormData = {
      orderName: formData.orderName.trim(),
      orgId: Number(formData.orgId),
      contactId: formData.contactId ? Number(formData.contactId) : null,
      salespersonId: formData.salespersonId || null,
      priority: formData.priority,
      estDelivery: formData.estDelivery || null,
      notes: formData.notes?.trim() || null,
    };

    // Clean line items data
    const cleanedLineItems = lineItems.map(item => ({
      variantId: Number(item.variantId),
      itemName: item.variantName || null,
      colorNotes: item.colorNotes || null,
      yxs: Number(item.yxs) || 0,
      ys: Number(item.ys) || 0,
      ym: Number(item.ym) || 0,
      yl: Number(item.yl) || 0,
      xs: Number(item.xs) || 0,
      s: Number(item.s) || 0,
      m: Number(item.m) || 0,
      l: Number(item.l) || 0,
      xl: Number(item.xl) || 0,
      xxl: Number(item.xxl) || 0,
      xxxl: Number(item.xxxl) || 0,
      xxxxl: Number(item.xxxxl) || 0,
      unitPrice: String(item.unitPrice),
      notes: item.notes?.trim() || null,
    }));

    console.log('🔍 [CreateOrderModal] Submitting order data:', {
      formData: cleanedFormData,
      lineItems: cleanedLineItems
    });

    createOrderMutation.mutate({
      ...cleanedFormData,
      lineItems: cleanedLineItems,
    });
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      orderName: "",
      orgId: null,
      contactId: null,
      salespersonId: null,
      priority: "normal",
      estDelivery: "",
      notes: "",
    });
    setLineItems([]);
    setCurrentLineItem({
      variantId: null,
      yxs: 0, ys: 0, ym: 0, yl: 0, xs: 0, s: 0, m: 0, l: 0, xl: 0, xxl: 0, xxxl: 0, xxxxl: 0,
      notes: "",
    });
    setStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-black/80 backdrop-blur-xl border-white/10 p-0 gap-0">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-neon-blue" />
              Create New Order
            </DialogTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {step === 1 && "Step 1: Order Details"}
              {step === 2 && "Step 2: Add Products"}
              {step === 3 && "Step 3: Review & Submit"}
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  s === step ? "bg-neon-blue scale-125 shadow-[0_0_10px_#00f3ff]" : s < step ? "bg-neon-blue/50" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {/* Step 1: Order Details */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-neon-purple" />
                      Client Information
                    </h3>
                    
                    <div>
                      <Label htmlFor="orderName">Order Name *</Label>
                      <GlassInput
                        id="orderName"
                        value={formData.orderName}
                        onChange={(e) => setFormData({ ...formData, orderName: e.target.value })}
                        placeholder="e.g., Spring 2024 Team Uniforms"
                        data-testid="input-order-name"
                      />
                    </div>

                    <div>
                      <Label>Organization *</Label>
                      <Popover open={orgSearchOpen} onOpenChange={setOrgSearchOpen}>
                        <PopoverTrigger asChild>
                          <GlassButton
                            variant="secondary"
                            role="combobox"
                            className="w-full justify-between"
                            data-testid="button-select-organization"
                          >
                            {formData.orgId
                              ? organizations.find((org) => org.id === formData.orgId)?.name
                              : "Select organization..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </GlassButton>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 bg-black/90 border-white/10 backdrop-blur-xl">
                          <Command className="bg-transparent">
                            <CommandInput
                              placeholder="Search organizations..."
                              value={orgSearch}
                              onValueChange={setOrgSearch}
                              className="text-white"
                            />
                            <CommandList>
                              <CommandEmpty>No organization found.</CommandEmpty>
                              <CommandGroup>
                                {organizations.map((org) => (
                                  <CommandItem
                                    key={org.id}
                                    onSelect={() => {
                                      setFormData({ ...formData, orgId: org.id, contactId: null });
                                      setOrgSearchOpen(false);
                                      setOrgSearch("");
                                    }}
                                    className="data-[selected=true]:bg-white/10 text-white"
                                  >
                                    <div>
                                      <div className="font-medium">{org.name}</div>
                                      {org.city && org.state && (
                                        <div className="text-xs text-muted-foreground">
                                          {org.city}, {org.state}
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {formData.orgId && filteredContacts.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <Label htmlFor="contact">Contact</Label>
                        <Select
                          value={formData.contactId?.toString() || "none"}
                          onValueChange={(value) => setFormData({ ...formData, contactId: value === "none" ? null : parseInt(value) })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-contact">
                            <SelectValue placeholder="Select a contact" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-white/10 text-white">
                            <SelectItem value="none">No contact</SelectItem>
                            {filteredContacts.map((contact) => (
                              <SelectItem key={contact.id} value={contact.id.toString()}>
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </GlassCard>

                  <GlassCard className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neon-green" />
                      Order Details
                    </h3>

                    <div>
                      <Label htmlFor="salesperson">Salesperson</Label>
                      <Select
                        value={formData.salespersonId?.toString() || "none"}
                        onValueChange={(value) => setFormData({ ...formData, salespersonId: value === "none" ? null : value })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-salesperson">
                          <SelectValue placeholder="Select a salesperson" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10 text-white">
                          <SelectItem value="none">No salesperson</SelectItem>
                          {salespeople.filter(sp => sp.active !== false).map((person) => (
                            <SelectItem key={person.userId} value={person.userId}>
                              {person.userName || person.userEmail || "Unknown Salesperson"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <div className="flex gap-2 mt-1">
                        {["low", "normal", "high"].map((p) => (
                          <div
                            key={p}
                            onClick={() => setFormData({ ...formData, priority: p as any })}
                            className={cn(
                              "flex-1 py-2 text-center rounded-lg cursor-pointer border transition-all",
                              formData.priority === p
                                ? p === "high" ? "bg-red-500/20 border-red-500 text-red-500"
                                : p === "normal" ? "bg-blue-500/20 border-blue-500 text-blue-500"
                                : "bg-gray-500/20 border-gray-500 text-gray-400"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                            )}
                          >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="estDelivery">Estimated Delivery Date</Label>
                      <GlassInput
                        id="estDelivery"
                        type="date"
                        value={formData.estDelivery}
                        onChange={(e) => setFormData({ ...formData, estDelivery: e.target.value })}
                        data-testid="input-delivery-date"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <GlassTextarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any special instructions or notes..."
                        rows={3}
                        data-testid="textarea-notes"
                      />
                    </div>
                  </GlassCard>
                </div>
              )}

              {/* Step 2: Add Products */}
              {step === 2 && (
                <div className="space-y-6">
                  <GlassCard className="space-y-4 border-neon-blue/30">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-neon-blue" />
                        Add Product Line Item
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Product Variant</Label>
                        <Popover open={variantSearchOpen} onOpenChange={setVariantSearchOpen}>
                          <PopoverTrigger asChild>
                            <GlassButton
                              variant="secondary"
                              role="combobox"
                              className="w-full justify-between mt-1 h-auto min-h-[40px] py-2"
                              data-testid="button-select-variant"
                            >
                              {currentLineItem.variantId ? (() => {
                                const variant = variants.find(v => v.id === currentLineItem.variantId);
                                const product = variant ? products.find(p => p.id === variant.productId) : null;
                                const category = product ? categories.find(c => c.id === product.categoryId) : null;
                                return (
                                  <div className="flex flex-col items-start text-left">
                                    <span className="font-medium">{product?.name || ""}</span>
                                    <span className="text-xs text-white/60">
                                      {variant?.variantCode} {variant?.color && `| ${variant.color}`} {category && `| ${category.name}`}
                                    </span>
                                  </div>
                                );
                              })() : <span className="text-white/50">Select product variant...</span>}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </GlassButton>
                          </PopoverTrigger>
                          <PopoverContent className="w-[500px] p-0 bg-black/90 border-white/10 backdrop-blur-xl">
                            <Command className="bg-transparent" shouldFilter={false}>
                              <CommandInput
                                placeholder="Search by product name, variant, color, or category..."
                                value={variantSearch}
                                onValueChange={setVariantSearch}
                                className="text-white"
                                data-testid="input-variant-search"
                              />
                              <CommandList className="max-h-[300px] overflow-y-auto">
                                <CommandEmpty>No products found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredVariants.map((variant) => {
                                    const product = products.find(p => p.id === variant.productId);
                                    const category = product ? categories.find(c => c.id === product.categoryId) : null;
                                    return (
                                      <CommandItem
                                        key={variant.id}
                                        value={`${product?.name}-${variant.variantCode}-${variant.id}`}
                                        onSelect={() => {
                                          setCurrentLineItem({ ...currentLineItem, variantId: variant.id });
                                          setVariantSearchOpen(false);
                                          setVariantSearch("");
                                        }}
                                        className="data-[selected=true]:bg-white/10 text-white cursor-pointer py-3"
                                        data-testid={`variant-option-${variant.id}`}
                                      >
                                        <div className="flex flex-col gap-1 w-full">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-white">
                                              {product?.name}
                                            </span>
                                            {category && (
                                              <Badge variant="outline" className="text-xs border-neon-purple/50 text-neon-purple">
                                                {category.name}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-white/60">
                                            <span className="text-neon-blue">{variant.variantCode}</span>
                                            {variant.color && <span>Color: {variant.color}</span>}
                                            <span>SKU: {product?.sku}</span>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-end justify-end pb-1">
                         {currentLineItem.variantId && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Unit Price</p>
                              <p className="text-2xl font-bold text-neon-green">${calculatePrice(currentLineItem.variantId)}</p>
                            </div>
                         )}
                      </div>
                    </div>

                    <div>
                      <Label>Size Quantities</Label>
                      <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-2">
                        {SIZE_COLUMNS.map((size) => (
                          <div key={size.key} className="text-center">
                            <Label className="text-[10px] text-muted-foreground mb-1 block">{size.label}</Label>
                            <GlassInput
                              type="number"
                              min="0"
                              value={(currentLineItem as any)[size.key]}
                              onChange={(e) => setCurrentLineItem({
                                ...currentLineItem,
                                [size.key]: parseInt(e.target.value) || 0,
                              })}
                              className="h-9 text-center px-1"
                              data-testid={`input-size-${size.key}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Quantity: </span>
                        <span className="font-medium text-white text-lg ml-1">{calculateTotalQuantity()}</span>
                        {currentLineItem.variantId && (
                          <>
                            <span className="text-muted-foreground ml-4">Line Total: </span>
                            <span className="font-medium text-neon-green text-lg ml-1">
                              ${(parseFloat(calculatePrice(currentLineItem.variantId)) * calculateTotalQuantity()).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                      <GlassButton
                        onClick={handleAddLineItem}
                        disabled={!currentLineItem.variantId}
                        data-testid="button-add-line-item"
                        className="bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </GlassButton>
                    </div>
                  </GlassCard>

                  {lineItems.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-white">Line Items ({lineItems.length})</h3>
                      <div className="space-y-2">
                        {lineItems.map((item, index) => (
                          <GlassCard key={index} className="p-4 flex items-center justify-between group hover:border-white/20">
                            <div>
                              <div className="font-medium text-white">{item.variantName}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs mr-2">Qty: {item.totalQty}</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs mr-2">Price: ${item.unitPrice}</span>
                                <span className="text-neon-green font-medium">Total: ${item.lineTotal}</span>
                              </div>
                            </div>
                            <GlassButton
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveLineItem(index)}
                              data-testid={`button-remove-line-item-${index}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </GlassButton>
                          </GlassCard>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <div className="space-y-6">
                  <GlassCard className="space-y-4">
                    <h3 className="font-medium text-white border-b border-white/10 pb-2">Order Summary</h3>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Order Name</span>
                        <p className="font-medium text-white text-lg">{formData.orderName}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Organization</span>
                        <p className="font-medium text-white text-lg">
                          {organizations.find(o => o.id === formData.orgId)?.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Priority</span>
                        <Badge variant={formData.priority === "high" ? "destructive" : formData.priority === "low" ? "secondary" : "default"}>
                          {formData.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Est. Delivery</span>
                        <p className="font-medium text-white">{formData.estDelivery || "TBD"}</p>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="space-y-4">
                    <h3 className="font-medium text-white border-b border-white/10 pb-2">Line Items</h3>
                    <div className="space-y-2">
                      {lineItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                          <div>
                            <div className="font-medium text-white">{item.variantName}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.totalQty} units @ ${item.unitPrice} each
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">${item.lineTotal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-lg">Order Total:</span>
                        <span className="text-2xl font-bold text-neon-green">${calculateOrderTotal()}</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <GlassButton variant="ghost" onClick={handleReset}>
            Reset
          </GlassButton>
          <div className="flex gap-3">
            {step > 1 && (
              <GlassButton variant="secondary" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </GlassButton>
            )}
            {step < 3 ? (
              <GlassButton
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!formData.orderName || !formData.orgId)) ||
                  (step === 2 && lineItems.length === 0)
                }
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </GlassButton>
            ) : (
              <GlassButton
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
                className="bg-neon-green/20 text-neon-green border-neon-green/50 hover:bg-neon-green/30 hover:shadow-[0_0_15px_rgba(10,255,10,0.3)]"
              >
                {createOrderMutation.isPending ? "Creating..." : "Create Order"}
              </GlassButton>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}