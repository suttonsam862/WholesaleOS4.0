import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Factory, Clock, Cog, ClipboardCheck, Package, Truck } from "lucide-react";

interface ManufacturingRecord {
  id: number;
  status: string;
}

export default function ManufacturingHub() {
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

  const { data: manufacturingRecords = [], isLoading: recordsLoading } = useQuery<ManufacturingRecord[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: manufacturingRecords.length,
      queue: 0,
      in_production: 0,
      qc: 0,
      ready_to_ship: 0,
      shipped: 0,
    };

    manufacturingRecords.forEach((record) => {
      if (counts[record.status] !== undefined) {
        counts[record.status]++;
      }
    });

    return counts;
  }, [manufacturingRecords]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Items",
      description: "View all manufacturing records",
      icon: Factory,
      ...hubColors.blue,
      count: statusCounts.all,
      href: "/manufacturing/list",
    },
    {
      id: "queue",
      label: "Queue",
      description: "Awaiting manufacturing start",
      icon: Clock,
      ...hubColors.slate,
      count: statusCounts.queue,
      href: "/manufacturing/list?status=queue",
    },
    {
      id: "in_production",
      label: "In Production",
      description: "Currently being manufactured",
      icon: Cog,
      ...hubColors.orange,
      count: statusCounts.in_production,
      href: "/manufacturing/list?status=in_production",
    },
    {
      id: "qc",
      label: "Quality Check",
      description: "Undergoing quality control",
      icon: ClipboardCheck,
      ...hubColors.purple,
      count: statusCounts.qc,
      href: "/manufacturing/list?status=qc",
    },
    {
      id: "ready_to_ship",
      label: "Ready to Ship",
      description: "Completed and awaiting shipment",
      icon: Package,
      ...hubColors.green,
      count: statusCounts.ready_to_ship,
      href: "/manufacturing/list?status=ready_to_ship",
    },
    {
      id: "shipped",
      label: "Shipped",
      description: "Shipped to destination",
      icon: Truck,
      ...hubColors.teal,
      count: statusCounts.shipped,
      href: "/manufacturing/list?status=shipped",
    },
  ];

  return (
    <LandingHub
      title="Manufacturing"
      subtitle="Track production stages and manufacturing workflow"
      cards={cards}
      viewAllHref="/manufacturing/list"
      viewAllLabel="View All Manufacturing"
      isLoading={isLoading || recordsLoading}
      tip="Click on any stage to filter manufacturing records by status. Use 'View All Manufacturing' for the complete list with advanced filters."
      testIdPrefix="manufacturing"
    />
  );
}
