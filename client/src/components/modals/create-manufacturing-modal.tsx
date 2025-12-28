import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
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
import { Badge } from "@/components/ui/badge";
import { Package, Building2, Calendar, FileText, AlertCircle, Factory, X, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineItemGrid } from "@/components/manufacturing/LineItemGrid";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  const { data: manufacturingRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/manufacturing'],
    enabled: isOpen,
  });

  useEffect(() => {
    if (!preselectedOrderId || !isOpen) return;
    
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
  }, [preselectedOrderId, isOpen]);

  const ordersWithManufacturing = new Set(manufacturingRecords.map(rec => rec.orderId));

  const manufacturingReadyOrders = orders.filter((order: any) => 
    !ordersWithManufacturing.has(order.id)
  );

  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ['/api/manufacturers'],
    enabled: isOpen,
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  const { data: orderLineItems = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', selectedOrderId, 'line-items-with-manufacturers'],
    queryFn: selectedOrderId ? () => fetch(`/api/orders/${selectedOrderId}/line-items-with-manufacturers`).then(r => r.json()) : undefined,
    enabled: isOpen && !!selectedOrderId,
  });

  const { data: productVariants = [] } = useQuery<any[]>({
    queryKey: ['/api/product-variants'],
    enabled: isOpen && orderLineItems.length > 0,
  });

  const { data: existingAssignments = [] } = useQuery<any[]>({
    queryKey: ['/api/orders', selectedOrderId, 'line-item-manufacturers'],
    queryFn: selectedOrderId ? () => fetch(`/api/orders/${selectedOrderId}/line-item-manufacturers`).then(r => r.json()) : undefined,
    enabled: isOpen && !!selectedOrderId,
  });

  const { data: manufacturingStages = [] } = useQuery<any[]>({
    queryKey: ['/api/config/manufacturing-stages'],
    enabled: isOpen,
  });

  const selectedOrder = manufacturingReadyOrders.find((o: any) => o.id === selectedOrderId);
  const selectedOrg = selectedOrder ? organizations.find((org: any) => org.id === selectedOrder.orgId) : null;

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
      await apiRequest("/api/manufacturing", {
        method: "POST",
        body: values,
      });

      const assignmentsToSave = assignments.filter(lim => lim.manufacturerId !== null);

      for (const assignment of assignmentsToSave) {
        const existing = existingAssignments.find((a: any) => a.lineItemId === assignment.lineItemId);
        
        if (existing) {
          await apiRequest(`/api/line-item-manufacturers/${existing.id}`, {
            method: "PUT",
            body: { manufacturerId: assignment.manufacturerId },
          });
        } else {
          await apiRequest("/api/line-item-manufacturers", {
            method: "POST",
            body: {
              lineItemId: assignment.lineItemId,
              manufacturerId: assignment.manufacturerId,
            },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Success",
        description: "Manufacturing record created successfully",
      });
      onClose();
      form.reset();
      setSelectedOrderId(null);
      setLineItemManufacturers([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create manufacturing record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CreateManufacturingFormValues) => {
    const finalAssignments = lineItemManufacturers.map(lim => {
      if (lim.manufacturerId === null) {
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

  const calculateTotalQty = (item: any) => {
    return (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
           (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
           (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0) + (item.xxxxl || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-transparent border-0">
        <VisuallyHidden.Root>
          <DialogHeader>
            <DialogTitle>Create Manufacturing Update</DialogTitle>
            <DialogDescription>Initiate production tracking for an order</DialogDescription>
          </DialogHeader>
        </VisuallyHidden.Root>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-20 rounded-2xl"
            style={{ boxShadow: `inset 0 0 60px rgba(139, 92, 246, 0.2)` }}
          />

          <div className="relative z-10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 border border-neon-purple/50 flex items-center justify-center">
                    <Factory className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create Manufacturing Update</h2>
                    <p className="text-sm text-white/60">Initiate production tracking for an order</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
              <div className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-neon-blue" />
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
                              <SelectTrigger 
                                data-testid="select-order"
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:ring-neon-blue/50"
                              >
                                <SelectValue placeholder="Choose an order to manufacture" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#1a1a2e] border-white/10">
                              {manufacturingReadyOrders.length === 0 ? (
                                <div className="p-4 text-center text-white/40">
                                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                  <p className="text-sm">No orders available for manufacturing</p>
                                  <p className="text-xs mt-1">All orders already have manufacturing records</p>
                                </div>
                              ) : (
                                manufacturingReadyOrders.map((order: any) => {
                                  const org = organizations.find((o: any) => o.id === order.orgId);
                                  return (
                                    <SelectItem 
                                      key={order.id} 
                                      value={order.id.toString()}
                                      className="text-white hover:bg-white/10 focus:bg-white/10"
                                    >
                                      <div className="flex items-center justify-between w-full gap-2">
                                        <span>{order.orderCode} - {order.orderName}</span>
                                        <Badge variant="outline" className="ml-2 border-white/20 text-white/60">{org?.name}</Badge>
                                      </div>
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-white/40">
                            Any order without an existing manufacturing record can be selected
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {selectedOrder && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-white/40 text-xs mb-1">Order Code</p>
                            <p className="font-medium text-white">{selectedOrder.orderCode}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1">Organization</p>
                            <p className="font-medium text-white">{selectedOrg?.name}</p>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1">Status</p>
                            <Badge className={cn(
                              "text-xs",
                              selectedOrder.status === 'invoiced' 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-white/10 text-white/60 border-white/20'
                            )}>
                              {selectedOrder.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-white/40 text-xs mb-1">Priority</p>
                            <Badge className={cn(
                              "text-xs",
                              selectedOrder.priority === 'high' 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                : selectedOrder.priority === 'normal' 
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                                  : 'bg-white/10 text-white/60 border-white/20'
                            )}>
                              {selectedOrder.priority}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {orderLineItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-neon-blue" />
                          <h3 className="text-base font-semibold text-white">Line Items - Size Breakdown & Images</h3>
                        </div>
                        <LineItemGrid 
                          lineItems={orderLineItems}
                          productVariants={productVariants}
                          orderId={selectedOrderId!}
                        />
                      </motion.div>
                    )}

                    {orderLineItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Building2 className="w-4 h-4 text-neon-purple" />
                          <h3 className="text-base font-semibold text-white">Assign Manufacturers to Line Items</h3>
                        </div>
                        <div className="space-y-3">
                          {orderLineItems.map((item: any) => {
                            const variant = productVariants.find((v: any) => v.id === item.variantId);
                            const currentManufacturerId = lineItemManufacturers.find(lim => lim.lineItemId === item.id)?.manufacturerId;

                            return (
                              <div 
                                key={item.id}
                                className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 border border-white/5"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-white truncate">{item.itemName || variant?.variantCode || 'Item'}</p>
                                  {item.colorNotes && (
                                    <p className="text-xs text-white/40 truncate">{item.colorNotes}</p>
                                  )}
                                </div>
                                <Badge variant="outline" className="border-white/20 text-white/60 flex-shrink-0">
                                  {calculateTotalQty(item)} units
                                </Badge>
                                <Select
                                  value={currentManufacturerId?.toString() || ""}
                                  onValueChange={(value) => updateLineItemManufacturer(item.id, parseInt(value))}
                                >
                                  <SelectTrigger 
                                    data-testid={`select-manufacturer-${item.id}`}
                                    className="w-[200px] bg-white/5 border-white/10 text-white hover:bg-white/10"
                                  >
                                    <SelectValue placeholder="Select manufacturer" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                                    {manufacturers.map((manufacturer: any) => (
                                      <SelectItem 
                                        key={manufacturer.id} 
                                        value={manufacturer.id.toString()}
                                        className="text-white hover:bg-white/10 focus:bg-white/10"
                                      >
                                        {manufacturer.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-white/40 mt-3">
                          Each line item can be assigned to a different manufacturer for flexible production management
                        </p>
                      </motion.div>
                    )}

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Initial Status</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger 
                                data-testid="select-initial-status"
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:ring-neon-blue/50"
                              >
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#1a1a2e] border-white/10">
                              {manufacturingStages.map((stage: any) => (
                                <SelectItem 
                                  key={stage.value} 
                                  value={stage.value}
                                  className="text-white hover:bg-white/10 focus:bg-white/10"
                                >
                                  {stage.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-white/40">
                            Set the initial production status
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neon-green" />
                            Estimated Completion Date
                          </FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                              data-testid="input-completion-date"
                              className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </FormControl>
                          <FormDescription className="text-white/40">
                            When do you expect production to be completed?
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any special manufacturing instructions, requirements, or notes..."
                              className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-neon-blue/50"
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-instructions"
                            />
                          </FormControl>
                          <FormDescription className="text-white/40">
                            Provide any specific requirements or instructions for the manufacturer
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
                data-testid="button-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={createManufacturingMutation.isPending || !form.formState.isValid}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                  form.formState.isValid && !createManufacturingMutation.isPending
                    ? "bg-gradient-to-r from-neon-purple/30 to-neon-blue/30 border border-neon-purple/50 text-white hover:from-neon-purple/40 hover:to-neon-blue/40"
                    : "bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                )}
                data-testid="button-create"
              >
                {createManufacturingMutation.isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Factory className="w-4 h-4" />
                    Create Manufacturing Update
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
