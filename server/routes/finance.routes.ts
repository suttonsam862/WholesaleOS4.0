import type { Express } from "express";
import { storage } from "../storage";
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
}
