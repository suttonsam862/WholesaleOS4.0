/**
 * V6 Notification Routes
 * API endpoints for notification management and preferences
 */

import { Router, Response } from "express";
import { isAuthenticated, loadUserData } from "./shared/middleware";
import {
  notificationService,
  NOTIFICATION_TYPES,
  EMAIL_PREFERENCES,
  type NotificationType,
} from "../services/notification.service";
import { z } from "zod";

const router = Router();

// Valid roles for notification targeting
type ValidRole = "admin" | "sales" | "designer" | "ops" | "manufacturer" | "finance";

// ============================================================================
// Notification Endpoints
// ============================================================================

/**
 * Get notifications for the current user
 * GET /api/v6/notifications
 */
router.get(
  "/",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { limit, offset, unreadOnly, type, entityType, entityId } = req.query;

      const notifications = await notificationService.getUserNotifications(
        userId,
        {
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
          unreadOnly: unreadOnly === "true",
          type: type as NotificationType | undefined,
          entityType: entityType as string | undefined,
          entityId: entityId as string | undefined,
        }
      );

      res.json({ notifications });
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: error.message || "Failed to get notifications" });
    }
  }
);

/**
 * Get unread notification count
 * GET /api/v6/notifications/unread-count
 */
router.get(
  "/unread-count",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: error.message || "Failed to get unread count" });
    }
  }
);

/**
 * Mark a notification as read
 * POST /api/v6/notifications/:id/read
 */
router.post(
  "/:id/read",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await notificationService.markAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: error.message || "Failed to mark as read" });
    }
  }
);

/**
 * Mark all notifications as read
 * POST /api/v6/notifications/mark-all-read
 */
router.post(
  "/mark-all-read",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: error.message || "Failed to mark all as read" });
    }
  }
);

/**
 * Mark a notification as acknowledged (for action-required notifications)
 * POST /api/v6/notifications/:id/acknowledge
 */
router.post(
  "/:id/acknowledge",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await notificationService.markAsAcknowledged(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Acknowledge notification error:", error);
      res.status(500).json({ error: error.message || "Failed to acknowledge notification" });
    }
  }
);

/**
 * Archive a notification
 * POST /api/v6/notifications/:id/archive
 */
router.post(
  "/:id/archive",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await notificationService.archiveNotification(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Archive notification error:", error);
      res.status(500).json({ error: error.message || "Failed to archive notification" });
    }
  }
);

// ============================================================================
// Notification Preferences Endpoints
// ============================================================================

/**
 * Get user notification preferences
 * GET /api/v6/notifications/preferences
 */
router.get(
  "/preferences",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const preferences = await notificationService.getUserPreferences(userId);
      res.json({ preferences });
    } catch (error: any) {
      console.error("Get preferences error:", error);
      res.status(500).json({ error: error.message || "Failed to get preferences" });
    }
  }
);

/**
 * Update a notification preference
 * PUT /api/v6/notifications/preferences/:type
 */
router.put(
  "/preferences/:type",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const schema = z.object({
        inAppEnabled: z.boolean().optional(),
        emailPreference: z.enum(EMAIL_PREFERENCES as unknown as [string, ...string[]]).optional(),
        pushEnabled: z.boolean().optional(),
      });

      const data = schema.parse(req.body);
      const notificationType = req.params.type as NotificationType;

      if (!NOTIFICATION_TYPES.includes(notificationType as any)) {
        return res.status(400).json({ error: "Invalid notification type" });
      }

      const preference = await notificationService.updatePreference(
        userId,
        notificationType,
        data as {
          inAppEnabled?: boolean;
          emailPreference?: "immediate" | "daily" | "weekly" | "off";
          pushEnabled?: boolean;
        }
      );

      res.json({ preference });
    } catch (error: any) {
      console.error("Update preference error:", error);
      res.status(500).json({ error: error.message || "Failed to update preference" });
    }
  }
);

// ============================================================================
// Push Token Endpoints (V7 Readiness)
// ============================================================================

/**
 * Register a push notification token
 * POST /api/v6/notifications/push-token
 */
router.post(
  "/push-token",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const schema = z.object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]),
        deviceName: z.string().optional(),
        appVersion: z.string().optional(),
      });

      const data = schema.parse(req.body);

      await notificationService.registerPushToken(
        userId,
        data.token,
        data.platform,
        data.deviceName,
        data.appVersion
      );

      res.json({ success: true });
    } catch (error: any) {
      console.error("Register push token error:", error);
      res.status(500).json({ error: error.message || "Failed to register push token" });
    }
  }
);

/**
 * Unregister a push notification token
 * DELETE /api/v6/notifications/push-token
 */
router.delete(
  "/push-token",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token required" });
      }

      await notificationService.unregisterPushToken(token);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Unregister push token error:", error);
      res.status(500).json({ error: error.message || "Failed to unregister push token" });
    }
  }
);

// ============================================================================
// Admin Endpoints
// ============================================================================

/**
 * Send a notification to a user (admin only)
 * POST /api/v6/notifications/send
 */
router.post(
  "/send",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      const userRole = req.user?.userData?.role;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const schema = z.object({
        userId: z.string(),
        type: z.enum(NOTIFICATION_TYPES as unknown as [string, ...string[]]),
        category: z.enum(["system", "user_generated", "assignment", "deadline", "alert", "digest"]),
        title: z.string().min(1),
        body: z.string().optional(),
        priority: z.enum(["low", "normal", "urgent"]).optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        actionUrl: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const notification = await notificationService.createNotification({
        ...data,
        type: data.type as NotificationType,
        createdByUserId: userId,
      });

      res.json({ notification });
    } catch (error: any) {
      console.error("Send notification error:", error);
      res.status(500).json({ error: error.message || "Failed to send notification" });
    }
  }
);

/**
 * Send notification to users by role (admin only)
 * POST /api/v6/notifications/send-to-role
 */
router.post(
  "/send-to-role",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      const userRole = req.user?.userData?.role;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check if user is admin
      if (userRole !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const schema = z.object({
        role: z.enum(["admin", "sales", "designer", "ops", "manufacturer", "finance"]),
        type: z.enum(NOTIFICATION_TYPES as unknown as [string, ...string[]]),
        category: z.enum(["system", "user_generated", "assignment", "deadline", "alert", "digest"]),
        title: z.string().min(1),
        body: z.string().optional(),
        priority: z.enum(["low", "normal", "urgent"]).optional(),
        entityType: z.string().optional(),
        entityId: z.string().optional(),
        actionUrl: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const notifications = await notificationService.notifyByRole(data.role as ValidRole, {
        ...data,
        type: data.type as NotificationType,
        createdByUserId: userId,
      });

      res.json({ count: notifications.length });
    } catch (error: any) {
      console.error("Send to role error:", error);
      res.status(500).json({ error: error.message || "Failed to send notifications" });
    }
  }
);

/**
 * Get available notification types
 * GET /api/v6/notifications/types
 */
router.get(
  "/types",
  isAuthenticated,
  loadUserData,
  (req: any, res: Response) => {
    const userId = req.user?.userData?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.json({
      types: NOTIFICATION_TYPES,
      emailPreferences: EMAIL_PREFERENCES,
    });
  }
);

export default router;
