import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, filterDataByRole, type AuthenticatedRequest, type UserRole } from "./shared/middleware";
import { insertQuoteSchema, insertQuoteLineItemSchema } from "@shared/schema";
import { z } from "zod";
import jsPDF from "jspdf";
import "jspdf-autotable";
import sgMail from "@sendgrid/mail";
import * as fs from "fs";
import * as path from "path";

export function registerQuoteRoutes(app: Express): void {
  // Quotes API
  app.get('/api/quotes', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const quotes = await storage.getQuotes();
      const filteredQuotes = filterDataByRole(
        quotes,
        (req as AuthenticatedRequest).user.userData!.role as UserRole,
        (req as AuthenticatedRequest).user.userData!.id,
        'quotes'
      );
      res.json(filteredQuotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteWithLineItems(id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Check if user can view this quote
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && quote.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post('/api/quotes', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      
      // Separate line items from quote data
      const { lineItems, ...quoteData } = req.body;

      // Convert IDs from strings to numbers, handle empty contactId
      const processedQuoteData = {
        ...quoteData,
        orgId: parseInt(quoteData.orgId),
        contactId: quoteData.contactId ? parseInt(quoteData.contactId) : undefined,
      };

      const validatedQuote = insertQuoteSchema.parse(processedQuoteData);

      // Sales users can only create quotes for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedQuote.salespersonId = (req as AuthenticatedRequest).user.userData!.id;
      }

      // If line items are provided, validate and create quote with line items
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        const validatedLineItems = lineItems.map((item: any, index: number) => {
          return insertQuoteLineItemSchema.parse(item);
        });

        const quoteWithLineItems = await storage.createQuoteWithLineItems(
          validatedQuote,
          validatedLineItems
        );

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'quote',
          quoteWithLineItems.id,
          'created',
          null,
          quoteWithLineItems
        );

        res.status(201).json(quoteWithLineItems);
      } else {
        // Create quote without line items
        const quote = await storage.createQuote(validatedQuote);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'quote',
          quote.id,
          'created',
          null,
          quote
        );

        res.status(201).json(quote);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[QUOTE CREATE] Validation failed:", JSON.stringify(error.errors, null, 2));
        console.error("[QUOTE CREATE] Request body was:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("[QUOTE CREATE] Error creating quote:", error);
      console.error("[QUOTE CREATE] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("[QUOTE CREATE] Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
        constraint: (error as any)?.constraint
      });
      res.status(500).json({ 
        message: "Failed to create quote",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuoteSchema.partial().parse(req.body);

      const existingQuote = await storage.getQuote(id);
      if (!existingQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Sales users can only update their own quotes
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales' && 
          existingQuote.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedQuote = await storage.updateQuote(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'quote',
        id,
        'updated',
        existingQuote,
        updatedQuote
      );

      res.json(updatedQuote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingQuote = await storage.getQuote(id);
      if (!existingQuote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Only allow deletion if quote is in draft status
      if (existingQuote.status !== 'draft') {
        return res.status(400).json({ message: "Can only delete draft quotes" });
      }

      await storage.deleteQuote(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'quote',
        id,
        'deleted',
        existingQuote,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // Quote line items API
  app.get('/api/quotes/:id/line-items', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      const lineItems = await storage.getQuoteLineItems(quoteId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching quote line items:", error);
      res.status(500).json({ message: "Failed to fetch quote line items" });
    }
  });

  app.post('/api/quotes/:id/line-items', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const quoteId = parseInt(req.params.id);
      
      // Handle both single item and array of items
      const items = Array.isArray(req.body) ? req.body : [req.body];
      
      // Validate and create all line items
      const createdItems = [];
      for (const item of items) {
        // Validate the item (schema omits quoteId)
        const validatedData = insertQuoteLineItemSchema.parse(item);
        // Inject quoteId after validation
        const lineItemWithQuoteId = {
          ...validatedData,
          quoteId
        };
        const lineItem = await storage.createQuoteLineItem(lineItemWithQuoteId);
        createdItems.push(lineItem);
      }
      
      // Return single item or array based on input
      res.status(201).json(Array.isArray(req.body) ? createdItems : createdItems[0]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating quote line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in quote line item");
        if (errorObj?.constraint?.includes('variant')) {
          return res.status(400).json({ 
            message: "Invalid variant",
            details: "The selected variant does not exist or has been deleted.",
            field: "variantId"
          });
        }
        if (errorObj?.constraint?.includes('quote')) {
          return res.status(400).json({ 
            message: "Invalid quote",
            details: "The quote does not exist or has been deleted.",
            field: "quoteId"
          });
        }
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "One of the referenced items does not exist.",
        });
      }

      res.status(500).json({ 
        message: "Failed to create quote line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put('/api/quotes/:quoteId/line-items/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertQuoteLineItemSchema.partial().parse(req.body);

      const updatedLineItem = await storage.updateQuoteLineItem(id, validatedData);
      res.json(updatedLineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating quote line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in quote line item");
        if (errorObj?.constraint?.includes('variant')) {
          return res.status(400).json({ 
            message: "Invalid variant",
            details: "The selected variant does not exist or has been deleted.",
            field: "variantId"
          });
        }
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "One of the referenced items does not exist.",
        });
      }

      res.status(500).json({ 
        message: "Failed to update quote line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/quotes/:quoteId/line-items/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteQuoteLineItem(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote line item:", error);
      res.status(500).json({ message: "Failed to delete quote line item" });
    }
  });

  // Business Logic Endpoints
  app.post('/api/calculate-price', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { variantId, quantity } = req.body;

      if (!variantId || !quantity) {
        return res.status(400).json({ message: "Variant ID and quantity are required" });
      }

      // Get the variant to calculate pricing
      const variant = await storage.getProductVariant(parseInt(variantId));
      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      // Simple pricing calculation based on MSRP
      const unitPrice = parseFloat(variant.msrp || '0');
      const total = unitPrice * parseInt(quantity);

      res.json({ 
        unitPrice: unitPrice.toFixed(2), 
        quantity: parseInt(quantity),
        total: total.toFixed(2)
      });
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  app.get('/api/lead-assignment', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const { territory } = req.query;

      const suggestedSalesperson = await storage.suggestSalespersonForLead(
        territory as string | undefined
      );

      if (!suggestedSalesperson) {
        return res.json({ message: "No suitable salesperson found", salesperson: null });
      }

      res.json({ salesperson: suggestedSalesperson });
    } catch (error) {
      console.error("Error getting lead assignment suggestion:", error);
      res.status(500).json({ message: "Failed to get assignment suggestion" });
    }
  });

  // PDF Generation Endpoint
  app.post('/api/quotes/:id/pdf', isAuthenticated, loadUserData, requirePermission('quotes', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteWithLineItems(id);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Get organization details
      let organization = null;
      if (quote.orgId) {
        organization = await storage.getOrganization(quote.orgId);
      }

      // Generate PDF
      const pdfBuffer = generateQuotePDFServer(quote, quote.lineItems || [], organization);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quote-${quote.quoteCode || id}.pdf"`);
      res.send(Buffer.from(pdfBuffer));

    } catch (error) {
      console.error("Error generating quote PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Email Send Endpoint
  app.post('/api/quotes/:id/send-email', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getQuoteWithLineItems(id);

      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }

      // Get organization and contact details
      let organization = null;
      let contact = null;
      if (quote.orgId) {
        organization = await storage.getOrganization(quote.orgId);
      }
      if (quote.contactId) {
        contact = await storage.getContact(quote.contactId);
      }

      // Determine recipient email
      const recipientEmail = req.body.email || contact?.email;
      if (!recipientEmail) {
        return res.status(400).json({ message: "No recipient email address found. Please provide an email or ensure the contact has an email address." });
      }

      // Get SendGrid credentials from Replit connector
      const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
      const xReplitToken = process.env.REPL_IDENTITY 
        ? 'repl ' + process.env.REPL_IDENTITY 
        : process.env.WEB_REPL_RENEWAL 
        ? 'depl ' + process.env.WEB_REPL_RENEWAL 
        : null;

      if (!xReplitToken || !hostname) {
        return res.status(500).json({ message: "SendGrid not configured. Please connect SendGrid integration." });
      }

      const connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(r => r.json()).then(data => data.items?.[0]);

      if (!connectionSettings?.settings?.api_key || !connectionSettings?.settings?.from_email) {
        return res.status(500).json({ message: "SendGrid not connected. Please set up SendGrid integration." });
      }

      const apiKey = connectionSettings.settings.api_key;
      const fromEmail = connectionSettings.settings.from_email;

      // Generate PDF for attachment
      const pdfBuffer = generateQuotePDFServer(quote, quote.lineItems || [], organization);
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      // Calculate totals for email summary
      const subtotal = parseFloat(quote.subtotal || '0');
      const discount = parseFloat(quote.discount || '0');
      const taxAmount = parseFloat(quote.taxAmount || '0');
      const total = parseFloat(quote.total || '0');

      const lineItemsHtml = (quote.lineItems || []).map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.itemName || item.description || 'Item'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity || 0}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${parseFloat(item.unitPrice || '0').toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${parseFloat(item.lineTotal || '0').toFixed(2)}</td>
        </tr>
      `).join('');

      const validUntilDate = quote.validUntil 
        ? new Date(quote.validUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Not specified';

      // Build email content
      sgMail.setApiKey(apiKey);
      const msg = {
        to: recipientEmail,
        from: fromEmail,
        subject: `Quote ${quote.quoteCode} from Rich Habits LLC`,
        text: `Hello,

Thank you for your interest in Rich Habits LLC. Please find attached your quote ${quote.quoteCode}.

Quote Summary:
- Quote Number: ${quote.quoteCode}
- Valid Until: ${validUntilDate}
- Total: $${total.toFixed(2)}

Please review the attached PDF for complete details.

If you have any questions, please don't hesitate to reach out.

Best regards,
Rich Habits LLC`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #19305b 0%, #2a4a8a 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Quote ${quote.quoteCode}</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Rich Habits LLC</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hello${organization ? ` ${organization.name}` : ''},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Thank you for your interest in Rich Habits LLC. Please find your quote details below.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f9fafb; border-radius: 6px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 5px; font-size: 13px; color: #6b7280;">Quote Number</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${quote.quoteCode}</p>
                  </td>
                  <td style="padding: 15px;">
                    <p style="margin: 0 0 5px; font-size: 13px; color: #6b7280;">Valid Until</p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${validUntilDate}</p>
                  </td>
                </tr>
              </table>
              
              ${quote.lineItems && quote.lineItems.length > 0 ? `
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #19305b; color: white;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Item</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600;">Qty</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Unit Price</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsHtml}
                </tbody>
              </table>
              ` : ''}
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 5px 0; text-align: right; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 5px 0 5px 20px; text-align: right; font-weight: 500; width: 120px;">$${subtotal.toFixed(2)}</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; text-align: right; color: #6b7280;">Discount:</td>
                  <td style="padding: 5px 0 5px 20px; text-align: right; font-weight: 500; color: #10b981;">-$${discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 5px 0; text-align: right; color: #6b7280;">Tax:</td>
                  <td style="padding: 5px 0 5px 20px; text-align: right; font-weight: 500;">$${taxAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: 700; color: #19305b;">Total:</td>
                  <td style="padding: 10px 0 10px 20px; text-align: right; font-size: 18px; font-weight: 700; color: #19305b;">$${total.toFixed(2)}</td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Please review the attached PDF for complete details including terms and conditions.
              </p>
              
              <p style="margin: 20px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                If you have any questions, please don't hesitate to reach out.
              </p>
              
              <p style="margin: 30px 0 0; font-size: 16px; color: #333333;">
                Best regards,<br>
                <strong>Rich Habits LLC</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #6c757d; text-align: center;">
                3101 Whitehall Rd, Birmingham, AL 35209
              </p>
              <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: #6c757d; text-align: center;">
                © ${new Date().getFullYear()} Rich Habits LLC. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        attachments: [
          {
            content: pdfBase64,
            filename: `Quote-${quote.quoteCode}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      await sgMail.send(msg);

      // Update quote status to "sent" if it was a draft
      if (quote.status === 'draft') {
        await storage.updateQuote(id, { status: 'sent' });
      }

      res.json({ 
        success: true, 
        message: `Quote sent successfully to ${recipientEmail}` 
      });
    } catch (error: any) {
      console.error("Error sending quote email:", error);
      const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error';
      res.status(500).json({ message: `Failed to send email: ${errorMessage}` });
    }
  });
}

// Server-side PDF generation function
function generateQuotePDFServer(quote: any, lineItems: any[], organization: any): ArrayBuffer {
  const doc = new jsPDF();

  const primaryColor: [number, number, number] = [25, 48, 91]; // Navy blue
  const lightGray: [number, number, number] = [245, 245, 245];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = margin;

  // Header - "QUOTE" title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(...primaryColor);
  doc.text('QUOTE', margin, yPosition + 15);

  // Company name on right
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rich Habits LLC', pageWidth - margin, yPosition + 10, { align: 'right' });

  yPosition += 25;

  // Company address
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Developing Habits LLC', margin, yPosition);
  yPosition += 5;
  doc.text('3101 Whitehall Rd', margin, yPosition);
  yPosition += 5;
  doc.text('Birmingham, AL 35209', margin, yPosition);

  yPosition += 15;

  // Customer & Quote Info Section (3 columns)
  const colWidth = (pageWidth - 2 * margin) / 3;
  const col1X = margin;
  const col2X = margin + colWidth;
  const col3X = margin + 2 * colWidth;

  const sectionStartY = yPosition;

  // BILL TO
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('BILL TO:', col1X, yPosition);
  
  let billToY = yPosition + 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  if (quote.customerAddress) {
    const addressLines = doc.splitTextToSize(quote.customerAddress, colWidth - 5);
    doc.text(addressLines, col1X, billToY);
  } else if (organization) {
    doc.text(organization.name || 'N/A', col1X, billToY);
    billToY += 4;
    if (organization.city || organization.state) {
      const location = [organization.city, organization.state].filter(Boolean).join(', ');
      doc.text(location, col1X, billToY);
      billToY += 4;
    }
    if (organization.shippingAddress) {
      const addressLines = doc.splitTextToSize(organization.shippingAddress, colWidth - 5);
      doc.text(addressLines[0], col1X, billToY);
    }
  } else {
    doc.text('N/A', col1X, billToY);
  }

  // SHIP TO
  let shipToY = sectionStartY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('SHIP TO:', col2X, sectionStartY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  if (quote.customerShippingAddress) {
    const lines = doc.splitTextToSize(quote.customerShippingAddress, colWidth - 5);
    doc.text(lines, col2X, shipToY);
  } else if (organization?.shippingAddress) {
    const lines = doc.splitTextToSize(organization.shippingAddress, colWidth - 5);
    doc.text(lines, col2X, shipToY);
  } else {
    doc.text('Same as billing', col2X, shipToY);
  }

  // Quote Info
  let quoteInfoY = sectionStartY;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('QUOTE #:', col3X, quoteInfoY);
  quoteInfoY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(quote.quoteCode || 'N/A', col3X + 25, quoteInfoY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('QUOTE DATE:', col3X, quoteInfoY);
  quoteInfoY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const quoteDate = quote.createdAt 
    ? new Date(quote.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'N/A';
  doc.text(quoteDate, col3X + 25, quoteInfoY - 5);

  if (quote.validUntil) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('VALID UNTIL:', col3X, quoteInfoY);
    quoteInfoY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const validUntil = new Date(quote.validUntil).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    doc.text(validUntil, col3X + 25, quoteInfoY - 5);
  }

  yPosition = Math.max(billToY, shipToY, quoteInfoY);
  yPosition += 10;

  // Line Items Table
  if (lineItems && lineItems.length > 0) {
    const tableData = lineItems.map((item) => {
      const description = item.itemName && item.description 
        ? `${item.itemName}\n${item.description}`
        : item.itemName || item.description || 'N/A';
      
      const qty = item.quantity?.toString() || '0';
      const unitPrice = `$${parseFloat(item.unitPrice || '0').toFixed(2)}`;
      const amount = `$${parseFloat(item.lineTotal || '0').toFixed(2)}`;

      return [qty, description, unitPrice, amount];
    });

    (doc as any).autoTable({
      startY: yPosition,
      head: [['QTY', 'DESCRIPTION', 'UNIT PRICE', 'AMOUNT']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Totals Section
  const totalsX = pageWidth - margin - 60;
  const labelsX = totalsX - 40;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  // Subtotal
  doc.text('Subtotal:', labelsX, yPosition, { align: 'right' });
  doc.text(`$${parseFloat(quote.subtotal || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
  yPosition += 6;

  // Discount
  if (quote.discount && parseFloat(quote.discount) > 0) {
    doc.text('Discount:', labelsX, yPosition, { align: 'right' });
    doc.text(`-$${parseFloat(quote.discount || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
    yPosition += 6;
  }

  // Tax
  const taxRatePercent = (parseFloat(quote.taxRate || '0') * 100).toFixed(2);
  doc.text(`Sales Tax (${taxRatePercent}%):`, labelsX, yPosition, { align: 'right' });
  doc.text(`$${parseFloat(quote.taxAmount || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });
  yPosition += 8;

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL:', labelsX, yPosition, { align: 'right' });
  doc.text(`$${parseFloat(quote.total || '0').toFixed(2)}`, totalsX + 60, yPosition, { align: 'right' });

  yPosition += 15;

  // Thank you message
  if (yPosition < pageHeight - 40) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for your business!', margin, yPosition);
    yPosition += 8;
  }

  // Terms & Conditions
  if (quote.termsAndConditions || quote.notes) {
    if (yPosition > pageHeight - 35) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.text('Terms & Conditions', margin, yPosition);
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    const termsText = quote.termsAndConditions || quote.notes || '';
    const lines = doc.splitTextToSize(termsText, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
  }

  return doc.output('arraybuffer');
}
