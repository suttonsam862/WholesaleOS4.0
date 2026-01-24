import type { Express } from "express";
import { db } from "../db";
import { orders, invoices, invoicePayments, commissions, commissionPayments, organizations, users, orderLineItems, customFinancialEntries } from "@shared/schema";
import { eq, gte, and, isNull, sql, inArray } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";
import { loadUserData, requirePermission, type AuthenticatedRequest } from "../permissions";

export function registerFinancialMatchingRoutes(app: Express): void {
  
  // Get all orders with financial summary - no date restriction, returns ALL orders in database
  app.get('/api/financial-matching/orders', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      // Get ALL orders in the database - no date restriction
      const allOrders = await db
        .select({
          id: orders.id,
          orderCode: orders.orderCode,
          orderName: orders.orderName,
          status: orders.status,
          createdAt: orders.createdAt,
          orgId: orders.orgId,
          salespersonId: orders.salespersonId,
        })
        .from(orders)
        .orderBy(sql`${orders.createdAt} DESC`);

      // Get organizations for display
      const orgs = await db.select().from(organizations);
      const orgMap = new Map(orgs.map(o => [o.id, o]));

      // Get salespeople for display
      const salespeople = await db.select().from(users);
      const salespersonMap = new Map(salespeople.map(u => [u.id, u]));

      // For each order, calculate financial summary
      const ordersWithFinancials = await Promise.all(
        allOrders.map(async (order) => {
          // Get invoices for this order
          const orderInvoices = await db
            .select()
            .from(invoices)
            .where(eq(invoices.orderId, order.id));

          // Get payments for these invoices (INFLOW)
          const invoiceIds = orderInvoices.map(inv => inv.id);
          const payments = invoiceIds.length > 0
            ? await db
                .select()
                .from(invoicePayments)
                .where(inArray(invoicePayments.invoiceId, invoiceIds))
            : [];

          // Get commissions for this order (OUTFLOW - commission owed/paid)
          const orderCommissions = await db
            .select()
            .from(commissions)
            .where(eq(commissions.orderId, order.id));

          // Get commission payments for these commissions (OUTFLOW)
          const commissionIds = orderCommissions.map(c => c.id);
          const commPayments: any[] = [];
          if (commissionIds.length > 0) {
            // For each commission ID, find payments that include it in their commissionIds array
            for (const commId of commissionIds) {
              const payments = await db
                .select()
                .from(commissionPayments)
                .where(sql`${commId} = ANY(${commissionPayments.commissionIds})`);
              commPayments.push(...payments);
            }
          }

          // Get custom financial entries for this order
          const customEntries = await db
            .select()
            .from(customFinancialEntries)
            .where(eq(customFinancialEntries.orderId, order.id));

          // Calculate totals
          const totalInvoiceAmount = orderInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
          const totalPaymentsReceived = payments.reduce((sum, pay) => sum + parseFloat(pay.amount || '0'), 0);
          const totalCommissions = orderCommissions.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount || '0'), 0);
          const totalCommissionsPaid = commPayments.reduce((sum, cp) => sum + parseFloat(cp.totalAmount || '0'), 0);
          
          // Custom entries totals
          const customInflows = customEntries
            .filter(e => e.entryType === 'inflow')
            .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
          const customOutflows = customEntries
            .filter(e => e.entryType === 'outflow')
            .reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

          // Inflows: payments received + custom inflows
          const totalInflows = totalPaymentsReceived + customInflows;

          // Outflows: commissions owed + custom outflows (NOT invoice amounts - those are receivables)
          const totalOutflows = totalCommissions + customOutflows;

          // Net cash flow
          const netCashFlow = totalInflows - totalOutflows;

          return {
            ...order,
            organization: orgMap.get(order.orgId || 0),
            salesperson: salespersonMap.get(order.salespersonId || ''),
            financialSummary: {
              invoiceCount: orderInvoices.length,
              paymentCount: payments.length,
              commissionCount: orderCommissions.length,
              totalInvoiceAmount,
              totalPaymentsReceived,
              totalCommissions,
              totalCommissionsPaid,
              totalInflows,
              totalOutflows,
              netCashFlow,
              // Status indicator: matched if we have both invoices and payments
              matchStatus: orderInvoices.length > 0 && payments.length > 0 ? 'matched' : 
                          orderInvoices.length > 0 || payments.length > 0 ? 'partial' : 'unmatched'
            }
          };
        })
      );

      res.json(ordersWithFinancials);
    } catch (error) {
      console.error("Error fetching financial matching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders for financial matching" });
    }
  });

  // Get detailed financial breakdown for a specific order
  app.get('/api/financial-matching/order/:id', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      // Get the order
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order || order.length === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order line items for COGS calculation
      const lineItems = await db
        .select()
        .from(orderLineItems)
        .where(eq(orderLineItems.orderId, orderId));

      // INFLOWS: Invoice payments received
      const orderInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.orderId, orderId));

      const invoiceIds = orderInvoices.map(inv => inv.id);
      const payments = invoiceIds.length > 0
        ? await db
            .select()
            .from(invoicePayments)
            .where(inArray(invoicePayments.invoiceId, invoiceIds))
        : [];

      // OUTFLOWS: Commissions
      const orderCommissions = await db
        .select()
        .from(commissions)
        .where(eq(commissions.orderId, orderId));

      const commissionIds = orderCommissions.map(c => c.id);
      const commPayments: any[] = [];
      if (commissionIds.length > 0) {
        for (const commId of commissionIds) {
          const payments = await db
            .select()
            .from(commissionPayments)
            .where(sql`${commId} = ANY(${commissionPayments.commissionIds})`);
          commPayments.push(...payments);
        }
      }

      // Get custom financial entries
      const customEntries = await db
        .select()
        .from(customFinancialEntries)
        .where(eq(customFinancialEntries.orderId, orderId));

      // Calculate totals
      const totalInvoiceAmount = orderInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
      const totalPaymentsReceived = payments.reduce((sum, pay) => sum + parseFloat(pay.amount || '0'), 0);
      const totalCommissions = orderCommissions.reduce((sum, comm) => sum + parseFloat(comm.commissionAmount || '0'), 0);
      const totalCommissionsPaid = commPayments.reduce((sum, cp) => sum + parseFloat(cp.totalAmount || '0'), 0);
      
      // Custom entries totals
      const customInflowEntries = customEntries.filter(e => e.entryType === 'inflow');
      const customOutflowEntries = customEntries.filter(e => e.entryType === 'outflow');
      const customInflowsTotal = customInflowEntries.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);
      const customOutflowsTotal = customOutflowEntries.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0);

      res.json({
        order: order[0],
        lineItems,
        inflows: {
          invoices: orderInvoices,
          payments: payments,
          customEntries: customInflowEntries,
          total: totalPaymentsReceived + customInflowsTotal
        },
        outflows: {
          commissions: orderCommissions,
          commissionPayments: commPayments,
          customEntries: customOutflowEntries,
          total: totalCommissions + customOutflowsTotal
        },
        summary: {
          totalInflows: totalPaymentsReceived + customInflowsTotal,
          totalOutflows: totalCommissions + customOutflowsTotal,
          netCashFlow: (totalPaymentsReceived + customInflowsTotal) - (totalCommissions + customOutflowsTotal),
          invoiceBalance: totalInvoiceAmount - totalPaymentsReceived,
          commissionBalance: totalCommissions - totalCommissionsPaid
        }
      });
    } catch (error) {
      console.error("Error fetching order financial details:", error);
      res.status(500).json({ message: "Failed to fetch order financial details" });
    }
  });

  // Get unassigned invoices (invoices without orderId)
  app.get('/api/financial-matching/unassigned-invoices', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const unassignedInvoices = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          orderId: invoices.orderId,
          orgId: invoices.orgId,
          salespersonId: invoices.salespersonId,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          status: invoices.status,
          subtotal: invoices.subtotal,
          totalAmount: invoices.totalAmount,
          amountPaid: invoices.amountPaid,
          amountDue: invoices.amountDue,
          createdAt: invoices.createdAt,
          organization: {
            id: organizations.id,
            name: organizations.name,
          },
        })
        .from(invoices)
        .leftJoin(organizations, eq(invoices.orgId, organizations.id))
        .where(isNull(invoices.orderId));

      res.json(unassignedInvoices);
    } catch (error) {
      console.error("Error fetching unassigned invoices:", error);
      res.status(500).json({ message: "Failed to fetch unassigned invoices" });
    }
  });

  // Get unassigned commissions (commissions without orderId)
  app.get('/api/financial-matching/unassigned-commissions', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const unassignedCommissions = await db
        .select()
        .from(commissions)
        .where(isNull(commissions.orderId));

      res.json(unassignedCommissions);
    } catch (error) {
      console.error("Error fetching unassigned commissions:", error);
      res.status(500).json({ message: "Failed to fetch unassigned commissions" });
    }
  });

  // Assign an invoice to an order
  app.put('/api/financial-matching/assign-invoice', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const { invoiceId, orderId } = req.body;

      if (!invoiceId || orderId === undefined) {
        return res.status(400).json({ message: "Invoice ID and Order ID are required" });
      }

      // Update the invoice
      await db
        .update(invoices)
        .set({ orderId: orderId || null })
        .where(eq(invoices.id, invoiceId));

      res.json({ message: "Invoice assigned successfully" });
    } catch (error) {
      console.error("Error assigning invoice:", error);
      res.status(500).json({ message: "Failed to assign invoice" });
    }
  });

  // Assign a commission to an order
  app.put('/api/financial-matching/assign-commission', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const { commissionId, orderId } = req.body;

      if (!commissionId || orderId === undefined) {
        return res.status(400).json({ message: "Commission ID and Order ID are required" });
      }

      // Update the commission
      await db
        .update(commissions)
        .set({ orderId: orderId || null })
        .where(eq(commissions.id, commissionId));

      res.json({ message: "Commission assigned successfully" });
    } catch (error) {
      console.error("Error assigning commission:", error);
      res.status(500).json({ message: "Failed to assign commission" });
    }
  });

  // Create a custom financial entry
  app.post('/api/financial-matching/custom-entry', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId, entryType, description, amount, date, category, notes } = req.body;

      if (!orderId || !entryType || !description || !amount || !date) {
        return res.status(400).json({ message: "Order ID, entry type, description, amount, and date are required" });
      }

      const [entry] = await db
        .insert(customFinancialEntries)
        .values({
          orderId,
          entryType,
          description,
          amount,
          date,
          category,
          notes,
          createdBy: authReq.user?.claims.sub || ''
        })
        .returning();

      res.json(entry);
    } catch (error) {
      console.error("Error creating custom financial entry:", error);
      res.status(500).json({ message: "Failed to create custom financial entry" });
    }
  });

  // Delete a custom financial entry
  app.delete('/api/financial-matching/custom-entry/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const entryId = parseInt(req.params.id);

      await db
        .delete(customFinancialEntries)
        .where(eq(customFinancialEntries.id, entryId));

      res.json({ message: "Custom financial entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting custom financial entry:", error);
      res.status(500).json({ message: "Failed to delete custom financial entry" });
    }
  });
}
