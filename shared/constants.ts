/**
 * Shared constants for Rich Habits OS
 * Single source of truth for enums, status values, and configuration
 */

// ==================== USER ROLES ====================
export const USER_ROLES = ['admin', 'sales', 'designer', 'ops', 'manufacturer', 'finance'] as const;
export type UserRole = typeof USER_ROLES[number];

// ==================== ORDER STATUS ====================
export const ORDER_STATUSES = ['new', 'waiting_sizes', 'design_created', 'sizes_validated', 'invoiced', 'production', 'shipped', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  waiting_sizes: 'Waiting for Sizes',
  design_created: 'Design Created',
  sizes_validated: 'Sizes Confirmed',
  invoiced: 'Invoiced',
  production: 'In Production',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Valid order status transitions - flexible rules allowing any non-terminal status to transition to any other
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['waiting_sizes', 'design_created', 'sizes_validated', 'invoiced', 'production', 'shipped', 'completed', 'cancelled'],
  waiting_sizes: ['new', 'design_created', 'sizes_validated', 'invoiced', 'production', 'shipped', 'completed', 'cancelled'],
  design_created: ['new', 'waiting_sizes', 'sizes_validated', 'invoiced', 'production', 'shipped', 'completed', 'cancelled'],
  sizes_validated: ['new', 'waiting_sizes', 'design_created', 'invoiced', 'production', 'shipped', 'completed', 'cancelled'],
  invoiced: ['new', 'waiting_sizes', 'design_created', 'sizes_validated', 'production', 'shipped', 'completed', 'cancelled'],
  production: ['new', 'waiting_sizes', 'design_created', 'sizes_validated', 'invoiced', 'shipped', 'completed', 'cancelled'],
  shipped: ['new', 'waiting_sizes', 'design_created', 'sizes_validated', 'invoiced', 'production', 'completed', 'cancelled'],
  completed: ['new', 'waiting_sizes', 'design_created', 'sizes_validated', 'invoiced', 'production', 'shipped', 'cancelled'],
  cancelled: ['new', 'waiting_sizes', 'design_created', 'sizes_validated', 'invoiced', 'production', 'shipped', 'completed'],
};

// ==================== ORDER PRIORITY ====================
export const ORDER_PRIORITIES = ['low', 'normal', 'high'] as const;
export type OrderPriority = typeof ORDER_PRIORITIES[number];

// ==================== LEAD STAGES ====================
export const LEAD_STAGES = [
  'future_lead',
  'lead', 
  'hot_lead',
  'mock_up',
  'mock_up_sent',
  'team_store_or_direct_order',
  'current_clients',
  'no_answer_delete'
] as const;
export type LeadStage = typeof LEAD_STAGES[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  future_lead: 'Future Lead',
  lead: 'Lead',
  hot_lead: 'Hot Lead',
  mock_up: 'Mock-Up',
  mock_up_sent: 'Mock-Up Sent',
  team_store_or_direct_order: 'Team Store / Direct Order',
  current_clients: 'Current Clients',
  no_answer_delete: 'No Answer / Delete',
};

// ==================== DESIGN JOB STATUS ====================
export const DESIGN_JOB_STATUSES = ['pending', 'assigned', 'in_progress', 'review', 'approved', 'rejected', 'completed'] as const;
export type DesignJobStatus = typeof DESIGN_JOB_STATUSES[number];

export const DESIGN_JOB_STATUS_LABELS: Record<DesignJobStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

// Valid design job status transitions
export const DESIGN_JOB_STATUS_TRANSITIONS: Record<DesignJobStatus, DesignJobStatus[]> = {
  pending: ['assigned'],
  assigned: ['in_progress', 'pending'],
  in_progress: ['review', 'pending'],
  review: ['approved', 'rejected'],
  rejected: ['in_progress'],
  approved: ['completed'],
  completed: [], // Terminal state
};

// ==================== DESIGN JOB URGENCY ====================
export const DESIGN_JOB_URGENCIES = ['low', 'normal', 'high', 'rush'] as const;
export type DesignJobUrgency = typeof DESIGN_JOB_URGENCIES[number];

