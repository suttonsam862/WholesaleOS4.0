import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import { FileText, FileEdit, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import type { Quote } from "@shared/schema";

export default function QuotesHub() {
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

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
    retry: false,
  });

  const statusCounts = useMemo(() => {
    const counts = {
      all: quotes.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
    };

    quotes.forEach((quote) => {
      if (quote.status in counts) {
        counts[quote.status as keyof typeof counts]++;
      }
    });

    return counts;
  }, [quotes]);

  const cards: HubCardConfig[] = [
    {
      id: "all",
      label: "All Quotes",
      description: "View all quotes across all statuses",
      icon: FileText,
      ...hubColors.blue,
      count: statusCounts.all,
      href: "/quotes/list",
    },
    {
      id: "draft",
      label: "Draft",
      description: "Quotes in progress, not yet sent",
      icon: FileEdit,
      ...hubColors.slate,
      count: statusCounts.draft,
      href: "/quotes/list?status=draft",
    },
    {
      id: "sent",
      label: "Sent",
      description: "Quotes sent to customers awaiting response",
      icon: Send,
      ...hubColors.purple,
      count: statusCounts.sent,
      href: "/quotes/list?status=sent",
    },
    {
      id: "accepted",
      label: "Accepted",
      description: "Quotes accepted by customers",
      icon: CheckCircle,
      ...hubColors.green,
      count: statusCounts.accepted,
      href: "/quotes/list?status=accepted",
    },
    {
      id: "rejected",
      label: "Rejected",
      description: "Quotes declined by customers",
      icon: XCircle,
      ...hubColors.red,
      count: statusCounts.rejected,
      href: "/quotes/list?status=rejected",
    },
    {
      id: "expired",
      label: "Expired",
      description: "Quotes past their validity date",
      icon: Clock,
      ...hubColors.orange,
      count: statusCounts.expired,
      href: "/quotes/list?status=expired",
    },
  ];

  return (
    <LandingHub
      title="Quotes"
      subtitle="Manage customer quotes and proposals"
      cards={cards}
      viewAllHref="/quotes/list"
      viewAllLabel="View All Quotes"
      isLoading={quotesLoading}
      tip="Click on any status above to filter quotes. Use 'View All Quotes' for a complete list with advanced filters."
      testIdPrefix="quotes"
      hubId="quotes"
    />
  );
}
