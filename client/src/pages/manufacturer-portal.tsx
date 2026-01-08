import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Factory, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter,
  Calendar,
  LayoutGrid,
  List,
  Scissors,
  Printer,
  Truck,
  PackageCheck,
  RefreshCcw,
  Eye,
  ChevronRight,
  Lock,
  Inbox,
  FileSearch,
  Beaker,
  ClipboardCheck,
  Shirt,
  ChevronDown,
  History,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const iconMap: Record<string, any> = {
  Inbox,
  FileSearch,
  Lock,
  Package,
  Beaker,
  Clock,
  CheckCircle: CheckCircle2,
  RefreshCw: RefreshCcw,
  Scissors,
  Printer,
  Shirt,
  ClipboardCheck,
  PackageCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Factory,
};

interface ManufacturerStatusConfig {
  value: string;
  label: string;
  color: string;
  icon: string;
  zone: string;
  order: number;
  publicStatus: string;
}

interface ManufacturerJob {
  id: number;
  manufacturingId: number;
  orderId: number;
  manufacturerId: number | null;
  manufacturerStatus: string;
  publicStatus: string;
  requiredDeliveryDate: string | null;
  promisedShipDate: string | null;
  eventDate: string | null;
  sampleRequired: boolean;
  specsLocked: boolean;
  printMethod: string | null;
  priority: string;
  specialInstructions: string | null;
  internalNotes: string | null;
  createdAt: string;
  manufacturing?: any;
  order?: any;
  manufacturer?: any;
  events?: any[];
}

interface ManufacturerEvent {
  id: number;
  eventType: string;
  title: string;
  description: string | null;
  previousValue: string | null;
  newValue: string | null;
  createdBy: string;
  createdAt: string;
  createdByUser?: { name: string };
}

