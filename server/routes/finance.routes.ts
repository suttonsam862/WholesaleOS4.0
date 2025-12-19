import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { orders, invoices, invoicePayments, commissions, commissionPayments, salespersons, users, quotes, organizations, orderLineItems } from "@shared/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import { insertInvoiceSchema, insertInvoicePaymentSchema, insertCommissionPaymentSchema, insertProductCogsSchema, insertFinancialTransactionSchema } from "@shared/schema";
import { z } from "zod";

export function registerFinanceRoutes(app: Express): void {
  // Financial Transaction routes
  app.get('/api/financial/transactions', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { type, status, salespersonId, startDate, endDate } = req.query;
      const transactions = await storage.getFinancialTransactions({
        type: type as string,
        status: status as string,
        salespersonId: salespersonId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching financial transactions:", error);
      res.status(500).json({ message: "Failed to fetch financial transactions" });
    }
  });

  app.get('/api/financial/transactions/:id', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getFinancialTransaction(id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching financial transaction:", error);
      res.status(500).json({ message: "Failed to fetch financial transaction" });
    }
  });

  app.post('/api/financial/transactions', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const transactionData = insertFinancialTransactionSchema.parse(req.body);
      const transaction = await storage.createFinancialTransaction(transactionData);

      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'financial_transaction',
        transaction.id,
        'created',
        null,
        transaction
      );

      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating financial transaction:", error);
      res.status(500).json({ message: "Failed to create financial transaction" });
    }
  });

  app.patch('/api/financial/transactions/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingTransaction = await storage.getFinancialTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const transaction = await storage.updateFinancialTransaction(id, req.body);

      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'financial_transaction',
        id,
        'updated',
        existingTransaction,
        transaction
      );

      res.json(transaction);
    } catch (error: any) {
      console.error("Error updating financial transaction:", error);
      res.status(400).json({ message: error.message || "Failed to update financial transaction" });
    }
  });

  app.delete('/api/financial/transactions/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingTransaction = await storage.getFinancialTransaction(id);
      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      await storage.deleteFinancialTransaction(id);

      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'financial_transaction',
        id,
        'deleted',
        existingTransaction,
        null
      );

      res.json({ message: "Transaction deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting financial transaction:", error);
      res.status(400).json({ message: error.message || "Failed to delete financial transaction" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.get('/api/invoices/organization/:orgId', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const orgId = parseInt(req.params.orgId);
      const invoices = await storage.getInvoicesByOrganization(orgId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching organization invoices:", error);
      res.status(500).json({ message: "Failed to fetch organization invoices" });
    }
  });

  app.post('/api/invoices', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      console.log('=== INVOICE CREATION START ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', (req as AuthenticatedRequest).user.userData?.id);

      // Ensure createdBy is set if not provided
      const invoiceData = {
        ...req.body,
        createdBy: req.body.createdBy || (req as AuthenticatedRequest).user.userData!.id
      };

      console.log('Invoice data with createdBy:', JSON.stringify(invoiceData, null, 2));

      const validatedData = insertInvoiceSchema.parse(invoiceData);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      const invoice = await storage.createInvoice(validatedData);
      console.log('Invoice created successfully:', invoice.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'invoice',
        invoice.id,
        'created',
        null,
        invoice
      );

      console.log('=== INVOICE CREATION SUCCESS ===');
      res.status(201).json(invoice);
    } catch (error) {
      console.error("=== INVOICE CREATION ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Request body:", JSON.stringify(req.body, null, 2));

      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "The order or organization does not exist.",
        });
      }

      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ 
        message: "Failed to create invoice",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.patch('/api/invoices/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.updateInvoice(id, req.body);
      res.json(invoice);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      res.status(400).json({ message: error.message || "Failed to update invoice" });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoice(id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      res.status(400).json({ message: error.message || "Failed to delete invoice" });
    }
  });

  // Invoice Payment routes
  app.get('/api/invoice-payments', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const invoiceId = req.query.invoiceId ? parseInt(req.query.invoiceId as string) : undefined;
      const payments = await storage.getInvoicePayments(invoiceId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching invoice payments:", error);
      res.status(500).json({ message: "Failed to fetch invoice payments" });
    }
  });

  app.get('/api/invoice-payments/:id', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getInvoicePayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Invoice payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching invoice payment:", error);
      res.status(500).json({ message: "Failed to fetch invoice payment" });
    }
  });

  app.post('/api/invoice-payments', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const validatedData = insertInvoicePaymentSchema.parse(req.body);
      const payment = await storage.createInvoicePayment(validatedData);
      res.json(payment);
    } catch (error: any) {
      console.error("Error creating invoice payment:", error);
      res.status(400).json({ message: error.message || "Failed to create invoice payment" });
    }
  });

  app.patch('/api/invoice-payments/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.updateInvoicePayment(id, req.body);
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating invoice payment:", error);
      res.status(400).json({ message: error.message || "Failed to update invoice payment" });
    }
  });

  app.delete('/api/invoice-payments/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInvoicePayment(id);
      res.json({ message: "Invoice payment deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting invoice payment:", error);
      res.status(400).json({ message: error.message || "Failed to delete invoice payment" });
    }
  });

  // Commission Payment routes
  app.get('/api/commission-payments', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const salespersonId = req.query.salespersonId as string | undefined;
      const payments = await storage.getCommissionPayments(salespersonId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching commission payments:", error);
      res.status(500).json({ message: "Failed to fetch commission payments" });
    }
  });

  app.get('/api/commission-payments/:id', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getCommissionPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Commission payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching commission payment:", error);
      res.status(500).json({ message: "Failed to fetch commission payment" });
    }
  });

  app.post('/api/commission-payments', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const validatedData = insertCommissionPaymentSchema.parse(req.body);
      const payment = await storage.createCommissionPayment(validatedData);
      res.json(payment);
    } catch (error: any) {
      console.error("Error creating commission payment:", error);
      res.status(400).json({ message: error.message || "Failed to create commission payment" });
    }
  });

  app.patch('/api/commission-payments/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.updateCommissionPayment(id, req.body);
      res.json(payment);
    } catch (error: any) {
      console.error("Error updating commission payment:", error);
      res.status(400).json({ message: error.message || "Failed to update commission payment" });
    }
  });

  app.delete('/api/commission-payments/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCommissionPayment(id);
      res.json({ message: "Commission payment deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting commission payment:", error);
      res.status(400).json({ message: error.message || "Failed to delete commission payment" });
    }
  });

  // Commissions routes (commission records, not payments)
  app.get('/api/commissions', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { salespersonId, status, period } = req.query;
      const commissionsData = await storage.getCommissions({
        salespersonId: salespersonId as string,
        status: status as string,
        period: period as string
      });
      res.json(commissionsData);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  // Product COGS routes
  app.get('/api/product-cogs', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const variantId = req.query.variantId ? parseInt(req.query.variantId as string) : undefined;
      const cogs = await storage.getProductCogs(variantId);
      res.json(cogs);
    } catch (error) {
      console.error("Error fetching product COGS:", error);
      res.status(500).json({ message: "Failed to fetch product COGS" });
    }
  });

  app.get('/api/product-cogs/:id', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cogs = await storage.getProductCogsById(id);
      if (!cogs) {
        return res.status(404).json({ message: "Product COGS not found" });
      }
      res.json(cogs);
    } catch (error) {
      console.error("Error fetching product COGS:", error);
      res.status(500).json({ message: "Failed to fetch product COGS" });
    }
  });

  app.get('/api/product-cogs/variant/:variantId', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      const cogs = await storage.getProductCogsByVariant(variantId);
      res.json(cogs || null);
    } catch (error) {
      console.error("Error fetching product COGS by variant:", error);
      res.status(500).json({ message: "Failed to fetch product COGS by variant" });
    }
  });

  app.post('/api/product-cogs', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const validatedData = insertProductCogsSchema.parse(req.body);
      const cogs = await storage.createProductCogs(validatedData);
      res.json(cogs);
    } catch (error: any) {
      console.error("Error creating product COGS:", error);
      res.status(400).json({ message: error.message || "Failed to create product COGS" });
    }
  });

  app.patch('/api/product-cogs/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cogs = await storage.updateProductCogs(id, req.body);
      res.json(cogs);
    } catch (error: any) {
      console.error("Error updating product COGS:", error);
      res.status(400).json({ message: error.message || "Failed to update product COGS" });
    }
  });

  app.delete('/api/product-cogs/:id', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductCogs(id);
      res.json({ message: "Product COGS deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting product COGS:", error);
      res.status(400).json({ message: error.message || "Failed to delete product COGS" });
    }
  });

  // Financial Overview/Dashboard endpoint
  app.get('/api/financial/overview', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const userRole = (req as AuthenticatedRequest).user.userData!.role;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      // Sales users can only see their own financial data
      let salespersonId: string | undefined = undefined;
      if (userRole === 'sales') {
        salespersonId = userId;
      }

      const overview = await storage.getFinancialOverview(startDate as string, endDate as string, salespersonId);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching financial overview:", error);
      res.status(500).json({ message: "Failed to fetch financial overview" });
    }
  });

  // ============================================
  // FINANCE SUGGESTION ENDPOINTS
  // ============================================

  // Helper function to safely parse a numeric value
  function safeParseFloat(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // Helper function to calculate order total from line items
  async function calculateOrderTotal(orderId: number): Promise<number> {
    if (!orderId || isNaN(orderId)) return 0;
    
    const lineItems = await db.select().from(orderLineItems).where(eq(orderLineItems.orderId, orderId));
    return lineItems.reduce((sum, item) => {
      const unitPrice = safeParseFloat(item.unitPrice, 0);
      const quantity = safeParseFloat(item.yxs, 0) + safeParseFloat(item.ys, 0) + safeParseFloat(item.ym, 0) + safeParseFloat(item.yl, 0) + 
                       safeParseFloat(item.xs, 0) + safeParseFloat(item.s, 0) + safeParseFloat(item.m, 0) + safeParseFloat(item.l, 0) + 
                       safeParseFloat(item.xl, 0) + safeParseFloat(item.xxl, 0) + safeParseFloat(item.xxxl, 0) + safeParseFloat(item.xxxxl, 0);
      return sum + (unitPrice * quantity);
    }, 0);
  }

  // Get invoice amount suggestions for an organization or order
  app.get('/api/finance/suggestions/invoice', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { orgId, orderId } = req.query;
      
      // Validate query params - at least one must be provided
      const parsedOrgId = orgId ? parseInt(orgId as string) : null;
      const parsedOrderId = orderId ? parseInt(orderId as string) : null;
      
      // Return empty suggestions if no valid params provided
      if (!parsedOrgId && !parsedOrderId) {
        return res.json({ suggestions: [] });
      }
      
      // Validate parsed values aren't NaN
      if ((orgId && isNaN(parsedOrgId!)) || (orderId && isNaN(parsedOrderId!))) {
        return res.status(400).json({ message: "Invalid orgId or orderId provided" });
      }
      
      const suggestions: Array<{
        label: string;
        value: string;
        source: 'order' | 'quote' | 'outstanding';
        confidence: 'high' | 'medium' | 'low';
        details?: Record<string, any>;
      }> = [];

      // If an order is selected, get its details first
      if (parsedOrderId) {
        const [order] = await db.select().from(orders).where(eq(orders.id, parsedOrderId));
        
        if (order) {
          // Calculate order total from line items
          const orderTotal = await calculateOrderTotal(parsedOrderId);
          
          if (orderTotal > 0) {
            // Check existing invoices for this order
            const existingInvoices = await db.select().from(invoices).where(eq(invoices.orderId, parsedOrderId));
            const totalInvoiced = existingInvoices.reduce((sum, inv) => sum + safeParseFloat(inv.totalAmount, 0), 0);
            const outstanding = orderTotal - totalInvoiced;

            suggestions.push({
              label: `Order Total: $${orderTotal.toFixed(2)}`,
              value: orderTotal.toFixed(2),
              source: 'order',
              confidence: existingInvoices.length === 0 ? 'high' : 'medium',
              details: { orderId: order.id, orderCode: order.orderCode }
            });

            if (totalInvoiced > 0 && outstanding > 0) {
              suggestions.push({
                label: `Outstanding Balance: $${outstanding.toFixed(2)}`,
                value: outstanding.toFixed(2),
                source: 'outstanding',
                confidence: 'high',
                details: { alreadyInvoiced: totalInvoiced, remaining: outstanding }
              });
            }

            // Common payment patterns
            if (existingInvoices.length === 0) {
              suggestions.push({
                label: `50% Deposit: $${(orderTotal * 0.5).toFixed(2)}`,
                value: (orderTotal * 0.5).toFixed(2),
                source: 'order',
                confidence: 'medium',
                details: { pattern: 'deposit' }
              });
            }
          }
        }
      }

      // If organization is selected (or inferred from order), get all their unpaid orders
      if (parsedOrgId) {
        const orgOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.orgId, parsedOrgId))
          .orderBy(desc(orders.createdAt));

        for (const order of orgOrders) {
          // Skip if we already processed this order above
          if (parsedOrderId && order.id === parsedOrderId) continue;
          
          const orderTotal = await calculateOrderTotal(order.id);
          
          if (orderTotal > 0) {
            const existingInvoices = await db.select().from(invoices).where(eq(invoices.orderId, order.id));
            const totalInvoiced = existingInvoices.reduce((sum, inv) => sum + safeParseFloat(inv.totalAmount, 0), 0);
            const outstanding = orderTotal - totalInvoiced;

            if (outstanding > 0) {
              suggestions.push({
                label: `Order ${order.orderCode}: $${outstanding.toFixed(2)} outstanding`,
                value: outstanding.toFixed(2),
                source: 'outstanding',
                confidence: existingInvoices.length > 0 ? 'high' : 'medium',
                details: { orderId: order.id, orderCode: order.orderCode, orderName: order.orderName, total: orderTotal, invoiced: totalInvoiced }
              });
            }
          }
        }

        // Get accepted quotes for this organization
        const orgQuotes = await db
          .select()
          .from(quotes)
          .where(and(eq(quotes.orgId, parsedOrgId), eq(quotes.status, 'accepted')))
          .orderBy(desc(quotes.createdAt));

        for (const quote of orgQuotes) {
          if (quote.total) {
            suggestions.push({
              label: `Quote ${quote.quoteCode}: $${parseFloat(quote.total).toFixed(2)}`,
              value: quote.total,
              source: 'quote',
              confidence: 'medium',
              details: { quoteId: quote.id, quoteCode: quote.quoteCode }
            });
          }
        }
      }

      res.json({ suggestions });
    } catch (error) {
      console.error("Error fetching invoice suggestions:", error);
      res.status(500).json({ message: "Failed to fetch invoice suggestions" });
    }
  });

  // Get commission calculation suggestions for a salesperson
  app.get('/api/finance/suggestions/commission/:salespersonId', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { salespersonId } = req.params;
      const { period } = req.query; // YYYY-MM format
      
      // Get salesperson details and commission rate
      const [salesperson] = await db
        .select()
        .from(salespersons)
        .where(eq(salespersons.userId, salespersonId));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, salespersonId));

      const commissionRate = salesperson ? parseFloat(salesperson.commissionRate || '0.10') : 0.10;

      // Get all orders for this salesperson
      const salespersonOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.salespersonId, salespersonId))
        .orderBy(desc(orders.createdAt));

      // Filter by period if provided
      const targetPeriod = period as string || new Date().toISOString().slice(0, 7);
      const periodStart = new Date(targetPeriod + '-01');
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const periodOrders = salespersonOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= periodStart && orderDate < periodEnd;
      });

      // Calculate total sales for the period - need to calculate order totals from line items
      let totalSales = 0;
      const orderBreakdownData: Array<{orderId: number, orderCode: string, orderName: string, amount: number, commission: number, createdAt: Date | null}> = [];
      
      for (const order of periodOrders) {
        const orderTotal = await calculateOrderTotal(order.id);
        totalSales += orderTotal;
        orderBreakdownData.push({
          orderId: order.id,
          orderCode: order.orderCode,
          orderName: order.orderName,
          amount: orderTotal,
          commission: orderTotal * commissionRate,
          createdAt: order.createdAt
        });
      }

      // Calculate gross commission
      const grossCommission = totalSales * commissionRate;

      // Get already paid commissions for this period
      const paidCommissions = await db
        .select()
        .from(commissionPayments)
        .where(and(
          eq(commissionPayments.salespersonId, salespersonId),
          eq(commissionPayments.period, targetPeriod)
        ));

      const totalPaid = paidCommissions.reduce((sum, payment) => {
        return sum + parseFloat(payment.totalAmount || '0');
      }, 0);

      // Get pending commissions (from commissions table)
      const pendingCommissions = await db
        .select()
        .from(commissions)
        .where(and(
          eq(commissions.salespersonId, salespersonId),
          eq(commissions.status, 'pending')
        ));

      const totalPending = pendingCommissions.reduce((sum, comm) => {
        return sum + parseFloat(comm.commissionAmount || '0');
      }, 0);

      // Calculate suggested payment
      const suggestedPayment = Math.max(0, grossCommission - totalPaid);

      res.json({
        salesperson: {
          id: salespersonId,
          name: user?.name || user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown',
          commissionRate: commissionRate * 100 // as percentage
        },
        period: targetPeriod,
        summary: {
          totalSales,
          commissionRate: commissionRate * 100,
          grossCommission,
          alreadyPaid: totalPaid,
          pendingApproval: totalPending,
          suggestedPayment
        },
        suggestions: [
          {
            label: `Full Period Commission: $${suggestedPayment.toFixed(2)}`,
            value: suggestedPayment.toFixed(2),
            confidence: 'high' as const,
            details: { type: 'full_period' }
          },
          ...(totalPending > 0 ? [{
            label: `Pending Commissions Only: $${totalPending.toFixed(2)}`,
            value: totalPending.toFixed(2),
            confidence: 'high' as const,
            details: { type: 'pending_only', count: pendingCommissions.length }
          }] : [])
        ],
        orderBreakdown: orderBreakdownData
      });
    } catch (error) {
      console.error("Error fetching commission suggestions:", error);
      res.status(500).json({ message: "Failed to fetch commission suggestions" });
    }
  });

  // Get payment suggestions for an invoice
  app.get('/api/finance/suggestions/payment/:invoiceId', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Get existing payments for this invoice
      const existingPayments = await db
        .select()
        .from(invoicePayments)
        .where(eq(invoicePayments.invoiceId, invoiceId));

      const totalPaid = existingPayments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount || '0');
      }, 0);

      const invoiceTotal = parseFloat(invoice.totalAmount || '0');
      const outstandingBalance = Math.max(0, invoiceTotal - totalPaid);

      // Build suggestions
      const suggestions: Array<{
        label: string;
        value: string;
        confidence: 'high' | 'medium' | 'low';
        details?: Record<string, any>;
      }> = [];

      // Always suggest outstanding balance first
      if (outstandingBalance > 0) {
        suggestions.push({
          label: `Full Outstanding Balance: $${outstandingBalance.toFixed(2)}`,
          value: outstandingBalance.toFixed(2),
          confidence: 'high',
          details: { type: 'full_balance' }
        });

        // Common payment patterns
        if (existingPayments.length === 0) {
          // No payments yet - suggest deposit patterns
          suggestions.push({
            label: `50% Deposit: $${(invoiceTotal * 0.5).toFixed(2)}`,
            value: (invoiceTotal * 0.5).toFixed(2),
            confidence: 'medium',
            details: { type: 'deposit', percentage: 50 }
          });
          
          suggestions.push({
            label: `33% Payment (1/3): $${(invoiceTotal / 3).toFixed(2)}`,
            value: (invoiceTotal / 3).toFixed(2),
            confidence: 'medium',
            details: { type: 'installment', percentage: 33 }
          });
        } else if (existingPayments.length === 1 && totalPaid / invoiceTotal < 0.6) {
          // One payment made, likely a deposit - suggest remaining
          suggestions.push({
            label: `Remaining After Deposit: $${outstandingBalance.toFixed(2)}`,
            value: outstandingBalance.toFixed(2),
            confidence: 'high',
            details: { type: 'remaining_after_deposit' }
          });
        }
      } else {
        suggestions.push({
          label: 'Invoice Fully Paid',
          value: '0',
          confidence: 'high',
          details: { type: 'fully_paid' }
        });
      }

      // Get organization payment history for smart suggestions
      if (invoice.orgId) {
        const orgInvoices = await db
          .select()
          .from(invoices)
          .where(eq(invoices.orgId, invoice.orgId));

        const orgInvoiceIds = orgInvoices.map(inv => inv.id);
        
        if (orgInvoiceIds.length > 0) {
          const allOrgPayments = await db
            .select()
            .from(invoicePayments)
            .where(inArray(invoicePayments.invoiceId, orgInvoiceIds))
            .orderBy(desc(invoicePayments.paymentDate));

          // Find most common payment method
          const methodCounts = allOrgPayments.reduce((acc, p) => {
            acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const preferredMethod = Object.entries(methodCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'check';

          res.json({
            invoice: {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              total: invoiceTotal,
              paid: totalPaid,
              outstanding: outstandingBalance,
              status: invoice.status
            },
            suggestions,
            paymentHistory: {
              paymentCount: existingPayments.length,
              totalPaid,
              preferredMethod,
              lastPaymentDate: existingPayments[0]?.paymentDate || null
            }
          });
          return;
        }
      }

      res.json({
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          total: invoiceTotal,
          paid: totalPaid,
          outstanding: outstandingBalance,
          status: invoice.status
        },
        suggestions,
        paymentHistory: {
          paymentCount: existingPayments.length,
          totalPaid,
          preferredMethod: 'check',
          lastPaymentDate: existingPayments[0]?.paymentDate || null
        }
      });
    } catch (error) {
      console.error("Error fetching payment suggestions:", error);
      res.status(500).json({ message: "Failed to fetch payment suggestions" });
    }
  });

  // Get expense suggestions for an order
  app.get('/api/finance/suggestions/expense/:orderId', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const suggestions: Array<{
        label: string;
        value: string;
        category: string;
        confidence: 'high' | 'medium' | 'low';
        details?: Record<string, any>;
      }> = [];

      // Calculate order total from line items
      const orderTotal = await calculateOrderTotal(orderId);

      // COGS suggestion (typically 40-60% of order value)
      const estimatedCogs = orderTotal * 0.45;
      suggestions.push({
        label: `Estimated COGS (45%): $${estimatedCogs.toFixed(2)}`,
        value: estimatedCogs.toFixed(2),
        category: 'COGS',
        confidence: 'medium',
        details: { type: 'cogs', percentage: 45 }
      });

      // Shipping suggestion (typically 5-10% of order value)
      const estimatedShipping = orderTotal * 0.07;
      suggestions.push({
        label: `Estimated Shipping (7%): $${estimatedShipping.toFixed(2)}`,
        value: estimatedShipping.toFixed(2),
        category: 'Shipping',
        confidence: 'low',
        details: { type: 'shipping', percentage: 7 }
      });

      // Commission expense (if salesperson assigned)
      if (order.salespersonId) {
        const [salesperson] = await db
          .select()
          .from(salespersons)
          .where(eq(salespersons.userId, order.salespersonId));

        const commissionRate = salesperson ? parseFloat(salesperson.commissionRate || '0.10') : 0.10;
        const commissionAmount = orderTotal * commissionRate;

        suggestions.push({
          label: `Commission Expense (${(commissionRate * 100).toFixed(0)}%): $${commissionAmount.toFixed(2)}`,
          value: commissionAmount.toFixed(2),
          category: 'Commission',
          confidence: 'high',
          details: { type: 'commission', rate: commissionRate * 100, salespersonId: order.salespersonId }
        });
      }

      res.json({
        order: {
          id: order.id,
          orderCode: order.orderCode,
          orderName: order.orderName,
          total: orderTotal
        },
        suggestions
      });
    } catch (error) {
      console.error("Error fetching expense suggestions:", error);
      res.status(500).json({ message: "Failed to fetch expense suggestions" });
    }
  });
}
