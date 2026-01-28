/**
 * V6 Design Job Detail Page
 * Full design job view with brief, files, mockups, and revision tracking
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { canModify } from "@/lib/permissions";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  Trash2,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  Mail,
  Calendar,
  Package,
  Palette,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Play,
  Eye,
  MessageSquare,
  Flame,
  ArrowUp,
  Copy,
  Link2,
} from "lucide-react";

// V6 Components
import {
  StatusBadgeV6,
  DESIGN_JOB_STATUS_CONFIG,
  type DesignJobStatusV6,
} from "@/components/v6";
import { ActivityFeed } from "@/components/v6";
import { FileSection } from "@/components/v6";

// Types
interface ColorSpec {
  name: string;
  hex: string;
  pantone?: string;
}

interface LogoPlacement {
  location: string;
  position: string;
  maxSize: string;
}

interface DesignJob {
  id: number;
  jobCode: string;
  title: string;
  organizationId: number;
  organizationName?: string;
  orderId?: number;
  orderCode?: string;
  orderName?: string;
  status: DesignJobStatusV6;
  urgency: "low" | "normal" | "high" | "rush";
  brief?: string;
  requirements?: string;
  productType?: string;
  printMethod?: string;
  colorSpecs?: ColorSpec[];
  logoPlacement?: LogoPlacement[];
  outputFormats?: string[];
  deadline?: string;
  assignedDesignerId?: string;
  assignedDesignerName?: string;
  assignedDesignerEmail?: string;
  currentRevision: number;
  totalRevisions: number;
  revisionLimit?: number;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvalMethod?: string;
  internalNotes?: string;
  clientFeedback?: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
}

interface Mockup {
  id: string;
  revisionNumber: number;
  filename: string;
  url: string;
  viewName?: string;
  uploadedAt: string;
  uploadedByName?: string;
}

interface Revision {
  revisionNumber: number;
  status: "approved" | "needs_revision" | "current";
  submittedAt?: string;
  feedback?: string;
  feedbackByName?: string;
  mockups: Mockup[];
}

const URGENCY_CONFIG = {
  rush: { label: "Rush", color: "text-red-500 bg-red-500/10 border-red-500/30", icon: Flame },
  high: { label: "High", color: "text-orange-500 bg-orange-500/10 border-orange-500/30", icon: ArrowUp },
  normal: { label: "Normal", color: "text-slate-500 bg-slate-500/10 border-slate-500/30", icon: null },
  low: { label: "Low", color: "text-slate-400 bg-slate-400/10 border-slate-400/30", icon: null },
};

export default function DesignJobDetailV6() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/design-jobs/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const jobId = params?.id ? parseInt(params.id, 10) : null;

  // State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);

  // Fetch job
  const { data: job, isLoading } = useQuery<DesignJob>({
    queryKey: [`/api/design-jobs/${jobId}`],
    enabled: !!jobId,
  });

  // Fetch revisions
  const { data: revisions = [] } = useQuery<Revision[]>({
    queryKey: [`/api/design-jobs/${jobId}/revisions`],
    enabled: !!jobId,
  });

  // Status mutations
  const statusMutation = useMutation({
    mutationFn: async (status: DesignJobStatusV6) => {
      const res = await apiRequest("PATCH", `/api/design-jobs/${jobId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-jobs/${jobId}`] });
      toast({ title: "Status updated" });
      setIsStatusModalOpen(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (note?: string) => {
      const res = await apiRequest("POST", `/api/design-jobs/${jobId}/approve`, { note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-jobs/${jobId}`] });
      toast({ title: "Design approved" });
      setIsApprovalModalOpen(false);
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: async (feedbackText: string) => {
      const res = await apiRequest("POST", `/api/design-jobs/${jobId}/request-revision`, {
        feedback: feedbackText,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/design-jobs/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/design-jobs/${jobId}/revisions`] });
      toast({ title: "Revision requested" });
      setIsRevisionModalOpen(false);
      setFeedback("");
    },
  });

  const isDesigner = user?.role === "designer" && job?.assignedDesignerId === user?.id;
  const canApprove = user?.role === "admin" || user?.role === "ops" || user?.role === "sales";

  if (!match || !jobId) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => setLocation("/design-jobs")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Design Jobs
        </Button>
        <div className="mt-8 text-center text-muted-foreground">
          Design job not found
        </div>
      </div>
    );
  }

  if (isLoading || !job) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const urgencyConfig = URGENCY_CONFIG[job.urgency];
  const UrgencyIcon = urgencyConfig.icon;
  const currentRevision = revisions.find((r) => r.revisionNumber === job.currentRevision);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/design-jobs">Design Jobs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{job.jobCode}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{job.jobCode}</h1>
            <StatusBadgeV6 type="design" status={job.status} />
            {(job.urgency === "rush" || job.urgency === "high") && (
              <Badge variant="outline" className={cn("gap-1", urgencyConfig.color)}>
                {UrgencyIcon && <UrgencyIcon className="w-3 h-3" />}
                {urgencyConfig.label}
              </Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground">{job.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {canModify(user, "designJobs") && (
            <Button variant="outline" onClick={() => setLocation(`/design-jobs/${jobId}/edit`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Job
              </DropdownMenuItem>
              {job.orderId && (
                <DropdownMenuItem onClick={() => setLocation(`/orders/${job.orderId}`)}>
                  <Link2 className="w-4 h-4 mr-2" />
                  View Order
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-6 text-sm">
              {job.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Deadline: {format(new Date(job.deadline), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>
                  Revision {job.currentRevision} of {job.revisionLimit || "∞"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {job.assignedDesignerName ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {job.assignedDesignerName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{job.assignedDesignerName}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Brief & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {job.brief && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{job.brief}</p>
                </div>
              )}

              {/* Requirements */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.productType && (
                    <div>
                      <p className="text-xs text-muted-foreground">Product Type</p>
                      <p className="text-sm">{job.productType}</p>
                    </div>
                  )}
                  {job.printMethod && (
                    <div>
                      <p className="text-xs text-muted-foreground">Print Method</p>
                      <p className="text-sm">{job.printMethod}</p>
                    </div>
                  )}
                </div>

                {/* Color Palette */}
                {job.colorSpecs && job.colorSpecs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Color Palette</p>
                    <div className="flex flex-wrap gap-2">
                      {job.colorSpecs.map((color, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
                          onClick={() => navigator.clipboard.writeText(color.hex)}
                        >
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div>
                            <p className="text-sm font-medium">{color.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {color.hex}
                              {color.pantone && ` / ${color.pantone}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logo Placement */}
                {job.logoPlacement && job.logoPlacement.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Logo Placement</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Location</th>
                            <th className="px-3 py-2 text-left font-medium">Position</th>
                            <th className="px-3 py-2 text-left font-medium">Max Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.logoPlacement.map((placement, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">{placement.location}</td>
                              <td className="px-3 py-2">{placement.position}</td>
                              <td className="px-3 py-2">{placement.maxSize}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Output Formats */}
                {job.outputFormats && job.outputFormats.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground uppercase">Output Requirements</p>
                    <div className="flex flex-wrap gap-2">
                      {job.outputFormats.map((format) => (
                        <Badge key={format} variant="secondary">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileSection
                entityType="design_job"
                entityId={jobId.toString()}
                organizationId={job.organizationId}
                showFolders={["customer_assets", "mockups", "production_files", "other"]}
              />
            </CardContent>
          </Card>

          {/* Mockups / Revisions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Mockups (Revision {job.currentRevision})
              </CardTitle>
              {isDesigner && job.status === "in_progress" && (
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Mockup
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {currentRevision && currentRevision.mockups.length > 0 ? (
                <div className="space-y-4">
                  {/* Mockup Gallery */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentRevision.mockups.map((mockup) => (
                      <div
                        key={mockup.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border"
                        onClick={() => setSelectedMockup(mockup)}
                      >
                        <img
                          src={mockup.url}
                          alt={mockup.viewName || mockup.filename}
                          className="w-full h-40 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                        {mockup.viewName && (
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-xs text-white">{mockup.viewName}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Feedback (if needs revision) */}
                  {job.status === "needs_revision" && currentRevision.feedback && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Revision Requested</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {currentRevision.feedback}
                          </p>
                          {currentRevision.feedbackByName && (
                            <p className="text-xs text-muted-foreground mt-2">
                              — {currentRevision.feedbackByName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Actions */}
                  {job.status === "review" && canApprove && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => setIsApprovalModalOpen(true)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve Design
                      </Button>
                      <Button variant="outline" onClick={() => setIsRevisionModalOpen(true)}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Request Revision
                      </Button>
                    </div>
                  )}

                  {/* Designer Actions */}
                  {isDesigner && job.status === "in_progress" && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => statusMutation.mutate("review")}>
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Review
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No mockups uploaded yet</p>
                  {isDesigner && (
                    <Button size="sm" variant="outline" className="mt-3">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload First Mockup
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Revisions */}
          {revisions.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Previous Revisions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {revisions
                  .filter((r) => r.revisionNumber < job.currentRevision)
                  .sort((a, b) => b.revisionNumber - a.revisionNumber)
                  .map((revision) => (
                    <Collapsible
                      key={revision.revisionNumber}
                      open={expandedRevision === revision.revisionNumber}
                      onOpenChange={(open) =>
                        setExpandedRevision(open ? revision.revisionNumber : null)
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              Revision {revision.revisionNumber}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                revision.status === "approved" &&
                                  "text-green-500 border-green-500/30",
                                revision.status === "needs_revision" &&
                                  "text-yellow-500 border-yellow-500/30"
                              )}
                            >
                              {revision.status === "approved" ? "Approved" : "Needs Revision"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {revision.mockups.length} mockups
                            </span>
                            {expandedRevision === revision.revisionNumber ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                          {revision.feedback && (
                            <div className="text-sm">
                              <p className="font-medium">Feedback:</p>
                              <p className="text-muted-foreground">{revision.feedback}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-4 gap-2">
                            {revision.mockups.map((mockup) => (
                              <img
                                key={mockup.id}
                                src={mockup.url}
                                alt={mockup.filename}
                                className="w-full h-20 object-cover rounded cursor-pointer"
                                onClick={() => setSelectedMockup(mockup)}
                              />
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                entityType="design_job"
                entityId={jobId.toString()}
                showCommentInput
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Job Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(job.createdAt), "MMM d, yyyy")}</span>
              </div>
              {job.createdByName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created By</span>
                  <span>{job.createdByName}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization</span>
                <a
                  href={`/organizations/${job.organizationId}`}
                  className="text-primary hover:underline"
                >
                  {job.organizationName}
                </a>
              </div>
              {job.orderId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <a href={`/orders/${job.orderId}`} className="text-primary hover:underline">
                    {job.orderCode}
                  </a>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Designer</span>
                {job.assignedDesignerName ? (
                  <span>{job.assignedDesignerName}</span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deadline</span>
                {job.deadline ? (
                  <span>{format(new Date(job.deadline), "MMM d, yyyy")}</span>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revision</span>
                <span>
                  {job.currentRevision} of {job.revisionLimit || "∞"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isDesigner && job.status === "assigned" && (
                <Button
                  className="w-full justify-start"
                  onClick={() => statusMutation.mutate("in_progress")}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Work
                </Button>
              )}
              {isDesigner && job.status === "in_progress" && (
                <Button className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Mockup
                </Button>
              )}
              {job.status === "approved" && (
                <Button className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Final Files
                </Button>
              )}
              {canApprove && job.status === "review" && (
                <>
                  <Button className="w-full justify-start" onClick={() => setIsApprovalModalOpen(true)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Design
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => setIsRevisionModalOpen(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Request Revision
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Revision History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Revision History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {revisions
                .sort((a, b) => b.revisionNumber - a.revisionNumber)
                .map((revision) => (
                  <div
                    key={revision.revisionNumber}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                        revision.revisionNumber === job.currentRevision &&
                          "bg-primary text-primary-foreground",
                        revision.status === "approved" &&
                          "bg-green-500/20 text-green-500",
                        revision.status === "needs_revision" &&
                          "bg-yellow-500/20 text-yellow-500"
                      )}
                    >
                      {revision.revisionNumber}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        {revision.revisionNumber === job.currentRevision
                          ? "Current"
                          : revision.status === "approved"
                          ? "Approved"
                          : "Needs Revision"}
                      </p>
                      {revision.submittedAt && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(revision.submittedAt), "MMM d")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                entityType="design_job"
                entityId={jobId.toString()}
                showCommentInput={false}
                compact
                limit={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Design</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This indicates the design is ready for production files.
            </p>
            <Textarea
              placeholder="Add approval notes (optional)..."
              className="mt-4"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => approveMutation.mutate(feedback || undefined)}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Request Modal */}
      <Dialog open={isRevisionModalOpen} onOpenChange={setIsRevisionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide feedback for the designer on what needs to be changed.
            </p>
            <Textarea
              placeholder="Describe what changes are needed..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => requestRevisionMutation.mutate(feedback)}
              disabled={!feedback.trim()}
            >
              Request Revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mockup Preview Modal */}
      <Dialog open={!!selectedMockup} onOpenChange={() => setSelectedMockup(null)}>
        <DialogContent className="max-w-4xl">
          {selectedMockup && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedMockup.viewName || selectedMockup.filename}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center p-4">
                <img
                  src={selectedMockup.url}
                  alt={selectedMockup.filename}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Uploaded {formatDistanceToNow(new Date(selectedMockup.uploadedAt), { addSuffix: true })}
                  {selectedMockup.uploadedByName && ` by ${selectedMockup.uploadedByName}`}
                </span>
                <Button variant="outline" asChild>
                  <a href={selectedMockup.url} download={selectedMockup.filename}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
