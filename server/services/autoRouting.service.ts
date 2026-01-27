/**
 * Auto-Routing Service
 *
 * Handles automatic assignment of order line items to manufacturers
 * based on product family hierarchy and manufacturer availability.
 */

import { db } from '../db';
import {
  orders,
  orderLineItems,
  productVariants,
  products,
  categories,
  productFamilies,
  productFamilyManufacturers,
  manufacturers,
  manufacturerJobs,
  manufacturing,
} from '../../shared/schema';
import { eq, and, desc, inArray, sql, isNull, not } from 'drizzle-orm';

export interface RoutingDecision {
  lineItemId: number;
  variantId: number;
  productId: number;
  productFamilyId: number | null;
  manufacturerId: number | null;
  routedBy: 'auto' | 'manual' | 'fallback' | 'pending';
  routingReason: string;
}

export interface OrderRoutingResult {
  orderId: number;
  decisions: RoutingDecision[];
  manufacturerGroups: Map<number | null, number[]>; // manufacturerId -> lineItemIds
  pendingAssignment: number[]; // lineItemIds that couldn't be routed
  splitOrder: boolean; // true if order goes to multiple manufacturers
}

/**
 * Resolve the manufacturer for a product variant using the cascade:
 * Variant -> Product -> Category -> ProductFamily
 */
async function resolveManufacturerForVariant(
  variantId: number
): Promise<{ manufacturerId: number | null; productFamilyId: number | null; reason: string }> {
  // Get variant with product info
  const [variant] = await db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      productFamilyId: products.productFamilyId,
      productManufacturerId: products.defaultManufacturerId,
      categoryId: products.categoryId,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant) {
    return { manufacturerId: null, productFamilyId: null, reason: 'Variant not found' };
  }

  // 1. Check product-level override
  if (variant.productManufacturerId) {
    return {
      manufacturerId: variant.productManufacturerId,
      productFamilyId: variant.productFamilyId,
      reason: `Product-level override for "${variant.productName}"`,
    };
  }

  // 2. Check category-level override if product has a category
  if (variant.categoryId) {
    const [category] = await db
      .select({
        id: categories.id,
        name: categories.name,
        productFamilyId: categories.productFamilyId,
      })
      .from(categories)
      .where(eq(categories.id, variant.categoryId))
      .limit(1);

    if (category?.productFamilyId) {
      // Update product's family if it's not set
      if (!variant.productFamilyId) {
        variant.productFamilyId = category.productFamilyId;
      }
    }
  }

  // 3. Check product family level
  if (variant.productFamilyId) {
    const [family] = await db
      .select({
        id: productFamilies.id,
        name: productFamilies.name,
        defaultManufacturerId: productFamilies.defaultManufacturerId,
      })
      .from(productFamilies)
      .where(eq(productFamilies.id, variant.productFamilyId))
      .limit(1);

    if (family?.defaultManufacturerId) {
      return {
        manufacturerId: family.defaultManufacturerId,
        productFamilyId: family.id,
        reason: `Product family default: "${family.name}"`,
      };
    }

    // Check family manufacturers by priority
    const familyManufacturers = await db
      .select({
        manufacturerId: productFamilyManufacturers.manufacturerId,
        priority: productFamilyManufacturers.priority,
        manufacturerName: manufacturers.name,
        isActive: manufacturers.isActive,
        acceptingNewOrders: manufacturers.acceptingNewOrders,
      })
      .from(productFamilyManufacturers)
      .innerJoin(manufacturers, eq(productFamilyManufacturers.manufacturerId, manufacturers.id))
      .where(
        and(
          eq(productFamilyManufacturers.productFamilyId, variant.productFamilyId),
          eq(productFamilyManufacturers.isActive, true)
        )
      )
      .orderBy(productFamilyManufacturers.priority);

    // Find first available manufacturer
    for (const mfr of familyManufacturers) {
      if (mfr.isActive && mfr.acceptingNewOrders) {
        const isPrimary = mfr.priority === 1;
        return {
          manufacturerId: mfr.manufacturerId,
          productFamilyId: variant.productFamilyId,
          reason: isPrimary
            ? `Primary manufacturer for family: "${mfr.manufacturerName}"`
            : `Fallback manufacturer (priority ${mfr.priority}): "${mfr.manufacturerName}"`,
        };
      }
    }

    return {
      manufacturerId: null,
      productFamilyId: variant.productFamilyId,
      reason: `No available manufacturers for product family`,
    };
  }

  return {
    manufacturerId: null,
    productFamilyId: null,
    reason: 'Product has no product family assigned',
  };
}

