import { Package, Clock, FileText, Factory, Cog, Truck, CheckCircle2, AlertTriangle, type LucideIcon } from "lucide-react";

export interface Order {
  id: number;
  orderCode: string;
  orgId: number;
  leadId: number | null;
  salespersonId: string | null;
  orderName: string;
  status: "new" | "waiting_sizes" | "design_created" | "sizes_validated" | "invoiced" | "production" | "shipped" | "completed" | "cancelled";
  designApproved: boolean;
  sizesValidated: boolean;
  depositReceived: boolean;
  invoiceUrl?: string | null;
  estDelivery: string | null;
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
}

export type StageId = 
  | "drafts"
  | "awaiting-sizes"
  | "ready-to-invoice"
  | "ready-for-production"
  | "in-production"
  | "shipped"
  | "completed"
  | "issues";

export type UserRole = "admin" | "sales" | "designer" | "ops" | "manufacturer" | "finance";

export interface StageConfig {
  id: StageId;
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  bgColorClass: string;
  borderColorClass: string;
  filter: (order: Order) => boolean;
  primaryAction: {
    label: string;
    roles: UserRole[];
  };
  visibleToRoles: UserRole[];
}

function isOverdue(order: Order): boolean {
  if (!order.estDelivery) return false;
  const deliveryDate = new Date(order.estDelivery);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deliveryDate < today;
}

function isAtRisk(order: Order): boolean {
  if (order.priority === "high") return true;
  if (isOverdue(order)) return true;
  if (order.status === "new" || order.status === "waiting_sizes" || order.status === "design_created") {
    const createdDate = new Date(order.createdAt);
    const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCreated > 14) return true;
  }
  return false;
}

export const STAGE_CONFIGS: StageConfig[] = [
  {
    id: "drafts",
    label: "Drafts",
    description: "New orders waiting to be processed",
    icon: Package,
    colorClass: "text-blue-500",
    bgColorClass: "bg-blue-500/10",
    borderColorClass: "border-blue-500/30",
    filter: (order) => order.status === "new",
    primaryAction: {
      label: "Request Sizes",
      roles: ["sales", "ops", "admin"],
    },
    visibleToRoles: ["admin", "sales", "ops"],
  },
  {
    id: "awaiting-sizes",
    label: "Awaiting Sizes",
    description: "Waiting for customer size submissions or design work",
    icon: Clock,
    colorClass: "text-yellow-500",
    bgColorClass: "bg-yellow-500/10",
    borderColorClass: "border-yellow-500/30",
    filter: (order) => (order.status === "waiting_sizes" || order.status === "design_created") && !order.sizesValidated,
    primaryAction: {
      label: "Validate Sizes",
      roles: ["ops", "admin"],
    },
    visibleToRoles: ["admin", "sales", "ops"],
  },
  {
    id: "ready-to-invoice",
    label: "Ready to Invoice",
    description: "Sizes validated, ready for invoicing",
    icon: FileText,
    colorClass: "text-purple-500",
    bgColorClass: "bg-purple-500/10",
    borderColorClass: "border-purple-500/30",
    filter: (order) => (order.status === "sizes_validated" || (order.status === "waiting_sizes" && order.sizesValidated)) && !order.invoiceUrl,
    primaryAction: {
      label: "Create Invoice",
      roles: ["finance", "admin"],
    },
    visibleToRoles: ["admin", "finance", "ops"],
  },
  {
    id: "ready-for-production",
    label: "Ready for Production",
    description: "Invoiced and ready to start production",
    icon: Factory,
    colorClass: "text-orange-500",
    bgColorClass: "bg-orange-500/10",
    borderColorClass: "border-orange-500/30",
    filter: (order) => order.status === "invoiced",
    primaryAction: {
      label: "Start Production",
      roles: ["ops", "admin"],
    },
    visibleToRoles: ["admin", "ops", "manufacturer"],
  },
  {
    id: "in-production",
    label: "In Production",
    description: "Currently being manufactured",
    icon: Cog,
    colorClass: "text-amber-500",
    bgColorClass: "bg-amber-500/10",
    borderColorClass: "border-amber-500/30",
    filter: (order) => order.status === "production",
    primaryAction: {
      label: "Open Manufacturing",
      roles: ["ops", "manufacturer", "admin"],
    },
    visibleToRoles: ["admin", "ops", "manufacturer"],
  },
  {
    id: "shipped",
    label: "Shipped",
    description: "Orders that have been shipped",
    icon: Truck,
    colorClass: "text-indigo-500",
    bgColorClass: "bg-indigo-500/10",
    borderColorClass: "border-indigo-500/30",
    filter: (order) => order.status === "shipped",
    primaryAction: {
      label: "Add Tracking",
      roles: ["ops", "sales", "admin"],
    },
    visibleToRoles: ["admin", "sales", "ops"],
  },
  {
    id: "completed",
    label: "Completed",
    description: "Successfully completed orders",
    icon: CheckCircle2,
    colorClass: "text-green-500",
    bgColorClass: "bg-green-500/10",
    borderColorClass: "border-green-500/30",
    filter: (order) => order.status === "completed",
    primaryAction: {
      label: "View Summary",
      roles: ["admin", "sales", "ops", "designer", "manufacturer", "finance"],
    },
    visibleToRoles: ["admin", "sales", "ops", "designer", "manufacturer", "finance"],
  },
  {
    id: "issues",
    label: "Issues",
    description: "Orders requiring attention",
    icon: AlertTriangle,
    colorClass: "text-red-500",
    bgColorClass: "bg-red-500/10",
    borderColorClass: "border-red-500/30",
    filter: (order) => isAtRisk(order) && order.status !== "completed" && order.status !== "shipped",
    primaryAction: {
      label: "Triage",
      roles: ["ops", "admin"],
    },
    visibleToRoles: ["admin", "ops"],
  },
];

export function getStageConfig(stageId: StageId): StageConfig | undefined {
  return STAGE_CONFIGS.find((config) => config.id === stageId);
}

export function getVisibleStages(userRole: UserRole): StageConfig[] {
  return STAGE_CONFIGS.filter((config) => config.visibleToRoles.includes(userRole));
}

export function getOrderStage(order: Order): StageConfig | undefined {
  for (const config of STAGE_CONFIGS) {
    if (config.id === "issues") continue;
    if (config.filter(order)) return config;
  }
  return undefined;
}

export function computeStageCounts(orders: Order[], userRole: UserRole): Record<StageId, number> {
  const counts: Record<StageId, number> = {
    drafts: 0,
    "awaiting-sizes": 0,
    "ready-to-invoice": 0,
    "ready-for-production": 0,
    "in-production": 0,
    shipped: 0,
    completed: 0,
    issues: 0,
  };

  for (const order of orders) {
    for (const config of STAGE_CONFIGS) {
      if (config.filter(order)) {
        counts[config.id]++;
      }
    }
  }

  return counts;
}
