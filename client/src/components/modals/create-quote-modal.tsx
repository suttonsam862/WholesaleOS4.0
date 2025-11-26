import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calculator, X, Trash2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Organization, Contact, ProductVariant, Quote, QuoteLineItem } from "@shared/schema";

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LineItem {
  variantId: number;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: string;
}

export function CreateQuoteModal({ isOpen, onClose }: CreateQuoteModalProps) {
  const [formData, setFormData] = useState({
    quoteName: "",
    orgId: "",
    contactId: "",
    taxRate: "0.0875", // Default 8.75% tax rate for demo
    discount: "0",
    customerAddress: "",
    customerShippingAddress: "",
    notes: "",
    validUntil: "",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [orgSearchOpen, setOrgSearchOpen] = useState(false);
  const [variantSearchOpen, setVariantSearchOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations']
  });

  // Fetch contacts for selected org
  const { data: allContacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts']
  });

  // Filter contacts for selected organization
  const contacts = selectedOrg 
    ? allContacts.filter((contact: Contact) => contact.orgId === selectedOrg.id)
    : [];

  // Fetch product variants
  const { data: variants = [] } = useQuery<ProductVariant[]>({
    queryKey: ['/api/product-variants']
  });

  // Calculate totals in real-time
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unitPrice || "0")), 0);
    const discountAmount = parseFloat(formData.discount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = taxableAmount * taxRate;
    const total = taxableAmount + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculateTotals();

  // Create quote mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      // Line items are already formatted correctly with unitPrice as string
      const formattedLineItems = lineItems.map(item => ({
        ...item,
        unitPrice: parseFloat(item.unitPrice || "0").toFixed(2) // Ensure proper decimal formatting
      }));
      
      // Generate unique quote code (required field)
      const quoteCode = `Q-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const quoteData = {
        ...data,
        quoteCode: quoteCode, // Add required quote code
        // Convert IDs from strings to numbers for backend validation
        orgId: parseInt(data.orgId),
        contactId: data.contactId ? parseInt(data.contactId) : undefined,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        lineItems: formattedLineItems,
      };
      return await apiRequest('POST', '/api/quotes', quoteData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "Quote created successfully with correct financial calculations",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create quote",
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    setFormData({
      quoteName: "",
      orgId: "",
      contactId: "",
      taxRate: "0.0875",
      discount: "0",
      customerAddress: "",
      customerShippingAddress: "",
      notes: "",
      validUntil: "",
    });
    setLineItems([]);
    setSelectedOrg(null);
    onClose();
  };

  const handleAddLineItem = (variant: ProductVariant) => {
    const newItem: LineItem = {
      variantId: variant.id,
      itemName: variant.variantCode,
      description: `${variant.color || ''} ${variant.size || ''} ${variant.material || ''}`.trim(),
      quantity: 1,
      unitPrice: (parseFloat(variant.msrp || '0') || 10.00).toFixed(2),
    };

    setLineItems([...lineItems, newItem]);
    setVariantSearchOpen(false);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    if (field === 'unitPrice') {
      // Keep as string, format to 2 decimals if valid number
      const numValue = parseFloat(value);
      updated[index] = { ...updated[index], [field]: isNaN(numValue) ? "0.00" : numValue.toFixed(2) };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLineItems(updated);
  };

  const duplicateLineItem = (index: number) => {
    const itemToDuplicate = lineItems[index];
    const duplicatedItem: LineItem = {
      ...itemToDuplicate,
    };
    setLineItems([...lineItems, duplicatedItem]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quoteName || !formData.orgId) {
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

    createQuoteMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quote</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Quote Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quoteName">Quote Name *</Label>
              <Input
                id="quoteName"
                value={formData.quoteName}
                onChange={(e) => setFormData({...formData, quoteName: e.target.value})}
                placeholder="Enter quote name"
                data-testid="input-quote-name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                data-testid="input-valid-until"
              />
            </div>
          </div>

          {/* Organization Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Organization *</Label>
              <Popover open={orgSearchOpen} onOpenChange={setOrgSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={orgSearchOpen}
                    className="w-full justify-between"
                    data-testid="button-select-organization"
                  >
                    {selectedOrg ? selectedOrg.name : "Select organization..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search organizations..." />
                    <CommandEmpty>No organizations found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {organizations.map((org: Organization) => (
                          <CommandItem
                            key={org.id}
                            onSelect={() => {
                              setSelectedOrg(org);
                              setFormData({...formData, orgId: org.id.toString(), contactId: ""});
                              setOrgSearchOpen(false);
                            }}
                            data-testid={`option-org-${org.id}`}
                          >
                            <div>
                              <div className="font-medium">{org.name}</div>
                              {org.city && org.state && (
                                <div className="text-sm text-muted-foreground">
                                  {org.city}, {org.state}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedOrg && (
              <div>
                <Label htmlFor="contactId">Contact</Label>
                <Select value={formData.contactId || "none"} onValueChange={(value) => setFormData({...formData, contactId: value === "none" ? "" : value})}>
                  <SelectTrigger data-testid="select-contact">
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((contact: Contact) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.name} {contact.email && `(${contact.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Customer Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerAddress">Customer Billing Address</Label>
              <Textarea
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                placeholder="Enter customer billing address (3 lines recommended)"
                rows={3}
                data-testid="textarea-customer-address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use organization default
              </p>
            </div>
            
            <div>
              <Label htmlFor="customerShippingAddress">Customer Shipping Address</Label>
              <Textarea
                id="customerShippingAddress"
                value={formData.customerShippingAddress}
                onChange={(e) => setFormData({...formData, customerShippingAddress: e.target.value})}
                placeholder="Enter customer shipping address (3 lines recommended)"
                rows={3}
                data-testid="textarea-customer-shipping-address"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave blank to use organization default
              </p>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={formData.taxRate}
                onChange={(e) => setFormData({...formData, taxRate: e.target.value})}
                placeholder="0.0875"
                data-testid="input-tax-rate"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter as decimal (e.g., 0.0875 for 8.75%)
              </p>
            </div>
            
            <div>
              <Label htmlFor="discount">Discount Amount ($)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={formData.discount}
                onChange={(e) => setFormData({...formData, discount: e.target.value})}
                placeholder="0.00"
                data-testid="input-discount"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Line Items</h3>
              <Popover open={variantSearchOpen} onOpenChange={setVariantSearchOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" data-testid="button-add-line-item">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0">
                  <Command>
                    <CommandInput placeholder="Search product variants..." />
                    <CommandEmpty>No variants found.</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {variants.map((variant: ProductVariant) => (
                          <CommandItem
                            key={variant.id}
                            onSelect={() => handleAddLineItem(variant)}
                            data-testid={`option-variant-${variant.id}`}
                          >
                            <div>
                              <div className="font-medium">{(variant as any).product?.name || variant.variantCode}</div>
                              <div className="text-sm text-muted-foreground">
                                {variant.variantCode} | {variant.color} {variant.size} {variant.material} - ${variant.msrp}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {lineItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No line items added yet. Click "Add Item" to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <Card key={index} data-testid={`line-item-${index}`}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="md:col-span-2">
                          <Label>Item Name</Label>
                          <Input
                            value={item.itemName}
                            onChange={(e) => updateLineItem(index, 'itemName', e.target.value)}
                            data-testid={`input-item-name-${index}`}
                          />
                        </div>
                        
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            data-testid={`input-quantity-${index}`}
                          />
                        </div>
                        
                        <div>
                          <Label>Unit Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                            data-testid={`input-unit-price-${index}`}
                          />
                        </div>
                        
                        <div>
                          <Label>Line Total</Label>
                          <div className="text-lg font-bold text-green-600" data-testid={`line-total-${index}`}>
                            ${(item.quantity * parseFloat(item.unitPrice || "0")).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateLineItem(index)}
                            data-testid={`button-duplicate-${index}`}
                            title="Duplicate this line item"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Financial Calculations Display */}
          {lineItems.length > 0 && (
            <Card className="bg-gray-50 dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Financial Summary (Real-time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
                    <p className="text-xl font-bold" data-testid="display-subtotal">
                      ${totals.subtotal}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Discount</p>
                    <p className="text-xl font-bold text-red-600" data-testid="display-discount">
                      -${totals.discountAmount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tax ({(parseFloat(formData.taxRate) * 100).toFixed(2)}%)
                    </p>
                    <p className="text-xl font-bold" data-testid="display-tax">
                      ${totals.taxAmount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied to ${totals.taxableAmount} (after discount)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="display-total">
                      ${totals.total}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes for this quote..."
              rows={3}
              data-testid="input-notes"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createQuoteMutation.isPending}
              data-testid="button-create-quote"
            >
              {createQuoteMutation.isPending ? "Creating..." : "Create Quote"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}