import sharp from "sharp";
import { storage } from "../storage";

interface CompositeResult {
  compositeFrontUrl?: string;
  compositeBackUrl?: string;
}

export async function generateCompositeImages(
  projectId: number,
  frontImageUrl?: string,
  backImageUrl?: string
): Promise<CompositeResult> {
  const result: CompositeResult = {};

  const project = await storage.getDesignProject(projectId);
  if (!project?.variantId) {
    return result;
  }

  const variant = await storage.getProductVariant(project.variantId);
  if (!variant) {
    return result;
  }

  if (frontImageUrl && variant.frontTemplateUrl) {
    result.compositeFrontUrl = await compositeDesignOnTemplate(
      variant.frontTemplateUrl,
      frontImageUrl,
      "front"
    );
  }

  if (backImageUrl && variant.backTemplateUrl) {
    result.compositeBackUrl = await compositeDesignOnTemplate(
      variant.backTemplateUrl,
      backImageUrl,
      "back"
    );
  }

  return result;
}

async function compositeDesignOnTemplate(
  templateUrl: string,
  designUrl: string,
  view: "front" | "back"
): Promise<string> {
  try {
    const templateBuffer = await fetchImageAsBuffer(templateUrl);
    const designBuffer = await fetchImageAsBuffer(designUrl);
    
    if (!templateBuffer || !designBuffer) {
      console.warn(`Failed to fetch images for ${view} composite`);
      return designUrl;
    }

    const templateMeta = await sharp(templateBuffer).metadata();
    const templateWidth = templateMeta.width || 800;
    const templateHeight = templateMeta.height || 800;

    const designAreaWidth = Math.round(templateWidth * 0.6);
    const designAreaHeight = Math.round(templateHeight * 0.5);
    const designX = Math.round((templateWidth - designAreaWidth) / 2);
    const designY = Math.round(templateHeight * 0.2);

    const resizedDesign = await sharp(designBuffer)
      .resize(designAreaWidth, designAreaHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();

    const composite = await sharp(templateBuffer)
      .composite([
        {
          input: resizedDesign,
          left: designX,
          top: designY,
          blend: 'over'
        }
      ])
      .png()
      .toBuffer();

    const base64 = composite.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(`Error compositing ${view} image:`, error);
    return designUrl;
  }
}

async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer | null> {
  try {
    if (imageUrl.startsWith('data:image')) {
      const base64Match = imageUrl.match(/base64,(.+)$/);
      if (base64Match) {
        return Buffer.from(base64Match[1], 'base64');
      }
      return null;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error fetching image from ${imageUrl.substring(0, 50)}...:`, error);
    return null;
  }
}
