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
  insertTourMerchBundleSchema,
  insertEventSponsorSchema,
  insertEventVolunteerSchema,
  insertEventGraphicSchema,
  insertEventVenueSchema,
  insertEventScheduleSchema,
  insertEventEquipmentSchema,
  insertEventTravelSchema,
  insertEventTaskSchema,
  insertEventDocumentSchema,
  insertEventTicketTierSchema,
  insertEventExpenseSchema,
  insertEventNoteSchema,
  insertEventChecklistSchema
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

  app.put('/api/events/staff/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventStaffSchema.partial().parse(req.body);
      const staff = await storage.updateEventStaff(id, validatedData);
      return res.json(staff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event staff:", error);
      return res.status(500).json({ message: "Failed to update event staff" });
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

  // Event Sponsor routes
  app.get('/api/events/:eventId/sponsors', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const sponsors = await storage.getEventSponsors(eventId);
      res.json(sponsors);
    } catch (error) {
      console.error("Error fetching event sponsors:", error);
      res.status(500).json({ message: "Failed to fetch event sponsors" });
    }
  });

  app.post('/api/events/:eventId/sponsors', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventSponsorSchema.parse({ ...req.body, eventId });
      const sponsor = await storage.createEventSponsor(validatedData);
      res.status(201).json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event sponsor:", error);
      res.status(500).json({ message: "Failed to create event sponsor" });
    }
  });

  app.put('/api/events/sponsors/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventSponsorSchema.partial().parse(req.body);
      const sponsor = await storage.updateEventSponsor(id, validatedData);
      res.json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event sponsor:", error);
      res.status(500).json({ message: "Failed to update event sponsor" });
    }
  });

  app.delete('/api/events/sponsors/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventSponsor(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event sponsor:", error);
      res.status(500).json({ message: "Failed to delete event sponsor" });
    }
  });

  // Event Volunteer routes
  app.get('/api/events/:eventId/volunteers', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const volunteers = await storage.getEventVolunteers(eventId);
      res.json(volunteers);
    } catch (error) {
      console.error("Error fetching event volunteers:", error);
      res.status(500).json({ message: "Failed to fetch event volunteers" });
    }
  });

  app.post('/api/events/:eventId/volunteers', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventVolunteerSchema.parse({ ...req.body, eventId });
      const volunteer = await storage.createEventVolunteer(validatedData);
      res.status(201).json(volunteer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event volunteer:", error);
      res.status(500).json({ message: "Failed to create event volunteer" });
    }
  });

  app.put('/api/events/volunteers/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventVolunteerSchema.partial().parse(req.body);
      const volunteer = await storage.updateEventVolunteer(id, validatedData);
      res.json(volunteer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event volunteer:", error);
      res.status(500).json({ message: "Failed to update event volunteer" });
    }
  });

  app.delete('/api/events/volunteers/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventVolunteer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event volunteer:", error);
      res.status(500).json({ message: "Failed to delete event volunteer" });
    }
  });

  // Event Graphic routes
  app.get('/api/events/:eventId/graphics', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const graphics = await storage.getEventGraphics(eventId);
      res.json(graphics);
    } catch (error) {
      console.error("Error fetching event graphics:", error);
      res.status(500).json({ message: "Failed to fetch event graphics" });
    }
  });

  app.post('/api/events/:eventId/graphics', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventGraphicSchema.parse({ ...req.body, eventId, uploadedBy: userData.id });
      const graphic = await storage.createEventGraphic(validatedData);
      res.status(201).json(graphic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event graphic:", error);
      res.status(500).json({ message: "Failed to create event graphic" });
    }
  });

  app.put('/api/events/graphics/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventGraphicSchema.partial().parse(req.body);
      const graphic = await storage.updateEventGraphic(id, validatedData);
      res.json(graphic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event graphic:", error);
      res.status(500).json({ message: "Failed to update event graphic" });
    }
  });

  app.delete('/api/events/graphics/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventGraphic(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event graphic:", error);
      res.status(500).json({ message: "Failed to delete event graphic" });
    }
  });

  // Event Venue routes
  app.get('/api/events/:eventId/venues', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const venues = await storage.getEventVenues(eventId);
      res.json(venues);
    } catch (error) {
      console.error("Error fetching event venues:", error);
      res.status(500).json({ message: "Failed to fetch event venues" });
    }
  });

  app.post('/api/events/:eventId/venues', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventVenueSchema.parse({ ...req.body, eventId });
      const venue = await storage.createEventVenue(validatedData);
      res.status(201).json(venue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event venue:", error);
      res.status(500).json({ message: "Failed to create event venue" });
    }
  });

  app.put('/api/events/venues/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventVenueSchema.partial().parse(req.body);
      const venue = await storage.updateEventVenue(id, validatedData);
      res.json(venue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event venue:", error);
      res.status(500).json({ message: "Failed to update event venue" });
    }
  });

  app.delete('/api/events/venues/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventVenue(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event venue:", error);
      res.status(500).json({ message: "Failed to delete event venue" });
    }
  });

  // Event Schedule routes
  app.get('/api/events/:eventId/schedules', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const schedules = await storage.getEventSchedules(eventId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching event schedules:", error);
      res.status(500).json({ message: "Failed to fetch event schedules" });
    }
  });

  app.post('/api/events/:eventId/schedules', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventScheduleSchema.parse({ ...req.body, eventId });
      const schedule = await storage.createEventSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event schedule:", error);
      res.status(500).json({ message: "Failed to create event schedule" });
    }
  });

  app.put('/api/events/schedules/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateEventSchedule(id, validatedData);
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event schedule:", error);
      res.status(500).json({ message: "Failed to update event schedule" });
    }
  });

  app.delete('/api/events/schedules/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventSchedule(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event schedule:", error);
      res.status(500).json({ message: "Failed to delete event schedule" });
    }
  });

  // Event Equipment routes
  app.get('/api/events/:eventId/equipment', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const equipment = await storage.getEventEquipment(eventId);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching event equipment:", error);
      res.status(500).json({ message: "Failed to fetch event equipment" });
    }
  });

  app.post('/api/events/:eventId/equipment', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventEquipmentSchema.parse({ ...req.body, eventId });
      const equipmentItem = await storage.createEventEquipment(validatedData);
      res.status(201).json(equipmentItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event equipment:", error);
      res.status(500).json({ message: "Failed to create event equipment" });
    }
  });

  app.put('/api/events/equipment/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventEquipmentSchema.partial().parse(req.body);
      const equipmentItem = await storage.updateEventEquipment(id, validatedData);
      res.json(equipmentItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event equipment:", error);
      res.status(500).json({ message: "Failed to update event equipment" });
    }
  });

  app.delete('/api/events/equipment/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventEquipment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event equipment:", error);
      res.status(500).json({ message: "Failed to delete event equipment" });
    }
  });

  // Event Travel routes
  app.get('/api/events/:eventId/travel', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const travel = await storage.getEventTravel(eventId);
      res.json(travel);
    } catch (error) {
      console.error("Error fetching event travel:", error);
      res.status(500).json({ message: "Failed to fetch event travel" });
    }
  });

  app.post('/api/events/:eventId/travel', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventTravelSchema.parse({ ...req.body, eventId });
      const travelItem = await storage.createEventTravel(validatedData);
      res.status(201).json(travelItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event travel:", error);
      res.status(500).json({ message: "Failed to create event travel" });
    }
  });

  app.put('/api/events/travel/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventTravelSchema.partial().parse(req.body);
      const travelItem = await storage.updateEventTravel(id, validatedData);
      res.json(travelItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event travel:", error);
      res.status(500).json({ message: "Failed to update event travel" });
    }
  });

  app.delete('/api/events/travel/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventTravel(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event travel:", error);
      res.status(500).json({ message: "Failed to delete event travel" });
    }
  });

  // Event Task routes
  app.get('/api/events/:eventId/tasks', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const tasks = await storage.getEventTasks(eventId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching event tasks:", error);
      res.status(500).json({ message: "Failed to fetch event tasks" });
    }
  });

  app.post('/api/events/:eventId/tasks', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventTaskSchema.parse({ ...req.body, eventId });
      const task = await storage.createEventTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event task:", error);
      res.status(500).json({ message: "Failed to create event task" });
    }
  });

  app.put('/api/events/tasks/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventTaskSchema.partial().parse(req.body);
      const task = await storage.updateEventTask(id, validatedData);
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event task:", error);
      res.status(500).json({ message: "Failed to update event task" });
    }
  });

  app.delete('/api/events/tasks/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventTask(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event task:", error);
      res.status(500).json({ message: "Failed to delete event task" });
    }
  });

  // Event Document routes
  app.get('/api/events/:eventId/documents', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const documents = await storage.getEventDocuments(eventId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching event documents:", error);
      res.status(500).json({ message: "Failed to fetch event documents" });
    }
  });

  app.post('/api/events/:eventId/documents', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventDocumentSchema.parse({ ...req.body, eventId, uploadedBy: userData.id });
      const document = await storage.createEventDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event document:", error);
      res.status(500).json({ message: "Failed to create event document" });
    }
  });

  app.put('/api/events/documents/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventDocumentSchema.partial().parse(req.body);
      const document = await storage.updateEventDocument(id, validatedData);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event document:", error);
      res.status(500).json({ message: "Failed to update event document" });
    }
  });

  app.delete('/api/events/documents/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventDocument(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event document:", error);
      res.status(500).json({ message: "Failed to delete event document" });
    }
  });

  // Event Ticket Tier routes
  app.get('/api/events/:eventId/ticket-tiers', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const ticketTiers = await storage.getEventTicketTiers(eventId);
      res.json(ticketTiers);
    } catch (error) {
      console.error("Error fetching event ticket tiers:", error);
      res.status(500).json({ message: "Failed to fetch event ticket tiers" });
    }
  });

  app.post('/api/events/:eventId/ticket-tiers', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventTicketTierSchema.parse({ ...req.body, eventId });
      const ticketTier = await storage.createEventTicketTier(validatedData);
      res.status(201).json(ticketTier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event ticket tier:", error);
      res.status(500).json({ message: "Failed to create event ticket tier" });
    }
  });

  app.put('/api/events/ticket-tiers/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventTicketTierSchema.partial().parse(req.body);
      const ticketTier = await storage.updateEventTicketTier(id, validatedData);
      res.json(ticketTier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event ticket tier:", error);
      res.status(500).json({ message: "Failed to update event ticket tier" });
    }
  });

  app.delete('/api/events/ticket-tiers/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventTicketTier(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event ticket tier:", error);
      res.status(500).json({ message: "Failed to delete event ticket tier" });
    }
  });

  // Event Expense routes
  app.get('/api/events/:eventId/expenses', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const expenses = await storage.getEventExpenses(eventId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching event expenses:", error);
      res.status(500).json({ message: "Failed to fetch event expenses" });
    }
  });

  app.post('/api/events/:eventId/expenses', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventExpenseSchema.parse({ ...req.body, eventId });
      const expense = await storage.createEventExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event expense:", error);
      res.status(500).json({ message: "Failed to create event expense" });
    }
  });

  app.put('/api/events/expenses/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventExpenseSchema.partial().parse(req.body);
      
      if (validatedData.status === 'approved' && !validatedData.approvedBy) {
        validatedData.approvedBy = userData.id;
      }
      
      const expense = await storage.updateEventExpense(id, validatedData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event expense:", error);
      res.status(500).json({ message: "Failed to update event expense" });
    }
  });

  app.delete('/api/events/expenses/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventExpense(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event expense:", error);
      res.status(500).json({ message: "Failed to delete event expense" });
    }
  });

  // Event Note routes
  app.get('/api/events/:eventId/notes', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const notes = await storage.getEventNotes(eventId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching event notes:", error);
      res.status(500).json({ message: "Failed to fetch event notes" });
    }
  });

  app.post('/api/events/:eventId/notes', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventNoteSchema.parse({ ...req.body, eventId, createdBy: userData.id });
      const note = await storage.createEventNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event note:", error);
      res.status(500).json({ message: "Failed to create event note" });
    }
  });

  app.put('/api/events/notes/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertEventNoteSchema.partial().parse(req.body);
      const note = await storage.updateEventNote(id, validatedData);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event note:", error);
      res.status(500).json({ message: "Failed to update event note" });
    }
  });

  app.delete('/api/events/notes/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventNote(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event note:", error);
      res.status(500).json({ message: "Failed to delete event note" });
    }
  });

  // Event Checklist routes
  app.get('/api/events/:eventId/checklists', isAuthenticated, loadUserData, requirePermission('events', 'read'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const checklists = await storage.getEventChecklists(eventId);
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching event checklists:", error);
      res.status(500).json({ message: "Failed to fetch event checklists" });
    }
  });

  app.post('/api/events/:eventId/checklists', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const validatedData = insertEventChecklistSchema.parse({ ...req.body, eventId });
      const checklist = await storage.createEventChecklist(validatedData);
      res.status(201).json(checklist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating event checklist:", error);
      res.status(500).json({ message: "Failed to create event checklist" });
    }
  });

  app.put('/api/events/checklists/:id', isAuthenticated, loadUserData, requirePermission('events', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertEventChecklistSchema.partial().parse(req.body);
      
      if (validatedData.isCompleted && !validatedData.completedBy) {
        validatedData.completedBy = userData.id;
        (validatedData as any).completedAt = new Date();
      }
      
      const checklist = await storage.updateEventChecklist(id, validatedData);
      res.json(checklist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating event checklist:", error);
      res.status(500).json({ message: "Failed to update event checklist" });
    }
  });

  app.delete('/api/events/checklists/:id', isAuthenticated, loadUserData, requirePermission('events', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventChecklist(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event checklist:", error);
      res.status(500).json({ message: "Failed to delete event checklist" });
    }
  });

  // PUBLIC: Get event portal data for customer event view
  app.get('/api/public/events/:eventId/portal-data', async (req, res) => {
    // No authentication required - this is a public endpoint
    try {
      const eventId = parseInt(req.params.eventId);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      // Fetch event
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Fetch organization info if linked
      const organization = event.organizationId ? await storage.getOrganization(event.organizationId) : null;

      // Fetch event-related data
      const schedules = await storage.getEventSchedules(eventId);
      const venues = await storage.getEventVenues(eventId);
      const sponsors = await storage.getEventSponsors(eventId);
      const ticketTiers = await storage.getEventTicketTiers(eventId);
      const graphics = await storage.getEventGraphics(eventId);
      
      res.json({
        event: {
          id: event.id,
          eventCode: event.eventCode,
          name: event.name,
          eventType: event.eventType,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          timezone: event.timezone,
          location: event.location,
          thumbnailUrl: event.thumbnailUrl,
          logoUrl: event.logoUrl,
          brandingConfig: event.brandingConfig,
        },
        organization: organization ? {
          id: organization.id,
          name: organization.name,
          logoUrl: organization.logoUrl || null,
        } : null,
        schedules: schedules.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          startTime: s.startTime,
          endTime: s.endTime,
          location: s.location,
          activityType: s.activityType,
          speakerName: s.speakerName,
        })),
        venues: venues.map((v: any) => ({
          id: v.id,
          venueName: v.venueName,
          address: v.address,
          city: v.city,
          state: v.state,
          capacity: v.capacity,
        })),
        sponsors: sponsors.map((sp: any) => ({
          id: sp.id,
          name: sp.name,
          tier: sp.tier,
          logoUrl: sp.logoUrl,
        })),
        ticketTiers: ticketTiers.map((t: any) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          quantityAvailable: t.quantityAvailable,
          quantitySold: t.quantitySold,
        })),
        graphics: graphics.map((g: any) => ({
          id: g.id,
          fileName: g.fileName,
          fileUrl: g.fileUrl,
          fileType: g.fileType,
        })),
      });
    } catch (error) {
      console.error("Error fetching event portal data:", error);
      res.status(500).json({ message: "Failed to fetch event portal data" });
    }
  });
}
