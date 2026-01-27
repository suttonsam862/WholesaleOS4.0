import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { insertProductFamilySchema, insertProductFamilyManufacturerSchema } from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    claims?: { sub: string };
    userData?: { id: string; role: string; email: string; name: string };
  };
}

// Middleware to require authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.claims?.sub) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Middleware to require admin role
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }

  authReq.user!.userData = {
    id: user.id,
    role: user.role,
    email: user.email || '',
    name: user.name,
  };
  next();
}

export function registerProductFamilyRoutes(app: Express): void {
  // ==================== PRODUCT FAMILIES CRUD ====================

  // GET all product families
  app.get('/api/product-families', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const families = await storage.getProductFamilies(includeInactive);
      res.json(families);
    } catch (error) {
      console.error('Error fetching product families:', error);
      res.status(500).json({ error: 'Failed to fetch product families' });
    }
  });

  // GET single product family by ID
  app.get('/api/product-families/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const family = await storage.getProductFamily(id);
      if (!family) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      res.json(family);
    } catch (error) {
      console.error('Error fetching product family:', error);
      res.status(500).json({ error: 'Failed to fetch product family' });
    }
  });

  // GET product family with manufacturer assignments
  app.get('/api/product-families/:id/manufacturers', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const assignments = await storage.getProductFamilyManufacturers(id);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching product family manufacturers:', error);
      res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
  });

  // POST create new product family (admin only)
  app.post('/api/product-families', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validationResult = insertProductFamilySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }

      const family = await storage.createProductFamily(validationResult.data);
      res.status(201).json(family);
    } catch (error) {
      console.error('Error creating product family:', error);
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(400).json({ error: 'Product family code or name already exists' });
      }
      res.status(500).json({ error: 'Failed to create product family' });
    }
  });

  // PUT update product family (admin only)
  app.put('/api/product-families/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const validationResult = insertProductFamilySchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }

      const family = await storage.updateProductFamily(id, validationResult.data);
      if (!family) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      res.json(family);
    } catch (error) {
      console.error('Error updating product family:', error);
      res.status(500).json({ error: 'Failed to update product family' });
    }
  });

  // DELETE product family (admin only - soft delete by setting isActive=false)
  app.delete('/api/product-families/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const family = await storage.updateProductFamily(id, { isActive: false });
      if (!family) {
        return res.status(404).json({ error: 'Product family not found' });
      }

      res.json({ message: 'Product family deactivated', family });
    } catch (error) {
      console.error('Error deleting product family:', error);
      res.status(500).json({ error: 'Failed to delete product family' });
    }
  });

  // ==================== MANUFACTURER ASSIGNMENTS ====================

  // POST assign manufacturer to product family (admin only)
  app.post('/api/product-families/:id/manufacturers', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const productFamilyId = parseInt(req.params.id);
      if (isNaN(productFamilyId)) {
        return res.status(400).json({ error: 'Invalid product family ID' });
      }

      const data = { ...req.body, productFamilyId };
      const validationResult = insertProductFamilyManufacturerSchema.safeParse(data);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }

      const assignment = await storage.createProductFamilyManufacturer(validationResult.data);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error assigning manufacturer:', error);
      res.status(500).json({ error: 'Failed to assign manufacturer' });
    }
  });

  // PUT update manufacturer assignment (admin only)
  app.put('/api/product-family-manufacturers/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      const validationResult = insertProductFamilyManufacturerSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues
        });
      }

      const assignment = await storage.updateProductFamilyManufacturer(id, validationResult.data);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      res.json(assignment);
    } catch (error) {
      console.error('Error updating manufacturer assignment:', error);
      res.status(500).json({ error: 'Failed to update assignment' });
    }
  });

  // DELETE remove manufacturer assignment (admin only)
  app.delete('/api/product-family-manufacturers/:id', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      await storage.deleteProductFamilyManufacturer(id);
      res.json({ message: 'Assignment removed' });
    } catch (error) {
      console.error('Error removing manufacturer assignment:', error);
      res.status(500).json({ error: 'Failed to remove assignment' });
    }
  });

  // ==================== ROUTING ====================

  // GET recommended manufacturer for a product/category
  app.get('/api/routing/recommend', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { productId, categoryId, variantId } = req.query;

      // Determine product family from product, variant, or category
      let productFamilyId: number | null = null;

      if (variantId) {
        const variant = await storage.getProductVariant(parseInt(variantId as string));
        if (variant?.productId) {
          const product = await storage.getProduct(variant.productId);
          if (product?.productFamilyId) {
            productFamilyId = product.productFamilyId;
          } else if (product?.categoryId) {
            const category = await storage.getCategory(product.categoryId);
            if (category?.productFamilyId) {
              productFamilyId = category.productFamilyId;
            }
          }
        }
      } else if (productId) {
        const product = await storage.getProduct(parseInt(productId as string));
        if (product?.productFamilyId) {
          productFamilyId = product.productFamilyId;
        } else if (product?.categoryId) {
          const category = await storage.getCategory(product.categoryId);
          if (category?.productFamilyId) {
            productFamilyId = category.productFamilyId;
          }
        }
      } else if (categoryId) {
        const category = await storage.getCategory(parseInt(categoryId as string));
        if (category?.productFamilyId) {
          productFamilyId = category.productFamilyId;
        }
      }

      if (!productFamilyId) {
        return res.json({
          manufacturer: null,
          reason: 'No product family assigned to this product/category'
        });
      }

      // Get manufacturers for this product family, sorted by priority
      const assignments = await storage.getProductFamilyManufacturers(productFamilyId);
      const activeAssignments = assignments.filter(a => a.isActive);

      if (activeAssignments.length === 0) {
        return res.json({
          manufacturer: null,
          reason: 'No manufacturers assigned to this product family'
        });
      }

      // Return primary manufacturer (priority 1)
      const primary = activeAssignments.find(a => a.priority === 1) || activeAssignments[0];

      res.json({
        manufacturer: primary.manufacturer,
        assignment: primary,
        alternatives: activeAssignments.filter(a => a.id !== primary.id).map(a => a.manufacturer),
      });
    } catch (error) {
      console.error('Error getting routing recommendation:', error);
      res.status(500).json({ error: 'Failed to get routing recommendation' });
    }
  });

  // ==================== SEED DATA ====================

  // POST seed initial product families (admin only, one-time setup)
  app.post('/api/product-families/seed', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
    try {
      const existing = await storage.getProductFamilies(true);
      if (existing.length > 0) {
        return res.status(400).json({
          error: 'Product families already exist. Seed is for initial setup only.',
          existing: existing.length
        });
      }

      const initialFamilies = [
        {
          code: 'CCS',
          name: 'Custom Cut & Sew Sublimation',
          description: 'Fully custom cut and sew garments with all-over sublimation printing',
          decorationMethods: ['sublimation', 'cut_sew'],
          defaultLeadTimeDays: 21,
          defaultMinOrderQty: 12,
          sortOrder: 1,
        },
        {
          code: 'STOCK-SUB',
          name: 'Stock Sublimation',
          description: 'Pre-made blank garments with sublimation decoration',
          decorationMethods: ['sublimation'],
          defaultLeadTimeDays: 10,
          defaultMinOrderQty: 6,
          sortOrder: 2,
        },
        {
          code: 'STOCK-SP',
          name: 'Stock Screen Print',
          description: 'Pre-made blank garments with screen print decoration',
          decorationMethods: ['screen_print'],
          defaultLeadTimeDays: 7,
          defaultMinOrderQty: 12,
          sortOrder: 3,
        },
        {
          code: 'CCS-SP',
          name: 'Custom Cut & Sew Screen Print',
          description: 'Custom cut and sew garments with screen print decoration',
          decorationMethods: ['screen_print', 'cut_sew'],
          defaultLeadTimeDays: 21,
          defaultMinOrderQty: 24,
          sortOrder: 4,
        },
        {
          code: 'EMB',
          name: 'Embroidery',
          description: 'Garments or accessories with embroidered logos/designs',
          decorationMethods: ['embroidery'],
          defaultLeadTimeDays: 10,
          defaultMinOrderQty: 6,
          sortOrder: 5,
        },
        {
          code: 'ACC',
          name: 'Accessories',
          description: 'Bags, caps, socks, and other accessories',
          decorationMethods: ['sublimation', 'embroidery', 'screen_print'],
          defaultLeadTimeDays: 14,
          defaultMinOrderQty: 12,
          sortOrder: 6,
        },
      ];

      const created = [];
      for (const family of initialFamilies) {
        const result = await storage.createProductFamily(family);
        created.push(result);
      }

      res.status(201).json({
        message: 'Product families seeded successfully',
        families: created
      });
    } catch (error) {
      console.error('Error seeding product families:', error);
      res.status(500).json({ error: 'Failed to seed product families' });
    }
  });
}
