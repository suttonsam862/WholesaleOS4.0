import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { TrendingUp, DollarSign, Target, Users, Award } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const helpItems = [
  {
    question: "How are my commission projections calculated?",
    answer: "Commission projections are based on your current pipeline value multiplied by historical win rates for each stage. The system uses a weighted probability model to estimate expected earnings.",
    example: "If you have $50,000 in 'qualified' leads (60% win rate) and $30,000 in 'contacted' leads (30% win rate), projected commission = ($50k × 0.6 × commission_rate) + ($30k × 0.3 × commission_rate)"
  },
  {
    question: "What does conversion rate mean?",
    answer: "Conversion rate shows the percentage of leads that successfully move from one stage to the next. A high conversion rate indicates effective sales techniques.",
    example: "If you contacted 100 leads and 40 became qualified, your contacted→qualified conversion rate is 40%"
  },
  {
    question: "How can I improve my pipeline velocity?",
    answer: "Pipeline velocity measures how quickly deals move through your sales process. Improve it by: following up promptly, qualifying leads early, removing stale opportunities, and focusing on high-value prospects.",
  },
  {
    question: "What's the difference between closed deals and won deals?",
    answer: "Won deals are opportunities that resulted in a sale. Closed deals include both won and lost opportunities - any lead that reached a final decision point."
  }
];

interface SalesStats {
  totalRevenue: number;
  projectedCommission: number;
  activeLeads: number;
  conversionRate: number;
  avgDealSize: number;
  pipelineValue: number;
}

interface PerformanceData {
  month: string;
  revenue: number;
  deals: number;
  commission: number;
}

export function SalesAnalytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<SalesStats>({
    queryKey: ["/api/sales/analytics"],
  });

  const { data: chartData = [], isLoading: chartLoading } = useQuery<PerformanceData[]>({
    queryKey: ["/api/sales/performance-chart"],
  });

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
  });

  if (statsLoading || chartLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Unable to load analytics data</p>
      </div>
    );
  }

  // Calculate pipeline breakdown from actual leads
  const pipelineStages = {
    unclaimed: leads.filter(l => l.stage === 'unclaimed').length,
    claimed: leads.filter(l => l.stage === 'claimed').length,
    contacted: leads.filter(l => l.stage === 'contacted').length,
    qualified: leads.filter(l => l.stage === 'qualified').length,
    won: leads.filter(l => l.stage === 'won').length,
  };

  const pipelineBreakdown = [
    { name: 'Unclaimed', value: pipelineStages.unclaimed, color: '#94a3b8' },
    { name: 'Claimed', value: pipelineStages.claimed, color: '#3b82f6' },
    { name: 'Contacted', value: pipelineStages.contacted, color: '#8b5cf6' },
    { name: 'Qualified', value: pipelineStages.qualified, color: '#10b981' },
    { name: 'Won', value: pipelineStages.won, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-sales-analytics">Sales Analytics</h1>
          <p className="text-muted-foreground">Track your performance, pipeline, and earnings</p>
        </div>
        <HelpButton pageTitle="Sales Analytics" helpItems={helpItems} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-total-revenue">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From completed orders</p>
          </CardContent>
        </Card>

        <Card data-testid="card-projected-commission">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Commission</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-projected-commission">${stats.projectedCommission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Based on current pipeline</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-active-leads">{stats.activeLeads}</div>
            <p className="text-xs text-muted-foreground">In various stages</p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-conversion-rate">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Won vs closed ratio</p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-deal-size">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-avg-deal-size">${stats.avgDealSize.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per completed order</p>
          </CardContent>
        </Card>

        <Card data-testid="card-pipeline-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-pipeline-value">${stats.pipelineValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total potential value</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-performance-trend">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Monthly revenue and commission tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} name="Commission" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-pipeline-breakdown">
          <CardHeader>
            <CardTitle>Pipeline Breakdown</CardTitle>
            <CardDescription>Leads distribution by stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pipelineBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pipelineBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="card-deals-closed" className="md:col-span-2">
          <CardHeader>
            <CardTitle>Deals Closed</CardTitle>
            <CardDescription>Monthly deal count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deals" fill="#3b82f6" name="Deals Closed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
