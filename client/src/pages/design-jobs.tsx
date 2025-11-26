import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { hasPermission } from "@/lib/permissions";
import { useEffect, useState } from "react";
import { CreateDesignJobModal } from "@/components/modals/create-design-job-modal";
import { EditDesignJobModal } from "@/components/modals/edit-design-job-modal";
import { KanbanBoard } from "@/components/design-jobs/kanban-board";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Palette,
  AlertCircle,
  ArrowRightLeft,
  MoreVertical,
  Eye,
  Edit,
  LayoutGrid,
  List,
  Building2
} from "lucide-react";
import { useLocation } from "wouter";
import { OrgLogo } from "@/components/ui/org-logo";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

interface DesignJob {
  id: number;
  jobCode: string;
  orgId: number;
  leadId?: number;
  orderId?: number;
  salespersonId?: string;
  brief?: string;
  requirements?: string;
  urgency: "low" | "normal" | "high" | "rush";
  status: "pending" | "assigned" | "in_progress" | "review" | "approved" | "rejected" | "completed";
  assignedDesignerId?: string;
  renditionCount: number;
  renditionUrls?: string[];
  renditionMockupUrl?: string;
  renditionProductionUrl?: string;
  finalLink?: string;
  referenceFiles?: string[];
  logoUrls?: string[];
  designReferenceUrls?: string[];
  additionalFileUrls?: string[];
  designStyleUrl?: string;
  deadline?: string;
  priority: "low" | "normal" | "high";
  internalNotes?: string;
  clientFeedback?: string;
  archived?: boolean;
  archivedAt?: string;
  statusChangedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Organization {
  id: number;
  name: string;
  logoUrl?: string | null;
}

interface Designer {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Draggable Job Card Component
function DraggableJobCard({ job, children }: { job: DesignJob; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`transition-colors rounded-xl ${isOver ? 'bg-primary/10 ring-2 ring-primary/20' : ''}`}
    >
      {children}
    </div>
  );
}

export default function DesignJobs() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("jobs");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Assignment tab states
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [targetDesignerId, setTargetDesignerId] = useState<string | undefined>(undefined);
  const [, setExpandedDesigners] = useState<Set<string>>(new Set());
  const [, setExpandedSalespeople] = useState<Set<string>>(new Set());

  // Drag and drop state
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

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
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch design jobs data
  const { data: designJobs = [], isLoading: jobsLoading } = useQuery<DesignJob[]>({
    queryKey: ["/api/design-jobs"],
    retry: false,
  });

