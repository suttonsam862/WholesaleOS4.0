/**
 * Shared constants for Rich Habits OS
 * Single source of truth for enums, status values, and configuration
 */

// ==================== USER ROLES ====================
export const USER_ROLES = ['admin', 'sales', 'designer', 'ops', 'manufacturer', 'finance'] as const;
export type UserRole = typeof USER_ROLES[number];

// ==================== ORDER STATUS ====================
export const ORDER_STATUSES = ['new', 'waiting_sizes', 'invoiced', 'production', 'shipped', 'completed', 'cancelled'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  waiting_sizes: 'Waiting for Sizes',
  invoiced: 'Invoiced',
  production: 'In Production',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['waiting_sizes', 'invoiced', 'cancelled'],
  waiting_sizes: ['invoiced', 'cancelled'],
  invoiced: ['production', 'cancelled'],
  production: ['shipped', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
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

// Valid manufacturing status transitions
export const MANUFACTURING_STATUS_TRANSITIONS: Record<ManufacturingStatus, ManufacturingStatus[]> = {
  awaiting_admin_confirmation: ['confirmed_awaiting_manufacturing'],
  confirmed_awaiting_manufacturing: ['cutting_sewing', 'printing'],
  cutting_sewing: ['printing', 'final_packing_press'],
  printing: ['final_packing_press'],
  final_packing_press: ['shipped'],
  shipped: ['complete'],
  complete: [], // Terminal state
};

// ==================== MANUFACTURING PRIORITY ====================
export const MANUFACTURING_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type ManufacturingPriority = typeof MANUFACTURING_PRIORITIES[number];

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
