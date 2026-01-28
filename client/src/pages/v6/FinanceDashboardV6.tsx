import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  Download,
  Bell,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PiggyBank,
  Users,
  Building2,
} from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FinanceMetrics {
  totalRevenue: number;
  previousMonthRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  averagePaymentTime: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  paidThisMonth: number;
  manufacturerPayables: number;
  commissionsDue: number;
}

interface PendingPayment {
  id: number;
  orderNumber: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: "pending" | "overdue" | "partial";
  daysPastDue?: number;
  partialPaid?: number;
}

interface RecentTransaction {
  id: number;
  type: "payment_received" | "invoice_sent" | "refund" | "manufacturer_payment" | "commission";
  orderNumber?: string;
  customerName?: string;
  manufacturerName?: string;
  amount: number;
  date: string;
  method?: string;
  reference?: string;
}

interface ManufacturerPayable {
  id: number;
  manufacturerName: string;
  totalOutstanding: number;
  ordersCount: number;
  oldestDueDate: string;
  status: "current" | "due" | "overdue";
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "error";
}) {
  const bgColors = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600",
    error: "bg-red-100 text-red-600",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", bgColors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && trendValue && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend === "up" ? "text-green-600" : "text-red-600"
            )}>
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentStatusBadge({ status, daysPastDue }: { status: string; daysPastDue?: number }) {
  const config = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
    overdue: { label: daysPastDue ? `${daysPastDue}d Overdue` : "Overdue", color: "bg-red-100 text-red-700" },
    partial: { label: "Partial", color: "bg-blue-100 text-blue-700" },
    paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  };
  const { label, color } = config[status as keyof typeof config] || config.pending;
  return <Badge className={cn("text-xs", color)}>{label}</Badge>;
}

function TransactionTypeIcon({ type }: { type: string }) {
  const icons = {
    payment_received: { icon: DollarSign, color: "text-green-600 bg-green-100" },
    invoice_sent: { icon: FileText, color: "text-blue-600 bg-blue-100" },
    refund: { icon: ArrowDownRight, color: "text-red-600 bg-red-100" },
    manufacturer_payment: { icon: Building2, color: "text-purple-600 bg-purple-100" },
    commission: { icon: Users, color: "text-orange-600 bg-orange-100" },
  };
  const config = icons[type as keyof typeof icons] || icons.payment_received;
  return (
    <div className={cn("p-2 rounded-full", config.color)}>
      <config.icon className="h-4 w-4" />
    </div>
  );
}

