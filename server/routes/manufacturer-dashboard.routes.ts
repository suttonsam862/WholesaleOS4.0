import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { db } from "../db";
import {
  manufacturerJobs,
  orders,
  organizations,
  orderLineItems,
} from "@shared/schema";
import { eq, and, sql, gte, desc, count, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  MANUFACTURER_JOB_STATUSES,
  MANUFACTURER_JOB_STATUS_LABELS,
  type ManufacturerJobStatus,
  type ManufacturerFunnelStatus
} from "@shared/constants";

// Map from simplified 6-status to the fine-grained 15-status values
const SIMPLIFIED_TO_FUNNEL_STATUS: Record<ManufacturerJobStatus, ManufacturerFunnelStatus[]> = {
  new: ['intake_pending'],
  accepted: ['specs_lock_review', 'specs_locked', 'materials_reserved'],
  in_production: ['samples_in_progress', 'samples_awaiting_approval', 'samples_approved', 'samples_revise', 'bulk_cutting', 'bulk_print_emb_sublim', 'bulk_stitching'],
  qc: ['bulk_qc'],
  ready_to_ship: ['packing_complete'],
  shipped: ['handed_to_carrier', 'delivered_confirmed'],
};

// Map from fine-grained status to simplified status
const FUNNEL_TO_SIMPLIFIED_STATUS: Record<string, ManufacturerJobStatus> = {
  intake_pending: 'new',
  specs_lock_review: 'accepted',
  specs_locked: 'accepted',
  materials_reserved: 'accepted',
  samples_in_progress: 'in_production',
  samples_awaiting_approval: 'in_production',
  samples_approved: 'in_production',
  samples_revise: 'in_production',
  bulk_cutting: 'in_production',
  bulk_print_emb_sublim: 'in_production',
  bulk_stitching: 'in_production',
  bulk_qc: 'qc',
  packing_complete: 'ready_to_ship',
  handed_to_carrier: 'shipped',
  delivered_confirmed: 'shipped',
};

// Get the first funnel status for a simplified status (for status changes)
const getFirstFunnelStatus = (simplifiedStatus: ManufacturerJobStatus): ManufacturerFunnelStatus => {
  const mapping: Record<ManufacturerJobStatus, ManufacturerFunnelStatus> = {
    new: 'intake_pending',
    accepted: 'specs_lock_review',
    in_production: 'bulk_cutting',
    qc: 'bulk_qc',
    ready_to_ship: 'packing_complete',
    shipped: 'handed_to_carrier',
  };
  return mapping[simplifiedStatus];
};

