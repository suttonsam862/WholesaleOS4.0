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
import { Textarea } from "@/components/ui/textarea";
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
  Clock,
  Sparkles,
  Calculator
} from "lucide-react";
import { FinancialMatchingModal } from "@/components/modals/financial-matching-modal";
import { 
  AmountSuggestionPanel, 
  CommissionBreakdown, 
  PaymentSuggestionPanel,
  type AmountSuggestion 
} from "@/components/shared/AmountSuggestionPanel";
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

// Extended payment types with related entity data
interface InvoicePaymentWithRelations extends InvoicePayment {
  invoice?: {
    id: number;
    invoiceNumber: string;
    orgId: number | null;
    totalAmount: string;
  };
  organization?: {
    id: number;
    name: string;
  };
}

interface CommissionPaymentWithRelations extends CommissionPayment {
  salesperson?: {
    id: string;
    firstName: string;
    lastName: string;
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

interface FinanceProps {
  defaultTab?: string;
  action?: string | null;
  statusFilter?: string | null;
}

export default function Finance({ defaultTab = "overview", action, statusFilter: initialStatusFilter }: FinanceProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "invoice" | "payment" | "commission">("all");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || "all");
  const [revenueSourceFilter, setRevenueSourceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(action === "new" && defaultTab === "invoices");
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(action === "new" && defaultTab === "payments");
  const [showCreateCommissionModal, setShowCreateCommissionModal] = useState(action === "new" && defaultTab === "commissions");
  const [showCreateExpenseModal, setShowCreateExpenseModal] = useState(action === "new" && defaultTab === "expenses");
  
  const [matchingSearchQuery, setMatchingSearchQuery] = useState("");
  const [matchingStatusFilter, setMatchingStatusFilter] = useState<string>("all");
  const [matchingOrgFilter, setMatchingOrgFilter] = useState<string>("all");
  const [matchingYearFilter, setMatchingYearFilter] = useState<string>("all");
  const [matchingSortBy, setMatchingSortBy] = useState<string>("newest");
  const [selectedOrderForMatching, setSelectedOrderForMatching] = useState<FinancialMatchingOrder | null>(null);

  // Form states
  const [invoiceForm, setInvoiceForm] = useState({
    orderId: null as number | null,
    orgId: null as number | null,
    subtotal: "",
    taxRate: "0",
    totalAmount: "",
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    paymentTerms: "Net 30",
    revenueSource: "order" as "order" | "team_store" | "other",
  });

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: null as number | null,
    amount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "check" as "cash" | "check" | "wire" | "ach" | "credit_card" | "other",
    referenceNumber: "",
  });

