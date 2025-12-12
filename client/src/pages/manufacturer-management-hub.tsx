import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Factory, Clock, Cog, CheckCircle } from "lucide-react";

interface ManufacturingRecord {
  id: number;
  manufacturerId: number | null;
  assignedTo: string | null;
  status: string;
}

export default function ManufacturerManagementHub() {
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

  const { data: manufacturingRecords = [], isLoading: manufacturingLoading } = useQuery<ManufacturingRecord[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const counts = useMemo(() => {
    const total = manufacturingRecords.length;
    
    const pendingStatuses = [
      "awaiting_admin_confirmation",
      "confirmed_awaiting_manufacturing",
    ];
    const completedStatuses = ["complete", "shipped"];
    const inProgressStatuses = ["in_progress", "manufacturing"];

    const pending = manufacturingRecords.filter(r => pendingStatuses.includes(r.status)).length;
    const inProgress = manufacturingRecords.filter(r => inProgressStatuses.includes(r.status)).length;
    const completed = manufacturingRecords.filter(r => completedStatuses.includes(r.status)).length;

    return { total, pending, inProgress, completed };
  }, [manufacturingRecords]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Manufacturing Jobs",
      description: "View all jobs across all stages",
      icon: Factory,
      ...hubColors.blue,
      count: counts.total,
      href: "/manufacturing/list",
    },
    {
      id: "pending",
      label: "Pending Jobs",
      description: "Jobs awaiting manufacturing start",
      icon: Clock,
      ...hubColors.orange,
      count: counts.pending,
      href: "/manufacturing/list",
    },
    {
      id: "in-progress",
      label: "In Progress",
      description: "Jobs currently being manufactured",
      icon: Cog,
      ...hubColors.purple,
      count: counts.inProgress,
      href: "/manufacturing/list",
    },
    {
      id: "completed",
      label: "Completed",
      description: "Finished manufacturing jobs",
      icon: CheckCircle,
      ...hubColors.green,
      count: counts.completed,
      href: "/manufacturing/list",
    },
  ];

  return (
    <LandingHub
      title="Manufacturing Overview"
      subtitle="Track manufacturing jobs and production status"
      cards={cards}
      viewAllHref="/manufacturing/list"
      viewAllLabel="View All Jobs"
      isLoading={manufacturingLoading}
      tip="Click on any card to view manufacturing jobs. Use 'View All Jobs' for a complete list with advanced filters."
      testIdPrefix="manufacturers"
    />
  );
}