/**
 * Check if a manufacturer is available to take on new work
 */
async function checkManufacturerAvailability(manufacturerId: number): Promise<{
  available: boolean;
  reason: string;
}> {
  const [mfr] = await db
    .select({
      id: manufacturers.id,
      name: manufacturers.name,
      isActive: manufacturers.isActive,
      acceptingNewOrders: manufacturers.acceptingNewOrders,
      maxConcurrentJobs: manufacturers.maxConcurrentJobs,
    })
    .from(manufacturers)
    .where(eq(manufacturers.id, manufacturerId))
    .limit(1);

  if (!mfr) {
    return { available: false, reason: 'Manufacturer not found' };
  }

  if (!mfr.isActive) {
    return { available: false, reason: `${mfr.name} is inactive` };
  }

  if (!mfr.acceptingNewOrders) {
    return { available: false, reason: `${mfr.name} is not accepting new orders` };
  }

  // Check capacity if max jobs is set
  if (mfr.maxConcurrentJobs) {
    const activeJobsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(manufacturerJobs)
      .where(
        and(
          eq(manufacturerJobs.manufacturerId, manufacturerId),
          not(inArray(manufacturerJobs.simplifiedStatus, ['shipped']))
        )
      );

    const activeJobs = activeJobsResult[0]?.count || 0;

    if (activeJobs >= mfr.maxConcurrentJobs) {
      return {
        available: false,
        reason: `${mfr.name} is at capacity (${activeJobs}/${mfr.maxConcurrentJobs} jobs)`,
      };
    }
  }

  return { available: true, reason: 'Manufacturer available' };
}

/**
 * Find a fallback manufacturer for a product family
 */
async function findFallbackManufacturer(
  productFamilyId: number,
  excludeManufacturerId?: number
): Promise<{ manufacturerId: number | null; reason: string }> {
  const familyManufacturers = await db
    .select({
      manufacturerId: productFamilyManufacturers.manufacturerId,
      priority: productFamilyManufacturers.priority,
      manufacturerName: manufacturers.name,
    })
    .from(productFamilyManufacturers)
    .innerJoin(manufacturers, eq(productFamilyManufacturers.manufacturerId, manufacturers.id))
    .where(
      and(
        eq(productFamilyManufacturers.productFamilyId, productFamilyId),
        eq(productFamilyManufacturers.isActive, true),
        eq(manufacturers.isActive, true),
        eq(manufacturers.acceptingNewOrders, true)
      )
    )
    .orderBy(productFamilyManufacturers.priority);

  for (const mfr of familyManufacturers) {
    if (excludeManufacturerId && mfr.manufacturerId === excludeManufacturerId) {
      continue;
    }

    const availability = await checkManufacturerAvailability(mfr.manufacturerId);
    if (availability.available) {
      return {
        manufacturerId: mfr.manufacturerId,
        reason: `Fallback manufacturer (priority ${mfr.priority}): "${mfr.manufacturerName}"`,
      };
    }
  }

  return { manufacturerId: null, reason: 'No fallback manufacturers available' };
}

/**
 * Route an entire order - resolves manufacturers for all line items
 * and groups them for manufacturing job creation
 */
