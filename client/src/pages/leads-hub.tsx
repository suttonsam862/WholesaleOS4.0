import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { Clock, Target, Flame, Palette, Send, Store, Users, Archive } from "lucide-react";

type LeadStage = "future_lead" | "lead" | "hot_lead" | "mock_up" | "mock_up_sent" | "team_store_or_direct_order" | "current_clients" | "no_answer_delete";

interface Lead {
  id: number;
  stage: LeadStage;
}

const STAGE_CONFIGS: Array<{
  id: LeadStage;
  label: string;
  description: string;
  icon: typeof Clock;
  color: keyof typeof hubColors;
}> = [
  {
    id: "future_lead",
    label: "Future Lead",
    description: "Potential leads for future engagement",
    icon: Clock,
    color: "slate",
  },
  {
    id: "lead",
    label: "Lead",
    description: "New leads to be contacted",
    icon: Target,
    color: "blue",
  },
  {
    id: "hot_lead",
    label: "Hot Lead",
    description: "Actively engaged prospects",
    icon: Flame,
    color: "red",
  },
  {
    id: "mock_up",
    label: "Mock Up",
    description: "Mock-up creation in progress",
    icon: Palette,
    color: "purple",
  },
  {
    id: "mock_up_sent",
    label: "Mock Up Sent",
    description: "Mock-up sent, awaiting feedback",
    icon: Send,
    color: "orange",
  },
  {
    id: "team_store_or_direct_order",
    label: "Team Store/Direct",
    description: "Order placement phase",
    icon: Store,
    color: "green",
  },
  {
    id: "current_clients",
    label: "Current Clients",
    description: "Active customers",
    icon: Users,
    color: "teal",
  },
  {
    id: "no_answer_delete",
    label: "Archived",
    description: "Unresponsive or archived leads",
    icon: Archive,
    color: "amber",
  },
];

export default function LeadsHub() {
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

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    retry: false,
  });

  const stageCounts = useMemo(() => {
    const counts: Record<LeadStage, number> = {
      future_lead: 0,
      lead: 0,
      hot_lead: 0,
      mock_up: 0,
      mock_up_sent: 0,
      team_store_or_direct_order: 0,
      current_clients: 0,
      no_answer_delete: 0,
    };

    leads.forEach((lead) => {
      if (counts[lead.stage] !== undefined) {
        counts[lead.stage]++;
      }
    });

    return counts;
  }, [leads]);

  const cards: HubCardConfig[] = useMemo(() => {
    return STAGE_CONFIGS.map((stage) => ({
      id: stage.id,
      label: stage.label,
      description: stage.description,
      icon: stage.icon,
      ...hubColors[stage.color],
      count: stageCounts[stage.id],
      href: `/leads/list?stage=${stage.id}`,
    }));
  }, [stageCounts]);

  return (
    <LandingHub
      title="Leads"
      subtitle="Select a pipeline stage to view leads"
      cards={cards}
      viewAllHref="/leads/list"
      viewAllLabel="View All Leads"
      isLoading={leadsLoading}
      tip="Click on any stage above to see leads in that pipeline state. Use 'View All Leads' for a complete list with advanced filters."
      testIdPrefix="leads"
    />
  );
}