  // Fetch organizations for display
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
  });

  // Fetch designers for assignment (only if user has write permission and on assignments tab)
  const canEdit = hasPermission(user, 'designJobs', 'write');
  const { data: designers = [] } = useQuery<Designer[]>({
    queryKey: ["/api/users/for-assignment"],
    select: (users: any[]) => users.filter(u => u.role === 'designer'),
    retry: false,
    enabled: canEdit && activeTab === "assignments",
  });

  // Fetch salespeople for salesperson assignments view
  const { data: salespeople = [] } = useQuery<any[]>({
    queryKey: ["/api/salespeople"],
    retry: false,
    enabled: canEdit && activeTab === "salesperson-assignments",
  });

  // Fetch archived design jobs
  const { data: archivedJobs = [] } = useQuery<DesignJob[]>({
    queryKey: ["/api/design-jobs/archived"],
    retry: false,
    enabled: activeTab === "archived",
  });

  // Update job status mutation
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/design-jobs/${id}/status`, { method: "PUT", body: { status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      toast({
        title: "Success",
        description: "Job status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  // Bulk assignment mutation
  const bulkReassignJobsMutation = useMutation({
    mutationFn: async ({ jobIds, designerId }: { jobIds: number[]; designerId: string }) => {
      return apiRequest("/api/design-jobs/bulk-reassign", { method: "PUT", body: { jobIds, designerId } });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
      setSelectedJobs([]);
      toast({
        title: "Success",
        description: data.message || "Design jobs reassigned successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to reassign design jobs",
        variant: "destructive",
      });
    },
  });

  // Create organization lookup map
  const orgLookup = organizations.reduce((acc, org) => {
    acc[org.id] = org.name;
    return acc;
  }, {} as Record<number, string>);

  // Filter design jobs based on selected filters
  const filteredJobs = designJobs.filter(job => {
    if (statusFilter && job.status !== statusFilter) return false;
    if (urgencyFilter && job.urgency !== urgencyFilter) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "pending";
      case "assigned": return "assigned";
      case "in_progress": return "in-progress";
      case "review": return "review";
      case "approved": return "approved";
      case "rejected": return "rejected";
      case "completed": return "completed";
      default: return "pending";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "low": return "ready";
      case "normal": return "pending";
      case "high": return "review";
      case "rush": return "rejected";
      default: return "pending";
    }
  };

  // Helper functions for job assignments
  const organizeJobsByDesigner = () => {
    const organized: { [key: string]: DesignJob[] } = {};
    const unassigned: DesignJob[] = [];

    designJobs.forEach(job => {
      if (job.assignedDesignerId) {
        if (!organized[job.assignedDesignerId]) {
          organized[job.assignedDesignerId] = [];
        }
        organized[job.assignedDesignerId].push(job);
      } else {
        unassigned.push(job);
      }
    });

    return { organized, unassigned };
  };

  const organizeJobsBySalesperson = () => {
    const organized: { [key: string]: DesignJob[] } = {};
    const unassigned: DesignJob[] = [];

    designJobs.forEach(job => {
      if (job.salespersonId) {
        if (!organized[job.salespersonId]) {
          organized[job.salespersonId] = [];
        }
        organized[job.salespersonId].push(job);
      } else {
        unassigned.push(job);
      }
    });

    return { organized, unassigned };
  };

  const { organized: jobsByDesigner, unassigned: unassignedJobs } = organizeJobsByDesigner();
  const { organized: jobsBySalesperson } = organizeJobsBySalesperson();

  // Find active job for drag overlay
  const activeJob = activeJobId ? designJobs.find(job => job.id === activeJobId) : null;

  const toggleJobSelection = (jobId: number) => {
    setSelectedJobs(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  const calculateDesignerJobStats = (jobs: DesignJob[]) => {
    const total = jobs.length;
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const urgencyCounts = jobs.reduce((acc, job) => {
      acc[job.urgency] = (acc[job.urgency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, statusCounts, urgencyCounts };
  };

  const handleBulkReassign = () => {
    if (selectedJobs.length === 0) {
      toast({
        title: "No jobs selected",
        description: "Please select jobs to reassign",
        variant: "destructive",
      });
      return;
    }

    // Require explicit selection - block action if no selection made
    if (targetDesignerId === undefined || targetDesignerId === "") {
      toast({
        title: "Selection required",
        description: "Please select either a designer to assign jobs to, or choose to unassign jobs",
        variant: "destructive",
      });
      return;
    }

    const isUnassignAction = targetDesignerId === "UNASSIGN";
    const targetDesigner = isUnassignAction ? null : designers.find(d => d.id === targetDesignerId);

    const confirmMessage = isUnassignAction
      ? `Are you sure you want to unassign ${selectedJobs.length} selected jobs? They will be moved to the unassigned pool.`
      : `Reassign ${selectedJobs.length} selected jobs to ${targetDesigner?.name || targetDesigner?.email}?`;

    if (confirm(confirmMessage)) {
      // Send appropriate value to API: empty string for unassign, userId for assignment
      const apiDesignerId = isUnassignAction ? "" : targetDesignerId;
      bulkReassignJobsMutation.mutate({
        jobIds: selectedJobs,
        designerId: apiDesignerId
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveJobId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveJobId(null);

    if (!over) return;

    const jobId = active.id as number;
    const targetDesignerId = over.id as string;

    // Find the job to check current assignment
    const job = designJobs.find(j => j.id === jobId);
    if (!job) return;

    // If dropped on same designer, do nothing
    if (job.assignedDesignerId === targetDesignerId) return;

    // If dropped on "unassigned", set designerId to empty string
    const newDesignerId = targetDesignerId === "unassigned" ? "" : targetDesignerId;

    // Call the reassignment mutation
    bulkReassignJobsMutation.mutate({
      jobIds: [jobId],
      designerId: newDesignerId
    });
  };

  const handleEditJob = (job: DesignJob) => {
    setEditingJobId(job.id);
    setIsEditModalOpen(true);
  };

  const handleDeleteJob = async (job: DesignJob) => {
    if (confirm(`Are you sure you want to delete design job "${job.jobCode}"? This action cannot be undone.`)) {
      try {
        await apiRequest(`/api/design-jobs/${job.id}`, { method: "DELETE" });
        queryClient.invalidateQueries({ queryKey: ["/api/design-jobs"] });
        toast({
          title: "Success",
          description: "Design job deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to delete design job",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading || jobsLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card className="glass-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2" data-testid="heading-design-jobs">
            Design Jobs
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage creative workflows and design requests.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          data-testid="button-create-design-job"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
        >
          <Palette className="w-4 h-4 mr-2" />
          Create Design Job
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${canEdit ? 'grid-cols-4' : 'grid-cols-2'} bg-black/40 border border-white/10 p-1 rounded-xl backdrop-blur-md`}>
          <TabsTrigger value="jobs" data-testid="tab-design-jobs" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">
            Design Jobs
          </TabsTrigger>
          {canEdit && (
            <>
              <TabsTrigger value="assignments" data-testid="tab-designer-assignments" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">
                Designer Assignments
              </TabsTrigger>
              <TabsTrigger value="salesperson-assignments" data-testid="tab-salesperson-assignments" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">
                Salesperson View
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="archived" data-testid="tab-archived" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all">
            Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">

      {/* Filters and View Toggle */}
      <Card className="glass-card border-white/10" data-testid="card-filters">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
              <select 
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-white" 
                data-testid="select-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Ready for Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
              <select 
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm min-h-[44px] focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all text-white" 
                data-testid="select-urgency-filter"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="">All Urgency</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="rush">Rush</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-list-view"
                className={viewMode === "list" ? "bg-primary/20 text-primary border-primary/50" : "glass-card border-white/10 hover:bg-white/5"}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                data-testid="button-kanban-view"
                className={viewMode === "kanban" ? "bg-primary/20 text-primary border-primary/50" : "glass-card border-white/10 hover:bg-white/5"}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Kanban
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          jobs={filteredJobs}
          onStatusChange={(jobId, newStatus) => {
            updateJobStatusMutation.mutate({ id: jobId, status: newStatus });
          }}
          onJobClick={(job) => {
            window.location.href = `/design-jobs/${job.id}`;
          }}
        />
      ) : (
        /* Design Jobs Table - List View */
        <Card data-testid="card-design-jobs-table" className="glass-card border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full mobile-card-table">
                <thead className="bg-black/40">
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Job Code</th>
                    <th className="px-6 py-3 font-medium">Organization</th>
                    <th className="px-6 py-3 font-medium">Brief</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Urgency</th>
                    <th className="px-6 py-3 font-medium">Renditions</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td className="px-6 py-12 text-center text-muted-foreground" colSpan={8}>
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Palette className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">
                            {designJobs.length === 0 ? "No design jobs found" : "No jobs match your filters"}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {designJobs.length === 0 ? "Create your first design job to get started." : "Try adjusting your filters to see more results."}
                          </p>
                          {designJobs.length === 0 && (
                            <Button 
                              onClick={() => setIsCreateModalOpen(true)}
                              data-testid="button-create-first-design-job"
                              className="bg-primary hover:bg-primary/90"
                            >
                              <Palette className="w-4 h-4 mr-2" />
                              Create Design Job
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr 
                        key={job.id} 
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-foreground" data-testid={`job-code-${job.id}`}>
                            {job.jobCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const org = organizations.find(o => o.id === job.orgId);
                              return (
                                <>
                                  <OrgLogo
                                    src={org?.logoUrl}
                                    orgName={org?.name || `Org ${job.orgId}`}
                                    orgId={job.orgId}
                                    size="sm"
                                  />
                                  <span className="text-sm text-foreground/80">
                                    {org?.name || `Org ${job.orgId}`}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground/80 max-w-xs truncate">
                            {job.brief || "No brief provided"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={getStatusColor(job.status)}>
                            {job.status.replace("_", " ")}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={getUrgencyColor(job.urgency)}>
                            {job.urgency}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground/80">
                            {job.renditionCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {formatDate(job.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-view-${job.id}`}
                              onClick={() => {
                                window.location.href = `/design-jobs/${job.id}`;
                              }}
                              className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-${job.id}`}
                              onClick={() => handleEditJob(job)}
                              className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-delete-${job.id}`}
                              onClick={() => handleDeleteJob(job)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Designer Assignments Tab - Kanban View */}
        {canEdit && (
          <TabsContent value="assignments" className="space-y-6">
            <Card data-testid="card-assignment-controls" className="glass-card border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Designer Assignments - Kanban View</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop jobs between designer columns to reassign them, or use the dropdown for manual assignment. Select multiple jobs for bulk reassignment.
                    </p>
                  </div>
                  {selectedJobs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select 
                        value={targetDesignerId} 
                        onValueChange={setTargetDesignerId}
                        data-testid="select-target-designer"
                      >
                        <SelectTrigger className="w-[200px] bg-black/20 border-white/10 text-white">
                          <SelectValue placeholder="Select designer..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNASSIGN">Unassign Jobs</SelectItem>
                          {designers.map((designer) => (
                            <SelectItem key={designer.id} value={designer.id}>
                              {designer.name || designer.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleBulkReassign}
                        disabled={selectedJobs.length === 0 || bulkReassignJobsMutation.isPending}
                        data-testid="button-bulk-reassign"
                        className="bg-primary hover:bg-primary/90"
                      >
                        {bulkReassignJobsMutation.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4 mr-2" />
                        )}
                        Reassign ({selectedJobs.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Kanban Column Layout with Drag and Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4" data-testid="designer-kanban-board">
                {/* Unassigned Column */}
                <DroppableColumn id="unassigned">
                  <div className="flex-shrink-0 w-80">
                    <Card className="h-full glass-card border-white/10 bg-black/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold flex items-center gap-2 text-foreground">
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            Unassigned ({unassignedJobs.length})
                          </h3>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {unassignedJobs.map((job) => (
                            <DraggableJobCard key={job.id} job={job}>
                              <div
                                className="border border-white/10 rounded-lg p-3 bg-black/40 hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                data-testid={`unassigned-job-${job.id}`}
                              >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedJobs.includes(job.id)}
                                  onCheckedChange={() => toggleJobSelection(job.id)}
                                  data-testid={`checkbox-job-${job.id}`}
                                  className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span className="font-medium text-sm text-foreground">{job.jobCode}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = `/design-jobs/${job.id}`}
                                className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <StatusBadge status={getStatusColor(job.status)} className="text-xs">
                                {job.status}
                              </StatusBadge>
                              <StatusBadge status={getUrgencyColor(job.urgency)} className="text-xs">
                                {job.urgency}
                              </StatusBadge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {orgLookup[job.orgId]} • {job.brief || "No brief"}
                            </p>
                            <Select 
                              value=""
                              onValueChange={(designerId) => {
                                if (designerId && designerId !== "UNASSIGN") {
                                  bulkReassignJobsMutation.mutate({
                                    jobIds: [job.id],
                                    designerId
                                  });
                                }
                              }}
                              data-testid={`select-assign-${job.id}`}
                            >
                              <SelectTrigger className="w-full h-8 text-xs bg-black/20 border-white/10 text-white">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {designers.map((designer) => (
                                  <SelectItem key={designer.id} value={designer.id}>
                                    {designer.name || designer.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                              </div>
                            </div>
                          </DraggableJobCard>
                        ))}
                        {unassignedJobs.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">No unassigned jobs</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DroppableColumn>

              {/* Designer Columns */}
              {designers.map((designer) => {
                const designerJobs = jobsByDesigner[designer.id] || [];
                const stats = calculateDesignerJobStats(designerJobs);

                return (
                  <DroppableColumn key={designer.id} id={designer.id}>
                    <div className="flex-shrink-0 w-80">
                      <Card className="h-full glass-card border-white/10 bg-black/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{designer.name || designer.email}</h3>
                            <p className="text-xs text-muted-foreground">{stats.total} jobs</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10" data-testid={`designer-actions-${designer.id}`}>
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (confirm(`Transfer all ${designerJobs.length} jobs from ${designer.name || designer.email} to unassigned?`)) {
                                    bulkReassignJobsMutation.mutate({
                                      jobIds: designerJobs.map(j => j.id),
                                      designerId: ""
                                    });
                                  }
                                }}
                              >
                                <ArrowRightLeft className="w-3 h-3 mr-2" />
                                Unassign All
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {Object.entries(stats.statusCounts).map(([status, count]) => (
                            <Badge key={status} variant="outline" className="text-xs px-1 py-0 border-white/10 bg-white/5">
                              {status}: {count}
                            </Badge>
                          ))}
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {designerJobs.map((job) => (
                            <DraggableJobCard key={job.id} job={job}>
                              <div
                                className="border border-white/10 rounded-lg p-3 bg-black/40 hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                data-testid={`designer-job-${job.id}`}
                              >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={selectedJobs.includes(job.id)}
                                      onCheckedChange={() => toggleJobSelection(job.id)}
                                      data-testid={`checkbox-job-${job.id}`}
                                      className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <span className="font-medium text-sm text-foreground">{job.jobCode}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = `/design-jobs/${job.id}`}
                                    className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                                    data-testid={`view-job-${job.id}`}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <StatusBadge status={getStatusColor(job.status)} className="text-xs">
                                    {job.status}
                                  </StatusBadge>
                                  <StatusBadge status={getUrgencyColor(job.urgency)} className="text-xs">
                                    {job.urgency}
                                  </StatusBadge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {orgLookup[job.orgId]} • {job.brief || "No brief"}
                                  {job.deadline && ` • Due: ${formatDate(job.deadline)}`}
                                </p>
                                <Select 
                                  value={job.assignedDesignerId || ""}
                                  onValueChange={(designerId) => {
                                    if (designerId !== job.assignedDesignerId) {
                                      bulkReassignJobsMutation.mutate({
                                        jobIds: [job.id],
                                        designerId: designerId === "UNASSIGN" ? "" : designerId
                                      });
                                    }
                                  }}
                                  data-testid={`reassign-job-${job.id}`}
                                >
                                  <SelectTrigger className="w-full h-8 text-xs bg-black/20 border-white/10 text-white">
                                    <SelectValue placeholder="Reassign..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="UNASSIGN">Unassign</SelectItem>
                                    {designers.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>
                                        {d.name || d.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                </div>
                              </div>
                            </DraggableJobCard>
                          ))}
                          {designerJobs.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">No jobs assigned</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DroppableColumn>
              );
            })}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeJob ? (
              <div className="border border-white/20 rounded-lg p-3 bg-black/80 backdrop-blur-md shadow-xl w-80">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-sm text-foreground">{activeJob.jobCode}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={getStatusColor(activeJob.status)} className="text-xs">
                      {activeJob.status}
                    </StatusBadge>
                    <StatusBadge status={getUrgencyColor(activeJob.urgency)} className="text-xs">
                      {activeJob.urgency}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {orgLookup[activeJob.orgId]} • {activeJob.brief || "No brief"}
                  </p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </TabsContent>
    )}

        {/* Salesperson Assignments Tab - Kanban View */}
        {canEdit && (
          <TabsContent value="salesperson-assignments" className="space-y-6">
            <Card data-testid="card-salesperson-kanban-header" className="glass-card border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2 text-foreground">Salesperson Assignments - Kanban View</h3>
                    <p className="text-sm text-muted-foreground">
                      View design jobs organized by salesperson. Jobs shown by the salesperson who owns the client relationship.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kanban Column Layout */}
            <div className="flex gap-4 overflow-x-auto pb-4" data-testid="salesperson-kanban-board">
              {/* Salesperson Columns */}
              {salespeople.map((salesperson) => {
                const salespersonJobs = jobsBySalesperson[salesperson.userId] || [];
                const stats = calculateDesignerJobStats(salespersonJobs);

                return (
                  <div key={salesperson.id} className="flex-shrink-0 w-80">
                    <Card className="h-full glass-card border-white/10 bg-black/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">{salesperson.userName || salesperson.userEmail || 'Unknown'}</h3>
                            <p className="text-xs text-muted-foreground">{stats.total} jobs</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {Object.entries(stats.statusCounts).map(([status, count]) => (
                            <Badge key={status} variant="outline" className="text-xs px-1 py-0 border-white/10 bg-white/5">
                              {status}: {count}
                            </Badge>
                          ))}
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {salespersonJobs.map((job) => (
                            <div
                              key={job.id}
                              className="border border-white/10 rounded-lg p-3 bg-black/40 hover:bg-white/5 transition-all"
                              data-testid={`salesperson-job-${job.id}`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <span className="font-medium text-sm text-foreground">{job.jobCode}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.location.href = `/design-jobs/${job.id}`}
                                    className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
                                    data-testid={`view-salesperson-job-${job.id}`}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  <StatusBadge status={getStatusColor(job.status)} className="text-xs">
                                    {job.status}
                                  </StatusBadge>
                                  <StatusBadge status={getUrgencyColor(job.urgency)} className="text-xs">
                                    {job.urgency}
                                  </StatusBadge>
                                </div>
                                {job.assignedDesignerId && (
                                  <div className="text-xs text-muted-foreground">
                                    Designer: {designers.find(d => d.id === job.assignedDesignerId)?.name || 'Unknown'}
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {orgLookup[job.orgId]} • {job.brief || "No brief"}
                                  {job.deadline && ` • Due: ${formatDate(job.deadline)}`}
                                </p>
                              </div>
                            </div>
                          ))}
                          {salespersonJobs.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">No jobs for this salesperson</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}

        {/* Archived Jobs Tab */}
        <TabsContent value="archived" className="space-y-6">
          <Card data-testid="card-archived-jobs" className="glass-card border-white/10">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Archived Design Jobs</h3>
                <p className="text-sm text-muted-foreground">
                  View all completed and archived design jobs ({archivedJobs.length} total)
                </p>
              </div>

              {archivedJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-archive text-4xl mb-3 opacity-50"></i>
                  <p>No archived design jobs yet</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {archivedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors bg-black/20"
                      data-testid={`archived-job-${job.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">{job.jobCode}</span>
                              <StatusBadge status={getStatusColor(job.status)}>
                                {job.status}
                              </StatusBadge>
                              <Badge variant="secondary" className="text-xs bg-white/10 text-white/70">
                                Archived {job.archivedAt ? formatDate(job.archivedAt) : ''}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {orgLookup[job.orgId]} • {job.brief || "No brief"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/design-jobs/${job.id}`;
                            }}
                            data-testid={`view-archived-job-${job.id}`}
                            className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                          >
                            <Eye className="w-4 h-4 text-xs" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Design Job Modal */}
      <CreateDesignJobModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Design Job Modal */}
      <EditDesignJobModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingJobId(null);
        }}
        designJobId={editingJobId}
      />
    </div>
  );
}