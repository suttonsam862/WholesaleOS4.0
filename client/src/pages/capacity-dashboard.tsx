import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, AlertTriangle, Users, Package } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const helpItems = [
  {
    question: "What is machine utilization?",
    answer: "Machine utilization shows the percentage of time each machine is actively producing vs. idle. High utilization (>85%) may indicate capacity constraints. Low utilization (<50%) suggests underuse of equipment.",
    example: "If a machine runs 17 hours out of a 20-hour production day, utilization is 85%"
  },
  {
    question: "How is workforce allocation calculated?",
    answer: "Workforce allocation tracks how many workers are assigned to each production line or machine. It helps identify staffing imbalances and optimize labor distribution.",
  },
  {
    question: "What's the difference between capacity and throughput?",
    answer: "Capacity is the maximum output possible. Throughput is actual output achieved. The gap between them reveals inefficiencies or bottlenecks.",
    example: "Capacity: 1000 units/day, Throughput: 750 units/day → 75% efficiency"
  },
  {
    question: "How do I identify bottlenecks?",
    answer: "Bottlenecks appear as machines with consistently high utilization (>90%) while others are underutilized. Check the 'Bottleneck Analysis' section for machines creating delays in production flow.",
  }
];

export function CapacityDashboard() {
  const isMobile = useIsMobile();
  
  const { data: capacityData, isLoading } = useQuery<any>({
    queryKey: ["/api/manufacturing/capacity"],
  });

  const mockMachines = capacityData?.machines || [
    { name: 'Embroidery M1', utilization: 87, status: 'active', throughput: 450 },
    { name: 'Screen Print S1', utilization: 92, status: 'active', throughput: 680 },
    { name: 'Screen Print S2', utilization: 78, status: 'active', throughput: 520 },
    { name: 'Heat Press H1', utilization: 65, status: 'active', throughput: 380 },
    { name: 'Embroidery M2', utilization: 94, status: 'bottleneck', throughput: 490 },
    { name: 'Cutting C1', utilization: 71, status: 'active', throughput: 890 },
  ];

  const mockWorkforce = capacityData?.workforce || [
    { shift: 'Morning', workers: 24, productivity: 95 },
    { shift: 'Afternoon', workers: 22, productivity: 88 },
    { shift: 'Night', workers: 18, productivity: 82 },
  ];

  const mockForecast = capacityData?.forecast || [
    { week: 'Week 1', projected: 12500, capacity: 15000 },
    { week: 'Week 2', projected: 14200, capacity: 15000 },
    { week: 'Week 3', projected: 15800, capacity: 15000 },
    { week: 'Week 4', projected: 16200, capacity: 15000 },
  ];

  const mockProductionMix = [
    { name: 'Apparel', value: 45, color: '#8b5cf6' },
    { name: 'Promotional', value: 30, color: '#3b82f6' },
    { name: 'Packaging', value: 15, color: '#10b981' },
    { name: 'Other', value: 10, color: '#f59e0b' },
  ];

  const avgUtilization = mockMachines.reduce((acc: number, m: any) => acc + m.utilization, 0) / mockMachines.length;
  const bottlenecks = mockMachines.filter((m: any) => m.status === 'bottleneck').length;
  const totalWorkers = mockWorkforce.reduce((acc: number, s: any) => acc + s.workers, 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4 px-2")}>
      <div className={cn("flex items-center justify-between", isMobile && "flex-col items-start gap-3")}>
        <div>
          <h1 className={cn("font-bold tracking-tight", isMobile ? "text-xl" : "text-3xl")} data-testid="heading-capacity-dashboard">
            Production Capacity Dashboard
          </h1>
          <p className={cn("text-muted-foreground", isMobile && "text-sm")}>
            Monitor machine utilization, workforce, and capacity forecasting
          </p>
        </div>
        <HelpButton pageTitle="Production Capacity" helpItems={helpItems} />
      </div>

      {/* Key Metrics */}
      {isMobile ? (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-3">
            <Card data-testid="card-avg-utilization" className="min-w-[140px] shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
                <CardTitle className="text-xs font-medium">Avg Utilization</CardTitle>
                <Activity className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{avgUtilization.toFixed(0)}%</div>
                <p className="text-[10px] text-muted-foreground">All machines</p>
              </CardContent>
            </Card>

            <Card data-testid="card-bottlenecks" className="min-w-[140px] shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
                <CardTitle className="text-xs font-medium">Bottlenecks</CardTitle>
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold text-red-600">{bottlenecks}</div>
                <p className="text-[10px] text-muted-foreground">&gt;90% util</p>
              </CardContent>
            </Card>

            <Card data-testid="card-workforce" className="min-w-[140px] shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
                <CardTitle className="text-xs font-medium">Workforce</CardTitle>
                <Users className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{totalWorkers}</div>
                <p className="text-[10px] text-muted-foreground">Today</p>
              </CardContent>
            </Card>

            <Card data-testid="card-daily-throughput" className="min-w-[140px] shrink-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
                <CardTitle className="text-xs font-medium">Throughput</CardTitle>
                <Package className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">
                  {mockMachines.reduce((acc: number, m: any) => acc + m.throughput, 0).toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground">Units today</p>
              </CardContent>
            </Card>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card data-testid="card-avg-utilization">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgUtilization.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Across all machines</p>
            </CardContent>
          </Card>

          <Card data-testid="card-bottlenecks">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{bottlenecks}</div>
              <p className="text-xs text-muted-foreground">Machines at &gt;90%</p>
            </CardContent>
          </Card>

          <Card data-testid="card-workforce">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workforce</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkers}</div>
              <p className="text-xs text-muted-foreground">Total workers today</p>
            </CardContent>
          </Card>

          <Card data-testid="card-daily-throughput">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Throughput</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockMachines.reduce((acc: number, m: any) => acc + m.throughput, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Units produced today</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Machine Utilization & Production Mix */}
      <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "md:grid-cols-2")}>
        <Card data-testid="card-machine-utilization">
          <CardHeader className={cn(isMobile && "pb-2")}>
            <CardTitle className={cn(isMobile && "text-base")}>Machine Utilization</CardTitle>
            <CardDescription className={cn(isMobile && "text-xs")}>Current utilization by machine</CardDescription>
          </CardHeader>
          <CardContent className={cn(isMobile && "px-2")}>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <BarChart data={mockMachines} margin={isMobile ? { left: -20, right: 5 } : undefined}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={isMobile ? 60 : 100}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis 
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  label={isMobile ? undefined : { value: 'Utilization (%)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip />
                <Bar dataKey="utilization" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
            <div className={cn("mt-4 space-y-2", isMobile && "mt-2 space-y-1")}>
              {mockMachines.filter((m: any) => m.status === 'bottleneck').map((machine: any) => (
                <div key={machine.name} className={cn("flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/20", isMobile ? "p-2 gap-2" : "p-2")}>
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className={cn("text-red-500 shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    <span className={cn("font-medium truncate", isMobile ? "text-xs" : "text-sm")}>{machine.name}</span>
                  </div>
                  <Badge variant="destructive" className={cn(isMobile && "text-[10px] px-1.5 py-0")}>
                    {machine.utilization}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-production-mix">
          <CardHeader className={cn(isMobile && "pb-2")}>
            <CardTitle className={cn(isMobile && "text-base")}>Production Mix</CardTitle>
            <CardDescription className={cn(isMobile && "text-xs")}>Output by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
              <PieChart>
                <Pie
                  data={mockProductionMix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={isMobile ? undefined : (entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={isMobile ? 60 : 90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockProductionMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                {isMobile && <Legend wrapperStyle={{ fontSize: '10px' }} />}
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workforce & Forecast */}
      <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "md:grid-cols-2")}>
        <Card data-testid="card-workforce-allocation">
          <CardHeader className={cn(isMobile && "pb-2")}>
            <CardTitle className={cn(isMobile && "text-base")}>Workforce Allocation</CardTitle>
            <CardDescription className={cn(isMobile && "text-xs")}>Workers and productivity by shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn("space-y-3", isMobile && "space-y-2")}>
              {mockWorkforce.map((shift: any) => (
                <div key={shift.shift} className={cn("flex items-center justify-between border rounded-lg", isMobile ? "p-2" : "p-3")}>
                  <div>
                    <div className={cn("font-medium", isMobile && "text-sm")}>{shift.shift} Shift</div>
                    <div className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>{shift.workers} workers</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-medium", isMobile && "text-sm")}>{shift.productivity}%</div>
                    <div className={cn("text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>Productivity</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-capacity-forecast">
          <CardHeader className={cn(isMobile && "pb-2")}>
            <CardTitle className={cn(isMobile && "text-base")}>Capacity Forecast</CardTitle>
            <CardDescription className={cn(isMobile && "text-xs")}>Projected demand vs. available capacity</CardDescription>
          </CardHeader>
          <CardContent className={cn(isMobile && "px-2")}>
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 250}>
              <LineChart data={mockForecast} margin={isMobile ? { left: -20, right: 5 } : undefined}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                <Tooltip />
                {!isMobile && <Legend />}
                <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={2} name="Projected Demand" />
                <Line type="monotone" dataKey="capacity" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Max Capacity" />
              </LineChart>
            </ResponsiveContainer>
            {isMobile && (
              <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-blue-500" />
                  <span>Projected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-emerald-500 border-dashed" style={{ borderTop: '2px dashed' }} />
                  <span>Capacity</span>
                </div>
              </div>
            )}
            {mockForecast.some((w: any) => w.projected > w.capacity) && (
              <div className={cn("mt-4 rounded-lg flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20", isMobile ? "p-2 mt-2" : "p-3")}>
                <AlertTriangle className={cn("text-yellow-600 flex-shrink-0 mt-0.5", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                <div>
                  <div className={cn("font-medium text-yellow-800 dark:text-yellow-400", isMobile && "text-sm")}>Capacity Warning</div>
                  <div className={cn("text-yellow-700 dark:text-yellow-500", isMobile ? "text-xs" : "text-sm")}>
                    {isMobile ? "Demand exceeds capacity soon." : "Projected demand exceeds capacity in upcoming weeks. Consider adding shifts or outsourcing."}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
