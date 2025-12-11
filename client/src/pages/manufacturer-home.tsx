import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { RoleHomeLayout, WorkflowGrid, QueuesSection, MetricsSnapshot, MetricCard } from "@/components/role-home/RoleHomeLayout";
import { WorkflowTile } from "@/components/role-home/WorkflowTile";
import { QueueWidget } from "@/components/role-home/QueueWidget";
import { 
  Factory, 
  ClipboardCheck, 
  CheckCircle, 
  Truck,
  Map,
  Wrench,
  AlertTriangle,
  Clock,
  Package,
  Activity
} from "lucide-react";

export default function ManufacturerHome() {
  const { user } = useAuth();

  const { data: manufacturing = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const todayJobsCount = manufacturing.filter((m: any) => {
    if (!m.estDelivery) return false;
    const delivery = new Date(m.estDelivery);
    const today = new Date();
    return delivery.toDateString() === today.toDateString();
  }).length;

  const specsReviewCount = manufacturing.filter((m: any) => 
    m.status === 'awaiting_admin_confirmation'
  ).length;

  const readyToShipCount = manufacturing.filter((m: any) => 
    m.status === 'packing_shipping'
  ).length;

  const activeProductionsCount = manufacturing.filter((m: any) => 
    m.status !== 'complete' && m.status !== 'cancelled'
  ).length;

  return (
    <RoleHomeLayout
      role="manufacturer"
      userName={user?.firstName || user?.email?.split("@")[0]}
    >
      <WorkflowGrid>
        <WorkflowTile
          id="today-production"
          title="Today's Production Jobs"
          description="Active manufacturing today"
          icon={Factory}
          bgGradient="from-orange-500/10 to-orange-500/5"
          iconColor="text-orange-400"
          primaryAction={{ label: "View Today", href: "/manufacturing?filter=today" }}
          subActions={[
            { label: "All Jobs", href: "/manufacturing" },
            { label: "My Line Items", href: "/manufacturer/line-items" },
          ]}
          badge={{ count: todayJobsCount, label: "Today" }}
        />

        <WorkflowTile
          id="spec-review"
          title="Spec Review Queue"
          description="Jobs awaiting specification review"
          icon={ClipboardCheck}
          bgGradient="from-amber-500/10 to-amber-500/5"
          iconColor="text-amber-400"
          primaryAction={{ label: "Review Specs", href: "/manufacturing?status=awaiting_admin_confirmation" }}
          badge={specsReviewCount > 0 ? { count: specsReviewCount, label: "Pending", variant: "warning" } : undefined}
        />

        <WorkflowTile
          id="samples-qc"
          title="Samples & Quality Control"
          description="Sample preparation and QC"
          icon={CheckCircle}
          bgGradient="from-emerald-500/10 to-emerald-500/5"
          iconColor="text-emerald-400"
          primaryAction={{ label: "QC Dashboard", href: "/manufacturing?status=quality_control" }}
          subActions={[
            { label: "Sample Prep", href: "/manufacturing?status=sample_prep" },
            { label: "Client Approval", href: "/manufacturing?status=sample_sent" },
          ]}
        />

        <WorkflowTile
          id="packing-shipment"
          title="Packing & Shipment"
          description="Ready to pack and ship"
          icon={Truck}
          bgGradient="from-blue-500/10 to-blue-500/5"
          iconColor="text-blue-400"
          primaryAction={{ label: "Shipping Queue", href: "/manufacturing?status=packing_shipping" }}
          badge={readyToShipCount > 0 ? { count: readyToShipCount, label: "Ready" } : undefined}
        />

        <WorkflowTile
          id="manufacturer-portal"
          title="Manufacturer Portal"
          description="Unified manufacturing view"
          icon={Map}
          bgGradient="from-violet-500/10 to-violet-500/5"
          iconColor="text-violet-400"
          primaryAction={{ label: "Open Portal", href: "/manufacturer-portal" }}
          subActions={[
            { label: "Order Specifications", href: "/order-specifications" },
            { label: "Capacity Dashboard", href: "/capacity-dashboard" },
          ]}
        />

        <WorkflowTile
          id="resources-tools"
          title="Resources & Tools"
          description="Pantone, fabrics, and specs"
          icon={Wrench}
          bgGradient="from-slate-500/10 to-slate-500/5"
          iconColor="text-slate-400"
          primaryAction={{ label: "Tools", href: "/manufacturing" }}
          subActions={[
            { label: "Fabric Management", href: "/fabric-management" },
            { label: "Size Checker", href: "/size-checker" },
          ]}
        />
      </WorkflowGrid>

      <QueuesSection>
        <QueueWidget
          id="at-risk-jobs"
          title="Jobs at Risk"
          icon={AlertTriangle}
          queryKey={["/api/manufacturing"]}
          filter={(jobs) => {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            return jobs.filter((j: any) => 
              j.estDelivery &&
              new Date(j.estDelivery) <= threeDaysFromNow &&
              j.status !== 'complete'
            );
          }}
          columns={[
            { key: "batchNumber", label: "Batch", className: "w-24 font-medium text-white" },
            { key: "order.orderCode", label: "Order", className: "w-24" },
          ]}
          rowAction={{ href: (job) => `/manufacturing?selected=${job.id}` }}
          viewAllHref="/manufacturing"
          emptyState={{ message: "No at-risk jobs", icon: CheckCircle }}
        />

        <QueueWidget
          id="awaiting-materials"
          title="Awaiting Materials"
          icon={Package}
          queryKey={["/api/manufacturing"]}
          filter={(jobs) => jobs.filter((j: any) => j.status === 'intake_pending')}
          columns={[
            { key: "batchNumber", label: "Batch", className: "w-24 font-medium text-white" },
            { key: "order.organization.name", label: "Client", className: "flex-1" },
          ]}
          rowAction={{ href: (job) => `/manufacturing?selected=${job.id}` }}
          viewAllHref="/manufacturing?status=intake_pending"
          emptyState={{ message: "No jobs awaiting materials", icon: Package }}
        />
      </QueuesSection>

      <MetricsSnapshot dashboardLink="/">
        <MetricCard label="Active Productions" value={activeProductionsCount} icon={Factory} />
        <MetricCard label="Ready to Ship" value={readyToShipCount} icon={Truck} />
        <MetricCard label="Today's Jobs" value={todayJobsCount} icon={Clock} />
        <MetricCard label="Spec Review" value={specsReviewCount} icon={ClipboardCheck} />
      </MetricsSnapshot>
    </RoleHomeLayout>
  );
}
