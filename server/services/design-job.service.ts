/**
 * Design Job Service
 * 
 * Centralizes all design job business logic including:
 * - Status transition validation
 * - Assignment validation
 * - Comment management
 */

import { storage } from '../storage';
import { InsertDesignJob, DesignJob, User } from '../../shared/schema';
import {
  DESIGN_JOB_STATUSES,
  type DesignJobStatus
} from '../../shared/constants';
import { ValidationError, NotFoundError, ForbiddenError, logActivity } from './base.service';

export class DesignJobService {
  /**
   * Check if a status is valid (no transition restrictions)
   */
  static isValidStatus(status: string): boolean {
    return DESIGN_JOB_STATUSES.includes(status as DesignJobStatus);
  }

  /**
   * Create a new design job with validation
   */
  static async createDesignJob(
    job: InsertDesignJob,
    createdBy: User
  ): Promise<DesignJob> {
    // Validate initial status
    const status = job.status || 'pending';
    if (!DESIGN_JOB_STATUSES.includes(status as DesignJobStatus)) {
      throw new ValidationError(
        `Invalid design job status: ${status}. Must be one of: ${DESIGN_JOB_STATUSES.join(', ')}`
      );
    }

    // Require order ID (optional but recommended)
    // Note: orgId is used in schema, not organizationId
    if (!job.orderId) {
      throw new ValidationError('Order ID is required for design job');
    }

    const created = await storage.createDesignJob({
      ...job,
      status: status as DesignJobStatus,
      salespersonId: createdBy.id,
    });

    await logActivity({
      action: 'design_job_created',
      entityType: 'design_job',
      entityId: created.id,
      userId: createdBy.id,
      details: { orderId: job.orderId, status }
    });

    return created;
  }

  /**
   * Get a design job by ID
   */
  static async getDesignJob(id: number): Promise<DesignJob & { organization?: any; designer?: User }> {
    const job = await storage.getDesignJob(id);
    if (!job) {
      throw new NotFoundError('Design job', id);
    }
    return job;
  }

  /**
   * Get a design job with comments
   */
  static async getDesignJobWithComments(id: number) {
    const job = await storage.getDesignJobWithComments(id);
    if (!job) {
      throw new NotFoundError('Design job', id);
    }
    return job;
  }

  /**
   * Update design job with status transition validation
   */
  static async updateDesignJob(
    id: number,
    updates: Partial<InsertDesignJob>,
    updatedBy: User
  ): Promise<DesignJob> {
    const existing = await storage.getDesignJob(id);
    if (!existing) {
      throw new NotFoundError('Design job', id);
    }

    // Validate status value if being changed (no transition restrictions)
    if (updates.status && updates.status !== existing.status) {
      if (!this.isValidStatus(updates.status)) {
        throw new ValidationError(
          `Invalid design job status: ${updates.status}. Must be one of: ${DESIGN_JOB_STATUSES.join(', ')}`
        );
      }
    }

    const updated = await storage.updateDesignJob(id, updates);

    await logActivity({
      action: 'design_job_updated',
      entityType: 'design_job',
      entityId: id,
      userId: updatedBy.id,
      details: { 
        previousStatus: existing.status,
        newStatus: updates.status || existing.status,
        changes: Object.keys(updates)
      }
    });

    return updated;
  }

  /**
   * Update design job status with transition validation
   */
  static async updateDesignJobStatus(
    id: number,
    newStatus: DesignJobStatus,
    updatedBy: User
  ): Promise<DesignJob> {
    const existing = await storage.getDesignJob(id);
    if (!existing) {
      throw new NotFoundError('Design job', id);
    }

    // Validate status value only (no transition restrictions)
    if (!this.isValidStatus(newStatus)) {
      throw new ValidationError(
        `Invalid design job status: ${newStatus}. Must be one of: ${DESIGN_JOB_STATUSES.join(', ')}`
      );
    }

    const updated = await storage.updateDesignJobStatus(id, newStatus);

    await logActivity({
      action: 'design_job_status_changed',
      entityType: 'design_job',
      entityId: id,
      userId: updatedBy.id,
      details: { previousStatus: existing.status, newStatus }
    });

    return updated;
  }

  /**
   * Assign a designer to a design job
   */
  static async assignDesigner(
    id: number,
    designerId: string,
    assignedBy: User
  ): Promise<DesignJob> {
    const existing = await storage.getDesignJob(id);
    if (!existing) {
      throw new NotFoundError('Design job', id);
    }

    // Verify designer exists and has appropriate role
    const designer = await storage.getUser(designerId);
    if (!designer) {
      throw new ValidationError(`Designer with ID ${designerId} not found`);
    }

    // Check designer has appropriate role
    if (!['designer', 'admin', 'owner'].includes(designer.role)) {
      throw new ValidationError(
        `User ${designer.name} cannot be assigned as designer. Required role: designer, admin, or owner`
      );
    }

    // Schema uses assignedDesignerId, not designerId
    const updated = await storage.updateDesignJob(id, { assignedDesignerId: designerId });

    await logActivity({
      action: 'design_job_assigned',
      entityType: 'design_job',
      entityId: id,
      userId: assignedBy.id,
      details: { designerId, designerName: designer.name }
    });

    return updated;
  }

  /**
   * Add a comment to a design job
   */
  static async addComment(
    jobId: number,
    comment: string,
    author: User,
    isInternal: boolean = false
  ) {
    const job = await storage.getDesignJob(jobId);
    if (!job) {
      throw new NotFoundError('Design job', jobId);
    }

    // Schema uses jobId and userId, not designJobId and authorId
    const created = await storage.createDesignJobComment({
      jobId: jobId,
      userId: author.id,
      comment,
      isInternal,
    });

    await logActivity({
      action: 'design_job_comment_added',
      entityType: 'design_job',
      entityId: jobId,
      userId: author.id,
      details: { commentId: created.id, isInternal }
    });

    return created;
  }

  /**
   * Get comments for a design job
   */
  static async getComments(jobId: number) {
    const job = await storage.getDesignJob(jobId);
    if (!job) {
      throw new NotFoundError('Design job', jobId);
    }

    return storage.getDesignJobComments(jobId);
  }

  /**
   * Check if user can update a design job
   */
  static canUpdateDesignJob(job: DesignJob, user: User): boolean {
    // Admins and owners can update any design job
    if (['admin', 'owner'].includes(user.role)) {
      return true;
    }

    // Assigned designer can update their design job (schema uses assignedDesignerId)
    if (job.assignedDesignerId === user.id) {
      return true;
    }

    // Salesperson who created the order can update (schema uses salespersonId)
    if (job.salespersonId === user.id) {
      return true;
    }

    return false;
  }

  /**
   * Assert that user can update a design job (throws if not)
   */
  static assertCanUpdate(job: DesignJob, user: User): void {
    if (!this.canUpdateDesignJob(job, user)) {
      throw new ForbiddenError('update this design job');
    }
  }
}
