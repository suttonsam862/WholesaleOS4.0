import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Link2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { FinancialMatchingModal } from "@/components/modals/financial-matching-modal";
import { format } from "date-fns";
import type { Invoice, InvoicePayment, CommissionPayment, InsertFinancialTransaction } from "@shared/schema";
import { cn } from "@/lib/utils";

interface FinancialOverview {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingCommissions: number;
  paidCommissions: number;
  budgetUtilization: number;
  cashFlow: { month: string; income: number; expenses: number }[];
}

interface UnifiedFinancialRecord {
  id: string;
  type: "invoice" | "payment" | "commission";
  description: string;
  amount: number;
  status: string;
  date: Date;
  category: string;
  reference: string;
  details?: Record<string, any>;
}

interface FinancialMatchingOrder {
  id: number;
  orderCode: string;
  orderName: string;
  status: string;
  createdAt: string;
  orgId: number | null;
  salespersonId: string | null;
  organization?: { id: number; name: string; logoUrl?: string };
  salesperson?: { id: string; firstName: string; lastName: string };
  financialSummary: {
    invoiceCount: number;
    paymentCount: number;
    commissionCount: number;
    totalInvoiceAmount: number;
    totalPaymentsReceived: number;
    totalCommissions: number;
    totalCommissionsPaid: number;
    totalInflows: number;
    totalOutflows: number;
    netCashFlow: number;
    matchStatus: 'matched' | 'partial' | 'unmatched';
  };
}

const CATEGORY_OPTIONS = [
  "Sales",
  "Services",
  "Investments",
  "Other Income",
  "Operations",
  "Marketing",
  "Payroll",
  "Software",
  "Office",
  "Travel",
  "Other Expense"
];

