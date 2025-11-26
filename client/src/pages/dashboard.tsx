import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DashboardSkeleton } from "@/components/ui/loading-skeletons";
import { HelpButton } from "@/components/help-button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CreateLeadModal } from "@/components/modals/create-lead-modal";
import { formatNumber, formatPercentage } from "@/lib/format";
import { formatDistanceToNow } from "date-fns";
import { 
  Users, DollarSign, ShoppingCart, Activity, TrendingUp, 
  Target, Award, Briefcase, BarChart3, Palette, Clock, 
  CheckCircle, Star, Package, Truck, AlertTriangle, Gauge,
  Factory, Calendar, Settings, FileText, Plus, Upload,
  ClipboardList, RefreshCw, ListTodo
} from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  totalOrders: number;
  designJobs: number;
  revenue: number;
  leadsByStage: Record<string, number>;
  ordersByStatus: Record<string, number>;
  // Admin specific
  totalUsers?: number;
  systemRevenue?: number;
  systemHealth?: string;
  usersByRole?: Record<string, number>;
  // Sales specific
  myLeads?: number;
  conversionRate?: number;
  commissionEarned?: number;
  quotaProgress?: number;
  myPipeline?: { stage: string; value: number; count: number }[];
  // Designer specific
  activeJobs?: number;
  pendingReview?: number;
  completedThisMonth?: number;
  approvalRate?: number;
  jobsByStatus?: Record<string, number>;
  // Ops specific
  ordersInProduction?: number;
  shippingToday?: number;
  overdueItems?: number;
  capacity?: number;
  productionPipeline?: Record<string, number>;
  // Manufacturer specific
  activeProductions?: number;
  onTimeRate?: number;
  capacityUsed?: number;
  dueThisWeek?: number;
  productionSchedule?: { date: string; count: number }[];
}

interface ActivityItem {
  id: number;
  actorUserId: string;
  entity: string;
  entityId: number;
  action: string;
  createdAt: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
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

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: activity, isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ["/api/activity/recent"],
    retry: false,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="p-3 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Check if user is loaded and has a role
  if (!user || !user.role) {
    return <GenericDashboard stats={stats} activity={activity} />;
  }

  // Render dashboard based on user role (case-insensitive comparison)
  const userRole = user.role.toLowerCase();

