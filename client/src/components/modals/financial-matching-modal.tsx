import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, DollarSign, TrendingUp, TrendingDown, ArrowRight, X, Sparkles, Link2, Link2Off, Calculator, Zap, Lightbulb, CheckCircle2, Target } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface InflowItem {
  type: 'invoice' | 'payment' | 'custom';
  id: number;
  label: string;
  amount: number;
  date?: string;
}

interface OutflowItem {
  type: 'commission' | 'custom';
  id: number;
  label: string;
  amount: number;
  date?: string;
}

interface SmartSuggestion {
  inflow: InflowItem;
  outflow: OutflowItem;
  confidence: ConfidenceLevel;
  amountDifferencePercent: number;
  dateDifferenceInDays: number | null;
  matchReason: string;
}

function calculateMatchConfidence(
  inflowAmount: number,
  outflowAmount: number,
  inflowDate?: string,
  outflowDate?: string
): { confidence: ConfidenceLevel; amountDiff: number; dateDiff: number | null; reason: string } {
  const amountDiff = Math.abs(inflowAmount - outflowAmount) / Math.max(inflowAmount, outflowAmount) * 100;
  
  let dateDiff: number | null = null;
  if (inflowDate && outflowDate) {
    const date1 = new Date(inflowDate);
    const date2 = new Date(outflowDate);
    dateDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
  }

  if (amountDiff <= 1) {
    return { confidence: 'high', amountDiff, dateDiff, reason: 'Amount matches within 1%' };
  }
  
  if (amountDiff <= 5 || (dateDiff !== null && dateDiff <= 7)) {
    const reason = amountDiff <= 5 
      ? 'Amount matches within 5%' 
      : 'Dates within 7 days';
    return { confidence: 'medium', amountDiff, dateDiff, reason };
  }
  
  if (amountDiff <= 10 || (dateDiff !== null && dateDiff <= 30)) {
    const reason = amountDiff <= 10 
      ? 'Amount matches within 10%' 
      : 'Dates within 30 days';
    return { confidence: 'low', amountDiff, dateDiff, reason };
  }
  
  return { confidence: 'low', amountDiff, dateDiff, reason: 'Approximate match' };
}

function getConfidenceBadgeColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-500 text-white hover:bg-green-600';
    case 'medium':
      return 'bg-yellow-500 text-white hover:bg-yellow-600';
    case 'low':
      return 'bg-gray-400 text-white hover:bg-gray-500';
  }
}

function getConfidenceBorderColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'border-green-500/50 bg-green-50/30 dark:bg-green-950/30';
    case 'medium':
      return 'border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/30';
    case 'low':
      return 'border-gray-400/50 bg-gray-50/30 dark:bg-gray-950/30';
  }
}

interface FinancialMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderName: string;
  orderCode: string;
}

