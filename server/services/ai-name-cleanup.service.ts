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

export interface VariantInfo {
  productName?: string;
  variantName?: string;
  variantCode?: string;
  color?: string;
}

/**
 * Clean up a verbose product line item name using AI
 * Converts names like "Rich Habits Crewneck - FLEECE-Crewneck (Fleece)" to "[Organization Name] Crewneck"
 */
export async function cleanupLineItemName(
  originalName: string,
  organizationName: string,
  variantInfo?: VariantInfo
): Promise<string> {
  if (!organizationName) {
    return originalName || "";
  }

  // Build context from variant info if itemName is empty or generic
  let productContext = originalName || "";
  if (variantInfo) {
    const parts = [];
    if (variantInfo.productName) parts.push(variantInfo.productName);
    if (variantInfo.variantName) parts.push(variantInfo.variantName);
    if (variantInfo.variantCode) parts.push(variantInfo.variantCode);
    if (variantInfo.color) parts.push(`(${variantInfo.color})`);
    
    if (parts.length > 0) {
      productContext = productContext 
        ? `${productContext} | Variant: ${parts.join(" - ")}`
        : parts.join(" - ");
    }
  }

  if (!productContext) {
    return `${organizationName} Custom Item`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a product naming assistant for custom athletic apparel. Your job is to clean up verbose product line item names and create simple, customer-friendly names.

Rules:
1. Extract the core product type from anywhere in the input. Look for keywords like:
   - Tops: Crewneck, Hoodie, T-Shirt, Tee, Jersey, Polo, Tank, Tank Top, Quarter Zip, Full Zip, Pullover, Sweatshirt, Long Sleeve
   - Bottoms: Shorts, Pants, Joggers, Sweats, Sweatpants
   - Athletic: Singlet, Compression, Warmup, Jacket, Vest, Rashguard
   - Accessories: Backpack, Bag, Hat, Cap, Beanie, Towel, Socks
2. Replace any brand name (like "Rich Habits") with the provided organization name
3. Keep the format simple: "[Organization Name] [Product Type]"
4. Include color if it appears in parentheses or after a dash, like: "[Organization Name] [Product Type] (Color)"
5. If you can identify a product type, always use it - don't fall back to "Custom Item" unless there's truly no identifiable product
6. Return ONLY the cleaned name, nothing else - no quotes, no explanation

Examples:
- Input: "Rich Habits Crewneck - FLEECE-Crewneck (Fleece)", Org: "Westlake High" → Westlake High Crewneck
- Input: "Rich Habits Hoodie - PREMIUM-Hoodie-Black", Org: "Lincoln Academy" → Lincoln Academy Hoodie
- Input: "JERSEY-001 Football Jersey", Org: "Eagles FC" → Eagles FC Jersey
- Input: "Premium Cotton T-Shirt - COTTON-Tee (White)", Org: "Tech Corp" → Tech Corp T-Shirt
- Input: "Performance Wrestling Singlet - SINGLET-RH-PURP (Purple)", Org: "Warriors" → Warriors Singlet (Purple)
- Input: "Order Prod aC - ORD-VAR-ON (Red)", Org: "Team Alpha" → Team Alpha Item (Red)
- Input: "Test Item | Variant: Performance Hoodie - HOOD-BLK (Black)", Org: "Panthers" → Panthers Hoodie (Black)
- Input: "" with Variant: "Crewneck Sweatshirt - CREW-GRY", Org: "Hawks" → Hawks Crewneck`
        },
        {
          role: "user",
          content: `Clean up this product: "${productContext}"\nOrganization: "${organizationName}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const cleanedName = response.choices[0]?.message?.content?.trim();
    
    // Remove any surrounding quotes the AI might add
    const finalName = cleanedName?.replace(/^["']|["']$/g, '');
    
    if (finalName && finalName.length > 0 && finalName.length < 200) {
      return finalName;
    }
    
    return originalName || `${organizationName} Custom Item`;
  } catch (error) {
    console.error("AI name cleanup error:", error);
    return originalName || `${organizationName} Custom Item`;
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