export default function FinanceDashboardV6() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("this_month");

  // Fetch data
  const { data: metrics, isLoading: loadingMetrics } = useQuery<FinanceMetrics>({
    queryKey: ["/api/v6/dashboard/finance/metrics", dateRange],
    refetchInterval: 60000,
  });

  const { data: pendingPayments = [], isLoading: loadingPayments } = useQuery<PendingPayment[]>({
    queryKey: ["/api/v6/dashboard/finance/pending-payments"],
    refetchInterval: 30000,
  });

  const { data: recentTransactions = [] } = useQuery<RecentTransaction[]>({
    queryKey: ["/api/v6/dashboard/finance/recent-transactions"],
  });

  const { data: manufacturerPayables = [] } = useQuery<ManufacturerPayable[]>({
    queryKey: ["/api/v6/dashboard/finance/manufacturer-payables"],
  });

  // Calculate trend
  const revenueTrend = metrics && metrics.previousMonthRevenue > 0
    ? ((metrics.totalRevenue - metrics.previousMonthRevenue) / metrics.previousMonthRevenue) * 100
    : 0;

  // Prioritize overdue payments
  const sortedPayments = useMemo(() => {
    return [...pendingPayments].sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (b.status === "overdue" && a.status !== "overdue") return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [pendingPayments]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Finance Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Financial overview and payment tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="this_quarter">This Quarter</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => navigate("/finance/overview")}>
                Full Finance Suite
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={`$${(metrics?.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            trend={revenueTrend >= 0 ? "up" : "down"}
            trendValue={`${Math.abs(revenueTrend).toFixed(1)}% vs last month`}
            variant="success"
          />
          <MetricCard
            title="Outstanding"
            value={`$${(metrics?.outstandingAmount || 0).toLocaleString()}`}
            subtitle={`${metrics?.outstandingInvoices || 0} invoices`}
            icon={Receipt}
            variant="warning"
          />
          <MetricCard
            title="Overdue Payments"
            value={`$${(metrics?.overduePayments || 0).toLocaleString()}`}
            icon={AlertCircle}
            variant={metrics?.overduePayments ? "error" : "default"}
          />
          <MetricCard
            title="Manufacturer Payables"
            value={`$${(metrics?.manufacturerPayables || 0).toLocaleString()}`}
            icon={Building2}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">${(metrics?.paidThisMonth || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Paid This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{metrics?.averagePaymentTime || 0} days</p>
                <p className="text-xs text-muted-foreground">Avg. Payment Time</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold">${(metrics?.commissionsDue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Commissions Due</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{metrics?.pendingPayments || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Payments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending Payments</TabsTrigger>
            <TabsTrigger value="payables">Manufacturer Payables</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Recent Transactions</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/finance/payments")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {recentTransactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent transactions
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentTransactions.map((tx) => (
                          <div key={tx.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
                            <TransactionTypeIcon type={tx.type} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {tx.customerName || tx.manufacturerName || tx.orderNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.reference || tx.method || tx.type.replace(/_/g, " ")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-sm font-medium",
                                tx.type === "payment_received" && "text-green-600",
                                tx.type === "refund" && "text-red-600"
                              )}>
                                {tx.type === "refund" ? "-" : ""}${tx.amount.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.date), "MMM d")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Overdue Payments Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Overdue Payments
                  </CardTitle>
                  <CardDescription>
                    Payments requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {sortedPayments.filter(p => p.status === "overdue").length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-muted-foreground">No overdue payments</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sortedPayments
                          .filter(p => p.status === "overdue")
                          .slice(0, 5)
                          .map((payment) => (
                            <div
                              key={payment.id}
                              className="p-3 border rounded-lg border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50"
                              onClick={() => navigate(`/v6/orders?invoice=${payment.invoiceNumber}`)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{payment.orderNumber}</span>
                                <PaymentStatusBadge status={payment.status} daysPastDue={payment.daysPastDue} />
                              </div>
                              <p className="text-sm text-muted-foreground">{payment.customerName}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-sm">Invoice #{payment.invoiceNumber}</span>
                                <span className="font-semibold text-red-600">
                                  ${payment.amount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Payments Tab */}
          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loadingPayments ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No pending payments
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedPayments.map((payment) => (
                          <TableRow
                            key={payment.id}
                            className={cn(
                              "cursor-pointer hover:bg-muted/50",
                              payment.status === "overdue" && "bg-red-50/50"
                            )}
                            onClick={() => navigate(`/v6/orders?invoice=${payment.invoiceNumber}`)}
                          >
                            <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                            <TableCell>{payment.customerName}</TableCell>
                            <TableCell>#{payment.invoiceNumber}</TableCell>
                            <TableCell>
                              ${payment.amount.toLocaleString()}
                              {payment.partialPaid && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  (${payment.partialPaid.toLocaleString()} paid)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{format(new Date(payment.dueDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <PaymentStatusBadge status={payment.status} daysPastDue={payment.daysPastDue} />
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manufacturer Payables Tab */}
          <TabsContent value="payables" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Oldest Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manufacturerPayables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No manufacturer payables
                        </TableCell>
                      </TableRow>
                    ) : (
                      manufacturerPayables.map((payable) => (
                        <TableRow
                          key={payable.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            payable.status === "overdue" && "bg-red-50/50"
                          )}
                        >
                          <TableCell className="font-medium">{payable.manufacturerName}</TableCell>
                          <TableCell className="font-semibold">
                            ${payable.totalOutstanding.toLocaleString()}
                          </TableCell>
                          <TableCell>{payable.ordersCount} orders</TableCell>
                          <TableCell>{format(new Date(payable.oldestDueDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-xs",
                              payable.status === "current" && "bg-green-100 text-green-700",
                              payable.status === "due" && "bg-yellow-100 text-yellow-700",
                              payable.status === "overdue" && "bg-red-100 text-red-700"
                            )}>
                              {payable.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Pay
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/finance/invoices")}>
            <FileText className="h-4 w-4 mr-2" />
            Manage Invoices
          </Button>
          <Button variant="outline" onClick={() => navigate("/finance/payments")}>
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="outline" onClick={() => navigate("/finance/commissions")}>
            <Users className="h-4 w-4 mr-2" />
            Commissions
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}
