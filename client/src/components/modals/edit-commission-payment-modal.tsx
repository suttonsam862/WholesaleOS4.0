import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useEffect } from "react";

interface EditCommissionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: number;
}

const editCommissionPaymentFormSchema = z.object({
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentDate: z.string().min(1, "Payment date is required"),
  period: z.string().min(1, "Period is required"),
  paymentMethod: z.enum(["check", "direct_deposit", "wire", "other"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type EditCommissionPaymentFormValues = z.infer<typeof editCommissionPaymentFormSchema>;

export function EditCommissionPaymentModal({ isOpen, onClose, paymentId }: EditCommissionPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<EditCommissionPaymentFormValues>({
    resolver: zodResolver(editCommissionPaymentFormSchema),
    defaultValues: {
      totalAmount: "0",
      paymentDate: "",
      period: "",
      paymentMethod: "check",
      referenceNumber: "",
      notes: "",
    },
  });

  const { data: commissionPayment, isLoading: isLoadingPayment } = useQuery<any>({
    queryKey: ['/api/commission-payments', paymentId],
    queryFn: async () => {
      const response = await fetch(`/api/commission-payments/${paymentId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch commission payment');
      return response.json();
    },
    enabled: isOpen && !!paymentId,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users/for-assignment'],
    enabled: isOpen,
  });

  useEffect(() => {
    if (commissionPayment && isOpen) {
      form.reset({
        totalAmount: commissionPayment.totalAmount?.toString() || "0",
        paymentDate: commissionPayment.paymentDate?.split('T')[0] || "",
        period: commissionPayment.period || "",
        paymentMethod: commissionPayment.paymentMethod || "check",
        referenceNumber: commissionPayment.referenceNumber || "",
        notes: commissionPayment.notes || "",
      });
    }
  }, [commissionPayment, isOpen, form]);

  const updateMutation = useMutation({
    mutationFn: (values: EditCommissionPaymentFormValues) =>
      apiRequest("PATCH", `/api/commission-payments/${paymentId}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commission-payments", paymentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/overview"] });
      toast({
        title: "Success",
        description: "Commission payment updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update commission payment",
        variant: "destructive",
      });
    },
  });

  const salesperson = users.find((u: any) => u.id === commissionPayment?.salespersonId);
  const salespersonName = salesperson 
    ? `${salesperson.firstName || ''} ${salesperson.lastName || ''}`.trim() || salesperson.email
    : commissionPayment?.salespersonId || 'Unknown';

  const onSubmit = (values: EditCommissionPaymentFormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Commission Payment</DialogTitle>
          <DialogDescription>
            Update commission payment details
          </DialogDescription>
        </DialogHeader>
        
        {isLoadingPayment ? (
          <div className="py-8 text-center text-muted-foreground">Loading payment data...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Salesperson</FormLabel>
                <Input
                  value={salespersonName}
                  disabled
                  className="bg-muted"
                  data-testid="input-salesperson-readonly"
                />
                <p className="text-xs text-muted-foreground">Salesperson cannot be changed</p>
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
                        data-testid="input-edit-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <FormControl>
                        <Input
                          type="month"
                          {...field}
                          data-testid="input-edit-period"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
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
                        placeholder="Check #, Transaction ID, etc."
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
                      <Textarea
                        {...field}
                        placeholder="Any additional notes..."
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
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-commission"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
