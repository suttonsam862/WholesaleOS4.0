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
  FileText
} from "lucide-react";
import { format } from "date-fns";
import type { FinancialTransaction, InsertFinancialTransaction } from "@shared/schema";
import { cn } from "@/lib/utils";

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

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"payment" | "expense" | "">("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Form states
  const [formData, setFormData] = useState<Partial<InsertFinancialTransaction>>({
    type: "payment",
    category: "",
    amount: "0",
    description: "",
    status: "completed",
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

  // Fetch finance records from financial transactions endpoint
  const { data: records = [], isLoading: recordsLoading } = useQuery<FinancialTransaction[]>({
    queryKey: ["/api/financial/transactions"],
    queryFn: async () => {
      const response = await fetch('/api/financial/transactions', { credentials: 'include' });
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    retry: false,
  });

  // Calculate stats
  const stats = records.reduce((acc, record) => {
    const amount = Number(record.amount);
    if (record.type === 'payment' || record.type === 'deposit' || record.type === 'commission') {
      acc.totalIncome += amount;
    } else {
      acc.totalExpenses += amount;
    }
    return acc;
  }, { totalIncome: 0, totalExpenses: 0 });

  const netIncome = stats.totalIncome - stats.totalExpenses;

  // Filter records
  const filteredRecords = records.filter(record => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (record.description?.toLowerCase() || "").includes(query) ||
        (record.category?.toLowerCase() || "").includes(query);
      if (!matchesSearch) return false;
    }

    if (typeFilter && record.type !== typeFilter) return false;
    if (categoryFilter && record.category !== categoryFilter) return false;

    return true;
  });

  // Create record mutation
  const createRecordMutation = useMutation({
    mutationFn: (data: Partial<InsertFinancialTransaction>) => {
      return apiRequest("/api/financial/transactions", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction recorded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/transactions"] });
      setIsCreateModalOpen(false);
      setFormData({
        type: "payment",
        category: "",
        amount: "0",
        description: "",
        status: "completed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record transaction",
        variant: "destructive",
      });
    },
  });

  const handleCreateRecord = () => {
    createRecordMutation.mutate(formData);
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  if (isLoading || recordsLoading) {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text" data-testid="text-page-title">Finance</h1>
          <p className="text-muted-foreground">Track income, expenses, and financial health</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)} 
          data-testid="button-add-transaction"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-white/10 bg-green-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Total Income</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalIncome)}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-red-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-400">Total Expenses</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalExpenses)}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-blue-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">Net Income</p>
              <h3 className={cn("text-2xl font-bold", netIncome >= 0 ? "text-white" : "text-red-400")}>
                {formatCurrency(netIncome)}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-white/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
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
                <SelectItem value=" ">All Types</SelectItem>
                <SelectItem value="payment">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredRecords.map(record => (
          <Card key={record.id} className="glass-card border-white/10 hover:border-primary/50 transition-all duration-300" data-testid={`card-transaction-${record.id}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center",
                  (record.type === 'payment' || record.type === 'deposit' || record.type === 'commission') ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                )}>
                  {(record.type === 'payment' || record.type === 'deposit' || record.type === 'commission') ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{record.description}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                      {record.category}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.createdAt || new Date()), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold text-lg",
                  (record.type === 'payment' || record.type === 'deposit' || record.type === 'commission') ? "text-green-400" : "text-red-400"
                )}>
                  {(record.type === 'payment' || record.type === 'deposit' || record.type === 'commission') ? '+' : '-'}{formatCurrency(record.amount)}
                </p>
                <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground capitalize">
                  {record.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No transactions found matching your filters.
          </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass-panel border-white/10" data-testid="dialog-create-transaction">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Transaction</DialogTitle>
            <DialogDescription className="text-muted-foreground">Record a new income or expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="text-foreground">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount" className="text-foreground">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="pl-9 bg-black/20 border-white/10 text-white"
                    data-testid="input-amount"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Description *</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Transaction description"
                className="bg-black/20 border-white/10 text-white"
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-foreground">Category</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-black/20 border-white/10 text-white" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              data-testid="button-cancel-create"
              className="border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRecord}
              disabled={!formData.description || !formData.amount || createRecordMutation.isPending}
              data-testid="button-submit-create"
              className="bg-primary hover:bg-primary/90"
            >
              Add Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}