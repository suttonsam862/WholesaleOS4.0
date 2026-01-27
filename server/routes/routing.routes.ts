/**
 * Routing Routes
 *
 * Admin routes for managing order routing, pending assignments,
 * and viewing routing history.
 */

import type { Express, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { loadUserData, requirePermission } from '../permissions';
import {
  routeOrder,
  createManufacturingJobsFromRouting,
  manuallyAssignJob,
  getPendingAssignmentJobs,
  getRoutingHistory,
} from '../services/autoRouting.service';
import { db } from '../db';
import {
  manufacturers,
  manufacturerJobs,
  orders,
  orderLineItems,
  productVariants,
  products,
} from '../../shared/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export function registerRoutingRoutes(app: Express) {
  /**
   * Route an order - triggers auto-routing for all line items
   * POST /api/admin/routing/route-order
   */
  app.post(
    '/api/admin/routing/route-order',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { orderId } = req.body;

        if (!orderId) {
          return res.status(400).json({ message: 'orderId is required' });
        }

        // Route the order
        const routingResult = await routeOrder(orderId);

        // Create manufacturing jobs based on routing
        const { jobs, errors } = await createManufacturingJobsFromRouting(orderId, routingResult);

        res.json({
          orderId,
          decisions: routingResult.decisions,
          splitOrder: routingResult.splitOrder,
          pendingCount: routingResult.pendingAssignment.length,
          jobs,
          errors,
        });
      } catch (error) {
        console.error('Error routing order:', error);
        res.status(500).json({ message: 'Failed to route order', error: String(error) });
      }
    }
  );

  /**
   * Get pending assignment jobs
   * GET /api/admin/routing/pending
   */
  app.get(
    '/api/admin/routing/pending',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const pendingJobs = await getPendingAssignmentJobs();

        // Enrich with additional info
        const enrichedJobs = await Promise.all(
          pendingJobs.map(async (job) => {
            // Get line items with product info
            const lineItems = await db
              .select({
                id: orderLineItems.id,
                variantId: orderLineItems.variantId,
                productName: products.name,
                variantCode: productVariants.variantCode,
                qtyTotal: orderLineItems.qtyTotal,
              })
              .from(orderLineItems)
              .innerJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
              .innerJoin(products, eq(productVariants.productId, products.id))
              .where(eq(orderLineItems.orderId, job.orderId));

            return {
              ...job,
              lineItems,
            };
          })
        );

        res.json(enrichedJobs);
      } catch (error) {
        console.error('Error getting pending jobs:', error);
        res.status(500).json({ message: 'Failed to get pending jobs' });
      }
    }
  );

  /**
   * Manually assign a job to a manufacturer
   * POST /api/admin/routing/assign
   */
  app.post(
    '/api/admin/routing/assign',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { jobId, manufacturerId, reason } = req.body;
        const userData = (req as any).userData;

        if (!jobId || !manufacturerId) {
          return res.status(400).json({ message: 'jobId and manufacturerId are required' });
        }

        const result = await manuallyAssignJob(
          jobId,
          manufacturerId,
          reason || 'Manual assignment',
          userData?.name || userData?.email || 'Admin'
        );

        if (!result.success) {
          return res.status(400).json({ message: result.error });
        }

        res.json({ success: true, message: 'Job assigned successfully' });
      } catch (error) {
        console.error('Error assigning job:', error);
        res.status(500).json({ message: 'Failed to assign job' });
      }
    }
  );

  /**
   * Get routing history
   * GET /api/admin/routing/history
   */
  app.get(
    '/api/admin/routing/history',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const history = await getRoutingHistory(limit, offset);

        res.json(history);
      } catch (error) {
        console.error('Error getting routing history:', error);
        res.status(500).json({ message: 'Failed to get routing history' });
      }
    }
  );

  /**
   * Get available manufacturers for assignment
   * GET /api/admin/routing/manufacturers
   */
  app.get(
    '/api/admin/routing/manufacturers',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        const availableManufacturers = await db
          .select({
            id: manufacturers.id,
            name: manufacturers.name,
            country: manufacturers.country,
            zone: manufacturers.zone,
            capabilities: manufacturers.capabilities,
            isActive: manufacturers.isActive,
            acceptingNewOrders: manufacturers.acceptingNewOrders,
          })
          .from(manufacturers)
          .where(eq(manufacturers.isActive, true))
          .orderBy(manufacturers.name);

        res.json(availableManufacturers);
      } catch (error) {
        console.error('Error getting manufacturers:', error);
        res.status(500).json({ message: 'Failed to get manufacturers' });
      }
    }
  );

  /**
   * Re-route a specific job
   * POST /api/admin/routing/reroute
   */
  app.post(
    '/api/admin/routing/reroute',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.body;

        if (!jobId) {
          return res.status(400).json({ message: 'jobId is required' });
        }

        // Get the job's order
        const [job] = await db
          .select({ orderId: manufacturerJobs.orderId })
          .from(manufacturerJobs)
          .where(eq(manufacturerJobs.id, jobId))
          .limit(1);

        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }

        // Re-route the order
        const routingResult = await routeOrder(job.orderId);

        // Find the decision for this job's line items
        const relevantDecisions = routingResult.decisions.filter(
          (d) => d.manufacturerId !== null
        );

        if (relevantDecisions.length === 0) {
          return res.json({
            success: false,
            message: 'No suitable manufacturer found',
            routingResult,
          });
        }

        // Update the job with new routing
        const firstDecision = relevantDecisions[0];
        await db
          .update(manufacturerJobs)
          .set({
            manufacturerId: firstDecision.manufacturerId,
            routedBy: firstDecision.routedBy,
            routingReason: `Re-routed: ${firstDecision.routingReason}`,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerJobs.id, jobId));

        res.json({
          success: true,
          message: 'Job re-routed successfully',
          newManufacturerId: firstDecision.manufacturerId,
          routingReason: firstDecision.routingReason,
        });
      } catch (error) {
        console.error('Error re-routing job:', error);
        res.status(500).json({ message: 'Failed to re-route job' });
      }
    }
  );

  /**
   * Get routing stats dashboard
   * GET /api/admin/routing/stats
   */
  app.get(
    '/api/admin/routing/stats',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturing', 'read'),
    async (req: Request, res: Response) => {
      try {
        // Count jobs by routing type
        const allJobs = await db
          .select({
            routedBy: manufacturerJobs.routedBy,
          })
          .from(manufacturerJobs);

        const routingCounts = {
          auto: 0,
          manual: 0,
          fallback: 0,
          pending: 0,
        };

        for (const job of allJobs) {
          const type = job.routedBy || 'pending';
          if (type in routingCounts) {
            routingCounts[type as keyof typeof routingCounts]++;
          }
        }

        // Count split orders
        const orderJobCounts = await db
          .select({
            orderId: manufacturerJobs.orderId,
          })
          .from(manufacturerJobs);

        const orderCounts = new Map<number, number>();
        for (const job of orderJobCounts) {
          const count = orderCounts.get(job.orderId) || 0;
          orderCounts.set(job.orderId, count + 1);
        }

        let splitOrderCount = 0;
        const countsArray = Array.from(orderCounts.values());
        for (const count of countsArray) {
          if (count > 1) splitOrderCount++;
        }

        res.json({
          totalJobs: allJobs.length,
          routingCounts,
          splitOrderCount,
          pendingAssignmentCount: routingCounts.pending,
        });
      } catch (error) {
        console.error('Error getting routing stats:', error);
        res.status(500).json({ message: 'Failed to get routing stats' });
      }
    }
  );
}
