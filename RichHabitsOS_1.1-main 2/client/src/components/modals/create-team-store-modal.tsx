import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertTeamStoreSchema, Order, Organization, User } from "@shared/schema";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Building2, Calendar, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreateTeamStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createTeamStoreSchema = insertTeamStoreSchema.extend({
  orderId: z.number().int().positive().optional(),
  storeName: z.string().min(1, "Store name is required"),
  customerName: z.string().min(1, "Customer name is required"),
  storeOpenDate: z.string().optional(),
  storeCloseDate: z.string().optional(),
});

type CreateTeamStoreFormValues = z.infer<typeof createTeamStoreSchema>;

export function CreateTeamStoreModal({ isOpen, onClose }: CreateTeamStoreModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const form = useForm<CreateTeamStoreFormValues>({
    resolver: zodResolver(createTeamStoreSchema),
    mode: "onChange",
    defaultValues: {
      orderId: undefined,
      customerName: "",
      storeName: "",
      status: "pending",
      storeOpenDate: "",
      storeCloseDate: "",
      notes: "",
      specialInstructions: "",
    },
  });

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  // Fetch existing team stores to filter out orders that already have them
  const { data: existingTeamStores = [] } = useQuery<any[]>({
    queryKey: ['/api/team-stores'],
    enabled: isOpen,
  });

  // Get order IDs that already have team stores
  const ordersWithTeamStores = new Set(existingTeamStores.map(ts => ts.orderId));

  // Filter out orders that already have team stores
  const availableOrders = orders.filter((order: any) => 
    !ordersWithTeamStores.has(order.id)
  );

  // Fetch organizations for display
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  // Fetch users for salesperson display
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users/for-assignment'],
    enabled: isOpen,
  });

  // Fetch order line items for the selected order
  const { data: orderLineItems = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', selectedOrderId, 'line-items'],
    queryFn: selectedOrderId ? () => fetch(`/api/orders/${selectedOrderId}/line-items`).then(r => r.json()) : undefined,
    enabled: isOpen && !!selectedOrderId,
  });

  // Get selected order details
  const selectedOrder = availableOrders.find((o: any) => o.id === selectedOrderId);
  const selectedOrg = selectedOrder ? organizations.find((org: any) => org.id === selectedOrder.orgId) : null;
  const selectedSalesperson = selectedOrder ? users.find((u: any) => u.id === selectedOrder.salespersonId) : null;

  // Auto-populate store name when order is selected
  useEffect(() => {
    if (selectedOrder && selectedOrg) {
      form.setValue('storeName', `${selectedOrg.name} Team Store`);
    }
  }, [selectedOrder, selectedOrg]);

  const createTeamStoreMutation = useMutation({
    mutationFn: async (values: CreateTeamStoreFormValues) => {
      // Get all line item IDs from the selected order (if order is selected)
      const lineItemIds = selectedOrderId && Array.isArray(orderLineItems) 
        ? orderLineItems.map((item: any) => item.id) 
        : [];

      return await apiRequest("/api/team-stores", {
        method: "POST",
        body: {
          ...values,
          lineItemIds,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Success",
        description: "Team store created successfully",
      });
      form.reset();
      setSelectedOrderId(null);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team store",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: CreateTeamStoreFormValues) => {
    createTeamStoreMutation.mutate(values);
  };

  const handleOrderChange = (orderId: string) => {
    const id = parseInt(orderId);
    setSelectedOrderId(id);
    form.setValue('orderId', id);
  };

  const sizeColumns = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
  const sizeLabels: Record<string, string> = {
    yxs: 'YXS', ys: 'YS', ym: 'YM', yl: 'YL',
    xs: 'XS', s: 'S', m: 'M', l: 'L', xl: 'XL', xxl: 'XXL', xxxl: 'XXXL'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-create-team-store">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Create Team Store</DialogTitle>
          <DialogDescription>
            Create a new team store (optionally linked to an existing order)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-order">Select Order (Optional)</FormLabel>
                      <Select 
                        onValueChange={handleOrderChange}
                        value={field.value?.toString()}
                        data-testid="select-order"
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-trigger-order">
                            <SelectValue placeholder="Select an order (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableOrders.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No orders available for team stores
                            </div>
                          ) : (
                            availableOrders.map((order: any) => {
                              const org = organizations.find((o: any) => o.id === order.orgId);
                              return (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  {order.orderCode} - {order.orderName} {org && `(${org.name})`}
                                </SelectItem>
                              );
                            })
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedOrder && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Order Code:</span>
                          <span className="font-medium" data-testid="text-order-code">{selectedOrder.orderCode}</span>
                        </div>
                        {selectedOrg && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Organization:</span>
                            <span className="font-medium" data-testid="text-org-name">{selectedOrg.name}</span>
                          </div>
                        )}
                        {selectedSalesperson && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Salesperson:</span>
                            <span className="font-medium" data-testid="text-salesperson-name">{selectedSalesperson.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Line Items:</span>
                          <Badge variant="secondary" data-testid="badge-line-item-count">{orderLineItems.length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-customer-name">Customer Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-customer-name" placeholder="Enter customer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-store-name">Store Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-store-name" placeholder="Enter store name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="storeOpenDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-open-date">Store Open Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-open-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeCloseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-close-date">Store Close Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-close-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-notes">Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-special-instructions">Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-special-instructions" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {Array.isArray(orderLineItems) && orderLineItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Preview: Line Items to be Added</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {orderLineItems.map((item: any) => {
                          const totalQty = sizeColumns.reduce((sum, size) => sum + (item[size] || 0), 0);
                          return (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between border-b pb-2"
                              data-testid={`preview-line-item-${item.id}`}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.itemName}</div>
                                <div className="text-xs text-muted-foreground">
                                  Total Quantity: {totalQty}
                                </div>
                              </div>
                              <Badge variant="outline">{totalQty} items</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
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
                disabled={createTeamStoreMutation.isPending || !form.formState.isValid}
                data-testid="button-create"
              >
                {createTeamStoreMutation.isPending ? "Creating..." : "Create Team Store"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
