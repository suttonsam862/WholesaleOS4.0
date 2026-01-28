/**
 * V6 Validation Routes
 * API endpoints for advisory data validation
 */

import { Router, Response } from "express";
import { isAuthenticated, loadUserData } from "./shared/middleware";
import { validationService, VALIDATION_CHECK_TYPES } from "../services/validation.service";
import { z } from "zod";

const router = Router();

// ============================================================================
// Validation Endpoints
// ============================================================================

/**
 * Run validation for an order
 * POST /api/v6/validation/order/:orderId
 */
router.post(
  "/order/:orderId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const orderId = parseInt(req.params.orderId);
      const result = await validationService.validateOrder(orderId, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Order validation error:", error);
      res.status(500).json({ error: error.message || "Failed to validate order" });
    }
  }
);

/**
 * Run validation for a design job
 * POST /api/v6/validation/design-job/:jobId
 */
router.post(
  "/design-job/:jobId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const jobId = parseInt(req.params.jobId);
      const result = await validationService.validateDesignJob(jobId, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Design job validation error:", error);
      res.status(500).json({ error: error.message || "Failed to validate design job" });
    }
  }
);

/**
 * Run validation for a line item
 * POST /api/v6/validation/line-item/:lineItemId
 */
router.post(
  "/line-item/:lineItemId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const lineItemId = parseInt(req.params.lineItemId);
      const result = await validationService.validateLineItem(lineItemId, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Line item validation error:", error);
      res.status(500).json({ error: error.message || "Failed to validate line item" });
    }
  }
);

/**
 * Get validation summary for an entity
 * GET /api/v6/validation/:entityType/:entityId/summary
 */
router.get(
  "/:entityType/:entityId/summary",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;
      const summary = await validationService.getValidationSummary(entityType, entityId);

      if (!summary) {
        return res.json({
          summary: null,
          message: "No validation has been run for this entity",
        });
      }

      res.json({ summary });
    } catch (error: any) {
      console.error("Get validation summary error:", error);
      res.status(500).json({ error: error.message || "Failed to get validation summary" });
    }
  }
);

/**
 * Get validation results for an entity
 * GET /api/v6/validation/:entityType/:entityId/results
 */
router.get(
  "/:entityType/:entityId/results",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { entityType, entityId } = req.params;
      const results = await validationService.getValidationResults(entityType, entityId);
      res.json({ results });
    } catch (error: any) {
      console.error("Get validation results error:", error);
      res.status(500).json({ error: error.message || "Failed to get validation results" });
    }
  }
);

/**
 * Acknowledge a validation warning
 * POST /api/v6/validation/acknowledge/:resultId
 */
router.post(
  "/acknowledge/:resultId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { note } = req.body;
      await validationService.acknowledgeWarning(req.params.resultId, userId, note);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Acknowledge warning error:", error);
      res.status(500).json({ error: error.message || "Failed to acknowledge warning" });
    }
  }
);

/**
 * Clear acknowledgment for a validation
 * DELETE /api/v6/validation/acknowledge/:resultId
 */
router.delete(
  "/acknowledge/:resultId",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await validationService.clearAcknowledgment(req.params.resultId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Clear acknowledgment error:", error);
      res.status(500).json({ error: error.message || "Failed to clear acknowledgment" });
    }
  }
);

/**
 * Run validation for multiple orders
 * POST /api/v6/validation/orders/batch
 */
router.post(
  "/orders/batch",
  isAuthenticated,
  loadUserData,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.userData?.id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const schema = z.object({
        orderIds: z.array(z.number()),
      });

      const { orderIds } = schema.parse(req.body);

      const results = await Promise.all(
        orderIds.map((orderId) => validationService.validateOrder(orderId, userId))
      );

      res.json({ results });
    } catch (error: any) {
      console.error("Batch validation error:", error);
      res.status(500).json({ error: error.message || "Failed to run batch validation" });
    }
  }
);

/**
 * Get available validation check types
 * GET /api/v6/validation/check-types
 */
router.get(
  "/check-types",
  isAuthenticated,
  loadUserData,
  (req: any, res: Response) => {
    const userId = req.user?.userData?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.json({
      checkTypes: VALIDATION_CHECK_TYPES,
    });
  }
);

export default router;
