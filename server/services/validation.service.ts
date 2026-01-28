/**
 * V6 Validation Service
 * Advisory data validation layer - warns but doesn't block
 */

import { db } from "../db";
import {
  validationResults,
  validationSummaries,
  orders,
  orderLineItems,
  designJobs,
  organizations,
  type ValidationResult,
  type ValidationSummary,
} from "@shared/schema";
import { eq, and, sql, desc, inArray, gt, lt } from "drizzle-orm";

// Validation check types
export const VALIDATION_CHECK_TYPES = {
  // Order validations
  ORDER_HAS_CUSTOMER_INFO: "order_has_customer_info",
  ORDER_HAS_SHIPPING_ADDRESS: "order_has_shipping_address",
  ORDER_HAS_LINE_ITEMS: "order_has_line_items",
  ORDER_LINE_ITEMS_HAVE_SIZES: "order_line_items_have_sizes",
  ORDER_HAS_DESIGN_APPROVAL: "order_has_design_approval",
  ORDER_HAS_DEPOSIT: "order_has_deposit",
  ORDER_TOTAL_MATCHES_LINE_ITEMS: "order_total_matches_line_items",
  ORDER_HAS_MANUFACTURER_ASSIGNED: "order_has_manufacturer_assigned",
  ORDER_EST_DELIVERY_IS_FUTURE: "order_est_delivery_is_future",
  // Design job validations
  DESIGN_JOB_HAS_BRIEF: "design_job_has_brief",
  DESIGN_JOB_HAS_REFERENCE_FILES: "design_job_has_reference_files",
  DESIGN_JOB_HAS_DESIGNER: "design_job_has_designer",
  DESIGN_JOB_HAS_DEADLINE: "design_job_has_deadline",
  DESIGN_JOB_DEADLINE_NOT_PAST: "design_job_deadline_not_past",
  DESIGN_JOB_HAS_RENDITIONS: "design_job_has_renditions",
  // Line item validations
  LINE_ITEM_HAS_VARIANT: "line_item_has_variant",
  LINE_ITEM_HAS_SIZES: "line_item_has_sizes",
  LINE_ITEM_SIZE_TOTAL_MATCHES: "line_item_size_total_matches",
  LINE_ITEM_HAS_MANUFACTURER: "line_item_has_manufacturer",
} as const;

export type ValidationCheckType =
  (typeof VALIDATION_CHECK_TYPES)[keyof typeof VALIDATION_CHECK_TYPES];

// Validation status
export const VALIDATION_STATUSES = ["pass", "warning", "error", "skipped", "unable"] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

// Severity levels
export const VALIDATION_SEVERITIES = ["info", "warning", "error"] as const;
export type ValidationSeverity = (typeof VALIDATION_SEVERITIES)[number];

export interface ValidationCheckResult {
  checkType: ValidationCheckType;
  status: ValidationStatus;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, any>;
  suggestedAction?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface ValidationRunResult {
  entityType: string;
  entityId: string;
  overallStatus: ValidationStatus;
  results: ValidationCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    errors: number;
    skipped: number;
  };
}

export class ValidationService {
  /**
   * Run all validations for an order
   */
  async validateOrder(orderId: number, userId?: string): Promise<ValidationRunResult> {
    const results: ValidationCheckResult[] = [];

    // Get order with line items
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return this.createSkippedResult("order", String(orderId), "Order not found");
    }

    const lineItems = await db
      .select()
      .from(orderLineItems)
      .where(eq(orderLineItems.orderId, orderId));

    // Check: Has customer contact info
    results.push(this.checkOrderHasCustomerInfo(order));

    // Check: Has shipping address
    results.push(this.checkOrderHasShippingAddress(order));

    // Check: Has line items
    results.push(this.checkOrderHasLineItems(lineItems));

    // Check: Line items have sizes
    results.push(this.checkOrderLineItemsHaveSizes(lineItems));

    // Check: Design is approved (if past certain status)
    results.push(this.checkOrderHasDesignApproval(order));

    // Check: Has deposit (if invoiced)
    results.push(this.checkOrderHasDeposit(order));

    // Check: Est delivery is in the future
    results.push(this.checkOrderEstDeliveryIsFuture(order));

