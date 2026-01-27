/**
 * Fulfillment Admin Dashboard
 *
 * Admin interface for managing fulfillment centers, inbound/outbound shipments,
 * QC inspections, and inventory.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Warehouse,
  TruckIcon,
  Package,
  CheckSquare,
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  RefreshCw,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FulfillmentCenter {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string | null;
  isActive: boolean;
  isDefault: boolean;
  totalItems: number;
  totalVariants: number;
  pendingInboundCount: number;
}

interface FulfillmentStats {
  inboundByStatus: Record<string, number>;
  outboundByStatus: Record<string, number>;
  inventory: {
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    uniqueVariants: number;
  };
  pendingQcInspections: number;
}

interface InboundShipment {
  id: number;
  shipmentCode: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  expectedArrivalDate: string | null;
  fulfillmentCenterName: string;
  manufacturerName: string | null;
  createdAt: string;
}

interface OutboundShipment {
  id: number;
  shipmentCode: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  orderCode: string | null;
  orderName: string | null;
  fulfillmentCenterName: string;
  createdAt: string;
}

interface InventoryItem {
  id: number;
  variantCode: string;
  productName: string;
  fulfillmentCenterName: string;
  fulfillmentCenterCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  binLocation: string | null;
}

const statusColors: Record<string, string> = {
  expected: "bg-blue-100 text-blue-700",
  in_transit: "bg-yellow-100 text-yellow-700",
  arrived: "bg-green-100 text-green-700",
  inspecting: "bg-purple-100 text-purple-700",
  stocked: "bg-emerald-100 text-emerald-700",
  issue: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-700",
  picking: "bg-yellow-100 text-yellow-700",
  packed: "bg-blue-100 text-blue-700",
  shipped: "bg-green-100 text-green-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function FulfillmentAdmin() {
  const [createFcOpen, setCreateFcOpen] = useState(false);
  const [newFc, setNewFc] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stats
  const { data: stats } = useQuery<FulfillmentStats>({
    queryKey: ["/api/admin/fulfillment/stats"],
    refetchInterval: 30000,
  });

  // Fetch fulfillment centers
  const { data: fulfillmentCenters = [] } = useQuery<FulfillmentCenter[]>({
    queryKey: ["/api/admin/fulfillment-centers"],
  });

  // Fetch inbound shipments
  const { data: inboundShipments = [] } = useQuery<InboundShipment[]>({
    queryKey: ["/api/admin/inbound-shipments"],
  });

  // Fetch outbound shipments
  const { data: outboundShipments = [] } = useQuery<OutboundShipment[]>({
    queryKey: ["/api/admin/outbound-shipments"],
  });

  // Fetch inventory
  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/admin/inventory"],
  });

  // Create fulfillment center mutation
  const createFcMutation = useMutation({
    mutationFn: async (data: typeof newFc) => {
      return apiRequest("/api/admin/fulfillment-centers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Fulfillment center created" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fulfillment-centers"] });
      setCreateFcOpen(false);
      setNewFc({ code: "", name: "", address: "", city: "", state: "", zipCode: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create fulfillment center", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fulfillment Management</h1>
          <p className="text-muted-foreground">
            Manage warehouses, shipments, and inventory
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventory.totalOnHand || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.inventory.uniqueVariants || 0} unique products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inbound</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.inboundByStatus?.expected || 0) + (stats?.inboundByStatus?.in_transit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting arrival</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending QC</CardTitle>
            <CheckSquare className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.pendingQcInspections || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need inspection</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.outboundByStatus?.packed || 0) + (stats?.outboundByStatus?.picking || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Outbound pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="centers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="centers" className="gap-2">
            <Warehouse className="h-4 w-4" />
            Fulfillment Centers
          </TabsTrigger>
          <TabsTrigger value="inbound" className="gap-2">
            <ArrowDownToLine className="h-4 w-4" />
            Inbound
          </TabsTrigger>
          <TabsTrigger value="outbound" className="gap-2">
            <ArrowUpFromLine className="h-4 w-4" />
            Outbound
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* Fulfillment Centers Tab */}
        <TabsContent value="centers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fulfillment Centers</CardTitle>
                <CardDescription>Warehouses for receiving and shipping</CardDescription>
              </div>
              <Button onClick={() => setCreateFcOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Center
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fulfillmentCenters.map((fc) => (
                    <TableRow key={fc.id}>
                      <TableCell className="font-mono">{fc.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {fc.name}
                          {fc.isDefault && (
                            <Badge variant="outline" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {fc.city}, {fc.state}
                      </TableCell>
                      <TableCell>{fc.totalItems}</TableCell>
                      <TableCell>{fc.pendingInboundCount}</TableCell>
                      <TableCell>
                        <Badge variant={fc.isActive ? "default" : "secondary"}>
                          {fc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {fulfillmentCenters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No fulfillment centers configured. Add one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbound Tab */}
        <TabsContent value="inbound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inbound Shipments</CardTitle>
              <CardDescription>Shipments from manufacturers to fulfillment centers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inboundShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">{shipment.shipmentCode}</TableCell>
                      <TableCell>{shipment.manufacturerName || "-"}</TableCell>
                      <TableCell>{shipment.fulfillmentCenterName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {shipment.trackingNumber || "-"}
                      </TableCell>
                      <TableCell>
                        {shipment.expectedArrivalDate
                          ? format(new Date(shipment.expectedArrivalDate), "MMM d")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[shipment.status] || ""}>
                          {shipment.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {inboundShipments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No inbound shipments yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outbound Tab */}
        <TabsContent value="outbound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outbound Shipments</CardTitle>
              <CardDescription>Shipments to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outboundShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono text-sm">{shipment.shipmentCode}</TableCell>
                      <TableCell>
                        {shipment.orderCode ? (
                          <div>
                            <div className="font-mono text-sm">{shipment.orderCode}</div>
                            <div className="text-xs text-muted-foreground">{shipment.orderName}</div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{shipment.fulfillmentCenterName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {shipment.trackingNumber || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[shipment.status] || ""}>
                          {shipment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {outboundShipments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No outbound shipments yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>Current stock levels by product</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Bin</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Reserved</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="font-mono text-sm">{item.variantCode}</TableCell>
                      <TableCell>{item.fulfillmentCenterCode}</TableCell>
                      <TableCell>{item.binLocation || "-"}</TableCell>
                      <TableCell className="text-right">{item.quantityOnHand}</TableCell>
                      <TableCell className="text-right">{item.quantityReserved}</TableCell>
                      <TableCell className="text-right font-semibold">{item.quantityAvailable}</TableCell>
                    </TableRow>
                  ))}
                  {inventoryItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No inventory yet. Items will appear here after passing QC.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Fulfillment Center Dialog */}
      <Dialog open={createFcOpen} onOpenChange={setCreateFcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fulfillment Center</DialogTitle>
            <DialogDescription>Create a new warehouse location</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  placeholder="FC-EAST"
                  value={newFc.code}
                  onChange={(e) => setNewFc({ ...newFc, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="East Coast Warehouse"
                  value={newFc.name}
                  onChange={(e) => setNewFc({ ...newFc, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Warehouse Way"
                value={newFc.address}
                onChange={(e) => setNewFc({ ...newFc, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Atlanta"
                  value={newFc.city}
                  onChange={(e) => setNewFc({ ...newFc, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="GA"
                  value={newFc.state}
                  onChange={(e) => setNewFc({ ...newFc, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  placeholder="30301"
                  value={newFc.zipCode}
                  onChange={(e) => setNewFc({ ...newFc, zipCode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFcOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createFcMutation.mutate(newFc)}
              disabled={createFcMutation.isPending || !newFc.code || !newFc.name}
            >
              {createFcMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
