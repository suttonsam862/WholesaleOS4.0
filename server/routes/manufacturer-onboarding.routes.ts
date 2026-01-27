/**
 * Manufacturer Onboarding Routes
 *
 * Routes for manufacturer invites, applications, and onboarding workflow.
 */

import type { Express, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { loadUserData, requirePermission } from '../permissions';
import { db } from '../db';
import {
  manufacturerInvites,
  manufacturerApplications,
  manufacturers,
  users,
  productFamilies,
} from '../../shared/schema';
import { eq, and, desc, sql, inArray, isNull, gte } from 'drizzle-orm';
import crypto from 'crypto';

// Helper to generate codes
function generateCode(prefix: string): string {
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

export function registerManufacturerOnboardingRoutes(app: Express) {
  // ==================== ADMIN: MANUFACTURER INVITES ====================

  /**
   * List all manufacturer invites
   * GET /api/admin/manufacturer-invites
   */
  app.get(
    '/api/admin/manufacturer-invites',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'read'),
    async (req: Request, res: Response) => {
      try {
        const invites = await db
          .select({
            invite: manufacturerInvites,
            invitedByUser: users,
          })
          .from(manufacturerInvites)
          .leftJoin(users, eq(manufacturerInvites.invitedBy, users.id))
          .orderBy(desc(manufacturerInvites.createdAt));

        res.json(
          invites.map(({ invite, invitedByUser }) => ({
            ...invite,
            invitedByName: invitedByUser?.name || invitedByUser?.email,
          }))
        );
      } catch (error) {
        console.error('Error fetching manufacturer invites:', error);
        res.status(500).json({ message: 'Failed to fetch invites' });
      }
    }
  );

  /**
   * Create a manufacturer invite
   * POST /api/admin/manufacturer-invites
   */
  app.post(
    '/api/admin/manufacturer-invites',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'write'),
    async (req: Request, res: Response) => {
      try {
        const { companyName, contactEmail, contactName, expectedProductFamilies, personalNote, expiresInDays } = req.body;
        const userData = (req as any).userData;

        if (!companyName || !contactEmail) {
          return res.status(400).json({ message: 'Company name and contact email are required' });
        }

        const inviteCode = generateCode('INV');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));

        const [invite] = await db
          .insert(manufacturerInvites)
          .values({
            inviteCode,
            companyName,
            contactEmail,
            contactName,
            expectedProductFamilies,
            personalNote,
            status: 'sent',
            sentAt: new Date(),
            expiresAt,
            invitedBy: userData?.id,
          })
          .returning();

        // TODO: Send invite email

        res.status(201).json({
          ...invite,
          inviteUrl: `/manufacturer-apply?invite=${inviteCode}`,
        });
      } catch (error) {
        console.error('Error creating manufacturer invite:', error);
        res.status(500).json({ message: 'Failed to create invite' });
      }
    }
  );

  /**
   * Resend an invite
   * POST /api/admin/manufacturer-invites/:id/resend
   */
  app.post(
    '/api/admin/manufacturer-invites/:id/resend',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const [updated] = await db
          .update(manufacturerInvites)
          .set({
            status: 'sent',
            sentAt: new Date(),
            expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerInvites.id, id))
          .returning();

        // TODO: Resend email

        res.json(updated);
      } catch (error) {
        console.error('Error resending invite:', error);
        res.status(500).json({ message: 'Failed to resend invite' });
      }
    }
  );

  /**
   * Revoke an invite
   * POST /api/admin/manufacturer-invites/:id/revoke
   */
  app.post(
    '/api/admin/manufacturer-invites/:id/revoke',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const [updated] = await db
          .update(manufacturerInvites)
          .set({
            status: 'revoked',
            updatedAt: new Date(),
          })
          .where(eq(manufacturerInvites.id, id))
          .returning();

        res.json(updated);
      } catch (error) {
        console.error('Error revoking invite:', error);
        res.status(500).json({ message: 'Failed to revoke invite' });
      }
    }
  );

  // ==================== ADMIN: APPLICATIONS ====================

  /**
   * List all manufacturer applications
   * GET /api/admin/manufacturer-applications
   */
  app.get(
    '/api/admin/manufacturer-applications',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'read'),
    async (req: Request, res: Response) => {
      try {
        const { status } = req.query;

        let query = db
          .select({
            application: manufacturerApplications,
            reviewedByUser: users,
          })
          .from(manufacturerApplications)
          .leftJoin(users, eq(manufacturerApplications.reviewedBy, users.id))
          .orderBy(desc(manufacturerApplications.createdAt));

        const applications = await query;

        res.json(
          applications.map(({ application, reviewedByUser }) => ({
            ...application,
            reviewedByName: reviewedByUser?.name || reviewedByUser?.email,
          }))
        );
      } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Failed to fetch applications' });
      }
    }
  );

  /**
   * Get application details
   * GET /api/admin/manufacturer-applications/:id
   */
  app.get(
    '/api/admin/manufacturer-applications/:id',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'read'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);

        const [application] = await db
          .select()
          .from(manufacturerApplications)
          .where(eq(manufacturerApplications.id, id))
          .limit(1);

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Get product family names if IDs are set
        let productFamilyNames: string[] = [];
        if (application.productFamilies && application.productFamilies.length > 0) {
          const families = await db
            .select({ name: productFamilies.name })
            .from(productFamilies)
            .where(inArray(productFamilies.id, application.productFamilies));
          productFamilyNames = families.map((f) => f.name);
        }

        res.json({
          ...application,
          productFamilyNames,
        });
      } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: 'Failed to fetch application' });
      }
    }
  );

  /**
   * Request more information from applicant
   * POST /api/admin/manufacturer-applications/:id/request-info
   */
  app.post(
    '/api/admin/manufacturer-applications/:id/request-info',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { message } = req.body;
        const userData = (req as any).userData;

        if (!message) {
          return res.status(400).json({ message: 'Message is required' });
        }

        const [updated] = await db
          .update(manufacturerApplications)
          .set({
            status: 'info_requested',
            infoRequestMessage: message,
            reviewedBy: userData?.id,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerApplications.id, id))
          .returning();

        // TODO: Send email to applicant

        res.json(updated);
      } catch (error) {
        console.error('Error requesting info:', error);
        res.status(500).json({ message: 'Failed to request info' });
      }
    }
  );

  /**
   * Approve an application
   * POST /api/admin/manufacturer-applications/:id/approve
   */
  app.post(
    '/api/admin/manufacturer-applications/:id/approve',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { reviewNotes } = req.body;
        const userData = (req as any).userData;

        // Get the application
        const [application] = await db
          .select()
          .from(manufacturerApplications)
          .where(eq(manufacturerApplications.id, id))
          .limit(1);

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Create the manufacturer record
        const [newManufacturer] = await db
          .insert(manufacturers)
          .values({
            name: application.companyName,
            contactName: application.contactName,
            email: application.contactEmail,
            phone: application.contactPhone || undefined,
            country: application.country,
            timezone: undefined, // Will be set later
            zone: application.country === 'US' || application.country === 'USA' ? 'domestic' : 'offshore',
            capabilities: application.decorationMethods || undefined,
            isActive: true,
            acceptingNewOrders: true,
          })
          .returning();

        // Update the application
        const [updated] = await db
          .update(manufacturerApplications)
          .set({
            status: 'approved',
            reviewedBy: userData?.id,
            reviewedAt: new Date(),
            reviewNotes,
            createdManufacturerId: newManufacturer.id,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerApplications.id, id))
          .returning();

        // TODO: Send approval email with login instructions

        res.json({
          application: updated,
          manufacturer: newManufacturer,
        });
      } catch (error) {
        console.error('Error approving application:', error);
        res.status(500).json({ message: 'Failed to approve application' });
      }
    }
  );

  /**
   * Reject an application
   * POST /api/admin/manufacturer-applications/:id/reject
   */
  app.post(
    '/api/admin/manufacturer-applications/:id/reject',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'write'),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const { rejectionReason } = req.body;
        const userData = (req as any).userData;

        if (!rejectionReason) {
          return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const [updated] = await db
          .update(manufacturerApplications)
          .set({
            status: 'rejected',
            reviewedBy: userData?.id,
            reviewedAt: new Date(),
            rejectionReason,
            updatedAt: new Date(),
          })
          .where(eq(manufacturerApplications.id, id))
          .returning();

        // TODO: Send rejection email

        res.json(updated);
      } catch (error) {
        console.error('Error rejecting application:', error);
        res.status(500).json({ message: 'Failed to reject application' });
      }
    }
  );

  // ==================== PUBLIC: APPLICATION FORM ====================

  /**
   * Validate an invite code (public)
   * GET /api/public/manufacturer-invite/:code
   */
  app.get(
    '/api/public/manufacturer-invite/:code',
    async (req: Request, res: Response) => {
      try {
        const { code } = req.params;

        const [invite] = await db
          .select()
          .from(manufacturerInvites)
          .where(eq(manufacturerInvites.inviteCode, code))
          .limit(1);

        if (!invite) {
          return res.status(404).json({ message: 'Invite not found' });
        }

        if (invite.status === 'revoked') {
          return res.status(400).json({ message: 'This invite has been revoked' });
        }

        if (invite.status === 'completed') {
          return res.status(400).json({ message: 'This invite has already been used' });
        }

        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          return res.status(400).json({ message: 'This invite has expired' });
        }

        // Mark as opened if not already
        if (invite.status === 'sent') {
          await db
            .update(manufacturerInvites)
            .set({ status: 'opened', openedAt: new Date() })
            .where(eq(manufacturerInvites.id, invite.id));
        }

        res.json({
          valid: true,
          companyName: invite.companyName,
          contactEmail: invite.contactEmail,
          contactName: invite.contactName,
          expectedProductFamilies: invite.expectedProductFamilies,
        });
      } catch (error) {
        console.error('Error validating invite:', error);
        res.status(500).json({ message: 'Failed to validate invite' });
      }
    }
  );

  /**
   * Start or continue an application (public)
   * POST /api/public/manufacturer-application
   */
  app.post(
    '/api/public/manufacturer-application',
    async (req: Request, res: Response) => {
      try {
        const { inviteCode, companyName, contactName, contactEmail } = req.body;

        if (!companyName || !contactName || !contactEmail) {
          return res.status(400).json({ message: 'Company name, contact name, and email are required' });
        }

        // Check for invite
        let inviteId: number | undefined;
        if (inviteCode) {
          const [invite] = await db
            .select()
            .from(manufacturerInvites)
            .where(eq(manufacturerInvites.inviteCode, inviteCode))
            .limit(1);

          if (invite && invite.status !== 'revoked' && invite.status !== 'expired') {
            inviteId = invite.id;

            // Mark invite as started
            await db
              .update(manufacturerInvites)
              .set({ status: 'started', updatedAt: new Date() })
              .where(eq(manufacturerInvites.id, invite.id));
          }
        }

        // Check if application already exists for this email
        const [existingApp] = await db
          .select()
          .from(manufacturerApplications)
          .where(eq(manufacturerApplications.contactEmail, contactEmail))
          .limit(1);

        if (existingApp && existingApp.status !== 'rejected') {
          return res.json({
            existing: true,
            applicationCode: existingApp.applicationCode,
            currentStep: existingApp.currentStep,
            status: existingApp.status,
          });
        }

        // Create new application
        const applicationCode = generateCode('APP');

        const [application] = await db
          .insert(manufacturerApplications)
          .values({
            applicationCode,
            inviteId,
            status: 'draft',
            currentStep: 1,
            companyName,
            contactName,
            contactEmail,
            country: 'US', // Default, will be updated
          })
          .returning();

        res.status(201).json({
          existing: false,
          applicationCode: application.applicationCode,
          applicationId: application.id,
          currentStep: 1,
        });
      } catch (error) {
        console.error('Error creating application:', error);
        res.status(500).json({ message: 'Failed to create application' });
      }
    }
  );

  /**
   * Get application by code (public - for continuing)
   * GET /api/public/manufacturer-application/:code
   */
  app.get(
    '/api/public/manufacturer-application/:code',
    async (req: Request, res: Response) => {
      try {
        const { code } = req.params;

        const [application] = await db
          .select()
          .from(manufacturerApplications)
          .where(eq(manufacturerApplications.applicationCode, code))
          .limit(1);

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        // Don't return sensitive fields
        const safeApplication = {
          applicationCode: application.applicationCode,
          status: application.status,
          currentStep: application.currentStep,
          companyName: application.companyName,
          contactName: application.contactName,
          contactEmail: application.contactEmail,
          country: application.country,
          infoRequestMessage: application.infoRequestMessage,
        };

        res.json(safeApplication);
      } catch (error) {
        console.error('Error fetching application:', error);
        res.status(500).json({ message: 'Failed to fetch application' });
      }
    }
  );

  /**
   * Update application step (public)
   * PUT /api/public/manufacturer-application/:code/step/:step
   */
  app.put(
    '/api/public/manufacturer-application/:code/step/:step',
    async (req: Request, res: Response) => {
      try {
        const { code, step } = req.params;
        const stepNum = parseInt(step);
        const data = req.body;

        const [application] = await db
          .select()
          .from(manufacturerApplications)
          .where(eq(manufacturerApplications.applicationCode, code))
          .limit(1);

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status === 'submitted' || application.status === 'approved' || application.status === 'rejected') {
          return res.status(400).json({ message: 'Application has already been submitted' });
        }

        // Build updates based on step
        const updates: any = {
          currentStep: Math.max(application.currentStep || 1, stepNum),
          updatedAt: new Date(),
        };

        switch (stepNum) {
          case 1: // Basic Info
            updates.companyName = data.companyName;
            updates.companyLegalName = data.companyLegalName;
            updates.contactName = data.contactName;
            updates.contactEmail = data.contactEmail;
            updates.contactPhone = data.contactPhone;
            updates.country = data.country;
            updates.address = data.address;
            updates.city = data.city;
            updates.state = data.state;
            updates.zipCode = data.zipCode;
            updates.yearsInBusiness = data.yearsInBusiness;
            updates.employeeCount = data.employeeCount;
            updates.website = data.website;
            break;

          case 2: // Capabilities
            updates.productFamilies = data.productFamilies;
            updates.decorationMethods = data.decorationMethods;
            updates.monthlyCapacity = data.monthlyCapacity;
            updates.leadTimedays = data.leadTimeDays;
            updates.equipmentList = data.equipmentList;
            updates.specializations = data.specializations;
            break;

          case 3: // Documentation
            updates.businessLicenseUrl = data.businessLicenseUrl;
            updates.taxDocumentUrl = data.taxDocumentUrl;
            updates.qualityCertifications = data.qualityCertifications;
            updates.portfolioUrls = data.portfolioUrls;
            updates.bankInfoUrl = data.bankInfoUrl;
            break;

          case 4: // Pricing & Terms
            updates.preferredPaymentTerms = data.preferredPaymentTerms;
            updates.minOrderQuantity = data.minOrderQuantity;
            updates.pricingNotes = data.pricingNotes;
            updates.shippingPreferences = data.shippingPreferences;
            break;
        }

        const [updated] = await db
          .update(manufacturerApplications)
          .set(updates)
          .where(eq(manufacturerApplications.applicationCode, code))
          .returning();

        res.json({
          currentStep: updated.currentStep,
          status: updated.status,
        });
      } catch (error) {
        console.error('Error updating application step:', error);
        res.status(500).json({ message: 'Failed to update application' });
      }
    }
  );

  /**
   * Submit application (public)
   * POST /api/public/manufacturer-application/:code/submit
   */
  app.post(
    '/api/public/manufacturer-application/:code/submit',
    async (req: Request, res: Response) => {
      try {
        const { code } = req.params;

        const [application] = await db
          .select()
          .from(manufacturerApplications)
          .where(eq(manufacturerApplications.applicationCode, code))
          .limit(1);

        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        if (application.status !== 'draft' && application.status !== 'info_requested') {
          return res.status(400).json({ message: 'Application cannot be submitted in current state' });
        }

        // Update application status
        const [updated] = await db
          .update(manufacturerApplications)
          .set({
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(manufacturerApplications.applicationCode, code))
          .returning();

        // If there was an invite, mark it complete
        if (application.inviteId) {
          await db
            .update(manufacturerInvites)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(manufacturerInvites.id, application.inviteId));
        }

        // TODO: Notify admins of new application

        res.json({
          success: true,
          message: 'Application submitted successfully. We will review and get back to you within 2-3 business days.',
          applicationCode: updated.applicationCode,
        });
      } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ message: 'Failed to submit application' });
      }
    }
  );

  // ==================== STATS ====================

  /**
   * Get onboarding stats
   * GET /api/admin/manufacturer-onboarding/stats
   */
  app.get(
    '/api/admin/manufacturer-onboarding/stats',
    isAuthenticated,
    loadUserData,
    requirePermission('manufacturerManagement', 'read'),
    async (req: Request, res: Response) => {
      try {
        // Invite stats
        const inviteStats = await db
          .select({
            status: manufacturerInvites.status,
            count: sql<number>`COUNT(*)`,
          })
          .from(manufacturerInvites)
          .groupBy(manufacturerInvites.status);

        // Application stats
        const applicationStats = await db
          .select({
            status: manufacturerApplications.status,
            count: sql<number>`COUNT(*)`,
          })
          .from(manufacturerApplications)
          .groupBy(manufacturerApplications.status);

        // Pending review count
        const pendingReview = applicationStats.find((s) => s.status === 'submitted')?.count || 0;

        res.json({
          invitesByStatus: Object.fromEntries(inviteStats.map((s) => [s.status, s.count])),
          applicationsByStatus: Object.fromEntries(applicationStats.map((s) => [s.status, s.count])),
          pendingReviewCount: pendingReview,
        });
      } catch (error) {
        console.error('Error fetching onboarding stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
      }
    }
  );
}
