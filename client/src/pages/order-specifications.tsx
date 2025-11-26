import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Ruler, DollarSign, Package, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const helpItems = [
  {
    question: "What specifications should I enter for each order item?",
    answer: "Enter all physical specifications: dimensions (length x width x height), weight, material type, colors, print area measurements, and any special production notes. Also include COGS (Cost of Goods Sold) for accurate pricing.",
    example: "T-Shirt: 28\" length × 20\" width, 100% cotton, navy blue, 12\"×12\" print area, COGS: $4.50"
  },
  {
    question: "How is COGS calculated?",
    answer: "COGS includes raw material costs, labor, overhead allocation, and any outsourcing fees. Enter the total cost per unit. This helps track profit margins and pricing accuracy.",
  },
  {
    question: "Can I copy specifications from a previous order?",
    answer: "Yes, use the 'Copy from Order' button to import specifications from similar past orders. You can then adjust specific details as needed.",
  },
  {
    question: "What happens if specifications are incomplete?",
    answer: "Orders with incomplete specifications appear in the 'Needs Attention' tab. Production cannot start until all required measurements and COGS are entered.",
  }
];

interface OrderItem {
  id: number;
  orderName: string;
  orgName: string;
  itemName: string;
  quantity: number;
  specifications?: {
    length?: string;
    width?: string;
    height?: string;
    weight?: string;
    material?: string;
    color?: string;
    printArea?: string;
    cogs?: string;
    notes?: string;
  };
  status: 'complete' | 'incomplete';
}

