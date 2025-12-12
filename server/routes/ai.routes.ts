import type { Express, Request, Response } from "express";
import { processAIInteraction, AIInteractionRequest } from "../services/gemini";

export function registerAIRoutes(app: Express): void {
  app.post("/api/ai/interactions", async (req: Request, res: Response) => {
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

  app.get("/api/ai/status", (req: Request, res: Response) => {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    res.json({
      available: !!apiKey,
      message: apiKey ? "AI service is configured" : "AI service not configured - missing API key",
    });
  });
}
