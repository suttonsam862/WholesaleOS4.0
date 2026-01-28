import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarIcon,
  Package,
  Building2,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  Plus,
  X,
  Clock,
  Filter,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StatusBadgeV6 } from "@/components/v6/StatusBadgeV6";
import { SizeDisplay } from "@/components/v6/SizeGrid";

interface Manufacturer {
  id: number;
  name: string;
  capabilities: string[];
  leadTimeDays: number;
  currentCapacity: number;
  maxCapacity: number;
}

interface ReadyOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  orderName: string;
  totalUnits: number;
  lineItems: OrderLineItem[];
  dueDate?: string;
  isRush: boolean;
  priority: string;
  designStatus: string;
  paymentStatus: string;
}

interface OrderLineItem {
  id: number;
  productType: string;
  styleName: string;
  color: string;
  quantities: Record<string, number>;
  decorationType?: string;
}

interface PackageItem {
  orderId: number;
  orderNumber: string;
  customerName: string;
  lineItemIds: number[];
  totalUnits: number;
  isRush: boolean;
}

export default function PackageBuilderV6() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Package state
  const [selectedManufacturer, setSelectedManufacturer] = useState<number | null>(null);
  const [expectedShipDate, setExpectedShipDate] = useState<Date | undefined>();
  const [packageNotes, setPackageNotes] = useState("");
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Fetch manufacturers
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/v6/manufacturers"],
  });

  // Fetch orders ready for manufacturing
  const { data: readyOrders = [], isLoading: loadingOrders } = useQuery<ReadyOrder[]>({
    queryKey: ["/api/v6/orders/ready-for-manufacturing"],
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        manufacturerId: selectedManufacturer,
        expectedShipDate: expectedShipDate?.toISOString(),
        notes: packageNotes,
        items: packageItems.map((item) => ({
          orderId: item.orderId,
          lineItemIds: item.lineItemIds,
        })),
      };

      const res = await fetch("/api/v6/manufacturing/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create package");
      }

      return res.json();
    },
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: ["/api/v6/manufacturing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v6/orders"] });
      toast({
        title: "Package created",
        description: `Package ${pkg.packageNumber || pkg.id} has been created and sent to manufacturer.`,
      });
      navigate("/v6/manufacturing");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter orders
  const filteredOrders = useMemo(() => {
    return readyOrders.filter((order) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          order.orderNumber.toLowerCase().includes(search) ||
          order.customerName.toLowerCase().includes(search) ||
          order.orderName.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Product type filter
      if (productTypeFilter !== "all") {
        const hasProductType = order.lineItems.some(
          (li) => li.productType === productTypeFilter
        );
        if (!hasProductType) return false;
      }

      // Priority filter
      if (priorityFilter !== "all") {
        if (priorityFilter === "rush" && !order.isRush) return false;
        if (priorityFilter !== "rush" && order.priority !== priorityFilter) return false;
      }

      // Exclude already added orders
      if (packageItems.some((item) => item.orderId === order.id)) return false;

      return true;
    });
  }, [readyOrders, searchTerm, productTypeFilter, priorityFilter, packageItems]);

  // Get unique product types
  const productTypes = useMemo(() => {
    const types = new Set<string>();
    readyOrders.forEach((order) => {
      order.lineItems.forEach((li) => types.add(li.productType));
    });
    return Array.from(types).sort();
  }, [readyOrders]);

  // Package summary
  const packageSummary = useMemo(() => {
    const totalOrders = packageItems.length;
    const totalUnits = packageItems.reduce((sum, item) => sum + item.totalUnits, 0);
    const hasRush = packageItems.some((item) => item.isRush);
    return { totalOrders, totalUnits, hasRush };
  }, [packageItems]);

  // Selected manufacturer details
  const selectedMfg = manufacturers.find((m) => m.id === selectedManufacturer);

  const addOrderToPackage = (order: ReadyOrder, lineItemIds?: number[]) => {
    const itemIds = lineItemIds || order.lineItems.map((li) => li.id);
    const units = order.lineItems
      .filter((li) => itemIds.includes(li.id))
      .reduce((sum, li) => {
        return sum + Object.values(li.quantities).reduce((s, q) => s + q, 0);
      }, 0);

    setPackageItems((prev) => [
      ...prev,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        lineItemIds: itemIds,
        totalUnits: units,
        isRush: order.isRush,
      },
    ]);
  };

  const removeOrderFromPackage = (orderId: number) => {
    setPackageItems((prev) => prev.filter((item) => item.orderId !== orderId));
  };

  const handleSubmit = () => {
    if (!selectedManufacturer) {
      toast({
        title: "Select manufacturer",
        description: "Please select a manufacturer for this package.",
        variant: "destructive",
      });
      return;
    }

    if (packageItems.length === 0) {
      toast({
        title: "Add orders",
        description: "Please add at least one order to the package.",
        variant: "destructive",
      });
      return;
    }

    createPackageMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/v6/manufacturing")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create Manufacturing Package</h1>
              <p className="text-sm text-muted-foreground">
                Bundle orders and send to manufacturer
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Order Selection */}
          <div className="col-span-7 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Orders Ready for Manufacturing
                </CardTitle>
                <CardDescription>
                  Select orders to include in this package
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="rush">Rush Only</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order List */}
                <ScrollArea className="h-[500px]">
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No orders ready for manufacturing</p>
                      <p className="text-sm mt-1">
                        Orders need approved designs and payment to appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {order.orderNumber}
                                </span>
                                {order.isRush && (
                                  <Badge variant="destructive" className="text-xs">
                                    Rush
                                  </Badge>
                                )}
                                {order.priority === "high" && (
                                  <Badge variant="secondary" className="text-xs">
                                    High Priority
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {order.customerName} - {order.orderName}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addOrderToPackage(order)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>

                          {/* Line items preview */}
                          <div className="space-y-2">
                            {order.lineItems.slice(0, 3).map((li) => {
                              const totalQty = Object.values(li.quantities).reduce(
                                (s, q) => s + q,
                                0
                              );
                              return (
                                <div
                                  key={li.id}
                                  className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{li.productType}</span>
                                    <span className="text-muted-foreground">
                                      {li.styleName}
                                    </span>
                                    <span className="text-muted-foreground">
                                      ({li.color})
                                    </span>
                                  </div>
                                  <span className="font-medium">{totalQty} units</span>
                                </div>
                              );
                            })}
                            {order.lineItems.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{order.lineItems.length - 3} more items
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm">
                            <span className="text-muted-foreground">
                              {order.dueDate && (
                                <>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Due {format(new Date(order.dueDate), "MMM d")}
                                </>
                              )}
                            </span>
                            <span className="font-medium">
                              Total: {order.totalUnits} units
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Package Configuration */}
          <div className="col-span-5 space-y-4">
            {/* Manufacturer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Manufacturer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Manufacturer *</Label>
                  <Select
                    value={selectedManufacturer?.toString() || ""}
                    onValueChange={(val) => setSelectedManufacturer(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose manufacturer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((mfg) => (
                        <SelectItem key={mfg.id} value={mfg.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{mfg.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {mfg.leadTimeDays}d lead time
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedMfg && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lead Time:</span>
                      <span>{selectedMfg.leadTimeDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capacity:</span>
                      <span>
                        {selectedMfg.currentCapacity}/{selectedMfg.maxCapacity} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Capabilities:</span>
                      <span className="text-right">
                        {selectedMfg.capabilities?.join(", ") || "All"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Expected Ship Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expectedShipDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expectedShipDate
                          ? format(expectedShipDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expectedShipDate}
                        onSelect={setExpectedShipDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {selectedMfg && !expectedShipDate && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() =>
                        setExpectedShipDate(addDays(new Date(), selectedMfg.leadTimeDays))
                      }
                    >
                      Use manufacturer lead time ({selectedMfg.leadTimeDays} days)
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes for Manufacturer</Label>
                  <Textarea
                    value={packageNotes}
                    onChange={(e) => setPackageNotes(e.target.value)}
                    placeholder="Special instructions, rush handling notes, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Package Contents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Package Contents
                </CardTitle>
                <CardDescription>
                  {packageItems.length} order{packageItems.length !== 1 ? "s" : ""},{" "}
                  {packageSummary.totalUnits} total units
                </CardDescription>
              </CardHeader>
              <CardContent>
                {packageItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No orders added yet</p>
                    <p className="text-xs mt-1">
                      Select orders from the left to add them
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {packageItems.map((item) => (
                        <div
                          key={item.orderId}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.orderNumber}</span>
                              {item.isRush && (
                                <Badge variant="destructive" className="text-xs">
                                  Rush
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.lineItemIds.length} item(s), {item.totalUnits} units
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOrderFromPackage(item.orderId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {/* Summary */}
                {packageItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Orders:</span>
                      <span className="font-medium">{packageSummary.totalOrders}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Units:</span>
                      <span className="font-medium">{packageSummary.totalUnits}</span>
                    </div>
                    {packageSummary.hasRush && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        Contains rush order(s)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={
                createPackageMutation.isPending ||
                !selectedManufacturer ||
                packageItems.length === 0
              }
            >
              {createPackageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Package...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Create Package & Send to Manufacturer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
