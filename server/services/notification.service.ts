/**
 * V6 Notification Service
 * Handles in-app notifications, email delivery, and push notifications
 */

import { db } from "../db";
import {
  notificationsV6,
  notificationPreferences,
  userPushTokens,
  emailDeliveryLogs,
  users,
  type InsertNotificationV6,
  type NotificationV6,
  type NotificationPreference,
} from "@shared/schema";
import { eq, and, sql, desc, inArray, isNull, lt, gt } from "drizzle-orm";

// Notification types
export const NOTIFICATION_TYPES = [
  "order_status",
  "design_update",
  "assignment",
  "mention",
  "deadline",
  "alert",
  "payment",
  "manufacturing",
  "comment",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Notification categories
export const NOTIFICATION_CATEGORIES = [
  "system",
  "user_generated",
  "assignment",
  "deadline",
  "alert",
  "digest",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

// Priority levels
export const NOTIFICATION_PRIORITIES = ["low", "normal", "urgent"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

// Email preferences
export const EMAIL_PREFERENCES = ["off", "immediate", "daily", "weekly"] as const;
export type EmailPreference = (typeof EMAIL_PREFERENCES)[number];

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body?: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdByUserId?: string;
  expiresInDays?: number;
}

export interface NotificationWithReadStatus extends NotificationV6 {
  isRead: boolean;
  isAcknowledged: boolean;
}

export class NotificationService {
  /**
   * Create a new notification for a user
   */
  async createNotification(
    options: CreateNotificationOptions
  ): Promise<NotificationV6> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (options.expiresInDays || 30));

    const [notification] = await db
      .insert(notificationsV6)
      .values({
        userId: options.userId,
        type: options.type,
        category: options.category,
        title: options.title,
        body: options.body,
        priority: options.priority || "normal",
        entityType: options.entityType,
        entityId: options.entityId,
        actionUrl: options.actionUrl,
        metadata: options.metadata,
        createdByUserId: options.createdByUserId,
        expiresAt,
      })
      .returning();

    // Update unread count
    await this.updateUnreadCount(options.userId);

    // Check user preferences and send email/push if enabled
    await this.processDeliveryChannels(notification);

    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    baseOptions: Omit<CreateNotificationOptions, "userId">
  ): Promise<NotificationV6[]> {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.createNotification({ ...baseOptions, userId })
      )
    );
    return notifications;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
      entityType?: string;
      entityId?: string;
    } = {}
  ): Promise<NotificationWithReadStatus[]> {
    const { limit = 50, offset = 0, unreadOnly, type, entityType, entityId } = options;

    const conditions = [
      eq(notificationsV6.userId, userId),
      isNull(notificationsV6.archivedAt),
      gt(notificationsV6.expiresAt, new Date()),
    ];

    if (unreadOnly) {
      conditions.push(isNull(notificationsV6.readAt));
    }

    if (type) {
      conditions.push(eq(notificationsV6.type, type));
    }

    if (entityType && entityId) {
      conditions.push(eq(notificationsV6.entityType, entityType));
      conditions.push(eq(notificationsV6.entityId, entityId));
    }

    const notifications = await db
      .select()
      .from(notificationsV6)
      .where(and(...conditions))
      .orderBy(desc(notificationsV6.createdAt))
      .limit(limit)
      .offset(offset);

    return notifications.map((n) => ({
      ...n,
      isRead: !!n.readAt,
      isAcknowledged: !!n.acknowledgedAt,
    }));
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(notificationsV6)
      .where(
        and(
          eq(notificationsV6.userId, userId),
          isNull(notificationsV6.readAt),
          isNull(notificationsV6.archivedAt),
          gt(notificationsV6.expiresAt, new Date())
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notificationsV6)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsV6.id, notificationId),
          eq(notificationsV6.userId, userId)
        )
      );

    await this.updateUnreadCount(userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notificationsV6)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notificationsV6.userId, userId),
          isNull(notificationsV6.readAt)
        )
      );

    await this.updateUnreadCount(userId);
  }

  /**
   * Mark notification as acknowledged (for action-required notifications)
   */
  async markAsAcknowledged(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notificationsV6)
      .set({
        acknowledgedAt: new Date(),
        readAt: sql`COALESCE(${notificationsV6.readAt}, NOW())`,
      })
      .where(
        and(
          eq(notificationsV6.id, notificationId),
          eq(notificationsV6.userId, userId)
        )
      );

    await this.updateUnreadCount(userId);
  }

  /**
   * Archive a notification
   */
  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notificationsV6)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(notificationsV6.id, notificationId),
          eq(notificationsV6.userId, userId)
        )
      );

    await this.updateUnreadCount(userId);
  }

  /**
   * Update unread count for a user
   */
  private async updateUnreadCount(userId: string): Promise<void> {
    const count = await this.getUnreadCount(userId);

    await db
      .update(users)
      .set({ unreadNotificationCount: count })
      .where(eq(users.id, userId));
  }

  /**
   * Get or create notification preferences for a user
   */
  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // If no preferences exist, create defaults
    if (prefs.length === 0) {
      const defaults = await this.createDefaultPreferences(userId);
      return defaults;
    }

    return prefs;
  }

  /**
   * Create default notification preferences for a user
   */
  private async createDefaultPreferences(
    userId: string
  ): Promise<NotificationPreference[]> {
    const defaultPrefs: Array<{
      type: NotificationType;
      email: EmailPreference;
      push: boolean;
    }> = [
      { type: "order_status", email: "immediate", push: true },
      { type: "design_update", email: "immediate", push: true },
      { type: "assignment", email: "immediate", push: true },
      { type: "mention", email: "immediate", push: true },
      { type: "deadline", email: "daily", push: true },
      { type: "alert", email: "immediate", push: true },
      { type: "payment", email: "immediate", push: false },
      { type: "manufacturing", email: "daily", push: false },
      { type: "comment", email: "off", push: true },
      { type: "system", email: "weekly", push: false },
    ];

    const insertedPrefs = await db
      .insert(notificationPreferences)
      .values(
        defaultPrefs.map((p) => ({
          userId,
          notificationType: p.type,
          inAppEnabled: true,
          emailPreference: p.email,
          pushEnabled: p.push,
        }))
      )
      .returning();

    return insertedPrefs;
  }

  /**
   * Update notification preference
   */
  async updatePreference(
    userId: string,
    notificationType: NotificationType,
    updates: {
      inAppEnabled?: boolean;
      emailPreference?: EmailPreference;
      pushEnabled?: boolean;
    }
  ): Promise<NotificationPreference> {
    const [pref] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.notificationType, notificationType)
        )
      )
      .returning();

    return pref;
  }

  /**
   * Process notification delivery channels based on user preferences
   */
  private async processDeliveryChannels(
    notification: NotificationV6
  ): Promise<void> {
    // Get user preferences for this notification type
    const [pref] = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, notification.userId),
          eq(notificationPreferences.notificationType, notification.type)
        )
      )
      .limit(1);

    if (!pref) {
      return; // Use defaults, which means no email/push
    }

    // Queue email if preference is "immediate"
    if (pref.emailPreference === "immediate") {
      await this.queueEmailNotification(notification);
    }

    // Send push notification if enabled
    if (pref.pushEnabled) {
      await this.sendPushNotification(notification);
    }
  }

  /**
   * Queue an email notification for delivery
   */
  private async queueEmailNotification(
    notification: NotificationV6
  ): Promise<void> {
    // Get user email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, notification.userId))
      .limit(1);

    if (!user?.email || user.emailBounced) {
      return;
    }

    // Create email delivery log
    await db.insert(emailDeliveryLogs).values({
      notificationId: notification.id,
      userId: notification.userId,
      emailAddress: user.email,
      templateId: `notification_${notification.type}`,
      subject: notification.title,
      status: "queued",
      metadata: {
        notificationType: notification.type,
        priority: notification.priority,
      },
    });

    // TODO: Actually send email via SendGrid
    // This would be processed by a background job
  }

  /**
   * Send push notification to user's devices
   */
  private async sendPushNotification(
    notification: NotificationV6
  ): Promise<void> {
    // Get active push tokens for user
    const tokens = await db
      .select()
      .from(userPushTokens)
      .where(
        and(
          eq(userPushTokens.userId, notification.userId),
          eq(userPushTokens.isActive, true)
        )
      );

    if (tokens.length === 0) {
      return;
    }

    // TODO: Send push notification via FCM/APNs
    // This is V7 mobile readiness prep
    for (const tokenRecord of tokens) {
      try {
        // Would call push notification service here
        await db
          .update(userPushTokens)
          .set({ lastUsedAt: new Date() })
          .where(eq(userPushTokens.id, tokenRecord.id));
      } catch (error) {
        // Increment failed count
        await db
          .update(userPushTokens)
          .set({
            failedCount: sql`${userPushTokens.failedCount} + 1`,
            isActive: sql`${userPushTokens.failedCount} + 1 < 5`,
          })
          .where(eq(userPushTokens.id, tokenRecord.id));
      }
    }
  }

  /**
   * Register a push token for a user
   */
  async registerPushToken(
    userId: string,
    token: string,
    platform: "ios" | "android" | "web",
    deviceName?: string,
    appVersion?: string
  ): Promise<void> {
    await db
      .insert(userPushTokens)
      .values({
        userId,
        token,
        platform,
        deviceName,
        appVersion,
        isActive: true,
        lastUsedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPushTokens.token,
        set: {
          userId,
          platform,
          deviceName,
          appVersion,
          isActive: true,
          failedCount: 0,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Unregister a push token
   */
  async unregisterPushToken(token: string): Promise<void> {
    await db
      .update(userPushTokens)
      .set({ isActive: false })
      .where(eq(userPushTokens.token, token));
  }

  /**
   * Send notification to all users with a specific role
   */
  async notifyByRole(
    role: "admin" | "sales" | "designer" | "ops" | "manufacturer" | "finance",
    options: Omit<CreateNotificationOptions, "userId">
  ): Promise<NotificationV6[]> {
    const roleUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, role), eq(users.isActive, true)));

    const userIds = roleUsers.map((u) => u.id);
    return this.createBulkNotifications(userIds, options);
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const result = await db
      .delete(notificationsV6)
      .where(lt(notificationsV6.expiresAt, new Date()))
      .returning({ id: notificationsV6.id });

    return result.length;
  }

  /**
   * Get notifications for an entity (e.g., all notifications about a specific order)
   */
  async getEntityNotifications(
    entityType: string,
    entityId: string,
    limit = 50
  ): Promise<NotificationV6[]> {
    return db
      .select()
      .from(notificationsV6)
      .where(
        and(
          eq(notificationsV6.entityType, entityType),
          eq(notificationsV6.entityId, entityId)
        )
      )
      .orderBy(desc(notificationsV6.createdAt))
      .limit(limit);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
