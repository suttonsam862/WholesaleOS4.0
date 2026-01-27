import type { Express, Request, Response } from "express";
import { processAIInteraction, AIInteractionRequest } from "../services/gemini";
import { isAuthenticated, loadUserData } from "./shared/middleware";

export function registerAIRoutes(app: Express): void {
  // AI interaction endpoint - requires authentication
  app.post("/api/ai/interactions", isAuthenticated, loadUserData, async (req: Request, res: Response) => {
    try {
      const { actionId, hubId, context } = req.body as AIInteractionRequest;

      if (!actionId) {
        return res.status(400).json({
          success: false,
          error: "Missing actionId",
          message: "actionId is required",
        });
      }

      const result = await processAIInteraction({
        actionId,
        hubId: hubId || "",
        context: context || {},
      });

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error("AI interaction error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to process AI interaction",
      });
    }
  });

  // AI status endpoint - requires authentication
  app.get("/api/ai/status", isAuthenticated, (req: Request, res: Response) => {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    res.json({
      available: !!apiKey,
      message: apiKey ? "AI service is configured" : "AI service not configured - missing API key",
    });
  });
}
