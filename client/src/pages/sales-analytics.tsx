import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { ActionDeck } from "@/components/actions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, DollarSign, Target, Users, Award, ChevronDown, BarChart3, PieChartIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

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

function CollapsibleSection({ 
  title, 
  defaultOpen = true, 
  children,
  icon: Icon
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors mb-3">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
          <span className="text-sm sm:text-base font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-in slide-in-from-top-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SwipeableCharts({ chartData, pipelineBreakdown }: { chartData: PerformanceData[]; pipelineBreakdown: any[] }) {
  const [currentChart, setCurrentChart] = useState(0);
  const charts = [
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'pipeline', label: 'Pipeline', icon: PieChartIcon },
    { id: 'deals', label: 'Deals', icon: BarChart3 }
  ];

  const nextChart = () => setCurrentChart((prev) => (prev + 1) % charts.length);
  const prevChart = () => setCurrentChart((prev) => (prev - 1 + charts.length) % charts.length);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <button 
          onClick={prevChart}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2">
          {charts.map((chart, index) => (
            <button
              key={chart.id}
              onClick={() => setCurrentChart(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                currentChart === index ? "bg-primary" : "bg-white/20"
              )}
            />
          ))}
        </div>
        <button 
          onClick={nextChart}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      <Card data-testid={`card-${charts[currentChart].id}-chart`} className="glass-card">
        <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            {(() => {
              const Icon = charts[currentChart].icon;
              return <Icon className="w-4 h-4 text-primary" />;
            })()}
            {charts[currentChart].label}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {currentChart === 0 && "Monthly revenue and commission tracking"}
            {currentChart === 1 && "Leads distribution by stage"}
            {currentChart === 2 && "Monthly deal count"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="h-[200px] sm:h-[300px] touch-pan-x">
            {currentChart === 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.5)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} name="Commission" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {currentChart === 1 && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pipelineBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {currentChart === 2 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.5)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="deals" fill="#3b82f6" name="Deals Closed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SalesAnalytics() {
  const isMobile = useIsMobile();
  
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight" data-testid="heading-sales-analytics">Sales Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Track your performance, pipeline, and earnings</p>
        </div>
        <HelpButton pageTitle="Sales Analytics" helpItems={helpItems} />
      </div>

      <ActionDeck hubId="sales-analytics" />

      <CollapsibleSection title="Key Metrics" icon={TrendingUp} defaultOpen={true}>
        <div className={cn(
          "grid gap-3 sm:gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-3"
        )}>
          <Card data-testid="card-total-revenue" className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold" data-testid="value-total-revenue">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">From completed orders</p>
            </CardContent>
          </Card>

          <Card data-testid="card-projected-commission" className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Projected Commission</CardTitle>
              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold" data-testid="value-projected-commission">${stats.projectedCommission.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Based on current pipeline</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-leads" className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Leads</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold" data-testid="value-active-leads">{stats.activeLeads}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">In various stages</p>
            </CardContent>
          </Card>

          <Card data-testid="card-conversion-rate" className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold" data-testid="value-conversion-rate">{stats.conversionRate}%</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Won vs closed ratio</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-deal-size" className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg Deal Size</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold" data-testid="value-avg-deal-size">${stats.avgDealSize.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Per completed order</p>
            </CardContent>
          </Card>

          <Card data-testid="card-pipeline-value" className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-6 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="text-lg sm:text-2xl font-bold" data-testid="value-pipeline-value">${stats.pipelineValue.toLocaleString()}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total potential value</p>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Performance Charts" icon={BarChart3} defaultOpen={!isMobile}>
        {isMobile ? (
          <SwipeableCharts chartData={chartData} pipelineBreakdown={pipelineBreakdown} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-performance-trend" className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Performance Trend</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Monthly revenue and commission tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} name="Commission" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-pipeline-breakdown" className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Pipeline Breakdown</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Leads distribution by stage</CardDescription>
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
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-deals-closed" className="md:col-span-2 glass-card">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Deals Closed</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Monthly deal count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="deals" fill="#3b82f6" name="Deals Closed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
