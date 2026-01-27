import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  RefreshCw,
  Building,
  Calendar,
  CreditCard,
  Ban,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalPayables: number;
  dueThisWeek: number;
  overdue: number;
  paymentsThisMonth: number;
  pendingApprovalCount: number;
  disputedCount: number;
}

interface ManufacturerInvoice {
  id: number;
  invoiceNumber: string;
  manufacturerId: number;
  manufacturerName?: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  balanceDue: string;
  status: "draft" | "submitted" | "approved" | "partially_paid" | "paid" | "disputed" | "void";
  createdAt: string;
}

interface ManufacturerPayment {
  id: number;
  manufacturerId: number;
  manufacturerName?: string;
  paymentDate: string;
  amount: string;
  paymentMethod: string;
  referenceNumber?: string;
  createdByName?: string;
  createdAt: string;
}

interface AgingReport {
  asOfDate: string;
  manufacturers: Array<{
    manufacturerId: number;
    manufacturerName: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  }>;
  totals: {
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  };
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

function getInvoiceStatusBadge(status: ManufacturerInvoice["status"]) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "submitted":
      return <Badge variant="default">Submitted</Badge>;
    case "approved":
      return <Badge className="bg-blue-500">Approved</Badge>;
    case "partially_paid":
      return <Badge className="bg-yellow-500">Partial</Badge>;
    case "paid":
      return <Badge className="bg-green-500">Paid</Badge>;
    case "disputed":
      return <Badge variant="destructive">Disputed</Badge>;
    case "void":
      return <Badge variant="outline">Void</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function ManufacturerFinanceAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ManufacturerInvoice | null>(null);
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Payment form state
  const [newPayment, setNewPayment] = useState({
    manufacturerId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethod: "wire",
    referenceNumber: "",
    notes: "",
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/finance/dashboard"],
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<ManufacturerInvoice[]>({
    queryKey: ["/api/admin/invoices"],
  });

  // Fetch payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<ManufacturerPayment[]>({
    queryKey: ["/api/admin/payments"],
  });

