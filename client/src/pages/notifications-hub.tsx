import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { Bell, Circle, Package, AlertCircle, Clock } from "lucide-react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";

interface Notification {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  metadata?: any;
  createdAt: string;
  readAt?: string | null;
}

export default function NotificationsHub() {
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

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const counts = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      order: notifications.filter((n) => n.type === "order").length,
      system: notifications.filter((n) => n.type === "system").length,
      recent: notifications.filter((n) => new Date(n.createdAt) >= sevenDaysAgo).length,
    };
  }, [notifications]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Notifications",
      description: "View all your notifications",
      icon: Bell,
      ...hubColors.blue,
      count: counts.all,
      href: "/notifications/list",
    },
    {
      id: "unread",
      label: "Unread",
      description: "Notifications you haven't read yet",
      icon: Circle,
      ...hubColors.red,
      count: counts.unread,
      href: "/notifications/list?filter=unread",
    },
    {
      id: "order",
      label: "Order Updates",
      description: "Updates about your orders",
      icon: Package,
      ...hubColors.green,
      count: counts.order,
      href: "/notifications/list?type=order",
    },
    {
      id: "system",
      label: "System Alerts",
      description: "Important system notifications",
      icon: AlertCircle,
      ...hubColors.purple,
      count: counts.system,
      href: "/notifications/list?type=system",
    },
    {
      id: "recent",
      label: "Recent",
      description: "Notifications from the last 7 days",
      icon: Clock,
      ...hubColors.teal,
      count: counts.recent,
      href: "/notifications/list?filter=recent",
    },
  ];

  return (
    <LandingHub
      title="Notifications"
      subtitle="Select a category to view notifications"
      cards={cards}
      viewAllHref="/notifications/list"
      viewAllLabel="View All Notifications"
      isLoading={notificationsLoading}
      tip="Click on any category above to filter notifications. Use 'View All Notifications' for the complete list."
      testIdPrefix="notifications"
    />
  );
}
