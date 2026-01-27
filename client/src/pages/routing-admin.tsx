/**
 * Routing Admin Dashboard
 *
 * Admin interface for managing order routing, pending assignments,
 * and viewing routing history.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Inbox,
  History,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Factory,
  Package,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PendingJob {
  jobId: number;
  orderId: number;
  orderCode: string;
  routingReason: string;
  createdAt: string;
  lineItemCount: number;
  lineItems: Array<{
    id: number;
    variantId: number;
    productName: string;
    variantSku: string;
    qtyTotal: number;
  }>;
}

interface RoutingHistoryEntry {
  jobId: number;
  orderId: number;
  orderCode: string;
  manufacturerId: number | null;
  manufacturerName: string | null;
  routedBy: string;
  routingReason: string;
  createdAt: string;
}

interface RoutingStats {
  totalJobs: number;
  routingCounts: {
    auto: number;
    manual: number;
    fallback: number;
    pending: number;
  };
  splitOrderCount: number;
  pendingAssignmentCount: number;
}

interface Manufacturer {
  id: number;
  name: string;
  country: string | null;
  zone: string | null;
  capabilities: string[] | null;
  isActive: boolean;
  acceptingNewOrders: boolean;
}

export default function RoutingAdmin() {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>("");
  const [assignReason, setAssignReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch routing stats
  const { data: stats } = useQuery<RoutingStats>({
    queryKey: ["/api/admin/routing/stats"],
    refetchInterval: 30000,
  });

  // Fetch pending jobs
  const { data: pendingJobs = [], isLoading: loadingPending } = useQuery<PendingJob[]>({
    queryKey: ["/api/admin/routing/pending"],
    refetchInterval: 30000,
  });

  // Fetch routing history
  const { data: routingHistory = [], isLoading: loadingHistory } = useQuery<RoutingHistoryEntry[]>({
    queryKey: ["/api/admin/routing/history"],
  });

  // Fetch available manufacturers
  const { data: manufacturers = [] } = useQuery<Manufacturer[]>({
    queryKey: ["/api/admin/routing/manufacturers"],
  });

  // Assign job mutation
  const assignMutation = useMutation({
    mutationFn: async (data: { jobId: number; manufacturerId: number; reason: string }) => {
      return apiRequest("/api/admin/routing/assign", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({ title: "Job assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/routing/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/routing/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/routing/history"] });
      setAssignDialogOpen(false);
      setSelectedJob(null);
      setSelectedManufacturer("");
      setAssignReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to assign job", description: error.message, variant: "destructive" });
    },
  });

  // Re-route job mutation
  const rerouteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return apiRequest("/api/admin/routing/reroute", {
        method: "POST",
        body: JSON.stringify({ jobId }),
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Job re-routed successfully" });
      } else {
        toast({ title: "Could not find suitable manufacturer", variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/routing/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/routing/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/routing/history"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to re-route job", description: error.message, variant: "destructive" });
    },
  });

  const openAssignDialog = (job: PendingJob) => {
    setSelectedJob(job);
    setAssignDialogOpen(true);
  };

  const handleAssign = () => {
    if (!selectedJob || !selectedManufacturer) return;

    assignMutation.mutate({
      jobId: selectedJob.jobId,
      manufacturerId: parseInt(selectedManufacturer),
      reason: assignReason || "Manual assignment",
    });
  };

  const filteredPendingJobs = pendingJobs.filter(
    (job) =>
      job.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.lineItems.some((item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const filteredHistory = routingHistory.filter(
    (entry) =>
      entry.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.manufacturerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Routing</h1>
          <p className="text-muted-foreground">
            Manage automatic manufacturer assignment and pending orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground">All manufacturing jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Routed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.routingCounts.auto || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalJobs
                ? `${Math.round(((stats?.routingCounts.auto || 0) / stats.totalJobs) * 100)}% of total`
                : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.pendingAssignmentCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires manual action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Split Orders</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.splitOrderCount || 0}</div>
            <p className="text-xs text-muted-foreground">Multi-manufacturer orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Inbox className="h-4 w-4" />
            Pending Assignment
            {(stats?.pendingAssignmentCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats?.pendingAssignmentCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Routing History
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Pending Assignment Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Awaiting Assignment</CardTitle>
              <CardDescription>
                These orders could not be automatically routed to a manufacturer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPendingJobs.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">
                    No pending assignments at the moment
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingJobs.map((job) => (
                      <TableRow key={job.jobId}>
                        <TableCell>
                          <span className="font-mono text-sm">{job.orderCode}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {job.lineItems.slice(0, 2).map((item) => (
                              <div key={item.id} className="text-sm">
                                {item.productName}
                              </div>
                            ))}
                            {job.lineItems.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{job.lineItems.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.lineItems.reduce((sum, item) => sum + (item.qtyTotal || 0), 0)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {job.routingReason}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(job.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rerouteMutation.mutate(job.jobId)}
                              disabled={rerouteMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Re-route
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openAssignDialog(job)}
                            >
                              Assign
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routing History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Routing History</CardTitle>
              <CardDescription>
                Recent routing decisions and manufacturer assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Routed By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((entry) => (
                      <TableRow key={entry.jobId}>
                        <TableCell>
                          <span className="font-mono text-sm">{entry.orderCode}</span>
                        </TableCell>
                        <TableCell>
                          {entry.manufacturerName || (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.routedBy === "auto"
                                ? "default"
                                : entry.routedBy === "fallback"
                                ? "secondary"
                                : entry.routedBy === "manual"
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {entry.routedBy}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground max-w-xs truncate block">
                            {entry.routingReason}
                          </span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(entry.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Routing Breakdown</CardTitle>
                <CardDescription>How orders are being routed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Auto-routed</span>
                    </div>
                    <span className="font-bold">{stats?.routingCounts.auto || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>Fallback</span>
                    </div>
                    <span className="font-bold">{stats?.routingCounts.fallback || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      <span>Manual</span>
                    </div>
                    <span className="font-bold">{stats?.routingCounts.manual || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      <span>Pending</span>
                    </div>
                    <span className="font-bold">{stats?.routingCounts.pending || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Routing Efficiency</CardTitle>
                <CardDescription>Automation success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-green-600">
                    {stats?.totalJobs
                      ? Math.round(
                          (((stats?.routingCounts.auto || 0) + (stats?.routingCounts.fallback || 0)) /
                            stats.totalJobs) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-muted-foreground mt-2">
                    Orders routed automatically (including fallbacks)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign to Manufacturer</DialogTitle>
            <DialogDescription>
              Manually assign order {selectedJob?.orderCode} to a manufacturer
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Line Items:</h4>
                <div className="space-y-1 text-sm">
                  {selectedJob.lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.productName}</span>
                      <span className="text-muted-foreground">x{item.qtyTotal}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Original Routing Reason:</h4>
                <p className="text-sm text-muted-foreground">{selectedJob.routingReason}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Manufacturer</label>
                <Select
                  value={selectedManufacturer}
                  onValueChange={setSelectedManufacturer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a manufacturer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers
                      .filter((m) => m.isActive && m.acceptingNewOrders)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{m.name}</span>
                            {m.country && (
                              <span className="text-muted-foreground">({m.country})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Assignment</label>
                <Textarea
                  placeholder="Why is this manufacturer being selected?"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedManufacturer || assignMutation.isPending}
            >
              {assignMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
