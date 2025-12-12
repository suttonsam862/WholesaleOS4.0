import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, Plus, FileText, CreditCard, Users } from "lucide-react";
import { 
  HubLayout, 
  WorkflowTile, 
  WorkflowGrid, 
  QueuesSection, 
  QueueWidget,
  MetricsSnapshot,
  MetricCard
} from "@/components/workflow";
import { financeTiles, financeQueues } from "@/lib/financeWorkflowConfig";
import { filterTilesByRole, filterQueuesByRole } from "@/lib/workflowConfig";

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export default function FinanceHub() {
  const { user } = useAuth();
  const userRole = user?.role || "sales";

  const { data: overview, isLoading: overviewLoading } = useQuery<any>({
    queryKey: ["/api/financial/overview"],
  });

  const { data: invoices = [] } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: commissionPayments = [] } = useQuery<any[]>({
    queryKey: ["/api/commission-payments"],
  });

  const visibleTiles = filterTilesByRole(financeTiles, userRole);
  const visibleQueues = filterQueuesByRole(financeQueues, userRole);

  const overdueCount = invoices.filter((inv: any) => inv.status === "overdue").length;
  const pendingCount = invoices.filter((inv: any) => inv.status === "pending" || inv.status === "sent").length;
  const pendingCommissions = commissionPayments.filter((c: any) => c.status === "pending").length;

  const tilesWithBadges = visibleTiles.map(tile => {
    let badge = tile.badge;
    if (tile.id === "invoices" && (overdueCount > 0 || pendingCount > 0)) {
      if (overdueCount > 0) {
        badge = { count: overdueCount, label: "Overdue", variant: "warning" as const };
      } else if (pendingCount > 0) {
        badge = { count: pendingCount, label: "Pending" };
      }
    }
    if (tile.id === "commissions" && pendingCommissions > 0) {
      badge = { count: pendingCommissions, label: "Pending", variant: "warning" as const };
    }
    return { ...tile, badge };
  });

  const quickActions = [
    { id: "new-invoice", label: "Create Invoice", icon: FileText, href: "/finance/invoices?action=new" },
    { id: "new-payment", label: "Record Payment", icon: CreditCard, href: "/finance/payments?action=new" },
    { id: "new-commission", label: "Record Commission", icon: Users, href: "/finance/commissions?action=new" },
  ];

  if (overviewLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <HubLayout
      title="Finance"
      description="Manage invoices, payments, commissions, and financial matching"
      icon={DollarSign}
      breadcrumbs={[{ label: "Finance" }]}
      quickActions={quickActions}
    >
      <MetricsSnapshot title="Financial Summary">
        <MetricCard 
          label="Total Revenue" 
          value={formatCurrency(overview?.totalRevenue || 0)} 
          icon={DollarSign}
        />
        <MetricCard 
          label="Total Invoiced" 
          value={formatCurrency(invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0))} 
          icon={FileText}
        />
        <MetricCard 
          label="Pending Commissions" 
          value={formatCurrency(overview?.pendingCommissions || 0)} 
          icon={Users}
        />
        <MetricCard 
          label="Paid Commissions" 
          value={formatCurrency(overview?.paidCommissions || 0)} 
          icon={CreditCard}
        />
      </MetricsSnapshot>

      <WorkflowGrid columns={3}>
        {tilesWithBadges.map((tile) => (
          <WorkflowTile key={tile.id} {...tile} />
        ))}
      </WorkflowGrid>

      {visibleQueues.length > 0 && (
        <QueuesSection title="Attention Required">
          {visibleQueues.map((queue) => (
            <QueueWidget key={queue.id} {...queue} />
          ))}
        </QueuesSection>
      )}
    </HubLayout>
  );
}
