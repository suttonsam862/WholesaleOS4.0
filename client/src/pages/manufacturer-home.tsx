import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { RoleHomeLayout, WorkflowGrid, QueuesSection, MetricsSnapshot, MetricCard } from "@/components/role-home/RoleHomeLayout";
import { WorkflowTile } from "@/components/role-home/WorkflowTile";
import { QueueWidget } from "@/components/role-home/QueueWidget";
import { ViewSwitcher, ProductionFloorCanvas } from "@/components/manufacturing-control-floor";
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
  Inbox,
  Lock,
  Beaker,
  Scissors
} from "lucide-react";
import {
  ZONE_CONFIGS,
  computeZoneCounts,
  type ManufacturerFunnelStatus,
} from "@/lib/manufacturerFunnelConfig";
import { motion, AnimatePresence } from "framer-motion";

interface ManufacturerJob {
  id: number;
  manufacturerStatus: string;
  publicStatus: string;
  requiredDeliveryDate: string | null;
  priority: string;
  order?: {
    orderCode: string;
    organization?: {
      name: string;
    };
  };
}

const VIEW_STORAGE_KEY = "manufacturer-home-view";

export default function ManufacturerHome() {
  const { data: user } = useAuth();
  const [view, setView] = useState<"tiles" | "floor">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      return saved === "floor" ? "floor" : "tiles";
    }
    return "tiles";
  });

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  const { data: jobs = [] } = useQuery<ManufacturerJob[]>({
    queryKey: ["/api/manufacturer-portal/jobs"],
    retry: false,
  });

  const { data: manufacturing = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturing"],
    retry: false,
  });

  const zoneCounts = computeZoneCounts(jobs);

  const urgentJobsCount = jobs.filter((j) => j.priority === "urgent" || j.priority === "high").length;
  
  const overdueJobsCount = jobs.filter((j) => {
    if (!j.requiredDeliveryDate) return false;
    return new Date(j.requiredDeliveryDate) < new Date();
  }).length;

  const activeJobsCount = jobs.filter((j) => 
    !["delivered_confirmed", "handed_to_carrier"].includes(j.manufacturerStatus)
  ).length;

  const readyToShipCount = jobs.filter((j) => 
    j.manufacturerStatus === "packing_complete"
  ).length;

  return (
    <div className="space-y-8" data-testid="manufacturer-home">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.firstName || user?.email?.split("@")[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what needs your attention today
          </p>
        </div>

        <ViewSwitcher view={view} onViewChange={setView} />
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "floor" ? (
          <motion.div
            key="floor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ProductionFloorCanvas jobs={jobs} />
          </motion.div>
        ) : (
          <motion.div
            key="tiles"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <WorkflowGrid>
              <WorkflowTile
                id="intake-queue"
                title="Intake Queue"
                description="New jobs awaiting spec review"
                icon={Inbox}
                bgGradient="from-amber-500/10 to-amber-500/5"
                iconColor="text-amber-400"
                primaryAction={{ label: "Review Intake", href: "/manufacturer-portal/queue?zone=intake" }}
                subActions={[
                  { label: "Pending Specs", href: "/manufacturer-portal/queue?status=intake_pending" },
                  { label: "Spec Review", href: "/manufacturer-portal/queue?status=specs_lock_review" },
                ]}
                badge={zoneCounts.intake > 0 ? { count: zoneCounts.intake, label: "Pending", variant: "warning" } : undefined}
              />

              <WorkflowTile
                id="specs-materials"
                title="Specs & Materials"
                description="Lock specs and reserve materials"
                icon={Lock}
                bgGradient="from-blue-500/10 to-blue-500/5"
                iconColor="text-blue-400"
                primaryAction={{ label: "View Queue", href: "/manufacturer-portal/queue?zone=specs" }}
                subActions={[
                  { label: "Specs Locked", href: "/manufacturer-portal/queue?status=specs_locked" },
                  { label: "Materials Reserved", href: "/manufacturer-portal/queue?status=materials_reserved" },
                ]}
                badge={zoneCounts.specs > 0 ? { count: zoneCounts.specs, label: "Active" } : undefined}
              />

              <WorkflowTile
                id="samples-queue"
                title="Samples & Approval"
                description="First piece samples and client approval"
                icon={Beaker}
                bgGradient="from-purple-500/10 to-purple-500/5"
                iconColor="text-purple-400"
                primaryAction={{ label: "Sample Queue", href: "/manufacturer-portal/queue?zone=samples" }}
                subActions={[
                  { label: "In Progress", href: "/manufacturer-portal/queue?status=samples_in_progress" },
                  { label: "Awaiting Approval", href: "/manufacturer-portal/queue?status=samples_awaiting_approval" },
                ]}
                badge={zoneCounts.samples > 0 ? { count: zoneCounts.samples, label: "Samples", variant: "default" } : undefined}
              />

              <WorkflowTile
                id="production-queue"
                title="Bulk Production"
                description="Cutting, printing, stitching, and QC"
                icon={Scissors}
                bgGradient="from-pink-500/10 to-pink-500/5"
                iconColor="text-pink-400"
                primaryAction={{ label: "Production Queue", href: "/manufacturer-portal/queue?zone=production" }}
                subActions={[
                  { label: "Cutting", href: "/manufacturer-portal/queue?status=bulk_cutting" },
                  { label: "Print/Embroidery", href: "/manufacturer-portal/queue?status=bulk_print_emb_sublim" },
                  { label: "QC", href: "/manufacturer-portal/queue?status=bulk_qc" },
                ]}
                badge={zoneCounts.production > 0 ? { count: zoneCounts.production, label: "Active" } : undefined}
              />

              <WorkflowTile
                id="shipping-queue"
                title="Packing & Shipping"
                description="Ready to pack and ship"
                icon={Truck}
                bgGradient="from-emerald-500/10 to-emerald-500/5"
                iconColor="text-emerald-400"
                primaryAction={{ label: "Shipping Queue", href: "/manufacturer-portal/queue?zone=shipping" }}
                subActions={[
                  { label: "Packing Complete", href: "/manufacturer-portal/queue?status=packing_complete" },
                  { label: "Handed to Carrier", href: "/manufacturer-portal/queue?status=handed_to_carrier" },
                ]}
                badge={readyToShipCount > 0 ? { count: readyToShipCount, label: "Ready", variant: "success" } : undefined}
              />

              <WorkflowTile
                id="manufacturer-portal"
                title="Full Portal View"
                description="Kanban board and all jobs"
                icon={Map}
                bgGradient="from-violet-500/10 to-violet-500/5"
                iconColor="text-violet-400"
                primaryAction={{ label: "Open Portal", href: "/manufacturer-portal" }}
                subActions={[
                  { label: "Legacy Manufacturing", href: "/manufacturing" },
                  { label: "My Line Items", href: "/manufacturer/line-items" },
                ]}
              />
            </WorkflowGrid>

            <QueuesSection>
              <QueueWidget
                id="urgent-jobs"
                title="Urgent & High Priority"
                icon={AlertTriangle}
                queryKey={["/api/manufacturer-portal/jobs"]}
                filter={(allJobs) => allJobs.filter((j: ManufacturerJob) => 
                  j.priority === "urgent" || j.priority === "high"
                )}
                columns={[
                  { key: "order.orderCode", label: "Order", className: "w-24 font-medium text-white" },
                  { key: "order.organization.name", label: "Client", className: "flex-1" },
                ]}
                rowAction={{ href: (job) => `/manufacturer-portal/job/${job.id}` }}
                viewAllHref="/manufacturer-portal/queue?priority=high"
                emptyState={{ message: "No urgent jobs", icon: CheckCircle }}
              />

              <QueueWidget
                id="overdue-jobs"
                title="Overdue Delivery"
                icon={Clock}
                queryKey={["/api/manufacturer-portal/jobs"]}
                filter={(allJobs) => allJobs.filter((j: ManufacturerJob) => {
                  if (!j.requiredDeliveryDate) return false;
                  return new Date(j.requiredDeliveryDate) < new Date() && 
                         j.manufacturerStatus !== "delivered_confirmed";
                })}
                columns={[
                  { key: "order.orderCode", label: "Order", className: "w-24 font-medium text-white" },
                  { key: "requiredDeliveryDate", label: "Due", className: "w-24 text-red-400" },
                ]}
                rowAction={{ href: (job) => `/manufacturer-portal/job/${job.id}` }}
                viewAllHref="/manufacturer-portal"
                emptyState={{ message: "No overdue jobs", icon: CheckCircle }}
              />

              <QueueWidget
                id="awaiting-approval"
                title="Awaiting Sample Approval"
                icon={Beaker}
                queryKey={["/api/manufacturer-portal/jobs"]}
                filter={(allJobs) => allJobs.filter((j: ManufacturerJob) => 
                  j.manufacturerStatus === "samples_awaiting_approval"
                )}
                columns={[
                  { key: "order.orderCode", label: "Order", className: "w-24 font-medium text-white" },
                  { key: "order.organization.name", label: "Client", className: "flex-1" },
                ]}
                rowAction={{ href: (job) => `/manufacturer-portal/job/${job.id}` }}
                viewAllHref="/manufacturer-portal/queue?status=samples_awaiting_approval"
                emptyState={{ message: "No samples awaiting approval", icon: CheckCircle }}
              />
            </QueuesSection>

            <MetricsSnapshot dashboardLink="/manufacturer-portal">
              <MetricCard label="Active Jobs" value={activeJobsCount} icon={Factory} />
              <MetricCard label="Ready to Ship" value={readyToShipCount} icon={Truck} />
              <MetricCard label="Urgent" value={urgentJobsCount} icon={AlertTriangle} />
              <MetricCard label="Overdue" value={overdueJobsCount} icon={Clock} />
            </MetricsSnapshot>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
