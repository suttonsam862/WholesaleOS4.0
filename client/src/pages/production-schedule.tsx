import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpButton } from "@/components/help-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2, XCircle, Search, FileText, DollarSign } from "lucide-react";

const helpItems = [
  {
    question: "What is the Size Checking System?",
    answer: "This system verifies that order line items match the quantities and specifications in quotes and invoices. It helps prevent shipping errors and billing discrepancies.",
  },
  {
    question: "What does 'Mismatch' mean?",
    answer: "A mismatch occurs when the order quantities don't match the quote or invoice. Common causes: manual entry errors, last-minute changes not updated across documents, or missing size breakdown.",
    example: "Order shows 100 units, but invoice only bills for 85 units → Quantity Mismatch"
  },
  {
    question: "How do I resolve a mismatch?",
    answer: "Click 'View Details' on any mismatched order. Compare the order, quote, and invoice side-by-side. Contact sales to verify the correct quantities, then update the order or regenerate the invoice.",
  },
  {
    question: "Can this system auto-fix discrepancies?",
    answer: "No, the system only identifies mismatches. Human verification is required to ensure the correct data source (order, quote, or invoice) is used for the fix.",
  }
];

interface OrderCheck {
  id: number;
  orderName: string;
  orgName: string;
  orderTotal: number;
  quoteTotal?: number;
  invoiceTotal?: number;
  orderQty: number;
  quoteQty?: number;
  invoiceQty?: number;
  status: 'match' | 'mismatch' | 'missing-data';
  issues: string[];
  lastChecked: string;
}

