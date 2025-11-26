/**
 * Manufacturing Service
 * Handles manufacturing business logic, status transitions, and validation
 */

import { storage } from '../storage';
import type { Manufacturing, InsertManufacturing, User } from '@shared/schema';
import {
  MANUFACTURING_STATUSES,
  MANUFACTURING_STATUS_TRANSITIONS,
  isManufacturingStatus,
  isValidManufacturingStatusTransition,
  type ManufacturingStatus,
} from '@shared/constants';
import {
  ServiceError,
  ValidationError,
  NotFoundError,
  InvalidTransitionError,
  ConflictError,
  logActivity,
} from './base.service';

export class ManufacturingService {
  /**
   * Validate that a status transition is allowed
   */
  static validateStatusTransition(
    currentStatus: ManufacturingStatus,
    newStatus: ManufacturingStatus
  ): void {
    if (currentStatus === newStatus) {
      return; // No change, always valid
    }

    if (!isManufacturingStatus(newStatus)) {
      throw new ValidationError(
        `Invalid manufacturing status: "${newStatus}". Valid statuses are: ${MANUFACTURING_STATUSES.join(', ')}`
      );
    }

    if (!isValidManufacturingStatusTransition(currentStatus, newStatus)) {
      const allowedTransitions = MANUFACTURING_STATUS_TRANSITIONS[currentStatus];
      throw new InvalidTransitionError(
        'manufacturing',
        currentStatus,
        newStatus
      );
    }
  }

  /**
   * Validate that a status is a valid manufacturing status
   */
  static validateStatus(status: string): void {
    if (!isManufacturingStatus(status)) {
      throw new ValidationError(
        `Invalid manufacturing status: "${status}". Valid statuses are: ${MANUFACTURING_STATUSES.join(', ')}`
      );
    }
  }

  /**
   * Get allowed next statuses for a manufacturing record
   */
  static getAllowedNextStatuses(currentStatus: ManufacturingStatus): ManufacturingStatus[] {
    if (!isManufacturingStatus(currentStatus)) {
      return [];
    }
    return MANUFACTURING_STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Create a new manufacturing record with validation
   */
  static async createManufacturing(
    data: Partial<InsertManufacturing>,
    userId: string
  ): Promise<Manufacturing> {
    // Validate required fields
    if (!data.orderId) {
      throw new ValidationError('Order ID is required for manufacturing record');
    }

    // Check if manufacturing record already exists for this order
    const existing = await storage.getManufacturingByOrder(data.orderId);
    if (existing) {
      throw new ConflictError('Manufacturing record already exists for this order');
    }

    // Validate status if provided
    const status = data.status || 'awaiting_admin_confirmation';
    this.validateStatus(status);

    const manufacturingData = {
      ...data,
      orderId: data.orderId,
      status,
      priority: data.priority || 'normal',
    };

    // Create the manufacturing record
    const manufacturing = await storage.createManufacturing(manufacturingData);

    // Log the activity
    await logActivity({
      entityType: 'manufacturing',
      entityId: manufacturing.id,
      action: 'manufacturing_created',
      userId,
      newState: { status: manufacturing.status, orderId: manufacturing.orderId },
    });

    return manufacturing;
  }

  /**
   * Update a manufacturing record with status transition validation
   */
  static async updateManufacturing(
    manufacturingId: number,
    data: Partial<InsertManufacturing>,
    userId: string
  ): Promise<Manufacturing> {
    // Get the existing manufacturing record
    const existing = await storage.getManufacturingRecord(manufacturingId);
    if (!existing) {
      throw new NotFoundError('Manufacturing', manufacturingId);
    }

    // Validate status if being changed
    if (data.status && data.status !== existing.status) {
      this.validateStatusTransition(
        existing.status as ManufacturingStatus,
        data.status as ManufacturingStatus
      );
    }

    // Preserve the previous state for audit
    const previousState = {
      status: existing.status,
      priority: existing.priority,
    };

    // Update the manufacturing record
    const updated = await storage.updateManufacturing(manufacturingId, data);
    if (!updated) {
      throw new ServiceError('Failed to update manufacturing record', 500);
    }

    // Log the activity
    const action = data.status !== existing.status
      ? 'manufacturing_status_changed'
      : 'manufacturing_updated';

    await logActivity({
      entityType: 'manufacturing',
      entityId: manufacturingId,
      action,
      userId,
      previousState,
      newState: {
        status: updated.status,
        priority: updated.priority,
      },
    });

    // If manufacturing is complete, optionally update order status
    if (data.status === 'complete') {
      await this.onManufacturingComplete(manufacturingId, userId);
    }

    return updated;
  }

  /**
   * Update only the manufacturing status with full transition validation
   */
  static async updateManufacturingStatus(
    manufacturingId: number,
    newStatus: ManufacturingStatus,
    userId: string
  ): Promise<Manufacturing> {
    const existing = await storage.getManufacturingRecord(manufacturingId);
    if (!existing) {
      throw new NotFoundError('Manufacturing', manufacturingId);
    }

    // Validate the transition
    this.validateStatusTransition(
      existing.status as ManufacturingStatus,
      newStatus
    );

    // Update just the status
    const updated = await storage.updateManufacturing(manufacturingId, { status: newStatus });
    if (!updated) {
      throw new ServiceError('Failed to update manufacturing status', 500);
    }

    // Log the activity
    await logActivity({
      entityType: 'manufacturing',
      entityId: manufacturingId,
      action: 'manufacturing_status_changed',
      userId,
      previousState: { status: existing.status },
      newState: { status: newStatus },
    });

    // If manufacturing is complete, optionally update order status
    if (newStatus === 'complete') {
      await this.onManufacturingComplete(manufacturingId, userId);
    }

    return updated;
  }

  /**
   * Handle manufacturing completion
   * This can optionally update the order status
   */
  static async onManufacturingComplete(
    manufacturingId: number,
    userId: string
  ): Promise<void> {
    const manufacturing = await storage.getManufacturingRecord(manufacturingId);
    if (!manufacturing) {
      return;
    }

    // Log that manufacturing is complete
    await logActivity({
      entityType: 'manufacturing',
      entityId: manufacturingId,
      action: 'manufacturing_completed',
      userId,
      newState: { status: 'complete', orderId: manufacturing.orderId },
    });

    // Note: The decision to auto-update order status when manufacturing completes
    // is a business decision. For now, we just log the completion.
    // If desired, this could trigger order status change:
    // await OrderService.updateOrderStatus(manufacturing.orderId, 'shipped', userId);
  }

  /**
   * Get a manufacturing record by ID
   */
  static async getManufacturingById(manufacturingId: number): Promise<Manufacturing> {
    const manufacturing = await storage.getManufacturingRecord(manufacturingId);
    if (!manufacturing) {
      throw new NotFoundError('Manufacturing', manufacturingId);
    }
    return manufacturing;
  }

  /**
   * Get manufacturing record by order ID
   */
  static async getManufacturingByOrderId(orderId: number): Promise<Manufacturing | undefined> {
    return await storage.getManufacturingByOrder(orderId);
  }

  /**
   * Check if a user can modify a manufacturing record based on role
   */
  static canUserModifyManufacturing(user: User): boolean {
    // Admins, ops, and manufacturers can modify manufacturing records
    return ['admin', 'ops', 'manufacturer'].includes(user.role);
  }

  /**
   * Check if a user can view manufacturing records
   */
  static canUserViewManufacturing(user: User): boolean {
    // Admins, ops, and manufacturers can view manufacturing records
    // Designers and sales cannot
    return ['admin', 'ops', 'manufacturer'].includes(user.role);
  }
}

export default ManufacturingService;
