import { 
  Inbox, 
  FileSearch, 
  Lock, 
  Package, 
  Beaker, 
  Clock, 
  CheckCircle2, 
  RefreshCcw, 
  Scissors, 
  Printer, 
  Shirt, 
  ClipboardCheck, 
  PackageCheck, 
  Truck,
  type LucideIcon
} from "lucide-react";

export type ManufacturerZone = "intake" | "specs" | "samples" | "production" | "shipping";

export type ManufacturerFunnelStatus = 
  | "intake_pending"
  | "specs_lock_review"
  | "specs_locked"
  | "materials_reserved"
  | "samples_in_progress"
  | "samples_awaiting_approval"
  | "samples_approved"
  | "samples_revise"
  | "bulk_cutting"
  | "bulk_print_emb_sublim"
  | "bulk_stitching"
  | "bulk_qc"
  | "packing_complete"
  | "handed_to_carrier"
  | "delivered_confirmed";

export type ManufacturingPublicStatus =
  | "awaiting_admin_confirmation"
  | "confirmed_awaiting_manufacturing"
  | "cutting_sewing"
  | "printing"
  | "final_packing_press"
  | "shipped"
  | "complete";

export interface FunnelStageConfig {
  value: ManufacturerFunnelStatus;
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
  zone: ManufacturerZone;
  order: number;
  publicStatus: ManufacturingPublicStatus;
  allowedTransitions: ManufacturerFunnelStatus[];
}

export interface ZoneConfig {
  id: ManufacturerZone;
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
  order: number;
}

export const ZONE_CONFIGS: ZoneConfig[] = [
  {
    id: "intake",
    label: "Intake",
    description: "New jobs awaiting specification review",
    color: "#f59e0b",
    icon: Inbox,
    order: 1,
  },
  {
    id: "specs",
    label: "Specs & Materials",
    description: "Specifications locked and materials reserved",
    color: "#3b82f6",
    icon: Lock,
    order: 2,
  },
  {
    id: "samples",
    label: "Samples",
    description: "Sample creation and approval",
    color: "#8b5cf6",
    icon: Beaker,
    order: 3,
  },
  {
    id: "production",
    label: "Production",
    description: "Bulk manufacturing and QC",
    color: "#ec4899",
    icon: Scissors,
    order: 4,
  },
  {
    id: "shipping",
    label: "Shipping",
    description: "Packed and ready for delivery",
    color: "#10b981",
    icon: Truck,
    order: 5,
  },
];

