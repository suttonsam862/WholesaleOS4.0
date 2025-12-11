import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { RoleHomeLayout, WorkflowGrid, QueuesSection, MetricsSnapshot, MetricCard } from "@/components/role-home/RoleHomeLayout";
import { WorkflowTile } from "@/components/role-home/WorkflowTile";
import { QueueWidget } from "@/components/role-home/QueueWidget";
import { 
  Palette, 
  Clock, 
  BookOpen, 
  Award,
  AlertTriangle,
  CheckCircle,
  Image,
  Inbox
} from "lucide-react";

export default function DesignerHome() {
  const { user } = useAuth();

  const { data: designJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/design-jobs"],
    retry: false,
  });

  const myJobs = designJobs.filter((j: any) => j.assignedDesignerId === user?.id);
  const activeJobsCount = myJobs.filter((j: any) => 
    j.status === 'assigned' || j.status === 'in_progress'
  ).length;
  const urgentJobsCount = myJobs.filter((j: any) => j.urgency === 'high').length;
  const inReviewCount = myJobs.filter((j: any) => j.status === 'review').length;
  const completedThisMonth = myJobs.filter((j: any) => {
    if (!j.completedAt) return false;
    const completed = new Date(j.completedAt);
    const now = new Date();
    return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear();
  }).length;

  return (
    <RoleHomeLayout
      role="designer"
      userName={user?.firstName || user?.email?.split("@")[0]}
    >
      <WorkflowGrid columns={2}>
        <WorkflowTile
          id="assigned-jobs"
          title="My Assigned Jobs"
          description="Active design projects"
          icon={Palette}
          bgGradient="from-violet-500/10 to-violet-500/5"
          iconColor="text-violet-400"
          primaryAction={{ label: "View All Jobs", href: "/design-jobs" }}
          subActions={[
            { label: "In Progress", href: "/design-jobs?status=in_progress" },
            { label: "In Review", href: "/design-jobs?status=review" },
            { label: "Due Soon", href: "/design-jobs?urgency=high" },
          ]}
          badge={activeJobsCount > 0 ? { count: activeJobsCount, label: "Active" } : undefined}
        />

        <WorkflowTile
          id="urgent-deadlines"
          title="Urgent Deadlines"
          description="Jobs due in 24-48 hours"
          icon={Clock}
          bgGradient="from-amber-500/10 to-amber-500/5"
          iconColor="text-amber-400"
          primaryAction={{ label: "View Urgent", href: "/design-jobs?filter=urgent" }}
          badge={urgentJobsCount > 0 ? { count: urgentJobsCount, label: "Urgent", variant: "warning" } : undefined}
        />

        <WorkflowTile
          id="design-resources"
          title="Design Resources"
          description="Templates, assets, and guidelines"
          icon={BookOpen}
          bgGradient="from-blue-500/10 to-blue-500/5"
          iconColor="text-blue-400"
          primaryAction={{ label: "Browse Resources", href: "/design-resources" }}
          subActions={[
            { label: "Templates", href: "/design-resources?tab=templates" },
            { label: "Brand Assets", href: "/design-resources?tab=assets" },
          ]}
        />

        <WorkflowTile
          id="my-portfolio"
          title="My Portfolio"
          description="Showcase completed work"
          icon={Award}
          bgGradient="from-emerald-500/10 to-emerald-500/5"
          iconColor="text-emerald-400"
          primaryAction={{ label: "View Portfolio", href: "/design-portfolio" }}
          subActions={[
            { label: "Approved Designs", href: "/design-portfolio?filter=approved" },
            { label: "Statistics", href: "/design-portfolio?tab=stats" },
          ]}
        />
      </WorkflowGrid>

      <QueuesSection>
        <QueueWidget
          id="due-soon"
          title="Due Today/Tomorrow"
          icon={AlertTriangle}
          queryKey={["/api/design-jobs"]}
          filter={(jobs) => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return jobs.filter((j: any) => 
              j.assignedDesignerId === user?.id &&
              j.deadline &&
              new Date(j.deadline) <= tomorrow &&
              j.status !== 'completed' && j.status !== 'approved'
            );
          }}
          columns={[
            { key: "jobCode", label: "Job", className: "w-24 font-medium text-white" },
            { key: "organization.name", label: "Client", className: "flex-1" },
          ]}
          rowAction={{ href: (job) => `/design-jobs/${job.id}` }}
          viewAllHref="/design-jobs?filter=urgent"
          emptyState={{ message: "No urgent deadlines", icon: CheckCircle }}
        />

        <QueueWidget
          id="feedback-revisions"
          title="Feedback & Revisions"
          icon={Palette}
          queryKey={["/api/design-jobs"]}
          filter={(jobs) => jobs.filter((j: any) => 
            j.assignedDesignerId === user?.id &&
            (j.status === 'review' || j.status === 'rejected')
          )}
          columns={[
            { key: "jobCode", label: "Job", className: "w-24 font-medium text-white" },
            { key: "status", label: "Status", className: "w-20" },
          ]}
          rowAction={{ href: (job) => `/design-jobs/${job.id}` }}
          viewAllHref="/design-jobs?status=review"
          emptyState={{ message: "No feedback pending", icon: CheckCircle }}
        />

        <QueueWidget
          id="new-assignments"
          title="New Assignments"
          icon={Inbox}
          queryKey={["/api/design-jobs"]}
          filter={(jobs) => jobs.filter((j: any) => 
            j.assignedDesignerId === user?.id &&
            j.status === 'assigned'
          )}
          columns={[
            { key: "jobCode", label: "Job", className: "w-24 font-medium text-white" },
            { key: "urgency", label: "Priority", className: "w-20" },
          ]}
          rowAction={{ href: (job) => `/design-jobs/${job.id}` }}
          viewAllHref="/design-jobs?status=assigned"
          emptyState={{ message: "No new assignments", icon: Inbox }}
        />
      </QueuesSection>

      <MetricsSnapshot dashboardLink="/">
        <MetricCard label="Active Jobs" value={activeJobsCount} icon={Palette} />
        <MetricCard label="Completed This Month" value={completedThisMonth} icon={Award} />
        <MetricCard label="In Review" value={inReviewCount} icon={Clock} />
        <MetricCard label="Portfolio Items" value={myJobs.filter((j: any) => j.status === 'approved').length} icon={Image} />
      </MetricsSnapshot>
    </RoleHomeLayout>
  );
}
