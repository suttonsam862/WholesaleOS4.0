import type { Express } from "express";
import { storage } from "../storage";
import { insertManufacturingNoteCategorySchema, type ManufacturingNote } from "@shared/schema";
import { z } from "zod";
import {
  loadUserData,
  requirePermission,
  type AuthenticatedRequest,
} from "./shared/middleware";
import { isAuthenticated } from "./shared/middleware";
import { db } from "../db";
import { orderLineItems } from "@shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Fabric Change", description: "Change in fabric or material", color: "#ef4444", icon: "Scissors", sortOrder: 1 },
  { name: "Alteration", description: "Size or fit adjustments", color: "#f59e0b", icon: "Ruler", sortOrder: 2 },
  { name: "Rush Order", description: "Expedited processing required", color: "#dc2626", icon: "Zap", sortOrder: 3 },
  { name: "Quality Issue", description: "Quality control concerns", color: "#8b5cf6", icon: "AlertTriangle", sortOrder: 4 },
  { name: "Custom Request", description: "Special customer requests", color: "#3b82f6", icon: "MessageSquare", sortOrder: 5 },
];

export async function seedDefaultManufacturingNoteCategories(): Promise<void> {
  try {
    const existingCategories = await storage.getManufacturingNoteCategories();
    
    if (existingCategories.length === 0) {
      console.log("🌱 Seeding default manufacturing note categories...");
      for (const category of DEFAULT_CATEGORIES) {
        await storage.createManufacturingNoteCategory(category);
      }
      console.log("✅ Default manufacturing note categories seeded successfully");
    } else {
      console.log(`✅ Found ${existingCategories.length} manufacturing note categories`);
    }
  } catch (error) {
    console.error("❌ Error seeding manufacturing note categories:", error);
  }
}

export function registerManufacturingNotesRoutes(app: Express): void {
  // GET all manufacturing note categories
  app.get('/api/manufacturing-note-categories', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const categories = await storage.getManufacturingNoteCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching manufacturing note categories:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing note categories" });
    }
  });

  // GET single manufacturing note category
  app.get('/api/manufacturing-note-categories/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getManufacturingNoteCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching manufacturing note category:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing note category" });
    }
  });

  // POST create manufacturing note category (admin only)
  app.post('/api/manufacturing-note-categories', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const validated = insertManufacturingNoteCategorySchema.parse(req.body);
      const category = await storage.createManufacturingNoteCategory(validated);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing note category:", error);
      res.status(500).json({ message: "Failed to create manufacturing note category" });
    }
  });

  // PUT update manufacturing note category (admin only)
  app.put('/api/manufacturing-note-categories/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.updateManufacturingNoteCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error("Error updating manufacturing note category:", error);
      res.status(500).json({ message: "Failed to update manufacturing note category" });
    }
  });

  // DELETE manufacturing note category (soft delete, admin only)
  app.delete('/api/manufacturing-note-categories/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      await storage.deleteManufacturingNoteCategory(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting manufacturing note category:", error);
      res.status(500).json({ message: "Failed to delete manufacturing note category" });
    }
  });

  // PATCH add/update manufacturing notes on order line item
  app.patch('/api/order-line-items/:id/manufacturing-notes', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const lineItemId = parseInt(req.params.id);
      if (isNaN(lineItemId)) {
        return res.status(400).json({ message: "Invalid line item ID" });
      }

      const user = (req as AuthenticatedRequest).user.userData!;
      const { categoryId, note } = req.body;

      if (!categoryId || !note) {
        return res.status(400).json({ message: "categoryId and note are required" });
      }

      // Get the category to include its name
      const category = await storage.getManufacturingNoteCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Get the current line item
      const [lineItem] = await db
        .select()
        .from(orderLineItems)
        .where(eq(orderLineItems.id, lineItemId));

      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }

      // Create new manufacturing note
      const newNote: ManufacturingNote = {
        id: crypto.randomUUID(),
        categoryId: category.id,
        categoryName: category.name,
        note: note,
        createdAt: new Date().toISOString(),
        createdBy: user.id,
        createdByName: user.name || user.email || "Unknown User",
      };

      // Get existing notes or initialize empty array
      const existingNotes: ManufacturingNote[] = (lineItem.manufacturingNotes as ManufacturingNote[]) || [];
      
      // Add new note
      const updatedNotes = [...existingNotes, newNote];

      // Update the line item
      const [updated] = await db
        .update(orderLineItems)
        .set({ 
          manufacturingNotes: updatedNotes,
          updatedAt: new Date() 
        })
        .where(eq(orderLineItems.id, lineItemId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error adding manufacturing note:", error);
      res.status(500).json({ message: "Failed to add manufacturing note" });
    }
  });

  // DELETE a specific manufacturing note from a line item
  app.delete('/api/order-line-items/:id/manufacturing-notes/:noteId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const lineItemId = parseInt(req.params.id);
      const noteId = req.params.noteId;

      if (isNaN(lineItemId)) {
        return res.status(400).json({ message: "Invalid line item ID" });
      }

      // Get the current line item
      const [lineItem] = await db
        .select()
        .from(orderLineItems)
        .where(eq(orderLineItems.id, lineItemId));

      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }

      // Get existing notes
      const existingNotes: ManufacturingNote[] = (lineItem.manufacturingNotes as ManufacturingNote[]) || [];
      
      // Filter out the note to delete
      const updatedNotes = existingNotes.filter(n => n.id !== noteId);

      if (updatedNotes.length === existingNotes.length) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Update the line item
      const [updated] = await db
        .update(orderLineItems)
        .set({ 
          manufacturingNotes: updatedNotes,
          updatedAt: new Date() 
        })
        .where(eq(orderLineItems.id, lineItemId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error deleting manufacturing note:", error);
      res.status(500).json({ message: "Failed to delete manufacturing note" });
    }
  });
}
