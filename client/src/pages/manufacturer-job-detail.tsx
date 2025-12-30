import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  History,
  MessageSquare,
  FileText,
  Building2,
  User,
  Truck,
  Printer
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrgLogo } from "@/components/ui/org-logo";
import {
  getStageConfig,
  getAllowedTransitions,
  type ManufacturerFunnelStatus,
} from "@/lib/manufacturerFunnelConfig";

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

export default function ManufacturerJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState("");

  const { data: job, isLoading } = useQuery<ManufacturerJob>({
    queryKey: ["/api/manufacturer-portal/jobs", id],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturer-portal/jobs/${id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch job");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: events = [] } = useQuery<ManufacturerEvent[]>({
    queryKey: ["/api/manufacturer-portal/jobs", id, "events"],
    queryFn: async () => {
      const response = await fetch(`/api/manufacturer-portal/jobs/${id}/events`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const response = await fetch(`/api/manufacturer-portal/jobs/${id}/status`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer-portal/jobs", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturer-portal/jobs", id, "events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturing"] });
      toast({ title: "Status updated", description: "Job status has been updated successfully." });
      setIsStatusDialogOpen(false);
      setPendingStatus(null);
      setStatusNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const stageConfig = job ? getStageConfig(job.manufacturerStatus as ManufacturerFunnelStatus) : null;
  const allowedTransitions = job ? getAllowedTransitions(job.manufacturerStatus as ManufacturerFunnelStatus) : [];
  const StageIcon = stageConfig?.icon || Package;

  const pendingStageConfig = pendingStatus ? getStageConfig(pendingStatus as ManufacturerFunnelStatus) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
            <p className="text-white/60 mb-4">The job you're looking for doesn't exist.</p>
            <Link href="/manufacturer-portal">
              <Button data-testid="button-back-to-portal">Back to Portal</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOverdue = job.requiredDeliveryDate && new Date(job.requiredDeliveryDate) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/manufacturer-portal">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              {job.order?.organization?.logoUrl ? (
                <OrgLogo
                  src={job.order.organization.logoUrl}
                  orgName={job.order.organization.name}
                  size="md"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stageConfig?.color}20` }}
                >
                  <StageIcon className="w-6 h-6" style={{ color: stageConfig?.color }} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-order-code">
                  {job.order?.orderCode || `Job #${job.id}`}
                </h1>
                <p className="text-white/60 text-sm">
                  {job.order?.organization?.name || job.order?.orderName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {job.priority === "urgent" || job.priority === "high" ? (
              <Badge variant="destructive" data-testid="badge-priority">{job.priority}</Badge>
            ) : null}
            <Badge
              variant="outline"
              className="px-3 py-1.5"
              style={{ color: stageConfig?.color, borderColor: `${stageConfig?.color}50` }}
              data-testid="badge-status"
            >
              <StageIcon className="w-4 h-4 mr-2" />
              {stageConfig?.label || job.manufacturerStatus}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ChevronRight className="w-5 h-5" />
                  Next Action
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allowedTransitions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {allowedTransitions.map((transition) => {
                      const TransIcon = transition.icon;
                      return (
                        <Button
                          key={transition.value}
                          onClick={() => {
                            setPendingStatus(transition.value);
                            setIsStatusDialogOpen(true);
                          }}
                          className="flex items-center gap-2"
                          style={{
                            backgroundColor: `${transition.color}20`,
                            color: transition.color,
                            borderColor: `${transition.color}50`,
                          }}
                          variant="outline"
                          data-testid={`button-transition-${transition.value}`}
                        >
                          <TransIcon className="w-4 h-4" />
                          Move to {transition.label}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-white/60">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>This job has reached its final state.</span>
                  </div>
                )}

                {job.specialInstructions && (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h4 className="text-yellow-400 font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Special Instructions
                    </h4>
                    <p className="text-white/80 text-sm">{job.specialInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Job Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-white/5 border-white/10">
                    <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                    <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Order Name</Label>
                        <p className="text-white font-medium" data-testid="text-order-name">
                          {job.order?.orderName || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Print Method</Label>
                        <p className="text-white font-medium flex items-center gap-2" data-testid="text-print-method">
                          <Printer className="w-4 h-4" />
                          {job.printMethod || "Not specified"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Sample Required</Label>
                        <p className="text-white font-medium" data-testid="text-sample-required">
                          {job.sampleRequired ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/60 text-xs">Specs Locked</Label>
                        <p className="text-white font-medium" data-testid="text-specs-locked">
                          {job.specsLocked ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {job.internalNotes && (
                      <div className="mt-4">
                        <Label className="text-white/60 text-xs">Internal Notes</Label>
                        <p className="text-white/80 text-sm mt-1 p-3 bg-white/5 rounded-lg">
                          {job.internalNotes}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-4">
                    <ScrollArea className="h-[300px]">
                      {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-white/40">
                          <History className="w-8 h-8 mb-2" />
                          <p>No events recorded yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {events.map((event) => (
                            <div key={event.id} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                  {event.eventType === "status_change" ? (
                                    <ChevronRight className="w-4 h-4 text-blue-400" />
                                  ) : event.eventType === "note_added" ? (
                                    <MessageSquare className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-white/60" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm">{event.title}</p>
                                {event.description && (
                                  <p className="text-white/60 text-xs mt-0.5">{event.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                                  <span>{event.createdByUser?.name || "System"}</span>
                                  <span>•</span>
                                  <span>{format(new Date(event.createdAt), "MMM d, h:mm a")}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Required Delivery
                  </span>
                  <span className={cn("text-sm font-medium", isOverdue ? "text-red-400" : "text-white")} data-testid="text-delivery-date">
                    {job.requiredDeliveryDate
                      ? format(new Date(job.requiredDeliveryDate), "MMM d, yyyy")
                      : "Not set"}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Promised Ship
                  </span>
                  <span className="text-white text-sm font-medium" data-testid="text-ship-date">
                    {job.promisedShipDate
                      ? format(new Date(job.promisedShipDate), "MMM d, yyyy")
                      : "Not set"}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Event Date
                  </span>
                  <span className="text-white text-sm font-medium" data-testid="text-event-date">
                    {job.eventDate
                      ? format(new Date(job.eventDate), "MMM d, yyyy")
                      : "Not set"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-white/40" />
                  <span className="text-white text-sm" data-testid="text-client-name">
                    {job.order?.organization?.name || "Unknown Organization"}
                  </span>
                </div>
                {job.manufacturer && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-white/40" />
                    <span className="text-white text-sm" data-testid="text-manufacturer-name">
                      {job.manufacturer.name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Public Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-white/80 border-white/20" data-testid="badge-public-status">
                  {job.publicStatus?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Badge>
                <p className="text-xs text-white/40 mt-2">
                  This is the status visible to ops/management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Update Status</DialogTitle>
            <DialogDescription className="text-white/60">
              Move job to: <strong className="text-white">{pendingStageConfig?.label}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Notes (optional)</Label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="textarea-status-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setPendingStatus(null);
                setStatusNotes("");
              }}
              className="text-white/60"
              data-testid="button-cancel-status"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingStatus) {
                  statusMutation.mutate({ status: pendingStatus, notes: statusNotes || undefined });
                }
              }}
              disabled={statusMutation.isPending}
              style={{
                backgroundColor: pendingStageConfig?.color,
                color: "white",
              }}
              data-testid="button-confirm-status"
            >
              {statusMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