export const FUNNEL_STAGE_CONFIGS: FunnelStageConfig[] = [
  {
    value: "intake_pending",
    label: "Intake Pending",
    description: "Job received, awaiting initial review",
    color: "#f59e0b",
    icon: Inbox,
    zone: "intake",
    order: 1,
    publicStatus: "awaiting_admin_confirmation",
    allowedTransitions: ["specs_lock_review"],
  },
  {
    value: "specs_lock_review",
    label: "Specs Lock Review",
    description: "Reviewing specifications before locking",
    color: "#f59e0b",
    icon: FileSearch,
    zone: "intake",
    order: 2,
    publicStatus: "awaiting_admin_confirmation",
    allowedTransitions: ["specs_locked"],
  },
  {
    value: "specs_locked",
    label: "Specs Locked",
    description: "Specifications confirmed and locked",
    color: "#3b82f6",
    icon: Lock,
    zone: "specs",
    order: 3,
    publicStatus: "confirmed_awaiting_manufacturing",
    allowedTransitions: ["materials_reserved"],
  },
  {
    value: "materials_reserved",
    label: "Materials Reserved",
    description: "Fabrics and materials allocated",
    color: "#3b82f6",
    icon: Package,
    zone: "specs",
    order: 4,
    publicStatus: "confirmed_awaiting_manufacturing",
    allowedTransitions: ["samples_in_progress", "bulk_cutting"],
  },
  {
    value: "samples_in_progress",
    label: "Samples In Progress",
    description: "Creating first-piece samples",
    color: "#8b5cf6",
    icon: Beaker,
    zone: "samples",
    order: 5,
    publicStatus: "confirmed_awaiting_manufacturing",
    allowedTransitions: ["samples_awaiting_approval"],
  },
  {
    value: "samples_awaiting_approval",
    label: "Samples Awaiting Approval",
    description: "Waiting for client/ops approval",
    color: "#8b5cf6",
    icon: Clock,
    zone: "samples",
    order: 6,
    publicStatus: "confirmed_awaiting_manufacturing",
    allowedTransitions: ["samples_approved", "samples_revise"],
  },
  {
    value: "samples_approved",
    label: "Samples Approved",
    description: "First piece approved, ready for bulk",
    color: "#22c55e",
    icon: CheckCircle2,
    zone: "samples",
    order: 7,
    publicStatus: "confirmed_awaiting_manufacturing",
    allowedTransitions: ["bulk_cutting"],
  },
  {
    value: "samples_revise",
    label: "Samples Revise",
    description: "Sample rejected, needs revision",
    color: "#ef4444",
    icon: RefreshCcw,
    zone: "samples",
    order: 8,
    publicStatus: "confirmed_awaiting_manufacturing",
    allowedTransitions: ["samples_in_progress"],
  },
  {
    value: "bulk_cutting",
    label: "Bulk Cutting",
    description: "Cutting fabric for bulk production",
    color: "#ec4899",
    icon: Scissors,
    zone: "production",
    order: 9,
    publicStatus: "cutting_sewing",
    allowedTransitions: ["bulk_print_emb_sublim", "bulk_stitching"],
  },
  {
    value: "bulk_print_emb_sublim",
    label: "Print/Emb/Sublim",
    description: "Printing, embroidery, or sublimation",
    color: "#ec4899",
    icon: Printer,
    zone: "production",
    order: 10,
    publicStatus: "printing",
    allowedTransitions: ["bulk_stitching"],
  },
  {
    value: "bulk_stitching",
    label: "Bulk Stitching",
    description: "Assembly and stitching",
    color: "#ec4899",
    icon: Shirt,
    zone: "production",
    order: 11,
    publicStatus: "cutting_sewing",
    allowedTransitions: ["bulk_qc"],
  },
  {
    value: "bulk_qc",
    label: "Bulk QC",
    description: "Quality control inspection",
    color: "#06b6d4",
    icon: ClipboardCheck,
    zone: "production",
    order: 12,
    publicStatus: "final_packing_press",
    allowedTransitions: ["packing_complete"],
  },
  {
    value: "packing_complete",
    label: "Packing Complete",
    description: "Items packed and ready",
    color: "#06b6d4",
    icon: PackageCheck,
    zone: "production",
    order: 13,
    publicStatus: "final_packing_press",
    allowedTransitions: ["handed_to_carrier"],
  },
  {
    value: "handed_to_carrier",
    label: "Handed to Carrier",
    description: "Shipped with carrier",
    color: "#10b981",
    icon: Truck,
    zone: "shipping",
    order: 14,
    publicStatus: "shipped",
    allowedTransitions: ["delivered_confirmed"],
  },
  {
    value: "delivered_confirmed",
    label: "Delivered Confirmed",
    description: "Delivery confirmed complete",
    color: "#22c55e",
    icon: CheckCircle2,
    zone: "shipping",
    order: 15,
    publicStatus: "complete",
    allowedTransitions: [],
  },
];

export function getStageConfig(status: ManufacturerFunnelStatus): FunnelStageConfig | undefined {
  return FUNNEL_STAGE_CONFIGS.find((config) => config.value === status);
}

export function getZoneConfig(zone: ManufacturerZone): ZoneConfig | undefined {
  return ZONE_CONFIGS.find((config) => config.id === zone);
}

export function getStagesByZone(zone: ManufacturerZone): FunnelStageConfig[] {
  return FUNNEL_STAGE_CONFIGS.filter((config) => config.zone === zone).sort((a, b) => a.order - b.order);
}

export function getPublicStatusFromFunnel(funnelStatus: ManufacturerFunnelStatus): ManufacturingPublicStatus {
  const config = getStageConfig(funnelStatus);
  return config?.publicStatus ?? "awaiting_admin_confirmation";
}

