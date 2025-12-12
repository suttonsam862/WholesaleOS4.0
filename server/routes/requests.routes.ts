import { Express } from "express";
import { db } from "../db";
import { requests, insertRequestSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  loadUserData,
  type AuthenticatedRequest,
  type UserRole,
  PERMISSIONS
} from "../permissions";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";

function canManageRequests(role: UserRole): boolean {
  return role === "admin" || role === "ops";
}

export function registerRequestsRoutes(app: Express) {
  app.get("/api/requests", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { entityType, entityId, status, type } = req.query;

      const conditions: any[] = [];

      if (entityType) {
        conditions.push(eq(requests.entityType, entityType as any));
      }
      if (entityId) {
        conditions.push(eq(requests.entityId, parseInt(entityId as string)));
      }
      if (status) {
        conditions.push(eq(requests.status, status as any));
      }
      if (type) {
        conditions.push(eq(requests.type, type as any));
      }

      if (!canManageRequests(user.role as UserRole)) {
        conditions.push(eq(requests.submittedBy, user.id));
      }

      const result = await db
        .select()
        .from(requests)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(requests.createdAt));

      res.json(result);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.get("/api/requests/:id", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, id));

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (!canManageRequests(user.role as UserRole) && request.submittedBy !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  // Schema for creating requests - enforces sales role can only create, not manage
  const createRequestSchema = z.object({
    type: z.enum(["issue", "change"]),
    category: z.string().min(1, "Category is required"),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    subject: z.string().min(1, "Subject is required"),
    description: z.string().optional(),
    entityType: z.enum(["order", "lead", "manufacturing"]),
    entityId: z.number().int().positive(),
    entityCode: z.string().optional(),
  });

  app.post("/api/requests", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate request body with Zod
      const validatedData = createRequestSchema.parse({
        ...req.body,
        entityId: typeof req.body.entityId === 'string' 
          ? parseInt(req.body.entityId) 
          : req.body.entityId,
      });

      const [newRequest] = await db
        .insert(requests)
        .values({
          type: validatedData.type,
          category: validatedData.category,
          priority: validatedData.priority,
          subject: validatedData.subject,
          description: validatedData.description,
          entityType: validatedData.entityType,
          entityId: validatedData.entityId,
          entityCode: validatedData.entityCode,
          submittedBy: user.id,
          submittedByName: user.name,
          status: "pending",
        })
        .returning();

      res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!canManageRequests(user.role as UserRole)) {
        return res.status(403).json({ message: "Only admin/ops can update requests" });
      }

      const { status, resolution, assignedTo } = req.body;

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (status) updateData.status = status;
      if (resolution !== undefined) updateData.resolution = resolution;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

      if (status === "resolved") {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = user.id;
      }

      const [updated] = await db
        .update(requests)
        .set(updateData)
        .where(eq(requests.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating request:", error);
      res.status(500).json({ message: "Failed to update request" });
    }
  });

  app.delete("/api/requests/:id", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, id));

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (!canManageRequests(user.role as UserRole) && request.submittedBy !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await db.delete(requests).where(eq(requests.id, id));

      res.json({ message: "Request deleted" });
    } catch (error) {
      console.error("Error deleting request:", error);
      res.status(500).json({ message: "Failed to delete request" });
    }
  });

  app.get("/api/requests/pending/count", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user?.userData;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conditions: any[] = [eq(requests.status, "pending")];

      if (!canManageRequests(user.role as UserRole)) {
        conditions.push(eq(requests.submittedBy, user.id));
      }

      const result = await db
        .select()
        .from(requests)
        .where(and(...conditions));

      res.json({ count: result.length });
    } catch (error) {
      console.error("Error counting pending requests:", error);
      res.status(500).json({ message: "Failed to count pending requests" });
    }
  });
}