  let dashboardContent;
  switch (userRole) {
    case 'admin':
      dashboardContent = <AdminDashboard stats={stats} activity={activity} />;
      break;
    case 'sales':
      dashboardContent = <SalesDashboard stats={stats} activity={activity} />;
      break;
    case 'designer':
      dashboardContent = <DesignerDashboard stats={stats} activity={activity} />;
      break;
    case 'ops':
      dashboardContent = <OpsDashboard stats={stats} activity={activity} />;
      break;
    case 'manufacturer':
      dashboardContent = <ManufacturerDashboard stats={stats} activity={activity} />;
      break;
    default:
      // Fallback to generic dashboard for unknown roles
      dashboardContent = <GenericDashboard stats={stats} activity={activity} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      {dashboardContent}
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ stats, activity }: { stats?: DashboardStats; activity?: ActivityItem[] }) {
  const { data: taskStats } = useQuery<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  }>({
    queryKey: ["/api/tasks/stats"],
    retry: false,
  });

  const adminHelpItems = [
    {
      question: "What does the Admin Dashboard show?",
      answer: "The Admin Dashboard provides a system-wide overview including total users by role, system revenue, active orders, task management metrics, and system health status.",
    },
    {
      question: "How do I manage user permissions?",
      answer: "Navigate to Settings > Permission Management to configure role-based access control for different resources and actions.",
    },
    {
      question: "What actions can I take from this dashboard?",
      answer: "You can quickly create new users, view system analytics, manage tasks, access connection health monitoring, and navigate to detailed management pages.",
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight" data-testid="heading-admin-dashboard">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management</p>
        </div>
        <HelpButton pageTitle="Admin Dashboard" helpItems={adminHelpItems} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card data-testid="card-total-users" className="glass-card border-primary/20 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">+5%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-total-users">
                {formatNumber(stats?.totalUsers)}
              </h3>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {stats?.usersByRole && Object.entries(stats.usersByRole).map(([role, count]) => (
                  <Badge key={role} variant="outline" className="text-xs border-white/10 bg-white/5">
                    {role}: {formatNumber(count)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-system-revenue" className="glass-card border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">+12%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-system-revenue">
                ${((stats?.systemRevenue || 0) / 1000).toFixed(1)}K
              </h3>
              <p className="text-sm text-muted-foreground">System Revenue</p>
              <div className="mt-4">
                <StatusBadge status="target">Monthly Target: $500K</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-active-orders" className="glass-card border-secondary/20 hover:border-secondary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                  <ShoppingCart className="w-6 h-6 text-secondary" />
                </div>
                <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">+8%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-active-orders">
                {formatNumber(stats?.totalOrders)}
              </h3>
              <p className="text-sm text-muted-foreground">Active Orders</p>
              <div className="mt-4 flex gap-2">
                <StatusBadge status="production">{formatNumber(stats?.ordersByStatus?.production)}</StatusBadge>
                <StatusBadge status="shipped">{formatNumber(stats?.ordersByStatus?.shipped)}</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-system-health" className="glass-card border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/30">Healthy</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-system-health">
                {stats?.systemHealth || 'Good'}
              </h3>
              <p className="text-sm text-muted-foreground">System Health</p>
              <div className="mt-4">
                <StatusBadge status="ready">All Systems Operational</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Analytics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="h-full">
          <Card data-testid="card-task-stats" className="glass-card border-white/10 h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg text-foreground">
                <span>Task Management</span>
                <ListTodo className="w-5 h-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <span className="text-xl font-bold text-foreground">{formatNumber(taskStats?.total)}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
                    <span className="font-semibold text-foreground">{formatNumber(taskStats?.pending)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>
                    <span className="font-semibold text-foreground">{formatNumber(taskStats?.inProgress)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
                    <span className="font-semibold text-foreground">{formatNumber(taskStats?.completed)}</span>
                  </div>
                  {taskStats?.overdue && taskStats.overdue > 0 && (
                    <div className="flex justify-between items-center">
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">Overdue</Badge>
                      <span className="font-semibold text-red-500">{formatNumber(taskStats.overdue)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          <Card data-testid="card-task-completion" className="glass-card border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Task Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-white/5"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                      strokeDasharray={`${((taskStats?.completed || 0) / (taskStats?.total || 1)) * 351} 351`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">
                      {taskStats?.total ? Math.round(((taskStats?.completed || 0) / taskStats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                {formatNumber(taskStats?.completed)} of {formatNumber(taskStats?.total)} tasks completed
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          <Card data-testid="card-task-productivity" className="glass-card border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Productivity Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-muted-foreground">Avg. Completion Time</span>
                  <span className="font-medium text-foreground">2.3 days</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-muted-foreground">Tasks Created Today</span>
                  <span className="font-medium text-foreground">5</span>
                </div>
                <div className="flex justify-between text-sm p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-muted-foreground">Tasks Completed Today</span>
                  <span className="font-medium text-foreground">8</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-muted-foreground mb-1">Most Active User</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">JD</div>
                  <p className="text-sm font-medium text-foreground">John Doe (12 tasks)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Card data-testid="card-revenue-chart" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg text-foreground">
                <span>Revenue Trends</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 bg-black/20 rounded-xl flex items-end justify-center space-x-4 p-6 border border-white/5">
                {[40, 65, 45, 80, 100, 75, 90].map((height, i) => (
                  <div key={i} className="w-10 bg-gradient-to-t from-primary/20 to-primary rounded-t-sm relative group" style={{ height: `${height}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {height}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-quick-actions" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-primary transition-colors" data-testid="button-add-user">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                Add User
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-secondary transition-colors" data-testid="button-system-settings">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-3">
                  <Settings className="w-4 h-4 text-secondary" />
                </div>
                System Settings
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-green-500 transition-colors" data-testid="button-reports">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-green-500" />
                </div>
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <Card data-testid="card-activity-feed" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Full Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">User {item.actorUserId}</span> {item.action} <span className="text-primary">{item.entity} #{item.entityId}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sales Dashboard
function SalesDashboard({ stats, activity }: { stats?: DashboardStats; activity?: ActivityItem[] }) {
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);

  const salesHelpItems = [
    {
      question: "What does my dashboard show?",
      answer: "Your Sales Dashboard displays your personal performance metrics including active leads, conversion rate, commission earned, and quota progress.",
    },
    {
      question: "How is my commission calculated?",
      answer: "Commission is calculated based on your commission rate applied to completed orders. You can view detailed breakdowns in the Finance section.",
    },
    {
      question: "What actions can I take from here?",
      answer: "You can quickly create new leads, create orders, and view your personal pipeline progress. Use the sidebar to access detailed lead and order management.",
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight" data-testid="heading-sales-dashboard">Sales Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your sales performance and pipeline</p>
        </div>
        <HelpButton pageTitle="Sales Dashboard" helpItems={salesHelpItems} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card data-testid="card-my-leads" className="glass-card border-primary/20 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Active</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-my-leads">
                {stats?.myLeads || 0}
              </h3>
              <p className="text-sm text-muted-foreground">My Leads</p>
              <div className="mt-4 flex gap-2">
                <StatusBadge status="new">{stats?.leadsByStage?.unclaimed || 0} New</StatusBadge>
                <StatusBadge status="qualified">{stats?.leadsByStage?.qualified || 0} Hot</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-conversion-rate" className="glass-card border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">+3%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-conversion-rate">
                {stats?.conversionRate || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <div className="mt-4">
                <StatusBadge status="target">Target: 25%</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-commission" className="glass-card border-secondary/20 hover:border-secondary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                  <Award className="w-6 h-6 text-secondary" />
                </div>
                <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">MTD</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-commission">
                ${((stats?.commissionEarned || 0) / 1000).toFixed(1)}K
              </h3>
              <p className="text-sm text-muted-foreground">Commission Earned</p>
              <div className="mt-4">
                <StatusBadge status="ready">On Track</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-quota-progress" className="glass-card border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Briefcase className="w-6 h-6 text-emerald-500" />
                </div>
                <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20">{stats?.quotaProgress || 0}%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-quota-progress">
                {stats?.quotaProgress || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">Quota Progress</p>
              <div className="mt-4">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${stats?.quotaProgress || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Card data-testid="card-pipeline-chart" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Personal Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.myPipeline?.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{stage.count}</Badge>
                      <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      ${(stage.value / 1000).toFixed(1)}K
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-quick-actions" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-primary transition-colors" 
                data-testid="button-create-lead"
                onClick={() => setIsCreateLeadOpen(true)}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                Create Lead
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-secondary transition-colors" data-testid="button-create-order">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-3">
                  <ShoppingCart className="w-4 h-4 text-secondary" />
                </div>
                Create Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <Card data-testid="card-activity-feed" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">My Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.filter(item => item.entity === 'lead' || item.entity === 'order').slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{item.action}</span> <span className="text-primary">{item.entity} #{item.entityId}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateLeadModal 
        isOpen={isCreateLeadOpen}
        onClose={() => setIsCreateLeadOpen(false)}
      />
    </div>
  );
}

// Designer Dashboard
function DesignerDashboard({ stats, activity }: { stats?: DashboardStats; activity?: ActivityItem[] }) {
  const designerHelpItems = [
    {
      question: "What does my dashboard show?",
      answer: "Your Designer Dashboard shows active design jobs, pending reviews, completed jobs this month, and your approval rate.",
    },
    {
      question: "How are design jobs assigned to me?",
      answer: "Design jobs are created when orders require custom designs. They're automatically tracked and can be managed in the Design Jobs section.",
    },
    {
      question: "What is the approval rate?",
      answer: "The approval rate shows the percentage of your designs that were approved on first submission without requiring revisions.",
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight" data-testid="heading-designer-dashboard">Designer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your design jobs and performance</p>
        </div>
        <HelpButton pageTitle="Designer Dashboard" helpItems={designerHelpItems} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card data-testid="card-active-jobs" className="glass-card border-purple-500/20 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <Palette className="w-6 h-6 text-purple-500" />
                </div>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Active</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-active-jobs">
                {stats?.activeJobs || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <div className="mt-4 flex gap-2">
                {stats?.jobsByStatus && Object.entries(stats.jobsByStatus).slice(0, 2).map(([status, count]) => (
                  <StatusBadge key={status} status={status as any}>
                    {count} {status}
                  </StatusBadge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-pending-review" className="glass-card border-yellow-500/20 hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-pending-review">
                {stats?.pendingReview || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <div className="mt-4">
                <StatusBadge status="pending">Needs Attention</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-completed" className="glass-card border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">MTD</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-completed">
                {stats?.completedThisMonth || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Completed</p>
              <div className="mt-4">
                <StatusBadge status="ready">This Month</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-approval-rate" className="glass-card border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Star className="w-6 h-6 text-emerald-500" />
                </div>
                <Badge variant="default" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20">{stats?.approvalRate || 0}%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-approval-rate">
                {stats?.approvalRate || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <div className="mt-4">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${stats?.approvalRate || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Card data-testid="card-timeline-chart" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Job Completion Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-black/20 rounded-xl p-4 border border-white/5">
                <div className="space-y-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                    <div key={day} className="flex items-center space-x-3">
                      <span className="text-xs text-muted-foreground w-8">{day}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-primary h-3 rounded-full shadow-[0_0_5px_rgba(0,255,255,0.5)]" 
                          style={{ width: `${(i + 1) * 20}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{i + 2} jobs</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-quick-actions" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-primary transition-colors" 
                data-testid="button-view-jobs"
                onClick={() => window.location.href = "/design-jobs"}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                View Jobs
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-secondary transition-colors" 
                data-testid="button-upload-renditions"
                onClick={() => {
                  // For now, navigate to design jobs page where they can edit jobs and upload files
                  window.location.href = "/design-jobs";
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-3">
                  <Upload className="w-4 h-4 text-secondary" />
                </div>
                Upload Renditions
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <Card data-testid="card-activity-feed" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Design Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.filter(item => item.entity === 'design_job').slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{item.action}</span> design job <span className="text-primary">#{item.entityId}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent design activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Ops Dashboard
function OpsDashboard({ stats, activity }: { stats?: DashboardStats; activity?: ActivityItem[] }) {
  const [, setLocation] = useLocation();
  
  const opsHelpItems = [
    {
      question: "What does the Operations Dashboard track?",
      answer: "This dashboard tracks orders in production, shipping schedules, overdue items, and overall production capacity across all manufacturers.",
    },
    {
      question: "What are overdue items?",
      answer: "Overdue items are orders that have passed their estimated delivery date but haven't been marked as shipped or completed yet.",
    },
    {
      question: "How is capacity calculated?",
      answer: "Capacity shows the percentage of available manufacturing capacity currently being utilized across all active manufacturers.",
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight" data-testid="heading-ops-dashboard">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">Production and fulfillment overview</p>
        </div>
        <HelpButton pageTitle="Operations Dashboard" helpItems={opsHelpItems} />
      </div>

      {/* KPI Cards - No revenue data for Ops role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card data-testid="card-in-production" className="glass-card border-orange-500/20 hover:border-orange-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                  <Package className="w-6 h-6 text-orange-500" />
                </div>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">Active</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-in-production">
                {formatNumber(stats?.ordersInProduction)}
              </h3>
              <p className="text-sm text-muted-foreground">In Production</p>
              <div className="mt-4 flex gap-2">
                {stats?.productionPipeline && Object.entries(stats.productionPipeline).slice(0, 2).map(([status, count]) => (
                  <StatusBadge key={status} status={status as any}>
                    {formatNumber(count as number)} {status}
                  </StatusBadge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-shipping-today" className="glass-card border-blue-500/20 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Truck className="w-6 h-6 text-blue-500" />
                </div>
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Today</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-shipping-today">
                {formatNumber(stats?.shippingToday)}
              </h3>
              <p className="text-sm text-muted-foreground">Shipping Today</p>
              <div className="mt-4">
                <StatusBadge status="ready">Ready to Ship</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card 
            data-testid="card-overdue" 
            className="glass-card border-red-500/20 hover:border-red-500/50 transition-colors cursor-pointer"
            onClick={() => setLocation('/orders?filter=overdue')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">{formatNumber(stats?.overdueItems)}</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-overdue">
                {formatNumber(stats?.overdueItems)}
              </h3>
              <p className="text-sm text-muted-foreground">Overdue Items</p>
              <div className="mt-4">
                <StatusBadge status="overdue">Needs Attention</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-capacity" className="glass-card border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <Gauge className="w-6 h-6 text-green-500" />
                </div>
                <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/20">{formatPercentage(stats?.capacity)}</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-capacity">
                {formatPercentage(stats?.capacity)}
              </h3>
              <p className="text-sm text-muted-foreground">Capacity Used</p>
              <div className="mt-4">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                    style={{ width: `${Math.min(stats?.capacity || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Card data-testid="card-pipeline-chart" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Production Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.productionPipeline && Object.entries(stats.productionPipeline).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{formatNumber(count as number)}</Badge>
                      <span className="text-sm font-medium capitalize text-foreground">{status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-2 rounded-full shadow-[0_0_5px_rgba(0,255,255,0.5)]" 
                        style={{ width: `${Math.min((count as number) * 10, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-quick-actions" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-primary transition-colors" 
                data-testid="button-production-queue"
                onClick={() => setLocation('/manufacturing')}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                Production Queue
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-secondary transition-colors" 
                data-testid="button-update-shipping"
                onClick={() => setLocation('/orders')}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-3">
                  <RefreshCw className="w-4 h-4 text-secondary" />
                </div>
                Update Shipping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <Card data-testid="card-activity-feed" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Operations Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.filter(item => item.entity === 'order' || item.entity === 'manufacturing').slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{item.action}</span> <span className="text-primary">{item.entity} #{item.entityId}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent operations activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Manufacturer Dashboard
function ManufacturerDashboard({ stats, activity }: { stats?: DashboardStats; activity?: ActivityItem[] }) {
  const manufacturerHelpItems = [
    {
      question: "What does my dashboard show?",
      answer: "Your Manufacturing Dashboard displays active productions assigned to you, your on-time delivery rate, capacity usage, and orders due this week.",
    },
    {
      question: "How is on-time rate calculated?",
      answer: "On-time rate is the percentage of orders you've completed by their estimated delivery date over the past 90 days.",
    },
    {
      question: "What is capacity usage?",
      answer: "Capacity usage shows the percentage of your available production capacity that's currently allocated to active orders.",
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight" data-testid="heading-manufacturer-dashboard">Manufacturing Dashboard</h1>
          <p className="text-muted-foreground mt-1">Production schedule and performance</p>
        </div>
        <HelpButton pageTitle="Manufacturing Dashboard" helpItems={manufacturerHelpItems} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Card data-testid="card-active-productions" className="glass-card border-indigo-500/20 hover:border-indigo-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                  <Factory className="w-6 h-6 text-indigo-500" />
                </div>
                <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">Active</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-active-productions">
                {stats?.activeProductions || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Active Productions</p>
              <div className="mt-4">
                <StatusBadge status="production">In Progress</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-on-time-rate" className="glass-card border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/20">{stats?.onTimeRate || 0}%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-on-time-rate">
                {stats?.onTimeRate || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <div className="mt-4">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                    style={{ width: `${stats?.onTimeRate || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-capacity-used" className="glass-card border-yellow-500/20 hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                  <Gauge className="w-6 h-6 text-yellow-500" />
                </div>
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{stats?.capacityUsed || 0}%</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-capacity-used">
                {stats?.capacityUsed || 0}%
              </h3>
              <p className="text-sm text-muted-foreground">Capacity Used</p>
              <div className="mt-4">
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                    style={{ width: `${stats?.capacityUsed || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-due-this-week" className="glass-card border-purple-500/20 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">This Week</Badge>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-due-this-week">
                {stats?.dueThisWeek || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Due This Week</p>
              <div className="mt-4">
                <StatusBadge status="pending">Schedule View</StatusBadge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <Card data-testid="card-schedule-chart" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Production Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.productionSchedule?.slice(0, 5).map((schedule) => (
                  <div key={schedule.date} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{schedule.count} items</Badge>
                      <div className="w-20 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-2 rounded-full shadow-[0_0_5px_rgba(0,255,255,0.5)]" 
                          style={{ width: `${Math.min(schedule.count * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-quick-actions" className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-primary transition-colors" data-testid="button-update-status">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                  <RefreshCw className="w-4 h-4 text-primary" />
                </div>
                Update Status
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 border-white/10 hover:bg-white/5 hover:text-secondary transition-colors" data-testid="button-view-schedule">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mr-3">
                  <Calendar className="w-4 h-4 text-secondary" />
                </div>
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <Card data-testid="card-activity-feed" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Manufacturing Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.filter(item => item.entity === 'manufacturing' || item.entity === 'order').slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{item.action}</span> <span className="text-primary">{item.entity} #{item.entityId}</span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent manufacturing activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Generic Dashboard (fallback)
function GenericDashboard({ stats, activity }: { stats?: DashboardStats; activity?: ActivityItem[] }) {
  const genericHelpItems = [
    {
      question: "What can I see on my dashboard?",
      answer: "Your dashboard provides an overview of system activity including leads, orders, design jobs, and revenue metrics.",
    },
    {
      question: "How do I navigate to different sections?",
      answer: "Use the sidebar menu on the left to access specific sections like Leads, Orders, Organizations, and more.",
    },
    {
      question: "Can I customize my dashboard?",
      answer: "Dashboard views are customized based on your user role. Contact your administrator if you need access to additional features.",
    },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text tracking-tight" data-testid="heading-dashboard">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview</p>
        </div>
        <HelpButton pageTitle="Dashboard" helpItems={genericHelpItems} />
      </div>

      {/* KPI Cards - No revenue data for non-admin roles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Card data-testid="card-leads-kpi" className="glass-card border-blue-500/20 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">+12%</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-total-leads">
                {stats?.totalLeads || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Active Leads</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-orders-kpi" className="glass-card border-green-500/20 hover:border-green-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                  <ShoppingCart className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">+8%</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-total-orders">
                {stats?.totalOrders || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Active Orders</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card data-testid="card-design-jobs-kpi" className="glass-card border-purple-500/20 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <Palette className="w-6 h-6 text-purple-500" />
                </div>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">-3%</span>
              </div>
              <h3 className="text-3xl font-bold mb-1 text-foreground" data-testid="text-design-jobs">
                {stats?.designJobs || 0}
              </h3>
              <p className="text-sm text-muted-foreground">Design Jobs</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <Card data-testid="card-activity-feed" className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-4">
                {activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 text-sm p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">User {item.actorUserId}</span> {item.action} <span className="text-primary">{item.entity} #{item.entityId}</span>
                                       </span>
                    <span className="text-xs text-muted-foreground ml-auto bg-white/5 px-2 py-1 rounded">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}