interface AuthenticatedRequest extends Request {
  user?: {
    claims?: { sub: string };
    userData?: { id: string; role: string; email: string; name: string; manufacturerId?: number };
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

// Middleware to load user data and check manufacturer role
async function loadManufacturerUser(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  // Get manufacturer association for this user
  const associations = await storage.getUserManufacturerAssociations(userId);
  const activeAssociation = associations.find(a => a.isActive);

  authReq.user!.userData = {
    id: user.id,
    role: user.role,
    email: user.email || '',
    name: user.name,
    manufacturerId: activeAssociation?.manufacturerId,
  };

  next();
}

// Status change schema
const statusChangeSchema = z.object({
  status: z.enum(MANUFACTURER_JOB_STATUSES as unknown as [string, ...string[]]),
  notes: z.string().optional(),
});

export function registerManufacturerDashboardRoutes(app: Express): void {

  // GET dashboard stats
  app.get('/api/manufacturer-dashboard/stats', isAuthenticated, loadManufacturerUser, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!.userData!;

      // Get counts for each simplified status category
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Build base conditions
      const conditions: any[] = [];
      if (user.role === 'manufacturer' && user.manufacturerId) {
        conditions.push(eq(manufacturerJobs.manufacturerId, user.manufacturerId));
      }

      // "New" status jobs
      const newStatuses = SIMPLIFIED_TO_FUNNEL_STATUS.new;
      const newConditions = [...conditions, inArray(manufacturerJobs.manufacturerStatus, newStatuses)];
      const [newJobsResult] = await db
        .select({ count: count() })
        .from(manufacturerJobs)
        .where(newConditions.length > 0 ? and(...newConditions) : undefined);

      // "In Progress" status jobs (accepted + in_production + qc)
      const inProgressStatuses = [
        ...SIMPLIFIED_TO_FUNNEL_STATUS.accepted,
        ...SIMPLIFIED_TO_FUNNEL_STATUS.in_production,
        ...SIMPLIFIED_TO_FUNNEL_STATUS.qc
      ];
      const inProgressConditions = [...conditions, inArray(manufacturerJobs.manufacturerStatus, inProgressStatuses)];
      const [inProgressResult] = await db
        .select({ count: count() })
        .from(manufacturerJobs)
        .where(and(...inProgressConditions));

      // "Ready to Ship" status jobs
      const readyToShipStatuses = SIMPLIFIED_TO_FUNNEL_STATUS.ready_to_ship;
      const readyToShipConditions = [...conditions, inArray(manufacturerJobs.manufacturerStatus, readyToShipStatuses)];
      const [readyToShipResult] = await db
        .select({ count: count() })
        .from(manufacturerJobs)
        .where(and(...readyToShipConditions));

      // "Shipped This Week" status jobs
      const shippedStatuses = SIMPLIFIED_TO_FUNNEL_STATUS.shipped;
      const shippedThisWeekConditions = [
        ...conditions,
        inArray(manufacturerJobs.manufacturerStatus, shippedStatuses),
        gte(manufacturerJobs.updatedAt, startOfWeek)
      ];
      const [shippedThisWeekResult] = await db
        .select({ count: count() })
        .from(manufacturerJobs)
        .where(and(...shippedThisWeekConditions));

      // Overdue jobs (not shipped and past due date)
      const notShippedStatuses = [
        ...SIMPLIFIED_TO_FUNNEL_STATUS.new,
        ...SIMPLIFIED_TO_FUNNEL_STATUS.accepted,
        ...SIMPLIFIED_TO_FUNNEL_STATUS.in_production,
        ...SIMPLIFIED_TO_FUNNEL_STATUS.qc,
        ...SIMPLIFIED_TO_FUNNEL_STATUS.ready_to_ship,
      ];
      const [overdueResult] = await db
        .select({ count: count() })
        .from(manufacturerJobs)
        .where(and(
          ...(conditions.length > 0 ? conditions : [sql`1=1`]),
          inArray(manufacturerJobs.manufacturerStatus, notShippedStatuses),
          sql`${manufacturerJobs.promisedShipDate} < NOW()`
        ));

      res.json({
        newJobs: Number(newJobsResult?.count) || 0,
        inProgress: Number(inProgressResult?.count) || 0,
        readyToShip: Number(readyToShipResult?.count) || 0,
        shippedThisWeek: Number(shippedThisWeekResult?.count) || 0,
        overdueJobs: Number(overdueResult?.count) || 0,
        avgTurnaroundDays: 7, // TODO: Calculate actual average
      });
    } catch (error) {
      console.error('Error fetching manufacturer dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // GET jobs list
  app.get('/api/manufacturer-dashboard/jobs', isAuthenticated, loadManufacturerUser, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!.userData!;
      const { status } = req.query;

      // Build conditions
      const conditions: any[] = [];

      // Apply manufacturer filter for manufacturer role
      if (user.role === 'manufacturer' && user.manufacturerId) {
        conditions.push(eq(manufacturerJobs.manufacturerId, user.manufacturerId));
      }

      // Apply status filter - map simplified status to funnel statuses
      if (status && status !== 'all') {
        const simplifiedStatus = status as ManufacturerJobStatus;
        const funnelStatuses = SIMPLIFIED_TO_FUNNEL_STATUS[simplifiedStatus];
        if (funnelStatuses) {
          conditions.push(inArray(manufacturerJobs.manufacturerStatus, funnelStatuses));
        }
      }

      const results = await db
        .select({
          id: manufacturerJobs.id,
          manufacturingId: manufacturerJobs.manufacturingId,
          orderId: manufacturerJobs.orderId,
          manufacturerId: manufacturerJobs.manufacturerId,
          manufacturerStatus: manufacturerJobs.manufacturerStatus,
          priority: manufacturerJobs.priority,
          dueDate: manufacturerJobs.promisedShipDate,
          specialInstructions: manufacturerJobs.specialInstructions,
          createdAt: manufacturerJobs.createdAt,
          updatedAt: manufacturerJobs.updatedAt,
          // Order details
          orderCode: orders.orderCode,
          orderName: orders.orderName,
          // Organization details
          orgName: organizations.name,
          orgLogo: organizations.logoUrl,
        })
        .from(manufacturerJobs)
        .leftJoin(orders, eq(manufacturerJobs.orderId, orders.id))
        .leftJoin(organizations, eq(orders.orgId, organizations.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(manufacturerJobs.createdAt));

      // Calculate total units and map to simplified status
      const jobsWithUnits = await Promise.all(results.map(async (job) => {
        // Get total units from order line items
        const [unitsResult] = await db
          .select({
            totalUnits: sql<number>`SUM(COALESCE(${orderLineItems.qtyTotal}, 0))`
          })
          .from(orderLineItems)
          .where(eq(orderLineItems.orderId, job.orderId!));

        // Map funnel status to simplified status
        const simplifiedStatus = FUNNEL_TO_SIMPLIFIED_STATUS[job.manufacturerStatus || 'intake_pending'] || 'new';

        return {
          ...job,
          status: simplifiedStatus,
          totalUnits: Number(unitsResult?.totalUnits) || 0,
        };
      }));

      res.json(jobsWithUnits);
    } catch (error) {
      console.error('Error fetching manufacturer jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // GET single job detail
  app.get('/api/manufacturer-dashboard/jobs/:id', isAuthenticated, loadManufacturerUser, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!.userData!;
      const jobId = parseInt(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }

      const [job] = await db
        .select({
          id: manufacturerJobs.id,
          manufacturingId: manufacturerJobs.manufacturingId,
          orderId: manufacturerJobs.orderId,
          manufacturerId: manufacturerJobs.manufacturerId,
          manufacturerStatus: manufacturerJobs.manufacturerStatus,
          priority: manufacturerJobs.priority,
          dueDate: manufacturerJobs.promisedShipDate,
          specialInstructions: manufacturerJobs.specialInstructions,
          internalNotes: manufacturerJobs.internalNotes,
          specsLocked: manufacturerJobs.specsLocked,
          sampleRequired: manufacturerJobs.sampleRequired,
          printMethod: manufacturerJobs.printMethod,
          createdAt: manufacturerJobs.createdAt,
          updatedAt: manufacturerJobs.updatedAt,
          orderCode: orders.orderCode,
          orderName: orders.orderName,
          orgName: organizations.name,
          orgLogo: organizations.logoUrl,
        })
        .from(manufacturerJobs)
        .leftJoin(orders, eq(manufacturerJobs.orderId, orders.id))
        .leftJoin(organizations, eq(orders.orgId, organizations.id))
        .where(eq(manufacturerJobs.id, jobId));

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check authorization for manufacturer role
      if (user.role === 'manufacturer' && user.manufacturerId && job.manufacturerId !== user.manufacturerId) {
        return res.status(403).json({ error: 'Not authorized to view this job' });
      }

      // Map to simplified status
      const simplifiedStatus = FUNNEL_TO_SIMPLIFIED_STATUS[job.manufacturerStatus || 'intake_pending'] || 'new';

      res.json({
        ...job,
        status: simplifiedStatus,
      });
    } catch (error) {
      console.error('Error fetching job detail:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  // PATCH update job status
  app.patch('/api/manufacturer-dashboard/jobs/:id/status', isAuthenticated, loadManufacturerUser, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!.userData!;
      const jobId = parseInt(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }

      // Validate request body
      const validation = statusChangeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues
        });
      }

      const { status: newSimplifiedStatus, notes } = validation.data;

      // Get current job
      const [job] = await db
        .select()
        .from(manufacturerJobs)
        .where(eq(manufacturerJobs.id, jobId));

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check authorization for manufacturer role
      if (user.role === 'manufacturer' && user.manufacturerId && job.manufacturerId !== user.manufacturerId) {
        return res.status(403).json({ error: 'Not authorized to update this job' });
      }

      // Get current simplified status
      const currentSimplifiedStatus = FUNNEL_TO_SIMPLIFIED_STATUS[job.manufacturerStatus || 'intake_pending'] || 'new';

      // Check if transition is valid
      const validTransitions: Record<ManufacturerJobStatus, ManufacturerJobStatus[]> = {
        new: ['accepted'],
        accepted: ['in_production', 'new'],
        in_production: ['qc'],
        qc: ['ready_to_ship', 'in_production'],
        ready_to_ship: ['shipped'],
        shipped: [],
      };

      if (!validTransitions[currentSimplifiedStatus]?.includes(newSimplifiedStatus as ManufacturerJobStatus)) {
        return res.status(400).json({
          error: `Invalid status transition from ${currentSimplifiedStatus} to ${newSimplifiedStatus}`,
          allowedTransitions: validTransitions[currentSimplifiedStatus]
        });
      }

      // Get the corresponding funnel status for the new simplified status
      const newFunnelStatus = getFirstFunnelStatus(newSimplifiedStatus as ManufacturerJobStatus);

      // Update the job status
      const [updated] = await db
        .update(manufacturerJobs)
        .set({
          manufacturerStatus: newFunnelStatus,
          internalNotes: notes
            ? `${job.internalNotes || ''}\n[${new Date().toISOString()}] Status changed to ${newSimplifiedStatus}: ${notes}`
            : job.internalNotes,
          updatedAt: new Date(),
        })
        .where(eq(manufacturerJobs.id, jobId))
        .returning();

      // Return with simplified status
      res.json({
        ...updated,
        status: newSimplifiedStatus,
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  // POST upload photo for job
  app.post('/api/manufacturer-dashboard/jobs/:id/photos', isAuthenticated, loadManufacturerUser, async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user!.userData!;
      const jobId = parseInt(req.params.id);

      if (isNaN(jobId)) {
        return res.status(400).json({ error: 'Invalid job ID' });
      }

      const { url, caption } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'Photo URL is required' });
      }

      // Get current job
      const [job] = await db
        .select()
        .from(manufacturerJobs)
        .where(eq(manufacturerJobs.id, jobId));

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check authorization for manufacturer role
      if (user.role === 'manufacturer' && user.manufacturerId && job.manufacturerId !== user.manufacturerId) {
        return res.status(403).json({ error: 'Not authorized to update this job' });
      }

      // Add photo note to internal notes
      const photoNote = `[${new Date().toISOString()}] Photo uploaded: ${url}${caption ? ` - ${caption}` : ''}`;

      const [updated] = await db
        .update(manufacturerJobs)
        .set({
          internalNotes: `${job.internalNotes || ''}\n${photoNote}`,
          updatedAt: new Date(),
        })
        .where(eq(manufacturerJobs.id, jobId))
        .returning();

      res.json({
        message: 'Photo uploaded successfully',
        job: updated
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  });
}
