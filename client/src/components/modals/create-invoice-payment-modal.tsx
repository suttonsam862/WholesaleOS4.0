import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertInvoicePaymentSchema } from "@shared/schema";
import { z } from "zod";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateInvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId?: number;
}

const createPaymentFormSchema = insertInvoicePaymentSchema.omit({ paymentNumber: true });

type CreatePaymentFormValues = z.infer<typeof createPaymentFormSchema>;

export function CreateInvoicePaymentModal({ isOpen, onClose, invoiceId }: CreateInvoicePaymentModalProps) {
  const { toast } = useToast();
  const [invoiceSearchOpen, setInvoiceSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const form = useForm<CreatePaymentFormValues>({
    resolver: zodResolver(createPaymentFormSchema),
    defaultValues: {
      invoiceId: invoiceId || undefined,
      amount: "0",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
    },
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ['/api/invoices'],
    enabled: isOpen,
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  const invoicesWithDetails = useMemo(() => {
    return invoices.map((invoice: any) => {
      const org = organizations.find((o: any) => o.id === invoice.orgId);
      const order = orders.find((o: any) => o.id === invoice.orderId);
      const totalAmount = parseFloat(invoice.totalAmount || 0);
      const amountPaid = parseFloat(invoice.amountPaid || 0);
      const amountDue = totalAmount - amountPaid;
      return {
        ...invoice,
        orgName: org?.name || "Unknown Organization",
        orderName: order?.orderName || "No Order",
        totalAmount,
        amountPaid,
        amountDue,
        searchText: `${org?.name || ""} ${order?.orderName || ""} ${invoice.invoiceNumber || ""}`.toLowerCase(),
      };
    });
  }, [invoices, organizations, orders]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoicesWithDetails;
    const query = searchQuery.toLowerCase();
    return invoicesWithDetails.filter((inv: any) => inv.searchText.includes(query));
  }, [invoicesWithDetails, searchQuery]);

  const createPaymentMutation = useMutation({
    mutationFn: (values: CreatePaymentFormValues) =>
      apiRequest("/api/invoice-payments", { method: "POST", body: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const selectedInvoice = invoicesWithDetails.find((inv: any) => inv.id === form.watch("invoiceId"));
  
  const onSubmit = (values: CreatePaymentFormValues) => {
    createPaymentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received against an invoice.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
            <FormField
              control={form.control}
              name="invoiceId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Invoice</FormLabel>
                  <Popover open={invoiceSearchOpen} onOpenChange={setInvoiceSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={invoiceSearchOpen}
                          className={cn(
                            "w-full justify-between h-auto min-h-[40px] py-2",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="select-invoice"
                        >
                          {selectedInvoice ? (
                            <div className="flex flex-col items-start text-left">
                              <span className="font-medium">{selectedInvoice.orgName}</span>
                              <span className="text-sm text-muted-foreground">
                                {selectedInvoice.orderName} - ${selectedInvoice.totalAmount.toFixed(2)} (Due: ${selectedInvoice.amountDue.toFixed(2)})
                              </span>
                            </div>
                          ) : (
                            "Search for an invoice..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput 
                          placeholder="Search by organization or order name..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          data-testid="input-invoice-search"
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>No invoices found.</CommandEmpty>
                          <CommandGroup>
                            {filteredInvoices.map((invoice: any) => (
                              <CommandItem
                                key={invoice.id}
                                value={invoice.id.toString()}
                                onSelect={() => {
                                  field.onChange(invoice.id);
                                  setInvoiceSearchOpen(false);
                                  setSearchQuery("");
                                }}
                                className="cursor-pointer"
                                data-testid={`invoice-option-${invoice.id}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === invoice.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col flex-1">
                                  <span className="font-medium">{invoice.orgName}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {invoice.orderName}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end text-sm">
                                  <span>${invoice.totalAmount.toFixed(2)}</span>
                                  <span className={cn(
                                    "text-xs",
                                    invoice.amountDue > 0 ? "text-yellow-600" : "text-green-600"
                                  )}>
                                    Due: ${invoice.amountDue.toFixed(2)}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedInvoice && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="ml-2 font-medium">{selectedInvoice.orgName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Order:</span>
                    <span className="ml-2 font-medium">{selectedInvoice.orderName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="ml-2 font-medium">${selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="ml-2 font-medium text-green-600">
                      ${selectedInvoice.amountPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Outstanding:</span>
                    <span className={cn(
                      "ml-2 font-medium",
                      selectedInvoice.amountDue > 0 ? "text-yellow-600" : "text-green-600"
                    )}>
                      ${selectedInvoice.amountDue.toFixed(2)}
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
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the amount received
                  </FormDescription>
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
                      data-testid="input-payment-date"
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
                      <SelectTrigger data-testid="select-payment-method">
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
                      data-testid="input-reference"
                    />
                  </FormControl>
                  <FormDescription>
                    Check number, transaction ID, or other reference
                  </FormDescription>
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
                      data-testid="input-notes"
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
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPaymentMutation.isPending}
                data-testid="button-record"
              >
                {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
