import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Calendar, FileEdit, Clipboard, CheckCircle, Radio, PartyPopper } from "lucide-react";
import type { Event } from "@shared/schema";

export default function EventsHub() {
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

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    retry: false,
  });

  const statusCounts = useMemo(() => {
    const counts = {
      all: events.length,
      draft: 0,
      planning: 0,
      approved: 0,
      live: 0,
      completed: 0,
    };

    events.forEach((event) => {
      if (event.status in counts) {
        counts[event.status as keyof typeof counts]++;
      }
    });

    return counts;
  }, [events]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Events",
      description: "View all events across all statuses",
      icon: Calendar,
      ...hubColors.blue,
      count: statusCounts.all,
      href: "/events/list",
    },
    {
      id: "draft",
      label: "Draft Events",
      description: "Events still being drafted",
      icon: FileEdit,
      ...hubColors.slate,
      count: statusCounts.draft,
      href: "/events/list?status=draft",
    },
    {
      id: "planning",
      label: "Planning",
      description: "Events in planning phase",
      icon: Clipboard,
      ...hubColors.purple,
      count: statusCounts.planning,
      href: "/events/list?status=planning",
    },
    {
      id: "approved",
      label: "Approved",
      description: "Events approved and ready",
      icon: CheckCircle,
      ...hubColors.green,
      count: statusCounts.approved,
      href: "/events/list?status=approved",
    },
    {
      id: "live",
      label: "Live",
      description: "Currently active events",
      icon: Radio,
      ...hubColors.orange,
      count: statusCounts.live,
      href: "/events/list?status=live",
    },
    {
      id: "completed",
      label: "Completed",
      description: "Events that have finished",
      icon: PartyPopper,
      ...hubColors.teal,
      count: statusCounts.completed,
      href: "/events/list?status=completed",
    },
  ];

  return (
    <LandingHub
      title="Events"
      subtitle="Select a status to view events"
      cards={cards}
      viewAllHref="/events/list"
      viewAllLabel="View All Events"
      isLoading={eventsLoading || isLoading}
      tip="Click on any status card to see events in that state. Use 'View All Events' for a complete list with advanced filters."
      testIdPrefix="events"
    />
  );
}
