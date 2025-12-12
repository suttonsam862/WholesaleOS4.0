import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { Store, ShoppingBag, FileEdit, Clock, Archive } from "lucide-react";
import { LandingHub, HubCardConfig, hubColors } from "@/components/LandingHub";
import { differenceInDays } from "date-fns";

interface TeamStore {
  id: number;
  storeName: string;
  status: string;
  archived?: boolean;
  storeCloseDate?: string | null;
}

export default function TeamStoresHub() {
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

  const { data: activeStores = [], isLoading: activeLoading } = useQuery<TeamStore[]>({
    queryKey: ["/api/team-stores"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: archivedStores = [], isLoading: archivedLoading } = useQuery<TeamStore[]>({
    queryKey: ["/api/team-stores/archived/list"],
    retry: false,
    enabled: isAuthenticated,
  });

  const counts = useMemo(() => {
    const allStores = [...activeStores, ...archivedStores];
    const now = new Date();

    const total = allStores.length;
    const active = activeStores.filter(store => !store.archived).length;
    const draft = activeStores.filter(store => store.status === "draft").length;
    const closingSoon = activeStores.filter(store => {
      if (!store.storeCloseDate || store.archived) return false;
      const closeDate = new Date(store.storeCloseDate);
      const daysUntilClose = differenceInDays(closeDate, now);
      return daysUntilClose >= 0 && daysUntilClose <= 7;
    }).length;
    const archived = archivedStores.length;

    return { total, active, draft, closingSoon, archived };
  }, [activeStores, archivedStores]);

  const cards: HubCardConfig[] = useMemo(() => [
    {
      id: "all",
      label: "All Stores",
      description: "View all team stores in the system",
      icon: Store,
      ...hubColors.blue,
      count: counts.total,
      href: "/team-stores/list",
    },
    {
      id: "active",
      label: "Active",
      description: "Currently active team stores",
      icon: ShoppingBag,
      ...hubColors.green,
      count: counts.active,
      href: "/team-stores/list?status=active",
    },
    {
      id: "draft",
      label: "Draft",
      description: "Stores still being configured",
      icon: FileEdit,
      ...hubColors.slate,
      count: counts.draft,
      href: "/team-stores/list?status=draft",
    },
    {
      id: "closing-soon",
      label: "Closing Soon",
      description: "Stores closing within 7 days",
      icon: Clock,
      ...hubColors.orange,
      count: counts.closingSoon,
      href: "/team-stores/list?filter=closing-soon",
    },
    {
      id: "archived",
      label: "Archived",
      description: "Completed or inactive stores",
      icon: Archive,
      ...hubColors.amber,
      count: counts.archived,
      href: "/team-stores/list?status=archived",
    },
  ], [counts]);

  const isLoadingData = activeLoading || archivedLoading;

  return (
    <LandingHub
      title="Team Stores"
      subtitle="Select a category to view team stores"
      cards={cards}
      viewAllHref="/team-stores/list"
      viewAllLabel="View All Stores"
      isLoading={isLoadingData}
      tip="Click on any card above to filter team stores by status. Use 'View All Stores' for a complete list with advanced filters."
      testIdPrefix="team-stores"
    />
  );
}
