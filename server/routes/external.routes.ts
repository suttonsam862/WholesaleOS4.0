/**
 * External API Routes
 *
 * Routes for external integrations (Hydrogen storefront, mobile apps, etc.)
 * All routes require API key authentication via Bearer token.
 *
 * Base path: /api/external
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import {
  organizations,
  contacts,
  orders,
  orderLineItems,
  designJobs,
  designJobComments,
  events,
  eventRegistrations,
  productVariants,
  products,
  apiKeys,
  users,
  teamStores,
  customerComments,
} from '../../shared/schema';
import { eq, and, desc, isNull, sql, inArray } from 'drizzle-orm';
import {
  authenticateApiKey,
  generateApiKey,
  revokeApiKey,
  type ApiScope,
} from '../middleware/apiKey.middleware';

export function registerExternalRoutes(app: Express) {
  // ============================================
  // CUSTOMERS / ORGANIZATIONS
  // ============================================

  /**
   * Get customer by Shopify customer ID
   * Used by Hydrogen to link Shopify customers to WholesaleOS organizations
   */
  app.get(
    '/api/external/customers/shopify/:shopifyCustomerId',
    authenticateApiKey(['read:customers']),
    async (req: Request, res: Response) => {
      try {
        const { shopifyCustomerId } = req.params;

        const [org] = await db
          .select()
          .from(organizations)
          .where(
            and(
              eq(organizations.shopifyCustomerId, shopifyCustomerId),
              eq(organizations.archived, false)
            )
          )
          .limit(1);

        if (!org) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'No organization found for this Shopify customer ID',
          });
        }

        // Get contacts for this organization
        const orgContacts = await db
          .select()
          .from(contacts)
          .where(eq(contacts.orgId, org.id));

        res.json({
          id: org.id.toString(),
          shopifyCustomerId: org.shopifyCustomerId,
          organizationName: org.name,
          organizationType: mapClientType(org.clientType),
          tier: org.tier || 'standard',
          discountPercentage: parseFloat(org.discountPercentage || '0'),
          creditLimit: org.creditLimit ? parseFloat(org.creditLimit) : undefined,
          taxExempt: org.taxExempt || false,
          taxExemptCertificate: org.taxExemptCertificate,
          brandPrimaryColor: org.brandPrimaryColor,
          brandSecondaryColor: org.brandSecondaryColor,
          logoUrl: org.logoUrl,
          contacts: orgContacts.map(c => ({
            id: c.id.toString(),
            name: c.name,
            email: c.email,
            phone: c.phone,
            role: c.isPrimary ? 'primary' : (c.role === 'billing' ? 'billing' : 'shipping'),
          })),
          createdAt: org.createdAt?.toISOString(),
          updatedAt: org.updatedAt?.toISOString(),
        });
      } catch (error) {
        console.error('Error fetching customer by Shopify ID:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get customer by WholesaleOS ID
   */
  app.get(
    '/api/external/customers/:customerId',
    authenticateApiKey(['read:customers']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);

        const [org] = await db
          .select()
          .from(organizations)
          .where(
            and(
              eq(organizations.id, customerId),
              eq(organizations.archived, false)
            )
          )
          .limit(1);

        if (!org) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Customer not found',
          });
        }

        const orgContacts = await db
          .select()
          .from(contacts)
          .where(eq(contacts.orgId, org.id));

        res.json({
          id: org.id.toString(),
          shopifyCustomerId: org.shopifyCustomerId,
          organizationName: org.name,
          organizationType: mapClientType(org.clientType),
          tier: org.tier || 'standard',
          discountPercentage: parseFloat(org.discountPercentage || '0'),
          creditLimit: org.creditLimit ? parseFloat(org.creditLimit) : undefined,
          taxExempt: org.taxExempt || false,
          contacts: orgContacts.map(c => ({
            id: c.id.toString(),
            name: c.name,
            email: c.email,
            phone: c.phone,
            role: c.isPrimary ? 'primary' : (c.role === 'billing' ? 'billing' : 'shipping'),
          })),
          createdAt: org.createdAt?.toISOString(),
          updatedAt: org.updatedAt?.toISOString(),
        });
      } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // ORDERS
  // ============================================

  /**
   * Get orders for a customer
   */
  app.get(
    '/api/external/customers/:customerId/orders',
    authenticateApiKey(['read:orders']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const customerOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.orgId, customerId))
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset);

        const mappedOrders = await Promise.all(
          customerOrders.map(async (order) => {
            // Get line items for each order
            const lineItems = await db
              .select({
                lineItem: orderLineItems,
                variant: productVariants,
                product: products,
              })
              .from(orderLineItems)
              .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
              .leftJoin(products, eq(productVariants.productId, products.id))
              .where(eq(orderLineItems.orderId, order.id));

            // Get associated design job if any
            const [designJob] = await db
              .select()
              .from(designJobs)
              .where(eq(designJobs.orderId, order.id))
              .limit(1);

            return {
              id: order.id.toString(),
              orderNumber: order.orderCode,
              customerId: order.orgId?.toString(),
              status: mapOrderStatus(order.status),
              items: lineItems.map(li => ({
                id: li.lineItem.id.toString(),
                productId: li.product?.id?.toString(),
                productTitle: li.product?.name || 'Unknown Product',
                variantId: li.variant?.id?.toString(),
                variantTitle: `${li.variant?.color || ''} ${li.variant?.size || ''}`.trim() || 'Default',
                sku: li.variant?.variantCode || '',
                sizes: extractSizes(li.lineItem),
                unitPrice: parseFloat(li.lineItem.unitPrice || '0'),
                totalQuantity: li.lineItem.qtyTotal || 0,
                totalPrice: parseFloat(li.lineItem.lineTotal || '0'),
              })),
              subtotal: calculateOrderSubtotal(lineItems),
              discount: 0, // TODO: Implement discount tracking
              shipping: 0, // TODO: Implement shipping tracking
              tax: 0, // TODO: Implement tax tracking
              total: calculateOrderSubtotal(lineItems),
              depositPaid: order.depositReceived || false,
              depositAmount: 0, // TODO: Implement deposit tracking
              balanceDue: calculateOrderSubtotal(lineItems),
              designJobId: designJob?.id?.toString(),
              notes: '', // Internal notes not exposed
              createdAt: order.createdAt?.toISOString(),
              updatedAt: order.updatedAt?.toISOString(),
              estimatedDelivery: order.estDelivery,
            };
          })
        );

        res.json(mappedOrders);
      } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get single order details
   */
  app.get(
    '/api/external/orders/:orderId',
    authenticateApiKey(['read:orders']),
    async (req: Request, res: Response) => {
      try {
        const orderId = parseInt(req.params.orderId);

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!order) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Order not found',
          });
        }

        const lineItems = await db
          .select({
            lineItem: orderLineItems,
            variant: productVariants,
            product: products,
          })
          .from(orderLineItems)
          .leftJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .leftJoin(products, eq(productVariants.productId, products.id))
          .where(eq(orderLineItems.orderId, order.id));

        const [designJob] = await db
          .select()
          .from(designJobs)
          .where(eq(designJobs.orderId, order.id))
          .limit(1);

        res.json({
          id: order.id.toString(),
          orderNumber: order.orderCode,
          customerId: order.orgId?.toString(),
          status: mapOrderStatus(order.status),
          items: lineItems.map(li => ({
            id: li.lineItem.id.toString(),
            productId: li.product?.id?.toString(),
            productTitle: li.product?.name || 'Unknown Product',
            variantId: li.variant?.id?.toString(),
            variantTitle: `${li.variant?.color || ''} ${li.variant?.size || ''}`.trim() || 'Default',
            sku: li.variant?.variantCode || '',
            sizes: extractSizes(li.lineItem),
            unitPrice: parseFloat(li.lineItem.unitPrice || '0'),
            totalQuantity: li.lineItem.qtyTotal || 0,
            totalPrice: parseFloat(li.lineItem.lineTotal || '0'),
          })),
          subtotal: calculateOrderSubtotal(lineItems),
          discount: 0,
          shipping: 0,
          tax: 0,
          total: calculateOrderSubtotal(lineItems),
          depositPaid: order.depositReceived || false,
          depositAmount: 0,
          balanceDue: calculateOrderSubtotal(lineItems),
          designJobId: designJob?.id?.toString(),
          trackingNumber: order.trackingNumber,
          shippingAddress: order.shippingAddress,
          contactName: order.contactName,
          contactEmail: order.contactEmail,
          contactPhone: order.contactPhone,
          createdAt: order.createdAt?.toISOString(),
          updatedAt: order.updatedAt?.toISOString(),
          estimatedDelivery: order.estDelivery,
        });
      } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // CUSTOMER DASHBOARD ENDPOINTS
  // ============================================

  /**
   * Get assigned salesperson for a customer
   */
  app.get(
    '/api/external/customers/:customerId/salesperson',
    authenticateApiKey(['read:customers']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);

        // Get the organization
        const [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, customerId))
          .limit(1);

        if (!org) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Customer not found',
          });
        }

        // Get the assigned sales rep
        if (!org.preferredSalespersonId) {
          return res.json({
            assigned: false,
            message: 'No salesperson assigned yet',
          });
        }

        const [salesRep] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, org.preferredSalespersonId))
          .limit(1);

        if (!salesRep) {
          return res.json({
            assigned: false,
            message: 'Assigned salesperson not found',
          });
        }

        res.json({
          assigned: true,
          salesperson: {
            id: salesRep.id.toString(),
            name: salesRep.name,
            email: salesRep.email,
            avatarUrl: salesRep.avatarUrl,
          },
        });
      } catch (error) {
        console.error('Error fetching salesperson:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get design jobs for a customer
   */
  app.get(
    '/api/external/customers/:customerId/design-jobs',
    authenticateApiKey(['read:design-jobs']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // Get orders for this customer, then get design jobs for those orders
        const customerOrders = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.orgId, customerId));

        const orderIds = customerOrders.map(o => o.id);

        if (orderIds.length === 0) {
          return res.json([]);
        }

        const customerDesignJobs = await db
          .select({
            job: designJobs,
            order: orders,
          })
          .from(designJobs)
          .leftJoin(orders, eq(designJobs.orderId, orders.id))
          .where(inArray(designJobs.orderId, orderIds))
          .orderBy(desc(designJobs.createdAt))
          .limit(limit)
          .offset(offset);

        res.json(
          customerDesignJobs.map(({ job, order }) => ({
            id: job.id.toString(),
            orderId: job.orderId?.toString(),
            orderNumber: order?.orderCode,
            jobCode: job.jobCode,
            brief: job.brief,
            status: mapDesignJobStatus(job.status),
            renditionCount: job.renditionCount || 0,
            renditionUrls: job.renditionUrls,
            clientFeedback: job.clientFeedback,
            createdAt: job.createdAt?.toISOString(),
            updatedAt: job.updatedAt?.toISOString(),
          }))
        );
      } catch (error) {
        console.error('Error fetching customer design jobs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get team stores for a customer
   */
  app.get(
    '/api/external/customers/:customerId/team-stores',
    authenticateApiKey(['read:orders']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);

        const customerTeamStores = await db
          .select()
          .from(teamStores)
          .where(eq(teamStores.orgId, customerId))
          .orderBy(desc(teamStores.createdAt));

        res.json(
          customerTeamStores.map(store => ({
            id: store.id.toString(),
            storeCode: store.storeCode,
            storeName: store.storeName,
            customerName: store.customerName,
            status: store.status,
            stage: store.stage,
            openDate: store.storeOpenDate,
            closeDate: store.storeCloseDate,
            isActive: store.status === 'in_process',
            createdAt: store.createdAt?.toISOString(),
          }))
        );
      } catch (error) {
        console.error('Error fetching customer team stores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get recent activity for a customer
   */
  app.get(
    '/api/external/customers/:customerId/activity',
    authenticateApiKey(['read:customers']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);
        const limit = parseInt(req.query.limit as string) || 20;

        // Get recent orders
        const recentOrders = await db
          .select({
            id: orders.id,
            orderCode: orders.orderCode,
            status: orders.status,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
          })
          .from(orders)
          .where(eq(orders.orgId, customerId))
          .orderBy(desc(orders.updatedAt))
          .limit(5);

        // Get recent design jobs
        const orderIds = recentOrders.map(o => o.id);
        const recentDesignJobs = orderIds.length > 0
          ? await db
              .select({
                id: designJobs.id,
                jobCode: designJobs.jobCode,
                brief: designJobs.brief,
                status: designJobs.status,
                updatedAt: designJobs.updatedAt,
              })
              .from(designJobs)
              .where(inArray(designJobs.orderId, orderIds))
              .orderBy(desc(designJobs.updatedAt))
              .limit(5)
          : [];

        // Build activity timeline
        const activities: Array<{
          type: string;
          title: string;
          description: string;
          timestamp: string;
          resourceId?: string;
          resourceType?: string;
        }> = [];

        for (const order of recentOrders) {
          activities.push({
            type: 'order',
            title: `Order ${order.orderCode}`,
            description: `Status: ${order.status}`,
            timestamp: order.updatedAt?.toISOString() || order.createdAt?.toISOString() || '',
            resourceId: order.id.toString(),
            resourceType: 'order',
          });
        }

        for (const job of recentDesignJobs) {
          activities.push({
            type: 'design',
            title: job.jobCode || 'Design Job',
            description: `Status: ${job.status}`,
            timestamp: job.updatedAt?.toISOString() || '',
            resourceId: job.id.toString(),
            resourceType: 'design_job',
          });
        }

        // Sort by timestamp descending
        activities.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        res.json(activities.slice(0, limit));
      } catch (error) {
        console.error('Error fetching customer activity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get messages for a customer
   */
  app.get(
    '/api/external/customers/:customerId/messages',
    authenticateApiKey(['read:customers']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Get primary contact for this organization
        const [primaryContact] = await db
          .select()
          .from(contacts)
          .where(
            and(
              eq(contacts.orgId, customerId),
              eq(contacts.isPrimary, true)
            )
          )
          .limit(1);

        if (!primaryContact) {
          return res.json([]);
        }

        // Get messages/comments for orders belonging to this customer
        const customerOrderIds = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.orgId, customerId));

        const orderIds = customerOrderIds.map(o => o.id);

        if (orderIds.length === 0) {
          return res.json([]);
        }

        const customerMessages = await db
          .select()
          .from(customerComments)
          .where(inArray(customerComments.orderId, orderIds))
          .orderBy(desc(customerComments.createdAt))
          .limit(limit)
          .offset(offset);

        res.json(
          customerMessages.map((message) => ({
            id: message.id.toString(),
            orderId: message.orderId.toString(),
            message: message.message,
            isFromCustomer: message.isFromCustomer,
            createdAt: message.createdAt?.toISOString(),
          }))
        );
      } catch (error) {
        console.error('Error fetching customer messages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Send a message from a customer (comment on an order)
   */
  app.post(
    '/api/external/customers/:customerId/messages',
    authenticateApiKey(['write:customers']),
    async (req: Request, res: Response) => {
      try {
        const customerId = parseInt(req.params.customerId);
        const { message, orderId } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        if (!orderId) {
          return res.status(400).json({ error: 'Order ID is required' });
        }

        // Verify the order belongs to this customer
        const [order] = await db
          .select()
          .from(orders)
          .where(
            and(
              eq(orders.id, parseInt(orderId)),
              eq(orders.orgId, customerId)
            )
          )
          .limit(1);

        if (!order) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Order not found or does not belong to this customer',
          });
        }

        // Create the comment
        const [newComment] = await db
          .insert(customerComments)
          .values({
            orderId: parseInt(orderId),
            message,
            isFromCustomer: true,
          })
          .returning();

        res.status(201).json({
          success: true,
          messageId: newComment.id.toString(),
          message: 'Message sent successfully',
        });
      } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // DESIGN JOBS
  // ============================================

  /**
   * Get design job details
   */
  app.get(
    '/api/external/design-jobs/:jobId',
    authenticateApiKey(['read:design-jobs']),
    async (req: Request, res: Response) => {
      try {
        const jobId = parseInt(req.params.jobId);

        const [job] = await db
          .select()
          .from(designJobs)
          .where(eq(designJobs.id, jobId))
          .limit(1);

        if (!job) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Design job not found',
          });
        }

        // Build mockups from rendition URLs
        const mockups = (job.renditionUrls || []).map((url, index) => ({
          id: `${job.id}-${index}`,
          version: index + 1,
          frontUrl: url,
          backUrl: undefined, // TODO: Add back URL support
          status: job.status === 'approved' ? 'approved' : (job.status === 'rejected' ? 'rejected' : 'sent'),
          feedback: job.clientFeedback,
          createdAt: job.createdAt?.toISOString(),
        }));

        res.json({
          id: job.id.toString(),
          jobCode: job.jobCode,
          orderId: job.orderId?.toString(),
          status: mapDesignJobStatus(job.status),
          designer: job.assignedDesignerId,
          mockups,
          revisions: job.renditionCount || 0,
          approvedAt: job.status === 'approved' ? job.statusChangedAt?.toISOString() : undefined,
          notes: job.brief,
          createdAt: job.createdAt?.toISOString(),
          updatedAt: job.updatedAt?.toISOString(),
        });
      } catch (error) {
        console.error('Error fetching design job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Submit feedback/approval for a design job
   */
  app.post(
    '/api/external/design-jobs/:jobId/feedback',
    authenticateApiKey(['write:design-jobs']),
    async (req: Request, res: Response) => {
      try {
        const jobId = parseInt(req.params.jobId);
        const { feedback, approved, mockupVersion } = req.body;

        const [job] = await db
          .select()
          .from(designJobs)
          .where(eq(designJobs.id, jobId))
          .limit(1);

        if (!job) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Design job not found',
          });
        }

        // Update the design job with feedback
        const updateData: any = {
          clientFeedback: feedback,
          updatedAt: new Date(),
        };

        if (approved === true) {
          updateData.status = 'approved';
          updateData.statusChangedAt = new Date();
        } else if (approved === false) {
          updateData.status = 'rejected';
          updateData.statusChangedAt = new Date();
        }

        await db
          .update(designJobs)
          .set(updateData)
          .where(eq(designJobs.id, jobId));

        // Add a comment for the feedback (using system user for external API calls)
        // Note: In a real implementation, you may want to create a special "API" user
        // or associate this with the customer's linked user account
        const systemUserId = 'system'; // Placeholder - should be configured in env or use actual user lookup
        await db.insert(designJobComments).values({
          jobId: jobId,
          userId: systemUserId,
          comment: feedback,
          isInternal: false,
        });

        res.json({
          success: true,
          message: approved
            ? 'Design approved successfully'
            : approved === false
            ? 'Design revision requested'
            : 'Feedback submitted successfully',
        });
      } catch (error) {
        console.error('Error submitting design feedback:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // EVENTS
  // ============================================

  /**
   * List public events
   */
  app.get(
    '/api/external/events',
    authenticateApiKey(['read:events']),
    async (req: Request, res: Response) => {
      try {
        const status = req.query.status as string || 'live';
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        const publicEvents = await db
          .select()
          .from(events)
          .where(eq(events.status, status as any))
          .orderBy(desc(events.startDate))
          .limit(limit)
          .offset(offset);

        res.json(
          publicEvents.map(event => ({
            id: event.id.toString(),
            eventCode: event.eventCode,
            name: event.name,
            eventType: event.eventType,
            status: event.status,
            startDate: event.startDate?.toISOString(),
            endDate: event.endDate?.toISOString(),
            timezone: event.timezone,
            location: event.location,
            thumbnailUrl: event.thumbnailUrl,
            logoUrl: event.logoUrl,
            brandingConfig: event.brandingConfig,
            createdAt: event.createdAt?.toISOString(),
          }))
        );
      } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Get single event details
   */
  app.get(
    '/api/external/events/:eventId',
    authenticateApiKey(['read:events']),
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);

        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (!event) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Event not found',
          });
        }

        res.json({
          id: event.id.toString(),
          eventCode: event.eventCode,
          name: event.name,
          eventType: event.eventType,
          status: event.status,
          startDate: event.startDate?.toISOString(),
          endDate: event.endDate?.toISOString(),
          timezone: event.timezone,
          location: event.location,
          thumbnailUrl: event.thumbnailUrl,
          logoUrl: event.logoUrl,
          brandingConfig: event.brandingConfig,
          createdAt: event.createdAt?.toISOString(),
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  /**
   * Register for an event
   */
  app.post(
    '/api/external/events/:eventId/register',
    authenticateApiKey(['write:events']),
    async (req: Request, res: Response) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const {
          // New format (from Hydrogen form)
          firstName,
          lastName,
          // Legacy format
          name: legacyName,
          email,
          phone,
          organizationId,
          notes,
          metadata,
        } = req.body;

        // Support both new and legacy formats
        const attendeeName = firstName && lastName
          ? `${firstName} ${lastName}`
          : legacyName || 'Unknown';

        // Verify event exists and is open for registration
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (!event) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Event not found',
          });
        }

        if (event.status !== 'live' && event.status !== 'planning') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Event is not open for registration',
          });
        }

        // Generate a confirmation code
        const confirmationCode = `RH-EVT-${Date.now().toString(36).toUpperCase()}`;

        // Create registration
        const [registration] = await db
          .insert(eventRegistrations)
          .values({
            eventId,
            attendeeName,
            attendeeEmail: email,
            attendeePhone: phone,
            attendeeInfo: {
              firstName,
              lastName,
              organizationId: organizationId ? parseInt(organizationId) : null,
              notes,
              confirmationCode,
            },
            paymentStatus: 'pending',
            referralSource: 'hydrogen_storefront',
          })
          .returning();

        res.status(201).json({
          success: true,
          registrationId: registration.id.toString(),
          confirmationCode,
          message: `You're registered for ${event.name}! Your confirmation code is ${confirmationCode}. We'll send details to ${email}.`,
        });
      } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // QUOTES
  // ============================================

  /**
   * Submit a quote request from the storefront
   * Accepts the full form data from Hydrogen custom-gear quote form
   */
  app.post(
    '/api/external/quotes',
    authenticateApiKey(['write:orders']),
    async (req: Request, res: Response) => {
      try {
        const {
          // Contact info
          firstName,
          lastName,
          email,
          phone,
          role,
          // Organization info
          organizationName,
          organizationType,
          location,
          sports,
          // Order details
          products,
          quantity,
          neededBy,
          budget,
          hasLogo,
          colors,
          details,
          hearAboutUs,
          // Legacy field support
          contactName: legacyContactName,
          contactEmail: legacyContactEmail,
          contactPhone: legacyContactPhone,
          estimatedQuantity: legacyQuantity,
          timeline: legacyTimeline,
          additionalDetails: legacyDetails,
        } = req.body;

        // Support both new and legacy field formats
        const contactFullName = firstName && lastName
          ? `${firstName} ${lastName}`
          : legacyContactName || organizationName;
        const contactEmailFinal = email || legacyContactEmail;
        const contactPhoneFinal = phone || legacyContactPhone;
        const quantityFinal = quantity || legacyQuantity || 0;
        const timelineFinal = neededBy || legacyTimeline;
        const detailsFinal = details || legacyDetails;

        // Check if organization exists
        let [org] = await db
          .select()
          .from(organizations)
          .where(eq(organizations.name, organizationName))
          .limit(1);

        // Create organization if not exists
        if (!org) {
          [org] = await db
            .insert(organizations)
            .values({
              name: organizationName,
              clientType: 'wholesale',
              tier: 'standard',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();

          // Create contact
          await db.insert(contacts).values({
            orgId: org.id,
            name: contactFullName,
            email: contactEmailFinal,
            phone: contactPhoneFinal,
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Build order notes from all the form data
        const orderNotes = [
          role ? `Role: ${role}` : null,
          organizationType ? `Organization Type: ${organizationType}` : null,
          location ? `Location: ${location}` : null,
          sports?.length ? `Sports: ${Array.isArray(sports) ? sports.join(', ') : sports}` : null,
          products?.length ? `Products: ${Array.isArray(products) ? products.join(', ') : products}` : null,
          budget ? `Budget: ${budget}` : null,
          hasLogo !== undefined ? `Has Logo: ${hasLogo ? 'Yes' : 'No'}` : null,
          colors ? `Colors: ${colors}` : null,
          hearAboutUs ? `How they heard about us: ${hearAboutUs}` : null,
          detailsFinal ? `Details: ${detailsFinal}` : null,
        ].filter(Boolean).join('\n');

        // Create a new order in "new" (quote) status
        const orderCode = `RH-${Date.now().toString(36).toUpperCase()}`;
        const [order] = await db
          .insert(orders)
          .values({
            orderCode,
            orgId: org.id,
            orderName: `Quote Request - ${organizationName}`,
            status: 'new',
            priority: 'normal',
            contactName: contactFullName,
            contactEmail: contactEmailFinal,
            contactPhone: contactPhoneFinal,
            estDelivery: timelineFinal ? timelineFinal : null,
          })
          .returning();

        res.status(201).json({
          success: true,
          id: order.id.toString(),
          orderCode: order.orderCode,
          message: `Quote request submitted successfully! Your reference number is ${order.orderCode}. We'll be in touch within 24 hours.`,
        });
      } catch (error) {
        console.error('Error submitting quote request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // PRODUCTS (Read-only catalog access)
  // ============================================

  /**
   * Get products for display in storefront
   */
  app.get(
    '/api/external/products',
    authenticateApiKey(['read:products']),
    async (req: Request, res: Response) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const productsList = await db
          .select()
          .from(products)
          .where(eq(products.status, 'active'))
          .orderBy(products.name)
          .limit(limit)
          .offset(offset);

        res.json(
          productsList.map(p => ({
            id: p.id.toString(),
            sku: p.sku,
            name: p.name,
            categoryId: p.categoryId?.toString(),
            style: p.style,
            basePrice: p.basePrice,
            minOrderQty: p.minOrderQty,
            sizes: p.sizes,
            primaryImageUrl: p.primaryImageUrl,
            additionalImages: p.additionalImages,
            status: p.status,
          }))
        );
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // CONTACT FORM
  // ============================================

  /**
   * Submit a contact form message from the storefront
   * This creates an activity/lead entry that can be followed up on
   */
  app.post(
    '/api/external/contact',
    authenticateApiKey(['write:orders']), // Using orders scope for lead creation
    async (req: Request, res: Response) => {
      try {
        const {
          name,
          email,
          subject,
          message,
          phone,
        } = req.body;

        if (!name || !email || !message) {
          return res.status(400).json({
            error: 'Name, email, and message are required',
          });
        }

        // Log the contact form submission for now
        // In production, this could:
        // 1. Create a lead/contact record
        // 2. Send an email notification
        // 3. Create a task for follow-up
        console.log('Contact form submission:', {
          name,
          email,
          subject,
          message,
          phone,
          submittedAt: new Date().toISOString(),
        });

        // Create an activity record if storage supports it
        // For now, we'll just acknowledge receipt
        res.status(201).json({
          success: true,
          message: 'Thank you for contacting us! We\'ll respond within 24 hours.',
        });
      } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // NEWSLETTER SUBSCRIPTION
  // ============================================

  /**
   * Subscribe to the newsletter
   */
  app.post(
    '/api/external/newsletter',
    authenticateApiKey(['write:orders']), // Using orders scope as a general write scope
    async (req: Request, res: Response) => {
      try {
        const { email, firstName, lastName, source } = req.body;

        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        // Log the subscription for now
        // In production, this should integrate with:
        // - Klaviyo
        // - Mailchimp
        // - Or another email marketing service
        console.log('Newsletter subscription:', {
          email,
          firstName,
          lastName,
          source: source || 'website',
          subscribedAt: new Date().toISOString(),
        });

        res.status(201).json({
          success: true,
          message: 'Thanks for subscribing! Check your inbox for a welcome email.',
        });
      } catch (error) {
        console.error('Error processing newsletter subscription:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  // ============================================
  // API KEY MANAGEMENT (Admin only - session auth)
  // ============================================

  // Note: API key management endpoints are in a separate file
  // and use session authentication, not API key authentication
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapClientType(clientType: string | null | undefined): string {
  const mapping: Record<string, string> = {
    retail: 'other',
    wholesale: 'business',
    enterprise: 'business',
    government: 'business',
    high_school: 'school',
    college: 'college',
    tour: 'club',
    in_house: 'other',
  };
  return mapping[clientType || ''] || 'other';
}

function mapOrderStatus(status: string | null | undefined): string {
  const mapping: Record<string, string> = {
    new: 'quote',
    waiting_sizes: 'pending_deposit',
    design_created: 'in_design',
    sizes_validated: 'approved',
    invoiced: 'approved',
    production: 'in_production',
    shipped: 'shipped',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return mapping[status || ''] || 'quote';
}

function mapDesignJobStatus(status: string | null | undefined): string {
  const mapping: Record<string, string> = {
    pending: 'pending',
    assigned: 'in_progress',
    in_progress: 'in_progress',
    review: 'awaiting_feedback',
    approved: 'approved',
    rejected: 'revisions_requested',
    completed: 'locked',
  };
  return mapping[status || ''] || 'pending';
}

function extractSizes(lineItem: any): Array<{ size: string; quantity: number }> {
  const sizes: Array<{ size: string; quantity: number }> = [];
  const sizeFields = ['yxs', 'ys', 'ym', 'yl', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl'];

  for (const size of sizeFields) {
    const qty = lineItem[size];
    if (qty && qty > 0) {
      sizes.push({
        size: size.toUpperCase(),
        quantity: qty,
      });
    }
  }

  return sizes;
}

function calculateOrderSubtotal(lineItems: Array<{ lineItem: any }>): number {
  return lineItems.reduce((sum, li) => {
    return sum + parseFloat(li.lineItem.lineTotal || '0');
  }, 0);
}
