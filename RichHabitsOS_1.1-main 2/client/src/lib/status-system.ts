/**
 * Unified Status System for Rich Habits OS
 * 
 * This module provides a single source of truth for all status colors,
 * zone mappings, and velocity indicators across Orders, Design Jobs,
 * and Manufacturing.
 */

// =============================================================================
// TYPES
// =============================================================================

export type OrderStatus = 'new' | 'waiting_sizes' | 'invoiced' | 'production' | 'shipped' | 'completed' | 'cancelled';

export type DesignJobStatus = 'pending' | 'assigned' | 'in_progress' | 'review' | 'approved' | 'rejected' | 'completed';

export type ManufacturingStatus = 
  | 'awaiting_admin_confirmation'
  | 'confirmed_awaiting_manufacturing'
  | 'cutting_sewing'
  | 'printing'
  | 'final_packing_press'
  | 'shipped'
  | 'complete';

export type VelocityIndicator = 'green' | 'yellow' | 'red' | 'grey';

export type WorkflowZone = 
  | 'new_intake'
  | 'in_design'
  | 'pending_customer'
  | 'manufacturing_pre'
  | 'manufacturing_production'
  | 'qc'
  | 'delivery'
  | 'completed';

export interface StatusConfig {
  label: string;
  color: string;        // Hex color
  bgClass: string;      // Tailwind bg class
  textClass: string;    // Tailwind text class
  borderClass: string;  // Tailwind border class
  icon: string;         // Icon name for dynamic loading
  zone: WorkflowZone;
  order: number;
}

export interface ZoneConfig {
  id: WorkflowZone;
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  allowedRoles: string[];
  order: number;
}

// =============================================================================
// WORKFLOW ZONES
// =============================================================================

export const WORKFLOW_ZONES: Record<WorkflowZone, ZoneConfig> = {
  new_intake: {
    id: 'new_intake',
    label: 'New Intake',
    shortLabel: 'Intake',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    textClass: 'text-amber-500',
    description: 'New orders and leads awaiting initial processing',
    allowedRoles: ['admin', 'sales', 'ops'],
    order: 1,
  },
  in_design: {
    id: 'in_design',
    label: 'In Design',
    shortLabel: 'Design',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    textClass: 'text-purple-500',
    description: 'Orders with active design work',
    allowedRoles: ['admin', 'designer', 'ops'],
    order: 2,
  },
  pending_customer: {
    id: 'pending_customer',
    label: 'Pending Customer',
    shortLabel: 'Customer',
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    textClass: 'text-orange-500',
    description: 'Awaiting customer approval, sizes, or payment',
    allowedRoles: ['admin', 'sales', 'ops'],
    order: 3,
  },
  manufacturing_pre: {
    id: 'manufacturing_pre',
    label: 'Manufacturing (Pre-Production)',
    shortLabel: 'Pre-Prod',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    textClass: 'text-blue-500',
    description: 'Confirmed orders awaiting production start',
    allowedRoles: ['admin', 'ops', 'manufacturer'],
    order: 4,
  },
  manufacturing_production: {
    id: 'manufacturing_production',
    label: 'Manufacturing (Production)',
    shortLabel: 'Production',
    color: '#ec4899',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/30',
    textClass: 'text-pink-500',
    description: 'Active production: cutting, sewing, printing',
    allowedRoles: ['admin', 'ops', 'manufacturer'],
    order: 5,
  },
  qc: {
    id: 'qc',
    label: 'Quality Control',
    shortLabel: 'QC',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/30',
    textClass: 'text-cyan-500',
    description: 'Final inspection and quality check',
    allowedRoles: ['admin', 'ops', 'manufacturer'],
    order: 6,
  },
  delivery: {
    id: 'delivery',
    label: 'Delivery',
    shortLabel: 'Delivery',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    textClass: 'text-emerald-500',
    description: 'Shipped and in transit to customer',
    allowedRoles: ['admin', 'ops', 'sales'],
    order: 7,
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    shortLabel: 'Done',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-500',
    description: 'Successfully delivered and finalized',
    allowedRoles: ['admin', 'sales', 'ops', 'finance'],
    order: 8,
  },
};

