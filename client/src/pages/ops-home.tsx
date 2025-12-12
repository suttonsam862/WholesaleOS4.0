import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { RoleHomeLayout, WorkflowGrid, QueuesSection, MetricsSnapshot, MetricCard } from "@/components/role-home/RoleHomeLayout";
import { WorkflowTile } from "@/components/role-home/WorkflowTile";
import { QueueWidget } from "@/components/role-home/QueueWidget";
import { 
  ShoppingCart, 
  Factory, 
  Palette, 
  Store,
  Package,
  BarChart3,
  AlertTriangle,
  Clock,
  Users,
  Activity
} from "lucide-react";
import { useState } from "react";
import { QuickCreateModal } from "@/components/modals/quick-create-modal";

export default function OpsHome() {
  const { user } = useAuth();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const { data: designJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/design-jobs"],
    retry: false,
  });

  const { data: manufacturing = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const { data: teamStores = [] } = useQuery<any[]>({
    queryKey: ["/api/team-stores"],
    retry: false,
  });

  const activeOrdersCount = orders.filter((o: any) => 
    o.status !== 'complete' && o.status !== 'cancelled'
  ).length;
  const inProductionCount = manufacturing.filter((m: any) => 
    m.status !== 'complete' && m.status !== 'cancelled'
  ).length;
  const unassignedDesignJobsCount = designJobs.filter((j: any) => 
    !j.assignedDesignerId && j.status === 'pending'
  ).length;
  const activeTeamStoresCount = teamStores.filter((ts: any) => ts.status === 'active').length;

  const quickActions = [
    {
      id: "new-order",
      label: "New Order",
      icon: ShoppingCart,
      onClick: () => setIsQuickCreateOpen(true),
    },
  ];

  return (
    <>
      <RoleHomeLayout
        role="ops"
        userName={user?.firstName || user?.email?.split("@")[0]}
        quickActions={quickActions}
      >
        <WorkflowGrid>
          <WorkflowTile
            id="order-control"
            title="Order Control Center"
            description="Manage all orders end-to-end"
            icon={ShoppingCart}
            bgGradient="from-blue-500/10 to-blue-500/5"
            iconColor="text-blue-400"
            primaryAction={{ label: "All Orders", href: "/orders" }}
            subActions={[
              { label: "Order Map", href: "/order-map" },
              { label: "Pipeline View", href: "/pipeline" },
            ]}
            badge={{ count: activeOrdersCount, label: "Active" }}
          />

          <WorkflowTile
            id="manufacturing-overview"
            title="Manufacturing Overview"
            description="Production status and assignments"
            icon={Factory}
            bgGradient="from-orange-500/10 to-orange-500/5"
            iconColor="text-orange-400"
            primaryAction={{ label: "Manufacturing", href: "/manufacturing" }}
            subActions={[
              { label: "Assign to Manufacturer", href: "/manufacturer-management" },
              { label: "Production Schedule", href: "/size-checker" },
              { label: "Order Specs", href: "/order-specifications" },
            ]}
            badge={{ count: inProductionCount, label: "In Production" }}
          />

          <WorkflowTile
            id="design-assignment"
            title="Design Job Assignment"
            description="Assign and monitor design work"
            icon={Palette}
            bgGradient="from-violet-500/10 to-violet-500/5"
            iconColor="text-violet-400"
            primaryAction={{ label: "Design Jobs", href: "/design-jobs" }}
            subActions={[
              { label: "Unassigned Jobs", href: "/design-jobs?tab=assignments" },
              { label: "Designer Management", href: "/designer-management" },
            ]}
            badge={unassignedDesignJobsCount > 0 ? { count: unassignedDesignJobsCount, label: "Unassigned", variant: "warning" } : undefined}
          />

          <WorkflowTile
            id="team-stores-events"
            title="Team Stores & Events"
            description="Manage team stores and events"
            icon={Store}
            bgGradient="from-emerald-500/10 to-emerald-500/5"
            iconColor="text-emerald-400"
            primaryAction={{ label: "Team Stores", href: "/team-stores" }}
            subActions={[
              { label: "Events", href: "/events" },
            ]}
            badge={{ count: activeTeamStoresCount, label: "Active" }}
          />

          <WorkflowTile
            id="catalog-management"
            title="Catalog Management"
            description="Products, variants, and categories"
            icon={Package}
            bgGradient="from-purple-500/10 to-purple-500/5"
            iconColor="text-purple-400"
            primaryAction={{ label: "Catalog", href: "/catalog" }}
            subActions={[
              { label: "Admin Catalog", href: "/admin/catalog" },
              { label: "Archived Items", href: "/catalog/archived/categories" },
            ]}
          />

          <WorkflowTile
            id="capacity-planning"
            title="Capacity & Planning"
            description="Resource planning and capacity"
            icon={BarChart3}
            bgGradient="from-cyan-500/10 to-cyan-500/5"
            iconColor="text-cyan-400"
            primaryAction={{ label: "Capacity Dashboard", href: "/capacity-dashboard" }}
            subActions={[
              { label: "Size Checker", href: "/size-checker" },
              { label: "Manufacturer Portal", href: "/manufacturer-portal" },
            ]}
          />
        </WorkflowGrid>

        <QueuesSection>
          <QueueWidget
            id="orders-needing-manufacturing"
            title="Orders Needing Manufacturing Assignment"
            icon={AlertTriangle}
            queryKey={["/api/orders"]}
            filter={(orders) => orders.filter((o: any) => 
              o.status === 'invoiced' && !o.manufacturingId
            )}
            columns={[
              { key: "orderCode", label: "Order", className: "w-24 font-medium text-white" },
              { key: "organization.name", label: "Organization", className: "flex-1" },
            ]}
            rowAction={{ href: (order) => `/orders/${order.id}` }}
            viewAllHref="/orders"
            emptyState={{ message: "All orders have manufacturing assigned", icon: Factory }}
          />

          <QueueWidget
            id="unassigned-design-jobs"
            title="Design Jobs Needing Assignment"
            icon={Palette}
            queryKey={["/api/design-jobs"]}
            filter={(jobs) => jobs.filter((j: any) => !j.assignedDesignerId && j.status === 'pending')}
            columns={[
              { key: "jobCode", label: "Job", className: "w-24 font-medium text-white" },
              { key: "urgency", label: "Priority", className: "w-20" },
            ]}
            rowAction={{ href: "/design-jobs?tab=assignments" }}
            viewAllHref="/design-jobs?tab=assignments"
            emptyState={{ message: "All design jobs are assigned", icon: Palette }}
          />

          <QueueWidget
            id="manufacturing-qc-issues"
            title="Manufacturing QC/Packaging Issues"
            icon={Clock}
            queryKey={["/api/manufacturing"]}
            filter={(jobs) => jobs.filter((j: any) => 
              (j.status === 'quality_control' || j.status === 'packing_shipping')
            )}
            columns={[
              { key: "batchNumber", label: "Batch", className: "w-24 font-medium text-white" },
              { key: "status", label: "Status", className: "w-28" },
            ]}
            rowAction={{ href: (job) => `/manufacturing?selected=${job.id}` }}
            viewAllHref="/manufacturing"
            emptyState={{ message: "No QC issues", icon: Factory }}
          />
        </QueuesSection>

        <MetricsSnapshot dashboardLink="/">
          <MetricCard label="Total Orders" value={activeOrdersCount} icon={ShoppingCart} />
          <MetricCard label="In Production" value={inProductionCount} icon={Factory} />
          <MetricCard label="Design Jobs" value={designJobs.length} icon={Palette} />
          <MetricCard label="Team Stores" value={activeTeamStoresCount} icon={Users} />
        </MetricsSnapshot>
      </RoleHomeLayout>

      <QuickCreateModal 
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </>
  );
}
