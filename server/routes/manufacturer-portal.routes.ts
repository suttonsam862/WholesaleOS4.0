import type { Express, Response } from 'express';
import { isAuthenticated, loadUserData } from './shared/middleware';
import { storage } from '../storage';
import { 
  MANUFACTURER_FUNNEL_STATUSES,
  MANUFACTURER_FUNNEL_STATUS_LABELS,
  MANUFACTURER_FUNNEL_STATUS_CONFIG,
  MANUFACTURER_TO_PUBLIC_STATUS_MAP,
  isManufacturerFunnelStatus,
  isValidManufacturerFunnelTransition,
  type ManufacturerFunnelStatus
} from '@shared/constants';
import z from 'zod';

export function registerManufacturerPortalRoutes(app: Express): void {
  // Get manufacturer funnel configuration (statuses, labels, colors)
  app.get('/api/manufacturer-portal/config',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const statuses = MANUFACTURER_FUNNEL_STATUSES.map(status => ({
          value: status,
          label: MANUFACTURER_FUNNEL_STATUS_LABELS[status],
          ...MANUFACTURER_FUNNEL_STATUS_CONFIG[status],
          publicStatus: MANUFACTURER_TO_PUBLIC_STATUS_MAP[status]
        }));

        res.json({ statuses });
      } catch (error) {
        console.error('Error fetching manufacturer portal config:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
      }
    }
  );

  // Helper to get manufacturer ID for the current user (manufacturers only)
  async function getManufacturerIdForUser(userId: string): Promise<number | null> {
    const associations = await storage.getUserManufacturerAssociations(userId);
    return associations.length > 0 ? associations[0].manufacturerId : null;
  }

  // Helper to check if user can access a specific job
  async function canAccessJob(job: any, userRole: string, userId: string): Promise<boolean> {
    if (['admin', 'ops'].includes(userRole)) {
      return true;
    }
    if (userRole === 'manufacturer') {
      const manufacturerId = await getManufacturerIdForUser(userId);
      return manufacturerId !== null && job.manufacturerId === manufacturerId;
    }
    return false;
  }

  // Get all manufacturer jobs (with optional manufacturer filter)
  app.get('/api/manufacturer-portal/jobs',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;
        
        // Allow admin, ops, and manufacturer roles
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        let manufacturerId: number | undefined;

        // If user is a manufacturer, MUST filter to their associated manufacturer
        if (userRole === 'manufacturer') {
          const mfrId = await getManufacturerIdForUser(userId);
          if (mfrId === null) {
            return res.status(403).json({ error: 'No manufacturer association found for this user' });
          }
          manufacturerId = mfrId;
        } else if (req.query.manufacturerId) {
          manufacturerId = parseInt(req.query.manufacturerId as string);
        }

        const jobs = await storage.getManufacturerJobs(manufacturerId);
        res.json(jobs);
      } catch (error) {
        console.error('Error fetching manufacturer jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
      }
    }
  );

  // Get a specific manufacturer job with events
  app.get('/api/manufacturer-portal/jobs/:id',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;

        // Allow admin, ops, and manufacturer roles
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
          return res.status(400).json({ error: 'Invalid job ID' });
        }

        const job = await storage.getManufacturerJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        // Check ownership for manufacturers
        if (!(await canAccessJob(job, userRole, userId))) {
          return res.status(403).json({ error: 'Access denied to this job' });
        }

        res.json(job);
      } catch (error) {
        console.error('Error fetching manufacturer job:', error);
        res.status(500).json({ error: 'Failed to fetch job' });
      }
    }
  );

  // Create a manufacturer job from an existing manufacturing record
  const createJobSchema = z.object({
    manufacturingId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    manufacturerId: z.number().int().positive().optional(),
    requiredDeliveryDate: z.string().optional(),
    eventDate: z.string().optional(),
    sampleRequired: z.boolean().optional(),
    printMethod: z.enum(['screen', 'plastisol', 'water_based', 'sublimation', 'embroidery', 'dtg', 'other']).optional(),
    specialInstructions: z.string().optional(),
  });

  app.post('/api/manufacturer-portal/jobs',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;
        
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const validationResult = createJobSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid data', details: validationResult.error.issues });
        }

        const data = validationResult.data;

        // For manufacturer users, enforce association and match manufacturerId
        let finalManufacturerId = data.manufacturerId;
        if (userRole === 'manufacturer') {
          const mfrId = await getManufacturerIdForUser(userId);
          if (mfrId === null) {
            return res.status(403).json({ error: 'No manufacturer association found for this user' });
          }
          // Force the manufacturerId to match the user's association
          if (data.manufacturerId && data.manufacturerId !== mfrId) {
            return res.status(403).json({ error: 'Cannot create jobs for other manufacturers' });
          }
          finalManufacturerId = mfrId;

          // Verify the manufacturing record belongs to this manufacturer
          const manufacturingRecord = await storage.getManufacturingRecord(data.manufacturingId);
          if (!manufacturingRecord) {
            return res.status(404).json({ error: 'Manufacturing record not found' });
          }
          if (manufacturingRecord.manufacturerId !== mfrId) {
            return res.status(403).json({ error: 'This manufacturing record is not assigned to you' });
          }
          // Validate orderId matches the manufacturing record's order
          if (manufacturingRecord.orderId !== data.orderId) {
            return res.status(400).json({ error: 'Order ID does not match the manufacturing record' });
          }
        } else {
          // For admin/ops, still validate orderId matches manufacturing record
          const manufacturingRecord = await storage.getManufacturingRecord(data.manufacturingId);
          if (!manufacturingRecord) {
            return res.status(404).json({ error: 'Manufacturing record not found' });
          }
          if (manufacturingRecord.orderId !== data.orderId) {
            return res.status(400).json({ error: 'Order ID does not match the manufacturing record' });
          }
        }

        // Check if job already exists for this manufacturing record
        const existingJob = await storage.getManufacturerJobByManufacturingId(data.manufacturingId);
        if (existingJob) {
          return res.status(409).json({ error: 'A manufacturer job already exists for this manufacturing record' });
        }

        const job = await storage.createManufacturerJob({
          manufacturingId: data.manufacturingId,
          orderId: data.orderId,
          manufacturerId: finalManufacturerId,
          manufacturerStatus: 'intake_pending',
          publicStatus: MANUFACTURER_TO_PUBLIC_STATUS_MAP['intake_pending'],
          requiredDeliveryDate: data.requiredDeliveryDate,
          eventDate: data.eventDate,
          sampleRequired: data.sampleRequired ?? false,
          printMethod: data.printMethod,
          specialInstructions: data.specialInstructions,
          priority: 'normal',
        });

        // Log the creation event
        await storage.createManufacturerEvent({
          manufacturerJobId: job.id,
          eventType: 'status_change',
          title: 'Job Created',
          description: 'Manufacturer job created in intake pending status',
          newValue: 'intake_pending',
          createdBy: req.user?.userData?.id,
        });

        res.status(201).json(job);
      } catch (error) {
        console.error('Error creating manufacturer job:', error);
        res.status(500).json({ error: 'Failed to create job' });
      }
    }
  );

  // Update manufacturer job status (with sync to public status)
  const updateStatusSchema = z.object({
    manufacturerStatus: z.enum([
      'intake_pending', 'specs_lock_review', 'specs_locked', 'materials_reserved',
      'samples_in_progress', 'samples_awaiting_approval', 'samples_approved', 'samples_revise',
      'bulk_cutting', 'bulk_print_emb_sublim', 'bulk_stitching', 'bulk_qc',
      'packing_complete', 'handed_to_carrier', 'delivered_confirmed'
    ]),
    notes: z.string().optional(),
  });

  app.patch('/api/manufacturer-portal/jobs/:id/status',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;

        // Allow admin, ops, and manufacturer roles
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
          return res.status(400).json({ error: 'Invalid job ID' });
        }

        const validationResult = updateStatusSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid data', details: validationResult.error.issues });
        }

        const { manufacturerStatus, notes } = validationResult.data;

        // Get current job
        const currentJob = await storage.getManufacturerJob(jobId);
        if (!currentJob) {
          return res.status(404).json({ error: 'Job not found' });
        }

        // Check ownership for manufacturers
        if (!(await canAccessJob(currentJob, userRole, userId))) {
          return res.status(403).json({ error: 'Access denied to this job' });
        }

        const currentStatus = currentJob.manufacturerStatus as ManufacturerFunnelStatus;

        // Validate transition (allow same status or valid next status)
        if (currentStatus !== manufacturerStatus && !isValidManufacturerFunnelTransition(currentStatus, manufacturerStatus)) {
          return res.status(400).json({ 
            error: 'Invalid status transition',
            currentStatus,
            requestedStatus: manufacturerStatus 
          });
        }

        // Get the mapped public status
        const publicStatus = MANUFACTURER_TO_PUBLIC_STATUS_MAP[manufacturerStatus];

        // Update the manufacturer job
        const updatedJob = await storage.updateManufacturerJob(jobId, {
          manufacturerStatus,
          publicStatus,
        });

        // Also update the main manufacturing record's public status
        if (currentJob.manufacturingId) {
          await storage.updateManufacturing(currentJob.manufacturingId, {
            status: publicStatus,
          });
        }

        // Log the status change event
        await storage.createManufacturerEvent({
          manufacturerJobId: jobId,
          eventType: 'status_change',
          title: `Status changed to ${MANUFACTURER_FUNNEL_STATUS_LABELS[manufacturerStatus]}`,
          description: notes,
          previousValue: currentStatus,
          newValue: manufacturerStatus,
          createdBy: req.user?.userData?.id,
        });

        res.json(updatedJob);
      } catch (error) {
        console.error('Error updating manufacturer job status:', error);
        res.status(500).json({ error: 'Failed to update status' });
      }
    }
  );

  // Update manufacturer job details
  const updateJobSchema = z.object({
    requiredDeliveryDate: z.string().optional(),
    promisedShipDate: z.string().optional(),
    eventDate: z.string().optional(),
    latestArrivalDate: z.string().optional(),
    sampleRequired: z.boolean().optional(),
    fabricType: z.string().optional(),
    printMethod: z.enum(['screen', 'plastisol', 'water_based', 'sublimation', 'embroidery', 'dtg', 'other']).optional().nullable(),
    specialInstructions: z.string().optional(),
    internalNotes: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  });

  app.patch('/api/manufacturer-portal/jobs/:id',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;

        // Allow admin, ops, and manufacturer roles
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
          return res.status(400).json({ error: 'Invalid job ID' });
        }

        // Check job exists and user has access
        const existingJob = await storage.getManufacturerJob(jobId);
        if (!existingJob) {
          return res.status(404).json({ error: 'Job not found' });
        }

        if (!(await canAccessJob(existingJob, userRole, userId))) {
          return res.status(403).json({ error: 'Access denied to this job' });
        }

        const validationResult = updateJobSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid data', details: validationResult.error.issues });
        }

        // Filter out null values for optional fields
        const updateData = { ...validationResult.data };
        if (updateData.printMethod === null) {
          updateData.printMethod = undefined;
        }
        const updatedJob = await storage.updateManufacturerJob(jobId, updateData as any);
        res.json(updatedJob);
      } catch (error) {
        console.error('Error updating manufacturer job:', error);
        res.status(500).json({ error: 'Failed to update job' });
      }
    }
  );

  // Add an event to a manufacturer job
  const addEventSchema = z.object({
    eventType: z.enum([
      'status_change', 'spec_update', 'pantone_update', 'sample_approved', 'sample_rejected',
      'deadline_changed', 'note_added', 'attachment_added', 'shipment_created', 'shipment_split',
      'issue_flagged', 'issue_resolved'
    ]),
    title: z.string().min(1),
    description: z.string().optional(),
    previousValue: z.string().optional(),
    newValue: z.string().optional(),
    metadata: z.any().optional(),
  });

  app.post('/api/manufacturer-portal/jobs/:id/events',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;

        // Allow admin, ops, and manufacturer roles
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
          return res.status(400).json({ error: 'Invalid job ID' });
        }

        const validationResult = addEventSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Invalid data', details: validationResult.error.issues });
        }

        const job = await storage.getManufacturerJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        // Check ownership for manufacturers
        if (!(await canAccessJob(job, userRole, userId))) {
          return res.status(403).json({ error: 'Access denied to this job' });
        }

        const event = await storage.createManufacturerEvent({
          manufacturerJobId: jobId,
          ...validationResult.data,
          createdBy: req.user?.userData?.id,
        });

        res.status(201).json(event);
      } catch (error) {
        console.error('Error adding manufacturer event:', error);
        res.status(500).json({ error: 'Failed to add event' });
      }
    }
  );

  // Get events for a manufacturer job
  app.get('/api/manufacturer-portal/jobs/:id/events',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        const userId = req.user?.userData?.id;

        // Allow admin, ops, and manufacturer roles
        if (!['admin', 'ops', 'manufacturer'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied' });
        }

        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
          return res.status(400).json({ error: 'Invalid job ID' });
        }

        // Check job exists and user has access
        const job = await storage.getManufacturerJob(jobId);
        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        if (!(await canAccessJob(job, userRole, userId))) {
          return res.status(403).json({ error: 'Access denied to this job' });
        }

        const events = await storage.getManufacturerEvents(jobId);
        res.json(events);
      } catch (error) {
        console.error('Error fetching manufacturer events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
      }
    }
  );

  // Auto-create manufacturer jobs for manufacturing records that don't have one
  app.post('/api/manufacturer-portal/sync-jobs',
    isAuthenticated,
    loadUserData,
    async (req: any, res: Response) => {
      try {
        const userRole = req.user?.userData?.role;
        if (!['admin', 'ops'].includes(userRole)) {
          return res.status(403).json({ error: 'Access denied. Admin or ops role required.' });
        }

        // Get all manufacturing records
        const manufacturingRecords = await storage.getManufacturing();
        let created = 0;

        for (const record of manufacturingRecords) {
          // Check if job exists
          const existingJob = await storage.getManufacturerJobByManufacturingId(record.id);
          if (!existingJob && record.order) {
            // Create manufacturer job
            await storage.createManufacturerJob({
              manufacturingId: record.id,
              orderId: record.order.id,
              manufacturerId: record.manufacturerId ?? undefined,
              manufacturerStatus: 'intake_pending',
              publicStatus: record.status || 'awaiting_admin_confirmation',
              sampleRequired: false,
              priority: (record.priority as any) || 'normal',
            });
            created++;
          }
        }

        res.json({ message: `Synced manufacturer jobs. Created ${created} new jobs.`, created });
      } catch (error) {
        console.error('Error syncing manufacturer jobs:', error);
        res.status(500).json({ error: 'Failed to sync jobs' });
      }
    }
  );
}
