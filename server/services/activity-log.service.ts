/**
 * V6 Activity Log Service
 * Unified activity feed for all entity types with comments, status changes, and file events
 */

import { db } from "../db";
import {
  activityLogs,
  users,
  orders,
  designJobs,
  leads,
  type ActivityLog,
  type InsertActivityLog,
} from "@shared/schema";
import { eq, and, sql, desc, inArray, isNull, lt } from "drizzle-orm";
import { notificationService } from "./notification.service";

// Activity types
export const ACTIVITY_TYPES = [
  "comment",
  "status_change",
  "field_update",
  "file_upload",
  "file_download",
  "file_delete",
  "assignment",
  "email_sent",
  "payment",
  "manufacturing_update",
  "created",
  "archived",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// Entity types that support activity logs
export const ENTITY_TYPES = [
  "order",
  "design_job",
  "lead",
  "organization",
  "event",
  "manufacturing_package",
  "invoice",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export interface CreateActivityOptions {
  entityType: EntityType;
  entityId: string;
  activityType: ActivityType;
  userId?: string;
  userName?: string;
  content?: string;
  contentHtml?: string;
  metadata?: Record<string, any>;
  parentId?: string;
  isInternal?: boolean;
  isSystem?: boolean;
  mentions?: string[];
}

export interface ActivityWithUser extends ActivityLog {
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    role: string;
  };
}

export interface ActivityFeedOptions {
  limit?: number;
  offset?: number;
  activityTypes?: ActivityType[];
  includeInternal?: boolean;
  includeSystem?: boolean;
  includeDeleted?: boolean;
}

export class ActivityLogService {
  /**
   * Create a new activity log entry
   */
  async createActivity(options: CreateActivityOptions): Promise<ActivityLog> {
    // Get user name if not provided
    let userName = options.userName;
    if (options.userId && !userName) {
      const [user] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, options.userId))
        .limit(1);
      userName = user?.name;
    }

    const [activity] = await db
      .insert(activityLogs)
      .values({
        entityType: options.entityType,
        entityId: options.entityId,
        activityType: options.activityType,
        userId: options.userId,
        userName: userName || "System",
        content: options.content,
        contentHtml: options.contentHtml,
        metadata: options.metadata,
        parentId: options.parentId,
        isInternal: options.isInternal || false,
        isSystem: options.isSystem || false,
        mentions: options.mentions,
      })
      .returning();

    // Update entity activity timestamp
    await this.updateEntityActivityTimestamp(options.entityType, options.entityId);

    // Process mentions for notifications
    if (options.mentions && options.mentions.length > 0) {
      await this.notifyMentionedUsers(activity, options.mentions);
    }

    return activity;
  }

  /**
   * Get activity feed for an entity
   */
  async getActivityFeed(
    entityType: EntityType,
    entityId: string,
    options: ActivityFeedOptions = {}
  ): Promise<ActivityWithUser[]> {
    const {
      limit = 50,
      offset = 0,
      activityTypes,
      includeInternal = true,
      includeSystem = true,
      includeDeleted = false,
    } = options;

    const conditions = [
      eq(activityLogs.entityType, entityType),
      eq(activityLogs.entityId, entityId),
    ];

    if (!includeDeleted) {
      conditions.push(isNull(activityLogs.deletedAt));
    }

    if (!includeInternal) {
      conditions.push(eq(activityLogs.isInternal, false));
    }

    if (!includeSystem) {
      conditions.push(eq(activityLogs.isSystem, false));
    }

    if (activityTypes && activityTypes.length > 0) {
      conditions.push(inArray(activityLogs.activityType, activityTypes));
    }

    const activities = await db
      .select()
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return activities.map((row) => ({
      ...row.activity_logs,
      user: row.users
        ? {
            id: row.users.id,
            name: row.users.name,
            avatarUrl: row.users.avatarUrl,
            role: row.users.role,
          }
        : undefined,
    }));
  }

  /**
   * Get activity feed for multiple entities (e.g., all orders for a user)
   */
  async getMultiEntityFeed(
    entityType: EntityType,
    entityIds: string[],
    options: ActivityFeedOptions = {}
  ): Promise<ActivityWithUser[]> {
    const { limit = 50, offset = 0, activityTypes, includeInternal = true } = options;

    const conditions = [
      eq(activityLogs.entityType, entityType),
      inArray(activityLogs.entityId, entityIds),
      isNull(activityLogs.deletedAt),
    ];

    if (!includeInternal) {
      conditions.push(eq(activityLogs.isInternal, false));
    }

    if (activityTypes && activityTypes.length > 0) {
      conditions.push(inArray(activityLogs.activityType, activityTypes));
    }

    const activities = await db
      .select()
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return activities.map((row) => ({
      ...row.activity_logs,
      user: row.users
        ? {
            id: row.users.id,
            name: row.users.name,
            avatarUrl: row.users.avatarUrl,
            role: row.users.role,
          }
        : undefined,
    }));
  }

  /**
   * Add a comment to an entity
   */
  async addComment(
    entityType: EntityType,
    entityId: string,
    userId: string,
    content: string,
    options: {
      contentHtml?: string;
      isInternal?: boolean;
      parentId?: string;
      mentions?: string[];
    } = {}
  ): Promise<ActivityLog> {
    // Parse mentions from content if not provided
    let mentions = options.mentions;
    if (!mentions) {
      mentions = this.parseMentions(content);
    }

    return this.createActivity({
      entityType,
      entityId,
      activityType: "comment",
      userId,
      content,
      contentHtml: options.contentHtml,
      isInternal: options.isInternal,
      parentId: options.parentId,
      mentions,
    });
  }

  /**
   * Log a status change
   */
  async logStatusChange(
    entityType: EntityType,
    entityId: string,
    userId: string | undefined,
    previousStatus: string,
    newStatus: string,
    note?: string
  ): Promise<ActivityLog> {
    return this.createActivity({
      entityType,
      entityId,
      activityType: "status_change",
      userId,
      content: note || `Status changed from "${previousStatus}" to "${newStatus}"`,
      metadata: {
        previousStatus,
        newStatus,
      },
      isSystem: !userId,
    });
  }

  /**
   * Log a field update
   */
  async logFieldUpdate(
    entityType: EntityType,
    entityId: string,
    userId: string,
    fieldName: string,
    previousValue: any,
    newValue: any
  ): Promise<ActivityLog> {
    return this.createActivity({
      entityType,
      entityId,
      activityType: "field_update",
      userId,
      content: `Updated ${fieldName}`,
      metadata: {
        fieldName,
        previousValue,
        newValue,
      },
    });
  }

  /**
   * Log a file upload
   */
  async logFileUpload(
    entityType: EntityType,
    entityId: string,
    userId: string,
    filename: string,
    fileId: string,
    folder?: string
  ): Promise<ActivityLog> {
    return this.createActivity({
      entityType,
      entityId,
      activityType: "file_upload",
      userId,
      content: `Uploaded file: ${filename}`,
      metadata: {
        filename,
        fileId,
        folder,
      },
    });
  }

  /**
   * Log a file download
   */
  async logFileDownload(
    entityType: EntityType,
    entityId: string,
    userId: string,
    filename: string,
    fileId: string
  ): Promise<ActivityLog> {
    return this.createActivity({
      entityType,
      entityId,
      activityType: "file_download",
      userId,
      content: `Downloaded file: ${filename}`,
      metadata: {
        filename,
        fileId,
      },
    });
  }

  /**
   * Log an assignment change
   */
  async logAssignment(
    entityType: EntityType,
    entityId: string,
    userId: string,
    assigneeId: string,
    assigneeName: string,
    role?: string
  ): Promise<ActivityLog> {
    const activity = await this.createActivity({
      entityType,
      entityId,
      activityType: "assignment",
      userId,
      content: `Assigned to ${assigneeName}${role ? ` as ${role}` : ""}`,
      metadata: {
        assigneeId,
        assigneeName,
        role,
      },
    });

    // Notify the assignee
    await notificationService.createNotification({
      userId: assigneeId,
      type: "assignment",
      category: "assignment",
      title: `You've been assigned to ${entityType.replace("_", " ")}`,
      body: `You have been assigned to work on this ${entityType.replace("_", " ")}.`,
      entityType,
      entityId,
      actionUrl: `/${entityType.replace("_", "-")}s/${entityId}`,
      createdByUserId: userId,
    });

    return activity;
  }

  /**
   * Log entity creation
   */
  async logCreation(
    entityType: EntityType,
    entityId: string,
    userId: string,
    entityName?: string
  ): Promise<ActivityLog> {
    return this.createActivity({
      entityType,
      entityId,
      activityType: "created",
      userId,
      content: entityName
        ? `Created ${entityType.replace("_", " ")}: ${entityName}`
        : `Created ${entityType.replace("_", " ")}`,
      isSystem: false,
    });
  }

  /**
   * Log entity archival
   */
  async logArchival(
    entityType: EntityType,
    entityId: string,
    userId: string,
    reason?: string
  ): Promise<ActivityLog> {
    return this.createActivity({
      entityType,
      entityId,
      activityType: "archived",
      userId,
      content: reason
        ? `Archived: ${reason}`
        : `Archived ${entityType.replace("_", " ")}`,
    });
  }

  /**
   * Edit a comment
   */
  async editComment(
    activityId: string,
    userId: string,
    newContent: string,
    newContentHtml?: string
  ): Promise<ActivityLog | null> {
    // Verify the user owns this comment
    const [existing] = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.id, activityId),
          eq(activityLogs.activityType, "comment")
        )
      )
      .limit(1);

    if (!existing || existing.userId !== userId) {
      return null;
    }

    const mentions = this.parseMentions(newContent);

    const [updated] = await db
      .update(activityLogs)
      .set({
        content: newContent,
        contentHtml: newContentHtml,
        mentions,
        editedAt: new Date(),
      })
      .where(eq(activityLogs.id, activityId))
      .returning();

    return updated;
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(
    activityId: string,
    userId: string,
    isAdmin = false
  ): Promise<boolean> {
    // Verify the user owns this comment (or is admin)
    const [existing] = await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.id, activityId),
          eq(activityLogs.activityType, "comment")
        )
      )
      .limit(1);

    if (!existing) {
      return false;
    }

    if (!isAdmin && existing.userId !== userId) {
      return false;
    }

    await db
      .update(activityLogs)
      .set({
        deletedAt: new Date(),
        deletedByUserId: userId,
      })
      .where(eq(activityLogs.id, activityId));

    return true;
  }

  /**
   * Get replies to a comment
   */
  async getReplies(parentId: string): Promise<ActivityWithUser[]> {
    const activities = await db
      .select()
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(
        and(
          eq(activityLogs.parentId, parentId),
          isNull(activityLogs.deletedAt)
        )
      )
      .orderBy(activityLogs.createdAt);

    return activities.map((row) => ({
      ...row.activity_logs,
      user: row.users
        ? {
            id: row.users.id,
            name: row.users.name,
            avatarUrl: row.users.avatarUrl,
            role: row.users.role,
          }
        : undefined,
    }));
  }

  /**
   * Get recent activity for a user across all their entities
   */
  async getUserRecentActivity(
    userId: string,
    limit = 20
  ): Promise<ActivityWithUser[]> {
    const activities = await db
      .select()
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(
        and(
          eq(activityLogs.userId, userId),
          isNull(activityLogs.deletedAt)
        )
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return activities.map((row) => ({
      ...row.activity_logs,
      user: row.users
        ? {
            id: row.users.id,
            name: row.users.name,
            avatarUrl: row.users.avatarUrl,
            role: row.users.role,
          }
        : undefined,
    }));
  }

  /**
   * Get activity count for an entity
   */
  async getActivityCount(
    entityType: EntityType,
    entityId: string,
    includeInternal = true
  ): Promise<number> {
    const conditions = [
      eq(activityLogs.entityType, entityType),
      eq(activityLogs.entityId, entityId),
      isNull(activityLogs.deletedAt),
    ];

    if (!includeInternal) {
      conditions.push(eq(activityLogs.isInternal, false));
    }

    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(activityLogs)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  /**
   * Parse @mentions from content
   */
  private parseMentions(content: string): string[] {
    const mentionRegex = /@\[([^\]]+)\]\(user:([a-zA-Z0-9-]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // The user ID
    }

    return Array.from(new Set(mentions)); // Remove duplicates
  }

  /**
   * Notify mentioned users
   */
  private async notifyMentionedUsers(
    activity: ActivityLog,
    userIds: string[]
  ): Promise<void> {
    for (const userId of userIds) {
      // Don't notify the person who created the activity
      if (userId === activity.userId) continue;

      await notificationService.createNotification({
        userId,
        type: "mention",
        category: "user_generated",
        title: `${activity.userName} mentioned you`,
        body: activity.content?.substring(0, 100),
        priority: "normal",
        entityType: activity.entityType,
        entityId: activity.entityId,
        actionUrl: `/${activity.entityType.replace("_", "-")}s/${activity.entityId}`,
        createdByUserId: activity.userId || undefined,
      });
    }
  }

  /**
   * Update entity's last activity timestamp
   */
  private async updateEntityActivityTimestamp(
    entityType: EntityType,
    entityId: string
  ): Promise<void> {
    const now = new Date();

    switch (entityType) {
      case "order":
        await db
          .update(orders)
          .set({ updatedAt: now })
          .where(eq(orders.id, parseInt(entityId)));
        break;
      case "design_job":
        await db
          .update(designJobs)
          .set({ updatedAt: now })
          .where(eq(designJobs.id, parseInt(entityId)));
        break;
      case "lead":
        await db
          .update(leads)
          .set({
            lastActivityAt: now,
            activityCount: sql`COALESCE(${leads.activityCount}, 0) + 1`,
            updatedAt: now,
          })
          .where(eq(leads.id, parseInt(entityId)));
        break;
      // Add other entity types as needed
    }
  }
}

// Export singleton instance
export const activityLogService = new ActivityLogService();
