import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Building2, Plus, ShoppingBag, Warehouse, Briefcase } from "lucide-react";
import type { Organization } from "@shared/schema";

export default function OrganizationsHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: organizations = [], isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
    retry: false,
  });

  const cards = useMemo<HubCardConfig[]>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalCount = organizations.length;
    const newCount = organizations.filter((org) => {
      if (!org.createdAt) return false;
      return new Date(org.createdAt) >= thirtyDaysAgo;
    }).length;
    const retailCount = organizations.filter((org) => org.clientType === "retail").length;
    const wholesaleCount = organizations.filter((org) => org.clientType === "wholesale").length;
    const enterpriseCount = organizations.filter((org) => org.clientType === "enterprise").length;

    return [
      {
        id: "all",
        label: "All Organizations",
        description: "View all organizations in your system",
        icon: Building2,
        ...hubColors.blue,
        count: totalCount,
        href: "/organizations/list",
      },
      {
        id: "new",
        label: "New Clients",
        description: "Organizations created in the last 30 days",
        icon: Plus,
        ...hubColors.green,
        count: newCount,
        href: "/organizations/list?filter=new",
      },
      {
        id: "retail",
        label: "Retail Clients",
        description: "Retail client organizations",
        icon: ShoppingBag,
        ...hubColors.purple,
        count: retailCount,
        href: "/organizations/list?type=retail",
      },
      {
        id: "wholesale",
        label: "Wholesale Clients",
        description: "Wholesale client organizations",
        icon: Warehouse,
        ...hubColors.orange,
        count: wholesaleCount,
        href: "/organizations/list?type=wholesale",
      },
      {
        id: "enterprise",
        label: "Enterprise Clients",
        description: "Enterprise client organizations",
        icon: Briefcase,
        ...hubColors.amber,
        count: enterpriseCount,
        href: "/organizations/list?type=enterprise",
      },
    ];
  }, [organizations]);

  return (
    <LandingHub
      title="Organizations"
      subtitle="Manage and view all client organizations"
      cards={cards}
      viewAllHref="/organizations/list"
      viewAllLabel="View All Organizations"
      isLoading={orgsLoading}
      tip="Click on any category above to filter organizations. Use 'View All Organizations' for the complete list with advanced filters."
      testIdPrefix="organizations"
      hubId="organizations"
    />
  );
}
