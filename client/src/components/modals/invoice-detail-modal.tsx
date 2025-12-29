import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DollarSign, Calendar, FileText, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  onEdit?: () => void;
}

export function InvoiceDetailModal({ isOpen, onClose, invoiceId, onEdit }: InvoiceDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: invoice } = useQuery<any>({
    queryKey: ['/api/invoices', invoiceId],
    enabled: isOpen && !!invoiceId,
  });

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: ['/api/invoice-payments'],
    enabled: isOpen && !!invoiceId,
    select: (data) => data.filter((p: any) => p.invoiceId === invoiceId),
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ['/api/organizations'],
    enabled: isOpen,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    enabled: isOpen,
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/invoices/${invoiceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteInvoiceMutation.mutate();
  };

  if (!invoice) return null;

  const org = organizations.find((o: any) => o.id === invoice.orgId);
  const order = orders.find((o: any) => o.id === invoice.orderId);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num) || num === null || num === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'partial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>
            {org?.name ? `${org.name} - ${invoice.invoiceNumber}` : invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium">{org?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order</p>
                  <p className="font-medium">{order?.orderCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Terms</p>
                  <p className="font-medium">{invoice.paymentTerms || 'Net 30'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-bold">{formatCurrency(invoice.amountPaid || 0)}</span>
                </div>
                <div className="flex justify-between text-yellow-600 border-t pt-2">
                  <span>Outstanding Balance</span>
                  <span className="font-bold">
                    {formatCurrency(parseFloat(invoice.totalAmount) - parseFloat(invoice.amountPaid || 0))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Payment History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="outline">{payment.paymentMethod}</Badge></TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {invoice.notes && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p>{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-6">
          <div className="flex gap-2 w-full justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              data-testid="button-delete-invoice"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="button-close"
              >
                Close
              </Button>
              {onEdit && (
                <Button
                  onClick={onEdit}
                  data-testid="button-edit-invoice"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {invoice.invoiceNumber}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
