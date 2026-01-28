/**
 * V6 Status Badge Component
 * Consistent status display across the application with color coding and icons
 */

import { cn } from "@/lib/utils";
import {
  FileText,
  Send,
  ThumbsUp,
  Clock,
  Palette,
  Eye,
  UserCheck,
  DollarSign,
  Factory,
  Truck,
  CheckCircle2,
  Package,
  PauseCircle,
  XCircle,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export type OrderStatusV6 =
  | "draft"
  | "quote"
  | "quote_accepted"
  | "pending_approval"
  | "approved"
  | "awaiting_sizing"
  | "awaiting_design"
  | "in_design"
  | "design_review"
  | "awaiting_customer_approval"
  | "customer_approved"
  | "awaiting_payment"
  | "deposit_received"
  | "ready_for_manufacturing"
  | "in_production"
  | "production_complete"
  | "shipped"
  | "partially_shipped"
  | "delivered"
  | "completed"
  | "on_hold"
  | "cancelled";

export type DesignJobStatusV6 =
  | "pending"
  | "assigned"
  | "in_progress"
  | "review"
  | "needs_revision"
  | "approved"
  | "completed"
  | "on_hold"
  | "cancelled";

export type ManufacturingStatusV6 =
  | "new"
  | "accepted"
  | "in_production"
  | "qc"
  | "ready_to_ship"
  | "shipped";

export type PaymentStatusV6 =
  | "pending"
  | "deposit_received"
  | "partially_paid"
  | "fully_paid"
  | "refunded";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatusV6, StatusConfig> = {
  draft: {
    label: "Draft",
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    icon: FileText,
  },
  quote: {
    label: "Quote",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    icon: Send,
  },
  quote_accepted: {
    label: "Quote Accepted",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: ThumbsUp,
  },
  pending_approval: {
    label: "Pending Approval",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: CheckCircle2,
  },
  awaiting_sizing: {
    label: "Awaiting Sizing",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: Clock,
  },
  awaiting_design: {
    label: "Awaiting Design",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: Palette,
  },
  in_design: {
    label: "In Design",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: Palette,
  },
  design_review: {
    label: "Design Review",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: Eye,
  },
  awaiting_customer_approval: {
    label: "Awaiting Customer Approval",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    icon: UserCheck,
  },
  customer_approved: {
    label: "Customer Approved",
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    borderColor: "border-teal-400/30",
    icon: ThumbsUp,
  },
  awaiting_payment: {
    label: "Awaiting Payment",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    icon: DollarSign,
  },
  deposit_received: {
    label: "Deposit Received",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
    icon: DollarSign,
  },
  ready_for_manufacturing: {
    label: "Ready for Manufacturing",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    icon: Factory,
  },
  in_production: {
    label: "In Production",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: Factory,
  },
  production_complete: {
    label: "Production Complete",
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    borderColor: "border-teal-400/30",
    icon: CheckCircle2,
  },
  shipped: {
    label: "Shipped",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    icon: Truck,
  },
  partially_shipped: {
    label: "Partially Shipped",
    color: "text-blue-300",
    bgColor: "bg-blue-300/10",
    borderColor: "border-blue-300/30",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    icon: Package,
  },
  completed: {
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-600/10",
    borderColor: "border-green-600/30",
    icon: CheckCircle2,
  },
  on_hold: {
    label: "On Hold",
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    icon: PauseCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
    icon: XCircle,
  },
};

export const DESIGN_JOB_STATUS_CONFIG: Record<DesignJobStatusV6, StatusConfig> = {
  pending: {
    label: "Pending",
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    icon: Clock,
  },
  assigned: {
    label: "Assigned",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    icon: UserCheck,
  },
  in_progress: {
    label: "In Progress",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: Palette,
  },
  review: {
    label: "Review",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    icon: Eye,
  },
  needs_revision: {
    label: "Needs Revision",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
    icon: AlertTriangle,
  },
  approved: {
    label: "Approved",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
    icon: ThumbsUp,
  },
  completed: {
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-600/10",
    borderColor: "border-green-600/30",
    icon: CheckCircle2,
  },
  on_hold: {
    label: "On Hold",
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    icon: PauseCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
    icon: XCircle,
  },
};

export const MANUFACTURING_STATUS_CONFIG: Record<ManufacturingStatusV6, StatusConfig> = {
  new: {
    label: "New",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    icon: Package,
  },
  accepted: {
    label: "Accepted",
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    borderColor: "border-teal-400/30",
    icon: ThumbsUp,
  },
  in_production: {
    label: "In Production",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: Factory,
  },
  qc: {
    label: "QC",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    icon: Eye,
  },
  ready_to_ship: {
    label: "Ready to Ship",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: Truck,
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatusV6, StatusConfig> = {
  pending: {
    label: "Pending",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
    icon: Clock,
  },
  deposit_received: {
    label: "Deposit Received",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
    icon: DollarSign,
  },
  partially_paid: {
    label: "Partially Paid",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    borderColor: "border-yellow-400/30",
    icon: DollarSign,
  },
  fully_paid: {
    label: "Fully Paid",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    icon: CheckCircle2,
  },
  refunded: {
    label: "Refunded",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    borderColor: "border-red-400/30",
    icon: XCircle,
  },
};

type StatusType = "order" | "design" | "manufacturing" | "payment";

interface StatusBadgeV6Props {
  type: StatusType;
  status: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StatusBadgeV6({
  type,
  status,
  size = "md",
  showIcon = true,
  className,
}: StatusBadgeV6Props) {
  const config = getStatusConfig(type, status);

  if (!config) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        {status}
      </span>
    );
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{config.label}</span>
    </span>
  );
}

function getStatusConfig(type: StatusType, status: string): StatusConfig | null {
  switch (type) {
    case "order":
      return ORDER_STATUS_CONFIG[status as OrderStatusV6] ?? null;
    case "design":
      return DESIGN_JOB_STATUS_CONFIG[status as DesignJobStatusV6] ?? null;
    case "manufacturing":
      return MANUFACTURING_STATUS_CONFIG[status as ManufacturingStatusV6] ?? null;
    case "payment":
      return PAYMENT_STATUS_CONFIG[status as PaymentStatusV6] ?? null;
    default:
      return null;
  }
}

// Status groupings for filter dropdowns
export const ORDER_STATUS_GROUPS = {
  "Pre-Payment Stages": [
    "draft",
    "quote",
    "quote_accepted",
    "pending_approval",
    "approved",
    "awaiting_sizing",
    "awaiting_design",
    "in_design",
    "design_review",
    "awaiting_customer_approval",
    "customer_approved",
    "awaiting_payment",
  ] as OrderStatusV6[],
  "Post-Payment Stages": [
    "deposit_received",
    "ready_for_manufacturing",
    "in_production",
    "production_complete",
    "shipped",
    "partially_shipped",
    "delivered",
    "completed",
  ] as OrderStatusV6[],
  "Exception Statuses": ["on_hold", "cancelled"] as OrderStatusV6[],
};

// Helper to check if transition is valid
export function isValidOrderTransition(
  from: OrderStatusV6,
  to: OrderStatusV6
): boolean {
  // Define valid transitions based on spec
  const transitions: Record<OrderStatusV6, OrderStatusV6[]> = {
    draft: ["quote", "pending_approval", "cancelled"],
    quote: ["quote_accepted", "draft", "cancelled"],
    quote_accepted: ["pending_approval", "approved", "cancelled"],
    pending_approval: ["approved", "draft", "cancelled"],
    approved: ["awaiting_sizing", "awaiting_design", "awaiting_payment", "on_hold", "cancelled"],
    awaiting_sizing: ["awaiting_design", "awaiting_payment", "on_hold", "cancelled"],
    awaiting_design: ["in_design", "on_hold", "cancelled"],
    in_design: ["design_review", "awaiting_design", "on_hold", "cancelled"],
    design_review: ["awaiting_customer_approval", "in_design", "on_hold", "cancelled"],
    awaiting_customer_approval: ["customer_approved", "design_review", "on_hold", "cancelled"],
    customer_approved: ["awaiting_payment", "on_hold", "cancelled"],
    awaiting_payment: ["deposit_received", "on_hold", "cancelled"],
    deposit_received: ["ready_for_manufacturing", "on_hold"],
    ready_for_manufacturing: ["in_production", "on_hold"],
    in_production: ["production_complete", "on_hold"],
    production_complete: ["shipped", "partially_shipped", "on_hold"],
    shipped: ["delivered", "partially_shipped"],
    partially_shipped: ["shipped", "delivered"],
    delivered: ["completed"],
    completed: [],
    on_hold: [
      "draft",
      "quote",
      "approved",
      "awaiting_sizing",
      "awaiting_design",
      "in_design",
      "design_review",
      "awaiting_customer_approval",
      "customer_approved",
      "awaiting_payment",
      "deposit_received",
      "ready_for_manufacturing",
      "in_production",
      "production_complete",
      "cancelled",
    ],
    cancelled: [],
  };

  return transitions[from]?.includes(to) ?? false;
}
