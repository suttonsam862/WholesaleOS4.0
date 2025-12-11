import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { RoleHomeLayout, WorkflowGrid, QueuesSection, MetricsSnapshot, MetricCard } from "@/components/role-home/RoleHomeLayout";
import { WorkflowTile } from "@/components/role-home/WorkflowTile";
import { QueueWidget } from "@/components/role-home/QueueWidget";
import { 
  Users, 
  Package, 
  Factory, 
  DollarSign, 
  BarChart3, 
  Settings,
  UserPlus,
  Plus,
  AlertTriangle,
  Activity,
  ShoppingCart
} from "lucide-react";
import { useState } from "react";
import { QuickCreateModal } from "@/components/modals/quick-create-modal";

export default function AdminHome() {
  const { user } = useAuth();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    retry: false,
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  const activeOrdersCount = orders.filter((o: any) => 
    o.status !== 'complete' && o.status !== 'cancelled'
  ).length;

  const quickActions = [
    {
      id: "create-user",
      label: "Create User",
      icon: UserPlus,
      onClick: () => setIsQuickCreateOpen(true),
    },
    {
      id: "create-product",
      label: "Create Product",
      icon: Plus,
      onClick: () => setIsQuickCreateOpen(true),
    },
  ];

  return (
    <>
      <RoleHomeLayout
        role="admin"
        userName={user?.firstName || user?.email?.split("@")[0]}
        quickActions={quickActions}
      >
        <WorkflowGrid>
          <WorkflowTile
            id="user-management"
            title="User & Role Management"
            description="Manage users, roles, and permissions"
            icon={Users}
            bgGradient="from-blue-500/10 to-blue-500/5"
            iconColor="text-blue-400"
            primaryAction={{ label: "Manage Users", href: "/user-management" }}
            subActions={[
              { label: "Role Permissions", href: "/admin/permissions" },
              { label: "Test Users", href: "/admin/test-users" },
            ]}
            badge={{ count: users.length, label: "Users" }}
          />

          <WorkflowTile
            id="product-catalog"
            title="Product & Catalog"
            description="Manage products, variants, and categories"
            icon={Package}
            bgGradient="from-purple-500/10 to-purple-500/5"
            iconColor="text-purple-400"
            primaryAction={{ label: "Open Catalog", href: "/catalog" }}
            subActions={[
              { label: "Admin Catalog", href: "/admin/catalog" },
              { label: "Archived Items", href: "/catalog/archived/categories" },
            ]}
            badge={{ count: products.length, label: "Products" }}
          />

          <WorkflowTile
            id="system-operations"
            title="System Operations"
            description="Orders, manufacturing, and production oversight"
            icon={Factory}
            bgGradient="from-orange-500/10 to-orange-500/5"
            iconColor="text-orange-400"
            primaryAction={{ label: "Operations Console", href: "/orders" }}
            subActions={[
              { label: "Order Map", href: "/order-map" },
              { label: "Pipeline View", href: "/pipeline" },
              { label: "Manufacturing", href: "/manufacturing" },
            ]}
            badge={{ count: activeOrdersCount, label: "Active" }}
          />

          <WorkflowTile
            id="financial-management"
            title="Financial Management"
            description="Invoices, payments, and financial matching"
            icon={DollarSign}
            bgGradient="from-emerald-500/10 to-emerald-500/5"
            iconColor="text-emerald-400"
            primaryAction={{ label: "Finance Dashboard", href: "/finance" }}
            subActions={[
              { label: "Invoices", href: "/finance?tab=invoices" },
              { label: "Commissions", href: "/finance?tab=commissions" },
            ]}
          />

          <WorkflowTile
            id="analytics-monitoring"
            title="Analytics & Monitoring"
            description="System analytics, logs, and health"
            icon={BarChart3}
            bgGradient="from-cyan-500/10 to-cyan-500/5"
            iconColor="text-cyan-400"
            primaryAction={{ label: "System Analytics", href: "/system-analytics" }}
            subActions={[
              { label: "Connection Health", href: "/connection-health" },
              { label: "Sales Analytics", href: "/sales-analytics" },
            ]}
          />

          <WorkflowTile
            id="configuration"
            title="Configuration & Settings"
            description="System settings and preferences"
            icon={Settings}
            bgGradient="from-slate-500/10 to-slate-500/5"
            iconColor="text-slate-400"
            primaryAction={{ label: "Settings", href: "/settings" }}
            subActions={[
              { label: "Fabric Management", href: "/fabric-management" },
              { label: "Designer Management", href: "/designer-management" },
            ]}
          />
        </WorkflowGrid>

        <QueuesSection>
          <QueueWidget
            id="unassigned-design-jobs"
            title="Unassigned Design Jobs"
            icon={AlertTriangle}
            queryKey={["/api/design-jobs"]}
            filter={(jobs) => jobs.filter((j: any) => !j.assignedDesignerId && j.status === 'pending')}
            columns={[
              { key: "jobCode", label: "Job", className: "w-24 font-medium text-white" },
              { key: "urgency", label: "Priority", className: "w-20" },
              { key: "createdAt", label: "Created", className: "flex-1 text-muted-foreground" },
            ]}
            rowAction={{ href: (job) => `/design-jobs/${job.id}` }}
            viewAllHref="/design-jobs?tab=assignments"
            emptyState={{ message: "All design jobs are assigned", icon: Activity }}
          />

          <QueueWidget
            id="orders-needing-manufacturing"
            title="Orders Needing Manufacturing"
            icon={Factory}
            queryKey={["/api/orders"]}
            filter={(orders) => orders.filter((o: any) => o.status === 'invoiced' && !o.manufacturingId)}
            columns={[
              { key: "orderCode", label: "Order", className: "w-24 font-medium text-white" },
              { key: "organization.name", label: "Organization", className: "flex-1" },
            ]}
            rowAction={{ href: (order) => `/orders?selected=${order.id}` }}
            viewAllHref="/orders"
            emptyState={{ message: "No orders waiting for manufacturing", icon: ShoppingCart }}
          />
        </QueuesSection>

        <MetricsSnapshot dashboardLink="/">
          <MetricCard label="Total Users" value={users.length} icon={Users} />
          <MetricCard label="Active Orders" value={activeOrdersCount} icon={ShoppingCart} />
          <MetricCard label="Products" value={products.length} icon={Package} />
          <MetricCard label="System Health" value="Good" icon={Activity} />
        </MetricsSnapshot>
      </RoleHomeLayout>

      <QuickCreateModal 
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
      />
    </>
  );
}
