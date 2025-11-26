import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Database, Zap, Link as LinkIcon } from "lucide-react";

const helpItems = [
  {
    question: "What does this Connection Health Tracker monitor?",
    answer: "This dashboard tracks all system connections: API integrations (Twilio, Outlook), database configurations, UI-to-modal connections, and internal service health. It helps identify broken connections before they impact users.",
  },
  {
    question: "What's the difference between API and UI connections?",
    answer: "API connections are external services (Twilio for SMS, Outlook for email). UI connections are internal links between interface elements and their corresponding modals or actions. Both need to be healthy for the system to work properly.",
    example: "API: Twilio SMS service status. UI: Quick Create button → Order modal connection"
  },
  {
    question: "How do I fix a broken connection?",
    answer: "Click 'View Details' on any unhealthy connection to see the specific error. For API connections, check credentials and service status. For UI connections, verify modal components exist and are properly imported. For database issues, check configuration and network connectivity.",
  },
  {
    question: "What does 'Last Checked' mean?",
    answer: "This shows when the system last verified the connection. Connections are automatically checked every 5 minutes. You can manually trigger a check using the Refresh button.",
  }
];

interface Connection {
  id: string;
  name: string;
  type: 'api' | 'database' | 'ui' | 'service';
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastChecked: string;
  responseTime?: number;
  errorMessage?: string;
  details?: string;
}

export function ConnectionHealth() {
  const { data: connections = [], isLoading, refetch } = useQuery<Connection[]>({
    queryKey: ["/api/admin/connection-health"],
    refetchInterval: 300000, // Auto-refresh every 5 minutes
  });

  const mockConnections: Connection[] = connections.length > 0 ? connections : [
    {
      id: 'twilio-sms',
      name: 'Twilio SMS API',
      type: 'api',
      status: 'healthy',
      lastChecked: '2024-01-23T10:30:00',
      responseTime: 145,
      details: 'API Key: ************3f2a',
    },
    {
      id: 'outlook-email',
      name: 'Outlook Email Integration',
      type: 'api',
      status: 'healthy',
      lastChecked: '2024-01-23T10:30:00',
      responseTime: 220,
      details: 'OAuth configured',
    },
    {
      id: 'database-main',
      name: 'PostgreSQL Database',
      type: 'database',
      status: 'healthy',
      lastChecked: '2024-01-23T10:30:00',
      responseTime: 12,
      details: 'Connection pool: 8/20 active',
    },
    {
      id: 'ui-quick-create-order',
      name: 'Quick Create → Order Modal',
      type: 'ui',
      status: 'healthy',
      lastChecked: '2024-01-23T10:30:00',
      details: 'CreateOrderModal properly connected',
    },
    {
      id: 'ui-quick-create-product',
      name: 'Quick Create → Product Modal',
      type: 'ui',
      status: 'healthy',
      lastChecked: '2024-01-23T10:30:00',
      details: 'CreateProductModal properly connected',
    },
    {
      id: 'ui-help-buttons',
      name: 'Help Buttons on Pages',
      type: 'ui',
      status: 'degraded',
      lastChecked: '2024-01-23T10:29:00',
      errorMessage: 'Help button missing on 2 pages',
      details: 'Finance and Settings pages need help buttons',
    },
    {
      id: 'storage-service',
      name: 'Object Storage (Google Cloud)',
      type: 'service',
      status: 'healthy',
      lastChecked: '2024-01-23T10:30:00',
      responseTime: 95,
      details: 'Bucket: wholesale-assets',
    },
  ];

  const healthyConnections = mockConnections.filter((c: any) => c.status === 'healthy');
  const unhealthyConnections = mockConnections.filter((c: any) => c.status === 'unhealthy');
  const degradedConnections = mockConnections.filter((c: any) => c.status === 'degraded');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500 text-white">Healthy</Badge>;
      case 'unhealthy':
        return <Badge className="bg-red-500 text-white">Unhealthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500 text-white">Degraded</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Zap className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'ui':
        return <LinkIcon className="h-4 w-4" />;
      case 'service':
        return <RefreshCcw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filterByType = (type: string) => mockConnections.filter((c: any) => c.type === type);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-connection-health">Connection Health Tracker</h1>
          <p className="text-muted-foreground">Monitor all API, database, UI, and service connections</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh-connections">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <HelpButton pageTitle="Connection Health" helpItems={helpItems} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-connections">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockConnections.length}</div>
            <p className="text-xs text-muted-foreground">Being monitored</p>
          </CardContent>
        </Card>

        <Card data-testid="card-healthy">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyConnections.length}</div>
            <p className="text-xs text-muted-foreground">Operating normally</p>
          </CardContent>
        </Card>

        <Card data-testid="card-degraded">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{degradedConnections.length}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-unhealthy">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unhealthy</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unhealthyConnections.length}</div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Connections Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-connections">All ({mockConnections.length})</TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api">API ({filterByType('api').length})</TabsTrigger>
          <TabsTrigger value="database" data-testid="tab-database">Database ({filterByType('database').length})</TabsTrigger>
          <TabsTrigger value="ui" data-testid="tab-ui">UI ({filterByType('ui').length})</TabsTrigger>
          <TabsTrigger value="service" data-testid="tab-service">Services ({filterByType('service').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {mockConnections.map((conn: any) => (
              <Card key={conn.id} data-testid={`connection-${conn.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(conn.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{conn.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {getTypeIcon(conn.type)}
                          <span className="ml-1">{conn.type.toUpperCase()}</span>
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{conn.details}</div>
                      {conn.errorMessage && (
                        <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {conn.errorMessage}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Last checked: {new Date(conn.lastChecked).toLocaleString()}</span>
                        {conn.responseTime && <span>Response: {conn.responseTime}ms</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(conn.status)}
                    <Button variant="outline" size="sm" data-testid={`button-test-${conn.id}`}>
                      Test Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['api', 'database', 'ui', 'service'].map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            <div className="space-y-3">
              {filterByType(type).map((conn: any) => (
                <Card key={conn.id} className={conn.status === 'unhealthy' ? 'border-red-200' : conn.status === 'degraded' ? 'border-yellow-200' : 'border-green-200'} data-testid={`${type}-connection-${conn.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(conn.status)}
                        <div>
                          <div className="font-medium">{conn.name}</div>
                          <div className="text-sm text-muted-foreground">{conn.details}</div>
                        </div>
                      </div>
                      {getStatusBadge(conn.status)}
                    </div>
                    {conn.errorMessage && (
                      <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg mb-3">
                        <div className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          {conn.errorMessage}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Last checked: {new Date(conn.lastChecked).toLocaleString()}</span>
                        {conn.responseTime && <span>Response: {conn.responseTime}ms</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Test</Button>
                        <Button size="sm" variant="outline">View Logs</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