// ==================== DESIGN JOB PRIORITY ====================
export const DESIGN_JOB_PRIORITIES = ['low', 'normal', 'high'] as const;
export type DesignJobPriority = typeof DESIGN_JOB_PRIORITIES[number];

// ==================== MANUFACTURING STATUS ====================
export const MANUFACTURING_STATUSES = [
  'awaiting_admin_confirmation',
  'confirmed_awaiting_manufacturing',
  'cutting_sewing',
  'printing',
  'final_packing_press',
  'shipped',
  'complete'
] as const;
export type ManufacturingStatus = typeof MANUFACTURING_STATUSES[number];

export const MANUFACTURING_STATUS_LABELS: Record<ManufacturingStatus, string> = {
  awaiting_admin_confirmation: 'Awaiting Admin Confirmation',
  confirmed_awaiting_manufacturing: 'Confirmed, Awaiting Manufacturing',
  cutting_sewing: 'Cutting & Sewing',
  printing: 'Printing',
  final_packing_press: 'Final Packing & Press',
  shipped: 'Shipped',
  complete: 'Complete',
};

// Valid manufacturing status transitions - flexible rules allowing any status to transition to any other
export const MANUFACTURING_STATUS_TRANSITIONS: Record<ManufacturingStatus, ManufacturingStatus[]> = {
  awaiting_admin_confirmation: ['confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'final_packing_press', 'shipped', 'complete'],
  confirmed_awaiting_manufacturing: ['awaiting_admin_confirmation', 'cutting_sewing', 'printing', 'final_packing_press', 'shipped', 'complete'],
  cutting_sewing: ['awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'printing', 'final_packing_press', 'shipped', 'complete'],
  printing: ['awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'cutting_sewing', 'final_packing_press', 'shipped', 'complete'],
  final_packing_press: ['awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'shipped', 'complete'],
  shipped: ['awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'final_packing_press', 'complete'],
  complete: ['awaiting_admin_confirmation', 'confirmed_awaiting_manufacturing', 'cutting_sewing', 'printing', 'final_packing_press', 'shipped'],
};

// ==================== MANUFACTURING PRIORITY ====================
export const MANUFACTURING_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type ManufacturingPriority = typeof MANUFACTURING_PRIORITIES[number];

// ==================== MANUFACTURER FUNNEL STATUSES (Fine-grained) ====================
// These are internal statuses used only by manufacturer role
export const MANUFACTURER_FUNNEL_STATUSES = [
  'intake_pending',
  'specs_lock_review',
  'specs_locked',
  'materials_reserved',
  'samples_in_progress',
  'samples_awaiting_approval',
  'samples_approved',
  'samples_revise',
  'bulk_cutting',
  'bulk_print_emb_sublim',
  'bulk_stitching',
  'bulk_qc',
  'packing_complete',
  'handed_to_carrier',
  'delivered_confirmed'
] as const;
export type ManufacturerFunnelStatus = typeof MANUFACTURER_FUNNEL_STATUSES[number];

export const MANUFACTURER_FUNNEL_STATUS_LABELS: Record<ManufacturerFunnelStatus, string> = {
  intake_pending: 'Intake Pending',
  specs_lock_review: 'Specs Lock Review',
  specs_locked: 'Specs Locked',
  materials_reserved: 'Materials Reserved',
  samples_in_progress: 'Samples In Progress',
  samples_awaiting_approval: 'Samples Awaiting Approval',
  samples_approved: 'Samples Approved',
  samples_revise: 'Samples Revise',
  bulk_cutting: 'Bulk Cutting',
  bulk_print_emb_sublim: 'Bulk Print/Emb/Sublim',
  bulk_stitching: 'Bulk Stitching',
  bulk_qc: 'Bulk QC',
  packing_complete: 'Packing Complete',
  handed_to_carrier: 'Handed to Carrier',
  delivered_confirmed: 'Delivered Confirmed'
};

// Valid manufacturer funnel status transitions
export const MANUFACTURER_FUNNEL_TRANSITIONS: Record<ManufacturerFunnelStatus, ManufacturerFunnelStatus[]> = {
  intake_pending: ['specs_lock_review'],
  specs_lock_review: ['specs_locked'],
  specs_locked: ['materials_reserved'],
  materials_reserved: ['samples_in_progress', 'bulk_cutting'],
  samples_in_progress: ['samples_awaiting_approval'],
  samples_awaiting_approval: ['samples_approved', 'samples_revise'],
  samples_approved: ['bulk_cutting'],
  samples_revise: ['samples_in_progress'],
  bulk_cutting: ['bulk_print_emb_sublim', 'bulk_stitching'],
  bulk_print_emb_sublim: ['bulk_stitching'],
  bulk_stitching: ['bulk_qc'],
  bulk_qc: ['packing_complete'],
  packing_complete: ['handed_to_carrier'],
  handed_to_carrier: ['delivered_confirmed'],
  delivered_confirmed: []
};

// Mapping from fine-grained manufacturer status to public 7-stage status
export const MANUFACTURER_TO_PUBLIC_STATUS_MAP: Record<ManufacturerFunnelStatus, ManufacturingStatus> = {
  intake_pending: 'awaiting_admin_confirmation',
  specs_lock_review: 'awaiting_admin_confirmation',
  specs_locked: 'confirmed_awaiting_manufacturing',
  materials_reserved: 'confirmed_awaiting_manufacturing',
  samples_in_progress: 'confirmed_awaiting_manufacturing',
  samples_awaiting_approval: 'confirmed_awaiting_manufacturing',
  samples_approved: 'confirmed_awaiting_manufacturing',
  samples_revise: 'confirmed_awaiting_manufacturing',
  bulk_cutting: 'cutting_sewing',
  bulk_print_emb_sublim: 'printing',
  bulk_stitching: 'cutting_sewing',
  bulk_qc: 'final_packing_press',
  packing_complete: 'final_packing_press',
  handed_to_carrier: 'shipped',
  delivered_confirmed: 'complete'
};

// Get public status from manufacturer funnel status
export function getPublicStatusFromManufacturerStatus(manufacturerStatus: ManufacturerFunnelStatus): ManufacturingStatus {
  return MANUFACTURER_TO_PUBLIC_STATUS_MAP[manufacturerStatus];
}

// Check if manufacturer funnel status transition is valid
export function isValidManufacturerFunnelTransition(from: ManufacturerFunnelStatus, to: ManufacturerFunnelStatus): boolean {
  return MANUFACTURER_FUNNEL_TRANSITIONS[from]?.includes(to) ?? false;
}

// Type guard for manufacturer funnel status
export function isManufacturerFunnelStatus(value: string): value is ManufacturerFunnelStatus {
  return MANUFACTURER_FUNNEL_STATUSES.includes(value as ManufacturerFunnelStatus);
}

// Manufacturer funnel status config for UI (colors, icons, zones)
export const MANUFACTURER_FUNNEL_STATUS_CONFIG: Record<ManufacturerFunnelStatus, {
  color: string;
  icon: string;
  zone: 'intake' | 'specs' | 'samples' | 'production' | 'shipping';
  order: number;
}> = {
  intake_pending: { color: '#f59e0b', icon: 'Inbox', zone: 'intake', order: 1 },
  specs_lock_review: { color: '#f59e0b', icon: 'FileSearch', zone: 'intake', order: 2 },
  specs_locked: { color: '#3b82f6', icon: 'Lock', zone: 'specs', order: 3 },
  materials_reserved: { color: '#3b82f6', icon: 'Package', zone: 'specs', order: 4 },
  samples_in_progress: { color: '#8b5cf6', icon: 'Beaker', zone: 'samples', order: 5 },
  samples_awaiting_approval: { color: '#8b5cf6', icon: 'Clock', zone: 'samples', order: 6 },
  samples_approved: { color: '#22c55e', icon: 'CheckCircle', zone: 'samples', order: 7 },
  samples_revise: { color: '#ef4444', icon: 'RefreshCw', zone: 'samples', order: 8 },
  bulk_cutting: { color: '#ec4899', icon: 'Scissors', zone: 'production', order: 9 },
  bulk_print_emb_sublim: { color: '#ec4899', icon: 'Printer', zone: 'production', order: 10 },
  bulk_stitching: { color: '#ec4899', icon: 'Shirt', zone: 'production', order: 11 },
  bulk_qc: { color: '#06b6d4', icon: 'ClipboardCheck', zone: 'production', order: 12 },
  packing_complete: { color: '#06b6d4', icon: 'PackageCheck', zone: 'production', order: 13 },
  handed_to_carrier: { color: '#10b981', icon: 'Truck', zone: 'shipping', order: 14 },
  delivered_confirmed: { color: '#22c55e', icon: 'CheckCircle2', zone: 'shipping', order: 15 }
};

// Event types for manufacturer job events
export const MANUFACTURER_EVENT_TYPES = [
  'status_change',
  'spec_update',
  'pantone_update',
  'sample_approved',
  'sample_rejected',
  'deadline_changed',
  'note_added',
  'attachment_added',
  'shipment_created',
  'shipment_split',
  'issue_flagged',
  'issue_resolved'
] as const;
export type ManufacturerEventType = typeof MANUFACTURER_EVENT_TYPES[number];

// ==================== QUOTE STATUS ====================
export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const;
export type QuoteStatus = typeof QUOTE_STATUSES[number];

// ==================== INVOICE STATUS ====================
export const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

// ==================== CONTACT ROLES ====================
export const CONTACT_ROLES = ['customer', 'admin', 'billing', 'technical', 'executive', 'other'] as const;
export type ContactRole = typeof CONTACT_ROLES[number];

// ==================== CLIENT TYPES ====================
export const CLIENT_TYPES = ['retail', 'wholesale', 'enterprise', 'government'] as const;
export type ClientType = typeof CLIENT_TYPES[number];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  retail: 'Retail',
  wholesale: 'Wholesale',
  enterprise: 'Enterprise',
  government: 'Government',
};

// ==================== NOTIFICATION TYPES ====================
export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error', 'action'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

// ==================== INVITATION STATUS ====================
export const INVITATION_STATUSES = ['pending', 'accepted', 'expired', 'cancelled'] as const;
export type InvitationStatus = typeof INVITATION_STATUSES[number];

// ==================== FINANCIAL TRANSACTION TYPES ====================
export const FINANCIAL_TRANSACTION_TYPES = ['payment', 'expense', 'refund', 'commission', 'deposit', 'fee'] as const;
export type FinancialTransactionType = typeof FINANCIAL_TRANSACTION_TYPES[number];

export const FINANCIAL_TRANSACTION_STATUSES = ['pending', 'completed', 'failed', 'cancelled'] as const;
export type FinancialTransactionStatus = typeof FINANCIAL_TRANSACTION_STATUSES[number];

// ==================== COMMISSION TYPES ====================
export const COMMISSION_TYPES = ['order', 'quote', 'bonus', 'override'] as const;
export type CommissionType = typeof COMMISSION_TYPES[number];

export const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'disputed'] as const;
export type CommissionStatus = typeof COMMISSION_STATUSES[number];

// ==================== PAYMENT METHODS ====================
export const PAYMENT_METHODS = ['cash', 'check', 'wire', 'ach', 'credit_card', 'other'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if a status transition is valid
 */
export function isValidOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidDesignJobStatusTransition(from: DesignJobStatus, to: DesignJobStatus): boolean {
  return DESIGN_JOB_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidManufacturingStatusTransition(from: ManufacturingStatus, to: ManufacturingStatus): boolean {
  return MANUFACTURING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Type guards for status values
 */
export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function isLeadStage(value: string): value is LeadStage {
  return LEAD_STAGES.includes(value as LeadStage);
}

export function isDesignJobStatus(value: string): value is DesignJobStatus {
  return DESIGN_JOB_STATUSES.includes(value as DesignJobStatus);
}

export function isManufacturingStatus(value: string): value is ManufacturingStatus {
  return MANUFACTURING_STATUSES.includes(value as ManufacturingStatus);
}

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function isClientType(value: string): value is ClientType {
  return CLIENT_TYPES.includes(value as ClientType);
}
