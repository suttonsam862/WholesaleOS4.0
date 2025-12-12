import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { Users, Star, Clock, UserCog, Briefcase } from "lucide-react";
import { LandingHub, hubColors, type HubCardConfig } from "@/components/LandingHub";
import type { Contact } from "@shared/schema";

export default function ContactsHub() {
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

  const { data: contacts = [], isLoading: contactsLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    retry: false,
  });

  const cards: HubCardConfig[] = useMemo(() => {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const allCount = contacts.length;
    const primaryCount = contacts.filter((c) => c.isPrimary).length;
    const recentCount = contacts.filter((c) => {
      if (!c.createdAt) return false;
      const createdDate = new Date(c.createdAt);
      return createdDate >= fourteenDaysAgo;
    }).length;
    const customerCount = contacts.filter((c) => c.role === "customer").length;
    const executiveCount = contacts.filter((c) => c.role === "executive").length;

    return [
      {
        id: "all",
        label: "All Contacts",
        description: "View all contacts in the system",
        icon: Users,
        ...hubColors.blue,
        count: allCount,
        href: "/contacts/list",
      },
      {
        id: "primary",
        label: "Primary Contacts",
        description: "Main points of contact for organizations",
        icon: Star,
        ...hubColors.green,
        count: primaryCount,
        href: "/contacts/list?filter=primary",
      },
      {
        id: "recent",
        label: "Recent Contacts",
        description: "Added in the last 14 days",
        icon: Clock,
        ...hubColors.purple,
        count: recentCount,
        href: "/contacts/list?filter=recent",
      },
      {
        id: "customer",
        label: "Customer Contacts",
        description: "Contacts with customer role",
        icon: UserCog,
        ...hubColors.orange,
        count: customerCount,
        href: "/contacts/list?role=customer",
      },
      {
        id: "executive",
        label: "Executive Contacts",
        description: "Contacts with executive role",
        icon: Briefcase,
        ...hubColors.amber,
        count: executiveCount,
        href: "/contacts/list?role=executive",
      },
    ];
  }, [contacts]);

  return (
    <LandingHub
      title="Contacts"
      subtitle="Manage and organize your contacts"
      cards={cards}
      viewAllHref="/contacts/list"
      viewAllLabel="View All Contacts"
      isLoading={contactsLoading}
      tip="Click on any category above to filter contacts. Use 'View All Contacts' for a complete list with advanced filters."
      testIdPrefix="contacts"
    />
  );
}
