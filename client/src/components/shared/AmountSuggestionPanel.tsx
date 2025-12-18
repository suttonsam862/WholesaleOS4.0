import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, TrendingUp, FileText, Receipt, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AmountSuggestion {
  label: string;
  value: string;
  source?: 'order' | 'quote' | 'outstanding';
  confidence: 'high' | 'medium' | 'low';
  details?: Record<string, any>;
}

interface AmountSuggestionPanelProps {
  suggestions: AmountSuggestion[];
  onSelect: (value: string, details?: Record<string, any>) => void;
  isLoading?: boolean;
  title?: string;
  maxVisible?: number;
  showConfidence?: boolean;
  className?: string;
}

export function AmountSuggestionPanel({
  suggestions,
  onSelect,
  isLoading = false,
  title = "Smart Suggestions",
  maxVisible = 3,
  showConfidence = true,
  className
}: AmountSuggestionPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className={cn("border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm">Finding suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = expanded ? suggestions : suggestions.slice(0, maxVisible);
  const hasMore = suggestions.length > maxVisible;

  const getConfidenceColor = (confidence: AmountSuggestion['confidence']) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getSourceIcon = (source?: AmountSuggestion['source']) => {
    switch (source) {
      case 'order':
        return <FileText className="h-3 w-3" />;
      case 'quote':
        return <Receipt className="h-3 w-3" />;
      case 'outstanding':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  return (
    <Card className={cn("border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/30", className)} data-testid="panel-amount-suggestions">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-indigo-500" />
          </div>
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{title}</span>
        </div>

        <div className="space-y-2">
          {visibleSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-between h-auto py-2 px-3 border-indigo-300/50 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-all"
              onClick={() => onSelect(suggestion.value, suggestion.details)}
              data-testid={`button-suggestion-${index}`}
            >
              <div className="flex items-center gap-2 text-left">
                <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {getSourceIcon(suggestion.source)}
                </div>
                <span className="text-sm font-medium truncate max-w-[180px]" data-testid={`text-suggestion-label-${index}`}>
                  {suggestion.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {showConfidence && (
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs capitalize", getConfidenceColor(suggestion.confidence))}
                    data-testid={`badge-confidence-${index}`}
                  >
                    {suggestion.confidence}
                  </Badge>
                )}
                <Zap className="h-4 w-4 text-indigo-500" />
              </div>
            </Button>
          ))}
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            onClick={() => setExpanded(!expanded)}
            data-testid="button-toggle-suggestions"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {suggestions.length - maxVisible} more suggestions
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface CommissionBreakdownProps {
  summary: {
    totalSales: number;
    commissionRate: number;
    grossCommission: number;
    alreadyPaid: number;
    pendingApproval: number;
    suggestedPayment: number;
  };
  orderBreakdown?: Array<{
    orderId: number;
    orderCode: string;
    orderName: string;
    amount: number;
    commission: number;
    createdAt: string | null;
  }>;
  onSelectAmount: (value: string) => void;
  className?: string;
}

export function CommissionBreakdown({
  summary,
  orderBreakdown = [],
  onSelectAmount,
  className
}: CommissionBreakdownProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className={cn("border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30", className)} data-testid="panel-commission-breakdown">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <h4 className="font-semibold text-purple-700 dark:text-purple-300">Commission Calculator</h4>
            <p className="text-xs text-muted-foreground">Auto-calculated based on orders</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Sales</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300" data-testid="text-total-sales">
              {formatCurrency(summary.totalSales)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Commission Rate</p>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300" data-testid="text-commission-rate">
              {summary.commissionRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Gross Commission</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-gross-commission">
              {formatCurrency(summary.grossCommission)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Already Paid</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400" data-testid="text-already-paid">
              {formatCurrency(summary.alreadyPaid)}
            </p>
          </div>
        </div>

        <div className="bg-purple-100/50 dark:bg-purple-900/30 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Suggested Payment</p>
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300" data-testid="text-suggested-payment">
                {formatCurrency(summary.suggestedPayment)}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1"
              onClick={() => onSelectAmount(summary.suggestedPayment.toFixed(2))}
              data-testid="button-use-suggested"
            >
              <Zap className="h-3 w-3" />
              Use Amount
            </Button>
          </div>
        </div>

        {orderBreakdown.length > 0 && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-purple-600 dark:text-purple-400"
              onClick={() => setShowDetails(!showDetails)}
              data-testid="button-toggle-order-details"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide order breakdown
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show {orderBreakdown.length} orders contributing to commission
                </>
              )}
            </Button>

            {showDetails && (
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {orderBreakdown.map((order, index) => (
                  <div
                    key={order.orderId}
                    className="flex items-center justify-between bg-white/50 dark:bg-black/20 rounded p-2 text-sm"
                    data-testid={`row-order-breakdown-${index}`}
                  >
                    <div>
                      <span className="font-medium">{order.orderCode}</span>
                      <span className="text-muted-foreground ml-2 text-xs truncate max-w-[100px]">
                        {order.orderName}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.commission)}</p>
                      <p className="text-xs text-muted-foreground">
                        from {formatCurrency(order.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentSuggestionPanelProps {
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
  onSelectAmount: (value: string) => void;
  onSelectMethod?: (method: string) => void;
  className?: string;
}

export function PaymentSuggestionPanel({
  invoice,
  suggestions,
  paymentHistory,
  onSelectAmount,
  onSelectMethod,
  className
}: PaymentSuggestionPanelProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className={cn("border-green-500/30 bg-green-50/50 dark:bg-green-950/30", className)} data-testid="panel-payment-suggestions">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <h4 className="font-semibold text-green-700 dark:text-green-300">Payment Summary</h4>
            <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-gray-700 dark:text-gray-300" data-testid="text-invoice-total">
              {formatCurrency(invoice.total)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="font-bold text-green-600 dark:text-green-400" data-testid="text-invoice-paid">
              {formatCurrency(invoice.paid)}
            </p>
          </div>
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 text-center">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="font-bold text-orange-600 dark:text-orange-400" data-testid="text-invoice-outstanding">
              {formatCurrency(invoice.outstanding)}
            </p>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quick amounts:</p>
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-between border-green-300/50 hover:bg-green-100/50 dark:hover:bg-green-900/30"
                onClick={() => onSelectAmount(suggestion.value)}
                data-testid={`button-payment-suggestion-${index}`}
              >
                <span className="text-sm">{suggestion.label}</span>
                <Zap className="h-3 w-3 text-green-500" />
              </Button>
            ))}
          </div>
        )}

        {paymentHistory && paymentHistory.preferredMethod && onSelectMethod && (
          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Preferred method: <span className="font-medium capitalize">{paymentHistory.preferredMethod.replace('_', ' ')}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-green-600"
                onClick={() => onSelectMethod(paymentHistory.preferredMethod)}
                data-testid="button-use-preferred-method"
              >
                Use
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
