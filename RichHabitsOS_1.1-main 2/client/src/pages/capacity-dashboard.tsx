import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, AlertTriangle, Users, Package } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-capacity-dashboard">Production Capacity Dashboard</h1>
          <p className="text-muted-foreground">Monitor machine utilization, workforce, and capacity forecasting</p>
        </div>
        <HelpButton pageTitle="Production Capacity" helpItems={helpItems} />
      </div>

      {/* Key Metrics */}
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

      {/* Machine Utilization */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-machine-utilization">
          <CardHeader>
            <CardTitle>Machine Utilization</CardTitle>
            <CardDescription>Current utilization by machine</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockMachines}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="utilization" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {mockMachines.filter((m: any) => m.status === 'bottleneck').map((machine: any) => (
                <div key={machine.name} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">{machine.name}</span>
                  </div>
                  <Badge variant="destructive">Bottleneck - {machine.utilization}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-production-mix">
          <CardHeader>
            <CardTitle>Production Mix</CardTitle>
            <CardDescription>Output by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockProductionMix}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockProductionMix.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Workforce & Forecast */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-workforce-allocation">
          <CardHeader>
            <CardTitle>Workforce Allocation</CardTitle>
            <CardDescription>Workers and productivity by shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockWorkforce.map((shift: any) => (
                <div key={shift.shift} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{shift.shift} Shift</div>
                    <div className="text-sm text-muted-foreground">{shift.workers} workers</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{shift.productivity}%</div>
                    <div className="text-xs text-muted-foreground">Productivity</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-capacity-forecast">
          <CardHeader>
            <CardTitle>Capacity Forecast</CardTitle>
            <CardDescription>Projected demand vs. available capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={2} name="Projected Demand" />
                <Line type="monotone" dataKey="capacity" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Max Capacity" />
              </LineChart>
            </ResponsiveContainer>
            {mockForecast.some((w: any) => w.projected > w.capacity) && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800 dark:text-yellow-400">Capacity Overrun Warning</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-500">
                    Projected demand exceeds capacity in upcoming weeks. Consider adding shifts or outsourcing.
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