  const [commissionForm, setCommissionForm] = useState({
    salespersonId: "",
    totalAmount: "",
    period: new Date().toISOString().slice(0, 7), // YYYY-MM
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "direct_deposit" as "check" | "direct_deposit" | "wire" | "other",
    notes: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    orderId: null as number | null,
    type: "expense" as "expense" | "refund" | "fee",
    amount: "",
    description: "",
    category: "Operations",
    paymentMethod: "check",
    dueDate: "",
    notes: "",
  });

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
    queryKey: ["/api/invoices", revenueSourceFilter],
    queryFn: async () => {
      const params = revenueSourceFilter !== "all" ? `?revenueSource=${revenueSourceFilter}` : '';
      const response = await fetch(`/api/invoices${params}`, { credentials: 'include' });
      return response.ok ? response.json() : [];
    },
    retry: false,
  });

  const { data: invoicePayments = [], isLoading: paymentsLoading } = useQuery<InvoicePaymentWithRelations[]>({
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

  const { data: commissionPayments = [], isLoading: commissionsLoading } = useQuery<CommissionPaymentWithRelations[]>({
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

  // Additional queries for modals
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const response = await fetch('/api/orders', { credentials: 'include' });
      return response.ok ? response.json() : [];
    },
    retry: false,
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await fetch('/api/organizations', { credentials: 'include' });
      return response.ok ? response.json() : [];
    },
    retry: false,
  });

  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/salespeople"],
    queryFn: async () => {
      const response = await fetch('/api/salespeople', { credentials: 'include' });
      return response.ok ? response.json() : [];
    },
    retry: false,
  });

  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const response = await fetch('/api/quotes', { credentials: 'include' });
      return response.ok ? response.json() : [];
    },
    retry: false,
  });

  const { data: commissions = [] } = useQuery<any[]>({
    queryKey: ["/api/commissions"],
    queryFn: async () => {
      const response = await fetch('/api/commissions', { credentials: 'include' });
      return response.ok ? response.json() : [];
    },
    retry: false,
  });

  // Suggestion API queries for enhanced autofill
  const { data: invoiceSuggestions, isLoading: invoiceSuggestionsLoading } = useQuery<{
    suggestions: AmountSuggestion[];
    orderDetails?: { orderCode: string; orderName: string; totalAmount: string };
    orgDetails?: { name: string };
  }>({
    queryKey: ["/api/finance/suggestions/invoice", invoiceForm.orgId, invoiceForm.orderId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (invoiceForm.orgId) params.append('orgId', invoiceForm.orgId.toString());
      if (invoiceForm.orderId) params.append('orderId', invoiceForm.orderId.toString());
      const response = await fetch(`/api/finance/suggestions/invoice?${params.toString()}`, { credentials: 'include' });
      return response.ok ? response.json() : { suggestions: [] };
    },
    enabled: !!(invoiceForm.orgId || invoiceForm.orderId),
    retry: false,
  });

  const { data: commissionSuggestions, isLoading: commissionSuggestionsLoading } = useQuery<{
    summary: {
      totalSales: number;
      commissionRate: number;
      grossCommission: number;
      alreadyPaid: number;
      pendingApproval: number;
      suggestedPayment: number;
    };
    orderBreakdown: Array<{
      orderId: number;
      orderCode: string;
      orderName: string;
      amount: number;
      commission: number;
      createdAt: string | null;
    }>;
  }>({
    queryKey: ["/api/finance/suggestions/commission", commissionForm.salespersonId],
    queryFn: async () => {
      const response = await fetch(`/api/finance/suggestions/commission/${commissionForm.salespersonId}`, { credentials: 'include' });
      return response.ok ? response.json() : null;
    },
    enabled: !!commissionForm.salespersonId,
    retry: false,
  });

  const { data: paymentSuggestions, isLoading: paymentSuggestionsLoading } = useQuery<{
    invoice: {
      id: number;
      invoiceNumber: string;
      total: number;
      paid: number;
      outstanding: number;
      status: string;
    };
    suggestions: AmountSuggestion[];
    paymentHistory?: {
      paymentCount: number;
      totalPaid: number;
      preferredMethod: string;
      lastPaymentDate: string | null;
    };
  }>({
    queryKey: ["/api/finance/suggestions/payment", paymentForm.invoiceId],
    queryFn: async () => {
      const response = await fetch(`/api/finance/suggestions/payment/${paymentForm.invoiceId}`, { credentials: 'include' });
      return response.ok ? response.json() : null;
    },
    enabled: !!paymentForm.invoiceId,
    retry: false,
  });

  const { data: expenseSuggestions, isLoading: expenseSuggestionsLoading } = useQuery<{
    suggestions: AmountSuggestion[];
    orderDetails?: { orderCode: string; orderName: string; totalAmount: string };
  }>({
    queryKey: ["/api/finance/suggestions/expense", expenseForm.orderId],
    queryFn: async () => {
      const response = await fetch(`/api/finance/suggestions/expense/${expenseForm.orderId}`, { credentials: 'include' });
      return response.ok ? response.json() : { suggestions: [] };
    },
    enabled: !!expenseForm.orderId,
    retry: false,
  });

  const getAutoTotalOptions = (): AmountSuggestion[] => {
    // Use API suggestions if available
    if (invoiceSuggestions?.suggestions && invoiceSuggestions.suggestions.length > 0) {
      return invoiceSuggestions.suggestions;
    }
    
    // Fallback to existing local logic
    const options: AmountSuggestion[] = [];
    
    if (invoiceForm.orderId) {
      const order = orders.find((o: any) => o.id === invoiceForm.orderId);
      if (order?.totalAmount) {
        options.push({
          label: `Order Total: $${parseFloat(order.totalAmount).toFixed(2)}`,
          value: order.totalAmount,
          source: 'order',
          confidence: 'high'
        });
      }
      
      const orderQuotes = quotes.filter((q: any) => q.orgId === order?.orgId && q.status === 'accepted');
      orderQuotes.forEach((q: any) => {
        if (q.total) {
          options.push({
            label: `Quote ${q.quoteCode}: $${parseFloat(q.total).toFixed(2)}`,
            value: q.total,
            source: 'quote',
            confidence: 'medium'
          });
        }
      });
    }
    
    if (invoiceForm.orgId) {
      const orgQuotes = quotes.filter((q: any) => q.orgId === invoiceForm.orgId && q.status === 'accepted');
      orgQuotes.forEach((q: any) => {
        if (q.total && !options.find(o => o.value === q.total && o.source === 'quote')) {
          options.push({
            label: `Quote ${q.quoteCode}: $${parseFloat(q.total).toFixed(2)}`,
            value: q.total,
            source: 'quote',
            confidence: 'medium'
          });
        }
      });
      
      const orgOrders = orders.filter((o: any) => o.orgId === invoiceForm.orgId);
      orgOrders.forEach((o: any) => {
        if (o.totalAmount && !options.find(opt => opt.value === o.totalAmount && opt.source === 'order')) {
          options.push({
            label: `Order ${o.orderCode}: $${parseFloat(o.totalAmount).toFixed(2)}`,
            value: o.totalAmount,
            source: 'order',
            confidence: 'medium'
          });
        }
      });
    }
    
    return options;
  };

  const getPaymentAutofillAmount = () => {
    // Use API suggestions if available
    if (paymentSuggestions?.invoice) {
      return paymentSuggestions.invoice.outstanding;
    }
    
    // Fallback to existing local logic
    if (!paymentForm.invoiceId) return null;
    const invoice = invoices.find(inv => inv.id === paymentForm.invoiceId);
    if (!invoice) return null;
    return invoice.amountDue || invoice.totalAmount;
  };

  const getPendingCommissions = () => {
    // Use API suggestions if available
    if (commissionSuggestions?.summary) {
      return [{
        id: 'suggested',
        totalAmount: commissionSuggestions.summary.suggestedPayment.toFixed(2),
        period: commissionForm.period,
        status: 'pending'
      }];
    }
    
    // Fallback to existing local logic
    if (!commissionForm.salespersonId) return [];
    return commissions.filter((c: any) => 
      c.salespersonId === commissionForm.salespersonId && 
      c.status === 'pending'
    );
  };
  
  const handleInvoiceSuggestionSelect = (value: string, details?: Record<string, any>) => {
    const subtotal = value;
    const taxRate = parseFloat(invoiceForm.taxRate) || 0;
    const total = (parseFloat(subtotal) * (1 + taxRate / 100)).toFixed(2);
    setInvoiceForm({ ...invoiceForm, subtotal, totalAmount: total });
  };

  const handlePaymentSuggestionSelect = (value: string) => {
    setPaymentForm({ ...paymentForm, amount: value });
  };

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentForm({ ...paymentForm, paymentMethod: method as any });
  };

  const handleCommissionAmountSelect = (value: string) => {
    setCommissionForm({ ...commissionForm, totalAmount: value });
  };

  const handleExpenseSuggestionSelect = (value: string, details?: Record<string, any>) => {
    const categoryMap: Record<string, string> = {
      'cogs': 'Operations',
      'shipping': 'Travel',
      'commission': 'Payroll'
    };
    
    const category = details?.type ? (categoryMap[details.type] || expenseForm.category) : expenseForm.category;
    const description = details?.label || expenseForm.description;
    
    setExpenseForm({
      ...expenseForm,
      amount: value,
      category,
      description
    });
  };

  // Mutations for creating financial data
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        orderId: data.orderId || null,
        orgId: data.orgId || null,
        subtotal: data.subtotal || "0",
        taxRate: data.taxRate || "0",
        taxAmount: ((parseFloat(data.subtotal) || 0) * (parseFloat(data.taxRate) || 0) / 100).toFixed(2),
        totalAmount: data.totalAmount || "0",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paymentTerms: data.paymentTerms,
        revenueSource: data.revenueSource || "order",
        status: "draft",
      };
      return apiRequest("/api/invoices", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/overview"] });
      toast({ title: "Invoice Created", description: "The invoice has been created successfully." });
      setShowCreateInvoiceModal(false);
      resetInvoiceForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create invoice.", variant: "destructive" });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        invoiceId: data.invoiceId,
        amount: data.amount || "0",
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
      };
      return apiRequest("/api/invoice-payments", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/overview"] });
      toast({ title: "Payment Recorded", description: "The payment has been recorded successfully." });
      setShowCreatePaymentModal(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record payment.", variant: "destructive" });
    },
  });

  const createCommissionMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        salespersonId: data.salespersonId,
        totalAmount: data.totalAmount || "0",
        period: data.period,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
      };
      return apiRequest("/api/commission-payments", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/commission-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/overview"] });
      toast({ title: "Commission Payment Recorded", description: "The commission payment has been recorded successfully." });
      setShowCreateCommissionModal(false);
      resetCommissionForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record commission payment.", variant: "destructive" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        type: data.type,
        amount: data.amount || "0",
        description: data.description || null,
        category: data.category || null,
        paymentMethod: data.paymentMethod || null,
        dueDate: data.dueDate || null,
        notes: data.notes || null,
        status: "completed",
      };
      return apiRequest("/api/financial/transactions", { method: "POST", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial/overview"] });
      toast({ title: "Expense Recorded", description: "The expense has been recorded successfully." });
      setShowCreateExpenseModal(false);
      resetExpenseForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to record expense.", variant: "destructive" });
    },
  });

  // Reset form functions
  const resetInvoiceForm = () => {
    setInvoiceForm({
      orderId: null, orgId: null, subtotal: "", taxRate: "0", totalAmount: "",
      issueDate: new Date().toISOString().split('T')[0], dueDate: "", paymentTerms: "Net 30",
      revenueSource: "order",
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      invoiceId: null, amount: "", paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "check", referenceNumber: "",
    });
  };

  const resetCommissionForm = () => {
    setCommissionForm({
      salespersonId: "", totalAmount: "", period: new Date().toISOString().slice(0, 7),
      paymentDate: new Date().toISOString().split('T')[0], paymentMethod: "direct_deposit", notes: "",
    });
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      orderId: null, type: "expense", amount: "", description: "", category: "Operations",
      paymentMethod: "check", dueDate: "", notes: "",
    });
  };

  const uniqueOrganizations = Array.from(
    new Map(
      matchingOrders
        .filter(o => o.organization)
        .map(o => [o.organization!.id, o.organization!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const uniqueYears = Array.from(
    new Set(
      matchingOrders
        .filter(o => o.createdAt)
        .map(o => new Date(o.createdAt).getFullYear())
    )
  ).sort((a, b) => b - a);

  const filteredMatchingOrders = matchingOrders
    .filter(order => {
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
      
      if (matchingOrgFilter !== "all" && String(order.orgId) !== matchingOrgFilter) {
        return false;
      }
      
      if (matchingYearFilter !== "all" && order.createdAt) {
        const orderYear = new Date(order.createdAt).getFullYear();
        if (String(orderYear) !== matchingYearFilter) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (matchingSortBy) {
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "highest_net":
          return b.financialSummary.netCashFlow - a.financialSummary.netCashFlow;
        case "lowest_net":
          return a.financialSummary.netCashFlow - b.financialSummary.netCashFlow;
        case "code_asc":
          return (a.orderCode || '').localeCompare(b.orderCode || '');
        case "code_desc":
          return (b.orderCode || '').localeCompare(a.orderCode || '');
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
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

  // Anomaly Detection Calculations
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const today = new Date();

  // Unmatched Orders: Orders without invoices that are >30 days old
  const unmatchedOrders = matchingOrders.filter(order => {
    const isUnmatched = order.financialSummary.matchStatus === 'unmatched' || order.financialSummary.invoiceCount === 0;
    const orderDate = order.createdAt ? new Date(order.createdAt) : null;
    const isOldEnough = orderDate && orderDate < thirtyDaysAgo;
    return isUnmatched && isOldEnough;
  });

  // Overdue Invoices: Invoices past due date with outstanding balance
  const overdueInvoices = invoices.filter(inv => {
    const isOverdue = inv.status === 'overdue';
    const hasDueDate = inv.dueDate ? new Date(inv.dueDate) < today : false;
    const hasOutstanding = Number(inv.amountDue || 0) > 0;
    return isOverdue || (hasDueDate && hasOutstanding);
  });

  // Pending Commissions: Commissions unpaid for >60 days
  const pendingCommissionsOld = commissions.filter((comm: any) => {
    const isPending = comm.status === 'pending';
    const commDate = comm.createdAt ? new Date(comm.createdAt) : null;
    const isOldEnough = commDate && commDate < sixtyDaysAgo;
    return isPending && isOldEnough;
  });

  const totalAnomalies = unmatchedOrders.length + overdueInvoices.length + pendingCommissionsOld.length;

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
    <div className="p-6 pb-32 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80">
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
          <TabsTrigger value="overview" data-testid="tab-overview" className="relative">
            All Records
            {totalAnomalies > 0 && (
              <Badge 
                className="ml-2 h-5 min-w-5 px-1.5 bg-red-500 text-white text-xs rounded-full" 
                data-testid="badge-anomaly-count"
              >
                {totalAnomalies}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="matching" data-testid="tab-matching">
            <Link2 className="h-4 w-4 mr-2" />
            Financial Matching ({matchingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments ({invoicePayments.length})</TabsTrigger>
          <TabsTrigger value="commissions" data-testid="tab-commissions">Commissions ({commissionPayments.length})</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">
            <Receipt className="h-4 w-4 mr-2" />
            Expenses
          </TabsTrigger>
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

          {/* Anomaly Detection Section */}
          {totalAnomalies > 0 && (
            <Card className="glass-card border-orange-500/30 bg-orange-500/5" data-testid="panel-anomaly-detection">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-400">
                  <AlertCircle className="h-5 w-5" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {unmatchedOrders.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20" data-testid="anomaly-unmatched-orders">
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-orange-300">Unmatched Orders</p>
                      <p className="text-sm text-orange-400/80">{unmatchedOrders.length} order{unmatchedOrders.length !== 1 ? 's' : ''} without invoices (older than 30 days)</p>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{unmatchedOrders.length}</Badge>
                  </div>
                )}
                {overdueInvoices.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20" data-testid="anomaly-overdue-invoices">
                    <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-yellow-300">Overdue Invoices</p>
                      <p className="text-sm text-yellow-400/80">{overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''} past due date with outstanding balance</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{overdueInvoices.length}</Badge>
                  </div>
                )}
                {pendingCommissionsOld.length > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20" data-testid="anomaly-pending-commissions">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-amber-300">Pending Commissions</p>
                      <p className="text-sm text-amber-400/80">{pendingCommissionsOld.length} commission{pendingCommissionsOld.length !== 1 ? 's' : ''} unpaid for more than 60 days</p>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{pendingCommissionsOld.length}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions Section */}
          <Card className="glass-card border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 hover:bg-white/10"
                  onClick={() => {
                    setActiveTab("matching");
                    setMatchingStatusFilter("unmatched");
                  }}
                  data-testid="button-quick-action-view-unmatched"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  View Unmatched
                  {unmatchedOrders.length > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-orange-500/20 text-orange-400 text-xs">{unmatchedOrders.length}</Badge>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 hover:bg-white/10 opacity-50 cursor-not-allowed"
                  disabled
                  title="Coming soon: Send payment reminders to clients with overdue invoices"
                  data-testid="button-quick-action-send-reminders"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Send Reminders
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 hover:bg-white/10"
                  onClick={() => {
                    setActiveTab("commissions");
                    setStatusFilter("pending");
                  }}
                  data-testid="button-quick-action-process-commissions"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Process Commissions
                  {pendingCommissionsOld.length > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-amber-500/20 text-amber-400 text-xs">{pendingCommissionsOld.length}</Badge>
                  )}
                </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="relative md:col-span-2 lg:col-span-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={matchingSearchQuery}
                    onChange={(e) => setMatchingSearchQuery(e.target.value)}
                    className="pl-9 bg-black/20 border-white/10 text-white"
                    data-testid="input-search-matching"
                  />
                </div>
                <Select value={matchingStatusFilter} onValueChange={setMatchingStatusFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-matching-status">
                    <SelectValue placeholder="Match Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unmatched">Unmatched</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={matchingOrgFilter} onValueChange={setMatchingOrgFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-matching-org">
                    <SelectValue placeholder="Organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {uniqueOrganizations.map(org => (
                      <SelectItem key={org.id} value={String(org.id)}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={matchingYearFilter} onValueChange={setMatchingYearFilter}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-matching-year">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {uniqueYears.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={matchingSortBy} onValueChange={setMatchingSortBy}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-matching-sort">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest_net">Highest Net Cash Flow</SelectItem>
                    <SelectItem value="lowest_net">Lowest Net Cash Flow</SelectItem>
                    <SelectItem value="code_asc">Order Code (A-Z)</SelectItem>
                    <SelectItem value="code_desc">Order Code (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredMatchingOrders.length} of {matchingOrders.length} orders
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
              <p className="text-sm mt-1">All orders in the system will appear here for financial matching.</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Invoices</h3>
            <div className="flex items-center gap-2">
              <Select value={revenueSourceFilter} onValueChange={setRevenueSourceFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-revenue-source-filter">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="order">Regular Orders</SelectItem>
                  <SelectItem value="team_store">Team Stores</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateInvoiceModal(true)} className="gap-2" data-testid="button-add-invoice">
                <Plus className="h-4 w-4" /> Add Invoice
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-invoices">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices found.</p>
              </div>
            ) : (
              invoices.map((invoice: any) => (
                <Card key={invoice.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-invoice-${invoice.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">
                              {invoice.organization?.name || invoice.invoiceNumber}
                            </h4>
                            {invoice.revenueSource && invoice.revenueSource !== 'order' && (
                              <Badge variant="secondary" className={cn(
                                "text-xs capitalize",
                                invoice.revenueSource === 'team_store' ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"
                              )} data-testid={`badge-revenue-source-${invoice.id}`}>
                                {invoice.revenueSource === 'team_store' ? 'Team Store' : invoice.revenueSource}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-xs">{invoice.invoiceNumber}</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Invoice Payments</h3>
            <Button onClick={() => setShowCreatePaymentModal(true)} className="gap-2" data-testid="button-add-payment">
              <Plus className="h-4 w-4" /> Add Payment
            </Button>
          </div>
          <div className="space-y-4">
            {invoicePayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-payments">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payments found.</p>
              </div>
            ) : (
              invoicePayments.map((payment) => (
                <Card key={payment.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-payment-${payment.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {payment.organization?.name || payment.paymentNumber}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-xs">{payment.paymentNumber}</span>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Commission Payments</h3>
            <Button onClick={() => setShowCreateCommissionModal(true)} className="gap-2" data-testid="button-add-commission">
              <Plus className="h-4 w-4" /> Add Commission Payment
            </Button>
          </div>
          <div className="space-y-4">
            {commissionPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-commissions">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No commission payments found.</p>
              </div>
            ) : (
              commissionPayments.map((commission) => (
                <Card key={commission.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-commission-${commission.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {commission.salesperson?.firstName && commission.salesperson?.lastName
                              ? `${commission.salesperson.firstName} ${commission.salesperson.lastName}`
                              : commission.paymentNumber}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-xs">{commission.paymentNumber}</span>
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

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Expenses & Transactions</h3>
            <Button onClick={() => setShowCreateExpenseModal(true)} className="gap-2" data-testid="button-add-expense">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </div>
          <div className="text-center py-12 text-muted-foreground" data-testid="empty-expenses">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Add Expense" to record expenses, refunds, or fees.</p>
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

      {/* Create Invoice Modal */}
      <Dialog open={showCreateInvoiceModal} onOpenChange={setShowCreateInvoiceModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Create a new invoice for an order or organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order (Optional)</Label>
                <Select value={invoiceForm.orderId?.toString() || ""} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, orderId: v ? parseInt(v) : null })}>
                  <SelectTrigger data-testid="select-invoice-order">
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order: any) => (
                      <SelectItem key={order.id} value={order.id.toString()}>{order.orderCode} - {order.orderName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Organization (Optional)</Label>
                <Select value={invoiceForm.orgId?.toString() || ""} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, orgId: v ? parseInt(v) : null })}>
                  <SelectTrigger data-testid="select-invoice-org">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org: any) => (
                      <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(invoiceForm.orgId || invoiceForm.orderId) && (
              <AmountSuggestionPanel
                suggestions={getAutoTotalOptions()}
                onSelect={handleInvoiceSuggestionSelect}
                isLoading={invoiceSuggestionsLoading}
                title="Auto-fill from Order/Quote"
                maxVisible={3}
                showConfidence={true}
                className="mt-2"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <Input type="number" step="0.01" value={invoiceForm.subtotal} onChange={(e) => {
                  const subtotal = e.target.value;
                  const taxRate = parseFloat(invoiceForm.taxRate) || 0;
                  const total = (parseFloat(subtotal) * (1 + taxRate / 100)).toFixed(2);
                  setInvoiceForm({ ...invoiceForm, subtotal, totalAmount: total });
                }} placeholder="0.00" data-testid="input-invoice-subtotal" />
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" step="0.01" value={invoiceForm.taxRate} onChange={(e) => {
                  const taxRate = e.target.value;
                  const subtotal = parseFloat(invoiceForm.subtotal) || 0;
                  const total = (subtotal * (1 + parseFloat(taxRate) / 100)).toFixed(2);
                  setInvoiceForm({ ...invoiceForm, taxRate, totalAmount: total });
                }} placeholder="0" data-testid="input-invoice-tax" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input type="number" step="0.01" value={invoiceForm.totalAmount} onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: e.target.value })} placeholder="0.00" data-testid="input-invoice-total" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={invoiceForm.issueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })} data-testid="input-invoice-issue-date" />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} data-testid="input-invoice-due-date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={invoiceForm.paymentTerms} onValueChange={(v) => setInvoiceForm({ ...invoiceForm, paymentTerms: v })}>
                  <SelectTrigger data-testid="select-invoice-terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on receipt">Due on receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Revenue Source</Label>
                <Select value={invoiceForm.revenueSource} onValueChange={(v: "order" | "team_store" | "other") => setInvoiceForm({ ...invoiceForm, revenueSource: v })}>
                  <SelectTrigger data-testid="select-invoice-revenue-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">Regular Order</SelectItem>
                    <SelectItem value="team_store">Team Store</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateInvoiceModal(false)}>Cancel</Button>
            <Button onClick={() => createInvoiceMutation.mutate(invoiceForm)} disabled={createInvoiceMutation.isPending || !invoiceForm.subtotal || !invoiceForm.totalAmount || !invoiceForm.issueDate || !invoiceForm.dueDate} data-testid="button-submit-invoice">
              {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Modal */}
      <Dialog open={showCreatePaymentModal} onOpenChange={setShowCreatePaymentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment received against an invoice.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Select 
                value={paymentForm.invoiceId?.toString() || ""} 
                onValueChange={(v) => {
                  const invoiceId = v ? parseInt(v) : null;
                  const selectedInvoice = invoices.find(inv => inv.id === invoiceId);
                  const autofillAmount = selectedInvoice?.amountDue || selectedInvoice?.totalAmount || "";
                  setPaymentForm({ 
                    ...paymentForm, 
                    invoiceId,
                    amount: autofillAmount ? autofillAmount.toString() : paymentForm.amount 
                  });
                }}
              >
                <SelectTrigger data-testid="select-payment-invoice">
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(inv => inv.status !== 'paid').map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id.toString()}>
                      {invoice.invoiceNumber} - {formatCurrency(invoice.totalAmount)} (Due: {formatCurrency(Number(invoice.amountDue) || 0)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {paymentForm.invoiceId && (paymentSuggestions?.invoice || getPaymentAutofillAmount()) && (
              <PaymentSuggestionPanel
                invoice={paymentSuggestions?.invoice || {
                  id: paymentForm.invoiceId,
                  invoiceNumber: invoices.find(inv => inv.id === paymentForm.invoiceId)?.invoiceNumber || '',
                  total: Number(invoices.find(inv => inv.id === paymentForm.invoiceId)?.totalAmount || 0),
                  paid: Number(invoices.find(inv => inv.id === paymentForm.invoiceId)?.amountPaid || 0),
                  outstanding: Number(getPaymentAutofillAmount() || 0),
                  status: invoices.find(inv => inv.id === paymentForm.invoiceId)?.status || 'draft'
                }}
                suggestions={paymentSuggestions?.suggestions || [
                  {
                    label: `Full Balance: ${formatCurrency(getPaymentAutofillAmount() || 0)}`,
                    value: (getPaymentAutofillAmount() || 0).toString(),
                    source: 'outstanding' as const,
                    confidence: 'high' as const
                  }
                ]}
                paymentHistory={paymentSuggestions?.paymentHistory}
                onSelectAmount={handlePaymentSuggestionSelect}
                onSelectMethod={handlePaymentMethodSelect}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.00" data-testid="input-payment-amount" />
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} data-testid="input-payment-date" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(v: any) => setPaymentForm({ ...paymentForm, paymentMethod: v })}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                    <SelectItem value="ach">ACH</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} placeholder="Check #, Trans ID, etc." data-testid="input-payment-reference" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePaymentModal(false)}>Cancel</Button>
            <Button onClick={() => createPaymentMutation.mutate(paymentForm)} disabled={createPaymentMutation.isPending || !paymentForm.invoiceId || !paymentForm.amount || !paymentForm.paymentDate} data-testid="button-submit-payment">
              {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Commission Modal */}
      <Dialog open={showCreateCommissionModal} onOpenChange={setShowCreateCommissionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Commission Payment</DialogTitle>
            <DialogDescription>Record a commission payment to a salesperson.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Salesperson</Label>
              <Select value={commissionForm.salespersonId} onValueChange={(v) => setCommissionForm({ ...commissionForm, salespersonId: v })}>
                <SelectTrigger data-testid="select-commission-salesperson">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespeople.map((sp: any) => (
                    <SelectItem key={sp.id} value={sp.userId || sp.id.toString()}>
                      {sp.userName || sp.userEmail || `Salesperson ${sp.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {commissionForm.salespersonId && (commissionSuggestions?.summary || getPendingCommissions().length > 0) && (
              commissionSuggestions?.summary ? (
                <CommissionBreakdown
                  summary={commissionSuggestions.summary}
                  orderBreakdown={commissionSuggestions.orderBreakdown}
                  onSelectAmount={handleCommissionAmountSelect}
                />
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Pending Commissions to Pay
                  </Label>
                  <Select 
                    onValueChange={(value) => {
                      const commission = getPendingCommissions().find((c: any) => c.id.toString() === value);
                      if (commission) {
                        setCommissionForm({
                          ...commissionForm,
                          totalAmount: commission.totalAmount?.toString() || "",
                          period: commission.period || commissionForm.period,
                        });
                      }
                    }}
                  >
                    <SelectTrigger data-testid="select-commission-autofill">
                      <SelectValue placeholder="Select pending commission to pay" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPendingCommissions().map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          <span className="flex items-center gap-2">
                            <Calculator className="h-3 w-3" />
                            {c.period}: {formatCurrency(c.totalAmount)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select to auto-fill amount from pending commission records
                  </p>
                </div>
              )
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={commissionForm.totalAmount} onChange={(e) => setCommissionForm({ ...commissionForm, totalAmount: e.target.value })} placeholder="0.00" data-testid="input-commission-amount" />
              </div>
              <div className="space-y-2">
                <Label>Period (Month)</Label>
                <Input type="month" value={commissionForm.period} onChange={(e) => setCommissionForm({ ...commissionForm, period: e.target.value })} data-testid="input-commission-period" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" value={commissionForm.paymentDate} onChange={(e) => setCommissionForm({ ...commissionForm, paymentDate: e.target.value })} data-testid="input-commission-date" />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={commissionForm.paymentMethod} onValueChange={(v: any) => setCommissionForm({ ...commissionForm, paymentMethod: v })}>
                  <SelectTrigger data-testid="select-commission-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea value={commissionForm.notes} onChange={(e) => setCommissionForm({ ...commissionForm, notes: e.target.value })} placeholder="Any additional notes..." data-testid="input-commission-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCommissionModal(false)}>Cancel</Button>
            <Button onClick={() => createCommissionMutation.mutate(commissionForm)} disabled={createCommissionMutation.isPending || !commissionForm.salespersonId || !commissionForm.totalAmount || !commissionForm.period || !commissionForm.paymentDate} data-testid="button-submit-commission">
              {createCommissionMutation.isPending ? "Recording..." : "Record Commission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Expense Modal */}
      <Dialog open={showCreateExpenseModal} onOpenChange={setShowCreateExpenseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Expense</DialogTitle>
            <DialogDescription>Record an expense, refund, or fee transaction.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Link to Order (Optional)</Label>
              <Select 
                value={expenseForm.orderId?.toString() || ""} 
                onValueChange={(v) => setExpenseForm({ ...expenseForm, orderId: v ? parseInt(v) : null })}
              >
                <SelectTrigger data-testid="select-expense-order">
                  <SelectValue placeholder="Select order to link expense" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order: any) => (
                    <SelectItem key={order.id} value={order.id.toString()}>
                      {order.orderCode} - {order.orderName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {expenseForm.orderId && (
              <AmountSuggestionPanel
                suggestions={expenseSuggestions?.suggestions || []}
                onSelect={handleExpenseSuggestionSelect}
                isLoading={expenseSuggestionsLoading}
                title="Expense Suggestions"
                data-testid="panel-expense-suggestions"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={expenseForm.type} onValueChange={(v: any) => setExpenseForm({ ...expenseForm, type: v })}>
                  <SelectTrigger data-testid="select-expense-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" data-testid="input-expense-amount" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Brief description..." data-testid="input-expense-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger data-testid="select-expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Input value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })} placeholder="Check, Card, etc." data-testid="input-expense-method" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Input type="date" value={expenseForm.dueDate} onChange={(e) => setExpenseForm({ ...expenseForm, dueDate: e.target.value })} data-testid="input-expense-due-date" />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} placeholder="Any additional notes..." data-testid="input-expense-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateExpenseModal(false)}>Cancel</Button>
            <Button onClick={() => createExpenseMutation.mutate(expenseForm)} disabled={createExpenseMutation.isPending || !expenseForm.amount} data-testid="button-submit-expense">
              {createExpenseMutation.isPending ? "Recording..." : "Record Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
