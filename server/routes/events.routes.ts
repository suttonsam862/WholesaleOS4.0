import type { Express } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { 
  insertEventSchema, 
  insertEventStageSchema, 
  insertEventStaffSchema,
  insertEventContractorSchema,
  insertContractorPaymentSchema,
  insertContractorFileSchema,
  insertEventMerchandiseSchema,
  insertEventInventoryMovementSchema,
  insertEventBudgetSchema,
  insertEventCampaignSchema,
  insertEventRegistrationSchema,
  insertTourMerchBundleSchema
} from "@shared/schema";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";

export function registerEventRoutes(app: Express) {
  // Event routes
  app.get('/api/events', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventSchema.parse(req.body);
      
      // Convert ISO date strings to Date objects for Drizzle
      const eventData: any = {
        ...validatedData,
        createdBy: userData.id,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      };
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventSchema.partial().parse(req.body);
      
      // Convert ISO date strings to Date objects for Drizzle
      const eventData: any = { ...validatedData };
      if (validatedData.startDate) {
        eventData.startDate = new Date(validatedData.startDate);
      }
      if (validatedData.endDate) {
        eventData.endDate = new Date(validatedData.endDate);
      }
      
      const event = await storage.updateEvent(id, eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEvent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Event Stage routes
  app.get('/api/events/:eventId/stages', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const stages = await storage.getEventStages(eventId);
      res.json(stages);
    } catch (error) {
      console.error("Error fetching event stages:", error);
      res.status(500).json({ message: "Failed to fetch event stages" });
    }
  });

  app.post('/api/events/:eventId/stages', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventStageSchema.parse({ ...req.body, eventId });
      const stage = await storage.createEventStage(validatedData);
      res.status(201).json(stage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event stage:", error);
      res.status(500).json({ message: "Failed to create event stage" });
    }
  });

  app.put('/api/events/stages/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventStageSchema.partial().parse(req.body);
      
      // Auto-set completedBy when marking as completed
      if (validatedData.status === 'completed' && !validatedData.completedBy) {
        validatedData.completedBy = userData.id;
        (validatedData as any).completedAt = new Date();
      }
      
      const stage = await storage.updateEventStage(id, validatedData);
      res.json(stage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event stage:", error);
      res.status(500).json({ message: "Failed to update event stage" });
    }
  });

  // Event Staff routes
  app.get('/api/events/:eventId/staff', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const staff = await storage.getEventStaff(eventId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching event staff:", error);
      res.status(500).json({ message: "Failed to fetch event staff" });
    }
  });

  app.post('/api/events/:eventId/staff', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventStaffSchema.parse({ ...req.body, eventId, assignedBy: userData.id });
      const staff = await storage.createEventStaff(validatedData);
      return res.status(201).json(staff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event staff:", error);
      return res.status(500).json({ message: "Failed to create event staff" });
    }
  });

  app.delete('/api/events/staff/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventStaff(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event staff:", error);
      res.status(500).json({ message: "Failed to delete event staff" });
    }
  });

  // Event Contractor routes
  app.get('/api/events/:eventId/contractors', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const contractors = await storage.getEventContractors(eventId);
      res.json(contractors);
    } catch (error) {
      console.error("Error fetching event contractors:", error);
      res.status(500).json({ message: "Failed to fetch event contractors" });
    }
  });

  app.post('/api/events/:eventId/contractors', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventContractorSchema.parse({ ...req.body, eventId });
      const contractor = await storage.createEventContractor(validatedData);
      res.status(201).json(contractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event contractor:", error);
      res.status(500).json({ message: "Failed to create event contractor" });
    }
  });

  app.put('/api/events/contractors/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventContractorSchema.partial().parse(req.body);
      
      // Auto-set approvedBy when approving
      if (validatedData.approvalStatus === 'approved' && !validatedData.approvedBy) {
        validatedData.approvedBy = userData.id;
      }
      
      const contractor = await storage.updateEventContractor(id, validatedData);
      res.json(contractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event contractor:", error);
      res.status(500).json({ message: "Failed to update event contractor" });
    }
  });

  app.delete('/api/events/contractors/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventContractor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event contractor:", error);
      res.status(500).json({ message: "Failed to delete event contractor" });
    }
  });

  // Contractor Payment routes
  app.get('/api/events/contractors/:contractorId/payments', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      const payments = await storage.getContractorPayments(contractorId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching contractor payments:", error);
      res.status(500).json({ message: "Failed to fetch contractor payments" });
    }
  });

  app.post('/api/events/contractors/:contractorId/payments', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertContractorPaymentSchema.parse({ ...req.body, contractorId, createdBy: userData.id });
      const payment = await storage.createContractorPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating contractor payment:", error);
      res.status(500).json({ message: "Failed to create contractor payment" });
    }
  });

  // Contractor File routes
  app.get('/api/events/contractors/:contractorId/files', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      const files = await storage.getContractorFiles(contractorId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching contractor files:", error);
      res.status(500).json({ message: "Failed to fetch contractor files" });
    }
  });

  app.post('/api/events/contractors/:contractorId/files', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const contractorId = parseInt(req.params.contractorId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertContractorFileSchema.parse({ ...req.body, contractorId, uploadedBy: userData.id });
      const file = await storage.createContractorFile(validatedData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating contractor file:", error);
      res.status(500).json({ message: "Failed to create contractor file" });
    }
  });

  app.delete('/api/events/contractors/files/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContractorFile(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contractor file:", error);
      res.status(500).json({ message: "Failed to delete contractor file" });
    }
  });

  // Event Merchandise routes
  app.get('/api/events/:eventId/merchandise', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const merchandise = await storage.getEventMerchandise(eventId);
      res.json(merchandise);
    } catch (error) {
      console.error("Error fetching event merchandise:", error);
      res.status(500).json({ message: "Failed to fetch event merchandise" });
    }
  });

  app.post('/api/events/:eventId/merchandise', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventMerchandiseSchema.parse({ ...req.body, eventId });
      const merchandise = await storage.createEventMerchandise(validatedData);
      res.status(201).json(merchandise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event merchandise:", error);
      res.status(500).json({ message: "Failed to create event merchandise" });
    }
  });

  app.put('/api/events/merchandise/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventMerchandiseSchema.partial().parse(req.body);
      const merchandise = await storage.updateEventMerchandise(id, validatedData);
      res.json(merchandise);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event merchandise:", error);
      res.status(500).json({ message: "Failed to update event merchandise" });
    }
  });

  app.delete('/api/events/merchandise/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventMerchandise(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event merchandise:", error);
      res.status(500).json({ message: "Failed to delete event merchandise" });
    }
  });

  // Event Inventory Movement routes
  app.get('/api/events/:eventId/inventory-movements', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const movements = await storage.getEventInventoryMovements(eventId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      res.status(500).json({ message: "Failed to fetch inventory movements" });
    }
  });

  app.post('/api/events/:eventId/inventory-movements', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventInventoryMovementSchema.parse({ ...req.body, eventId, movedBy: userData.id });
      const movement = await storage.createEventInventoryMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating inventory movement:", error);
      res.status(500).json({ message: "Failed to create inventory movement" });
    }
  });

  // Event Budget routes
  app.get('/api/events/:eventId/budgets', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const budgets = await storage.getEventBudgets(eventId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching event budgets:", error);
      res.status(500).json({ message: "Failed to fetch event budgets" });
    }
  });

  app.post('/api/events/:eventId/budgets', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventBudgetSchema.parse({ ...req.body, eventId });
      const budget = await storage.createEventBudget(validatedData);
      res.status(201).json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event budget:", error);
      res.status(500).json({ message: "Failed to create event budget" });
    }
  });

  app.put('/api/events/budgets/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventBudgetSchema.partial().parse(req.body);
      
      // Auto-set approvedBy when approving
      if (validatedData.approvalStatus === 'approved' && !validatedData.approvedBy) {
        validatedData.approvedBy = userData.id;
      }
      
      const budget = await storage.updateEventBudget(id, validatedData);
      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event budget:", error);
      res.status(500).json({ message: "Failed to update event budget" });
    }
  });

  app.delete('/api/events/budgets/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventBudget(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event budget:", error);
      res.status(500).json({ message: "Failed to delete event budget" });
    }
  });

  // Event Campaign routes
  app.get('/api/events/:eventId/campaigns', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const campaigns = await storage.getEventCampaigns(eventId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching event campaigns:", error);
      res.status(500).json({ message: "Failed to fetch event campaigns" });
    }
  });

  app.post('/api/events/:eventId/campaigns', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventCampaignSchema.parse({ ...req.body, eventId, createdBy: userData.id });
      const campaign = await storage.createEventCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event campaign:", error);
      res.status(500).json({ message: "Failed to create event campaign" });
    }
  });

  app.put('/api/events/campaigns/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateEventCampaign(id, validatedData);
      res.json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event campaign:", error);
      res.status(500).json({ message: "Failed to update event campaign" });
    }
  });

  app.delete('/api/events/campaigns/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventCampaign(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event campaign:", error);
      res.status(500).json({ message: "Failed to delete event campaign" });
    }
  });

  // Event Registration routes
  app.get('/api/events/:eventId/registrations', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const registrations = await storage.getEventRegistrations(eventId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching event registrations:", error);
      res.status(500).json({ message: "Failed to fetch event registrations" });
    }
  });

  app.post('/api/events/:eventId/registrations', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventRegistrationSchema.parse({ ...req.body, eventId });
      const registration = await storage.createEventRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event registration:", error);
      res.status(500).json({ message: "Failed to create event registration" });
    }
  });

  app.put('/api/events/registrations/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventRegistrationSchema.partial().parse(req.body);
      const registration = await storage.updateEventRegistration(id, validatedData);
      res.json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event registration:", error);
      res.status(500).json({ message: "Failed to update event registration" });
    }
  });

  app.delete('/api/events/registrations/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventRegistration(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event registration:", error);
      res.status(500).json({ message: "Failed to delete event registration" });
    }
  });

  // Tour Merch Bundle routes
  app.get('/api/tour-merch-bundles', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const bundles = await storage.getTourMerchBundles();
      res.json(bundles);
    } catch (error) {
      console.error("Error fetching tour merch bundles:", error);
      res.status(500).json({ message: "Failed to fetch tour merch bundles" });
    }
  });

  app.get('/api/tour-merch-bundles/:id', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bundle = await storage.getTourMerchBundle(id);
      if (!bundle) {
        return res.status(404).json({ message: "Tour merch bundle not found" });
      }
      res.json(bundle);
    } catch (error) {
      console.error("Error fetching tour merch bundle:", error);
      res.status(500).json({ message: "Failed to fetch tour merch bundle" });
    }
  });

  app.get('/api/events/:eventId/tour-merch-bundles', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const bundles = await storage.getTourMerchBundlesByEvent(eventId);
      res.json(bundles);
    } catch (error) {
      console.error("Error fetching event tour merch bundles:", error);
      res.status(500).json({ message: "Failed to fetch event tour merch bundles" });
    }
  });

  app.post('/api/tour-merch-bundles', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertTourMerchBundleSchema.parse(req.body);
      
      const bundleData = {
        ...validatedData,
        createdBy: userData.id,
      };
      
      const bundle = await storage.createTourMerchBundle(bundleData);
      res.status(201).json(bundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating tour merch bundle:", error);
      res.status(500).json({ message: "Failed to create tour merch bundle" });
    }
  });

  app.put('/api/tour-merch-bundles/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTourMerchBundleSchema.partial().parse(req.body);
      const bundle = await storage.updateTourMerchBundle(id, validatedData);
      res.json(bundle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating tour merch bundle:", error);
      res.status(500).json({ message: "Failed to update tour merch bundle" });
    }
  });

  app.delete('/api/tour-merch-bundles/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTourMerchBundle(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tour merch bundle:", error);
      res.status(500).json({ message: "Failed to delete tour merch bundle" });
    }
  });
}
