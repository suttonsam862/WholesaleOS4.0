/**
 * V6 Design Job List Page
 * Design queue management with list and kanban views
 */

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { canModify, hasPermission } from "@/lib/permissions";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Icons
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Flame,
  ArrowUp,
  ArrowDown,
  Calendar,
  Building2,
  User,
  Package,
  ChevronDown,
} from "lucide-react";

// V6 Components
import {
  StatusBadgeV6,
  DESIGN_JOB_STATUS_CONFIG,
  type DesignJobStatusV6,
} from "@/components/v6";

// Types
interface DesignJob {
  id: number;
  jobCode: string;
  title: string;
  organizationId: number;
  organizationName?: string;
  orderId?: number;
  orderCode?: string;
  status: DesignJobStatusV6;
  urgency: "low" | "normal" | "high" | "rush";
  deadline?: string;
  assignedDesignerId?: string;
  assignedDesignerName?: string;
  currentRevision: number;
  totalRevisions: number;
  createdAt: string;
  updatedAt: string;
  statusChangedAt: string;
}

interface Designer {
  id: string;
  name: string;
  email: string;
}

const URGENCY_CONFIG = {
  rush: { label: "Rush", color: "text-red-500 bg-red-500/10 border-red-500/30", icon: Flame, sort: 1 },
  high: { label: "High", color: "text-orange-500 bg-orange-500/10 border-orange-500/30", icon: ArrowUp, sort: 2 },
  normal: { label: "Normal", color: "text-slate-500 bg-slate-500/10 border-slate-500/30", icon: null, sort: 3 },
  low: { label: "Low", color: "text-slate-400 bg-slate-400/10 border-slate-400/30", icon: ArrowDown, sort: 4 },
};

const KANBAN_COLUMNS: { status: DesignJobStatusV6; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "assigned", label: "Assigned" },
  { status: "in_progress", label: "In Progress" },
  { status: "review", label: "Review" },
  { status: "needs_revision", label: "Needs Revision" },
  { status: "approved", label: "Approved" },
];

