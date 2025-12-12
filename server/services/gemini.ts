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
  // Sales Analytics AI Actions
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

  "weekly-report": (ctx) => {
    const options = ctx.options || {};
    return `Generate a weekly sales summary report.

Generate a professional weekly sales report summary that includes:
1. Executive Summary - Key wins and highlights from the week
2. Revenue Overview - Total sales activity
3. Pipeline Status - Active opportunities and their stages
4. Top Performing Items - Best selling products or categories
5. Upcoming Priorities - Focus areas for next week

Keep the report concise, data-driven, and under 400 words. Use bullet points for easy scanning.`;
  },

  // Orders AI Actions
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

  // Organizations AI Actions
  "client-summary": (ctx) => {
    const org = ctx.selectedItem;
    return `Generate a comprehensive client summary for internal use.

Organization: ${org?.name || "Unknown"}
Location: ${org?.city || "Unknown"}${org?.state ? `, ${org.state}` : ""}
Client Type: ${org?.clientType || "Not specified"}
Sports/Industry: ${org?.sports || "Not specified"}
Notes: ${org?.notes || "No notes"}

Create a professional summary that includes:
1. Client Overview - Who they are and what they do
2. Relationship History - How long we've worked together
3. Key Preferences - Important things to remember
4. Communication Notes - Best practices for this client

Keep the summary professional and under 250 words.`;
  },

  // Contacts AI Actions
  "follow-up-message": (ctx) => {
    const contact = ctx.selectedItem;
    const options = ctx.options || {};
    return `Draft a professional follow-up message for a contact.

Contact: ${contact?.name || contact?.firstName || "Unknown"}
Email: ${contact?.email || "Not provided"}
Organization: ${contact?.organizationName || "Unknown"}
Role: ${contact?.role || "Not specified"}

Purpose: ${options.purpose || "General follow-up"}

Generate a friendly, professional follow-up message that:
1. Opens with a personalized greeting
2. References our business relationship
3. States the purpose of reaching out
4. Includes a clear call-to-action
5. Closes professionally

Keep the message concise (under 150 words) and conversational.`;
  },

  // Leads AI Actions
  "lead-summary": (ctx) => {
    const lead = ctx.selectedItem;
    return `Generate a lead summary and assessment.

Lead Name: ${lead?.name || "Unknown"}
Contact: ${lead?.contactName || "Not provided"}
Email: ${lead?.email || "Not provided"}
Phone: ${lead?.phone || "Not provided"}
Status: ${lead?.status || "Unknown"}
Notes: ${lead?.notes || "No notes"}

Create a brief lead assessment that includes:
1. Lead Quality Score (Hot/Warm/Cold with reasoning)
2. Key Opportunity - What they're looking for
3. Next Best Action - Recommended follow-up step
4. Potential Blockers - Concerns or obstacles
5. Talking Points - Key conversation starters

Keep the summary actionable and under 200 words.`;
  },

  // Events AI Actions
  "event-summary": (ctx) => {
    const event = ctx.selectedItem;
    return `Generate a post-event summary report.

Event: ${event?.name || "Unknown Event"}
Date: ${event?.date || "Unknown"}
Location: ${event?.location || "Not specified"}
Type: ${event?.eventType || "Not specified"}

Create a professional post-event summary that includes:
1. Event Overview - What happened and key metrics
2. Highlights - Notable successes or memorable moments
3. Challenges - Issues encountered and how they were handled
4. Lessons Learned - What to do differently next time
5. Recommendations - Action items for future events

Keep the summary concise and under 300 words.`;
  },

  // Design Jobs AI Actions
  "ai-design-starter": (ctx) => {
    const options = ctx.options || {};
    const selectedCategory = ctx.selectedItem;
    const previousDesigns = options.previousDesigns || [];
    const designStyle = options.designStyle || "modern";
    const colorScheme = options.colorScheme || [];
    const textToInclude = options.textToInclude || "";
    const orgBrandColors = options.orgBrandColors || [];
    
    const previousDesignsContext = previousDesigns.length > 0 
      ? `\n\nPrevious successful designs for this product type (use as inspiration):\n${previousDesigns.slice(0, 10).map((d: any, i: number) => 
          `${i + 1}. ${d.title || d.brief || 'Design'}: ${d.description || d.requirements || 'No description'}`
        ).join('\n')}`
      : '';
    
    const colorContext = colorScheme.length > 0 
      ? `\nPreferred Colors: ${colorScheme.join(', ')}`
      : orgBrandColors.length > 0 
        ? `\nBrand Colors Available: ${orgBrandColors.join(', ')}`
        : '';

    return `You are a professional apparel designer creating design concepts for custom merchandise.

Product Type: ${selectedCategory?.name || 'Apparel'}
Design Style: ${designStyle}${colorContext}${textToInclude ? `\nText to Include: "${textToInclude}"` : ''}
${previousDesignsContext}

Generate 3 unique design concepts for this ${selectedCategory?.name || 'product'}. For each concept provide:

**Concept 1: [Creative Name]**
- Theme: Brief thematic description
- Visual Elements: Key graphic elements, patterns, or imagery
- Typography: Font style suggestions if text is included
- Color Palette: 3-4 specific colors (include hex codes if possible)
- Placement: Where on the garment the design should go
- Style Notes: Why this matches the ${designStyle} aesthetic

**Concept 2: [Creative Name]**
- Theme: Brief thematic description
- Visual Elements: Key graphic elements, patterns, or imagery
- Typography: Font style suggestions if text is included
- Color Palette: 3-4 specific colors (include hex codes if possible)
- Placement: Where on the garment the design should go
- Style Notes: Why this matches the ${designStyle} aesthetic

**Concept 3: [Creative Name]**
- Theme: Brief thematic description
- Visual Elements: Key graphic elements, patterns, or imagery
- Typography: Font style suggestions if text is included
- Color Palette: 3-4 specific colors (include hex codes if possible)
- Placement: Where on the garment the design should go
- Style Notes: Why this matches the ${designStyle} aesthetic

**Recommended Concept:** State which concept you recommend and why.

**Design Brief Summary:** Write a 2-3 sentence professional design brief that a designer could use to start working.

Keep suggestions practical for screen printing or embroidery. Be specific and actionable.`;
  },

  // Quotes AI Actions
  "quote-followup": (ctx) => {
    const quote = ctx.selectedItem;
    return `Draft a follow-up message about a quote.

Quote: ${quote?.quoteNumber || "Unknown"}
Client: ${quote?.organizationName || "Unknown"}
Amount: ${quote?.total ? `$${quote.total}` : "Not specified"}
Status: ${quote?.status || "Unknown"}
Sent Date: ${quote?.createdAt || "Unknown"}

Create a professional follow-up message that:
1. References the specific quote
2. Reminds them of the value proposition
3. Addresses common objections
4. Creates urgency without being pushy
5. Offers to answer questions or make adjustments

Keep the message friendly, professional, and under 150 words.`;
  },
};

async function callGeminiAPI(prompt: string): Promise<AIInteractionResult> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: "GOOGLE_API_KEY not configured",
      message: "AI features require a Google API key. Please add GOOGLE_API_KEY to your secrets.",
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
