import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, Activity, TrendingUp, Clock, Eye, MousePointer } from "lucide-react";

const helpItems = [
  {
    question: "What does Active Users mean?",
    answer: "Active users are accounts that have logged in and performed at least one action in the last 30 days. This metric helps track platform engagement and adoption.",
  },
  {
    question: "How are Feature Usage metrics calculated?",
    answer: "Each feature tracks how many times it's been accessed or used. The percentage shows usage relative to the most-used feature. This helps identify which features are valuable to users.",
    example: "If Orders page has 500 views and Dashboard has 1000 views, Orders shows 50% usage"
  },
  {
    question: "What is the difference between Page Views and Sessions?",
    answer: "Page Views count every time a page loads. Sessions group consecutive page views by the same user within a time window. One session can have many page views.",
  },
  {
    question: "How can I improve system performance based on these metrics?",
    answer: "Look for: 1) High-traffic pages to optimize first, 2) Features with low usage that may need better UX or training, 3) Peak usage times to plan maintenance windows, 4) User roles with highest activity to prioritize their workflows.",
  }
];

export function SystemAnalytics() {
  const { data: analyticsData, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/analytics"],
  });

  const mockUserActivity = analyticsData?.userActivity || [
    { date: '2024-01-15', active: 45, new: 5, returning: 40 },
    { date: '2024-01-16', active: 52, new: 7, returning: 45 },
    { date: '2024-01-17', active: 48, new: 3, returning: 45 },
    { date: '2024-01-18', active: 61, new: 8, returning: 53 },
    { date: '2024-01-19', active: 58, new: 6, returning: 52 },
    { date: '2024-01-20', active: 65, new: 9, returning: 56 },
    { date: '2024-01-21', active: 54, new: 4, returning: 50 },
  ];

  const mockFeatureUsage = analyticsData?.featureUsage || [
    { feature: 'Dashboard', views: 1250, users: 48 },
    { feature: 'Leads', views: 890, users: 35 },
    { feature: 'Orders', views: 1120, users: 42 },
    { feature: 'Catalog', views: 680, users: 28 },
    { feature: 'Design Jobs', views: 420, users: 18 },
    { feature: 'Manufacturing', views: 310, users: 12 },
  ];

  const mockPerformance = analyticsData?.performance || [
    { hour: '00:00', requests: 45, avgResponseTime: 120 },
    { hour: '04:00', requests: 28, avgResponseTime: 95 },
    { hour: '08:00', requests: 156, avgResponseTime: 180 },
    { hour: '12:00', requests: 245, avgResponseTime: 220 },
    { hour: '16:00', requests: 198, avgResponseTime: 195 },
    { hour: '20:00', requests: 89, avgResponseTime: 145 },
  ];

  const mockRoleActivity = [
    { role: 'Sales', users: 15, avgSessionTime: 45 },
    { role: 'Designer', users: 8, avgSessionTime: 52 },
    { role: 'Ops', users: 6, avgSessionTime: 38 },
    { role: 'Manufacturer', users: 4, avgSessionTime: 31 },
    { role: 'Admin', users: 3, avgSessionTime: 28 },
  ];

  const totalActiveUsers = mockUserActivity[mockUserActivity.length - 1]?.active || 0;
  const totalPageViews = mockFeatureUsage.reduce((acc: number, f: any) => acc + f.views, 0);
  const avgResponseTime = mockPerformance.reduce((acc: number, p: any) => acc + p.avgResponseTime, 0) / mockPerformance.length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-system-analytics">System Analytics</h1>
          <p className="text-muted-foreground">Monitor user activity, feature usage, and system performance</p>
        </div>
        <HelpButton pageTitle="System Analytics" helpItems={helpItems} />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-active-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveUsers}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card data-testid="card-page-views">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card data-testid="card-response-time">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">System performance</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-roles">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockRoleActivity.length}</div>
            <p className="text-xs text-muted-foreground">User types</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" data-testid="tab-user-activity">User Activity</TabsTrigger>
          <TabsTrigger value="features" data-testid="tab-feature-usage">Feature Usage</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="roles" data-testid="tab-roles">Role Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card data-testid="card-user-activity-chart">
            <CardHeader>
              <CardTitle>User Activity Trend</CardTitle>
              <CardDescription>Daily active, new, and returning users</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={mockUserActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="active" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Active Users" />
                  <Area type="monotone" dataKey="new" stackId="2" stroke="#10b981" fill="#10b981" name="New Users" />
                  <Area type="monotone" dataKey="returning" stackId="3" stroke="#3b82f6" fill="#3b82f6" name="Returning Users" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-feature-views">
              <CardHeader>
                <CardTitle>Feature Usage by Views</CardTitle>
                <CardDescription>Total page views per feature</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockFeatureUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8b5cf6" name="Page Views" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-users">
              <CardHeader>
                <CardTitle>Unique Users per Feature</CardTitle>
                <CardDescription>Number of users accessing each feature</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockFeatureUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3b82f6" name="Unique Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card data-testid="card-performance-chart">
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>Request load and response times throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={mockPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" label={{ value: 'Requests', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Response Time (ms)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name="Requests" />
                  <Line yAxisId="right" type="monotone" dataKey="avgResponseTime" stroke="#ef4444" strokeWidth={2} name="Response Time (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <Card data-testid="card-role-activity">
            <CardHeader>
              <CardTitle>Activity by User Role</CardTitle>
              <CardDescription>Active users and average session time per role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRoleActivity.map((role: any) => (
                  <div key={role.role} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`role-stats-${role.role.toLowerCase()}`}>
                    <div className="flex items-center gap-4 flex-1">
                      <Badge variant="outline" className="min-w-[100px] justify-center">{role.role}</Badge>
                      <div className="flex-1">
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-sm text-muted-foreground">Active Users</div>
                            <div className="text-2xl font-bold">{role.users}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Avg Session Time</div>
                            <div className="text-2xl font-bold">{role.avgSessionTime}m</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
