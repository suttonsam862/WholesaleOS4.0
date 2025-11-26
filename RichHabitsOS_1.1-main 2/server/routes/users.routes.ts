import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, loadUserData, requirePermission, type AuthenticatedRequest } from "./shared/middleware";
import { stripFinancialData } from "./shared/utils";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

export function registerUserRoutes(app: Express): void {
  // Public endpoint for user assignment dropdowns - returns basic user info for all authenticated users
  app.get('/api/users/for-assignment', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Return only essential fields for assignment dropdowns (no password hashes, no sensitive data)
      const assignmentUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }));
      res.json(assignmentUsers);
    } catch (error) {
      console.error("Error fetching users for assignment:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Designer management route - accessible to those with designerManagement permissions
  app.get('/api/designers', isAuthenticated, loadUserData, requirePermission('designerManagement', 'read'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Filter to only designers and remove password hashes from response
      const designers = users
        .filter(user => user.role === 'designer')
        .map(({ passwordHash, ...user }) => user);
      res.json(designers);
    } catch (error) {
      console.error("Error fetching designers:", error);
      res.status(500).json({ message: "Failed to fetch designers" });
    }
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove password hashes from response
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Validate role against database roles (supports custom roles)
      const roles = await storage.getRoles();
      const validRoleNames = roles.map(r => r.name);
      if (!validRoleNames.includes(validatedData.role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoleNames.join(', ')}` });
      }

      // Check for duplicate email
      if (validatedData.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Hash password if provided
      let hashedPassword = undefined;
      if (req.body.password) {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
      }

      const userToCreate = {
        ...validatedData,
        passwordHash: hashedPassword
      };

      const user = await storage.createUser(userToCreate);

      // Log activity - use a hash of the user ID for audit trail since user IDs are strings
      const userIdHash = user.id.split('').reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0);
      }, 0);
      // Ensure the hash fits in a 32-bit signed integer range (-2^31 to 2^31-1)
      const safeHash = Math.abs(userIdHash) % 2147483647;
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'user',
        safeHash,
        'created',
        null,
        user
      );

      // Remove password hash from response
      const { passwordHash, ...sanitizedUser } = user;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get('/api/users/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password hash from response
      const { passwordHash, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User manufacturer associations for security filtering
  app.get('/api/users/:id/manufacturer-associations', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userId = req.params.id;
      const requestingUser = (req as AuthenticatedRequest).user.userData!;

      // Security check: Users can only get their own associations unless admin
      if (requestingUser.id !== userId && requestingUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: You can only view your own manufacturer associations" });
      }

      const associations = await storage.getUserManufacturerAssociations(userId);
      res.json(associations);
    } catch (error) {
      console.error("Error fetching user manufacturer associations:", error);
      res.status(500).json({ message: "Failed to fetch manufacturer associations" });
    }
  });

  app.put('/api/users/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;

      // Get existing user
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const validatedData = insertUserSchema.partial().parse(req.body);

      // Validate role if provided against database roles (supports custom roles)
      if (validatedData.role) {
        const roles = await storage.getRoles();
        const validRoleNames = roles.map(r => r.name);
        if (!validRoleNames.includes(validatedData.role)) {
          return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoleNames.join(', ')}` });
        }

        // Check if changing role from admin
        if (existingUser.role === 'admin' && validatedData.role !== 'admin') {
          // Check if this would leave no admins
          const adminCount = await storage.countAdmins();
          if (adminCount <= 1) {
            return res.status(400).json({ message: "Cannot remove last admin user" });
          }
        }
      }

      // Check for duplicate email
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const userWithEmail = await storage.getUserByEmail(validatedData.email);
        if (userWithEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Hash password if provided
      let updateData: any = { ...validatedData };
      if (req.body.password) {
        updateData.passwordHash = await bcrypt.hash(req.body.password, 10);
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      // Log activity - use a hash of the user ID for audit trail since user IDs are strings
      const userIdHash = updatedUser.id.split('').reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0);
      }, 0);
      // Ensure the hash fits in a 32-bit signed integer range (-2^31 to 2^31-1)
      const safeHash = Math.abs(userIdHash) % 2147483647;
      await storage.logActivity(
        currentUserId,
        'user',
        safeHash,
        'updated',
        existingUser,
        updatedUser
      );

      // Remove password hash from response
      const { passwordHash, ...sanitizedUser } = updatedUser;
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'delete'), async (req, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;

      // Prevent self-deletion
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Get existing user
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if deleting an admin
      if (existingUser.role === 'admin') {
        const adminCount = await storage.countAdmins();
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot delete the last admin user" });
        }
      }

      await storage.deleteUser(userId);

      // Log activity - use a hash of the user ID for audit trail since user IDs are strings
      const userIdHash = existingUser.id.split('').reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0);
      }, 0);
      // Ensure the hash fits in a 32-bit signed integer range (-2^31 to 2^31-1)
      const safeHash = Math.abs(userIdHash) % 2147483647;
      await storage.logActivity(
        currentUserId,
        'user',
        safeHash,
        'deleted',
        existingUser,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      let notifications = await storage.getNotifications(userId);

      if (limit) {
        notifications = notifications.slice(0, limit);
      }

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post('/api/notifications/mark-all-read', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, loadUserData, requirePermission('dashboard', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const stats = await storage.getDashboardStats(user);
      
      // Strip financial data for manufacturer role
      const filteredStats = stripFinancialData(stats, user.role);
      res.json(filteredStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Global search
  app.get('/api/search', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const results = await storage.globalSearch(q, (req as AuthenticatedRequest).user.userData!);
      res.json(results);
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Recent activity
  app.get('/api/activity/recent', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity(10, (req as AuthenticatedRequest).user.userData!);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
}