export async function routeOrder(orderId: number): Promise<OrderRoutingResult> {
  const lineItems = await db
    .select({
      id: orderLineItems.id,
      variantId: orderLineItems.variantId,
    })
    .from(orderLineItems)
    .where(eq(orderLineItems.orderId, orderId));

  const decisions: RoutingDecision[] = [];
  const manufacturerGroups = new Map<number | null, number[]>();
  const pendingAssignment: number[] = [];

  for (const item of lineItems) {
    // Resolve manufacturer for this line item
    const resolution = await resolveManufacturerForVariant(item.variantId);

    let finalManufacturerId = resolution.manufacturerId;
    let routedBy: 'auto' | 'manual' | 'fallback' | 'pending' = 'auto';
    let routingReason = resolution.reason;

    // If we have a manufacturer, verify availability
    if (finalManufacturerId) {
      const availability = await checkManufacturerAvailability(finalManufacturerId);

      if (!availability.available) {
        // Try fallback
        if (resolution.productFamilyId) {
          const fallback = await findFallbackManufacturer(
            resolution.productFamilyId,
            finalManufacturerId
          );

          if (fallback.manufacturerId) {
            finalManufacturerId = fallback.manufacturerId;
            routedBy = 'fallback';
            routingReason = `${availability.reason}. ${fallback.reason}`;
          } else {
            finalManufacturerId = null;
            routedBy = 'pending';
            routingReason = `${availability.reason}. ${fallback.reason}`;
          }
        } else {
          finalManufacturerId = null;
          routedBy = 'pending';
          routingReason = availability.reason;
        }
      }
    } else {
      routedBy = 'pending';
    }

    // Get product info
    const [variant] = await db
      .select({ productId: productVariants.productId })
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId))
      .limit(1);

    const decision: RoutingDecision = {
      lineItemId: item.id,
      variantId: item.variantId,
      productId: variant?.productId || 0,
      productFamilyId: resolution.productFamilyId,
      manufacturerId: finalManufacturerId,
      routedBy,
      routingReason,
    };

    decisions.push(decision);

    // Group by manufacturer
    const existing = manufacturerGroups.get(finalManufacturerId) || [];
    existing.push(item.id);
    manufacturerGroups.set(finalManufacturerId, existing);

    // Track pending assignments
    if (routedBy === 'pending') {
      pendingAssignment.push(item.id);
    }
  }

  // Check if this is a split order (multiple manufacturers)
  const uniqueManufacturers = Array.from(manufacturerGroups.keys()).filter((id) => id !== null);
  const splitOrder = uniqueManufacturers.length > 1;

  return {
    orderId,
    decisions,
    manufacturerGroups,
    pendingAssignment,
    splitOrder,
  };
}

/**
 * Create manufacturing jobs based on routing decisions
 * Groups line items by manufacturer and creates one job per manufacturer
 */
export async function createManufacturingJobsFromRouting(
  orderId: number,
  routingResult: OrderRoutingResult
): Promise<{ jobs: Array<{ jobId: number; manufacturerId: number | null }>; errors: string[] }> {
  const jobs: Array<{ jobId: number; manufacturerId: number | null }> = [];
  const errors: string[] = [];

  // Get order details
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return { jobs, errors: ['Order not found'] };
  }

  // Convert Map to array for iteration
  const manufacturerGroupsArray = Array.from(routingResult.manufacturerGroups.entries());

  // Process each manufacturer group
  for (const [manufacturerId, lineItemIds] of manufacturerGroupsArray) {
    try {
      // Find routing decision for this group to get routedBy and reason
      const decision = routingResult.decisions.find((d) => d.manufacturerId === manufacturerId);

      // First, check if there's an existing manufacturing record for this order
      let [existingManufacturing] = await db
        .select()
        .from(manufacturing)
        .where(eq(manufacturing.orderId, orderId))
        .limit(1);

      // If no manufacturing record exists, create one
      if (!existingManufacturing) {
        const [newManufacturing] = await db
          .insert(manufacturing)
          .values({
            orderId,
            status: 'awaiting_admin_confirmation',
            manufacturerId: manufacturerId,
          })
          .returning();
        existingManufacturing = newManufacturing;
      }

      // Check if job already exists for this manufacturing record
      const [existingJob] = await db
        .select()
        .from(manufacturerJobs)
        .where(eq(manufacturerJobs.manufacturingId, existingManufacturing.id))
        .limit(1);

      if (existingJob) {
        // Update existing job
        await db
          .update(manufacturerJobs)
          .set({
            manufacturerId: manufacturerId,
            routedBy: decision?.routedBy || 'pending',
            routingReason: decision?.routingReason || 'Auto-routed',
            updatedAt: new Date(),
          })
          .where(eq(manufacturerJobs.id, existingJob.id));

        jobs.push({ jobId: existingJob.id, manufacturerId });
      } else {
        // Create new manufacturer job
        const [newJob] = await db
          .insert(manufacturerJobs)
          .values({
            manufacturingId: existingManufacturing.id,
            orderId,
            manufacturerId: manufacturerId,
            manufacturerStatus: 'intake_pending',
            simplifiedStatus: manufacturerId ? 'new' : 'new',
            routedBy: decision?.routedBy || 'pending',
            routingReason: decision?.routingReason || 'Auto-routed',
            priority: order.priority || 'normal',
          })
          .returning();

        jobs.push({ jobId: newJob.id, manufacturerId });
      }
    } catch (error) {
      errors.push(`Failed to create job for manufacturer ${manufacturerId}: ${error}`);
    }
  }

  return { jobs, errors };
}

