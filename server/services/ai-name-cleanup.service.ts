/**
 * AI Name Cleanup Service
 * Uses OpenAI to intelligently clean up verbose product line item names
 */

import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export interface CleanupResult {
  originalName: string;
  cleanedName: string;
}

/**
 * Clean up a verbose product line item name using AI
 * Converts names like "Rich Habits Crewneck - FLEECE-Crewneck (Fleece)" to "[Organization Name] Crewneck"
 */
export async function cleanupLineItemName(
  originalName: string,
  organizationName: string
): Promise<string> {
  if (!originalName || !organizationName) {
    return originalName;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a product naming assistant. Your job is to clean up verbose product line item names and make them customer-friendly.

Rules:
1. Extract the core product type (e.g., "Crewneck", "Hoodie", "T-Shirt", "Jersey", "Shorts", "Jacket", "Polo", "Tank Top", "Quarter Zip", "Full Zip")
2. Replace any brand name (like "Rich Habits") with the provided organization name
3. Keep the format simple: "[Organization Name] [Product Type]"
4. If you can't determine the product type, return the organization name followed by "Custom Item"
5. Return ONLY the cleaned name, nothing else

Examples:
- Input: "Rich Habits Crewneck - FLEECE-Crewneck (Fleece)", Org: "Westlake High" → "Westlake High Crewneck"
- Input: "Rich Habits Hoodie - PREMIUM-Hoodie-Black", Org: "Lincoln Academy" → "Lincoln Academy Hoodie"  
- Input: "JERSEY-001 Football Jersey", Org: "Eagles FC" → "Eagles FC Jersey"
- Input: "Premium Cotton T-Shirt - COTTON-Tee (White)", Org: "Tech Corp" → "Tech Corp T-Shirt"`
        },
        {
          role: "user",
          content: `Clean up this product name: "${originalName}"\nOrganization name: "${organizationName}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const cleanedName = response.choices[0]?.message?.content?.trim();
    
    if (cleanedName && cleanedName.length > 0 && cleanedName.length < 200) {
      return cleanedName;
    }
    
    return originalName;
  } catch (error) {
    console.error("AI name cleanup error:", error);
    return originalName;
  }
}

/**
 * Clean up multiple line item names in batch
 */
export async function cleanupLineItemNames(
  items: Array<{ id: number; itemName: string }>,
  organizationName: string
): Promise<Array<{ id: number; originalName: string; cleanedName: string }>> {
  const results = await Promise.all(
    items.map(async (item) => {
      const cleanedName = await cleanupLineItemName(item.itemName, organizationName);
      return {
        id: item.id,
        originalName: item.itemName,
        cleanedName,
      };
    })
  );

  return results;
}
