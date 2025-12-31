import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalespersonActionPanel } from "./salesperson-action-panel";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Package,
  FileText,
  Phone,
  Calendar,
  ArrowRight,
  Eye,
  Filter,
  Search,
  Bell,
  Activity
} from "lucide-react";

interface WorkflowItem {
  id: number;
  type: "lead" | "quote" | "order";
  code: string;
  name: string;
  status: string;
  stage?: string;
  priority: "low" | "normal" | "high";
  organizationName: string;
  contactName?: string;
  value?: number;
  dueDate?: string;
  lastAction?: string;
  lastActionDate?: string;
  needsAttention: boolean;
  daysSinceLastAction: number;
}

interface WorkflowMetrics {
  totalActive: number;
  needingAttention: number;
  completedThisWeek: number;
  conversionRate: number;
  averageCloseTime: number;
  totalValue: number;
}

export function SalespersonWorkflowDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<WorkflowItem | null>(null);
  const [showActionPanel, setShowActionPanel] = useState(false);

  // Fetch workflow data for the current salesperson
  const { data: workflowData = [], isLoading } = useQuery<WorkflowItem[]>({
    queryKey: ['/api/salespeople/workflow-dashboard', user?.id],
    enabled: !!user?.id,
  });

  const { data: metrics = {} as WorkflowMetrics } = useQuery<WorkflowMetrics>({
    queryKey: ['/api/salespeople/workflow-metrics', user?.id],
    enabled: !!user?.id,
  });

  // Filter and search workflow items
  const filteredItems = useMemo(() => {
    return workflowData.filter((item: WorkflowItem) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          item.code.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower) ||
          item.organizationName.toLowerCase().includes(searchLower) ||
          item.contactName?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "needs_attention" && !item.needsAttention) return false;
        if (statusFilter === "active" && (item.status === "completed" || item.status === "lost")) return false;
        if (statusFilter === "completed" && item.status !== "completed") return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && item.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [workflowData, searchTerm, statusFilter, priorityFilter, typeFilter]);

  const getStatusColor = (status: string, type: string) => {
    switch (status) {
      case "unclaimed":
      case "new":
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "claimed":
      case "contacted":
      case "waiting_sizes":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
      case "qualified":
      case "sent":
      case "invoiced":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200";
      case "production":
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200";
      case "won":
      case "accepted":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200";
      case "lost":
      case "rejected":
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200";
      case "normal": return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200";
      case "low": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "lead": return <Users className="h-4 w-4" />;
      case "quote": return <FileText className="h-4 w-4" />;
      case "order": return <Package className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

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

  const handleItemAction = (item: WorkflowItem) => {
    setSelectedItem(item);
    setShowActionPanel(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading workflow dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="salesperson-workflow-dashboard">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Items</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-active">{metrics.totalActive || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="metric-needs-attention">
              {metrics.needingAttention || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="metric-completed-week">
              {metrics.completedThisWeek || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-conversion-rate">
              {metrics.conversionRate || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Close Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-avg-close-time">
              {metrics.averageCloseTime || 0}d
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-pipeline-value">
              {formatCurrency(metrics.totalValue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Workflow Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-workflow-search"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter} data-testid="select-type-filter">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="quote">Quotes</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter} data-testid="select-status-filter">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="needs_attention">Needs Attention</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter} data-testid="select-priority-filter">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                variant="outline"
                className="w-full"
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Items ({filteredItems.length})</span>
            <Badge variant="secondary">
              {filteredItems.filter((item: WorkflowItem) => item.needsAttention).length} need attention
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4" />
                <p>No workflow items found matching your filters.</p>
              </div>
            ) : (
              filteredItems.map((item: WorkflowItem) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`border rounded-lg p-4 transition-colors ${
                    item.needsAttention ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950" : "border-border"
                  }`}
                  data-testid={`workflow-item-${item.type}-${item.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.code}</span>
                          <Badge variant="outline" className={getStatusColor(item.status, item.type)}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          {item.needsAttention && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              Attention
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                          <span>{item.organizationName}</span>
                          {item.contactName && <span>• {item.contactName}</span>}
                          {item.value && <span>• {formatCurrency(item.value)}</span>}
                          {item.dueDate && <span>• Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        {item.lastAction && (
                          <p className="text-muted-foreground">
                            Last: {item.lastAction}
                          </p>
                        )}
                        {item.lastActionDate && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.lastActionDate).toLocaleDateString()}
                          </p>
                        )}
                        {item.daysSinceLastAction > 0 && (
                          <p className={`text-xs ${item.daysSinceLastAction > 7 ? "text-red-600" : "text-yellow-600"}`}>
                            {item.daysSinceLastAction}d ago
                          </p>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleItemAction(item)}
                        data-testid={`button-action-${item.type}-${item.id}`}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Action
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Panel Modal */}
      {showActionPanel && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Take Action - {selectedItem.code}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowActionPanel(false);
                    setSelectedItem(null);
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalespersonActionPanel
                entityType={selectedItem.type}
                entityId={selectedItem.id}
                currentSalespersonId={user?.id}
                onActionComplete={() => {
                  setShowActionPanel(false);
                  setSelectedItem(null);
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}