export default function ManufacturerPortal() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<ManufacturerJob | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusChangeNotes, setStatusChangeNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: config } = useQuery<{ statuses: ManufacturerStatusConfig[] }>({
    queryKey: ["/api/manufacturer-portal/config"],
    staleTime: 1000 * 60 * 60,
  });

  const { data: jobs = [], isLoading: jobsLoading, refetch } = useQuery<ManufacturerJob[]>({
    queryKey: ["/api/manufacturer-portal/jobs"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ jobId, status, notes }: { jobId: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/manufacturer-portal/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ manufacturerStatus: status, notes }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer-portal/jobs"] });
      toast({ title: "Status updated", description: "Job status has been updated successfully." });
      setPendingStatus(null);
      setStatusChangeNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to update status",
        variant: "destructive" 
      });
    },
  });

  const zones = useMemo(() => {
    if (!config?.statuses) return [];
    const zoneSet = new Set(config.statuses.map(s => s.zone));
    const uniqueZones: string[] = [];
    zoneSet.forEach(zone => uniqueZones.push(zone));
    return uniqueZones;
  }, [config]);

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.order?.orderCode?.toLowerCase().includes(query) ||
        job.order?.orderName?.toLowerCase().includes(query) ||
        job.manufacturer?.name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(job => job.manufacturerStatus === statusFilter);
    }

    if (zoneFilter !== "all" && config?.statuses) {
      const statusesInZone = config.statuses.filter(s => s.zone === zoneFilter).map(s => s.value);
      result = result.filter(job => statusesInZone.includes(job.manufacturerStatus));
    }

    return result;
  }, [jobs, searchQuery, statusFilter, zoneFilter, config]);

  const jobsByStatus = useMemo(() => {
    const grouped: Record<string, ManufacturerJob[]> = {};
    config?.statuses?.forEach(status => {
      grouped[status.value] = filteredJobs.filter(job => job.manufacturerStatus === status.value);
    });
    return grouped;
  }, [filteredJobs, config]);

  const stats = useMemo(() => ({
    total: jobs.length,
    intake: jobs.filter(j => ['intake_pending', 'specs_lock_review'].includes(j.manufacturerStatus)).length,
    production: jobs.filter(j => ['bulk_cutting', 'bulk_print_emb_sublim', 'bulk_stitching', 'bulk_qc'].includes(j.manufacturerStatus)).length,
    completed: jobs.filter(j => j.manufacturerStatus === 'delivered_confirmed').length,
  }), [jobs]);

  const handleStatusChange = (jobId: number, newStatus: string) => {
    setPendingStatus(newStatus);
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
    }
  };

  const confirmStatusChange = () => {
    if (selectedJob && pendingStatus) {
      statusMutation.mutate({
        jobId: selectedJob.id,
        status: pendingStatus,
        notes: statusChangeNotes || undefined,
      });
    }
  };

  const openJobDetail = (job: ManufacturerJob) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  const getStatusConfig = (status: string) => {
    return config?.statuses?.find(s => s.value === status);
  };

  const getNextStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      intake_pending: ['specs_lock_review'],
      specs_lock_review: ['specs_locked'],
      specs_locked: ['materials_reserved'],
      materials_reserved: ['samples_in_progress', 'bulk_cutting'],
      samples_in_progress: ['samples_awaiting_approval'],
      samples_awaiting_approval: ['samples_approved', 'samples_revise'],
      samples_approved: ['bulk_cutting'],
      samples_revise: ['samples_in_progress'],
      bulk_cutting: ['bulk_print_emb_sublim', 'bulk_stitching'],
      bulk_print_emb_sublim: ['bulk_stitching'],
      bulk_stitching: ['bulk_qc'],
      bulk_qc: ['packing_complete'],
      packing_complete: ['handed_to_carrier'],
      handed_to_carrier: ['delivered_confirmed'],
      delivered_confirmed: [],
    };
    return transitions[currentStatus] || [];
  };

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCcw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white" data-testid="text-page-title">
            Manufacturer Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Internal workflow management with fine-grained status tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/10 bg-blue-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-400">Total Jobs</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-total-jobs">{stats.total}</h3>
            </div>
            <Factory className="h-8 w-8 text-blue-400 opacity-50" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-amber-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-400">Intake</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-intake-jobs">{stats.intake}</h3>
            </div>
            <Inbox className="h-8 w-8 text-amber-400 opacity-50" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-purple-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-400">In Production</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-production-jobs">{stats.production}</h3>
            </div>
            <Scissors className="h-8 w-8 text-purple-400 opacity-50" />
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10 bg-green-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Delivered</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-delivered-jobs">{stats.completed}</h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400 opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order code, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/20 border-white/10"
              data-testid="input-search"
            />
          </div>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[160px] bg-black/20 border-white/10" data-testid="select-zone-filter">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(zone => (
                <SelectItem key={zone} value={zone} className="capitalize">{zone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] bg-black/20 border-white/10" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {config?.statuses?.map(status => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("board")}
            data-testid="button-view-board"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "board" ? (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {config?.statuses?.map(status => {
              const Icon = iconMap[status.icon] || Package;
              const jobsInStatus = jobsByStatus[status.value] || [];
              
              return (
                <div
                  key={status.value}
                  className="w-[300px] flex-shrink-0"
                  data-testid={`column-${status.value}`}
                >
                  <div 
                    className="flex items-center gap-2 mb-3 px-2"
                    style={{ color: status.color }}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{status.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {jobsInStatus.length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 min-h-[200px] bg-black/10 rounded-lg p-2">
                    <AnimatePresence>
                      {jobsInStatus.map(job => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="cursor-pointer"
                          onClick={() => openJobDetail(job)}
                          data-testid={`card-job-${job.id}`}
                        >
                          <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-white text-sm">
                                    {job.order?.orderCode || `#${job.orderId}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {job.order?.orderName}
                                  </p>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px]",
                                    job.priority === 'urgent' && "border-red-500/50 text-red-400",
                                    job.priority === 'high' && "border-orange-500/50 text-orange-400",
                                    job.priority === 'normal' && "border-blue-500/50 text-blue-400",
                                    job.priority === 'low' && "border-gray-500/50 text-gray-400",
                                  )}
                                >
                                  {job.priority}
                                </Badge>
                              </div>
                              
                              {job.requiredDeliveryDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>Due: {format(new Date(job.requiredDeliveryDate), "MMM d")}</span>
                                </div>
                              )}
                              
                              {job.sampleRequired && (
                                <Badge variant="outline" className="mt-2 text-[10px] border-purple-500/50 text-purple-400">
                                  Sample Required
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {jobsInStatus.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No jobs in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <Card className="glass-card border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-muted-foreground font-medium">Order</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Public Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Priority</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Due Date</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => {
                  const statusConfig = getStatusConfig(job.manufacturerStatus);
                  return (
                    <tr 
                      key={job.id} 
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => openJobDetail(job)}
                      data-testid={`row-job-${job.id}`}
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-white">{job.order?.orderCode || `#${job.orderId}`}</div>
                          <div className="text-sm text-muted-foreground">{job.order?.orderName}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: `${statusConfig?.color}50`, 
                            color: statusConfig?.color,
                            backgroundColor: `${statusConfig?.color}15`
                          }}
                        >
                          {statusConfig?.label || job.manufacturerStatus}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-muted-foreground">
                          {job.publicStatus.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn(
                          job.priority === 'urgent' && "border-red-500/50 text-red-400 bg-red-500/10",
                          job.priority === 'high' && "border-orange-500/50 text-orange-400 bg-orange-500/10",
                          job.priority === 'normal' && "border-blue-500/50 text-blue-400 bg-blue-500/10",
                          job.priority === 'low' && "border-gray-500/50 text-gray-400 bg-gray-500/10",
                        )}>
                          {job.priority}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {job.requiredDeliveryDate 
                          ? format(new Date(job.requiredDeliveryDate), "MMM d, yyyy")
                          : "-"
                        }
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openJobDetail(job); }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Job Details - {selectedJob?.order?.orderCode}
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.order?.orderName}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Current Status</Label>
                  <div className="mt-1">
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: `${getStatusConfig(selectedJob.manufacturerStatus)?.color}50`, 
                        color: getStatusConfig(selectedJob.manufacturerStatus)?.color,
                        backgroundColor: `${getStatusConfig(selectedJob.manufacturerStatus)?.color}15`
                      }}
                    >
                      {getStatusConfig(selectedJob.manufacturerStatus)?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Public Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedJob.publicStatus.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn(
                      selectedJob.priority === 'urgent' && "border-red-500/50 text-red-400",
                      selectedJob.priority === 'high' && "border-orange-500/50 text-orange-400",
                    )}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Sample Required</Label>
                  <div className="mt-1">
                    {selectedJob.sampleRequired ? (
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No</span>
                    )}
                  </div>
                </div>
              </div>

              {selectedJob.requiredDeliveryDate && (
                <div>
                  <Label className="text-muted-foreground text-xs">Required Delivery</Label>
                  <p className="text-sm mt-1">{format(new Date(selectedJob.requiredDeliveryDate), "MMMM d, yyyy")}</p>
                </div>
              )}

              {selectedJob.specialInstructions && (
                <div>
                  <Label className="text-muted-foreground text-xs">Special Instructions</Label>
                  <p className="text-sm mt-1 bg-black/20 p-3 rounded-lg">{selectedJob.specialInstructions}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground text-xs mb-2 block">Move to Next Stage</Label>
                <div className="flex flex-wrap gap-2">
                  {getNextStatuses(selectedJob.manufacturerStatus).map(nextStatus => {
                    const nextConfig = getStatusConfig(nextStatus);
                    return (
                      <Button
                        key={nextStatus}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selectedJob.id, nextStatus)}
                        style={{ borderColor: nextConfig?.color, color: nextConfig?.color }}
                        data-testid={`button-move-to-${nextStatus}`}
                      >
                        <ChevronRight className="h-3 w-3 mr-1" />
                        {nextConfig?.label}
                      </Button>
                    );
                  })}
                  {getNextStatuses(selectedJob.manufacturerStatus).length === 0 && (
                    <p className="text-muted-foreground text-sm">This job is complete.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-muted-foreground text-xs">Event History</Label>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedJob.events && selectedJob.events.length > 0 ? (
                    selectedJob.events.map((event: ManufacturerEvent) => (
                      <div key={event.id} className="bg-black/20 p-3 rounded-lg text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{event.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-muted-foreground text-xs">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          by {event.createdByUser?.name || 'Unknown'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No events yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingStatus} onOpenChange={() => { setPendingStatus(null); setStatusChangeNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Move this job to "{getStatusConfig(pendingStatus || '')?.label}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this status change..."
                value={statusChangeNotes}
                onChange={(e) => setStatusChangeNotes(e.target.value)}
                className="mt-2"
                data-testid="input-status-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingStatus(null); setStatusChangeNotes(""); }}>
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange} 
              disabled={statusMutation.isPending}
              data-testid="button-confirm-status-change"
            >
              {statusMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
