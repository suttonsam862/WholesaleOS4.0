/**
 * V6 Activity Log Routes
 * API endpoints for activity feeds, comments, and entity history
 */

import { Router, Response } from "express";
import { isAuthenticated, loadUserData } from "./shared/middleware";
import {
  activityLogService,
  ACTIVITY_TYPES,
  ENTITY_TYPES,
  type ActivityType,
  type EntityType,
} from "../services/activity-log.service";
import { z } from "zod";

const router = Router();

// ============================================================================
// Activity Feed Endpoints
// ============================================================================

/**
 * Get activity feed for an entity
 * GET /api/v6/activity/:entityType/:entityId
 */
router.get(
  "/:entityType/:entityId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;
      const { limit, offset, types, includeInternal, includeSystem } = req.query;

      if (!ENTITY_TYPES.includes(entityType as EntityType)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      const activityTypes = types
        ? (types as string).split(",").filter((t) => ACTIVITY_TYPES.includes(t as ActivityType)) as ActivityType[]
        : undefined;

      const activities = await activityLogService.getActivityFeed(
        entityType as EntityType,
        entityId,
        {
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
          activityTypes,
          includeInternal: includeInternal !== "false",
          includeSystem: includeSystem !== "false",
        }
      );

      res.json({ activities });
    } catch (error: any) {
      console.error("Get activity feed error:", error);
      res.status(500).json({ error: error.message || "Failed to get activity feed" });
    }
  }
);

/**
 * Get activity count for an entity
 * GET /api/v6/activity/:entityType/:entityId/count
 */
router.get(
  "/:entityType/:entityId/count",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;
      const { includeInternal } = req.query;

      if (!ENTITY_TYPES.includes(entityType as EntityType)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      const count = await activityLogService.getActivityCount(
        entityType as EntityType,
        entityId,
        includeInternal !== "false"
      );

      res.json({ count });
    } catch (error: any) {
      console.error("Get activity count error:", error);
      res.status(500).json({ error: error.message || "Failed to get activity count" });
    }
  }
);

/**
 * Get user's recent activity
 * GET /api/v6/activity/user/recent
 */
router.get(
  "/user/recent",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { limit } = req.query;
      const activities = await activityLogService.getUserRecentActivity(
        userId,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ activities });
    } catch (error: any) {
      console.error("Get user activity error:", error);
      res.status(500).json({ error: error.message || "Failed to get user activity" });
    }
  }
);

// ============================================================================
// Comment Endpoints
// ============================================================================

/**
 * Add a comment to an entity
 * POST /api/v6/activity/:entityType/:entityId/comment
 */
router.post(
  "/:entityType/:entityId/comment",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;

      if (!ENTITY_TYPES.includes(entityType as EntityType)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      const schema = z.object({
        content: z.string().min(1, "Comment content is required"),
        contentHtml: z.string().optional(),
        isInternal: z.boolean().optional(),
        parentId: z.string().optional(),
        mentions: z.array(z.string()).optional(),
      });

      const data = schema.parse(req.body);

      const activity = await activityLogService.addComment(
        entityType as EntityType,
        entityId,
        userId,
        data.content,
        {
          contentHtml: data.contentHtml,
          isInternal: data.isInternal,
          parentId: data.parentId,
          mentions: data.mentions,
        }
      );

      res.json({ activity });
    } catch (error: any) {
      console.error("Add comment error:", error);
      res.status(500).json({ error: error.message || "Failed to add comment" });
    }
  }
);

/**
 * Edit a comment
 * PUT /api/v6/activity/comment/:activityId
 */
router.put(
  "/comment/:activityId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const schema = z.object({
        content: z.string().min(1, "Comment content is required"),
        contentHtml: z.string().optional(),
      });

      const data = schema.parse(req.body);

      const activity = await activityLogService.editComment(
        req.params.activityId,
        userId,
        data.content,
        data.contentHtml
      );

      if (!activity) {
        return res.status(403).json({ error: "Cannot edit this comment" });
      }

      res.json({ activity });
    } catch (error: any) {
      console.error("Edit comment error:", error);
      res.status(500).json({ error: error.message || "Failed to edit comment" });
    }
  }
);

/**
 * Delete a comment
 * DELETE /api/v6/activity/comment/:activityId
 */
router.delete(
  "/comment/:activityId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      const userRole = req.user?.userData?.role;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const isAdmin = userRole === "admin";
      const success = await activityLogService.deleteComment(
        req.params.activityId,
        userId,
        isAdmin
      );

      if (!success) {
        return res.status(403).json({ error: "Cannot delete this comment" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete comment error:", error);
      res.status(500).json({ error: error.message || "Failed to delete comment" });
    }
  }
);

/**
 * Get replies to a comment
 * GET /api/v6/activity/comment/:activityId/replies
 */
router.get(
  "/comment/:activityId/replies",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const replies = await activityLogService.getReplies(req.params.activityId);
      res.json({ replies });
    } catch (error: any) {
      console.error("Get replies error:", error);
      res.status(500).json({ error: error.message || "Failed to get replies" });
    }
  }
);

// ============================================================================
// Activity Logging Endpoints (for internal use / webhooks)
// ============================================================================

/**
 * Log a custom activity
 * POST /api/v6/activity/:entityType/:entityId/log
 */
router.post(
  "/:entityType/:entityId/log",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;

      if (!ENTITY_TYPES.includes(entityType as EntityType)) {
        return res.status(400).json({ error: "Invalid entity type" });
      }

      const schema = z.object({
        activityType: z.enum(ACTIVITY_TYPES as unknown as [string, ...string[]]),
        content: z.string().optional(),
        contentHtml: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        isInternal: z.boolean().optional(),
        isSystem: z.boolean().optional(),
      });

      const data = schema.parse(req.body);

      const activity = await activityLogService.createActivity({
        entityType: entityType as EntityType,
        entityId,
        activityType: data.activityType as ActivityType,
        userId,
        content: data.content,
        contentHtml: data.contentHtml,
        metadata: data.metadata,
        isInternal: data.isInternal,
        isSystem: data.isSystem,
      });

      res.json({ activity });
    } catch (error: any) {
      console.error("Log activity error:", error);
      res.status(500).json({ error: error.message || "Failed to log activity" });
    }
  }
);

/**
 * Get available activity types
 * GET /api/v6/activity/types
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
      activityTypes: ACTIVITY_TYPES,
      entityTypes: ENTITY_TYPES,
    });
  }
);

export default router;
