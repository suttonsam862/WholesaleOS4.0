import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Factory, UserCheck, Clock, CheckCircle, UserX } from "lucide-react";
import type { User } from "@shared/schema";

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

  const { data: manufacturerUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "manufacturer" }],
    retry: false,
  });

  const { data: manufacturingRecords = [], isLoading: manufacturingLoading } = useQuery<ManufacturingRecord[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const counts = useMemo(() => {
    const total = manufacturerUsers.length;
    const active = manufacturerUsers.filter((u) => u.isActive).length;
    const inactive = manufacturerUsers.filter((u) => !u.isActive).length;

    const pendingStatuses = [
      "awaiting_admin_confirmation",
      "confirmed_awaiting_manufacturing",
    ];
    const completedStatuses = ["complete", "shipped"];

    const usersWithPending = new Set(
      manufacturingRecords
        .filter((r) => r.assignedTo && pendingStatuses.includes(r.status))
        .map((r) => r.assignedTo)
    ).size;

    const usersWithCompleted = new Set(
      manufacturingRecords
        .filter((r) => r.assignedTo && completedStatuses.includes(r.status))
        .map((r) => r.assignedTo)
    ).size;

    return {
      total,
      active,
      inactive,
      withPending: usersWithPending,
      withCompleted: usersWithCompleted,
    };
  }, [manufacturerUsers, manufacturingRecords]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Manufacturers",
      description: "View all manufacturing partners",
      icon: Factory,
      ...hubColors.blue,
      count: counts.total,
      href: "/manufacturer-management/list",
    },
    {
      id: "active",
      label: "Active",
      description: "Currently active manufacturers",
      icon: UserCheck,
      ...hubColors.green,
      count: counts.active,
      href: "/manufacturer-management/list?status=active",
    },
    {
      id: "pending",
      label: "With Pending Jobs",
      description: "Manufacturers with pending work",
      icon: Clock,
      ...hubColors.orange,
      count: counts.withPending,
      href: "/manufacturer-management/list?filter=pending",
    },
    {
      id: "completed",
      label: "Completed Jobs",
      description: "Manufacturers with completed work",
      icon: CheckCircle,
      ...hubColors.teal,
      count: counts.withCompleted,
      href: "/manufacturer-management/list?filter=completed",
    },
    {
      id: "inactive",
      label: "Inactive",
      description: "Inactive manufacturer accounts",
      icon: UserX,
      ...hubColors.red,
      count: counts.inactive,
      href: "/manufacturer-management/list?status=inactive",
    },
  ];

  return (
    <LandingHub
      title="Manufacturer Management"
      subtitle="Manage manufacturing partners and track job assignments"
      cards={cards}
      viewAllHref="/manufacturer-management/list"
      viewAllLabel="View All Manufacturers"
      isLoading={usersLoading || manufacturingLoading}
      tip="Click on any card to filter manufacturers by that status. Use 'View All Manufacturers' for a complete list with advanced filters."
      testIdPrefix="manufacturers"
    />
  );
}