// =============================================================================
// ORDER STATUS CONFIGURATION
// =============================================================================

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  new: {
    label: 'New',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/30',
    icon: 'Sparkles',
    zone: 'new_intake',
    order: 1,
  },
  waiting_sizes: {
    label: 'Waiting Sizes',
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500/30',
    icon: 'Ruler',
    zone: 'pending_customer',
    order: 2,
  },
  invoiced: {
    label: 'Invoiced',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500/30',
    icon: 'Receipt',
    zone: 'pending_customer',
    order: 3,
  },
  production: {
    label: 'Production',
    color: '#ec4899',
    bgClass: 'bg-pink-500/10',
    textClass: 'text-pink-500',
    borderClass: 'border-pink-500/30',
    icon: 'Factory',
    zone: 'manufacturing_production',
    order: 4,
  },
  shipped: {
    label: 'Shipped',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500/30',
    icon: 'Truck',
    zone: 'delivery',
    order: 5,
  },
  completed: {
    label: 'Completed',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-500',
    borderClass: 'border-green-500/30',
    icon: 'CheckCircle2',
    zone: 'completed',
    order: 6,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/30',
    icon: 'XCircle',
    zone: 'completed',
    order: 7,
  },
};

// =============================================================================
// DESIGN JOB STATUS CONFIGURATION
// =============================================================================

export const DESIGN_JOB_STATUS_CONFIG: Record<DesignJobStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/30',
    icon: 'Clock',
    zone: 'new_intake',
    order: 1,
  },
  assigned: {
    label: 'Assigned',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500/30',
    icon: 'UserCheck',
    zone: 'in_design',
    order: 2,
  },
  in_progress: {
    label: 'In Progress',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500/30',
    icon: 'Palette',
    zone: 'in_design',
    order: 3,
  },
  review: {
    label: 'Review',
    color: '#f97316',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-500',
    borderClass: 'border-orange-500/30',
    icon: 'Eye',
    zone: 'pending_customer',
    order: 4,
  },
  approved: {
    label: 'Approved',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500/30',
    icon: 'ThumbsUp',
    zone: 'manufacturing_pre',
    order: 5,
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/30',
    icon: 'ThumbsDown',
    zone: 'in_design',
    order: 6,
  },
  completed: {
    label: 'Completed',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-500',
    borderClass: 'border-green-500/30',
    icon: 'CheckCircle2',
    zone: 'completed',
    order: 7,
  },
};

// =============================================================================
// MANUFACTURING STATUS CONFIGURATION
// =============================================================================

export const MANUFACTURING_STATUS_CONFIG: Record<ManufacturingStatus, StatusConfig> = {
  awaiting_admin_confirmation: {
    label: 'Awaiting Admin',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-500',
    borderClass: 'border-amber-500/30',
    icon: 'Clock',
    zone: 'new_intake',
    order: 1,
  },
  confirmed_awaiting_manufacturing: {
    label: 'Awaiting Manufacturing',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-500',
    borderClass: 'border-blue-500/30',
    icon: 'PackageCheck',
    zone: 'manufacturing_pre',
    order: 2,
  },
  cutting_sewing: {
    label: 'Cutting & Sewing',
    color: '#8b5cf6',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-500',
    borderClass: 'border-purple-500/30',
    icon: 'Scissors',
    zone: 'manufacturing_production',
    order: 3,
  },
  printing: {
    label: 'Printing',
    color: '#ec4899',
    bgClass: 'bg-pink-500/10',
    textClass: 'text-pink-500',
    borderClass: 'border-pink-500/30',
    icon: 'Printer',
    zone: 'manufacturing_production',
    order: 4,
  },
  final_packing_press: {
    label: 'Packing & Press',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-500',
    borderClass: 'border-cyan-500/30',
    icon: 'Package',
    zone: 'qc',
    order: 5,
  },
  shipped: {
    label: 'Shipped',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-500',
    borderClass: 'border-emerald-500/30',
    icon: 'Truck',
    zone: 'delivery',
    order: 6,
  },
  complete: {
    label: 'Complete',
    color: '#22c55e',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-500',
    borderClass: 'border-green-500/30',
    icon: 'CheckCircle2',
    zone: 'completed',
    order: 7,
  },
};

// =============================================================================
// VELOCITY INDICATORS
// =============================================================================