  // Fetch aging report
  const { data: agingReport } = useQuery<AgingReport>({
    queryKey: ["/api/admin/reports/aging"],
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: typeof newPayment) => {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to record payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports/aging"] });
      setRecordPaymentOpen(false);
      setNewPayment({
        manufacturerId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        paymentMethod: "wire",
        referenceNumber: "",
        notes: "",
      });
      toast({ title: "Payment recorded successfully" });
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  // Approve invoice mutation
  const approveInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`/api/admin/invoices/${invoiceId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve invoice");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/finance/dashboard"] });
      toast({ title: "Invoice approved" });
    },
  });

  const handleRecordPayment = () => {
    recordPaymentMutation.mutate(newPayment);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manufacturer Finance</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and aging</p>
        </div>
        <Dialog open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment made to a manufacturer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Manufacturer ID *</Label>
                <Input
                  type="number"
                  value={newPayment.manufacturerId}
                  onChange={(e) => setNewPayment({ ...newPayment, manufacturerId: e.target.value })}
                  placeholder="Enter manufacturer ID"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select
                    value={newPayment.paymentMethod}
                    onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="credit">Credit on Account</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                    placeholder="Wire confirmation, check #, etc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Optional notes about this payment"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRecordPaymentOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={
                  !newPayment.manufacturerId || !newPayment.amount || !newPayment.paymentMethod ||
                  recordPaymentMutation.isPending
                }
              >
                Record Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <TrendingUp className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="w-4 h-4 mr-2" />
            Invoices ({invoices.length})
            {(stats?.pendingApprovalCount || 0) > 0 && (
              <Badge className="ml-2 bg-yellow-500">{stats?.pendingApprovalCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments">
            <Receipt className="w-4 h-4 mr-2" />
            Payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="aging">
            <Calendar className="w-4 h-4 mr-2" />
            Aging Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payables</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalPayables || 0)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Due This Week</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.dueThisWeek || 0)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className={stats?.overdue && stats.overdue > 0 ? "border-red-200" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className={`text-2xl font-bold ${stats?.overdue && stats.overdue > 0 ? "text-red-600" : ""}`}>
                      {formatCurrency(stats?.overdue || 0)}
                    </p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${stats?.overdue && stats.overdue > 0 ? "text-red-500" : "text-gray-400"}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Payments This Month</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.paymentsThisMonth || 0)}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                    <p className="text-2xl font-bold">{stats?.pendingApprovalCount || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(stats?.pendingApprovalCount || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <span>{stats?.pendingApprovalCount} invoice(s) awaiting approval</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("invoices")}
                    >
                      View
                    </Button>
                  </div>
                )}
                {(stats?.disputedCount || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <span>{stats?.disputedCount} disputed invoice(s)</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("invoices")}
                    >
                      View
                    </Button>
                  </div>
                )}
                {(stats?.overdue || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>{formatCurrency(stats?.overdue || 0)} overdue</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("aging")}
                    >
                      View Aging
                    </Button>
                  </div>
                )}
                {!stats?.pendingApprovalCount && !stats?.disputedCount && !stats?.overdue && (
                  <p className="text-muted-foreground text-center py-4">
                    No action items. Everything looks good!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Manufacturer Invoices</CardTitle>
              <CardDescription>Track invoices from manufacturers</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.manufacturerName || `ID: ${invoice.manufacturerId}`}</TableCell>
                        <TableCell>{format(new Date(invoice.invoiceDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                          {new Date(invoice.dueDate) < new Date() &&
                            invoice.status !== "paid" &&
                            invoice.status !== "void" && (
                              <Badge variant="destructive" className="ml-2">Overdue</Badge>
                            )}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.balanceDue)}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {invoice.status === "submitted" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveInvoiceMutation.mutate(invoice.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setInvoiceDetailOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Record of payments made to manufacturers</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{format(new Date(payment.paymentDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{payment.manufacturerName || `ID: ${payment.manufacturerId}`}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell className="capitalize">{payment.paymentMethod.replace("_", " ")}</TableCell>
                        <TableCell className="font-mono">{payment.referenceNumber || "-"}</TableCell>
                        <TableCell>{payment.createdByName || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aging">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Payable Aging</CardTitle>
              <CardDescription>
                {agingReport ? `As of ${format(new Date(agingReport.asOfDate), "MMMM d, yyyy")}` : "Loading..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!agingReport ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : agingReport.manufacturers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No outstanding balances.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">1-30 Days</TableHead>
                      <TableHead className="text-right">31-60 Days</TableHead>
                      <TableHead className="text-right">61-90 Days</TableHead>
                      <TableHead className="text-right">90+ Days</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agingReport.manufacturers.map((mfr) => (
                      <TableRow key={mfr.manufacturerId}>
                        <TableCell className="font-medium">{mfr.manufacturerName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(mfr.current)}</TableCell>
                        <TableCell className={`text-right ${mfr.days1to30 > 0 ? "text-yellow-600" : ""}`}>
                          {formatCurrency(mfr.days1to30)}
                        </TableCell>
                        <TableCell className={`text-right ${mfr.days31to60 > 0 ? "text-orange-600" : ""}`}>
                          {formatCurrency(mfr.days31to60)}
                        </TableCell>
                        <TableCell className={`text-right ${mfr.days61to90 > 0 ? "text-red-500" : ""}`}>
                          {formatCurrency(mfr.days61to90)}
                        </TableCell>
                        <TableCell className={`text-right ${mfr.days90plus > 0 ? "text-red-700 font-bold" : ""}`}>
                          {formatCurrency(mfr.days90plus)}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(mfr.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell>TOTALS</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingReport.totals.current)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingReport.totals.days1to30)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingReport.totals.days31to60)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingReport.totals.days61to90)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingReport.totals.days90plus)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingReport.totals.total)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Dialog */}
      <Dialog open={invoiceDetailOpen} onOpenChange={setInvoiceDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Invoice details and payment history
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedInvoice.manufacturerName || `Manufacturer ID: ${selectedInvoice.manufacturerId}`}
                  </span>
                </div>
                {getInvoiceStatusBadge(selectedInvoice.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Invoice Date</Label>
                  <p>{format(new Date(selectedInvoice.invoiceDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p>{format(new Date(selectedInvoice.dueDate), "MMMM d, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Amount</Label>
                  <p className="text-lg font-bold">{formatCurrency(selectedInvoice.totalAmount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Balance Due</Label>
                  <p className="text-lg font-bold">{formatCurrency(selectedInvoice.balanceDue)}</p>
                </div>
              </div>

              {selectedInvoice.status === "submitted" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      approveInvoiceMutation.mutate(selectedInvoice.id);
                      setInvoiceDetailOpen(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Invoice
                  </Button>
                </div>
              )}

              {(selectedInvoice.status === "approved" || selectedInvoice.status === "partially_paid") && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setNewPayment({
                      ...newPayment,
                      manufacturerId: selectedInvoice.manufacturerId.toString(),
                      amount: selectedInvoice.balanceDue,
                    });
                    setInvoiceDetailOpen(false);
                    setRecordPaymentOpen(true);
                  }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
