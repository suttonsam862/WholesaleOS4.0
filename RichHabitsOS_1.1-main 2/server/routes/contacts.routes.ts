import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { leads, quotes } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import { insertContactSchema } from "@shared/schema";
import { z } from "zod";

export function registerContactRoutes(app: Express): void {
  // Contacts
  app.get('/api/contacts', isAuthenticated, loadUserData, requirePermission('contacts', 'read'), async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.post('/api/contacts', isAuthenticated, loadUserData, requirePermission('contacts', 'write'), async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'contact',
        contact.id,
        'created',
        null,
        contact
      );

      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put('/api/contacts/:id', isAuthenticated, loadUserData, requirePermission('contacts', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingContact = await storage.getContact(id);

      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      const validatedData = insertContactSchema.partial().parse(req.body);
      const updatedContact = await storage.updateContact(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'contact',
        id,
        'updated',
        existingContact,
        updatedContact
      );

      res.json(updatedContact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating contact:", error);
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete('/api/contacts/:id', isAuthenticated, loadUserData, requirePermission('contacts', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingContact = await storage.getContact(id);

      if (!existingContact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      // Check if contact has related records
      const relatedLeads = await db.select().from(leads).where(eq(leads.contactId, id));
      const relatedQuotes = await db.select().from(quotes).where(eq(quotes.contactId, id));

      if (relatedLeads.length > 0 || relatedQuotes.length > 0) {
        return res.status(409).json({ 
          message: `Cannot delete contact. This contact has ${relatedLeads.length} related lead(s) and ${relatedQuotes.length} related quote(s). Please remove or reassign these records first.`
        });
      }

      await storage.deleteContact(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'contact',
        id,
        'deleted',
        existingContact,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Organization-specific contact routes
  app.get('/api/organizations/:id/contacts', isAuthenticated, loadUserData, requirePermission('contacts', 'read'), async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const contacts = await storage.getContactsByOrganization(orgId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching organization contacts:", error);
      res.status(500).json({ message: "Failed to fetch organization contacts" });
    }
  });

  app.get('/api/organizations/:id/contacts/customers', isAuthenticated, loadUserData, requirePermission('contacts', 'read'), async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      const customers = await storage.getCustomerContactsByOrganization(orgId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customer contacts:", error);
      res.status(500).json({ message: "Failed to fetch customer contacts" });
    }
  });
}