export default function DesignJobListV6() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [designerFilter, setDesignerFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [selectedView, setSelectedView] = useState("all");

  const isDesigner = user?.role === "designer";

  // Queries
  const { data: jobs = [], isLoading } = useQuery<DesignJob[]>({
    queryKey: ["/api/design-jobs"],
  });

  const { data: designers = [] } = useQuery<Designer[]>({
    queryKey: ["/api/users?role=designer"],
    enabled: !isDesigner,
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async (data: { jobId: number; designerId: string }) => {
      const res = await apiRequest("PATCH", `/api/design-jobs/${data.jobId}/assign`, {
        designerId: data.designerId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      toast({ title: "Designer assigned" });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtering
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Role-based filtering for designers
    if (isDesigner && user) {
      result = result.filter((job) => job.assignedDesignerId === user.id);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (job) =>
          job.jobCode.toLowerCase().includes(term) ||
          job.title.toLowerCase().includes(term) ||
          job.organizationName?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((job) => job.status === statusFilter);
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      result = result.filter((job) => job.urgency === urgencyFilter);
    }

    // Designer filter
    if (designerFilter !== "all") {
      if (designerFilter === "unassigned") {
        result = result.filter((job) => !job.assignedDesignerId);
      } else {
        result = result.filter((job) => job.assignedDesignerId === designerFilter);
      }
    }

    // View filters
    if (selectedView === "my-jobs" && user) {
      result = result.filter((job) => job.assignedDesignerId === user.id);
    }

    // Sort by urgency first, then deadline
    result.sort((a, b) => {
      const urgencyA = URGENCY_CONFIG[a.urgency].sort;
      const urgencyB = URGENCY_CONFIG[b.urgency].sort;
      if (urgencyA !== urgencyB) return urgencyA - urgencyB;

      // Then by deadline
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

    return result;
  }, [jobs, searchTerm, statusFilter, urgencyFilter, designerFilter, selectedView, isDesigner, user]);

  // Group jobs by status for kanban
  const jobsByStatus = useMemo(() => {
    const grouped: Record<DesignJobStatusV6, DesignJob[]> = {
      pending: [],
      assigned: [],
      in_progress: [],
      review: [],
      needs_revision: [],
      approved: [],
      completed: [],
      on_hold: [],
      cancelled: [],
    };

    filteredJobs.forEach((job) => {
      if (grouped[job.status]) {
        grouped[job.status].push(job);
      }
    });

    return grouped;
  }, [filteredJobs]);

  const getDeadlineStatus = (deadline: string | undefined): "ok" | "warning" | "overdue" | null => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (isBefore(deadlineDate, now)) return "overdue";
    if (isBefore(deadlineDate, addDays(now, 3))) return "warning";
    return "ok";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Design Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {filteredJobs.length} jobs
          </p>
        </div>
        {canModify(user, "designJobs") && (
          <Button onClick={() => setLocation("/design-jobs/new")}>
            <Plus className="w-4 h-4 mr-2" />
            New Design Job
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(DESIGN_JOB_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Urgency Filter */}
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                {Object.entries(URGENCY_CONFIG).map(([urgency, config]) => (
                  <SelectItem key={urgency} value={urgency}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Designer Filter (for non-designers) */}
            {!isDesigner && designers.length > 0 && (
              <Select value={designerFilter} onValueChange={setDesignerFilter}>
                <SelectTrigger className="w-[150px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Designer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Designers</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {designers.map((designer) => (
                    <SelectItem key={designer.id} value={designer.id}>
                      {designer.name || designer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-r-none"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="rounded-l-none"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "list" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Designer</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    No design jobs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => {
                  const urgencyConfig = URGENCY_CONFIG[job.urgency];
                  const UrgencyIcon = urgencyConfig.icon;
                  const deadlineStatus = getDeadlineStatus(job.deadline);

                  return (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setLocation(`/design-jobs/${job.id}`)}
                    >
                      <TableCell className="font-medium">{job.jobCode}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{job.title}</TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {job.organizationName || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadgeV6 type="design" status={job.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1", urgencyConfig.color)}>
                          {UrgencyIcon && <UrgencyIcon className="w-3 h-3" />}
                          {urgencyConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.deadline ? (
                          <span
                            className={cn(
                              deadlineStatus === "overdue" && "text-red-500 font-medium",
                              deadlineStatus === "warning" && "text-orange-500"
                            )}
                          >
                            {format(new Date(job.deadline), "MMM d")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {job.orderCode ? (
                          <a
                            href={`/orders/${job.orderId}`}
                            className="text-primary hover:underline text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {job.orderCode}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/design-jobs/${job.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {canModify(user, "designJobs") && (
                              <DropdownMenuItem
                                onClick={() => setLocation(`/design-jobs/${job.id}/edit`)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              label={column.label}
              jobs={jobsByStatus[column.status]}
              onJobClick={(jobId) => setLocation(`/design-jobs/${jobId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  status: DesignJobStatusV6;
  label: string;
  jobs: DesignJob[];
  onJobClick: (jobId: number) => void;
}

function KanbanColumn({ status, label, jobs, onJobClick }: KanbanColumnProps) {
  const statusConfig = DESIGN_JOB_STATUS_CONFIG[status];

  return (
    <div className="flex flex-col min-w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", statusConfig.bgColor.replace("/10", ""))} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
          {jobs.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 p-2 bg-muted/30 rounded-lg min-h-[200px]">
        {jobs.map((job) => (
          <KanbanCard key={job.id} job={job} onClick={() => onJobClick(job.id)} />
        ))}
        {jobs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No jobs
          </p>
        )}
      </div>
    </div>
  );
}

// Kanban Card Component
interface KanbanCardProps {
  job: DesignJob;
  onClick: () => void;
}

function KanbanCard({ job, onClick }: KanbanCardProps) {
  const urgencyConfig = URGENCY_CONFIG[job.urgency];
  const UrgencyIcon = urgencyConfig.icon;
  const isOverdue = job.deadline && isBefore(new Date(job.deadline), new Date());

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        job.urgency === "rush" && "border-red-500/50",
        isOverdue && "border-red-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <span className="text-xs text-muted-foreground">{job.jobCode}</span>
          {(job.urgency === "rush" || job.urgency === "high") && (
            <Badge variant="outline" className={cn("text-[10px] px-1 py-0", urgencyConfig.color)}>
              {UrgencyIcon && <UrgencyIcon className="w-2 h-2 mr-0.5" />}
              {urgencyConfig.label}
            </Badge>
          )}
        </div>

        {/* Title */}
        <p className="font-medium text-sm line-clamp-2">{job.title}</p>

        {/* Organization */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{job.organizationName}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          {job.deadline && (
            <span
              className={cn(
                "text-xs",
                isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
              )}
            >
              {format(new Date(job.deadline), "MMM d")}
            </span>
          )}
          {job.assignedDesignerName ? (
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-[10px]">
                {job.assignedDesignerName[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-xs text-muted-foreground">Unassigned</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
