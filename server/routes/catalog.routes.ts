import type { Express } from "express";
import { storage } from "../storage";
import { 
  insertCategorySchema, 
  insertProductSchema, 
  insertProductVariantSchema,
  productVariants,
  orderLineItems,
  products
} from "@shared/schema";
import { z } from "zod";
import { 
  loadUserData, 
  requirePermission, 
  type AuthenticatedRequest
} from "./shared/middleware";
import { isAuthenticated } from "./shared/middleware";
import { stripFinancialData } from "./shared/utils";
import { db } from "../db";
import { eq } from "drizzle-orm";

export function registerCatalogRoutes(app: Express): void {
  // ============================================================
  // CATEGORIES ROUTES
  // ============================================================

  // Get all categories
  app.get('/api/categories', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get single category by ID
  app.get('/api/categories/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Create new category
  app.post('/api/categories', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'category',
        category.id,
        'created',
        null,
        category
      );

      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update category
  app.put('/api/categories/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);

      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const updatedCategory = await storage.updateCategory(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'category',
        id,
        'updated',
        existingCategory,
        updatedCategory
      );

      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete category
  app.delete('/api/categories/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const force = req.query.force === 'true';
      const reassignTo = req.query.reassignTo ? parseInt(req.query.reassignTo as string) : null;

      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check for products using this category
      const productsUsingCategory = await db
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(eq(products.categoryId, id));

      if (productsUsingCategory.length > 0) {
        if (force && reassignTo) {
          // Verify the target category exists
          const targetCategory = await storage.getCategory(reassignTo);
          if (!targetCategory) {
            return res.status(400).json({ 
              message: "Target category for reassignment not found",
              error: "invalid_reassign_target"
            });
          }
          // Reassign all products to the new category
          await db.update(products)
            .set({ categoryId: reassignTo })
            .where(eq(products.categoryId, id));
        } else if (force) {
          // Force delete - archive the products instead
          await db.update(products)
            .set({ archived: true, archivedAt: new Date() })
            .where(eq(products.categoryId, id));
        } else {
          return res.status(400).json({ 
            message: `Cannot delete category. ${productsUsingCategory.length} product(s) are using this category.`,
            error: "category_in_use",
            productCount: productsUsingCategory.length,
            products: productsUsingCategory.slice(0, 5), // Show first 5
            hint: "Use ?force=true to archive products, or ?force=true&reassignTo=<categoryId> to reassign them"
          });
        }
      }

      await storage.deleteCategory(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'category',
        id,
        'deleted',
        existingCategory,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // ============================================================
  // PRODUCTS ROUTES
  // ============================================================

  // Get all products
  app.get('/api/products', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product by ID
  app.get('/api/products/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create new product
  app.post('/api/products', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        product.id,
        'created',
        null,
        product
      );

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.put('/api/products/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);

      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        id,
        'updated',
        existingProduct,
        updatedProduct
      );

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete('/api/products/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Check if product is used in any orders
      if (!force) {
        const usageCheck = await db.select()
          .from(orderLineItems)
          .innerJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .where(eq(productVariants.productId, productId))
          .limit(1);

        if (usageCheck.length > 0) {
          return res.status(400).json({ 
            error: "Product is used in existing orders. Cannot delete." 
          });
        }
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update product images
  app.put('/api/products/:id/images', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { primaryImageUrl, additionalImages } = req.body;

      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, {
        primaryImageUrl: primaryImageUrl || null,
        additionalImages: additionalImages || null,
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product images:", error);
      res.status(500).json({ message: "Failed to update product images" });
    }
  });

  // ============================================================
  // CATALOG ENDPOINTS (products with categories)
  // ============================================================

  // Get all catalog products (products with categories)
  app.get('/api/catalog', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const productsWithCategories = await storage.getCatalogProducts();
      res.json(productsWithCategories);
    } catch (error) {
      console.error("Error fetching catalog products:", error);
      res.status(500).json({ message: "Failed to fetch catalog products" });
    }
  });

  // Get single catalog product (product with category)
  app.get('/api/catalog/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getCatalogProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching catalog product:", error);
      res.status(500).json({ message: "Failed to fetch catalog product" });
    }
  });

  // Create catalog product (with category)
  app.post('/api/catalog', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      console.log("=== PRODUCT CREATION DEBUG START ===");
      console.log("Request headers:", JSON.stringify(req.headers, null, 2));
      console.log("Raw request body received:", JSON.stringify(req.body, null, 2));
      console.log("Request body type:", typeof req.body);
      console.log("Request body keys:", Object.keys(req.body || {}));

      // Ensure the request body exists and has the required fields
      if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        console.error("Invalid or empty request body:", req.body);
        return res.status(400).json({ 
          message: "Request body must be a valid JSON object with data",
          receivedBody: req.body,
          bodyType: typeof req.body,
          bodyKeys: Object.keys(req.body || {})
        });
      }

      // Convert string categoryId to number for validation
      const requestData = { ...req.body };
      console.log("Before processing:", JSON.stringify(requestData, null, 2));

      if (requestData.categoryId) {
        if (typeof requestData.categoryId === 'string') {
          requestData.categoryId = parseInt(requestData.categoryId, 10);
        }
      }
      if (requestData.minOrderQty) {
        if (typeof requestData.minOrderQty === 'string') {
          requestData.minOrderQty = parseInt(requestData.minOrderQty, 10);
        }
      }

      console.log("After processing:", JSON.stringify(requestData, null, 2));
      console.log("About to validate with schema...");

      const validatedData = insertProductSchema.parse(requestData);
      console.log("Schema validation passed! Validated data:", JSON.stringify(validatedData, null, 2));

      const product = await storage.createProduct(validatedData);

      // Get product with category to return
      const productWithCategory = await storage.getCatalogProduct(product.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        product.id,
        'created',
        null,
        product
      );

      console.log("Product created successfully:", JSON.stringify(productWithCategory, null, 2));
      console.log("=== PRODUCT CREATION DEBUG END ===");
      res.status(201).json(productWithCategory);
    } catch (error) {
      console.log("=== PRODUCT CREATION ERROR ===");
      if (error instanceof z.ZodError) {
        console.error("Validation failed for product creation:");
        console.error("- Validation errors:", JSON.stringify(error.errors, null, 2));
        console.error("- Original request body:", JSON.stringify(req.body, null, 2));
        console.error("- Request headers:", JSON.stringify(req.headers, null, 2));
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          debug: {
            originalBody: req.body,
            bodyType: typeof req.body,
            bodyKeys: Object.keys(req.body || {})
          }
        });
      }
      console.error("Error creating catalog product:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error code:", (error as any)?.code);
      console.log("=== PRODUCT CREATION ERROR END ===");

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505') {
        console.error("Unique constraint violation: SKU already exists");
        return res.status(409).json({ 
          message: "Product SKU already exists",
          details: "A product with this SKU already exists. Please use a unique SKU.",
          field: "sku"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid category",
          details: "The category ID does not exist. Please select a valid category.",
          field: "categoryId"
        });
      }

      res.status(500).json({ 
        message: "Failed to create catalog product",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update catalog product
  app.put('/api/catalog/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);

      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, validatedData);

      // Get product with category to return
      const productWithCategory = await storage.getCatalogProduct(updatedProduct.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        id,
        'updated',
        existingProduct,
        updatedProduct
      );

      res.json(productWithCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating catalog product:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505') {
        console.error("Unique constraint violation: SKU already exists");
        return res.status(409).json({ 
          message: "Product SKU already exists",
          details: "A product with this SKU already exists. Please use a unique SKU.",
          field: "sku"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid category",
          details: "The category ID does not exist. Please select a valid category.",
          field: "categoryId"
        });
      }

      res.status(500).json({ 
        message: "Failed to update catalog product",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete catalog product
  app.delete('/api/catalog/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Check if product is used in any orders
      if (!force) {
        const usageCheck = await db.select()
          .from(orderLineItems)
          .innerJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .where(eq(productVariants.productId, productId))
          .limit(1);

        if (usageCheck.length > 0) {
          return res.status(400).json({ 
            error: "Product is used in existing orders. Cannot delete." 
          });
        }
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================
  // PRODUCT VARIANTS ROUTES
  // ============================================================

  // Get variants for a specific product
  app.get('/api/products/:productId/variants', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const productId = parseInt(req.params.productId);
      const variants = await storage.getProductVariants(productId);
      
      // Strip financial data for manufacturer role
      const filteredVariants = stripFinancialData(variants, user.role);
      res.json(filteredVariants);
    } catch (error) {
      console.error("Error fetching product variants:", error);
      res.status(500).json({ message: "Failed to fetch product variants" });
    }
  });

  // Get all variants
  app.get('/api/variants', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const variants = await storage.getProductVariants();
      
      // Strip financial data for manufacturer role
      const filteredVariants = stripFinancialData(variants, user.role);
      res.json(filteredVariants);
    } catch (error) {
      console.error("Error fetching variants:", error);
      res.status(500).json({ message: "Failed to fetch variants" });
    }
  });

  // Alternative endpoint for frontend compatibility
  app.get('/api/product-variants', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const variants = await storage.getProductVariants();
      
      // Strip financial data for manufacturer role
      const filteredVariants = stripFinancialData(variants, user.role);
      res.json(filteredVariants);
    } catch (error) {
      console.error("Error fetching product variants:", error);
      res.status(500).json({ message: "Failed to fetch product variants" });
    }
  });

  // Get single variant by ID
  app.get('/api/variants/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const variantId = parseInt(req.params.id);
      if (isNaN(variantId)) {
        return res.status(400).json({ message: "Invalid variant ID" });
      }
      
      const variant = await storage.getProductVariant(variantId);
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }
      
      // Strip financial data for manufacturer role
      const [filteredVariant] = stripFinancialData([variant], user.role);
      res.json(filteredVariant);
    } catch (error) {
      console.error("Error fetching variant:", error);
      res.status(500).json({ message: "Failed to fetch variant" });
    }
  });

  // Create new variant
  app.post('/api/variants', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      console.log('=== VARIANT CREATION START ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', (req as AuthenticatedRequest).user.userData?.id);

      const validatedData = insertProductVariantSchema.parse(req.body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      // Validate that the product exists before creating variant
      if (validatedData.productId) {
        const product = await storage.getProduct(validatedData.productId);
        if (!product) {
          console.error(`Product not found: ${validatedData.productId}`);
          return res.status(400).json({ 
            message: "Invalid product ID", 
            details: `Product with ID ${validatedData.productId} does not exist` 
          });
        }
        console.log(`Product validated: ${product.name} (${product.id})`);
      }

      const variant = await storage.createProductVariant(validatedData);
      console.log('Variant created successfully:', variant.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'variant',
        variant.id,
        'created',
        null,
        variant
      );

      console.log('=== VARIANT CREATION SUCCESS ===');
      res.status(201).json(variant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }

      console.error("=== VARIANT CREATION ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Request body:", JSON.stringify(req.body, null, 2));

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505' || errorObj?.constraint?.includes('variant_code')) {
        console.error("Unique constraint violation: variant code already exists");
        return res.status(409).json({ 
          message: "Variant code already exists",
          details: "A variant with this code already exists. Please use a unique variant code.",
          field: "variantCode"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "The product ID does not exist or has been deleted.",
          field: "productId"
        });
      }

      // Database connection errors
      if (errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ETIMEDOUT') {
        console.error("Database connection error");
        return res.status(503).json({ 
          message: "Database connection error",
          details: "Unable to connect to the database. Please try again.",
          retry: true
        });
      }

      res.status(500).json({ 
        message: "Failed to create variant",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update variant
  app.put('/api/variants/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('=== VARIANT UPDATE START ===');
      console.log('Variant ID:', id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', (req as AuthenticatedRequest).user.userData?.id);

      const validatedData = insertProductVariantSchema.partial().parse(req.body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      const existingVariant = await storage.getProductVariant(id);
      if (!existingVariant) {
        console.error(`Variant not found: ${id}`);
        return res.status(404).json({ message: "Product variant not found" });
      }
      console.log('Existing variant found:', existingVariant.variantCode);

      // Validate that the product exists if productId is being changed
      if (validatedData.productId && validatedData.productId !== existingVariant.productId) {
        const product = await storage.getProduct(validatedData.productId);
        if (!product) {
          console.error(`Product not found: ${validatedData.productId}`);
          return res.status(400).json({ 
            message: "Invalid product ID", 
            details: `Product with ID ${validatedData.productId} does not exist` 
          });
        }
        console.log(`New product validated: ${product.name} (${product.id})`);
      }

      const updatedVariant = await storage.updateProductVariant(id, validatedData);
      console.log('Variant updated successfully:', updatedVariant.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'variant',
        id,
        'updated',
        existingVariant,
        updatedVariant
      );

      console.log('=== VARIANT UPDATE SUCCESS ===');
      res.json(updatedVariant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }

      console.error("=== VARIANT UPDATE ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505' || errorObj?.constraint?.includes('variant_code')) {
        console.error("Unique constraint violation: variant code already exists");
        return res.status(409).json({ 
          message: "Variant code already exists",
          details: "A variant with this code already exists. Please use a unique variant code.",
          field: "variantCode"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "The product ID does not exist or has been deleted.",
          field: "productId"
        });
      }

      // Database connection errors
      if (errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ETIMEDOUT') {
        console.error("Database connection error");
        return res.status(503).json({ 
          message: "Database connection error",
          details: "Unable to connect to the database. Please try again.",
          retry: true
        });
      }

      res.status(500).json({ 
        message: "Failed to update variant",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete variant
  app.delete('/api/variants/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Check if variant is used in any orders
      if (!force) {
        const usageCheck = await db.select()
          .from(orderLineItems)
          .where(eq(orderLineItems.variantId, variantId))
          .limit(1);

        if (usageCheck.length > 0) {
          return res.status(400).json({ 
            error: "Variant is used in existing orders. Cannot delete." 
          });
        }
      }

      // Delete the variant
      await db.delete(productVariants).where(eq(productVariants.id, variantId));

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'variant',
        variantId,
        'deleted',
        null,
        null
      );

      console.log('=== VARIANT DELETION SUCCESS ===');
      res.status(204).send();
    } catch (error) {
      console.error("=== VARIANT DELETION ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

      res.status(500).json({ 
        message: "Failed to delete variant",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================
  // DESIGN ARCHIVE ROUTES
  // ============================================================

  // Get design archive for a specific variant (all order line items with images for this variant)
  app.get('/api/variants/:variantId/design-archive', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      
      // Verify variant exists
      const variant = await db.select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId))
        .limit(1);
      
      if (variant.length === 0) {
        return res.status(404).json({ message: "Variant not found" });
      }

      // Get all order line items for this variant that have an image
      const lineItemsWithDesigns = await db.select({
        id: orderLineItems.id,
        orderId: orderLineItems.orderId,
        imageUrl: orderLineItems.imageUrl,
        itemName: orderLineItems.itemName,
        colorNotes: orderLineItems.colorNotes,
        createdAt: orderLineItems.createdAt,
      })
        .from(orderLineItems)
        .where(eq(orderLineItems.variantId, variantId))
        .orderBy(orderLineItems.createdAt);

      // Filter to only include items with images
      const designArchive = lineItemsWithDesigns.filter(item => item.imageUrl && item.imageUrl.trim() !== '');

      res.json({
        variantId,
        variant: variant[0],
        designs: designArchive,
        totalDesigns: designArchive.length
      });
    } catch (error) {
      console.error("Error fetching design archive:", error);
      res.status(500).json({ 
        message: "Failed to fetch design archive",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ============================================================
  // ARCHIVE/UNARCHIVE ROUTES
  // ============================================================

  // Archive category
  app.put('/api/categories/:id/archive', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const category = await storage.archiveCategory(id, userId);

      await storage.logActivity(
        userId,
        'category',
        id,
        'archived',
        null,
        category
      );

      res.json(category);
    } catch (error) {
      console.error("Error archiving category:", error);
      res.status(500).json({ message: "Failed to archive category" });
    }
  });

  // Unarchive category
  app.put('/api/categories/:id/unarchive', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const category = await storage.unarchiveCategory(id);

      await storage.logActivity(
        userId,
        'category',
        id,
        'unarchived',
        null,
        category
      );

      res.json(category);
    } catch (error) {
      console.error("Error unarchiving category:", error);
      res.status(500).json({ message: "Failed to unarchive category" });
    }
  });

  // Get archived categories
  app.get('/api/categories/archived', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const categories = await storage.getArchivedCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching archived categories:", error);
      res.status(500).json({ message: "Failed to fetch archived categories" });
    }
  });

  // Archive product
  app.put('/api/products/:id/archive', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const product = await storage.archiveProduct(id, userId);

      await storage.logActivity(
        userId,
        'product',
        id,
        'archived',
        null,
        product
      );

      res.json(product);
    } catch (error) {
      console.error("Error archiving product:", error);
      res.status(500).json({ message: "Failed to archive product" });
    }
  });

  // Unarchive product
  app.put('/api/products/:id/unarchive', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const product = await storage.unarchiveProduct(id);

      await storage.logActivity(
        userId,
        'product',
        id,
        'unarchived',
        null,
        product
      );

      res.json(product);
    } catch (error) {
      console.error("Error unarchiving product:", error);
      res.status(500).json({ message: "Failed to unarchive product" });
    }
  });

  // Get archived products
  app.get('/api/products/archived', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const products = await storage.getArchivedProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching archived products:", error);
      res.status(500).json({ message: "Failed to fetch archived products" });
    }
  });

  // Archive variant
  app.put('/api/variants/:id/archive', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const variant = await storage.archiveProductVariant(id, userId);

      await storage.logActivity(
        userId,
        'variant',
        id,
        'archived',
        null,
        variant
      );

      res.json(variant);
    } catch (error) {
      console.error("Error archiving variant:", error);
      res.status(500).json({ message: "Failed to archive variant" });
    }
  });

  // Unarchive variant
  app.put('/api/variants/:id/unarchive', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const variant = await storage.unarchiveProductVariant(id);

      await storage.logActivity(
        userId,
        'variant',
        id,
        'unarchived',
        null,
        variant
      );

      res.json(variant);
    } catch (error) {
      console.error("Error unarchiving variant:", error);
      res.status(500).json({ message: "Failed to unarchive variant" });
    }
  });

  // Get archived variants
  app.get('/api/variants/archived', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const variants = await storage.getArchivedProductVariants();
      res.json(variants);
    } catch (error) {
      console.error("Error fetching archived variants:", error);
      res.status(500).json({ message: "Failed to fetch archived variants" });
    }
  });
}
