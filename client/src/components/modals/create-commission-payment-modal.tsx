import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCommissionPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";
import { Calculator, ArrowRight } from "lucide-react";

interface CreateCommissionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  salespersonId?: string;
}

const createCommissionPaymentFormSchema = z.object({
  salespersonId: z.string().min(1, "Salesperson is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  period: z.string().min(1, "Period is required"),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  paymentMethod: z.enum(["check", "direct_deposit", "wire", "other"]),
  referenceNumber: z.string().optional(),
  commissionIds: z.array(z.number()).optional(),
  notes: z.string().optional(),
  processedBy: z.string().optional(),
});

type CreateCommissionPaymentFormValues = z.infer<typeof createCommissionPaymentFormSchema>;

export function CreateCommissionPaymentModal({ isOpen, onClose, salespersonId }: CreateCommissionPaymentModalProps) {
  const { toast } = useToast();
  
  const form = useForm<CreateCommissionPaymentFormValues>({
    resolver: zodResolver(createCommissionPaymentFormSchema),
    defaultValues: {
      salespersonId: salespersonId || "",
      totalAmount: "0",
      paymentDate: new Date().toISOString().split('T')[0],
      period: new Date().toISOString().slice(0, 7),
      paymentMethod: "check",
      notes: "",
    },
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users/for-assignment'],
    enabled: isOpen,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  const { data: commissionPayments = [] } = useQuery<any[]>({
    queryKey: ['/api/commission-payments'],
    enabled: isOpen,
  });

  const salespeople = users.filter((u: any) => u.role === 'sales' || u.role === 'admin');

  useEffect(() => {
    if (salespersonId && isOpen) {
      form.setValue("salespersonId", salespersonId);
    }
  }, [salespersonId, isOpen, form]);

  const createCommissionPaymentMutation = useMutation({
    mutationFn: (values: CreateCommissionPaymentFormValues) =>
      apiRequest("POST", "/api/commission-payments", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-payments"] });
      toast({
        title: "Success",
        description: "Commission payment recorded successfully",
      });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record commission payment",
        variant: "destructive",
      });
    },
  });

  const selectedSalespersonId = form.watch("salespersonId");
  const selectedSalesperson = users.find((u: any) => u.id === selectedSalespersonId);
  
  // Calculate pending commission for selected salesperson
  const salespersonOrders = orders.filter((o: any) => o.salespersonId === selectedSalespersonId);
  const totalSales = salespersonOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const commissionRate = selectedSalesperson?.commissionRate || 0.15;
  const totalCommission = totalSales * commissionRate;
  
  const paidCommissions = commissionPayments
    .filter((cp: any) => cp.salespersonId === selectedSalespersonId)
    .reduce((sum, cp) => sum + parseFloat(cp.totalAmount || 0), 0);
  
  const pendingCommission = totalCommission - paidCommissions;

  const handleUseAmount = () => {
    if (pendingCommission > 0) {
      form.setValue("totalAmount", pendingCommission.toFixed(2));
    }
  };
  
  const onSubmit = (values: CreateCommissionPaymentFormValues) => {
    createCommissionPaymentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Record Commission Payment</DialogTitle>
          <DialogDescription>
            Record a commission payment to a salesperson
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <FormField
                control={form.control}
                name="salespersonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salesperson</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-salesperson">
                          <SelectValue placeholder="Select a salesperson" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {salespeople.map((person: any) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedSalesperson && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">Commission Calculator</span>
                    <span className="text-xs text-muted-foreground">Auto-calculated based on orders</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">Total Sales</div>
                      <div className="font-semibold text-emerald-400">${totalSales.toFixed(2)}</div>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">Commission Rate</div>
                      <div className="font-semibold text-emerald-400">{(commissionRate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">Gross Commission</div>
                      <div className="font-semibold text-foreground">${totalCommission.toFixed(2)}</div>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                      <div className="text-xs text-muted-foreground mb-1">Already Paid</div>
                      <div className="font-semibold text-foreground">${paidCommissions.toFixed(2)}</div>
                    </div>
                    <div className="col-span-2 bg-background/50 rounded p-2 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Suggested Payment</div>
                        <div className="font-bold text-lg text-emerald-400">${pendingCommission.toFixed(2)}</div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleUseAmount}
                        disabled={pendingCommission <= 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        data-testid="button-use-amount"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Use Amount
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the commission amount being paid
                  </FormDescription>
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
                        data-testid="input-payment-date"
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
                        data-testid="input-period"
                      />
                    </FormControl>
                    <FormDescription>
                      Month this payment covers
                    </FormDescription>
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
                      <SelectTrigger data-testid="select-payment-method">
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Any additional notes..."
                        className="resize-none"
                        rows={2}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
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
                disabled={createCommissionPaymentMutation.isPending}
                data-testid="button-record"
              >
                {createCommissionPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
