import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, filterDataByRole, type AuthenticatedRequest, type UserRole } from "./shared/middleware";
import { insertQuoteSchema, insertQuoteLineItemSchema } from "@shared/schema";
import { z } from "zod";

export function registerQuoteRoutes(app: Express): void {
  // Quotes API
  app.get('/api/quotes', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      const filteredQuotes = filterDataByRole(
        quotes,
        (req as AuthenticatedRequest).user.userData!.role as UserRole,
        (req as AuthenticatedRequest).user.userData!.id,
        'quotes'
      );
      res.json(filteredQuotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteWithLineItems(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Check if user can view this quote
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && quote.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post('/api/quotes', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      console.log("[QUOTE CREATE] Starting quote creation process");
      console.log("[QUOTE CREATE] Request body:", JSON.stringify(req.body, null, 2));
      
      // Separate line items from quote data
      const { lineItems, ...quoteData } = req.body;

      // Convert IDs from strings to numbers, handle empty contactId
      const processedQuoteData = {
        ...quoteData,
        orgId: parseInt(quoteData.orgId),
        contactId: quoteData.contactId ? parseInt(quoteData.contactId) : undefined,
      };

      console.log("[QUOTE CREATE] Validating quote data...");
      const validatedQuote = insertQuoteSchema.parse(processedQuoteData);
      console.log("[QUOTE CREATE] Quote data validated successfully");

      // Sales users can only create quotes for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedQuote.salespersonId = (req as AuthenticatedRequest).user.userData!.id;
        console.log("[QUOTE CREATE] Assigned salesperson ID:", validatedQuote.salespersonId);
      }

      // If line items are provided, validate and create quote with line items
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        console.log("[QUOTE CREATE] Validating", lineItems.length, "line items...");
        const validatedLineItems = lineItems.map((item: any, index: number) => {
          console.log(`[QUOTE CREATE] Validating line item ${index + 1}:`, item);
          return insertQuoteLineItemSchema.parse(item);
        });
        console.log("[QUOTE CREATE] All line items validated successfully");

        console.log("[QUOTE CREATE] Creating quote with line items...");
        const quoteWithLineItems = await storage.createQuoteWithLineItems(
          validatedQuote,
          validatedLineItems
        );
        console.log("[QUOTE CREATE] Quote created successfully with ID:", quoteWithLineItems.id);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'quote',
          quoteWithLineItems.id,
          'created',
          null,
          quoteWithLineItems
        );

        console.log("[QUOTE CREATE] Sending success response");
        res.status(201).json(quoteWithLineItems);
      } else {
        console.log("[QUOTE CREATE] Creating quote without line items...");
        // Create quote without line items
        const quote = await storage.createQuote(validatedQuote);
        console.log("[QUOTE CREATE] Quote created successfully with ID:", quote.id);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'quote',
          quote.id,
          'created',
          null,
          quote
        );

        console.log("[QUOTE CREATE] Sending success response");
        res.status(201).json(quote);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[QUOTE CREATE] Validation failed:", JSON.stringify(error.errors, null, 2));
        console.error("[QUOTE CREATE] Request body was:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("[QUOTE CREATE] Error creating quote:", error);
      console.error("[QUOTE CREATE] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("[QUOTE CREATE] Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        constraint: (error as any)?.constraint
      });
      res.status(500).json({ 
        message: "Failed to create quote",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuoteSchema.partial().parse(req.body);

      const existingQuote = await storage.getQuote(id);
      if (!existingQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Sales users can only update their own quotes
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales' && 
          existingQuote.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedQuote = await storage.updateQuote(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'quote',
        id,
        'updated',
        existingQuote,
        updatedQuote
      );

      res.json(updatedQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingQuote = await storage.getQuote(id);
      if (!existingQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Only allow deletion if quote is in draft status
      if (existingQuote.status !== 'draft') {
        return res.status(400).json({ message: "Can only delete draft quotes" });
      }

      await storage.deleteQuote(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'quote',
        id,
        'deleted',
        existingQuote,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Quote line items API
  app.get('/api/quotes/:id/line-items', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const lineItems = await storage.getQuoteLineItems(quoteId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching quote line items:", error);
      res.status(500).json({ message: "Failed to fetch quote line items" });
    }
  });

  app.post('/api/quotes/:id/line-items', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      // Handle both single item and array of items
      const items = Array.isArray(req.body) ? req.body : [req.body];
      
      // Validate and create all line items
      const createdItems = [];
      for (const item of items) {
        // Validate the item (schema omits quoteId)
        const validatedData = insertQuoteLineItemSchema.parse(item);
        // Inject quoteId after validation
        const lineItemWithQuoteId = {
          ...validatedData,
          quoteId
        };
        const lineItem = await storage.createQuoteLineItem(lineItemWithQuoteId);
        createdItems.push(lineItem);
      }
      
      // Return single item or array based on input
      res.status(201).json(Array.isArray(req.body) ? createdItems : createdItems[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating quote line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in quote line item");
        if (errorObj?.constraint?.includes('variant')) {
          return res.status(400).json({ 
            message: "Invalid variant",
            details: "The selected variant does not exist or has been deleted.",
            field: "variantId"
          });
        }
        if (errorObj?.constraint?.includes('quote')) {
          return res.status(400).json({ 
            message: "Invalid quote",
            details: "The quote does not exist or has been deleted.",
            field: "quoteId"
          });
        }
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "One of the referenced items does not exist.",
        });
      }

      res.status(500).json({ 
        message: "Failed to create quote line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put('/api/quotes/:quoteId/line-items/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuoteLineItemSchema.partial().parse(req.body);

      const updatedLineItem = await storage.updateQuoteLineItem(id, validatedData);
      res.json(updatedLineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating quote line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in quote line item");
        if (errorObj?.constraint?.includes('variant')) {
          return res.status(400).json({ 
            message: "Invalid variant",
            details: "The selected variant does not exist or has been deleted.",
            field: "variantId"
          });
        }
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "One of the referenced items does not exist.",
        });
      }

      res.status(500).json({ 
        message: "Failed to update quote line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/quotes/:quoteId/line-items/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuoteLineItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote line item:", error);
      res.status(500).json({ message: "Failed to delete quote line item" });
    }
  });

  // Business Logic Endpoints
  app.post('/api/calculate-price', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { variantId, quantity } = req.body;

      if (!variantId || !quantity) {
        return res.status(400).json({ message: "Variant ID and quantity are required" });
      }

      // Get the variant to calculate pricing
      const variant = await storage.getProductVariant(parseInt(variantId));
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      // Simple pricing calculation based on MSRP
      const unitPrice = parseFloat(variant.msrp || '0');
      const total = unitPrice * parseInt(quantity);

      res.json({ 
        unitPrice: unitPrice.toFixed(2), 
        quantity: parseInt(quantity),
        total: total.toFixed(2)
      });
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  app.get('/api/lead-assignment', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const { territory } = req.query;

      const suggestedSalesperson = await storage.suggestSalespersonForLead(
        territory as string | undefined
      );

      if (!suggestedSalesperson) {
        return res.json({ message: "No suitable salesperson found", salesperson: null });
      }

      res.json({ salesperson: suggestedSalesperson });
    } catch (error) {
      console.error("Error getting lead assignment suggestion:", error);
      res.status(500).json({ message: "Failed to get assignment suggestion" });
    }
  });
}
