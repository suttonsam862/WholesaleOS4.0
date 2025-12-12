interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
  error?: {
    message: string;
    status?: string;
  };
}

interface AIInteractionRequest {
  actionId: string;
  hubId: string;
  context: {
    selectedItem?: any;
    options?: Record<string, any>;
  };
}

interface AIInteractionResult {
  success: boolean;
  content?: string;
  message?: string;
  error?: string;
}

const ACTION_PROMPTS: Record<string, (context: any) => string> = {
  "client-brief": (ctx) => {
    const org = ctx.selectedItem;
    const options = ctx.options || {};
    const timeWindow = options.timeWindow || "30";
    return `Generate a concise client brief for meeting preparation. 

Client: ${org?.name || "Unknown Organization"}
Location: ${org?.city || "Unknown"}${org?.state ? `, ${org.state}` : ""}
Client Type: ${org?.clientType || "retail"}
Time Window: Last ${timeWindow} days

Include sections:
${options.includeOrders !== false ? "- Recent order activity summary" : ""}
${options.includeNotes !== false ? "- Key notes and preferences" : ""}
${options.includeContacts !== false ? "- Primary contacts and roles" : ""}

Keep the brief professional, actionable, and under 300 words. Focus on preparation tips for an upcoming client meeting.`;
  },

  "explain-numbers": (ctx) => {
    const options = ctx.options || {};
    const period = options.metricPeriod || "month";
    return `Provide a plain-English explanation of sales performance metrics.

Analysis Period: This ${period}
Focus Areas:
${options.focusRevenue !== false ? "- Revenue trends and patterns" : ""}
${options.focusPipeline !== false ? "- Pipeline health indicators" : ""}
${options.focusConversion !== false ? "- Conversion rate insights" : ""}

Generate an easy-to-understand summary that explains what the numbers mean in practical terms. Include:
1. Key highlights (2-3 bullet points)
2. What's working well
3. Areas needing attention
4. Simple recommended actions

Keep the explanation conversational and under 250 words. Avoid jargon.`;
  },

  "quote-from-order": (ctx) => {
    const order = ctx.selectedItem;
    return `Generate a professional quote summary based on order information.

Source Order: ${order?.orderCode || "Unknown"}
Order Name: ${order?.orderName || "Unknown"}
Status: ${order?.status || "Unknown"}

Create a brief summary (under 100 words) describing:
1. What this quote will include
2. Suggested validity period
3. Any special notes or considerations

Format as a professional internal memo.`;
  },
};

async function callGeminiAPI(prompt: string): Promise<AIInteractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY not configured",
      message: "AI features require a Gemini API key. Please add GEMINI_API_KEY to your environment variables.",
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API error:", errorData);
      return {
        success: false,
        error: `API error: ${response.status}`,
        message: errorData.error?.message || "Failed to generate AI content",
      };
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message,
        message: "AI service returned an error",
      };
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return {
        success: false,
        error: "No content generated",
        message: "AI did not return any content",
      };
    }

    return {
      success: true,
      content,
      message: "Content generated successfully",
    };
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to connect to AI service",
    };
  }
}

export async function processAIInteraction(
  request: AIInteractionRequest
): Promise<AIInteractionResult> {
  const { actionId, context } = request;

  const promptGenerator = ACTION_PROMPTS[actionId];

  if (!promptGenerator) {
    return {
      success: false,
      error: "Unknown action",
      message: `No AI prompt configured for action: ${actionId}`,
    };
  }

  const prompt = promptGenerator(context);
  return callGeminiAPI(prompt);
}

export { AIInteractionRequest, AIInteractionResult };
