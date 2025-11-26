import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useEffect } from "react";

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
}

const editInvoiceFormSchema = z.object({
  orderId: z.number().int().positive().optional().nullable(),
  orgId: z.number().int().positive().optional().nullable(),
  salespersonId: z.string().optional().nullable(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "sent", "partial", "paid", "overdue", "cancelled"]).default("draft"),
  subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  discount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  taxRate: z.string().regex(/^\d+(\.\d{1,4})?$/, "Must be a valid tax rate").optional(),
  taxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount").optional(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

type EditInvoiceFormValues = z.infer<typeof editInvoiceFormSchema>;

export function EditInvoiceModal({ isOpen, onClose, invoiceId }: EditInvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: invoice } = useQuery<any>({
    queryKey: ['/api/invoices', invoiceId],
    enabled: isOpen && !!invoiceId,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  const form = useForm<EditInvoiceFormValues>({
    resolver: zodResolver(editInvoiceFormSchema),
    defaultValues: {
      orderId: null,
      orgId: null,
      salespersonId: null,
      subtotal: "0",
      discount: "0",
      taxRate: "0",
      taxAmount: "0",
      totalAmount: "0",
      status: "draft",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentTerms: "",
      notes: "",
    },
  });

  // Update form when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      form.reset({
        orderId: invoice.orderId,
        orgId: invoice.orgId,
        salespersonId: invoice.salespersonId,
        subtotal: invoice.subtotal?.toString() || "0",
        discount: invoice.discount?.toString() || "0",
        taxRate: invoice.taxRate?.toString() || "0",
        taxAmount: invoice.taxAmount?.toString() || "0",
        totalAmount: invoice.totalAmount?.toString() || "0",
        status: invoice.status,
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentTerms: invoice.paymentTerms || "",
        notes: invoice.notes || "",
      });
    }
  }, [invoice, form]);

  const updateInvoiceMutation = useMutation({
    mutationFn: (values: EditInvoiceFormValues) =>
      apiRequest("PUT", `/api/invoices/${invoiceId}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: EditInvoiceFormValues) => {
    updateInvoiceMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update invoice information
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            field.onChange(null);
                            form.setValue("orgId", null);
                          } else {
                            const id = parseInt(value);
                            field.onChange(id);
                            const order = orders.find((o: any) => o.id === id);
                            if (order) {
                              form.setValue("orgId", order.orgId);
                            }
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-order">
                            <SelectValue placeholder="Select an order (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {orders.map((order: any) => (
                            <SelectItem key={order.id} value={order.id.toString()}>
                              {order.orderCode} - {order.orderName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optionally link this invoice to an existing order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orgId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization (Optional)</FormLabel>
                      <Select
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            field.onChange(null);
                          } else {
                            field.onChange(parseInt(value));
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-organization">
                            <SelectValue placeholder="Select an organization (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {organizations.map((org: any) => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Optionally link this invoice to an organization
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            data-testid="input-subtotal"
                            onChange={(e) => {
                              field.onChange(e);
                              const subtotal = parseFloat(e.target.value) || 0;
                              const discount = parseFloat(form.watch("discount") || "0") || 0;
                              const tax = parseFloat(form.watch("taxAmount") || "0") || 0;
                              form.setValue("totalAmount", (subtotal - discount + tax).toFixed(2));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            data-testid="input-discount"
                            onChange={(e) => {
                              field.onChange(e);
                              const subtotal = parseFloat(form.watch("subtotal") || "0") || 0;
                              const discount = parseFloat(e.target.value) || 0;
                              const tax = parseFloat(form.watch("taxAmount") || "0") || 0;
                              form.setValue("totalAmount", (subtotal - discount + tax).toFixed(2));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            data-testid="input-tax"
                            onChange={(e) => {
                              field.onChange(e);
                              const subtotal = parseFloat(form.watch("subtotal") || "0") || 0;
                              const discount = parseFloat(form.watch("discount") || "0") || 0;
                              const tax = parseFloat(e.target.value) || 0;
                              form.setValue("totalAmount", (subtotal - discount + tax).toFixed(2));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          data-testid="input-total"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-issue-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="partial">Partially Paid</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Terms (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Net 30"
                          data-testid="input-payment-terms"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            
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
                disabled={updateInvoiceMutation.isPending}
                data-testid="button-update"
              >
                {updateInvoiceMutation.isPending ? "Updating..." : "Update Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
