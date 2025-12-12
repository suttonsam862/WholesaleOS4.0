import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { CheckSquare, Clock, Loader, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import type { Task } from "@shared/schema";

export default function TasksHub() {
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

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    retry: false,
  });

  const counts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const allCount = tasks.length;
    const pendingCount = tasks.filter((t) => t.status === "pending").length;
    const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
    const completedCount = tasks.filter((t) => t.status === "completed").length;

    const overdueCount = tasks.filter((t) => {
      if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length;

    const dueTodayCount = tasks.filter((t) => {
      if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate <= todayEnd;
    }).length;

    return { allCount, pendingCount, inProgressCount, overdueCount, dueTodayCount, completedCount };
  }, [tasks]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Tasks",
      description: "View all tasks in the system",
      icon: CheckSquare,
      ...hubColors.blue,
      count: counts.allCount,
      href: "/tasks/list",
    },
    {
      id: "pending",
      label: "Pending",
      description: "Tasks waiting to be started",
      icon: Clock,
      ...hubColors.slate,
      count: counts.pendingCount,
      href: "/tasks/list?status=pending",
    },
    {
      id: "in-progress",
      label: "In Progress",
      description: "Tasks currently being worked on",
      icon: Loader,
      ...hubColors.purple,
      count: counts.inProgressCount,
      href: "/tasks/list?status=in_progress",
    },
    {
      id: "overdue",
      label: "Overdue",
      description: "Tasks past their due date",
      icon: AlertTriangle,
      ...hubColors.red,
      count: counts.overdueCount,
      href: "/tasks/list?filter=overdue",
    },
    {
      id: "due-today",
      label: "Due Today",
      description: "Tasks due today",
      icon: Calendar,
      ...hubColors.orange,
      count: counts.dueTodayCount,
      href: "/tasks/list?filter=due-today",
    },
    {
      id: "completed",
      label: "Completed",
      description: "Finished tasks",
      icon: CheckCircle,
      ...hubColors.green,
      count: counts.completedCount,
      href: "/tasks/list?status=completed",
    },
  ];

  return (
    <LandingHub
      title="Tasks"
      subtitle="Manage and track your tasks"
      cards={cards}
      viewAllHref="/tasks/list"
      viewAllLabel="View All Tasks"
      isLoading={isLoading || tasksLoading}
      tip="Click on any status card to filter tasks by that category. Use 'View All Tasks' for advanced filtering options."
      testIdPrefix="tasks"
    />
  );
}
