import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import {
  Palette,
  Clock,
  UserPlus,
  Brush,
  Eye,
  CheckCircle,
  PartyPopper,
} from "lucide-react";

interface DesignJob {
  id: number;
  status: "pending" | "assigned" | "in_progress" | "review" | "approved" | "rejected" | "completed";
}

export default function DesignJobsHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: designJobs = [], isLoading: jobsLoading } = useQuery<DesignJob[]>({
    queryKey: ["/api/design-jobs"],
    retry: false,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: designJobs.length,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      review: 0,
      approved: 0,
      completed: 0,
    };

    designJobs.forEach((job) => {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      }
    });

    return counts;
  }, [designJobs]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Jobs",
      description: "View all design jobs",
      icon: Palette,
      ...hubColors.blue,
      count: statusCounts.all,
      href: "/design-jobs/list",
    },
    {
      id: "pending",
      label: "Pending",
      description: "Jobs awaiting assignment",
      icon: Clock,
      ...hubColors.slate,
      count: statusCounts.pending,
      href: "/design-jobs/list?status=pending",
    },
    {
      id: "assigned",
      label: "Assigned",
      description: "Jobs assigned to designers",
      icon: UserPlus,
      ...hubColors.purple,
      count: statusCounts.assigned,
      href: "/design-jobs/list?status=assigned",
    },
    {
      id: "in_progress",
      label: "In Progress",
      description: "Jobs currently being worked on",
      icon: Brush,
      ...hubColors.orange,
      count: statusCounts.in_progress,
      href: "/design-jobs/list?status=in_progress",
    },
    {
      id: "review",
      label: "In Review",
      description: "Jobs awaiting approval",
      icon: Eye,
      ...hubColors.amber,
      count: statusCounts.review,
      href: "/design-jobs/list?status=review",
    },
    {
      id: "approved",
      label: "Approved",
      description: "Jobs that have been approved",
      icon: CheckCircle,
      ...hubColors.green,
      count: statusCounts.approved,
      href: "/design-jobs/list?status=approved",
    },
    {
      id: "completed",
      label: "Completed",
      description: "Finished design jobs",
      icon: PartyPopper,
      ...hubColors.teal,
      count: statusCounts.completed,
      href: "/design-jobs/list?status=completed",
    },
  ];

  return (
    <LandingHub
      title="Design Jobs"
      subtitle="Select a status to view design jobs"
      cards={cards}
      viewAllHref="/design-jobs/list"
      viewAllLabel="View All Jobs"
      isLoading={jobsLoading}
      tip="Click on any status above to see design jobs in that state. Use 'View All Jobs' for a complete list with advanced filters."
      testIdPrefix="design-jobs"
      hubId="design-jobs"
    />
  );
}
