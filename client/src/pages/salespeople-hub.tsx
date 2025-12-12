import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Users, UserCheck, Map, UserX } from "lucide-react";

import type { Salesperson } from "@shared/schema";

export default function SalespeopleHub() {
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

  const { data: salespeople = [], isLoading: salespeopleLoading } = useQuery<Salesperson[]>({
    queryKey: ["/api/salespeople"],
    retry: false,
    enabled: isAuthenticated,
  });

  const cards = useMemo(() => {
    const total = salespeople.length;
    const active = salespeople.filter(sp => sp.active).length;
    const inactive = salespeople.filter(sp => !sp.active).length;

    const territoriesMap: Record<string, number> = {};
    salespeople.forEach(sp => {
      if (sp.territory) {
        territoriesMap[sp.territory] = (territoriesMap[sp.territory] || 0) + 1;
      }
    });
    const uniqueTerritories = Object.keys(territoriesMap).length;

    const hubCards: HubCardConfig[] = [
      {
        id: "all",
        label: "All Salespeople",
        description: "View the complete sales team",
        icon: Users,
        ...hubColors.blue,
        count: total,
        href: "/salespeople/list",
      },
      {
        id: "active",
        label: "Active",
        description: "Currently active salespeople",
        icon: UserCheck,
        ...hubColors.green,
        count: active,
        href: "/salespeople/list?status=active",
      },
      {
        id: "territories",
        label: "By Territory",
        description: `${uniqueTerritories} territories defined`,
        icon: Map,
        ...hubColors.orange,
        count: uniqueTerritories,
        href: "/salespeople/list",
      },
      {
        id: "inactive",
        label: "Inactive",
        description: "Inactive salespeople",
        icon: UserX,
        ...hubColors.red,
        count: inactive,
        href: "/salespeople/list?status=inactive",
      },
    ];

    return hubCards;
  }, [salespeople]);

  return (
    <LandingHub
      title="Salespeople"
      subtitle="Manage your sales team and track performance"
      cards={cards}
      viewAllHref="/salespeople/list"
      viewAllLabel="View All Salespeople"
      isLoading={salespeopleLoading}
      tip="Click on any category to filter salespeople by that criteria. Use 'View All Salespeople' for a complete list with advanced filters."
      testIdPrefix="salespeople"
    />
  );
}
