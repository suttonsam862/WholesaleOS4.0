import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Palette,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  MoreVertical,
  Bell,
  RefreshCw,
  Loader2,
  Image,
  FileImage,
  Calendar,
  User,
  Sparkles,
  Eye,
  Upload,
  MessageSquare,
  Timer,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, isAfter } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StatusBadgeV6 } from "@/components/v6/StatusBadgeV6";

interface DesignJob {
  id: number;
  jobNumber: string;
  orderNumber: string;
  orderId: number;
  orderName: string;
  customerName: string;
  status: string;
  priority: "low" | "normal" | "high" | "rush";
  assignedDesigner?: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  brief: string;
  productType: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  revisionCount: number;
  maxRevisions: number;
  createdAt: string;
  updatedAt: string;
  customerAssets: number;
  mockupsUploaded: number;
  lastComment?: {
    author: string;
    message: string;
    timestamp: string;
  };
}

interface DesignerStats {
  assignedToMe: number;
  inProgress: number;
  pendingReview: number;
  completedThisWeek: number;
  totalHoursThisWeek: number;
  averageCompletionTime: number;
  approvalRate: number;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon?: React.ElementType }> = {
  rush: { label: "RUSH", color: "bg-red-500 text-white", icon: AlertTriangle },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  normal: { label: "Normal", color: "bg-gray-100 text-gray-600" },
  low: { label: "Low", color: "bg-blue-100 text-blue-700" },
};