export function getAllowedTransitions(currentStatus: ManufacturerFunnelStatus): FunnelStageConfig[] {
  const config = getStageConfig(currentStatus);
  if (!config) return [];
  return config.allowedTransitions
    .map((status) => getStageConfig(status))
    .filter((c): c is FunnelStageConfig => c !== undefined);
}

export function computeZoneCounts<T extends { manufacturerStatus: string }>(
  jobs: T[]
): Record<ManufacturerZone, number> {
  const counts: Record<ManufacturerZone, number> = {
    intake: 0,
    specs: 0,
    samples: 0,
    production: 0,
    shipping: 0,
  };

  for (const job of jobs) {
    const config = getStageConfig(job.manufacturerStatus as ManufacturerFunnelStatus);
    if (config) {
      counts[config.zone]++;
    }
  }

  return counts;
}

export function computeStageCounts<T extends { manufacturerStatus: string }>(
  jobs: T[]
): Record<ManufacturerFunnelStatus, number> {
  const counts = {} as Record<ManufacturerFunnelStatus, number>;
  
  for (const config of FUNNEL_STAGE_CONFIGS) {
    counts[config.value] = 0;
  }

  for (const job of jobs) {
    const status = job.manufacturerStatus as ManufacturerFunnelStatus;
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  }

  return counts;
}

export interface QueueDefinition {
  id: string;
  label: string;
  description: string;
  filter: (job: any) => boolean;
  icon: LucideIcon;
  color: string;
  href: string;
}

export const MANUFACTURER_QUEUE_DEFINITIONS: QueueDefinition[] = [
  {
    id: "needs-spec-review",
    label: "Needs Spec Review",
    description: "Jobs awaiting specification verification",
    filter: (job) => ["intake_pending", "specs_lock_review"].includes(job.manufacturerStatus),
    icon: FileSearch,
    color: "#f59e0b",
    href: "/manufacturer-portal/queue?zone=intake",
  },
  {
    id: "needs-materials",
    label: "Needs Materials",
    description: "Specs locked, awaiting material reservation",
    filter: (job) => job.manufacturerStatus === "specs_locked",
    icon: Package,
    color: "#3b82f6",
    href: "/manufacturer-portal/queue?status=specs_locked",
  },
  {
    id: "samples-pending",
    label: "Samples Pending",
    description: "Sample creation or approval needed",
    filter: (job) => ["samples_in_progress", "samples_awaiting_approval", "samples_revise"].includes(job.manufacturerStatus),
    icon: Beaker,
    color: "#8b5cf6",
    href: "/manufacturer-portal/queue?zone=samples",
  },
  {
    id: "ready-for-bulk",
    label: "Ready for Bulk",
    description: "Samples approved, ready for production",
    filter: (job) => job.manufacturerStatus === "samples_approved" || job.manufacturerStatus === "materials_reserved",
    icon: Scissors,
    color: "#ec4899",
    href: "/manufacturer-portal/queue?status=samples_approved",
  },
  {
    id: "in-production",
    label: "In Production",
    description: "Currently in bulk manufacturing",
    filter: (job) => ["bulk_cutting", "bulk_print_emb_sublim", "bulk_stitching", "bulk_qc"].includes(job.manufacturerStatus),
    icon: Scissors,
    color: "#ec4899",
    href: "/manufacturer-portal/queue?zone=production",
  },
  {
    id: "ready-to-ship",
    label: "Ready to Ship",
    description: "Packed and awaiting carrier handoff",
    filter: (job) => job.manufacturerStatus === "packing_complete",
    icon: Truck,
    color: "#10b981",
    href: "/manufacturer-portal/queue?status=packing_complete",
  },
  {
    id: "shipped",
    label: "Shipped",
    description: "In transit or delivered",
    filter: (job) => ["handed_to_carrier", "delivered_confirmed"].includes(job.manufacturerStatus),
    icon: Truck,
    color: "#22c55e",
    href: "/manufacturer-portal/queue?zone=shipping",
  },
];

export function getQueueCounts<T>(jobs: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const queue of MANUFACTURER_QUEUE_DEFINITIONS) {
    counts[queue.id] = jobs.filter(queue.filter).length;
  }

  return counts;
}
