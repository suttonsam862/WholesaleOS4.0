import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useEffect } from "react";

interface EditInvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number;
}

const editPaymentFormSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["cash", "check", "wire", "ach", "credit_card", "other"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type EditPaymentFormValues = z.infer<typeof editPaymentFormSchema>;

export function EditInvoicePaymentModal({ isOpen, onClose, paymentId }: EditInvoicePaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<EditPaymentFormValues>({
    resolver: zodResolver(editPaymentFormSchema),
    defaultValues: {
      amount: "0",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
    },
  });

  const { data: payment, isLoading: paymentLoading } = useQuery<any>({
    queryKey: ['/api/invoice-payments', paymentId],
    queryFn: async () => {
      const response = await fetch(`/api/invoice-payments/${paymentId}`, { credentials: 'include' });
      return response.ok ? response.json() : null;
    },
    enabled: isOpen && !!paymentId,
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['/api/invoices'],
    enabled: isOpen,
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        amount: payment.amount?.toString() || "0",
        paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        paymentMethod: payment.paymentMethod || "cash",
        referenceNumber: payment.referenceNumber || "",
        notes: payment.notes || "",
      });
    }
  }, [payment, form]);

  const updatePaymentMutation = useMutation({
    mutationFn: (values: EditPaymentFormValues) =>
      apiRequest(`/api/invoice-payments/${paymentId}`, { method: "PATCH", body: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const selectedInvoice = payment?.invoiceId ? invoices.find((inv: any) => inv.id === payment.invoiceId) : null;
  const selectedOrg = selectedInvoice ? organizations.find((org: any) => org.id === selectedInvoice.orgId) : null;
  
  const onSubmit = (values: EditPaymentFormValues) => {
    updatePaymentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice Payment</DialogTitle>
          <DialogDescription>
            Update payment details for {payment?.paymentNumber}
          </DialogDescription>
        </DialogHeader>
        
        {paymentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              {selectedInvoice && (
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Invoice:</span>
                      <span className="ml-2 font-medium">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="ml-2 font-medium">{selectedOrg?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="ml-2 font-medium">${parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Already Paid:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ${parseFloat(selectedInvoice.amountPaid || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        data-testid="input-edit-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        data-testid="input-edit-payment-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-payment-method">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., Check #, Transaction ID"
                        data-testid="input-edit-reference"
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
                        value={field.value || ""}
                        data-testid="input-edit-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel-edit-payment"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePaymentMutation.isPending}
                  data-testid="button-save-payment"
                >
                  {updatePaymentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
