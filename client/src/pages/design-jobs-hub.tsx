import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Palette,
  Clock,
  UserPlus,
  Brush,
  Eye,
  CheckCircle,
  PartyPopper,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface DesignJob {
  id: number;
  status: "pending" | "assigned" | "in_progress" | "review" | "approved" | "rejected" | "completed";
  assignedDesignerId: string | null;
}

export default function DesignJobsHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const isMobile = useIsMobile();

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
      // "Pending" = jobs awaiting assignment (no designer assigned yet)
      // "Assigned" = jobs with a designer assigned (status pending or assigned)
      if (!job.assignedDesignerId && (job.status === "pending" || job.status === "assigned")) {
        counts.pending++;
      } else if (job.assignedDesignerId && (job.status === "pending" || job.status === "assigned")) {
        counts.assigned++;
      } else if (counts[job.status] !== undefined) {
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
    <div>
      <div className={cn("px-6 pt-6", isMobile && "px-4 pt-4")}>
        <Link href="/design-lab" data-testid="link-design-lab">
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01] border-2 border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-purple-500/10 mb-4"
            data-testid="card-design-lab"
          >
            <CardContent className={cn("flex items-center justify-between", isMobile ? "p-4" : "p-6")}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                  <Sparkles className={cn("text-violet-500", isMobile ? "h-5 w-5" : "h-6 w-6")} />
                </div>
                <div>
                  <h3 className={cn("font-semibold", isMobile ? "text-base" : "text-lg")} data-testid="text-design-lab-title">AI Design Lab</h3>
                  <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")} data-testid="text-design-lab-description">
                    Create AI-powered designs with generation and iteration tools
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="gap-2 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                data-testid="button-open-design-lab"
              >
                <span className={cn(isMobile && "hidden")}>Open Lab</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
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
    </div>
  );
}
