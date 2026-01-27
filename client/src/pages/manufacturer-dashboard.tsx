import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  MANUFACTURER_JOB_STATUSES,
  MANUFACTURER_JOB_STATUS_LABELS,
  MANUFACTURER_JOB_STATUS_CONFIG,
  type ManufacturerJobStatus,
} from "@shared/constants";
import {
  Factory,
  Package,
  CheckCircle2,
  Clock,
  Search,
  LayoutGrid,
  List,
  Truck,
  ClipboardCheck,
  Eye,
  ChevronRight,
  Inbox,
  Camera,
  AlertCircle,
  Calendar,
  Building2,
  FileText,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Icon mapping for dynamic rendering
const iconMap: Record<string, any> = {
  Inbox,
  CheckCircle: CheckCircle2,
  Factory,
  ClipboardCheck,
  Package,
  Truck,
  AlertCircle,
  Clock,
};

interface ManufacturerJob {
  id: number;
  manufacturingId: number;
  orderId: number;
  manufacturerId: number | null;
  status: ManufacturerJobStatus;
  orderCode: string;
  orderName: string;
  orgName: string;
  orgLogo?: string;
  totalUnits: number;
  priority: string;
  dueDate: string | null;
  acceptedAt: string | null;
  shippedAt: string | null;
  productFamily?: string;
  decorationMethod?: string;
  specialInstructions: string | null;
  photos?: { url: string; caption: string; uploadedAt: string }[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  newJobs: number;
  inProgress: number;
  readyToShip: number;
  shippedThisWeek: number;
  overdueJobs: number;
  avgTurnaroundDays: number;
}

export default function ManufacturerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<ManufacturerJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [statusChangeNotes, setStatusChangeNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState<ManufacturerJobStatus | null>(null);

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/manufacturer-dashboard/stats"],
    queryFn: async () => {
      const res = await fetch("/api/manufacturer-dashboard/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery<ManufacturerJob[]>({
    queryKey: ["/api/manufacturer-dashboard/jobs", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all"
        ? "/api/manufacturer-dashboard/jobs"
        : `/api/manufacturer-dashboard/jobs?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, newStatus, notes }: { jobId: number; newStatus: ManufacturerJobStatus; notes?: string }) => {
      const res = await fetch(`/api/manufacturer-dashboard/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer-dashboard"] });
      setIsDetailOpen(false);
      setSelectedJob(null);
      setPendingStatus(null);
      setStatusChangeNotes("");
      toast({
        title: "Status Updated",
        description: "Job status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Filter jobs by search
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const query = searchQuery.toLowerCase();
    return jobs.filter(job =>
      job.orderCode.toLowerCase().includes(query) ||
      job.orderName.toLowerCase().includes(query) ||
      job.orgName.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  // Group jobs by status for board view
  const jobsByStatus = useMemo(() => {
    const grouped: Record<ManufacturerJobStatus, ManufacturerJob[]> = {
      new: [],
      accepted: [],
      in_production: [],
      qc: [],
      ready_to_ship: [],
      shipped: [],
    };
    filteredJobs.forEach(job => {
      if (grouped[job.status]) {
        grouped[job.status].push(job);
      }
    });
    return grouped;
  }, [filteredJobs]);

  // Get next valid status for a job
  const getNextStatus = (currentStatus: ManufacturerJobStatus): ManufacturerJobStatus | null => {
    const transitions: Record<ManufacturerJobStatus, ManufacturerJobStatus | null> = {
      new: "accepted",
      accepted: "in_production",
      in_production: "qc",
      qc: "ready_to_ship",
      ready_to_ship: "shipped",
      shipped: null,
    };
    return transitions[currentStatus];
  };

  const handleStatusChange = (job: ManufacturerJob, newStatus: ManufacturerJobStatus) => {
    setSelectedJob(job);
    setPendingStatus(newStatus);
  };

  const confirmStatusChange = () => {
    if (!selectedJob || !pendingStatus) return;
    updateStatusMutation.mutate({
      jobId: selectedJob.id,
      newStatus: pendingStatus,
      notes: statusChangeNotes || undefined,
    });
  };

  const openJobDetail = (job: ManufacturerJob) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Factory className="h-8 w-8 text-purple-400" />
            Manufacturer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your production jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="glass-card border-white/10 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-400">New Jobs</p>
                <h3 className="text-2xl font-bold text-white">{stats?.newJobs || 0}</h3>
              </div>
              <Inbox className="h-6 w-6 text-amber-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-purple-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-400">In Progress</p>
                <h3 className="text-2xl font-bold text-white">{stats?.inProgress || 0}</h3>
              </div>
              <Factory className="h-6 w-6 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-emerald-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-400">Ready to Ship</p>
                <h3 className="text-2xl font-bold text-white">{stats?.readyToShip || 0}</h3>
              </div>
              <Package className="h-6 w-6 text-emerald-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-green-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-400">Shipped (Week)</p>
                <h3 className="text-2xl font-bold text-white">{stats?.shippedThisWeek || 0}</h3>
              </div>
              <Truck className="h-6 w-6 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-400">Overdue</p>
                <h3 className="text-2xl font-bold text-white">{stats?.overdueJobs || 0}</h3>
              </div>
              <AlertCircle className="h-6 w-6 text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-400">Avg Days</p>
                <h3 className="text-2xl font-bold text-white">{stats?.avgTurnaroundDays || 0}</h3>
              </div>
              <Clock className="h-6 w-6 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {MANUFACTURER_JOB_STATUSES.map(status => (
              <SelectItem key={status} value={status}>
                {MANUFACTURER_JOB_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ minWidth: "1200px" }}>
            {MANUFACTURER_JOB_STATUSES.map(status => {
              const config = MANUFACTURER_JOB_STATUS_CONFIG[status];
              const statusJobs = jobsByStatus[status] || [];
              const IconComponent = iconMap[config.icon] || Factory;

              return (
                <div key={status} className="flex-1 min-w-[280px]">
                  <div
                    className="p-3 rounded-t-lg border-b-2"
                    style={{
                      backgroundColor: `${config.color}10`,
                      borderBottomColor: config.color
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" style={{ color: config.color }} />
                        <span className="font-semibold text-sm" style={{ color: config.color }}>
                          {MANUFACTURER_JOB_STATUS_LABELS[status]}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {statusJobs.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 p-2 bg-black/20 rounded-b-lg min-h-[400px]">
                    <AnimatePresence>
                      {statusJobs.map(job => (
                        <motion.div
                          key={job.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          <Card
                            className="glass-card border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                            onClick={() => openJobDetail(job)}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {job.orderCode}
                                  </p>
                                  <p className="font-medium text-sm truncate max-w-[180px]">
                                    {job.orderName}
                                  </p>
                                </div>
                                {job.priority === "urgent" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                <span className="truncate">{job.orgName}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Package className="h-3 w-3" />
                                  <span>{job.totalUnits} units</span>
                                </div>
                                {job.dueDate && (
                                  <div className="flex items-center gap-1 text-amber-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(job.dueDate), "MMM d")}</span>
                                  </div>
                                )}
                              </div>
                              {status !== "shipped" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full mt-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextStatus = getNextStatus(status);
                                    if (nextStatus) handleStatusChange(job, nextStatus);
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4 mr-1" />
                                  Move to {MANUFACTURER_JOB_STATUS_LABELS[getNextStatus(status) || status]}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {statusJobs.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-8">
                        No jobs
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="glass-card border-white/10">
          <div className="divide-y divide-white/10">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No jobs found
              </div>
            ) : (
              filteredJobs.map(job => {
                const config = MANUFACTURER_JOB_STATUS_CONFIG[job.status];
                return (
                  <div
                    key={job.id}
                    className="p-4 hover:bg-white/5 cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => openJobDetail(job)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12">
                        <OrgLogo
                          src={job.orgLogo}
                          orgName={job.orgName}
                          className="w-12 h-12 rounded-lg"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {job.orderCode}
                          </span>
                          <Badge
                            style={{
                              backgroundColor: `${config.color}20`,
                              color: config.color,
                              borderColor: config.color
                            }}
                          >
                            {MANUFACTURER_JOB_STATUS_LABELS[job.status]}
                          </Badge>
                          {job.priority === "urgent" && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                        </div>
                        <p className="font-medium">{job.orderName}</p>
                        <p className="text-sm text-muted-foreground">{job.orgName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Units</p>
                        <p className="font-semibold">{job.totalUnits}</p>
                      </div>
                      {job.dueDate && (
                        <div className="text-center">
                          <p className="text-muted-foreground text-xs">Due</p>
                          <p className="font-semibold">{format(new Date(job.dueDate), "MMM d")}</p>
                        </div>
                      )}
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Job Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <OrgLogo
                    src={selectedJob.orgLogo}
                    orgName={selectedJob.orgName}
                    className="w-10 h-10 rounded-lg"
                  />
                  <div>
                    <span className="font-mono text-sm text-muted-foreground block">
                      {selectedJob.orderCode}
                    </span>
                    {selectedJob.orderName}
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedJob.orgName} - {selectedJob.totalUnits} units
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="mt-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                  <TabsTrigger value="instructions">Instructions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  {/* Current Status */}
                  <div className="p-4 rounded-lg" style={{
                    backgroundColor: `${MANUFACTURER_JOB_STATUS_CONFIG[selectedJob.status].color}10`
                  }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Status</p>
                        <p className="text-lg font-semibold" style={{
                          color: MANUFACTURER_JOB_STATUS_CONFIG[selectedJob.status].color
                        }}>
                          {MANUFACTURER_JOB_STATUS_LABELS[selectedJob.status]}
                        </p>
                      </div>
                      {getNextStatus(selectedJob.status) && (
                        <Button
                          onClick={() => {
                            const nextStatus = getNextStatus(selectedJob.status);
                            if (nextStatus) handleStatusChange(selectedJob, nextStatus);
                          }}
                        >
                          <ChevronRight className="h-4 w-4 mr-1" />
                          Move to {MANUFACTURER_JOB_STATUS_LABELS[getNextStatus(selectedJob.status)!]}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Job Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Priority</Label>
                      <p className="font-medium capitalize">{selectedJob.priority}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Due Date</Label>
                      <p className="font-medium">
                        {selectedJob.dueDate
                          ? format(new Date(selectedJob.dueDate), "MMM d, yyyy")
                          : "Not set"}
                      </p>
                    </div>
                    {selectedJob.productFamily && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Product Family</Label>
                        <p className="font-medium">{selectedJob.productFamily}</p>
                      </div>
                    )}
                    {selectedJob.decorationMethod && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Decoration Method</Label>
                        <p className="font-medium capitalize">{selectedJob.decorationMethod.replace('_', ' ')}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="photos" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Upload progress photos for QC</p>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                  {selectedJob.photos && selectedJob.photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {selectedJob.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                          <img
                            src={photo.url}
                            alt={photo.caption || `Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {photo.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                              <p className="text-xs text-white">{photo.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No photos uploaded yet</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="instructions" className="space-y-4 mt-4">
                  {selectedJob.specialInstructions ? (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-400 mb-2">Special Instructions</p>
                          <p className="text-sm whitespace-pre-wrap">{selectedJob.specialInstructions}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No special instructions</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Modal */}
      <Dialog open={!!pendingStatus && !isDetailOpen} onOpenChange={(open) => {
        if (!open) {
          setPendingStatus(null);
          setStatusChangeNotes("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Move {selectedJob?.orderCode} to {pendingStatus ? MANUFACTURER_JOB_STATUS_LABELS[pendingStatus] : ""}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes about this status change..."
                value={statusChangeNotes}
                onChange={(e) => setStatusChangeNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingStatus(null);
                setStatusChangeNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
