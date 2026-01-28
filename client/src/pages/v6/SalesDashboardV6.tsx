import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  RefreshCw,
  Loader2,
  Building2,
  FileText,
  Star,
} from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SalesMetrics {
  currentMonthSales: number;
  previousMonthSales: number;
  monthlyTarget: number;
  totalPipeline: number;
  activeLeads: number;
  newLeadsThisWeek: number;
  closedThisMonth: number;
  averageOrderValue: number;
}

interface Lead {
  id: number;
  name: string;
  organizationName?: string;
  email: string;
  phone?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  estimatedValue: number;
  lastContactDate?: string;
  nextFollowUp?: string;
  source: string;
  assignedTo: string;
  createdAt: string;
  notes?: string;
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  orderName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface UpcomingEvent {
  id: number;
  name: string;
  eventType: string;
  eventDate: string;
  organizationName: string;
  estimatedParticipants: number;
  status: string;
}

const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700" },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  qualified: { label: "Qualified", color: "bg-purple-100 text-purple-700" },
  proposal: { label: "Proposal", color: "bg-orange-100 text-orange-700" },
  negotiation: { label: "Negotiation", color: "bg-pink-100 text-pink-700" },
  closed_won: { label: "Won", color: "bg-green-100 text-green-700" },
  closed_lost: { label: "Lost", color: "bg-gray-100 text-gray-700" },
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="p-2 bg-muted rounded-lg">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            {trend && trendValue && (
              <div className={cn(
                "flex items-center text-xs font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600"
              )}>
                {trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeadCard({ lead, onAction }: { lead: Lead; onAction: (action: string, lead: Lead) => void }) {
  const statusConfig = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_CONFIG.new;
  const needsFollowUp = lead.nextFollowUp && new Date(lead.nextFollowUp) <= new Date();

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      needsFollowUp && "border-l-4 border-l-yellow-500"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{lead.name}</h3>
              {needsFollowUp && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                  Follow-up Due
                </Badge>
              )}
            </div>
            {lead.organizationName && (
              <p className="text-sm text-muted-foreground">{lead.organizationName}</p>
            )}
          </div>
          <Badge className={cn("text-xs", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            ${lead.estimatedValue.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
          </div>
        </div>

        {lead.lastContactDate && (
          <p className="text-xs text-muted-foreground mb-3">
            Last contact: {format(new Date(lead.lastContactDate), "MMM d, yyyy")}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onAction("call", lead)}>
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction("email", lead)}>
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction("view", lead)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("schedule", lead)}>
                Schedule Follow-up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("convert", lead)}>
                Convert to Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("note", lead)}>
                Add Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesDashboardV6() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("leads");

  // Fetch data
  const { data: metrics } = useQuery<SalesMetrics>({
    queryKey: ["/api/v6/dashboard/sales/metrics"],
    refetchInterval: 60000,
  });

  const { data: leads = [], isLoading: loadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/v6/dashboard/sales/leads"],
    refetchInterval: 30000,
  });

  const { data: recentOrders = [] } = useQuery<RecentOrder[]>({
    queryKey: ["/api/v6/dashboard/sales/recent-orders"],
  });

  const { data: upcomingEvents = [] } = useQuery<UpcomingEvent[]>({
    queryKey: ["/api/v6/dashboard/sales/upcoming-events"],
  });

  // Calculate progress
  const progressToTarget = metrics
    ? Math.min((metrics.currentMonthSales / metrics.monthlyTarget) * 100, 100)
    : 0;

  const monthlyGrowth = metrics && metrics.previousMonthSales > 0
    ? ((metrics.currentMonthSales - metrics.previousMonthSales) / metrics.previousMonthSales) * 100
    : 0;

  // Prioritized leads (needs follow-up or new)
  const prioritizedLeads = useMemo(() => {
    return [...leads].sort((a, b) => {
      // Follow-up due first
      if (a.nextFollowUp && new Date(a.nextFollowUp) <= new Date()) return -1;
      if (b.nextFollowUp && new Date(b.nextFollowUp) <= new Date()) return 1;
      // Then by estimated value
      return b.estimatedValue - a.estimatedValue;
    });
  }, [leads]);

  const handleLeadAction = (action: string, lead: Lead) => {
    switch (action) {
      case "view":
        navigate(`/leads/list?id=${lead.id}`);
        break;
      case "call":
        if (lead.phone) {
          window.location.href = `tel:${lead.phone}`;
        } else {
          toast({ title: "No phone number available" });
        }
        break;
      case "email":
        window.location.href = `mailto:${lead.email}`;
        break;
      case "convert":
        navigate(`/v6/orders/new?leadId=${lead.id}`);
        break;
      default:
        toast({ title: `Action: ${action}` });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Sales Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "MMMM yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/leads/list")}>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Monthly Sales"
            value={`$${(metrics?.currentMonthSales || 0).toLocaleString()}`}
            icon={DollarSign}
            trend={monthlyGrowth >= 0 ? "up" : "down"}
            trendValue={`${Math.abs(monthlyGrowth).toFixed(1)}%`}
          />
          <MetricCard
            title="Pipeline Value"
            value={`$${(metrics?.totalPipeline || 0).toLocaleString()}`}
            icon={Target}
          />
          <MetricCard
            title="Active Leads"
            value={metrics?.activeLeads || 0}
            subtitle={`${metrics?.newLeadsThisWeek || 0} new this week`}
            icon={Users}
          />
          <MetricCard
            title="Avg. Order Value"
            value={`$${(metrics?.averageOrderValue || 0).toLocaleString()}`}
            icon={ShoppingCart}
          />
        </div>

        {/* Monthly Target Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold">Monthly Target Progress</h3>
                <p className="text-sm text-muted-foreground">
                  ${(metrics?.currentMonthSales || 0).toLocaleString()} of ${(metrics?.monthlyTarget || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{progressToTarget.toFixed(0)}%</span>
                <p className="text-xs text-muted-foreground">
                  {metrics?.closedThisMonth || 0} deals closed
                </p>
              </div>
            </div>
            <Progress value={progressToTarget} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="leads">My Leads</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="mt-4">
            {loadingLeads ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : prioritizedLeads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No active leads</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your pipeline by adding new leads.
                  </p>
                  <Button onClick={() => navigate("/leads/list")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prioritizedLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onAction={handleLeadAction}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recent Orders Tab */}
          <TabsContent value="orders" className="mt-4">
            {recentOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No recent orders</h3>
                  <p className="text-muted-foreground">
                    Your recent orders will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/v6/orders/${order.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{order.orderNumber}</span>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName} - {order.orderName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upcoming Events Tab */}
          <TabsContent value="events" className="mt-4">
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground">
                    Upcoming events and opportunities will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{event.name}</span>
                          <Badge variant="outline" className="text-xs">{event.eventType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.organizationName} - {event.estimatedParticipants} participants
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {format(new Date(event.eventDate), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">{event.status}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
