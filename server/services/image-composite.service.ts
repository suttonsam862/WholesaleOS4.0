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
  const isBase64Design = designUrl.startsWith("data:image");
  
  if (isBase64Design) {
    return designUrl;
  }
  
  return designUrl;
}
