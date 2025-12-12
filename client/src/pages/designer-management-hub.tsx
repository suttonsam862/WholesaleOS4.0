import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Palette, UserCheck, Sparkles, Loader, UserX } from "lucide-react";

interface Designer {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface DesignJob {
  id: number;
  assignedDesignerId: number | null;
  status: string;
}

export default function DesignerManagementHub() {
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

  const { data: designers = [], isLoading: designersLoading } = useQuery<Designer[]>({
    queryKey: ["/api/designers"],
    retry: false,
  });

  const { data: designJobs = [] } = useQuery<DesignJob[]>({
    queryKey: ["/api/design-jobs"],
    retry: false,
  });

  const counts = useMemo(() => {
    const total = designers.length;
    const active = designers.filter((d) => d.isActive).length;
    const inactive = designers.filter((d) => !d.isActive).length;

    const activeDesignerIds = new Set(
      designJobs
        .filter((job) => ["assigned", "in_progress"].includes(job.status))
        .map((job) => job.assignedDesignerId)
        .filter(Boolean)
    );

    const activeDesigners = designers.filter((d) => d.isActive);
    const busy = activeDesigners.filter((d) => activeDesignerIds.has(d.id)).length;
    const available = activeDesigners.filter((d) => !activeDesignerIds.has(d.id)).length;

    return { total, active, inactive, busy, available };
  }, [designers, designJobs]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Designers",
      description: "View all designers in the system",
      icon: Palette,
      ...hubColors.blue,
      count: counts.total,
      href: "/designer-management/list",
    },
    {
      id: "active",
      label: "Active",
      description: "Designers currently active in the system",
      icon: UserCheck,
      ...hubColors.green,
      count: counts.active,
      href: "/designer-management/list?status=active",
    },
    {
      id: "available",
      label: "Available",
      description: "Active designers without current assignments",
      icon: Sparkles,
      ...hubColors.teal,
      count: counts.available,
      href: "/designer-management/list?status=available",
    },
    {
      id: "busy",
      label: "Busy",
      description: "Designers with active design assignments",
      icon: Loader,
      ...hubColors.orange,
      count: counts.busy,
      href: "/designer-management/list?status=busy",
    },
    {
      id: "inactive",
      label: "Inactive",
      description: "Designers not currently active",
      icon: UserX,
      ...hubColors.red,
      count: counts.inactive,
      href: "/designer-management/list?status=inactive",
    },
  ];

  return (
    <LandingHub
      title="Designer Management"
      subtitle="Manage designers, track workloads, and assign design jobs"
      cards={cards}
      viewAllHref="/designer-management/list"
      viewAllLabel="View All Designers"
      isLoading={designersLoading}
      tip="Click on any status above to filter designers. Use 'View All Designers' for a complete list with advanced management options."
      testIdPrefix="designers"
    />
  );
}
