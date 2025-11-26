import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertManufacturingSchema, Order, Organization, Manufacturer } from "@shared/schema";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Building2, Calendar, FileText, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineItemGrid } from "@/components/manufacturing/LineItemGrid";

interface CreateManufacturingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedOrderId?: number | null;
}

const createManufacturingSchema = insertManufacturingSchema.extend({
  estCompletion: z.string().min(1, "Estimated completion date is required"),
}).omit({ manufacturerId: true }).extend({
  manufacturerId: z.number().optional(),
});

type CreateManufacturingFormValues = z.infer<typeof createManufacturingSchema>;

interface LineItemManufacturer {
  lineItemId: number;
  manufacturerId: number | null;
}

export function CreateManufacturingModal({ isOpen, onClose, preselectedOrderId }: CreateManufacturingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(preselectedOrderId || null);
  const [lineItemManufacturers, setLineItemManufacturers] = useState<LineItemManufacturer[]>([]);

  // Calculate default completion date (30 days from now)
  const getDefaultCompletionDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const form = useForm<CreateManufacturingFormValues>({
    resolver: zodResolver(createManufacturingSchema),
    mode: "onChange",
    defaultValues: {
      orderId: preselectedOrderId || undefined,
      status: "awaiting_admin_confirmation",
      manufacturerId: undefined,
      estCompletion: getDefaultCompletionDate(),
      specialInstructions: "",
    },
  });

  // Fetch orders that are ready for manufacturing
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  // Fetch existing manufacturing records to filter out orders that already have them
  const { data: manufacturingRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/manufacturing'],
    enabled: isOpen,
  });

  // Update selectedOrderId when preselectedOrderId changes
  useEffect(() => {
    if (!preselectedOrderId || !isOpen) return;
    
    // Check if this order already has a manufacturing record
    const existingRecord = manufacturingRecords.find((rec: any) => rec?.orderId === preselectedOrderId);
    
    if (existingRecord) {
      toast({
        title: "Manufacturing Record Already Exists",
        description: `This order already has a manufacturing record. Please use the existing record instead.`,
        variant: "destructive",
      });
      onClose();
      return;
    }
    
    setSelectedOrderId(preselectedOrderId);
    form.setValue('orderId', preselectedOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedOrderId, isOpen]);

  // Get order IDs that already have manufacturing records
  const ordersWithManufacturing = new Set(manufacturingRecords.map(rec => rec.orderId));

  // Filter out orders that already have manufacturing records
  const manufacturingReadyOrders = orders.filter((order: any) => 
    !ordersWithManufacturing.has(order.id)
  );

  // Fetch manufacturers
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ['/api/manufacturers'],
    enabled: isOpen,
  });

  // Fetch organizations for display
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  // Fetch order line items for the selected order
  const { data: orderLineItems = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', selectedOrderId, 'line-items-with-manufacturers'],
    queryFn: selectedOrderId ? () => fetch(`/api/orders/${selectedOrderId}/line-items-with-manufacturers`).then(r => r.json()) : undefined,
    enabled: isOpen && !!selectedOrderId,
  });

  // Fetch product variants to display product names
  const { data: productVariants = [] } = useQuery<any[]>({
    queryKey: ['/api/product-variants'],
    enabled: isOpen && orderLineItems.length > 0,
  });

  // Fetch existing manufacturer assignments
  const { data: existingAssignments = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', selectedOrderId, 'line-item-manufacturers'],
    queryFn: selectedOrderId ? () => fetch(`/api/orders/${selectedOrderId}/line-item-manufacturers`).then(r => r.json()) : undefined,
    enabled: isOpen && !!selectedOrderId,
  });

  // Fetch dynamic manufacturing stages
  const { data: manufacturingStages = [] } = useQuery<any[]>({
    queryKey: ['/api/config/manufacturing-stages'],
    enabled: isOpen,
  });

  // Get selected order details
  const selectedOrder = manufacturingReadyOrders.find((o: any) => o.id === selectedOrderId);
  const selectedOrg = selectedOrder ? organizations.find((org: any) => org.id === selectedOrder.orgId) : null;

  // Initialize line item manufacturers when order changes or existing assignments load
  useEffect(() => {
    if (orderLineItems.length > 0) {
      const initialAssignments = orderLineItems.map((item: any) => {
        const existing = existingAssignments.find((a: any) => a.lineItemId === item.id);
        return {
          lineItemId: item.id,
          manufacturerId: existing?.manufacturerId || null,
        };
      });
      setLineItemManufacturers(initialAssignments);
    }
  }, [orderLineItems, existingAssignments]);

  const createManufacturingMutation = useMutation({
    mutationFn: async ({ values, assignments }: { values: CreateManufacturingFormValues; assignments: LineItemManufacturer[] }) => {
      // First create the manufacturing record
      await apiRequest("/api/manufacturing", {
        method: "POST",
        body: values,
      });

      // Then save manufacturer assignments for each line item
      const assignmentsToSave = assignments.filter(lim => lim.manufacturerId !== null);

      for (const assignment of assignmentsToSave) {
        const existing = existingAssignments.find((a: any) => a.lineItemId === assignment.lineItemId);

        if (existing) {
          // Update existing assignment
          await apiRequest(`/api/line-item-manufacturers/${existing.id}`, {
            method: "PUT",
            body: { manufacturerId: assignment.manufacturerId },
          });
        } else {
          // Create new assignment
          await apiRequest(`/api/line-items/${assignment.lineItemId}/manufacturers`, {
            method: "POST",
            body: {
              orderId: selectedOrderId,
              manufacturerId: assignment.manufacturerId,
            },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      // Invalidate all line item and manufacturer-related queries using predicate
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          Array.isArray(query.queryKey) && 
          query.queryKey.some(seg => 
            typeof seg === 'string' && (
              seg.includes('line-item') || 
              seg.includes('manufacturers')
            )
          )
      });
      toast({
        title: "Success",
        description: "Manufacturing record and line item assignments created successfully",
      });
      form.reset();
      setLineItemManufacturers([]);
      setSelectedOrderId(preselectedOrderId || null); // Reset to preselectedOrderId
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create manufacturing update",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateManufacturingFormValues) => {
    // Auto-populate manufacturer assignments from variant defaults for unassigned items
    const finalAssignments = lineItemManufacturers.map(lim => {
      if (lim.manufacturerId === null) {
        // Find the variant's default manufacturer
        const lineItem = orderLineItems.find((item: any) => item.id === lim.lineItemId);
        const variant = productVariants.find((v: any) => v.id === lineItem?.variantId);
        return {
          ...lim,
          manufacturerId: variant?.defaultManufacturerId || null
        };
      }
      return lim;
    });

    createManufacturingMutation.mutate({ values, assignments: finalAssignments });
  };


  const updateLineItemManufacturer = (lineItemId: number, manufacturerId: number | null) => {
    setLineItemManufacturers(prev => {
      const existing = prev.find(lim => lim.lineItemId === lineItemId);
      if (existing) {
        return prev.map(lim => 
          lim.lineItemId === lineItemId ? { ...lim, manufacturerId } : lim
        );
      } else {
        return [...prev, { lineItemId, manufacturerId }];
      }
    });
  };

  // Calculate total quantity for a line item
  const calculateTotalQty = (item: any) => {
    return (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
           (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
           (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Create Manufacturing Update
          </DialogTitle>
          <DialogDescription>
            Initiate production tracking for an order and assign manufacturers to each line item
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Order Selection */}
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <FileText className="w-4 h-4 inline mr-1" />
                    Select Order
                  </FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => {
                      const id = parseInt(value);
                      field.onChange(id);
                      setSelectedOrderId(id);
                      setLineItemManufacturers([]);
                    }}
                    disabled={!!preselectedOrderId}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-order">
                        <SelectValue placeholder="Choose an order to manufacture" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturingReadyOrders.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">No orders available for manufacturing</p>
                          <p className="text-xs mt-1">All orders already have manufacturing records</p>
                        </div>
                      ) : (
                        manufacturingReadyOrders.map((order: any) => {
                          const org = organizations.find((o: any) => o.id === order.orgId);
                          return (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              <div className="flex items-center justify-between w-full">
                                <span>{order.orderCode} - {order.orderName}</span>
                                <Badge variant="outline" className="ml-2">{org?.name}</Badge>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Any order without an existing manufacturing record can be selected
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Order Details */}
            {selectedOrder && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order Code</p>
                      <p className="font-medium">{selectedOrder.orderCode}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Organization</p>
                      <p className="font-medium">{selectedOrg?.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={selectedOrder.status === 'invoiced' ? 'default' : 'secondary'}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Priority</p>
                      <Badge variant={selectedOrder.priority === 'high' ? 'destructive' : selectedOrder.priority === 'normal' ? 'default' : 'secondary'}>
                        {selectedOrder.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Line Item Grid with Images and Size Breakdown */}
            {orderLineItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Line Items - Size Breakdown & Images
                  </h3>
                </div>
                <LineItemGrid 
                  lineItems={orderLineItems}
                  productVariants={productVariants}
                  orderId={selectedOrderId!}
                />
              </div>
            )}

            {/* Line Item Manufacturer Assignments */}
            {orderLineItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Building2 className="w-4 h-4 mr-2" />
                    Assign Manufacturers to Line Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Manufacturer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderLineItems.map((item: any) => {
                          const variant = productVariants.find((v: any) => v.id === item.variantId);
                          const currentManufacturerId = lineItemManufacturers.find(lim => lim.lineItemId === item.id)?.manufacturerId;

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.itemName || variant?.variantCode || 'Item'}</span>
                                  {item.colorNotes && (
                                    <span className="text-xs text-muted-foreground">{item.colorNotes}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">{calculateTotalQty(item)}</Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={currentManufacturerId?.toString() || ""}
                                  onValueChange={(value) => updateLineItemManufacturer(item.id, parseInt(value))}
                                >
                                  <SelectTrigger 
                                    data-testid={`select-manufacturer-${item.id}`}
                                    className="w-[250px]"
                                  >
                                    <SelectValue placeholder="Select manufacturer" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {manufacturers.map((manufacturer: any) => (
                                      <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                                        {manufacturer.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                  <p className="text-sm text-muted-foreground mt-3">
                    Each line item can be assigned to a different manufacturer for flexible production management
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Initial Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-initial-status">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {manufacturingStages.map((stage: any) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the initial production status
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estimated Completion Date */}
            <FormField
              control={form.control}
              name="estCompletion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Estimated Completion Date
                  </FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      {...field}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="input-completion-date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription>
                    When do you expect production to be completed?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Special Instructions */}
            <FormField
              control={form.control}
              name="specialInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any special manufacturing instructions, requirements, or notes..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-instructions"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide any specific requirements or instructions for the manufacturer
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
                disabled={createManufacturingMutation.isPending || !form.formState.isValid}
                data-testid="button-create"
              >
                {createManufacturingMutation.isPending ? "Creating..." : "Create Manufacturing Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}