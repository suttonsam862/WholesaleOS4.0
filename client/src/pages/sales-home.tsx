import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { RoleHomeLayout, WorkflowGrid, QueuesSection, MetricsSnapshot, MetricCard } from "@/components/role-home/RoleHomeLayout";
import { WorkflowTile } from "@/components/role-home/WorkflowTile";
import { QueueWidget } from "@/components/role-home/QueueWidget";
import { 
  Target, 
  Calendar, 
  Plus, 
  Building2, 
  ShoppingCart, 
  TrendingUp,
  FileText,
  Users,
  Flame,
  Clock
} from "lucide-react";
import { useState } from "react";
import { QuickCreateModal } from "@/components/modals/quick-create-modal";

export default function SalesHome() {
  const { user } = useAuth();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
    retry: false,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const { data: quotes = [] } = useQuery<any[]>({
    queryKey: ["/api/quotes"],
    retry: false,
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/organizations"],
    retry: false,
  });

  const myLeads = leads.filter((l: any) => l.ownerUserId === user?.id);
  const hotLeadsCount = myLeads.filter((l: any) => l.stage === 'hot_lead').length;
  const activeOrdersCount = orders.filter((o: any) => 
    o.salespersonId === user?.id && o.status !== 'complete' && o.status !== 'cancelled'
  ).length;

  const quickActions = [
    {
      id: "new-lead",
      label: "New Lead",
      icon: Target,
      onClick: () => setIsQuickCreateOpen(true),
    },
    {
      id: "new-quote",
      label: "New Quote",
      icon: FileText,
      onClick: () => setIsQuickCreateOpen(true),
    },
    {
      id: "new-organization",
      label: "New Organization",
      icon: Building2,
      onClick: () => setIsQuickCreateOpen(true),
    },
  ];

  return (
    <>
      <RoleHomeLayout
        role="sales"
        userName={user?.firstName || user?.email?.split("@")[0]}
        quickActions={quickActions}
      >
        <WorkflowGrid>
          <WorkflowTile
            id="deal-pipeline"
            title="My Deal Pipeline"
            description="Manage leads through all stages"
            icon={Target}
            bgGradient="from-rose-500/10 to-rose-500/5"
            iconColor="text-rose-400"
            primaryAction={{ label: "Open Pipeline", href: "/leads" }}
            subActions={[
              { label: "Hot Leads", href: "/leads?stage=hot_lead" },
              { label: "Follow-ups", href: "/sales-tracker" },
            ]}
            badge={hotLeadsCount > 0 ? { count: hotLeadsCount, label: "Hot", variant: "warning" } : undefined}
          />

          <WorkflowTile
            id="work-this-week"
            title="Work This Week"
            description="Deals and tasks due soon"
            icon={Calendar}
            bgGradient="from-amber-500/10 to-amber-500/5"
            iconColor="text-amber-400"
            primaryAction={{ label: "View Schedule", href: "/sales-tracker?filter=thisWeek" }}
            subActions={[
              { label: "Today's Follow-ups", href: "/sales-tracker?filter=today" },
              { label: "This Week", href: "/sales-tracker?filter=week" },
            ]}
          />

          <WorkflowTile
            id="create-business"
            title="Create New Business"
            description="Start deals, quotes, and orders"
            icon={Plus}
            bgGradient="from-emerald-500/10 to-emerald-500/5"
            iconColor="text-emerald-400"
            primaryAction={{ label: "New Lead", href: "/leads" }}
            subActions={[
              { label: "New Quote", href: "/quotes" },
              { label: "New Order", href: "/orders" },
            ]}
          />

          <WorkflowTile
            id="client-management"
            title="Client Management"
            description="Organizations and contacts"
            icon={Building2}
            bgGradient="from-blue-500/10 to-blue-500/5"
            iconColor="text-blue-400"
            primaryAction={{ label: "Organizations", href: "/organizations" }}
            subActions={[
              { label: "Contacts", href: "/contacts" },
              { label: "Team Stores", href: "/team-stores" },
              { label: "Events", href: "/events" },
            ]}
            badge={{ count: organizations.length, label: "Orgs" }}
          />

          <WorkflowTile
            id="quotes-orders"
            title="Quotes & Orders"
            description="Manage quotes and track orders"
            icon={ShoppingCart}
            bgGradient="from-violet-500/10 to-violet-500/5"
            iconColor="text-violet-400"
            primaryAction={{ label: "My Orders", href: "/orders" }}
            subActions={[
              { label: "Quotes", href: "/quotes" },
              { label: "Order Forms", href: "/order-forms" },
              { label: "Completed Leads", href: "/completed-leads" },
            ]}
            badge={activeOrdersCount > 0 ? { count: activeOrdersCount, label: "Active" } : undefined}
          />

          <WorkflowTile
            id="resources-analytics"
            title="Resources & Analytics"
            description="Sales tools and performance"
            icon={TrendingUp}
            bgGradient="from-cyan-500/10 to-cyan-500/5"
            iconColor="text-cyan-400"
            primaryAction={{ label: "Sales Analytics", href: "/sales-analytics" }}
            subActions={[
              { label: "Sales Resources", href: "/sales-resources" },
              { label: "Sales Tracker", href: "/sales-tracker" },
            ]}
          />
        </WorkflowGrid>

        <QueuesSection>
          <QueueWidget
            id="leads-needing-design"
            title="Leads Needing Design Brief"
            icon={Target}
            queryKey={["/api/leads"]}
            filter={(leads) => leads.filter((l: any) => 
              l.stage === 'mock_up' && 
              !l.designJobId &&
              l.ownerUserId === user?.id
            )}
            columns={[
              { key: "leadCode", label: "Lead", className: "w-24 font-medium text-white" },
              { key: "organization.name", label: "Organization", className: "flex-1" },
            ]}
            rowAction={{ href: (lead) => `/leads?selected=${lead.id}` }}
            viewAllHref="/leads?stage=mock_up"
            emptyState={{ message: "No leads waiting for design brief", icon: Flame }}
          />

          <QueueWidget
            id="orders-needing-attention"
            title="My Orders Needing Attention"
            icon={Clock}
            queryKey={["/api/orders"]}
            filter={(orders) => orders.filter((o: any) => 
              o.salespersonId === user?.id &&
              (o.status === 'waiting_sizes' || !o.designApproved)
            )}
            columns={[
              { key: "orderCode", label: "Order", className: "w-24 font-medium text-white" },
              { key: "status", label: "Status", className: "w-28" },
              { key: "organization.name", label: "Client", className: "flex-1" },
            ]}
            rowAction={{ href: (order) => `/orders/${order.id}` }}
            viewAllHref="/orders"
            emptyState={{ message: "All orders are on track", icon: ShoppingCart }}
          />

          <QueueWidget
            id="quotes-to-send"
            title="Quotes Ready to Send"
            icon={FileText}
            queryKey={["/api/quotes"]}
            filter={(quotes) => quotes.filter((q: any) => q.status === 'draft')}
            columns={[
              { key: "quoteCode", label: "Quote", className: "w-24 font-medium text-white" },
              { key: "quoteName", label: "Name", className: "flex-1" },
            ]}
            rowAction={{ href: (quote) => `/quotes?selected=${quote.id}` }}
            viewAllHref="/quotes"
            emptyState={{ message: "No draft quotes", icon: FileText }}
          />
        </QueuesSection>

        <MetricsSnapshot dashboardLink="/">
          <MetricCard label="My Leads" value={myLeads.length} icon={Target} />
          <MetricCard label="Hot Leads" value={hotLeadsCount} icon={Flame} />
          <MetricCard label="Active Orders" value={activeOrdersCount} icon={ShoppingCart} />
          <MetricCard label="Organizations" value={organizations.length} icon={Users} />
        </MetricsSnapshot>
      </RoleHomeLayout>

      <QuickCreateModal 
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </>
  );
}