export function FinancialMatchingModal({
  isOpen,
  onClose,
  orderId,
  orderName,
  orderCode
}: FinancialMatchingModalProps) {
  const { toast } = useToast();
  const [showAssignInvoice, setShowAssignInvoice] = useState(false);
  const [showAssignCommission, setShowAssignCommission] = useState(false);
  const [showCreateInflow, setShowCreateInflow] = useState(false);
  const [showCreateOutflow, setShowCreateOutflow] = useState(false);
  
  // Custom entry form state
  const [customEntryForm, setCustomEntryForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    notes: ''
  });

  // Manual matching state
  const [showManualMatch, setShowManualMatch] = useState(false);
  const [matchingMode, setMatchingMode] = useState<'auto' | 'manual'>('auto');
  const [manualMatchForm, setManualMatchForm] = useState({
    inflowType: '' as 'invoice' | 'payment' | 'custom' | '',
    inflowId: null as number | null,
    outflowType: '' as 'commission' | 'custom' | '',
    outflowId: null as number | null,
    matchedAmount: '',
    notes: ''
  });

  // Fetch detailed financial data for this order
  const { data: financialData, isLoading } = useQuery<any>({
    queryKey: ['/api/financial-matching/order', orderId],
    enabled: isOpen,
  });

  // Fetch unassigned invoices
  const { data: unassignedInvoices = [] } = useQuery<any[]>({
    queryKey: ['/api/financial-matching/unassigned-invoices'],
    enabled: showAssignInvoice,
  });

  // Fetch unassigned commissions
  const { data: unassignedCommissions = [] } = useQuery<any[]>({
    queryKey: ['/api/financial-matching/unassigned-commissions'],
    enabled: showAssignCommission,
  });

  // Mutation to assign invoice
  const assignInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: number }) => {
      return await apiRequest('/api/financial-matching/assign-invoice', {
        method: 'PUT',
        body: { invoiceId, orderId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/unassigned-invoices'] });
      toast({
        title: "Invoice Assigned",
        description: "Invoice successfully assigned to order",
      });
      setShowAssignInvoice(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign invoice",
        variant: "destructive",
      });
    },
  });

  // Mutation to assign commission
  const assignCommissionMutation = useMutation({
    mutationFn: async ({ commissionId }: { commissionId: number }) => {
      return await apiRequest('/api/financial-matching/assign-commission', {
        method: 'PUT',
        body: { commissionId, orderId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/unassigned-commissions'] });
      toast({
        title: "Commission Assigned",
        description: "Commission successfully assigned to order",
      });
      setShowAssignCommission(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign commission",
        variant: "destructive",
      });
    },
  });

  // Mutation to unassign invoice
  const unassignInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: number }) => {
      return await apiRequest('/api/financial-matching/assign-invoice', {
        method: 'PUT',
        body: { invoiceId, orderId: null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Invoice Unassigned",
        description: "Invoice successfully removed from order",
      });
    },
  });

  // Mutation to unassign commission
  const unassignCommissionMutation = useMutation({
    mutationFn: async ({ commissionId }: { commissionId: number }) => {
      return await apiRequest('/api/financial-matching/assign-commission', {
        method: 'PUT',
        body: { commissionId, orderId: null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Commission Unassigned",
        description: "Commission successfully removed from order",
      });
    },
  });

  // Mutation to create custom financial entry
  const createCustomEntryMutation = useMutation({
    mutationFn: async ({ entryType }: { entryType: 'inflow' | 'outflow' }) => {
      return await apiRequest('/api/financial-matching/custom-entry', {
        method: 'POST',
        body: {
          orderId,
          entryType,
          ...customEntryForm
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Entry Added",
        description: "Custom financial entry successfully added",
      });
      setCustomEntryForm({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        notes: ''
      });
      setShowCreateInflow(false);
      setShowCreateOutflow(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create custom financial entry",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete custom financial entry
  const deleteCustomEntryMutation = useMutation({
    mutationFn: async ({ entryId }: { entryId: number }) => {
      return await apiRequest(`/api/financial-matching/custom-entry/${entryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Entry Deleted",
        description: "Custom financial entry successfully deleted",
      });
    },
  });

  // Auto-match mutation - analyzes and suggests optimal matching
  const autoMatchMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/financial-matching/auto-match', {
        method: 'POST',
        body: { orderId },
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Auto-Match Complete",
        description: data.message || "Financial records have been automatically matched",
      });
    },
    onError: () => {
      toast({
        title: "Auto-Match Info",
        description: "All items are already matched or no matching possible",
      });
    },
  });

  // Reset manual match form
  const resetManualMatchForm = () => {
    setManualMatchForm({
      inflowType: '',
      inflowId: null,
      outflowType: '',
      outflowId: null,
      matchedAmount: '',
      notes: ''
    });
  };

  // Manual match mutation
  const manualMatchMutation = useMutation({
    mutationFn: async () => {
      if (!manualMatchForm.inflowType || !manualMatchForm.inflowId || 
          !manualMatchForm.outflowType || !manualMatchForm.outflowId || 
          !manualMatchForm.matchedAmount) {
        throw new Error('Missing required fields');
      }
      
      const payload = {
        orderId,
        inflowType: manualMatchForm.inflowType,
        inflowId: Number(manualMatchForm.inflowId),
        outflowType: manualMatchForm.outflowType,
        outflowId: Number(manualMatchForm.outflowId),
        matchedAmount: parseFloat(manualMatchForm.matchedAmount),
        notes: manualMatchForm.notes || undefined
      };
      
      return await apiRequest('/api/financial-matching/manual-match', {
        method: 'POST',
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Match Created",
        description: "Manual match recorded successfully",
      });
      resetManualMatchForm();
      setShowManualMatch(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create manual match",
        variant: "destructive",
      });
    },
  });

  // Apply a single smart suggestion
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestion: SmartSuggestion) => {
      const matchedAmount = Math.min(suggestion.inflow.amount, suggestion.outflow.amount);
      const payload = {
        orderId,
        inflowType: suggestion.inflow.type,
        inflowId: suggestion.inflow.id,
        outflowType: suggestion.outflow.type,
        outflowId: suggestion.outflow.id,
        matchedAmount,
        notes: `Smart suggestion: ${suggestion.matchReason}`
      };
      
      return await apiRequest('/api/financial-matching/manual-match', {
        method: 'POST',
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
      toast({
        title: "Match Applied",
        description: "Suggestion applied successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply suggestion",
        variant: "destructive",
      });
    },
  });

  // Match all high confidence suggestions
  const [matchingAllHighConfidence, setMatchingAllHighConfidence] = useState(false);
  
  const matchAllHighConfidence = async () => {
    if (highConfidenceSuggestions.length === 0) {
      toast({
        title: "No Matches Available",
        description: "No high-confidence matches found to apply",
      });
      return;
    }

    setMatchingAllHighConfidence(true);
    let successCount = 0;
    let errorCount = 0;

    for (const suggestion of highConfidenceSuggestions) {
      try {
        const matchedAmount = Math.min(suggestion.inflow.amount, suggestion.outflow.amount);
        await apiRequest('/api/financial-matching/manual-match', {
          method: 'POST',
          body: {
            orderId,
            inflowType: suggestion.inflow.type,
            inflowId: suggestion.inflow.id,
            outflowType: suggestion.outflow.type,
            outflowId: suggestion.outflow.id,
            matchedAmount,
            notes: `Auto-matched (high confidence): ${suggestion.matchReason}`
          },
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['/api/financial-matching/orders'] });
    
    setMatchingAllHighConfidence(false);

    if (successCount > 0) {
      toast({
        title: "High Confidence Matches Applied",
        description: `Successfully applied ${successCount} match${successCount > 1 ? 'es' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      });
    } else if (errorCount > 0) {
      toast({
        title: "Error",
        description: "Failed to apply matches",
        variant: "destructive",
      });
    }
  };

  // Helper to get all available inflows for matching
  const getAvailableInflows = (): InflowItem[] => {
    if (!financialData) return [];
    const allInflows: InflowItem[] = [];
    
    if (financialData.inflows?.invoices) {
      financialData.inflows.invoices.forEach((inv: any) => {
        allInflows.push({ 
          type: 'invoice', 
          id: inv.id, 
          label: inv.invoiceNumber, 
          amount: parseFloat(inv.totalAmount) || 0,
          date: inv.issueDate
        });
      });
    }
    if (financialData.inflows?.payments) {
      financialData.inflows.payments.forEach((p: any) => {
        allInflows.push({ 
          type: 'payment', 
          id: p.id, 
          label: p.paymentNumber, 
          amount: parseFloat(p.amount) || 0,
          date: p.paymentDate
        });
      });
    }
    if (financialData.inflows?.customEntries) {
      financialData.inflows.customEntries.forEach((e: any) => {
        allInflows.push({ 
          type: 'custom', 
          id: e.id, 
          label: e.description, 
          amount: parseFloat(e.amount) || 0,
          date: e.date
        });
      });
    }
    return allInflows;
  };

  // Helper to get all available outflows for matching  
  const getAvailableOutflows = (): OutflowItem[] => {
    if (!financialData) return [];
    const allOutflows: OutflowItem[] = [];
    
    if (financialData.outflows?.commissions) {
      financialData.outflows.commissions.forEach((c: any) => {
        allOutflows.push({ 
          type: 'commission', 
          id: c.id, 
          label: `${c.commissionType} Commission`, 
          amount: parseFloat(c.commissionAmount) || 0,
          date: c.createdAt
        });
      });
    }
    if (financialData.outflows?.customEntries) {
      financialData.outflows.customEntries.forEach((e: any) => {
        allOutflows.push({ 
          type: 'custom', 
          id: e.id, 
          label: e.description, 
          amount: parseFloat(e.amount) || 0,
          date: e.date
        });
      });
    }
    return allOutflows;
  };

  // Generate smart suggestions by analyzing inflows and outflows
  const smartSuggestions = useMemo((): SmartSuggestion[] => {
    const inflows = getAvailableInflows();
    const outflows = getAvailableOutflows();
    const suggestions: SmartSuggestion[] = [];
    
    for (const inflow of inflows) {
      for (const outflow of outflows) {
        if (inflow.amount <= 0 || outflow.amount <= 0) continue;
        
        const { confidence, amountDiff, dateDiff, reason } = calculateMatchConfidence(
          inflow.amount, 
          outflow.amount, 
          inflow.date, 
          outflow.date
        );
        
        // Only suggest if amount within 10% or dates within 30 days
        const isAmountProximity = amountDiff <= 10;
        const isDateProximity = dateDiff !== null && dateDiff <= 30;
        
        if (isAmountProximity || isDateProximity) {
          suggestions.push({
            inflow,
            outflow,
            confidence,
            amountDifferencePercent: amountDiff,
            dateDifferenceInDays: dateDiff,
            matchReason: reason
          });
        }
      }
    }
    
    // Sort by confidence (high first) then by amount difference
    return suggestions.sort((a, b) => {
      const confidenceOrder = { high: 0, medium: 1, low: 2 };
      if (confidenceOrder[a.confidence] !== confidenceOrder[b.confidence]) {
        return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
      }
      return a.amountDifferencePercent - b.amountDifferencePercent;
    });
  }, [financialData]);

  const highConfidenceSuggestions = useMemo(() => {
    return smartSuggestions.filter(s => s.confidence === 'high');
  }, [smartSuggestions]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading || !financialData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]" data-testid="dialog-financial-matching">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading financial data...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { inflows, outflows, summary } = financialData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]" data-testid="dialog-financial-matching">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Financial Matching - {orderCode}</DialogTitle>
          <DialogDescription data-testid="text-order-name">{orderName}</DialogDescription>
        </DialogHeader>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card className="bg-green-50 dark:bg-green-950" data-testid="card-total-inflows">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Inflows</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300" data-testid="text-total-inflows">
                    {formatCurrency(summary.totalInflows)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950" data-testid="card-total-outflows">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Outflows</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300" data-testid="text-total-outflows">
                    {formatCurrency(summary.totalOutflows)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className={summary.netCashFlow >= 0 ? "bg-blue-50 dark:bg-blue-950" : "bg-orange-50 dark:bg-orange-950"} data-testid="card-net-cash-flow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`} data-testid="text-net-cash-flow">
                    {formatCurrency(summary.netCashFlow)}
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${summary.netCashFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matching Controls */}
        <Card className="mb-4 border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-700 dark:text-indigo-300">Financial Matching</h3>
                  <p className="text-sm text-muted-foreground">Match inflows with outflows</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="matching-mode" className="text-sm text-muted-foreground">Mode:</Label>
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg p-1">
                    <Button
                      variant={matchingMode === 'auto' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMatchingMode('auto')}
                      className="gap-1"
                      data-testid="button-auto-mode"
                    >
                      <Zap className="h-3 w-3" />
                      Auto
                    </Button>
                    <Button
                      variant={matchingMode === 'manual' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMatchingMode('manual')}
                      className="gap-1"
                      data-testid="button-manual-mode"
                    >
                      <Calculator className="h-3 w-3" />
                      Manual
                    </Button>
                  </div>
                </div>
                
                {matchingMode === 'auto' ? (
                  <Button
                    onClick={() => autoMatchMutation.mutate()}
                    disabled={autoMatchMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    data-testid="button-run-auto-match"
                  >
                    <Sparkles className="h-4 w-4" />
                    {autoMatchMutation.isPending ? 'Matching...' : 'Run Auto-Match'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowManualMatch(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    data-testid="button-create-manual-match"
                  >
                    <Plus className="h-4 w-4" />
                    Create Manual Match
                  </Button>
                )}
              </div>
            </div>

            {matchingMode === 'auto' && (
              <div className="mt-3 p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  Auto-match analyzes your inflows and outflows to suggest optimal matching based on amounts and dates.
                </p>
              </div>
            )}

            {matchingMode === 'manual' && (
              <div className="mt-3 p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  <Calculator className="h-4 w-4 inline mr-1" />
                  Manual mode lets you explicitly link specific inflow and outflow records with custom match amounts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Suggestions Section */}
        {smartSuggestions.length > 0 && (
          <Card className="mb-4 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30" data-testid="card-smart-suggestions">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg text-purple-700 dark:text-purple-300">Smart Suggestions</CardTitle>
                  <Badge variant="secondary" className="ml-2" data-testid="badge-suggestion-count">
                    {smartSuggestions.length} potential match{smartSuggestions.length > 1 ? 'es' : ''}
                  </Badge>
                </div>
                {highConfidenceSuggestions.length > 0 && (
                  <Badge className={getConfidenceBadgeColor('high')} data-testid="badge-high-confidence-count">
                    {highConfidenceSuggestions.length} high confidence
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-[200px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {smartSuggestions.slice(0, 6).map((suggestion, index) => (
                    <Card 
                      key={`${suggestion.inflow.type}-${suggestion.inflow.id}-${suggestion.outflow.type}-${suggestion.outflow.id}`} 
                      className={`border-2 ${getConfidenceBorderColor(suggestion.confidence)}`}
                      data-testid={`card-suggestion-${index}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Suggested Match</span>
                          <Badge 
                            className={`text-xs ${getConfidenceBadgeColor(suggestion.confidence)}`}
                            data-testid={`badge-confidence-${index}`}
                          >
                            {suggestion.confidence}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="text-xs truncate font-medium" data-testid={`text-suggestion-inflow-${index}`}>
                                {suggestion.inflow.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatCurrency(suggestion.inflow.amount)}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-red-500 flex-shrink-0" />
                              <span className="text-xs truncate font-medium" data-testid={`text-suggestion-outflow-${index}`}>
                                {suggestion.outflow.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatCurrency(suggestion.outflow.amount)}</p>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2" data-testid={`text-suggestion-reason-${index}`}>
                          {suggestion.matchReason}
                        </p>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs border-purple-500 text-purple-700 hover:bg-purple-100 dark:text-purple-300 dark:hover:bg-purple-900"
                          onClick={() => applySuggestionMutation.mutate(suggestion)}
                          disabled={applySuggestionMutation.isPending}
                          data-testid={`button-apply-suggestion-${index}`}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Apply Match
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {smartSuggestions.length > 6 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    +{smartSuggestions.length - 6} more suggestions available
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* INFLOWS COLUMN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Inflows (Money In)</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssignInvoice(true)}
                  className="border-green-600 text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-950"
                  data-testid="button-add-invoice"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Invoice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateInflow(true)}
                  className="border-green-600 text-green-700 hover:bg-green-50 dark:text-green-300 dark:hover:bg-green-950"
                  data-testid="button-add-custom-inflow"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Custom
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-3">
                {/* Invoice Opening Balances */}
                {inflows.invoices && inflows.invoices.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Invoice Opening Balances</p>
                    {inflows.invoices.map((invoice: any) => (
                      <Card key={invoice.id} className="mb-2" data-testid={`card-invoice-${invoice.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium" data-testid={`text-invoice-number-${invoice.id}`}>{invoice.invoiceNumber}</p>
                                <Badge variant="outline">{invoice.status}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Issued: {formatDate(invoice.issueDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-lg" data-testid={`text-invoice-amount-${invoice.id}`}>{formatCurrency(invoice.totalAmount)}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => unassignInvoiceMutation.mutate({ invoiceId: invoice.id })}
                                data-testid={`button-remove-invoice-${invoice.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Payments Received */}
                {inflows.payments && inflows.payments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Payments Received</p>
                    {inflows.payments.map((payment: any) => (
                      <Card key={payment.id} className="mb-2 bg-green-50 dark:bg-green-950" data-testid={`card-payment-${payment.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium" data-testid={`text-payment-number-${payment.id}`}>{payment.paymentNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                              </p>
                            </div>
                            <p className="font-bold text-green-700 dark:text-green-300" data-testid={`text-payment-amount-${payment.id}`}>
                              {formatCurrency(payment.amount)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Custom Inflows */}
                {inflows.customEntries && inflows.customEntries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Custom Inflows</p>
                    {inflows.customEntries.map((entry: any) => (
                      <Card key={entry.id} className="mb-2 bg-green-50 dark:bg-green-950" data-testid={`card-custom-inflow-${entry.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{entry.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(entry.date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-green-700 dark:text-green-300">
                                {formatCurrency(entry.amount)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCustomEntryMutation.mutate({ entryId: entry.id })}
                                data-testid={`button-remove-custom-inflow-${entry.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {(!inflows.invoices || inflows.invoices.length === 0) && (!inflows.payments || inflows.payments.length === 0) && (!inflows.customEntries || inflows.customEntries.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-inflows">
                    No inflows recorded yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* OUTFLOWS COLUMN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Outflows (Money Out)</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAssignCommission(true)}
                  className="border-red-600 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                  data-testid="button-add-outflow"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Commission
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCreateOutflow(true)}
                  className="border-red-600 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                  data-testid="button-add-custom-outflow"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Custom
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-3">
                {/* Commissions */}
                {outflows.commissions && outflows.commissions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Sales Commissions</p>
                    {outflows.commissions.map((commission: any) => (
                      <Card key={commission.id} className="mb-2 bg-red-50 dark:bg-red-950" data-testid={`card-commission-${commission.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium" data-testid={`text-commission-type-${commission.id}`}>{commission.commissionType}</p>
                                <Badge variant={commission.status === 'paid' ? 'default' : 'outline'}>
                                  {commission.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Rate: {parseFloat(commission.rate) * 100}% • Base: {formatCurrency(commission.baseAmount)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-red-700 dark:text-red-300" data-testid={`text-commission-amount-${commission.id}`}>
                                {formatCurrency(commission.commissionAmount)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => unassignCommissionMutation.mutate({ commissionId: commission.id })}
                                data-testid={`button-remove-commission-${commission.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Custom Outflows */}
                {outflows.customEntries && outflows.customEntries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Custom Outflows</p>
                    {outflows.customEntries.map((entry: any) => (
                      <Card key={entry.id} className="mb-2 bg-red-50 dark:bg-red-950" data-testid={`card-custom-outflow-${entry.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{entry.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(entry.date)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-red-700 dark:text-red-300">
                                {formatCurrency(entry.amount)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCustomEntryMutation.mutate({ entryId: entry.id })}
                                data-testid={`button-remove-custom-outflow-${entry.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {(!outflows.commissions || outflows.commissions.length === 0) && (!outflows.customEntries || outflows.customEntries.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-outflows">
                    No outflows recorded yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <Card className="mt-4 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/30" data-testid="card-quick-actions">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-700 dark:text-amber-300">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    {highConfidenceSuggestions.length > 0 
                      ? `${highConfidenceSuggestions.length} high-confidence match${highConfidenceSuggestions.length > 1 ? 'es' : ''} available`
                      : 'No high-confidence matches available'}
                  </p>
                </div>
              </div>
              <Button
                onClick={matchAllHighConfidence}
                disabled={highConfidenceSuggestions.length === 0 || matchingAllHighConfidence}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-testid="button-match-all-high-confidence"
              >
                <CheckCircle2 className="h-4 w-4" />
                {matchingAllHighConfidence 
                  ? 'Matching...' 
                  : `Match All High Confidence${highConfidenceSuggestions.length > 0 ? ` (${highConfidenceSuggestions.length})` : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Dialogs */}
        {showAssignInvoice && (
          <Dialog open={showAssignInvoice} onOpenChange={setShowAssignInvoice}>
            <DialogContent data-testid="dialog-assign-invoice">
              <DialogHeader>
                <DialogTitle>Assign Invoice to Order</DialogTitle>
                <DialogDescription>Select an unassigned invoice to link to this order</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {unassignedInvoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4" data-testid="text-no-unassigned-invoices">
                      No unassigned invoices available
                    </p>
                  ) : (
                    unassignedInvoices.map((invoice: any) => (
                      <Card key={invoice.id} className="cursor-pointer hover:bg-accent" onClick={() => assignInvoiceMutation.mutate({ invoiceId: invoice.id })} data-testid={`card-unassigned-invoice-${invoice.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {invoice.organization?.name 
                                  ? `${invoice.organization.name} - ${invoice.invoiceNumber}` 
                                  : invoice.invoiceNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">Issued: {formatDate(invoice.issueDate)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{formatCurrency(invoice.totalAmount)}</p>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        {showAssignCommission && (
          <Dialog open={showAssignCommission} onOpenChange={setShowAssignCommission}>
            <DialogContent data-testid="dialog-assign-commission">
              <DialogHeader>
                <DialogTitle>Assign Commission to Order</DialogTitle>
                <DialogDescription>Select an unassigned commission to link to this order</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {unassignedCommissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4" data-testid="text-no-unassigned-commissions">
                      No unassigned commissions available
                    </p>
                  ) : (
                    unassignedCommissions.map((commission: any) => (
                      <Card key={commission.id} className="cursor-pointer hover:bg-accent" onClick={() => assignCommissionMutation.mutate({ commissionId: commission.id })} data-testid={`card-unassigned-commission-${commission.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{commission.commissionType} Commission</p>
                              <p className="text-sm text-muted-foreground">
                                Rate: {parseFloat(commission.rate) * 100}% • Base: {formatCurrency(commission.baseAmount)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">{formatCurrency(commission.commissionAmount)}</p>
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Custom Inflow Dialog */}
        {showCreateInflow && (
          <Dialog open={showCreateInflow} onOpenChange={setShowCreateInflow}>
            <DialogContent data-testid="dialog-create-custom-inflow">
              <DialogHeader>
                <DialogTitle className="text-green-700 dark:text-green-300">Create Custom Inflow</DialogTitle>
                <DialogDescription>Add a custom inflow entry to this order</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inflow-description">Description *</Label>
                  <Input
                    id="inflow-description"
                    value={customEntryForm.description}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, description: e.target.value })}
                    placeholder="Enter description"
                    data-testid="input-custom-description"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inflow-amount">Amount *</Label>
                  <Input
                    id="inflow-amount"
                    type="number"
                    step="0.01"
                    value={customEntryForm.amount}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, amount: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-custom-amount"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inflow-date">Date</Label>
                  <Input
                    id="inflow-date"
                    type="date"
                    value={customEntryForm.date}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, date: e.target.value })}
                    data-testid="input-custom-date"
                  />
                </div>
                <div>
                  <Label htmlFor="inflow-category">Category</Label>
                  <Input
                    id="inflow-category"
                    value={customEntryForm.category}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, category: e.target.value })}
                    placeholder="Optional category"
                    data-testid="input-custom-category"
                  />
                </div>
                <div>
                  <Label htmlFor="inflow-notes">Notes</Label>
                  <Textarea
                    id="inflow-notes"
                    value={customEntryForm.notes}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, notes: e.target.value })}
                    placeholder="Optional notes"
                    data-testid="textarea-custom-notes"
                  />
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => createCustomEntryMutation.mutate({ entryType: 'inflow' })}
                  disabled={!customEntryForm.description || !customEntryForm.amount || createCustomEntryMutation.isPending}
                  data-testid="button-submit-custom-entry"
                >
                  {createCustomEntryMutation.isPending ? 'Adding...' : 'Add Inflow'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Custom Outflow Dialog */}
        {showCreateOutflow && (
          <Dialog open={showCreateOutflow} onOpenChange={setShowCreateOutflow}>
            <DialogContent data-testid="dialog-create-custom-outflow">
              <DialogHeader>
                <DialogTitle className="text-red-700 dark:text-red-300">Create Custom Outflow</DialogTitle>
                <DialogDescription>Add a custom outflow entry to this order</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="outflow-description">Description *</Label>
                  <Input
                    id="outflow-description"
                    value={customEntryForm.description}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, description: e.target.value })}
                    placeholder="Enter description"
                    data-testid="input-custom-description"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="outflow-amount">Amount *</Label>
                  <Input
                    id="outflow-amount"
                    type="number"
                    step="0.01"
                    value={customEntryForm.amount}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, amount: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-custom-amount"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="outflow-date">Date</Label>
                  <Input
                    id="outflow-date"
                    type="date"
                    value={customEntryForm.date}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, date: e.target.value })}
                    data-testid="input-custom-date"
                  />
                </div>
                <div>
                  <Label htmlFor="outflow-category">Category</Label>
                  <Input
                    id="outflow-category"
                    value={customEntryForm.category}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, category: e.target.value })}
                    placeholder="Optional category"
                    data-testid="input-custom-category"
                  />
                </div>
                <div>
                  <Label htmlFor="outflow-notes">Notes</Label>
                  <Textarea
                    id="outflow-notes"
                    value={customEntryForm.notes}
                    onChange={(e) => setCustomEntryForm({ ...customEntryForm, notes: e.target.value })}
                    placeholder="Optional notes"
                    data-testid="textarea-custom-notes"
                  />
                </div>
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => createCustomEntryMutation.mutate({ entryType: 'outflow' })}
                  disabled={!customEntryForm.description || !customEntryForm.amount || createCustomEntryMutation.isPending}
                  data-testid="button-submit-custom-entry"
                >
                  {createCustomEntryMutation.isPending ? 'Adding...' : 'Add Outflow'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Manual Match Dialog */}
        {showManualMatch && (
          <Dialog open={showManualMatch} onOpenChange={(open) => {
            setShowManualMatch(open);
            if (!open) resetManualMatchForm();
          }}>
            <DialogContent className="max-w-lg" data-testid="dialog-manual-match">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <Link2 className="h-5 w-5" />
                  Create Manual Match
                </DialogTitle>
                <DialogDescription>
                  Link a specific inflow with an outflow and specify the matched amount
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Select Inflow
                  </Label>
                  <Select 
                    value={manualMatchForm.inflowId ? `${manualMatchForm.inflowType}:${manualMatchForm.inflowId}` : ""}
                    onValueChange={(v) => {
                      const [type, id] = v.split(':');
                      const inflow = getAvailableInflows().find(i => i.type === type && i.id === parseInt(id));
                      setManualMatchForm({
                        ...manualMatchForm,
                        inflowType: type as any,
                        inflowId: parseInt(id),
                        matchedAmount: inflow?.amount?.toString() || manualMatchForm.matchedAmount
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-match-inflow">
                      <SelectValue placeholder="Select an inflow to match" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableInflows().length === 0 ? (
                        <SelectItem value="none" disabled>No inflows available</SelectItem>
                      ) : (
                        getAvailableInflows().map((inflow) => (
                          <SelectItem key={`${inflow.type}:${inflow.id}`} value={`${inflow.type}:${inflow.id}`}>
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">{inflow.type}</Badge>
                              {inflow.label} - {formatCurrency(inflow.amount)}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Select Outflow
                  </Label>
                  <Select 
                    value={manualMatchForm.outflowId ? `${manualMatchForm.outflowType}:${manualMatchForm.outflowId}` : ""}
                    onValueChange={(v) => {
                      const [type, id] = v.split(':');
                      setManualMatchForm({
                        ...manualMatchForm,
                        outflowType: type as any,
                        outflowId: parseInt(id)
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-match-outflow">
                      <SelectValue placeholder="Select an outflow to match" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableOutflows().length === 0 ? (
                        <SelectItem value="none" disabled>No outflows available</SelectItem>
                      ) : (
                        getAvailableOutflows().map((outflow) => (
                          <SelectItem key={`${outflow.type}:${outflow.id}`} value={`${outflow.type}:${outflow.id}`}>
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs capitalize">{outflow.type}</Badge>
                              {outflow.label} - {formatCurrency(outflow.amount)}
                            </span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="match-amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-500" />
                    Matched Amount
                  </Label>
                  <Input
                    id="match-amount"
                    type="number"
                    step="0.01"
                    value={manualMatchForm.matchedAmount}
                    onChange={(e) => setManualMatchForm({ ...manualMatchForm, matchedAmount: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-match-amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Amount applied from the inflow towards the outflow
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="match-notes">Notes (Optional)</Label>
                  <Textarea
                    id="match-notes"
                    value={manualMatchForm.notes}
                    onChange={(e) => setManualMatchForm({ ...manualMatchForm, notes: e.target.value })}
                    placeholder="Optional notes about this match..."
                    rows={2}
                    data-testid="textarea-match-notes"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowManualMatch(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    onClick={() => manualMatchMutation.mutate()}
                    disabled={
                      !manualMatchForm.inflowId || 
                      !manualMatchForm.outflowId || 
                      !manualMatchForm.matchedAmount ||
                      manualMatchMutation.isPending
                    }
                    data-testid="button-submit-manual-match"
                  >
                    <Link2 className="h-4 w-4" />
                    {manualMatchMutation.isPending ? 'Creating...' : 'Create Match'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