export function OrderSpecifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [specs, setSpecs] = useState({
    length: "",
    width: "",
    height: "",
    weight: "",
    material: "",
    color: "",
    printArea: "",
    cogs: "",
    notes: "",
  });

  const { data: orderItems = [], isLoading } = useQuery<OrderItem[]>({
    queryKey: ["/api/manufacturing/order-items"],
  });

  const mockItems: OrderItem[] = orderItems.length > 0 ? orderItems : [
    {
      id: 1,
      orderName: "Spring Team Uniforms",
      orgName: "Sports United",
      itemName: "Performance Jersey",
      quantity: 100,
      specifications: {
        length: "28 inches",
        width: "20 inches",
        material: "Polyester blend",
        color: "Navy Blue",
        printArea: "12x12 inches",
        cogs: "8.50",
        notes: "Moisture-wicking fabric required",
      },
      status: 'complete',
    },
    {
      id: 2,
      orderName: "Corporate Apparel Order",
      orgName: "TechCorp Industries",
      itemName: "Polo Shirt",
      quantity: 150,
      specifications: {
        material: "Cotton",
        color: "Black",
        cogs: "6.75",
      },
      status: 'incomplete',
    },
    {
      id: 3,
      orderName: "Promo Merchandise",
      orgName: "Green Foods Co",
      itemName: "Tote Bag",
      quantity: 80,
      status: 'incomplete',
    },
  ];

  const updateSpecsMutation = useMutation({
    mutationFn: (data: { itemId: number; specifications: any }) =>
      apiRequest("PUT", `/api/manufacturing/order-items/${data.itemId}/specifications`, data.specifications),
    onSuccess: () => {
      toast({ title: "Success", description: "Specifications updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing/order-items"] });
      setSelectedItem(null);
      resetSpecs();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update specifications", variant: "destructive" });
    },
  });

  const handleOpenDialog = (item: OrderItem) => {
    setSelectedItem(item);
    if (item.specifications) {
      setSpecs({
        length: item.specifications.length || "",
        width: item.specifications.width || "",
        height: item.specifications.height || "",
        weight: item.specifications.weight || "",
        material: item.specifications.material || "",
        color: item.specifications.color || "",
        printArea: item.specifications.printArea || "",
        cogs: item.specifications.cogs || "",
        notes: item.specifications.notes || "",
      });
    }
  };

  const handleSaveSpecs = () => {
    if (!selectedItem) return;
    updateSpecsMutation.mutate({
      itemId: selectedItem.id,
      specifications: specs,
    });
  };

  const resetSpecs = () => {
    setSpecs({
      length: "",
      width: "",
      height: "",
      weight: "",
      material: "",
      color: "",
      printArea: "",
      cogs: "",
      notes: "",
    });
  };

  const filteredItems = mockItems.filter(item =>
    item.orderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const incompleteItems = filteredItems.filter(i => i.status === 'incomplete');
  const completeItems = filteredItems.filter(i => i.status === 'complete');

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-order-specifications">Order Specifications Management</h1>
          <p className="text-muted-foreground">Enter detailed measurements, materials, and COGS for production</p>
        </div>
        <HelpButton pageTitle="Order Specifications" helpItems={helpItems} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-items">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockItems.length}</div>
            <p className="text-xs text-muted-foreground">Across all orders</p>
          </CardContent>
        </Card>

        <Card data-testid="card-complete-specs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
            <Ruler className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completeItems.length}</div>
            <p className="text-xs text-muted-foreground">Ready for production</p>
          </CardContent>
        </Card>

        <Card data-testid="card-incomplete-specs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{incompleteItems.length}</div>
            <p className="text-xs text-muted-foreground">Missing specifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order, organization, or item name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-items"
        />
      </div>

      {/* Incomplete Items Section */}
      {incompleteItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-500" />
            Needs Attention ({incompleteItems.length})
          </h2>
          {incompleteItems.map((item) => (
            <Card key={item.id} className="border-red-200" data-testid={`incomplete-item-${item.id}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="font-medium">{item.itemName}</div>
                  <div className="text-sm text-muted-foreground">{item.orderName} • {item.orgName}</div>
                  <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                  <Badge variant="destructive" className="mt-2">Missing Specifications</Badge>
                </div>
                <Button onClick={() => handleOpenDialog(item)} data-testid={`button-add-specs-${item.id}`}>
                  Add Specifications
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Complete Items Section */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Ruler className="h-5 w-5 text-green-500" />
          Complete Specifications ({completeItems.length})
        </h2>
        {completeItems.map((item) => (
          <Card key={item.id} className="border-green-200" data-testid={`complete-item-${item.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">{item.itemName}</div>
                  <div className="text-sm text-muted-foreground">{item.orderName} • {item.orgName}</div>
                  <div className="text-sm text-muted-foreground">Quantity: {item.quantity}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)} data-testid={`button-edit-specs-${item.id}`}>
                  Edit
                </Button>
              </div>
              {item.specifications && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-muted/30 p-3 rounded-lg">
                  {item.specifications.length && (
                    <div>
                      <div className="text-muted-foreground">Length</div>
                      <div className="font-medium">{item.specifications.length}</div>
                    </div>
                  )}
                  {item.specifications.width && (
                    <div>
                      <div className="text-muted-foreground">Width</div>
                      <div className="font-medium">{item.specifications.width}</div>
                    </div>
                  )}
                  {item.specifications.material && (
                    <div>
                      <div className="text-muted-foreground">Material</div>
                      <div className="font-medium">{item.specifications.material}</div>
                    </div>
                  )}
                  {item.specifications.cogs && (
                    <div>
                      <div className="text-muted-foreground">COGS</div>
                      <div className="font-medium">${item.specifications.cogs}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Specifications Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); resetSpecs(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-specifications">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.itemName} - Specifications
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedItem?.orderName} • {selectedItem?.orgName} • Qty: {selectedItem?.quantity}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="length">Length</Label>
              <Input
                id="length"
                value={specs.length}
                onChange={(e) => setSpecs({ ...specs, length: e.target.value })}
                placeholder="e.g., 28 inches"
                data-testid="input-length"
              />
            </div>
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={specs.width}
                onChange={(e) => setSpecs({ ...specs, width: e.target.value })}
                placeholder="e.g., 20 inches"
                data-testid="input-width"
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={specs.height}
                onChange={(e) => setSpecs({ ...specs, height: e.target.value })}
                placeholder="e.g., 0.5 inches"
                data-testid="input-height"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={specs.weight}
                onChange={(e) => setSpecs({ ...specs, weight: e.target.value })}
                placeholder="e.g., 6 oz"
                data-testid="input-weight"
              />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={specs.material}
                onChange={(e) => setSpecs({ ...specs, material: e.target.value })}
                placeholder="e.g., 100% Cotton"
                data-testid="input-material"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={specs.color}
                onChange={(e) => setSpecs({ ...specs, color: e.target.value })}
                placeholder="e.g., Navy Blue"
                data-testid="input-color"
              />
            </div>
            <div>
              <Label htmlFor="printArea">Print Area</Label>
              <Input
                id="printArea"
                value={specs.printArea}
                onChange={(e) => setSpecs({ ...specs, printArea: e.target.value })}
                placeholder="e.g., 12x12 inches"
                data-testid="input-print-area"
              />
            </div>
            <div>
              <Label htmlFor="cogs">COGS (per unit)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="cogs"
                  value={specs.cogs}
                  onChange={(e) => setSpecs({ ...specs, cogs: e.target.value })}
                  placeholder="0.00"
                  className="pl-7"
                  data-testid="input-cogs"
                />
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Production Notes</Label>
              <Textarea
                id="notes"
                value={specs.notes}
                onChange={(e) => setSpecs({ ...specs, notes: e.target.value })}
                placeholder="Any special production requirements or notes..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setSelectedItem(null); resetSpecs(); }} data-testid="button-cancel-specs">
              Cancel
            </Button>
            <Button onClick={handleSaveSpecs} disabled={updateSpecsMutation.isPending} data-testid="button-save-specs">
              {updateSpecsMutation.isPending ? "Saving..." : "Save Specifications"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