    // Save results and summary
    return this.saveValidationResults("order", String(orderId), results, userId);
  }

  /**
   * Run all validations for a design job
   */
  async validateDesignJob(jobId: number, userId?: string): Promise<ValidationRunResult> {
    const results: ValidationCheckResult[] = [];

    const [job] = await db
      .select()
      .from(designJobs)
      .where(eq(designJobs.id, jobId))
      .limit(1);

    if (!job) {
      return this.createSkippedResult("design_job", String(jobId), "Design job not found");
    }

    // Check: Has brief
    results.push(this.checkDesignJobHasBrief(job));

    // Check: Has reference files
    results.push(this.checkDesignJobHasReferenceFiles(job));

    // Check: Has assigned designer
    results.push(this.checkDesignJobHasDesigner(job));

    // Check: Has deadline
    results.push(this.checkDesignJobHasDeadline(job));

    // Check: Deadline is not past (if job not completed)
    results.push(this.checkDesignJobDeadlineNotPast(job));

    // Check: Has renditions (if in review or approved)
    results.push(this.checkDesignJobHasRenditions(job));

    return this.saveValidationResults("design_job", String(jobId), results, userId);
  }

  /**
   * Run validations for a single line item
   */
  async validateLineItem(lineItemId: number, userId?: string): Promise<ValidationRunResult> {
    const results: ValidationCheckResult[] = [];

    const [lineItem] = await db
      .select()
      .from(orderLineItems)
      .where(eq(orderLineItems.id, lineItemId))
      .limit(1);

    if (!lineItem) {
      return this.createSkippedResult("line_item", String(lineItemId), "Line item not found");
    }

    // Check: Has variant
    results.push(this.checkLineItemHasVariant(lineItem));

    // Check: Has sizes
    results.push(this.checkLineItemHasSizes(lineItem));

    return this.saveValidationResults("line_item", String(lineItemId), results, userId);
  }

  /**
   * Get validation summary for an entity
   */
  async getValidationSummary(
    entityType: string,
    entityId: string
  ): Promise<ValidationSummary | null> {
    const [summary] = await db
      .select()
      .from(validationSummaries)
      .where(
        and(
          eq(validationSummaries.entityType, entityType),
          eq(validationSummaries.entityId, entityId)
        )
      )
      .orderBy(desc(validationSummaries.validatedAt))
      .limit(1);

    return summary || null;
  }

  /**
   * Get validation results for an entity
   */
  async getValidationResults(
    entityType: string,
    entityId: string
  ): Promise<ValidationResult[]> {
    return db
      .select()
      .from(validationResults)
      .where(
        and(
          eq(validationResults.entityType, entityType),
          eq(validationResults.entityId, entityId),
          gt(validationResults.expiresAt, new Date())
        )
      )
      .orderBy(validationResults.checkType);
  }

  /**
   * Acknowledge a validation warning
   */
  async acknowledgeWarning(
    validationResultId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    await db
      .update(validationResults)
      .set({
        acknowledgedAt: new Date(),
        acknowledgedByUserId: userId,
        acknowledgmentNote: note,
      })
      .where(eq(validationResults.id, validationResultId));
  }

  /**
   * Clear acknowledgment for a validation
   */
  async clearAcknowledgment(validationResultId: string): Promise<void> {
    await db
      .update(validationResults)
      .set({
        acknowledgedAt: null,
        acknowledgedByUserId: null,
        acknowledgmentNote: null,
      })
      .where(eq(validationResults.id, validationResultId));
  }

  /**
   * Clean up expired validation results
   */
  async cleanupExpiredResults(): Promise<number> {
    const result = await db
      .delete(validationResults)
      .where(lt(validationResults.expiresAt, new Date()))
      .returning({ id: validationResults.id });

    return result.length;
  }

  // ============================================================================
  // Private validation check methods
  // ============================================================================

  private checkOrderHasCustomerInfo(order: any): ValidationCheckResult {
    const hasName = !!order.contactName;
    const hasEmail = !!order.contactEmail;
    const hasPhone = !!order.contactPhone;

    if (hasName && hasEmail) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_CUSTOMER_INFO,
        status: "pass",
        severity: "info",
        message: "Customer contact information is complete",
      };
    }

    const missing = [];
    if (!hasName) missing.push("name");
    if (!hasEmail) missing.push("email");
    if (!hasPhone) missing.push("phone");

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_CUSTOMER_INFO,
      status: "warning",
      severity: "warning",
      message: `Missing customer contact fields: ${missing.join(", ")}`,
      suggestedAction: "Add customer contact information before sending to production",
    };
  }

  private checkOrderHasShippingAddress(order: any): ValidationCheckResult {
    if (order.shippingAddress && order.shippingAddress.trim().length > 0) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_SHIPPING_ADDRESS,
        status: "pass",
        severity: "info",
        message: "Shipping address is present",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_SHIPPING_ADDRESS,
      status: "warning",
      severity: "warning",
      message: "No shipping address provided",
      suggestedAction: "Add shipping address before invoicing",
    };
  }

  private checkOrderHasLineItems(lineItems: any[]): ValidationCheckResult {
    if (lineItems.length > 0) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_LINE_ITEMS,
        status: "pass",
        severity: "info",
        message: `Order has ${lineItems.length} line item(s)`,
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_LINE_ITEMS,
      status: "error",
      severity: "error",
      message: "Order has no line items",
      suggestedAction: "Add at least one product to the order",
    };
  }

  private checkOrderLineItemsHaveSizes(lineItems: any[]): ValidationCheckResult {
    const itemsWithoutSizes = lineItems.filter((item) => {
      const totalUnits = (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) +
        (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) +
        (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0) + (item.xxxxl || 0);
      return totalUnits === 0;
    });

    if (itemsWithoutSizes.length === 0) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_LINE_ITEMS_HAVE_SIZES,
        status: "pass",
        severity: "info",
        message: "All line items have sizes specified",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_LINE_ITEMS_HAVE_SIZES,
      status: "warning",
      severity: "warning",
      message: `${itemsWithoutSizes.length} line item(s) have no sizes specified`,
      details: { lineItemIds: itemsWithoutSizes.map((i) => i.id) },
      suggestedAction: "Ensure all line items have sizes before sending to production",
    };
  }

  private checkOrderHasDesignApproval(order: any): ValidationCheckResult {
    const requiresApproval = ["invoiced", "production", "shipped"].includes(order.status);

    if (!requiresApproval) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_DESIGN_APPROVAL,
        status: "skipped",
        severity: "info",
        message: "Design approval check not required at current status",
      };
    }

    if (order.designApproved) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_DESIGN_APPROVAL,
        status: "pass",
        severity: "info",
        message: "Design has been approved",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_DESIGN_APPROVAL,
      status: "warning",
      severity: "warning",
      message: "Design has not been marked as approved",
      suggestedAction: "Confirm design approval before proceeding",
    };
  }

  private checkOrderHasDeposit(order: any): ValidationCheckResult {
    if (!["invoiced", "production", "shipped"].includes(order.status)) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_DEPOSIT,
        status: "skipped",
        severity: "info",
        message: "Deposit check not required at current status",
      };
    }

    if (order.depositReceived) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_DEPOSIT,
        status: "pass",
        severity: "info",
        message: "Deposit has been received",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_HAS_DEPOSIT,
      status: "warning",
      severity: "warning",
      message: "No deposit received yet",
      suggestedAction: "Verify deposit before starting production",
    };
  }

  private checkOrderEstDeliveryIsFuture(order: any): ValidationCheckResult {
    if (!order.estDelivery) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_EST_DELIVERY_IS_FUTURE,
        status: "warning",
        severity: "info",
        message: "No estimated delivery date set",
        suggestedAction: "Set an estimated delivery date",
      };
    }

    const estDelivery = new Date(order.estDelivery);
    const now = new Date();

    if (estDelivery > now) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_EST_DELIVERY_IS_FUTURE,
        status: "pass",
        severity: "info",
        message: `Estimated delivery: ${estDelivery.toLocaleDateString()}`,
      };
    }

    if (["completed", "shipped", "cancelled"].includes(order.status)) {
      return {
        checkType: VALIDATION_CHECK_TYPES.ORDER_EST_DELIVERY_IS_FUTURE,
        status: "skipped",
        severity: "info",
        message: "Order is already completed/shipped",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.ORDER_EST_DELIVERY_IS_FUTURE,
      status: "warning",
      severity: "warning",
      message: `Estimated delivery date is in the past: ${estDelivery.toLocaleDateString()}`,
      suggestedAction: "Update estimated delivery date or check order status",
    };
  }

  private checkDesignJobHasBrief(job: any): ValidationCheckResult {
    if (job.brief && job.brief.trim().length > 0) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_BRIEF,
        status: "pass",
        severity: "info",
        message: "Design brief is present",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_BRIEF,
      status: "warning",
      severity: "warning",
      message: "No design brief provided",
      suggestedAction: "Add a design brief to guide the designer",
    };
  }

  private checkDesignJobHasReferenceFiles(job: any): ValidationCheckResult {
    const hasRefs =
      (job.referenceFiles && job.referenceFiles.length > 0) ||
      (job.logoUrls && job.logoUrls.length > 0);

    if (hasRefs) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_REFERENCE_FILES,
        status: "pass",
        severity: "info",
        message: "Reference files are attached",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_REFERENCE_FILES,
      status: "warning",
      severity: "info",
      message: "No reference files attached",
      suggestedAction: "Consider adding reference files or logos",
    };
  }

  private checkDesignJobHasDesigner(job: any): ValidationCheckResult {
    if (job.assignedDesignerId) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_DESIGNER,
        status: "pass",
        severity: "info",
        message: "Designer is assigned",
      };
    }

    if (job.status === "pending") {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_DESIGNER,
        status: "warning",
        severity: "info",
        message: "No designer assigned yet",
        suggestedAction: "Assign a designer to begin work",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_DESIGNER,
      status: "warning",
      severity: "warning",
      message: "No designer assigned",
      suggestedAction: "Assign a designer immediately",
    };
  }

  private checkDesignJobHasDeadline(job: any): ValidationCheckResult {
    if (job.deadline) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_DEADLINE,
        status: "pass",
        severity: "info",
        message: `Deadline: ${new Date(job.deadline).toLocaleDateString()}`,
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_DEADLINE,
      status: "warning",
      severity: "info",
      message: "No deadline set",
      suggestedAction: "Set a deadline for the design job",
    };
  }

  private checkDesignJobDeadlineNotPast(job: any): ValidationCheckResult {
    if (!job.deadline) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_DEADLINE_NOT_PAST,
        status: "skipped",
        severity: "info",
        message: "No deadline to check",
      };
    }

    if (["completed", "approved"].includes(job.status)) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_DEADLINE_NOT_PAST,
        status: "skipped",
        severity: "info",
        message: "Job is already completed",
      };
    }

    const deadline = new Date(job.deadline);
    const now = new Date();

    if (deadline > now) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_DEADLINE_NOT_PAST,
        status: "pass",
        severity: "info",
        message: "Deadline is in the future",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_DEADLINE_NOT_PAST,
      status: "warning",
      severity: "warning",
      message: `Deadline has passed: ${deadline.toLocaleDateString()}`,
      suggestedAction: "Update deadline or expedite the design work",
    };
  }

  private checkDesignJobHasRenditions(job: any): ValidationCheckResult {
    if (!["review", "approved", "completed"].includes(job.status)) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_RENDITIONS,
        status: "skipped",
        severity: "info",
        message: "Renditions not required at current status",
      };
    }

    if (job.renditionUrls && job.renditionUrls.length > 0) {
      return {
        checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_RENDITIONS,
        status: "pass",
        severity: "info",
        message: `${job.renditionUrls.length} rendition(s) uploaded`,
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.DESIGN_JOB_HAS_RENDITIONS,
      status: "warning",
      severity: "warning",
      message: "No design renditions uploaded",
      suggestedAction: "Upload design renditions for review",
    };
  }

  private checkLineItemHasVariant(lineItem: any): ValidationCheckResult {
    if (lineItem.variantId) {
      return {
        checkType: VALIDATION_CHECK_TYPES.LINE_ITEM_HAS_VARIANT,
        status: "pass",
        severity: "info",
        message: "Product variant is assigned",
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.LINE_ITEM_HAS_VARIANT,
      status: "error",
      severity: "error",
      message: "No product variant assigned",
      suggestedAction: "Select a product variant for this line item",
    };
  }

  private checkLineItemHasSizes(lineItem: any): ValidationCheckResult {
    const totalUnits = (lineItem.yxs || 0) + (lineItem.ys || 0) + (lineItem.ym || 0) +
      (lineItem.yl || 0) + (lineItem.xs || 0) + (lineItem.s || 0) + (lineItem.m || 0) +
      (lineItem.l || 0) + (lineItem.xl || 0) + (lineItem.xxl || 0) +
      (lineItem.xxxl || 0) + (lineItem.xxxxl || 0);

    if (totalUnits > 0) {
      return {
        checkType: VALIDATION_CHECK_TYPES.LINE_ITEM_HAS_SIZES,
        status: "pass",
        severity: "info",
        message: `Total units: ${totalUnits}`,
      };
    }

    return {
      checkType: VALIDATION_CHECK_TYPES.LINE_ITEM_HAS_SIZES,
      status: "warning",
      severity: "warning",
      message: "No sizes/quantities specified",
      suggestedAction: "Add size quantities to this line item",
    };
  }

  // ============================================================================
  // Helper methods
  // ============================================================================

  private createSkippedResult(
    entityType: string,
    entityId: string,
    reason: string
  ): ValidationRunResult {
    return {
      entityType,
      entityId,
      overallStatus: "unable",
      results: [
        {
          checkType: "entity_exists" as ValidationCheckType,
          status: "unable",
          severity: "error",
          message: reason,
        },
      ],
      summary: {
        totalChecks: 1,
        passed: 0,
        warnings: 0,
        errors: 0,
        skipped: 1,
      },
    };
  }

  private async saveValidationResults(
    entityType: string,
    entityId: string,
    results: ValidationCheckResult[],
    userId?: string
  ): Promise<ValidationRunResult> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Results valid for 1 hour

    // Delete existing results for this entity
    await db
      .delete(validationResults)
      .where(
        and(
          eq(validationResults.entityType, entityType),
          eq(validationResults.entityId, entityId)
        )
      );

    // Insert new results
    if (results.length > 0) {
      await db.insert(validationResults).values(
        results.map((r) => ({
          entityType,
          entityId,
          checkType: r.checkType,
          status: r.status,
          severity: r.severity,
          message: r.message,
          details: r.details,
          suggestedAction: r.suggestedAction,
          relatedEntityType: r.relatedEntityType,
          relatedEntityId: r.relatedEntityId,
          expiresAt,
          createdByUserId: userId,
        }))
      );
    }

    // Calculate summary
    const summary = {
      totalChecks: results.length,
      passed: results.filter((r) => r.status === "pass").length,
      warnings: results.filter((r) => r.status === "warning").length,
      errors: results.filter((r) => r.status === "error").length,
      skipped: results.filter((r) => r.status === "skipped" || r.status === "unable").length,
    };

    const overallStatus: ValidationStatus =
      summary.errors > 0
        ? "error"
        : summary.warnings > 0
        ? "warning"
        : "pass";

    // Upsert summary
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 1);

    await db
      .insert(validationSummaries)
      .values({
        entityType,
        entityId,
        totalChecks: summary.totalChecks,
        passed: summary.passed,
        warnings: summary.warnings,
        errors: summary.errors,
        skipped: summary.skipped,
        overallStatus,
        validatedAt: new Date(),
        validUntil,
      })
      .onConflictDoUpdate({
        target: [validationSummaries.entityType, validationSummaries.entityId],
        set: {
          totalChecks: summary.totalChecks,
          passed: summary.passed,
          warnings: summary.warnings,
          errors: summary.errors,
          skipped: summary.skipped,
          overallStatus,
          validatedAt: new Date(),
          validUntil,
          updatedAt: new Date(),
        },
      });

    // Update entity validation status
    if (entityType === "order") {
      await db
        .update(orders)
        .set({
          validationStatus: overallStatus,
          validationLastRunAt: new Date(),
          hasUnresolvedWarnings: summary.warnings > 0,
        })
        .where(eq(orders.id, parseInt(entityId)));
    } else if (entityType === "design_job") {
      await db
        .update(designJobs)
        .set({ validationStatus: overallStatus })
        .where(eq(designJobs.id, parseInt(entityId)));
    }

    return {
      entityType,
      entityId,
      overallStatus,
      results,
      summary,
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();
