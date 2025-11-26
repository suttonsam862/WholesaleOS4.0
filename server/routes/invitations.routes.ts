import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import * as bcrypt from "bcryptjs";

export function registerInvitationRoutes(app: Express): void {
  // Invitation routes
  app.get('/api/invitations', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const invitations = await storage.getInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post('/api/invitations', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { sendInvitationEmail } = await import("../sendgrid-service");
      const { nanoid } = await import("nanoid");

      const { email, name, role } = req.body;

      // Validate input
      if (!email || !name || !role) {
        return res.status(400).json({ message: "Email, name, and role are required" });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }

      // Check if there's a pending invitation for this email
      const existingInvitation = await storage.getInvitations();
      const pendingInvitation = existingInvitation.find(
        inv => inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
      );

      if (pendingInvitation) {
        return res.status(400).json({ message: "An invitation has already been sent to this email" });
      }

      // Generate unique token
      const token = nanoid(32);

      // Set expiration to 48 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // Create invitation
      const invitation = await storage.createInvitation({
        email,
        name,
        role: role as any,
        token,
        expiresAt,
        status: 'pending'
      });

      // Send invitation email
      const inviterName = (req as AuthenticatedRequest).user?.userData?.name || 'Administrator';
      const invitationLink = `${req.protocol}://${req.get('host')}/setup-account?token=${token}`;

      const emailResult = await sendInvitationEmail({
        toEmail: email,
        toName: name,
        inviterName,
        invitationLink,
        expirationHours: 48
      });

      if (!emailResult.success) {
        // Delete the invitation if email failed to send
        await storage.deleteInvitation(invitation.id);
        return res.status(500).json({ 
          message: `Failed to send invitation email: ${emailResult.error}` 
        });
      }

      res.json({ 
        message: "Invitation sent successfully", 
        invitation 
      });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      res.status(400).json({ message: error.message || "Failed to create invitation" });
    }
  });

  app.post('/api/invitations/resend/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { resendInvitationEmail } = await import("../sendgrid-service");
      const { nanoid } = await import("nanoid");

      const id = parseInt(req.params.id);
      const invitation = await storage.getInvitation(id);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      if (invitation.status === 'accepted') {
        return res.status(400).json({ message: "This invitation is no longer valid" });
      }

      // Generate new token and expiration
      const token = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // Update invitation
      const updatedInvitation = await storage.updateInvitation(id, {
        token,
        expiresAt,
        status: 'pending'
      });

      // Resend invitation email
      const inviterName = (req as AuthenticatedRequest).user?.userData?.name || 'Administrator';
      const invitationLink = `${req.protocol}://${req.get('host')}/setup-account?token=${token}`;

      const emailResult = await resendInvitationEmail({
        toEmail: invitation.email,
        toName: invitation.name,
        inviterName,
        invitationLink,
        expirationHours: 48
      });

      if (!emailResult.success) {
        return res.status(500).json({ 
          message: `Failed to resend invitation email: ${emailResult.error}` 
        });
      }

      res.json({ 
        message: "Invitation resent successfully", 
        invitation: updatedInvitation 
      });
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      res.status(400).json({ message: error.message || "Failed to resend invitation" });
    }
  });

  app.delete('/api/invitations/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const invitation = await storage.getInvitation(id);

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      await storage.deleteInvitation(id);
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Public route for validating invitation token
  app.get('/api/invitations/validate/:token', async (req, res) => {
    try {
      const token = req.params.token;
      const invitation = await storage.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "This invitation is no longer valid" });
      }

      if (new Date() > invitation.expiresAt) {
        await storage.updateInvitation(invitation.id, { status: 'expired' });
        return res.status(400).json({ message: "This invitation has expired" });
      }

      res.json({
        valid: true,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role
      });
    } catch (error) {
      console.error("Error validating invitation:", error);
      res.status(500).json({ message: "Failed to validate invitation" });
    }
  });

  // Public route for completing account setup
  app.post('/api/invitations/complete-setup', async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const invitation = await storage.getInvitationByToken(token);

      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "This invitation is no longer valid" });
      }

      if (new Date() > invitation.expiresAt) {
        await storage.updateInvitation(invitation.id, { status: 'expired' });
        return res.status(400).json({ message: "This invitation has expired" });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
      const user = await storage.createUser({
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        passwordHash: hashedPassword,
        isInvited: true,
        hasCompletedSetup: true
      });

      // Mark invitation as accepted
      await storage.updateInvitation(invitation.id, { 
        status: 'accepted',
        userId: user.id
      });

      res.json({ 
        message: "Account setup completed successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error: any) {
      console.error("Error completing account setup:", error);
      res.status(400).json({ message: error.message || "Failed to complete account setup" });
    }
  });
}