export default function Finance() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "invoice" | "payment" | "commission">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  const [matchingSearchQuery, setMatchingSearchQuery] = useState("");
  const [matchingStatusFilter, setMatchingStatusFilter] = useState<string>("all");
  const [selectedOrderForMatching, setSelectedOrderForMatching] = useState<FinancialMatchingOrder | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: overview, isLoading: overviewLoading } = useQuery<FinancialOverview>({
    queryKey: ["/api/financial/overview"],
    queryFn: async () => {
      const response = await fetch('/api/financial/overview', { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        pendingCommissions: 0,
        paidCommissions: 0,
        budgetUtilization: 0,
        cashFlow: []
      };
    },
    retry: false,
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const response = await fetch('/api/invoices', { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const { data: invoicePayments = [], isLoading: paymentsLoading } = useQuery<InvoicePayment[]>({
    queryKey: ["/api/invoice-payments"],
    queryFn: async () => {
      const response = await fetch('/api/invoice-payments', { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const { data: commissionPayments = [], isLoading: commissionsLoading } = useQuery<CommissionPayment[]>({
    queryKey: ["/api/commission-payments"],
    queryFn: async () => {
      const response = await fetch('/api/commission-payments', { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const { data: matchingOrders = [], isLoading: matchingOrdersLoading } = useQuery<FinancialMatchingOrder[]>({
    queryKey: ["/api/financial-matching/orders"],
    queryFn: async () => {
      const response = await fetch('/api/financial-matching/orders', { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  const filteredMatchingOrders = matchingOrders.filter(order => {
    if (matchingSearchQuery) {
      const query = matchingSearchQuery.toLowerCase();
      const matchesSearch = 
        order.orderCode?.toLowerCase().includes(query) ||
        order.orderName?.toLowerCase().includes(query) ||
        order.organization?.name?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    if (matchingStatusFilter !== "all" && order.financialSummary.matchStatus !== matchingStatusFilter) {
      return false;
    }
    
    return true;
  });

  const unifiedRecords: UnifiedFinancialRecord[] = [
    ...invoices.map((inv): UnifiedFinancialRecord => ({
      id: `invoice-${inv.id}`,
      type: "invoice",
      description: `Invoice ${inv.invoiceNumber}`,
      amount: Number(inv.totalAmount),
      status: inv.status,
      date: new Date(inv.issueDate),
      category: "Invoice",
      reference: inv.invoiceNumber,
      details: {
        amountPaid: Number(inv.amountPaid || 0),
        amountDue: Number(inv.amountDue || 0),
        dueDate: inv.dueDate,
        orgId: inv.orgId,
      }
    })),
    ...invoicePayments.map((payment): UnifiedFinancialRecord => ({
      id: `payment-${payment.id}`,
      type: "payment",
      description: `Payment ${payment.paymentNumber}`,
      amount: Number(payment.amount),
      status: "completed",
      date: new Date(payment.paymentDate),
      category: "Payment Received",
      reference: payment.paymentNumber,
      details: {
        invoiceId: payment.invoiceId,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
      }
    })),
    ...commissionPayments.map((comm): UnifiedFinancialRecord => ({
      id: `commission-${comm.id}`,
      type: "commission",
      description: `Commission ${comm.paymentNumber} - ${comm.period}`,
      amount: Number(comm.totalAmount),
      status: "paid",
      date: new Date(comm.paymentDate),
      category: "Commission Payment",
      reference: comm.paymentNumber,
      details: {
        salespersonId: comm.salespersonId,
        period: comm.period,
        paymentMethod: comm.paymentMethod,
      }
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredRecords = unifiedRecords.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        record.description.toLowerCase().includes(query) ||
        record.reference.toLowerCase().includes(query) ||
        record.category.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (typeFilter !== "all" && record.type !== typeFilter) return false;
    if (statusFilter !== "all" && record.status !== statusFilter) return false;

    return true;
  });

  const stats = overview ? {
    totalIncome: overview.totalRevenue,
    totalExpenses: overview.totalExpenses,
    netProfit: overview.netProfit,
    pendingCommissions: overview.pendingCommissions,
    paidCommissions: overview.paidCommissions,
  } : {
    totalIncome: invoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0),
    totalExpenses: commissionPayments.reduce((sum, comm) => sum + Number(comm.totalAmount), 0),
    netProfit: 0,
    pendingCommissions: invoices.reduce((sum, inv) => sum + Number(inv.amountDue || 0), 0),
    paidCommissions: commissionPayments.reduce((sum, comm) => sum + Number(comm.totalAmount), 0),
  };

  const netIncome = overview ? overview.netProfit : (stats.totalIncome - stats.totalExpenses);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCommissionsPaid = commissionPayments.reduce((sum, c) => sum + Number(c.totalAmount), 0);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case "invoice": return <FileText className="h-5 w-5" />;
      case "payment": return <CreditCard className="h-5 w-5" />;
      case "commission": return <Users className="h-5 w-5" />;
      default: return <DollarSign className="h-5 w-5" />;
    }
  };

  const getRecordColor = (type: string, status: string) => {
    if (type === "commission") return "bg-purple-500/20 text-purple-400";
    if (type === "payment") return "bg-green-500/20 text-green-400";
    if (type === "invoice") {
      if (status === "paid") return "bg-green-500/20 text-green-400";
      if (status === "overdue") return "bg-red-500/20 text-red-400";
      return "bg-blue-500/20 text-blue-400";
    }
    return "bg-gray-500/20 text-gray-400";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "paid":
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "partial": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "overdue": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "draft": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "sent": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const isDataLoading = isLoading || overviewLoading || invoicesLoading || paymentsLoading || commissionsLoading;

  if (isDataLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Finance</h1>
          <p className="text-muted-foreground">Track invoices, payments, and commissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-white/10 bg-blue-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">Total Invoiced</p>
              <h3 className="text-2xl font-bold text-white" data-testid="stat-invoiced">{formatCurrency(totalInvoiced)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-green-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Payments Received</p>
              <h3 className="text-2xl font-bold text-white" data-testid="stat-payments">{formatCurrency(totalPaid)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{invoicePayments.length} payments</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-yellow-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-400">Outstanding</p>
              <h3 className="text-2xl font-bold text-white" data-testid="stat-outstanding">{formatCurrency(totalInvoiced - totalPaid)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <PieChart className="h-6 w-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-purple-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-400">Commissions Paid</p>
              <h3 className="text-2xl font-bold text-white" data-testid="stat-commissions">{formatCurrency(totalCommissionsPaid)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{commissionPayments.length} payments</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-black/20 border-white/10">
          <TabsTrigger value="overview" data-testid="tab-overview">All Records</TabsTrigger>
          <TabsTrigger value="matching" data-testid="tab-matching">
            <Link2 className="h-4 w-4 mr-2" />
            Financial Matching ({matchingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments ({invoicePayments.length})</TabsTrigger>
          <TabsTrigger value="commissions" data-testid="tab-commissions">Commissions ({commissionPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="glass-card border-white/10">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-black/20 border-white/10 text-white"
                    data-testid="input-search-finance"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="invoice">Invoices</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="commission">Commissions</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredRecords.map(record => (
              <Card key={record.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-record-${record.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      getRecordColor(record.type, record.status)
                    )}>
                      {getRecordIcon(record.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{record.description}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 capitalize">
                          {record.type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(record.date, "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold text-lg",
                      record.type === "commission" ? "text-purple-400" :
                      record.type === "payment" ? "text-green-400" : "text-blue-400"
                    )}>
                      {record.type === "payment" ? '+' : ''}{formatCurrency(record.amount)}
                    </p>
                    <Badge variant="outline" className={cn("text-xs capitalize", getStatusBadgeColor(record.status))}>
                      {record.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-records">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No financial records found.</p>
                <p className="text-sm mt-1">Invoices, payments, and commissions will appear here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matching" className="space-y-4 mt-4">
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Financial Matching
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Match orders with invoices, payments, and commissions. Click on an order to view and manage its financial flows.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders by code, name, or organization..."
                    value={matchingSearchQuery}
                    onChange={(e) => setMatchingSearchQuery(e.target.value)}
                    className="pl-9 bg-black/20 border-white/10 text-white"
                    data-testid="input-search-matching"
                  />
                </div>
                <Select value={matchingStatusFilter} onValueChange={setMatchingStatusFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-matching-status">
                    <SelectValue placeholder="All Match Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {matchingOrdersLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p>Loading orders...</p>
            </div>
          ) : filteredMatchingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="empty-matching-orders">
              <Link2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No orders found for financial matching.</p>
              <p className="text-sm mt-1">Orders from the past year will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatchingOrders.map(order => {
                const getMatchStatusIcon = (status: string) => {
                  switch (status) {
                    case 'matched': return <CheckCircle2 className="h-4 w-4 text-green-400" />;
                    case 'partial': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
                    default: return <Clock className="h-4 w-4 text-gray-400" />;
                  }
                };

                const getMatchStatusColor = (status: string) => {
                  switch (status) {
                    case 'matched': return 'bg-green-500/20 text-green-400 border-green-500/30';
                    case 'partial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                  }
                };

                return (
                  <Card 
                    key={order.id} 
                    className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedOrderForMatching(order)}
                    data-testid={`card-matching-order-${order.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <Link2 className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground" data-testid={`text-order-code-${order.id}`}>
                                {order.orderCode}
                              </h4>
                              <Badge variant="outline" className={cn("text-xs capitalize", getMatchStatusColor(order.financialSummary.matchStatus))}>
                                {getMatchStatusIcon(order.financialSummary.matchStatus)}
                                <span className="ml-1">{order.financialSummary.matchStatus}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{order.orderName}</span>
                              {order.organization && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {order.organization.name}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Invoices / Payments</p>
                            <p className="font-medium text-blue-400">
                              {order.financialSummary.invoiceCount} / {order.financialSummary.paymentCount}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Inflows</p>
                            <p className="font-medium text-green-400" data-testid={`text-inflows-${order.id}`}>
                              {formatCurrency(order.financialSummary.totalInflows)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Outflows</p>
                            <p className="font-medium text-red-400" data-testid={`text-outflows-${order.id}`}>
                              {formatCurrency(order.financialSummary.totalOutflows)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Net Cash Flow</p>
                            <p className={cn(
                              "font-bold",
                              order.financialSummary.netCashFlow >= 0 ? "text-green-400" : "text-red-400"
                            )} data-testid={`text-net-${order.id}`}>
                              {formatCurrency(order.financialSummary.netCashFlow)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForMatching(order);
                            }}
                            data-testid={`button-view-matching-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-invoices">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found.</p>
              </div>
            ) : (
              invoices.map(invoice => (
                <Card key={invoice.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-invoice-${invoice.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{invoice.invoiceNumber}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Issued: {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-400">{formatCurrency(invoice.totalAmount)}</p>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-muted-foreground">
                            Paid: {formatCurrency(invoice.amountPaid || 0)}
                          </span>
                          <Badge variant="outline" className={cn("text-xs capitalize", getStatusBadgeColor(invoice.status))}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-4">
          <div className="space-y-4">
            {invoicePayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-payments">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payments found.</p>
              </div>
            ) : (
              invoicePayments.map(payment => (
                <Card key={payment.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-payment-${payment.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{payment.paymentNumber}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 capitalize">
                              {payment.paymentMethod.replace('_', ' ')}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-400">+{formatCurrency(payment.amount)}</p>
                        {payment.referenceNumber && (
                          <span className="text-xs text-muted-foreground">
                            Ref: {payment.referenceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-4 mt-4">
          <div className="space-y-4">
            {commissionPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-commissions">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No commission payments found.</p>
              </div>
            ) : (
              commissionPayments.map(commission => (
                <Card key={commission.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-commission-${commission.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{commission.paymentNumber}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                              {commission.period}
                            </Badge>
                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 capitalize">
                              {commission.paymentMethod.replace('_', ' ')}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(commission.paymentDate), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-purple-400">{formatCurrency(commission.totalAmount)}</p>
                        {commission.referenceNumber && (
                          <span className="text-xs text-muted-foreground">
                            Ref: {commission.referenceNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedOrderForMatching && (
        <FinancialMatchingModal
          isOpen={!!selectedOrderForMatching}
          onClose={() => setSelectedOrderForMatching(null)}
          orderId={selectedOrderForMatching.id}
          orderName={selectedOrderForMatching.orderName}
          orderCode={selectedOrderForMatching.orderCode}
        />
      )}
    </div>
  );
}
