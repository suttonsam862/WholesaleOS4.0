/**
 * Manufacturer Payments Routes
 *
 * Routes for managing manufacturer invoices, payments, and financial reporting.
 * Phase 6: Payment Terms & Financial Controls
 */

import type { Express, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { loadUserData, requirePermission } from '../permissions';
import { db } from '../db';
import {
  manufacturerInvoices,
  manufacturerInvoiceItems,
  manufacturerPayments,
  manufacturerPaymentAllocations,
  manufacturers,
  manufacturerJobs,
  users,
} from '../../shared/schema';
import { eq, and, desc, asc, sql, gte, lte, lt, isNull, sum, count } from 'drizzle-orm';

// Helper to generate invoice number
function generateInvoiceNumber(manufacturerId: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${manufacturerId}-${year}${month}-${random}`;
}

// Calculate due date based on payment terms
function calculateDueDate(invoiceDate: Date, paymentTerms: string): Date {
  const dueDate = new Date(invoiceDate);
  switch (paymentTerms) {
    case 'prepaid':
      return invoiceDate; // Due immediately
    case 'net15':
      dueDate.setDate(dueDate.getDate() + 15);
      break;
    case 'net30':
      dueDate.setDate(dueDate.getDate() + 30);
      break;
    case 'net60':
      dueDate.setDate(dueDate.getDate() + 60);
      break;
    default:
      dueDate.setDate(dueDate.getDate() + 30); // Default NET30
  }
  return dueDate;
}

export function registerManufacturerPaymentsRoutes(app: Express) {
  // ==================== INVOICES ====================

  /**
   * List all invoices
   * GET /api/admin/invoices
   */
  app.get(
    '/api/admin/invoices',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { manufacturerId, status, dueBefore, dueAfter, limit = '50', offset = '0' } = req.query;

        const conditions = [];
        if (manufacturerId) {
          conditions.push(eq(manufacturerInvoices.manufacturerId, parseInt(manufacturerId as string)));
        }
        if (status) {
          conditions.push(eq(manufacturerInvoices.status, status as any));
        }
        if (dueBefore) {
          conditions.push(lte(manufacturerInvoices.dueDate, new Date(dueBefore as string).toISOString().split('T')[0]));
        }
        if (dueAfter) {
          conditions.push(gte(manufacturerInvoices.dueDate, new Date(dueAfter as string).toISOString().split('T')[0]));
        }

        const invoices = await db
          .select({
            invoice: manufacturerInvoices,
            manufacturer: manufacturers,
            approvedByUser: users,
          })
          .from(manufacturerInvoices)
          .leftJoin(manufacturers, eq(manufacturerInvoices.manufacturerId, manufacturers.id))
          .leftJoin(users, eq(manufacturerInvoices.approvedBy, users.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(manufacturerInvoices.createdAt))
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));

        res.json(
          invoices.map(({ invoice, manufacturer, approvedByUser }) => ({
            ...invoice,
            manufacturerName: manufacturer?.name,
            approvedByName: approvedByUser?.name || approvedByUser?.email,
          }))
        );
      } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Failed to fetch invoices' });
      }
    }
  );

  /**
   * Get invoice details
   * GET /api/admin/invoices/:id
   */
  app.get(
    '/api/admin/invoices/:id',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const [invoice] = await db
          .select({
            invoice: manufacturerInvoices,
            manufacturer: manufacturers,
          })
          .from(manufacturerInvoices)
          .leftJoin(manufacturers, eq(manufacturerInvoices.manufacturerId, manufacturers.id))
          .where(eq(manufacturerInvoices.id, id))
          .limit(1);

        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        // Get line items
        const lineItems = await db
          .select()
          .from(manufacturerInvoiceItems)
          .where(eq(manufacturerInvoiceItems.invoiceId, id))
          .orderBy(asc(manufacturerInvoiceItems.id));

        // Get payment allocations
        const allocations = await db
          .select({
            allocation: manufacturerPaymentAllocations,
            payment: manufacturerPayments,
          })
          .from(manufacturerPaymentAllocations)
          .leftJoin(manufacturerPayments, eq(manufacturerPaymentAllocations.paymentId, manufacturerPayments.id))
          .where(eq(manufacturerPaymentAllocations.invoiceId, id));

        res.json({
          ...invoice.invoice,
          manufacturerName: invoice.manufacturer?.name,
          lineItems,
          payments: allocations.map(({ allocation, payment }) => ({
            allocationId: allocation.id,
            paymentId: payment?.id,
            paymentDate: payment?.paymentDate,
            paymentMethod: payment?.paymentMethod,
            amountApplied: allocation.amountApplied,
            referenceNumber: payment?.referenceNumber,
          })),
        });
      } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ message: 'Failed to fetch invoice' });
      }
    }
  );

  /**
   * Create invoice
   * POST /api/admin/invoices
   */
  app.post(
    '/api/admin/invoices',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { manufacturerId, invoiceDate, lineItems, notes, attachmentUrl } = req.body;

        if (!manufacturerId || !invoiceDate || !lineItems || lineItems.length === 0) {
          return res.status(400).json({ message: 'Manufacturer, invoice date, and line items are required' });
        }

        // Get manufacturer to determine payment terms
        const [manufacturer] = await db
          .select()
          .from(manufacturers)
          .where(eq(manufacturers.id, manufacturerId))
          .limit(1);

        if (!manufacturer) {
          return res.status(404).json({ message: 'Manufacturer not found' });
        }

        // Calculate totals
        let subtotal = 0;
        for (const item of lineItems) {
          subtotal += parseFloat(item.lineTotal) || (parseFloat(item.unitCost) * (item.quantity || 1));
        }

        const taxAmount = 0; // No tax for now
        const totalAmount = subtotal + taxAmount;

        const invoiceDateObj = new Date(invoiceDate);
        const dueDate = calculateDueDate(invoiceDateObj, manufacturer.paymentTerms || 'net30');

        // Create invoice
        const [invoice] = await db
          .insert(manufacturerInvoices)
          .values({
            invoiceNumber: generateInvoiceNumber(manufacturerId),
            manufacturerId,
            invoiceDate: invoiceDateObj.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            subtotal: subtotal.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            balanceDue: totalAmount.toFixed(2),
            status: 'draft',
            notes,
            attachmentUrl,
          })
          .returning();

        // Create line items
        for (const item of lineItems) {
          const lineTotal = parseFloat(item.lineTotal) || (parseFloat(item.unitCost) * (item.quantity || 1));
          await db.insert(manufacturerInvoiceItems).values({
            invoiceId: invoice.id,
            manufacturerJobId: item.manufacturerJobId || null,
            description: item.description,
            quantity: item.quantity || 1,
            unitCost: item.unitCost,
            lineTotal: lineTotal.toFixed(2),
            category: item.category || 'manufacturing',
          });
        }

        res.status(201).json(invoice);
      } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Failed to create invoice' });
      }
    }
  );

  /**
   * Approve invoice
   * POST /api/admin/invoices/:id/approve
   */
  app.post(
    '/api/admin/invoices/:id/approve',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const userData = (req as any).userData;

        const [updated] = await db
          .update(manufacturerInvoices)
          .set({
            status: 'approved',
            approvedAt: new Date(),
            approvedBy: userData?.id,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerInvoices.id, id))
          .returning();

        // Update manufacturer balance
        if (updated) {
          await recalculateManufacturerBalance(updated.manufacturerId);
        }

        res.json(updated);
      } catch (error) {
        console.error('Error approving invoice:', error);
        res.status(500).json({ message: 'Failed to approve invoice' });
      }
    }
  );

  /**
   * Dispute invoice
   * POST /api/admin/invoices/:id/dispute
   */
  app.post(
    '/api/admin/invoices/:id/dispute',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { reason } = req.body;

        if (!reason) {
          return res.status(400).json({ message: 'Dispute reason is required' });
        }

        const [updated] = await db
          .update(manufacturerInvoices)
          .set({
            status: 'disputed',
            disputeReason: reason,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerInvoices.id, id))
          .returning();

        res.json(updated);
      } catch (error) {
        console.error('Error disputing invoice:', error);
        res.status(500).json({ message: 'Failed to dispute invoice' });
      }
    }
  );

  /**
   * Void invoice
   * POST /api/admin/invoices/:id/void
   */
  app.post(
    '/api/admin/invoices/:id/void',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const [invoice] = await db
          .select()
          .from(manufacturerInvoices)
          .where(eq(manufacturerInvoices.id, id))
          .limit(1);

        if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
        }

        // Check if any payments have been made
        const allocations = await db
          .select()
          .from(manufacturerPaymentAllocations)
          .where(eq(manufacturerPaymentAllocations.invoiceId, id));

        if (allocations.length > 0) {
          return res.status(400).json({ message: 'Cannot void invoice with payments applied' });
        }

        const [updated] = await db
          .update(manufacturerInvoices)
          .set({
            status: 'void',
            updatedAt: new Date(),
          })
          .where(eq(manufacturerInvoices.id, id))
          .returning();

        // Recalculate balance
        await recalculateManufacturerBalance(updated.manufacturerId);

        res.json(updated);
      } catch (error) {
        console.error('Error voiding invoice:', error);
        res.status(500).json({ message: 'Failed to void invoice' });
      }
    }
  );

  // ==================== PAYMENTS ====================

  /**
   * List all payments
   * GET /api/admin/payments
   */
  app.get(
    '/api/admin/payments',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { manufacturerId, limit = '50', offset = '0' } = req.query;

        const conditions = [eq(manufacturerPayments.isVoid, false)];
        if (manufacturerId) {
          conditions.push(eq(manufacturerPayments.manufacturerId, parseInt(manufacturerId as string)));
        }

        const payments = await db
          .select({
            payment: manufacturerPayments,
            manufacturer: manufacturers,
            createdByUser: users,
          })
          .from(manufacturerPayments)
          .leftJoin(manufacturers, eq(manufacturerPayments.manufacturerId, manufacturers.id))
          .leftJoin(users, eq(manufacturerPayments.createdBy, users.id))
          .where(and(...conditions))
          .orderBy(desc(manufacturerPayments.paymentDate))
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));

        res.json(
          payments.map(({ payment, manufacturer, createdByUser }) => ({
            ...payment,
            manufacturerName: manufacturer?.name,
            createdByName: createdByUser?.name || createdByUser?.email,
          }))
        );
      } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Failed to fetch payments' });
      }
    }
  );

  /**
   * Record payment
   * POST /api/admin/payments
   */
  app.post(
    '/api/admin/payments',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { manufacturerId, paymentDate, amount, paymentMethod, referenceNumber, notes, invoiceAllocations } = req.body;
        const userData = (req as any).userData;

        if (!manufacturerId || !paymentDate || !amount || !paymentMethod) {
          return res.status(400).json({ message: 'Manufacturer, date, amount, and payment method are required' });
        }

        // Create payment
        const [payment] = await db
          .insert(manufacturerPayments)
          .values({
            manufacturerId,
            paymentDate: new Date(paymentDate).toISOString().split('T')[0],
            amount: parseFloat(amount).toFixed(2),
            paymentMethod,
            referenceNumber,
            notes,
            createdBy: userData?.id,
          })
          .returning();

        // Create allocations if provided
        if (invoiceAllocations && invoiceAllocations.length > 0) {
          for (const allocation of invoiceAllocations) {
            await db.insert(manufacturerPaymentAllocations).values({
              paymentId: payment.id,
              invoiceId: allocation.invoiceId,
              amountApplied: parseFloat(allocation.amount).toFixed(2),
            });

            // Update invoice
            await updateInvoiceAfterPayment(allocation.invoiceId);
          }
        } else {
          // Auto-allocate to oldest invoices
          await autoAllocatePayment(payment.id, manufacturerId, parseFloat(amount));
        }

        // Recalculate manufacturer balance
        await recalculateManufacturerBalance(manufacturerId);

        res.status(201).json(payment);
      } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ message: 'Failed to record payment' });
      }
    }
  );

  /**
   * Void payment
   * POST /api/admin/payments/:id/void
   */
  app.post(
    '/api/admin/payments/:id/void',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { reason } = req.body;
        const userData = (req as any).userData;

        if (!reason) {
          return res.status(400).json({ message: 'Void reason is required' });
        }

        const [payment] = await db
          .select()
          .from(manufacturerPayments)
          .where(eq(manufacturerPayments.id, id))
          .limit(1);

        if (!payment) {
          return res.status(404).json({ message: 'Payment not found' });
        }

        // Get affected invoices
        const allocations = await db
          .select()
          .from(manufacturerPaymentAllocations)
          .where(eq(manufacturerPaymentAllocations.paymentId, id));

        // Void the payment
        const [updated] = await db
          .update(manufacturerPayments)
          .set({
            isVoid: true,
            voidedAt: new Date(),
            voidedBy: userData?.id,
            voidReason: reason,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerPayments.id, id))
          .returning();

        // Update affected invoices
        for (const allocation of allocations) {
          await updateInvoiceAfterPayment(allocation.invoiceId);
        }

        // Recalculate manufacturer balance
        await recalculateManufacturerBalance(payment.manufacturerId);

        res.json(updated);
      } catch (error) {
        console.error('Error voiding payment:', error);
        res.status(500).json({ message: 'Failed to void payment' });
      }
    }
  );

  // ==================== REPORTS ====================

  /**
   * Get aging report summary
   * GET /api/admin/reports/aging
   */
  app.get(
    '/api/admin/reports/aging',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Get all open invoices grouped by manufacturer
        const invoices = await db
          .select({
            invoice: manufacturerInvoices,
            manufacturer: manufacturers,
          })
          .from(manufacturerInvoices)
          .leftJoin(manufacturers, eq(manufacturerInvoices.manufacturerId, manufacturers.id))
          .where(
            sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`
          )
          .orderBy(asc(manufacturers.name), asc(manufacturerInvoices.dueDate));

        // Group by manufacturer and calculate aging buckets
        const agingByManufacturer: Record<number, {
          manufacturerId: number;
          manufacturerName: string;
          current: number;
          days1to30: number;
          days31to60: number;
          days61to90: number;
          days90plus: number;
          total: number;
        }> = {};

        for (const { invoice, manufacturer } of invoices) {
          if (!manufacturer) continue;

          if (!agingByManufacturer[manufacturer.id]) {
            agingByManufacturer[manufacturer.id] = {
              manufacturerId: manufacturer.id,
              manufacturerName: manufacturer.name,
              current: 0,
              days1to30: 0,
              days31to60: 0,
              days61to90: 0,
              days90plus: 0,
              total: 0,
            };
          }

          const balance = parseFloat(invoice.balanceDue || '0');
          const dueDate = new Date(invoice.dueDate);
          const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysPastDue <= 0) {
            agingByManufacturer[manufacturer.id].current += balance;
          } else if (daysPastDue <= 30) {
            agingByManufacturer[manufacturer.id].days1to30 += balance;
          } else if (daysPastDue <= 60) {
            agingByManufacturer[manufacturer.id].days31to60 += balance;
          } else if (daysPastDue <= 90) {
            agingByManufacturer[manufacturer.id].days61to90 += balance;
          } else {
            agingByManufacturer[manufacturer.id].days90plus += balance;
          }

          agingByManufacturer[manufacturer.id].total += balance;
        }

        const summary = Object.values(agingByManufacturer);

        // Calculate totals
        const totals = {
          current: summary.reduce((sum, m) => sum + m.current, 0),
          days1to30: summary.reduce((sum, m) => sum + m.days1to30, 0),
          days31to60: summary.reduce((sum, m) => sum + m.days31to60, 0),
          days61to90: summary.reduce((sum, m) => sum + m.days61to90, 0),
          days90plus: summary.reduce((sum, m) => sum + m.days90plus, 0),
          total: summary.reduce((sum, m) => sum + m.total, 0),
        };

        res.json({
          asOfDate: todayStr,
          manufacturers: summary,
          totals,
        });
      } catch (error) {
        console.error('Error generating aging report:', error);
        res.status(500).json({ message: 'Failed to generate aging report' });
      }
    }
  );

  /**
   * Get aging detail for a manufacturer
   * GET /api/admin/reports/aging/:manufacturerId
   */
  app.get(
    '/api/admin/reports/aging/:manufacturerId',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const manufacturerId = parseInt(req.params.manufacturerId);
        const today = new Date();

        const invoices = await db
          .select()
          .from(manufacturerInvoices)
          .where(
            and(
              eq(manufacturerInvoices.manufacturerId, manufacturerId),
              sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`
            )
          )
          .orderBy(asc(manufacturerInvoices.dueDate));

        const invoicesWithAging = invoices.map((invoice) => {
          const dueDate = new Date(invoice.dueDate);
          const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          let bucket: string;

          if (daysPastDue <= 0) {
            bucket = 'current';
          } else if (daysPastDue <= 30) {
            bucket = '1-30';
          } else if (daysPastDue <= 60) {
            bucket = '31-60';
          } else if (daysPastDue <= 90) {
            bucket = '61-90';
          } else {
            bucket = '90+';
          }

          return {
            ...invoice,
            daysPastDue: Math.max(0, daysPastDue),
            agingBucket: bucket,
          };
        });

        res.json(invoicesWithAging);
      } catch (error) {
        console.error('Error fetching aging detail:', error);
        res.status(500).json({ message: 'Failed to fetch aging detail' });
      }
    }
  );

  /**
   * Get financial dashboard stats
   * GET /api/admin/finance/dashboard
   */
  app.get(
    '/api/admin/finance/dashboard',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Total payables
        const [totalPayables] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${manufacturerInvoices.balanceDue}), 0)`,
          })
          .from(manufacturerInvoices)
          .where(
            sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`
          );

        // Due this week
        const [dueThisWeek] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${manufacturerInvoices.balanceDue}), 0)`,
          })
          .from(manufacturerInvoices)
          .where(
            and(
              sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`,
              lte(manufacturerInvoices.dueDate, sevenDaysFromNow.toISOString().split('T')[0]),
              gte(manufacturerInvoices.dueDate, today.toISOString().split('T')[0])
            )
          );

        // Overdue
        const [overdue] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${manufacturerInvoices.balanceDue}), 0)`,
          })
          .from(manufacturerInvoices)
          .where(
            and(
              sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`,
              lt(manufacturerInvoices.dueDate, today.toISOString().split('T')[0])
            )
          );

        // Payments this month
        const [paymentsThisMonth] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${manufacturerPayments.amount}), 0)`,
          })
          .from(manufacturerPayments)
          .where(
            and(
              eq(manufacturerPayments.isVoid, false),
              gte(manufacturerPayments.paymentDate, thirtyDaysAgo.toISOString().split('T')[0])
            )
          );

        // Invoices needing approval
        const [pendingApproval] = await db
          .select({
            count: sql<number>`COUNT(*)`,
          })
          .from(manufacturerInvoices)
          .where(eq(manufacturerInvoices.status, 'submitted'));

        // Disputed invoices
        const [disputed] = await db
          .select({
            count: sql<number>`COUNT(*)`,
          })
          .from(manufacturerInvoices)
          .where(eq(manufacturerInvoices.status, 'disputed'));

        res.json({
          totalPayables: parseFloat(totalPayables?.total || '0'),
          dueThisWeek: parseFloat(dueThisWeek?.total || '0'),
          overdue: parseFloat(overdue?.total || '0'),
          paymentsThisMonth: parseFloat(paymentsThisMonth?.total || '0'),
          pendingApprovalCount: pendingApproval?.count || 0,
          disputedCount: disputed?.count || 0,
        });
      } catch (error) {
        console.error('Error fetching finance dashboard:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard' });
      }
    }
  );

  /**
   * Get manufacturer financial profile
   * GET /api/admin/manufacturers/:id/financial
   */
  app.get(
    '/api/admin/manufacturers/:id/financial',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'read'),
    async (req: Request, res: Response) => {
      try {
        const manufacturerId = parseInt(req.params.id);

        const [manufacturer] = await db
          .select()
          .from(manufacturers)
          .where(eq(manufacturers.id, manufacturerId))
          .limit(1);

        if (!manufacturer) {
          return res.status(404).json({ message: 'Manufacturer not found' });
        }

        // Calculate current balance
        const [balance] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${manufacturerInvoices.balanceDue}), 0)`,
          })
          .from(manufacturerInvoices)
          .where(
            and(
              eq(manufacturerInvoices.manufacturerId, manufacturerId),
              sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`
            )
          );

        const currentBalance = parseFloat(balance?.total || '0');
        const creditLimit = parseFloat(manufacturer.creditLimit || '0');
        const availableCredit = Math.max(0, creditLimit - currentBalance);

        // Get recent invoices
        const recentInvoices = await db
          .select()
          .from(manufacturerInvoices)
          .where(eq(manufacturerInvoices.manufacturerId, manufacturerId))
          .orderBy(desc(manufacturerInvoices.createdAt))
          .limit(5);

        // Get recent payments
        const recentPayments = await db
          .select()
          .from(manufacturerPayments)
          .where(
            and(
              eq(manufacturerPayments.manufacturerId, manufacturerId),
              eq(manufacturerPayments.isVoid, false)
            )
          )
          .orderBy(desc(manufacturerPayments.paymentDate))
          .limit(5);

        res.json({
          manufacturerId: manufacturer.id,
          manufacturerName: manufacturer.name,
          paymentTerms: manufacturer.paymentTerms,
          creditLimit,
          currentBalance,
          availableCredit,
          creditUtilization: creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0,
          recentInvoices,
          recentPayments,
        });
      } catch (error) {
        console.error('Error fetching manufacturer financial profile:', error);
        res.status(500).json({ message: 'Failed to fetch financial profile' });
      }
    }
  );

  /**
   * Update manufacturer financial settings
   * PUT /api/admin/manufacturers/:id/financial
   */
  app.put(
    '/api/admin/manufacturers/:id/financial',
    isAuthenticated,
    loadUserData,
    requirePermission('finance', 'write'),
    async (req: Request, res: Response) => {
      try {
        const manufacturerId = parseInt(req.params.id);
        const { creditLimit, paymentTerms } = req.body;

        const [updated] = await db
          .update(manufacturers)
          .set({
            creditLimit: creditLimit?.toString(),
            paymentTerms,
            updatedAt: new Date(),
          })
          .where(eq(manufacturers.id, manufacturerId))
          .returning();

        res.json(updated);
      } catch (error) {
        console.error('Error updating manufacturer financial settings:', error);
        res.status(500).json({ message: 'Failed to update financial settings' });
      }
    }
  );
}

