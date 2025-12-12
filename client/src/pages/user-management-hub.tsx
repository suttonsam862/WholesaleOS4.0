import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Users, Shield, TrendingUp, Palette, Settings, Factory, UserX } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: "admin" | "sales" | "designer" | "ops" | "manufacturer";
  isActive?: boolean;
}

export default function UserManagementHub() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const cards: HubCardConfig[] = useMemo(() => {
    const totalUsers = users.length;
    const admins = users.filter(u => u.role === "admin").length;
    const salesTeam = users.filter(u => u.role === "sales").length;
    const designers = users.filter(u => u.role === "designer").length;
    const operations = users.filter(u => u.role === "ops").length;
    const manufacturers = users.filter(u => u.role === "manufacturer").length;
    const inactiveUsers = users.filter(u => u.isActive === false).length;

    return [
      {
        id: "all",
        label: "All Users",
        description: "View all users in the system",
        icon: Users,
        ...hubColors.blue,
        count: totalUsers,
        href: "/user-management/list",
      },
      {
        id: "admin",
        label: "Admins",
        description: "System administrators",
        icon: Shield,
        ...hubColors.purple,
        count: admins,
        href: "/user-management/list?role=admin",
      },
      {
        id: "sales",
        label: "Sales Team",
        description: "Sales representatives",
        icon: TrendingUp,
        ...hubColors.green,
        count: salesTeam,
        href: "/user-management/list?role=sales",
      },
      {
        id: "designer",
        label: "Designers",
        description: "Design team members",
        icon: Palette,
        ...hubColors.pink,
        count: designers,
        href: "/user-management/list?role=designer",
      },
      {
        id: "ops",
        label: "Operations",
        description: "Operations team members",
        icon: Settings,
        ...hubColors.orange,
        count: operations,
        href: "/user-management/list?role=ops",
      },
      {
        id: "manufacturer",
        label: "Manufacturers",
        description: "Manufacturing partners",
        icon: Factory,
        ...hubColors.amber,
        count: manufacturers,
        href: "/user-management/list?role=manufacturer",
      },
      {
        id: "inactive",
        label: "Inactive Users",
        description: "Deactivated user accounts",
        icon: UserX,
        ...hubColors.red,
        count: inactiveUsers,
        href: "/user-management/list?status=inactive",
      },
    ];
  }, [users]);

  return (
    <LandingHub
      title="User Management"
      subtitle="Manage users by role and status"
      cards={cards}
      viewAllHref="/user-management/list"
      viewAllLabel="View All Users"
      isLoading={usersLoading}
      tip="Click on any category above to view and manage users by role. Use 'View All Users' for the complete list with advanced filters."
      testIdPrefix="users"
    />
  );
}