export function SizeChecker() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: checks = [], isLoading } = useQuery<OrderCheck[]>({
    queryKey: ["/api/size-checks"],
  });

  const mockChecks: OrderCheck[] = checks.length > 0 ? checks : [
    {
      id: 1,
      orderName: "Spring Team Uniforms",
      orgName: "Sports United",
      orderTotal: 5000,
      quoteTotal: 5000,
      invoiceTotal: 5000,
      orderQty: 100,
      quoteQty: 100,
      invoiceQty: 100,
      status: 'match',
      issues: [],
      lastChecked: '2024-01-20T10:30:00',
    },
    {
      id: 2,
      orderName: "Corporate Apparel Order",
      orgName: "TechCorp Industries",
      orderTotal: 8500,
      quoteTotal: 8500,
      invoiceTotal: 7200,
      orderQty: 150,
      quoteQty: 150,
      invoiceQty: 120,
      status: 'mismatch',
      issues: ['Invoice quantity mismatch', 'Invoice total mismatch'],
      lastChecked: '2024-01-22T14:15:00',
    },
    {
      id: 3,
      orderName: "Promo Merchandise",
      orgName: "Green Foods Co",
      orderTotal: 3200,
      quoteTotal: 3200,
      invoiceTotal: undefined,
      orderQty: 80,
      quoteQty: 80,
      invoiceQty: undefined,
      status: 'missing-data',
      issues: ['No invoice generated yet'],
      lastChecked: '2024-01-21T09:00:00',
    },
    {
      id: 4,
      orderName: "Event T-Shirts",
      orgName: "Annual Summit 2024",
      orderTotal: 4500,
      quoteTotal: 4200,
      invoiceTotal: 4500,
      orderQty: 200,
      quoteQty: 180,
      invoiceQty: 200,
      status: 'mismatch',
      issues: ['Quote quantity mismatch', 'Quote total mismatch'],
      lastChecked: '2024-01-23T11:45:00',
    },
  ];

  const filteredChecks = mockChecks.filter(check =>
    check.orderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    check.orgName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchedChecks = filteredChecks.filter(c => c.status === 'match');
  const mismatchedChecks = filteredChecks.filter(c => c.status === 'mismatch');
  const missingDataChecks = filteredChecks.filter(c => c.status === 'missing-data');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'mismatch':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'missing-data':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Verified</Badge>;
      case 'mismatch':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Mismatch</Badge>;
      case 'missing-data':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Incomplete</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text" data-testid="heading-size-checker">Size Checking System</h1>
          <p className="text-muted-foreground">Verify order quantities match quotes and invoices</p>
        </div>
        <HelpButton pageTitle="Size Checking System" helpItems={helpItems} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-verified" className="glass-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Verified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{matchedChecks.length}</div>
            <p className="text-xs text-muted-foreground">All documents match</p>
          </CardContent>
        </Card>

        <Card data-testid="card-mismatches" className="glass-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Mismatches</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{mismatchedChecks.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-incomplete" className="glass-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Incomplete</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{missingDataChecks.length}</div>
            <p className="text-xs text-muted-foreground">Missing data</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order name or organization..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-black/20 border-white/10 text-white"
          data-testid="input-search-checks"
        />
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md">
          <TabsTrigger value="all" data-testid="tab-all-checks" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">All ({filteredChecks.length})</TabsTrigger>
          <TabsTrigger value="mismatch" data-testid="tab-mismatches" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">Mismatches ({mismatchedChecks.length})</TabsTrigger>
          <TabsTrigger value="verified" data-testid="tab-verified" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">Verified ({matchedChecks.length})</TabsTrigger>
          <TabsTrigger value="incomplete" data-testid="tab-incomplete" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">Incomplete ({missingDataChecks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-3">
            {filteredChecks.map((check) => (
              <Card key={check.id} data-testid={`check-card-${check.id}`} className="glass-card border-white/10 hover:bg-white/5 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(check.status)}
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{check.orderName}</div>
                      <div className="text-sm text-muted-foreground">{check.orgName}</div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          Order: {check.orderQty} units
                        </span>
                        {check.quoteQty !== undefined && (
                          <span className={check.quoteQty !== check.orderQty ? 'text-red-400 font-medium' : 'text-muted-foreground'}>
                            Quote: {check.quoteQty} units
                          </span>
                        )}
                        {check.invoiceQty !== undefined && (
                          <span className={check.invoiceQty !== check.orderQty ? 'text-red-400 font-medium' : 'text-muted-foreground'}>
                            Invoice: {check.invoiceQty} units
                          </span>
                        )}
                      </div>
                      {check.issues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {check.issues.map((issue, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">{issue}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(check.status)}
                    <Button size="sm" variant="outline" data-testid={`button-view-${check.id}`} className="border-white/10 hover:bg-white/10">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mismatch" className="mt-6">
          <div className="space-y-3">
            {mismatchedChecks.map((check) => (
              <Card key={check.id} className="glass-card border-red-500/30" data-testid={`mismatch-card-${check.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <div className="font-medium text-foreground">{check.orderName}</div>
                        <div className="text-sm text-muted-foreground">{check.orgName}</div>
                      </div>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mb-3">
                    <div className="font-medium text-sm text-red-400 mb-2">Issues Found:</div>
                    <ul className="list-disc list-inside text-sm text-red-400 space-y-1">
                      {check.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-muted-foreground">Order</div>
                      <div className="font-medium text-foreground">{check.orderQty} units</div>
                      <div className="text-muted-foreground">${check.orderTotal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quote</div>
                      <div className={`font-medium ${check.quoteQty !== check.orderQty ? 'text-red-400' : 'text-foreground'}`}>
                        {check.quoteQty || '—'} units
                      </div>
                      <div className={check.quoteTotal !== check.orderTotal ? 'text-red-400' : 'text-muted-foreground'}>
                        ${check.quoteTotal?.toLocaleString() || '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Invoice</div>
                      <div className={`font-medium ${check.invoiceQty !== check.orderQty ? 'text-red-400' : 'text-foreground'}`}>
                        {check.invoiceQty || '—'} units
                      </div>
                      <div className={check.invoiceTotal !== check.orderTotal ? 'text-red-400' : 'text-muted-foreground'}>
                        ${check.invoiceTotal?.toLocaleString() || '—'}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full bg-red-500 hover:bg-red-600 text-white" variant="destructive">Resolve Mismatch</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          <div className="space-y-3">
            {matchedChecks.map((check) => (
              <Card key={check.id} className="glass-card border-green-500/30" data-testid={`verified-card-${check.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="font-medium text-foreground">{check.orderName}</div>
                      <div className="text-sm text-muted-foreground">{check.orgName}</div>
                      <div className="text-sm text-green-500 mt-1">
                        {check.orderQty} units • ${check.orderTotal.toLocaleString()} - All documents match
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incomplete" className="mt-6">
          <div className="space-y-3">
            {missingDataChecks.map((check) => (
              <Card key={check.id} className="glass-card border-yellow-500/30" data-testid={`incomplete-card-${check.id}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{check.orderName}</div>
                      <div className="text-sm text-muted-foreground">{check.orgName}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {check.issues.map((issue, idx) => (
                          <Badge key={idx} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{issue}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(check.status)}
                    <Button size="sm" variant="outline" className="border-white/10 hover:bg-white/10">Complete Data</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}