/**
 * Manually assign a job to a manufacturer (admin override)
 */
export async function manuallyAssignJob(
  jobId: number,
  manufacturerId: number,
  reason: string,
  assignedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify manufacturer exists and is available
    const availability = await checkManufacturerAvailability(manufacturerId);

    // Get current job to store original manufacturer
    const [currentJob] = await db
      .select({ manufacturerId: manufacturerJobs.manufacturerId })
      .from(manufacturerJobs)
      .where(eq(manufacturerJobs.id, jobId))
      .limit(1);

    await db
      .update(manufacturerJobs)
      .set({
        manufacturerId,
        routedBy: 'manual',
        routingReason: `Manually assigned by ${assignedBy}: ${reason}`,
        originalManufacturerId: currentJob?.manufacturerId || undefined,
        simplifiedStatus: 'new',
        updatedAt: new Date(),
      })
      .where(eq(manufacturerJobs.id, jobId));

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get jobs pending manual assignment
 */
export async function getPendingAssignmentJobs(): Promise<
  Array<{
    jobId: number;
    orderId: number;
    orderCode: string;
    routingReason: string;
    createdAt: Date;
    lineItemCount: number;
  }>
> {
  const pendingJobs = await db
    .select({
      jobId: manufacturerJobs.id,
      orderId: manufacturerJobs.orderId,
      orderCode: orders.orderCode,
      routingReason: manufacturerJobs.routingReason,
      createdAt: manufacturerJobs.createdAt,
    })
    .from(manufacturerJobs)
    .innerJoin(orders, eq(manufacturerJobs.orderId, orders.id))
    .where(
      and(
        eq(manufacturerJobs.routedBy, 'pending'),
        isNull(manufacturerJobs.manufacturerId)
      )
    )
    .orderBy(manufacturerJobs.createdAt);

  const results = [];

  for (const job of pendingJobs) {
    const lineItemCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orderLineItems)
      .where(eq(orderLineItems.orderId, job.orderId));

    results.push({
      ...job,
      createdAt: job.createdAt || new Date(),
      routingReason: job.routingReason || 'Unknown',
      lineItemCount: lineItemCountResult[0]?.count || 0,
    });
  }

  return results;
}

/**
 * Get routing history for audit purposes
 */
export async function getRoutingHistory(
  limit: number = 50,
  offset: number = 0
): Promise<
  Array<{
    jobId: number;
    orderId: number;
    orderCode: string;
    manufacturerId: number | null;
    manufacturerName: string | null;
    routedBy: string;
    routingReason: string;
    createdAt: Date;
  }>
> {
  const history = await db
    .select({
      jobId: manufacturerJobs.id,
      orderId: manufacturerJobs.orderId,
      orderCode: orders.orderCode,
      manufacturerId: manufacturerJobs.manufacturerId,
      manufacturerName: manufacturers.name,
      routedBy: manufacturerJobs.routedBy,
      routingReason: manufacturerJobs.routingReason,
      createdAt: manufacturerJobs.createdAt,
    })
    .from(manufacturerJobs)
    .innerJoin(orders, eq(manufacturerJobs.orderId, orders.id))
    .leftJoin(manufacturers, eq(manufacturerJobs.manufacturerId, manufacturers.id))
    .orderBy(desc(manufacturerJobs.createdAt))
    .limit(limit)
    .offset(offset);

  return history.map((h) => ({
    ...h,
    createdAt: h.createdAt || new Date(),
    routingReason: h.routingReason || 'Unknown',
    routedBy: h.routedBy || 'pending',
  }));
}