function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  return (
    <Badge className={cn("text-xs", config.color)}>
      {config.icon && <config.icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

function DesignJobCard({
  job,
  onAction,
  isMyJob,
}: {
  job: DesignJob;
  onAction: (action: string, job: DesignJob) => void;
  isMyJob: boolean;
}) {
  const [, navigate] = useLocation();

  const isOverdue = job.dueDate && isAfter(new Date(), new Date(job.dueDate));
  const hoursUntilDue = job.dueDate
    ? differenceInHours(new Date(job.dueDate), new Date())
    : null;
  const isDueSoon = hoursUntilDue !== null && hoursUntilDue > 0 && hoursUntilDue < 24;

  const progressPercent = job.estimatedHours
    ? Math.min((job.actualHours || 0) / job.estimatedHours * 100, 100)
    : 0;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      job.priority === "rush" && "border-l-4 border-l-red-500",
      isOverdue && job.priority !== "rush" && "border-l-4 border-l-red-500",
      isDueSoon && !isOverdue && job.priority !== "rush" && "border-l-4 border-l-yellow-500"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/v6/design-jobs/${job.id}`)}
                className="font-semibold text-primary hover:underline"
              >
                {job.jobNumber}
              </button>
              <PriorityBadge priority={job.priority} />
              {isOverdue && <Badge variant="destructive" className="text-xs">OVERDUE</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{job.orderNumber} - {job.orderName}</p>
            <p className="text-xs text-muted-foreground">{job.customerName}</p>
          </div>
          <StatusBadgeV6 type="design" status={job.status} />
        </div>

        {/* Product & Brief */}
        <div className="mb-3">
          <Badge variant="outline" className="text-xs mb-2">{job.productType}</Badge>
          <p className="text-sm line-clamp-2">{job.brief}</p>
        </div>

        {/* Time Tracking */}
        {job.estimatedHours && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Time Progress</span>
              <span>{job.actualHours || 0}h / {job.estimatedHours}h</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          {job.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isOverdue ? (
                <span className="text-red-600 font-medium">
                  {formatDistanceToNow(new Date(job.dueDate))} overdue
                </span>
              ) : (
                <span>Due {format(new Date(job.dueDate), "MMM d")}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1">
            <FileImage className="h-3 w-3" />
            {job.customerAssets} assets
          </div>
          <div className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            {job.mockupsUploaded} mockups
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Rev {job.revisionCount}/{job.maxRevisions}
          </div>
        </div>

        {/* Last Comment */}
        {job.lastComment && (
          <div className="p-2 bg-muted/50 rounded text-xs mb-3">
            <span className="font-medium">{job.lastComment.author}:</span>{" "}
            <span className="text-muted-foreground line-clamp-1">{job.lastComment.message}</span>
          </div>
        )}

        {/* Assigned Designer */}
        {job.assignedDesigner && (
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={job.assignedDesigner.avatarUrl} />
              <AvatarFallback>{job.assignedDesigner.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{job.assignedDesigner.name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isMyJob && job.status === "assigned" && (
            <Button size="sm" onClick={() => onAction("start", job)}>
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          {isMyJob && job.status === "in_progress" && (
            <Button size="sm" onClick={() => onAction("upload", job)}>
              <Upload className="h-3 w-3 mr-1" />
              Upload Mockup
            </Button>
          )}
          {job.status === "pending_approval" && (
            <Button size="sm" variant="outline" onClick={() => onAction("view_mockups", job)}>
              <Eye className="h-3 w-3 mr-1" />
              View Mockups
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/v6/design-jobs/${job.id}`)}
          >
            Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction("log_time", job)}>
                Log Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("add_comment", job)}>
                Add Comment
              </DropdownMenuItem>
              {isMyJob && (
                <DropdownMenuItem onClick={() => onAction("reassign", job)}>
                  Request Reassignment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DesignerDashboardV6() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [viewFilter, setViewFilter] = useState<"my_queue" | "all">("my_queue");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch data
  const { data: jobs = [], isLoading: loadingJobs } = useQuery<DesignJob[]>({
    queryKey: ["/api/v6/dashboard/designer/jobs", viewFilter],
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery<DesignerStats>({
    queryKey: ["/api/v6/dashboard/designer/stats"],
    refetchInterval: 60000,
  });

  // Current user ID (would come from auth context in real app)
  const currentUserId = 1;

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    if (viewFilter === "my_queue") {
      filtered = filtered.filter((j) => j.assignedDesigner?.id === currentUserId);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((j) => j.status === statusFilter);
    }

    // Sort: Rush first, then by due date, then by priority
    return [...filtered].sort((a, b) => {
      if (a.priority === "rush" && b.priority !== "rush") return -1;
      if (b.priority === "rush" && a.priority !== "rush") return 1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [jobs, viewFilter, statusFilter, currentUserId]);

  const handleJobAction = (action: string, job: DesignJob) => {
    switch (action) {
      case "start":
        toast({ title: "Job started", description: `Now working on ${job.jobNumber}` });
        break;
      case "upload":
        navigate(`/v6/design-jobs/${job.id}?action=upload`);
        break;
      case "view_mockups":
        navigate(`/v6/design-jobs/${job.id}?tab=mockups`);
        break;
      case "log_time":
        toast({ title: "Opening time logger..." });
        break;
      case "add_comment":
        navigate(`/v6/design-jobs/${job.id}?action=comment`);
        break;
      default:
        toast({ title: `Action: ${action}` });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Designer Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/design-lab")}>
                <Sparkles className="h-4 w-4 mr-2" />
                AI Design Lab
              </Button>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <Select value={viewFilter} onValueChange={(v: any) => setViewFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my_queue">My Queue</SelectItem>
                  <SelectItem value="all">All Jobs</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending_approval">Review</SelectItem>
                  <SelectItem value="revision_requested">Revisions</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto text-sm text-muted-foreground">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Jobs List */}
            {loadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-semibold mb-2">Queue is clear!</h3>
                  <p className="text-muted-foreground">
                    {viewFilter === "my_queue"
                      ? "No jobs assigned to you right now."
                      : "No design jobs match your filters."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.map((job) => (
                  <DesignJobCard
                    key={job.id}
                    job={job}
                    onAction={handleJobAction}
                    isMyJob={job.assignedDesigner?.id === currentUserId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* My Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">My Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Assigned to Me</span>
                  <span className="font-semibold">{stats?.assignedToMe || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="font-semibold">{stats?.inProgress || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Review</span>
                  <span className="font-semibold">{stats?.pendingReview || 0}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed This Week</span>
                    <span className="font-semibold text-green-600">{stats?.completedThisWeek || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time This Week */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Time This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-3xl font-bold">{stats?.totalHoursThisWeek || 0}h</p>
                  <p className="text-sm text-muted-foreground">logged</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Completion</span>
                    <span>{stats?.averageCompletionTime || 0}h per job</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approval Rate</span>
                    <span className="text-green-600">{stats?.approvalRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/design-portfolio")}
                >
                  <Image className="h-4 w-4 mr-2" />
                  My Portfolio
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/design-resources")}
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Design Resources
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/design-lab")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Design Lab
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