// Helper function to recalculate manufacturer balance
async function recalculateManufacturerBalance(manufacturerId: number): Promise<void> {
  try {
    const [balance] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${manufacturerInvoices.balanceDue}), 0)`,
      })
      .from(manufacturerInvoices)
      .where(
        and(
          eq(manufacturerInvoices.manufacturerId, manufacturerId),
          sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`
        )
      );

    await db
      .update(manufacturers)
      .set({
        currentBalance: balance?.total || '0',
        updatedAt: new Date(),
      })
      .where(eq(manufacturers.id, manufacturerId));
  } catch (error) {
    console.error('Error recalculating manufacturer balance:', error);
  }
}

// Helper function to update invoice after payment allocation
async function updateInvoiceAfterPayment(invoiceId: number): Promise<void> {
  try {
    // Get total payments applied to this invoice
    const [payments] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${manufacturerPaymentAllocations.amountApplied}), 0)`,
      })
      .from(manufacturerPaymentAllocations)
      .leftJoin(manufacturerPayments, eq(manufacturerPaymentAllocations.paymentId, manufacturerPayments.id))
      .where(
        and(
          eq(manufacturerPaymentAllocations.invoiceId, invoiceId),
          eq(manufacturerPayments.isVoid, false)
        )
      );

    const totalPaid = parseFloat(payments?.total || '0');

    // Get invoice total
    const [invoice] = await db
      .select()
      .from(manufacturerInvoices)
      .where(eq(manufacturerInvoices.id, invoiceId))
      .limit(1);

    if (!invoice) return;

    const totalAmount = parseFloat(invoice.totalAmount);
    const balanceDue = totalAmount - totalPaid;

    let newStatus: typeof invoice.status = invoice.status;
    if (balanceDue <= 0) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }

    await db
      .update(manufacturerInvoices)
      .set({
        amountPaid: totalPaid.toFixed(2),
        balanceDue: Math.max(0, balanceDue).toFixed(2),
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(manufacturerInvoices.id, invoiceId));
  } catch (error) {
    console.error('Error updating invoice after payment:', error);
  }
}

// Helper function to auto-allocate payment to oldest invoices
async function autoAllocatePayment(paymentId: number, manufacturerId: number, amount: number): Promise<void> {
  try {
    // Get unpaid invoices ordered by due date
    const unpaidInvoices = await db
      .select()
      .from(manufacturerInvoices)
      .where(
        and(
          eq(manufacturerInvoices.manufacturerId, manufacturerId),
          sql`${manufacturerInvoices.status} IN ('approved', 'partially_paid')`
        )
      )
      .orderBy(asc(manufacturerInvoices.dueDate));

    let remaining = amount;

    for (const invoice of unpaidInvoices) {
      if (remaining <= 0) break;

      const balance = parseFloat(invoice.balanceDue);
      const toApply = Math.min(remaining, balance);

      await db.insert(manufacturerPaymentAllocations).values({
        paymentId,
        invoiceId: invoice.id,
        amountApplied: toApply.toFixed(2),
      });

      await updateInvoiceAfterPayment(invoice.id);

      remaining -= toApply;
    }
  } catch (error) {
    console.error('Error auto-allocating payment:', error);
  }
}
