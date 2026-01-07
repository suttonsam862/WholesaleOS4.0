/**
 * Order Detail Progressive Disclosure Configuration
 * 
 * Defines which sections are visible by default based on user role and order stage.
 * Used by OrderCapsule and related components to reduce cognitive load.
 */

import type { UserRole, StageId } from "./ordersStageConfig";

export type ModuleId = "overview" | "line-items" | "design" | "manufacturing" | "form-link" | "activity";

export interface SectionVisibility {
  /** Always visible sections for this role */
  defaultVisible: string[];
  /** Sections hidden behind "Advanced" toggle */
  advancedSections: string[];
  /** Default active tab/module */
  defaultModule: ModuleId;
}

export interface StageDefaults {
  /** Primary module to show for this stage */
  primaryModule: ModuleId;
  /** Sections to prioritize/expand in overview */
  prioritySections: string[];
}

/**
 * Role-based section visibility configuration
 */
export const ROLE_SECTION_CONFIG: Record<UserRole, SectionVisibility> = {
  admin: {
    defaultVisible: ["status-header", "progress-milestones", "customer-info", "order-summary", "tracking"],
    advancedSections: ["shipping-address", "billing-address", "invoice-links", "folder-links", "totals", "admin-controls"],
    defaultModule: "overview",
  },
  sales: {
    defaultVisible: ["status-header", "progress-milestones", "customer-info", "form-link-cta", "notes"],
    advancedSections: ["shipping-address", "billing-address", "invoice-links", "folder-links", "totals", "workflow-toggles"],
    defaultModule: "overview",
  },
  ops: {
    defaultVisible: ["status-header", "progress-milestones", "workflow-toggles", "tracking", "manufacturing-status"],
    advancedSections: ["customer-info", "invoice-links", "folder-links", "totals"],
    defaultModule: "overview",
  },
  designer: {
    defaultVisible: ["status-header", "progress-milestones", "design-status", "images"],
    advancedSections: ["customer-info", "shipping-address", "billing-address", "invoice-links", "totals", "workflow-toggles"],
    defaultModule: "design",
  },
  manufacturer: {
    defaultVisible: ["status-header", "progress-milestones", "manufacturing-status", "line-items-summary"],
    advancedSections: ["customer-info", "invoice-links", "workflow-toggles", "order-details"],
    defaultModule: "manufacturing",
  },
  finance: {
    defaultVisible: ["status-header", "totals", "invoice-links", "deposit-status", "customer-info"],
    advancedSections: ["shipping-address", "design-status", "manufacturing-status", "workflow-toggles"],
    defaultModule: "overview",
  },
};

/**
 * Stage-based defaults - determines which tab/section to prioritize
 */
export const STAGE_DEFAULTS: Record<StageId, StageDefaults> = {
  drafts: {
    primaryModule: "overview",
    prioritySections: ["customer-info", "form-link-cta"],
  },
  "awaiting-sizes": {
    primaryModule: "form-link",
    prioritySections: ["form-link-cta", "line-items-summary"],
  },
  "ready-to-invoice": {
    primaryModule: "overview",
    prioritySections: ["totals", "invoice-links", "customer-info"],
  },
  "ready-for-production": {
    primaryModule: "manufacturing",
    prioritySections: ["line-items-summary", "manufacturing-status"],
  },
  "in-production": {
    primaryModule: "manufacturing",
    prioritySections: ["manufacturing-status", "tracking"],
  },
  shipped: {
    primaryModule: "overview",
    prioritySections: ["tracking", "customer-info"],
  },
  completed: {
    primaryModule: "overview",
    prioritySections: ["totals", "tracking"],
  },
  issues: {
    primaryModule: "activity",
    prioritySections: ["status-header", "notes"],
  },
};

/**
 * Map order status to stage for fallback when URL stage not available
 */
function statusToStage(status?: string): StageId | undefined {
  if (!status) return undefined;
  switch (status) {
    case "new": return "drafts";
    case "waiting_sizes": return "awaiting-sizes";
    case "design_created": return "awaiting-sizes";
    case "sizes_validated": return "ready-to-invoice";
    case "invoiced": return "ready-for-production";
    case "production": return "in-production";
    case "shipped": return "shipped";
    case "completed": return "completed";
    default: return undefined;
  }
}

/**
 * Get the default module to display based on role and stage
 */
export function getDefaultModule(role: UserRole, stage?: StageId, orderStatus?: string): ModuleId {
  // Stage takes priority if available from URL
  if (stage && STAGE_DEFAULTS[stage]) {
    return STAGE_DEFAULTS[stage].primaryModule;
  }
  
  // Fall back to stage inferred from order status
  const inferredStage = statusToStage(orderStatus);
  if (inferredStage && STAGE_DEFAULTS[inferredStage]) {
    return STAGE_DEFAULTS[inferredStage].primaryModule;
  }
  
  // Fall back to role defaults
  return ROLE_SECTION_CONFIG[role]?.defaultModule || "overview";
}

/**
 * Check if a section should be visible by default for a role
 */
export function isSectionVisibleByDefault(role: UserRole, sectionId: string): boolean {
  const config = ROLE_SECTION_CONFIG[role];
  if (!config) return true;
  return config.defaultVisible.includes(sectionId);
}

/**
 * Check if a section is in the "Advanced" category for a role
 */
export function isAdvancedSection(role: UserRole, sectionId: string): boolean {
  const config = ROLE_SECTION_CONFIG[role];
  if (!config) return false;
  return config.advancedSections.includes(sectionId);
}

/**
 * Determine which modules should be visible based on role
 */
export function getVisibleModules(role: UserRole): ModuleId[] {
  const modules: ModuleId[] = ["overview", "line-items"];
  
  if (role === "admin" || role === "designer" || role === "ops") {
    modules.push("design");
  }
  
  if (role === "admin" || role === "ops" || role === "manufacturer") {
    modules.push("manufacturing");
  }
  
  modules.push("form-link", "activity");
  
  return modules;
}

/**
 * Get priority sections for a stage
 */
export function getPrioritySections(stage?: StageId): string[] {
  if (!stage || !STAGE_DEFAULTS[stage]) {
    return [];
  }
  return STAGE_DEFAULTS[stage].prioritySections;
}