export const VELOCITY_CONFIG: Record<VelocityIndicator, {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  glowClass: string;
  description: string;
}> = {
  green: {
    label: 'On Track',
    color: '#22c55e',
    bgClass: 'bg-green-500/20',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/50',
    glowClass: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    description: 'Progressing well, updated within 24h',
  },
  yellow: {
    label: 'Stalled',
    color: '#eab308',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/50',
    glowClass: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
    description: 'No updates in 24-48h, needs attention',
  },
  red: {
    label: 'Overdue',
    color: '#ef4444',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/50',
    glowClass: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    description: 'Past due date or no updates in 48h+',
  },
  grey: {
    label: 'Inactive',
    color: '#6b7280',
    bgClass: 'bg-gray-500/20',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/50',
    glowClass: '',
    description: 'Completed, cancelled, or on hold',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate velocity indicator based on last update and due date
 */
export function calculateVelocity(
  lastUpdated: Date | string | null,
  dueDate: Date | string | null,
  status: string
): VelocityIndicator {
  // Inactive statuses
  const inactiveStatuses = ['completed', 'complete', 'cancelled', 'rejected'];
  if (inactiveStatuses.includes(status)) {
    return 'grey';
  }

  const now = new Date();
  const lastUpdateDate = lastUpdated ? new Date(lastUpdated) : null;
  const dueDateObj = dueDate ? new Date(dueDate) : null;

  // Check if overdue
  if (dueDateObj && now > dueDateObj) {
    return 'red';
  }

  // Check update freshness
  if (lastUpdateDate) {
    const hoursSinceUpdate = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 24) {
      return 'green';
    } else if (hoursSinceUpdate < 48) {
      return 'yellow';
    } else {
      return 'red';
    }
  }

  // No update date available, use yellow as caution
  return 'yellow';
}

/**
 * Get the workflow zone for any status type
 */
export function getZoneForStatus(
  status: string,
  type: 'order' | 'design_job' | 'manufacturing'
): WorkflowZone {
  switch (type) {
    case 'order':
      return ORDER_STATUS_CONFIG[status as OrderStatus]?.zone || 'new_intake';
    case 'design_job':
      return DESIGN_JOB_STATUS_CONFIG[status as DesignJobStatus]?.zone || 'new_intake';
    case 'manufacturing':
      return MANUFACTURING_STATUS_CONFIG[status as ManufacturingStatus]?.zone || 'new_intake';
    default:
      return 'new_intake';
  }
}

/**
 * Get orders grouped by zone
 */
export function groupByZone<T extends { status: string }>(
  items: T[],
  type: 'order' | 'design_job' | 'manufacturing'
): Record<WorkflowZone, T[]> {
  const result: Record<WorkflowZone, T[]> = {
    new_intake: [],
    in_design: [],
    pending_customer: [],
    manufacturing_pre: [],
    manufacturing_production: [],
    qc: [],
    delivery: [],
    completed: [],
  };

  items.forEach((item) => {
    const zone = getZoneForStatus(item.status, type);
    result[zone].push(item);
  });

  return result;
}

/**
 * Get status color classes for any status
 */
export function getStatusClasses(
  status: string,
  type: 'order' | 'design_job' | 'manufacturing'
): { bgClass: string; textClass: string; borderClass: string } {
  let config: StatusConfig | undefined;
  
  switch (type) {
    case 'order':
      config = ORDER_STATUS_CONFIG[status as OrderStatus];
      break;
    case 'design_job':
      config = DESIGN_JOB_STATUS_CONFIG[status as DesignJobStatus];
      break;
    case 'manufacturing':
      config = MANUFACTURING_STATUS_CONFIG[status as ManufacturingStatus];
      break;
  }

  if (!config) {
    return {
      bgClass: 'bg-gray-500/10',
      textClass: 'text-gray-400',
      borderClass: 'border-gray-500/30',
    };
  }

  return {
    bgClass: config.bgClass,
    textClass: config.textClass,
    borderClass: config.borderClass,
  };
}

/**
 * Get status label
 */
export function getStatusLabel(
  status: string,
  type: 'order' | 'design_job' | 'manufacturing'
): string {
  switch (type) {
    case 'order':
      return ORDER_STATUS_CONFIG[status as OrderStatus]?.label || status;
    case 'design_job':
      return DESIGN_JOB_STATUS_CONFIG[status as DesignJobStatus]?.label || status;
    case 'manufacturing':
      return MANUFACTURING_STATUS_CONFIG[status as ManufacturingStatus]?.label || status;
    default:
      return status;
  }
}

/**
 * Get all zones sorted by order
 */
export function getZonesInOrder(): ZoneConfig[] {
  return Object.values(WORKFLOW_ZONES).sort((a, b) => a.order - b.order);
}

/**
 * Check if a zone is visible to a given role
 */
export function isZoneVisibleToRole(zone: WorkflowZone, role: string): boolean {
  return WORKFLOW_ZONES[zone].allowedRoles.includes(role) || role === 'admin';
}

/**
 * Progress calculation for 5-block display
 */
export interface ProgressBlock {
  index: number;
  label: string;
  filled: boolean;
  current: boolean;
  zone: WorkflowZone;
}

export function calculateProgressBlocks(
  orderStatus: OrderStatus | null,
  designStatus: DesignJobStatus | null,
  manufacturingStatus: ManufacturingStatus | null
): ProgressBlock[] {
  // Define the 5 main progress stages
  const stages: { label: string; zone: WorkflowZone }[] = [
    { label: 'Intake', zone: 'new_intake' },
    { label: 'Design', zone: 'in_design' },
    { label: 'Pre-Prod', zone: 'manufacturing_pre' },
    { label: 'Production', zone: 'manufacturing_production' },
    { label: 'Complete', zone: 'completed' },
  ];

  // Determine current position based on statuses
  let currentZone: WorkflowZone = 'new_intake';
  
  if (orderStatus === 'completed' || manufacturingStatus === 'complete') {
    currentZone = 'completed';
  } else if (orderStatus === 'shipped' || manufacturingStatus === 'shipped') {
    currentZone = 'delivery';
  } else if (manufacturingStatus === 'final_packing_press') {
    currentZone = 'qc';
  } else if (
    manufacturingStatus === 'cutting_sewing' ||
    manufacturingStatus === 'printing' ||
    orderStatus === 'production'
  ) {
    currentZone = 'manufacturing_production';
  } else if (manufacturingStatus === 'confirmed_awaiting_manufacturing') {
    currentZone = 'manufacturing_pre';
  } else if (
    designStatus === 'in_progress' ||
    designStatus === 'assigned' ||
    designStatus === 'review' ||
    designStatus === 'rejected'
  ) {
    currentZone = 'in_design';
  } else if (
    orderStatus === 'waiting_sizes' ||
    orderStatus === 'invoiced'
  ) {
    currentZone = 'pending_customer';
  }

  // Map zones to progress order
  const zoneOrder: Record<WorkflowZone, number> = {
    new_intake: 0,
    in_design: 1,
    pending_customer: 1.5, // Between design and pre-prod
    manufacturing_pre: 2,
    manufacturing_production: 3,
    qc: 3.5, // Part of production
    delivery: 4,
    completed: 4,
  };

  const currentProgress = zoneOrder[currentZone] || 0;

  return stages.map((stage, index) => ({
    index,
    label: stage.label,
    filled: currentProgress >= index,
    current: Math.floor(currentProgress) === index,
    zone: stage.zone,
  }));
}

/**
 * Calculate ETA text
 */
export function calculateETA(dueDate: Date | string | null): string {
  if (!dueDate) return 'No ETA';
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `${diffDays}d remaining`;
  } else {
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Get neon glow color for velocity
 */
export function getVelocityGlowColor(velocity: VelocityIndicator): string {
  return VELOCITY_CONFIG[velocity].color;
}

/**
 * Get zone statistics
 */
export function getZoneStats<T extends { status: string; updatedAt?: string | Date }>(
  items: T[],
  type: 'order' | 'design_job' | 'manufacturing'
): Record<WorkflowZone, { count: number; velocityCounts: Record<VelocityIndicator, number> }> {
  const grouped = groupByZone(items, type);
  const result: Record<WorkflowZone, { count: number; velocityCounts: Record<VelocityIndicator, number> }> = {} as any;

  Object.entries(grouped).forEach(([zone, zoneItems]) => {
    const velocityCounts: Record<VelocityIndicator, number> = {
      green: 0,
      yellow: 0,
      red: 0,
      grey: 0,
    };

    zoneItems.forEach((item: any) => {
      const velocity = calculateVelocity(item.updatedAt || null, item.estDelivery || item.dueDate || null, item.status);
      velocityCounts[velocity]++;
    });

    result[zone as WorkflowZone] = {
      count: zoneItems.length,
      velocityCounts,
    };
  });

  return result;
}
