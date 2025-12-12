import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Layers, CheckCircle, Clock, Shirt } from "lucide-react";
import type { Fabric } from "@shared/schema";

export default function FabricManagementHub() {
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

  const { data: fabrics = [], isLoading: fabricsLoading } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    retry: false,
  });

  const counts = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const total = fabrics.length;
    const approved = fabrics.filter((f) => f.isApproved).length;
    const recent = fabrics.filter((f) => {
      if (!f.createdAt) return false;
      return new Date(f.createdAt) >= thirtyDaysAgo;
    }).length;
    
    const typeGroups = new Set(fabrics.map((f) => f.fabricType).filter(Boolean));
    const byType = typeGroups.size;

    return { total, approved, recent, byType };
  }, [fabrics]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Fabrics",
      description: "Browse the complete fabric library",
      icon: Layers,
      ...hubColors.blue,
      count: counts.total,
      href: "/fabric-management/list",
    },
    {
      id: "approved",
      label: "Approved Fabrics",
      description: `${counts.approved} approved and ready to use`,
      icon: CheckCircle,
      ...hubColors.green,
      count: counts.approved,
      href: "/fabric-management/list",
    },
    {
      id: "by-type",
      label: "Fabric Types",
      description: `${counts.byType} unique fabric types available`,
      icon: Shirt,
      ...hubColors.purple,
      count: counts.byType,
      href: "/fabric-management/list",
    },
    {
      id: "recent",
      label: "Recently Added",
      description: `${counts.recent} fabrics added in last 30 days`,
      icon: Clock,
      ...hubColors.teal,
      count: counts.recent,
      href: "/fabric-management/list",
    },
  ];

  return (
    <LandingHub
      title="Fabric Management"
      subtitle="Manage fabric inventory and submissions"
      cards={cards}
      viewAllHref="/fabric-management/list"
      viewAllLabel="View All Fabrics"
      isLoading={fabricsLoading}
      tip="View your fabric library to manage and organize materials for production."
      testIdPrefix="fabrics"
    />
  );
}
