import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import {
  Calendar,
  Clock,
  AlertCircle,
  User,
  Building2,
  Paperclip,
  Eye
} from "lucide-react";
import { format } from "date-fns";

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
  organization?: { id: number; name: string };
  designer?: { id: string; name: string; email: string };
}

interface KanbanBoardProps {
  jobs: DesignJob[];
  onStatusChange: (jobId: number, newStatus: string) => void;
  onJobClick: (job: DesignJob) => void;
}

const statusColumns = [
  { id: "pending", label: "Pending", color: "bg-slate-100 dark:bg-slate-900" },
  { id: "assigned", label: "Assigned", color: "bg-blue-50 dark:bg-blue-950" },
  { id: "in_progress", label: "In Progress", color: "bg-yellow-50 dark:bg-yellow-950" },
  { id: "review", label: "Review", color: "bg-purple-50 dark:bg-purple-950" },
  { id: "approved", label: "Approved", color: "bg-green-50 dark:bg-green-950" },
  { id: "completed", label: "Completed", color: "bg-emerald-50 dark:bg-emerald-950" },
];

function KanbanJobCard({ job }: { job: DesignJob }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `job-${job.id}`,
    data: job,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const urgencyColors = {
    low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    rush: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const hasAttachments = (job.logoUrls && job.logoUrls.length > 0) ||
    (job.designReferenceUrls && job.designReferenceUrls.length > 0) ||
    (job.additionalFileUrls && job.additionalFileUrls.length > 0) ||
    job.designStyleUrl;

  const attachmentCount = 
    (job.logoUrls?.length || 0) +
    (job.designReferenceUrls?.length || 0) +
    (job.additionalFileUrls?.length || 0) +
    (job.designStyleUrl ? 1 : 0);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
        data-testid={`kanban-card-${job.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-foreground" data-testid={`text-job-code-${job.id}`}>
                  {job.jobCode}
                </span>
                <Badge className={`text-xs ${urgencyColors[job.urgency]}`}>
                  {job.urgency}
                </Badge>
              </div>
              {job.organization && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Building2 className="w-3 h-3" />
                  <span>{job.organization.name}</span>
                </div>
              )}
            </div>
          </div>

          {job.brief && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 overflow-hidden">
              {job.brief}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {job.designer && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="w-3 h-3" />
                  <span>{job.designer.name}</span>
                </div>
              )}
              {job.deadline && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(job.deadline), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
            {hasAttachments && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Paperclip className="w-3 h-3" />
                <span>{attachmentCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({ 
  column, 
  jobs 
}: { 
  column: typeof statusColumns[0]; 
  jobs: DesignJob[];
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-1 min-w-[280px]">
      <Card className={`h-full ${column.color}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {column.label}
            </CardTitle>
            <Badge variant="secondary" className="ml-2">
              {jobs.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent 
          ref={setNodeRef}
          className={`min-h-[400px] transition-colors ${
            isOver ? 'bg-muted/50 ring-2 ring-primary/20 ring-inset' : ''
          }`}
        >
          {jobs.map((job) => (
            <KanbanJobCard key={job.id} job={job} />
          ))}
          {jobs.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No jobs
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ jobs, onStatusChange, onJobClick }: KanbanBoardProps) {
  const [activeJob, setActiveJob] = useState<DesignJob | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const job = event.active.data.current as DesignJob;
    setActiveJob(job);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const jobId = Number(String(active.id).replace('job-', ''));
      const newStatus = String(over.id);
      
      if (statusColumns.some(col => col.id === newStatus)) {
        onStatusChange(jobId, newStatus);
      }
    }
    
    setActiveJob(null);
  };

  const jobsByStatus = statusColumns.reduce((acc, column) => {
    acc[column.id] = jobs.filter(job => job.status === column.id);
    return acc;
  }, {} as Record<string, DesignJob[]>);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            jobs={jobsByStatus[column.id] || []}
          />
        ))}
      </div>
      
      <DragOverlay>
        {activeJob ? (
          <Card className="w-[280px] opacity-90 rotate-3 shadow-lg">
            <CardContent className="p-4">
              <div className="font-semibold text-sm">{activeJob.jobCode}</div>
              {activeJob.organization && (
                <div className="text-xs text-muted-foreground mt-1">
                  {activeJob.organization.name}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
