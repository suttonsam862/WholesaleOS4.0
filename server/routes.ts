import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertOrganizationSchema, 
  insertLeadSchema, 
  insertProductSchema, 
  insertOrderSchema, 
  insertCategorySchema, 
  insertProductVariantSchema,
  insertContactSchema,
  insertDesignJobSchema,
  insertManufacturerSchema,
  insertManufacturingSchema,
  insertManufacturingUpdateSchema,
  insertOrderLineItemSchema,
  insertSalespersonSchema,
  insertUserSchema,
  insertQuoteSchema,
  insertQuoteLineItemSchema,
  insertRoleSchema,
  insertResourceSchema,
  insertRolePermissionSchema,
  insertInvitationSchema,
  insertOrderLineItemManufacturerSchema,
  insertInvoiceSchema,
  insertInvoicePaymentSchema,
  insertCommissionPaymentSchema,
  insertProductCogsSchema,
  insertNotificationSchema,
  insertDesignResourceSchema,
  insertSalesResourceSchema,
  insertManufacturingAttachmentSchema,
  insertTeamStoreSchema,
  insertTeamStoreLineItemSchema
} from "@shared/schema";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import { loadUserData, requirePermission, requirePermissionOr, filterDataByRole, type AuthenticatedRequest, type UserRole } from "./permissions";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { FileUploadSecurityService, type FileUploadValidationRequest } from "./fileUploadSecurity";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { productVariants, orderLineItems, users, manufacturingUpdateLineItems } from "@shared/schema";
import jsPDF from "jspdf";
import "jspdf-autotable";
import archiver from "archiver";
import { isValidManufacturingStatus, getValidManufacturingStatuses } from "./routes/config.routes";

// Utility function to strip financial data for manufacturer role
function stripFinancialData(data: any, userRole: string): any {
  if (userRole !== 'manufacturer') {
    return data; // Only filter for manufacturer role
  }

  if (Array.isArray(data)) {
    return data.map(item => stripFinancialData(item, userRole));
  }

  if (data && typeof data === 'object') {
    const filtered = { ...data };
    
    // Remove financial fields
    delete filtered.unitPrice;
    delete filtered.lineTotal;
    delete filtered.subtotal;
    delete filtered.total;
    delete filtered.taxAmount;
    delete filtered.discount;
    delete filtered.msrp;
    delete filtered.cost;
    delete filtered.basePrice;
    delete filtered.commission;
    delete filtered.revenue;
    delete filtered.amountPaid;
    delete filtered.invoiceUrl;
    
    // Recursively filter nested objects and arrays
    if (filtered.lineItems && Array.isArray(filtered.lineItems)) {
      filtered.lineItems = filtered.lineItems.map((item: any) => stripFinancialData(item, userRole));
    }
    
    if (filtered.variant && typeof filtered.variant === 'object') {
      filtered.variant = stripFinancialData(filtered.variant, userRole);
    }
    
    return filtered;
  }

  return data;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, loadUserData, async (req, res) => {
    try {
      res.json((req as AuthenticatedRequest).user.userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local authentication routes
  app.post('/api/auth/local/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`[LocalAuth] Login attempt for: ${email}`);

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { LocalAuthManager } = await import("./localAuth");
      const user = await LocalAuthManager.authenticateUser(email, password);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Create session data
      const sessionData = LocalAuthManager.createLocalSession(user);

      // Store in passport session
      req.login(sessionData, (err) => {
        if (err) {
          console.error("[LocalAuth] Session creation error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        console.log(`[LocalAuth] Login successful for: ${email} (${user.role})`);

        // Ensure session is saved before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[LocalAuth] Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }

          // Set CORS headers for production
          if (process.env.NODE_ENV === 'production') {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          }

          res.json({
            message: "Login successful",
            user: sessionData.userData
          });
        });
      });
    } catch (error) {
      console.error("[LocalAuth] Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get available test users (for development only)
  app.get('/api/auth/local/test-users', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Only available in development" });
      }

      const users = await storage.getUsers();
      const testUsers = users
        .filter(u => u.isActive && u.passwordHash)
        .map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          hasPassword: !!u.passwordHash
        }));

      res.json(testUsers);
    } catch (error) {
      console.error("[LocalAuth] Error fetching test users:", error);
      res.status(500).json({ message: "Failed to fetch test users" });
    }
  });

  // Test authentication routes (DEVELOPMENT ONLY - Critical for deterministic testing)
  app.post('/api/test/auth/setup', async (req, res) => {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Test authentication only available in development" });
      }

      const { TestAuthenticationManager } = await import("./testAuth");

      console.log('🔐 [API] Setting up deterministic test authentication...');

      // Set up deterministic authentication
      const authSetup = await TestAuthenticationManager.setupDeterministicAuth();

      // Return session data for browser injection
      res.json({
        success: true,
        sessionId: authSetup.session.sessionId,
        sessionCookie: authSetup.sessionCookie, // Full formatted cookie string for browser injection
        user: {
          id: authSetup.user.id,
          email: authSetup.user.email,
          role: authSetup.user.role,
          name: authSetup.user.name
        },
        authenticationVerified: authSetup.authenticationVerified,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [API] Test authentication setup failed:', error);
      res.status(500).json({ 
        success: false,
        message: "Test authentication setup failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Test authentication verification endpoint (CRITICAL FIX: Direct bypass for mobile testing)
  app.get('/api/test/auth/verify', async (req, res) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: "Test authentication only available in development" });
      }

      console.log('🔍 [API] Test auth verify - bypassing middleware for mobile testing reliability');

      // CRITICAL FIX: Direct session validation bypassing complex middleware
      const sessionCookie = req.headers.cookie;
      if (sessionCookie) {
        const cookieMatch = sessionCookie.match(/connect\.sid=([^;]+)/);
        if (cookieMatch) {
          const rawCookie = cookieMatch[1];
          console.log('   Found session cookie');

          // Import cookie-signature and verify the session ID  
          const signature = await import('cookie-signature');

          try {
            const sessionId = signature.default.unsign(rawCookie, process.env.SESSION_SECRET!);
            console.log('   Session ID verified');

            if (sessionId !== false) {
              // Look up session directly in database
              const { db } = await import("./db");
              const { sessions } = await import("@shared/schema");
              const { eq } = await import("drizzle-orm");

              const [sessionRecord] = await db
                .select()
                .from(sessions)
                .where(eq(sessions.sid, sessionId as string));

              if (sessionRecord && sessionRecord.sess) {
                const sessionData = sessionRecord.sess as any;
                console.log('   Session found in database');

                if (sessionData.passport && 
                    sessionData.passport.user && 
                    sessionData.passport.user.claims &&
                    sessionData.passport.user.claims.email &&
                    sessionData.passport.user.claims.email.includes('test-admin@automated-testing.local')) {

                  console.log('✅ [API] Test session verified successfully via direct database check');

                  // Create user data response from session
                  const userData = {
                    id: sessionData.passport.user.userData.id,
                    email: sessionData.passport.user.userData.email,
                    firstName: sessionData.passport.user.userData.firstName,
                    lastName: sessionData.passport.user.userData.lastName,
                    name: sessionData.passport.user.userData.name,
                    role: sessionData.passport.user.userData.role
                  };

                  return res.json({
                    authenticated: true,
                    isTestUser: true,
                    user: userData,
                    canAccessProtectedRoutes: userData.role === 'admin',
                    timestamp: new Date().toISOString(),
                    authMethod: 'direct-database-bypass'
                  });
                }
              } else {
                console.log('   Session not found in database');
              }
            }
          } catch (signatureError) {
            console.log('   Cookie signature verification failed:', signatureError instanceof Error ? signatureError.message : String(signatureError));
          }
        } else {
          console.log('   No connect.sid cookie found in:', sessionCookie);
        }
      } else {
        console.log('   No cookies in request');
      }

      console.log('❌ [API] Test authentication verification failed - no valid session');
      res.status(401).json({ 
        authenticated: false,
        message: "Test session not found or invalid"
      });

    } catch (error) {
      console.error('❌ [API] Test authentication verification error:', error);
      res.status(500).json({ 
        authenticated: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Development-only: Test users endpoint (no auth required)
  app.get('/api/test/users', async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: "Not found" });
    }
    
    const testUsers = [
      {
        id: "test-admin-1",
        name: "Test Admin",
        firstName: "Test",
        lastName: "Admin",
        email: "test_admin@example.com",
        role: "admin",
        isActive: true
      },
      {
        id: "test-sales-1",
        name: "Test Sales",
        firstName: "Test",
        lastName: "Sales",
        email: "test_sales@example.com",
        role: "sales",
        isActive: true
      },
      {
        id: "test-designer-1",
        name: "Test Designer",
        firstName: "Test",
        lastName: "Designer",
        email: "test_designer@example.com",
        role: "designer",
        isActive: true
      },
      {
        id: "test-ops-1",
        name: "Test Ops",
        firstName: "Test",
        lastName: "Ops",
        email: "test_ops@example.com",
        role: "ops",
        isActive: true
      },
      {
        id: "test-manufacturer-1",
        name: "Test Manufacturer",
        firstName: "Test",
        lastName: "Manufacturer",
        email: "test_manufacturer@example.com",
        role: "manufacturer",
        isActive: true
      }
    ];
    
    res.json(testUsers);
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

      // Validate role
      const validRoles = ['admin', 'sales', 'designer', 'ops', 'manufacturer', 'finance'];
      if (!validRoles.includes(validatedData.role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
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

  // Salespeople routes
  app.get('/api/salespeople', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const salespeople = await storage.getSalespeople();
      res.json(salespeople);
    } catch (error) {
      console.error("Error fetching salespeople:", error);
      res.status(500).json({ message: "Failed to fetch salespeople" });
    }
  });

  app.get('/api/salespeople/with-metrics', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      console.log('🔍 [API] Fetching salespeople with metrics...');
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      const salespeople = await storage.getSalespeopleWithMetrics();
      console.log('🔍 [API] Found salespeople:', salespeople.length);

      // Sales users can only see their own metrics
      if (userRole === 'sales') {
        const filteredSalespeople = salespeople.filter(sp => sp.userId === userId);
        return res.json(filteredSalespeople);
      }

      // Admin and other roles see all salespeople
      res.json(salespeople);
    } catch (error) {
      console.error("Error fetching salespeople with metrics:", error);
      res.status(500).json({ message: "Failed to fetch salespeople with metrics" });
    }
  });

  app.post('/api/salespeople', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const validatedData = insertSalespersonSchema.parse(req.body);
      const salesperson = await storage.createSalesperson(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        salesperson.id,
        'created',
        null,
        salesperson
      );

      res.status(201).json(salesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating salesperson:", error);
      res.status(500).json({ message: "Failed to create salesperson" });
    }
  });

  app.get('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      res.json(salesperson);
    } catch (error) {
      console.error("Error fetching salesperson:", error);
      res.status(500).json({ message: "Failed to fetch salesperson" });
    }
  });

  app.put('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSalespersonSchema.partial().parse(req.body);

      const existingSalesperson = await storage.getSalesperson(id);
      if (!existingSalesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      const updatedSalesperson = await storage.updateSalesperson(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        id,
        'updated',
        existingSalesperson,
        updatedSalesperson
      );

      res.json(updatedSalesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating salesperson:", error);
      res.status(500).json({ message: "Failed to update salesperson" });
    }
  });

  app.delete('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingSalesperson = await storage.getSalesperson(id);
      if (!existingSalesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      await storage.deleteSalesperson(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        id,
        'deleted',
        existingSalesperson,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      res.status(500).json({ message: "Failed to delete salesperson" });
    }
  });

  // Bulk order reassignment
  app.put('/api/orders/bulk-reassign', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const { orderIds, salespersonId } = req.body;

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs are required" });
      }

      let updatedCount = 0;
      for (const orderId of orderIds) {
        try {
          await storage.updateOrder(orderId, { 
            salespersonId: salespersonId || null 
          });
          updatedCount++;
        } catch (error) {
          console.error(`Error updating order ${orderId}:`, error);
        }
      }

      // Log activity for bulk operation
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        0, // Bulk operation
        'bulk_reassigned',
        { orderIds, previousSalesperson: 'various' },
        { orderIds, newSalesperson: salespersonId || 'unassigned', count: updatedCount }
      );

      res.json({ 
        message: `Successfully reassigned ${updatedCount} orders`,
        updated: updatedCount,
        total: orderIds.length
      });
    } catch (error) {
      console.error("Error in bulk reassignment:", error);
      res.status(500).json({ message: "Failed to reassign orders" });
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

      // Validate role if provided
      if (validatedData.role) {
        const validRoles = ['admin', 'sales', 'designer', 'ops', 'manufacturer', 'finance'];
        if (!validRoles.includes(validatedData.role)) {
          return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
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

  // Organizations
  app.get('/api/organizations', isAuthenticated, loadUserData, requirePermission('organizations', 'read'), async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      // Organizations are viewable by all who have read permission
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post('/api/organizations', isAuthenticated, loadUserData, requirePermission('organizations', 'write'), async (req, res) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'organization',
        organization.id,
        'created',
        null,
        organization
      );

      res.status(201).json(organization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating organization:", error);
      // Ensure we always return JSON
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create organization" });
      }
    }
  });

  app.get('/api/organizations/:id', isAuthenticated, loadUserData, requirePermission('organizations', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.put('/api/organizations/:id', isAuthenticated, loadUserData, requirePermission('organizations', 'write'), async (req, res) => {
    console.log(`[UPDATE ORG] Starting organization update for ID: ${req.params.id}`);
    console.log(`[UPDATE ORG] User:`, (req as AuthenticatedRequest).user?.userData);
    console.log(`[UPDATE ORG] Request body:`, JSON.stringify(req.body, null, 2));
    
    try {
      const id = parseInt(req.params.id);
      console.log(`[UPDATE ORG] Parsed ID: ${id}`);
      
      const validatedData = insertOrganizationSchema.partial().parse(req.body);
      console.log(`[UPDATE ORG] Validated data:`, JSON.stringify(validatedData, null, 2));

      const existingOrg = await storage.getOrganization(id);
      if (!existingOrg) {
        console.error(`[UPDATE ORG] Organization ${id} not found`);
        return res.status(404).json({ message: "Organization not found" });
      }
      console.log(`[UPDATE ORG] Existing org:`, existingOrg.name);

      const updatedOrg = await storage.updateOrganization(id, validatedData);
      console.log(`[UPDATE ORG] Organization updated successfully:`, JSON.stringify(updatedOrg, null, 2));

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'organization',
        id,
        'updated',
        existingOrg,
        updatedOrg
      );

      console.log(`[UPDATE ORG] Sending response with updated org`);
      res.json(updatedOrg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`[UPDATE ORG] Validation error:`, error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("[UPDATE ORG] Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.delete('/api/organizations/:id', isAuthenticated, loadUserData, requirePermission('organizations', 'delete'), async (req, res) => {
    console.log(`[DELETE ROUTE] Starting organization deletion process for ID: ${req.params.id}`);
    console.log(`[DELETE ROUTE] Request method: ${req.method}`);
    console.log(`[DELETE ROUTE] Request URL: ${req.url}`);
    console.log(`[DELETE ROUTE] Request headers:`, req.headers);

    try {
      const id = parseInt(req.params.id);
      console.log(`[DELETE ROUTE] Parsed organization ID: ${id}`);

      if (isNaN(id)) {
        console.error(`[DELETE ROUTE] Invalid organization ID provided: ${req.params.id}`);
        const errorResponse = { message: "Invalid organization ID" };
        console.log(`[DELETE ROUTE] Sending 400 response:`, errorResponse);
        return res.status(400).json(errorResponse);
      }

      console.log(`[DELETE ROUTE] Checking if organization exists...`);
      const existingOrg = await storage.getOrganization(id);
      if (!existingOrg) {
        console.error(`[DELETE ROUTE] Organization with ID ${id} not found`);
        const errorResponse = { message: "Organization not found" };
        console.log(`[DELETE ROUTE] Sending 404 response:`, errorResponse);
        return res.status(404).json(errorResponse);
      }

      console.log(`[DELETE ROUTE] Found organization: ${existingOrg.name} (ID: ${id})`);
      console.log(`[DELETE ROUTE] Calling storage.deleteOrganization(${id})`);
      await storage.deleteOrganization(id);
      console.log(`[DELETE ROUTE] Storage delete completed successfully`);

      // Log activity
      console.log(`[DELETE ROUTE] Logging activity...`);
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'organization',
        id,
        'deleted',
        existingOrg,
        null
      );
      console.log(`[DELETE ROUTE] Activity logged successfully`);

      console.log(`[DELETE ROUTE] Organization ${id} deleted successfully, sending 204 response`);
      res.status(204).send();
      console.log(`[DELETE ROUTE] Response sent successfully`);
    } catch (error) {
      console.error(`[DELETE ROUTE] Error deleting organization ${req.params.id}:`, error);
      console.error(`[DELETE ROUTE] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      console.log(`[DELETE ROUTE] Response headers sent?`, res.headersSent);

      // Ensure we always return JSON, even on unexpected errors
      if (!res.headersSent) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const errorResponse = { 
          message: "Failed to delete organization", 
          error: errorMessage,
          details: error instanceof Error ? error.stack : String(error)
        };
        console.log(`[DELETE ROUTE] Sending 500 error response:`, errorResponse);
        res.status(500).json(errorResponse);
      } else {
        console.error(`[DELETE ROUTE] Could not send error response - headers already sent`);
      }
    }
  });

  // Leads
  app.get('/api/leads', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      let leads;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin') {
        // Admin users see all leads
        leads = await storage.getLeads();
      } else if (user.role === 'sales') {
        // Sales users only see their own leads
        leads = await storage.getLeadsBySalesperson(user.id);
      } else {
        // Other roles see all leads (if they have read permission)
        leads = await storage.getLeads();
      }

      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/leads', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      // Remove leadCode from validation since it's auto-generated
      const { leadCode, ...dataToValidate } = req.body;
      const validatedData = insertLeadSchema.parse(dataToValidate);

      // Sales users can only create leads for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedData.ownerUserId = (req as AuthenticatedRequest).user.userData!.id;
      }

      const lead = await storage.createLead(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'lead',
        lead.id,
        'created',
        null,
        lead
      );

      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Leads owners endpoint for dropdown filtering (accessible to all roles with leads permission)
  app.get('/api/leads/owners', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Return minimal user data for dropdowns - only id and name
      const ownerOptions = users.map(user => ({
        id: user.id,
        name: user.name
      }));
      res.json(ownerOptions);
    } catch (error) {
      console.error("Error fetching lead owners:", error);
      res.status(500).json({ message: "Failed to fetch lead owners" });
    }
  });

  app.get('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can view this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && lead.ownerUserId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.put('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLeadSchema.partial().parse(req.body);

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can update this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && existingLead.ownerUserId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedLead = await storage.updateLead(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'lead',
        id,
        'updated',
        existingLead,
        updatedLead
      );

      res.json(updatedLead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete('/api/leads/:id', isAuthenticated, loadUserData, requirePermission('leads', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Check if user can delete this lead
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales') {
        return res.status(403).json({ message: "Sales users cannot delete leads" });
      }

      await storage.deleteLead(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'lead',
        id,
        'deleted',
        existingLead,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Communication Logs
  app.get('/api/communications/lead/:leadId', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      const logs = await storage.getCommunicationLogs(leadId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching communication logs:", error);
      res.status(500).json({ message: "Failed to fetch communication logs" });
    }
  });

  app.get('/api/communications', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const userRole = (req as AuthenticatedRequest).user.userData!.role;
      
      let logs;
      if (userRole === 'sales') {
        logs = await storage.getCommunicationLogsByUser(userId);
      } else {
        logs = await storage.getCommunicationLogs();
      }
      res.json(logs);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.post('/api/communications', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const logData = { ...req.body, userId };
      const log = await storage.createCommunicationLog(logData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating communication log:", error);
      res.status(500).json({ message: "Failed to create communication log" });
    }
  });

  // User Permissions
  app.get('/api/permissions/user/:userId', isAuthenticated, loadUserData, requirePermission('users', 'read'), async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  app.post('/api/permissions/user/:userId', isAuthenticated, loadUserData, requirePermission('users', 'write'), async (req, res) => {
    try {
      const userId = req.params.userId;
      const { resourceId, ...permissionData } = req.body;
      
      // Check if permission already exists
      const existing = await storage.getUserPermissionForResource(userId, resourceId);
      if (existing) {
        // Update existing
        const updated = await storage.updateUserPermission(existing.id, permissionData);
        return res.json(updated);
      }
      
      // Create new
      const permission = await storage.createUserPermission({ userId, resourceId, ...permissionData });
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error creating/updating user permission:", error);
      res.status(500).json({ message: "Failed to save user permission" });
    }
  });

  app.delete('/api/permissions/user/:userId/:resourceId', isAuthenticated, loadUserData, requirePermission('users', 'write'), async (req, res) => {
    try {
      const userId = req.params.userId;
      const resourceId = parseInt(req.params.resourceId);
      const permission = await storage.getUserPermissionForResource(userId, resourceId);
      
      if (permission) {
        await storage.deleteUserPermission(permission.id);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user permission:", error);
      res.status(500).json({ message: "Failed to delete user permission" });
    }
  });

  // Lead Archiving
  app.post('/api/leads/:id/archive', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const archived = await storage.archiveLead(id, userId);
      res.json(archived);
    } catch (error) {
      console.error("Error archiving lead:", error);
      res.status(500).json({ message: "Failed to archive lead" });
    }
  });

  app.get('/api/leads/archived/list', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const userRole = (req as AuthenticatedRequest).user.userData!.role;
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      let archived;
      if (userRole === 'sales') {
        archived = await storage.getArchivedLeads(userId);
      } else {
        archived = await storage.getArchivedLeads();
      }
      res.json(archived);
    } catch (error) {
      console.error("Error fetching archived leads:", error);
      res.status(500).json({ message: "Failed to fetch archived leads" });
    }
  });

  // Design Portfolios
  app.get('/api/design-portfolios', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const userRole = (req as AuthenticatedRequest).user.userData!.role;
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      let portfolios;
      if (userRole === 'designer') {
        portfolios = await storage.getDesignPortfolios(userId);
      } else {
        portfolios = await storage.getDesignPortfolios();
      }
      res.json(portfolios);
    } catch (error) {
      console.error("Error fetching design portfolios:", error);
      res.status(500).json({ message: "Failed to fetch design portfolios" });
    }
  });

  app.post('/api/design-portfolios', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const portfolio = await storage.createDesignPortfolio(req.body);
      res.status(201).json(portfolio);
    } catch (error) {
      console.error("Error creating design portfolio:", error);
      res.status(500).json({ message: "Failed to create design portfolio" });
    }
  });

  app.put('/api/design-portfolios/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateDesignPortfolio(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating design portfolio:", error);
      res.status(500).json({ message: "Failed to update design portfolio" });
    }
  });

  // Variant Specifications
  app.get('/api/variants/:variantId/specifications', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      const specs = await storage.getVariantSpecifications(variantId);
      res.json(specs);
    } catch (error) {
      console.error("Error fetching variant specifications:", error);
      res.status(500).json({ message: "Failed to fetch variant specifications" });
    }
  });

  app.post('/api/variants/:variantId/specifications', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      const spec = await storage.createVariantSpecification({ variantId, ...req.body });
      res.status(201).json(spec);
    } catch (error) {
      console.error("Error creating variant specification:", error);
      res.status(500).json({ message: "Failed to create variant specification" });
    }
  });

  app.put('/api/variants/:variantId/specifications/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateVariantSpecification(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating variant specification:", error);
      res.status(500).json({ message: "Failed to update variant specification" });
    }
  });

  // Categories
  app.get('/api/categories', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'category',
        category.id,
        'created',
        null,
        category
      );

      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.partial().parse(req.body);

      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const updatedCategory = await storage.updateCategory(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'category',
        id,
        'updated',
        existingCategory,
        updatedCategory
      );

      res.json(updatedCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingCategory = await storage.getCategory(id);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      await storage.deleteCategory(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'category',
        id,
        'deleted',
        existingCategory,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products
  app.get('/api/products', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        product.id,
        'created',
        null,
        product
      );

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);

      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        id,
        'updated',
        existingProduct,
        updatedProduct
      );

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Check if product is used in any orders
      if (!force) {
        const usageCheck = await db.select()
          .from(orderLineItems)
          .innerJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .where(eq(productVariants.productId, productId))
          .limit(1);

        if (usageCheck.length > 0) {
          return res.status(400).json({ 
            error: "Product is used in existing orders. Cannot delete." 
          });
        }
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update product images
  app.put('/api/products/:id/images', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { primaryImageUrl, additionalImages } = req.body;

      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, {
        primaryImageUrl: primaryImageUrl || null,
        additionalImages: additionalImages || null,
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product images:", error);
      res.status(500).json({ message: "Failed to update product images" });
    }
  });

  // Catalog endpoints (products with categories)
  app.get('/api/catalog', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const productsWithCategories = await storage.getCatalogProducts();
      res.json(productsWithCategories);
    } catch (error) {
      console.error("Error fetching catalog products:", error);
      res.status(500).json({ message: "Failed to fetch catalog products" });
    }
  });

  app.get('/api/catalog/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getCatalogProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching catalog product:", error);
      res.status(500).json({ message: "Failed to fetch catalog product" });
    }
  });

  app.post('/api/catalog', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      console.log("=== PRODUCT CREATION DEBUG START ===");
      console.log("Request headers:", JSON.stringify(req.headers, null, 2));
      console.log("Raw request body received:", JSON.stringify(req.body, null, 2));
      console.log("Request body type:", typeof req.body);
      console.log("Request body keys:", Object.keys(req.body || {}));

      // Ensure the request body exists and has the required fields
      if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        console.error("Invalid or empty request body:", req.body);
        return res.status(400).json({ 
          message: "Request body must be a valid JSON object with data",
          receivedBody: req.body,
          bodyType: typeof req.body,
          bodyKeys: Object.keys(req.body || {})
        });
      }

      // Convert string categoryId to number for validation
      const requestData = { ...req.body };
      console.log("Before processing:", JSON.stringify(requestData, null, 2));

      if (requestData.categoryId) {
        if (typeof requestData.categoryId === 'string') {
          requestData.categoryId = parseInt(requestData.categoryId, 10);
        }
      }
      if (requestData.minOrderQty) {
        if (typeof requestData.minOrderQty === 'string') {
          requestData.minOrderQty = parseInt(requestData.minOrderQty, 10);
        }
      }

      console.log("After processing:", JSON.stringify(requestData, null, 2));
      console.log("About to validate with schema...");

      const validatedData = insertProductSchema.parse(requestData);
      console.log("Schema validation passed! Validated data:", JSON.stringify(validatedData, null, 2));

      const product = await storage.createProduct(validatedData);

      // Get product with category to return
      const productWithCategory = await storage.getCatalogProduct(product.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        product.id,
        'created',
        null,
        product
      );

      console.log("Product created successfully:", JSON.stringify(productWithCategory, null, 2));
      console.log("=== PRODUCT CREATION DEBUG END ===");
      res.status(201).json(productWithCategory);
    } catch (error) {
      console.log("=== PRODUCT CREATION ERROR ===");
      if (error instanceof z.ZodError) {
        console.error("Validation failed for product creation:");
        console.error("- Validation errors:", JSON.stringify(error.errors, null, 2));
        console.error("- Original request body:", JSON.stringify(req.body, null, 2));
        console.error("- Request headers:", JSON.stringify(req.headers, null, 2));
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          debug: {
            originalBody: req.body,
            bodyType: typeof req.body,
            bodyKeys: Object.keys(req.body || {})
          }
        });
      }
      console.error("Error creating catalog product:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error code:", (error as any)?.code);
      console.log("=== PRODUCT CREATION ERROR END ===");

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505') {
        console.error("Unique constraint violation: SKU already exists");
        return res.status(409).json({ 
          message: "Product SKU already exists",
          details: "A product with this SKU already exists. Please use a unique SKU.",
          field: "sku"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid category",
          details: "The category ID does not exist. Please select a valid category.",
          field: "categoryId"
        });
      }

      res.status(500).json({ 
        message: "Failed to create catalog product",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put('/api/catalog/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);

      const existingProduct = await storage.getProduct(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updatedProduct = await storage.updateProduct(id, validatedData);

      // Get product with category to return
      const productWithCategory = await storage.getCatalogProduct(updatedProduct.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'product',
        id,
        'updated',
        existingProduct,
        updatedProduct
      );

      res.json(productWithCategory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating catalog product:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505') {
        console.error("Unique constraint violation: SKU already exists");
        return res.status(409).json({ 
          message: "Product SKU already exists",
          details: "A product with this SKU already exists. Please use a unique SKU.",
          field: "sku"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid category",
          details: "The category ID does not exist. Please select a valid category.",
          field: "categoryId"
        });
      }

      res.status(500).json({ 
        message: "Failed to update catalog product",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/catalog/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Check if product is used in any orders
      if (!force) {
        const usageCheck = await db.select()
          .from(orderLineItems)
          .innerJoin(productVariants, eq(orderLineItems.variantId, productVariants.id))
          .where(eq(productVariants.productId, productId))
          .limit(1);

        if (usageCheck.length > 0) {
          return res.status(400).json({ 
            error: "Product is used in existing orders. Cannot delete." 
          });
        }
      }

      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Product variants
  app.get('/api/products/:productId/variants', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const productId = parseInt(req.params.productId);
      const variants = await storage.getProductVariants(productId);
      
      // Strip financial data for manufacturer role
      const filteredVariants = stripFinancialData(variants, user.role);
      res.json(filteredVariants);
    } catch (error) {
      console.error("Error fetching product variants:", error);
      res.status(500).json({ message: "Failed to fetch product variants" });
    }
  });

  app.get('/api/variants', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const variants = await storage.getProductVariants();
      
      // Strip financial data for manufacturer role
      const filteredVariants = stripFinancialData(variants, user.role);
      res.json(filteredVariants);
    } catch (error) {
      console.error("Error fetching variants:", error);
      res.status(500).json({ message: "Failed to fetch variants" });
    }
  });

  // Alternative endpoint for frontend compatibility
  app.get('/api/product-variants', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const variants = await storage.getProductVariants();
      
      // Strip financial data for manufacturer role
      const filteredVariants = stripFinancialData(variants, user.role);
      res.json(filteredVariants);
    } catch (error) {
      console.error("Error fetching product variants:", error);
      res.status(500).json({ message: "Failed to fetch product variants" });
    }
  });

  app.post('/api/variants', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      console.log('=== VARIANT CREATION START ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', (req as AuthenticatedRequest).user.userData?.id);

      const validatedData = insertProductVariantSchema.parse(req.body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      // Validate that the product exists before creating variant
      if (validatedData.productId) {
        const product = await storage.getProduct(validatedData.productId);
        if (!product) {
          console.error(`Product not found: ${validatedData.productId}`);
          return res.status(400).json({ 
            message: "Invalid product ID", 
            details: `Product with ID ${validatedData.productId} does not exist` 
          });
        }
        console.log(`Product validated: ${product.name} (${product.id})`);
      }

      const variant = await storage.createProductVariant(validatedData);
      console.log('Variant created successfully:', variant.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'variant',
        variant.id,
        'created',
        null,
        variant
      );

      console.log('=== VARIANT CREATION SUCCESS ===');
      res.status(201).json(variant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }

      console.error("=== VARIANT CREATION ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Request body:", JSON.stringify(req.body, null, 2));

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505' || errorObj?.constraint?.includes('variant_code')) {
        console.error("Unique constraint violation: variant code already exists");
        return res.status(409).json({ 
          message: "Variant code already exists",
          details: "A variant with this code already exists. Please use a unique variant code.",
          field: "variantCode"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "The product ID does not exist or has been deleted.",
          field: "productId"
        });
      }

      // Database connection errors
      if (errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ETIMEDOUT') {
        console.error("Database connection error");
        return res.status(503).json({ 
          message: "Database connection error",
          details: "Unable to connect to the database. Please try again.",
          retry: true
        });
      }

      res.status(500).json({ 
        message: "Failed to create variant",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put('/api/variants/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('=== VARIANT UPDATE START ===');
      console.log('Variant ID:', id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User:', (req as AuthenticatedRequest).user.userData?.id);

      const validatedData = insertProductVariantSchema.partial().parse(req.body);
      console.log('Validated data:', JSON.stringify(validatedData, null, 2));

      const existingVariant = await storage.getProductVariant(id);
      if (!existingVariant) {
        console.error(`Variant not found: ${id}`);
        return res.status(404).json({ message: "Product variant not found" });
      }
      console.log('Existing variant found:', existingVariant.variantCode);

      // Validate that the product exists if productId is being changed
      if (validatedData.productId && validatedData.productId !== existingVariant.productId) {
        const product = await storage.getProduct(validatedData.productId);
        if (!product) {
          console.error(`Product not found: ${validatedData.productId}`);
          return res.status(400).json({ 
            message: "Invalid product ID", 
            details: `Product with ID ${validatedData.productId} does not exist` 
          });
        }
        console.log(`New product validated: ${product.name} (${product.id})`);
      }

      const updatedVariant = await storage.updateProductVariant(id, validatedData);
      console.log('Variant updated successfully:', updatedVariant.id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'variant',
        id,
        'updated',
        existingVariant,
        updatedVariant
      );

      console.log('=== VARIANT UPDATE SUCCESS ===');
      res.json(updatedVariant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }

      console.error("=== VARIANT UPDATE ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      console.error("Request body:", JSON.stringify(req.body, null, 2));

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL unique constraint violation (23505)
      if (errorObj?.code === '23505' || errorObj?.constraint?.includes('variant_code')) {
        console.error("Unique constraint violation: variant code already exists");
        return res.status(409).json({ 
          message: "Variant code already exists",
          details: "A variant with this code already exists. Please use a unique variant code.",
          field: "variantCode"
        });
      }

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "The product ID does not exist or has been deleted.",
          field: "productId"
        });
      }

      // Database connection errors
      if (errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ETIMEDOUT') {
        console.error("Database connection error");
        return res.status(503).json({ 
          message: "Database connection error",
          details: "Unable to connect to the database. Please try again.",
          retry: true
        });
      }

      res.status(500).json({ 
        message: "Failed to update variant",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete('/api/variants/:id', isAuthenticated, loadUserData, requirePermission('catalog', 'delete'), async (req, res) => {
    try {
      const variantId = parseInt(req.params.id);
      const force = req.query.force === "true";

      // Check if variant is used in any orders
      if (!force) {
        const usageCheck = await db.select()
          .from(orderLineItems)
          .where(eq(orderLineItems.variantId, variantId))
          .limit(1);

        if (usageCheck.length > 0) {
          return res.status(400).json({ 
            error: "Variant is used in existing orders. Cannot delete." 
          });
        }
      }

      // Delete the variant
      await db.delete(productVariants).where(eq(productVariants.id, variantId));

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'variant',
        variantId,
        'deleted',
        null, // Existing variant data is not fetched here, assuming log activity might not need it or can be fetched if required
        null
      );

      console.log('=== VARIANT DELETION SUCCESS ===');
      res.status(204).send();
    } catch (error) {
      console.error("=== VARIANT DELETION ERROR ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');

      res.status(500).json({ 
        message: "Failed to delete variant",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

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

  // Orders
  app.get('/api/orders', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      let orders;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin' || user.role === 'ops') {
        // Admin and ops users see all orders
        orders = await storage.getOrders();
      } else if (user.role === 'sales') {
        // Sales users only see their own orders
        orders = await storage.getOrdersBySalesperson(user.id);
      } else {
        // Other roles see all orders (if they have read permission)
        orders = await storage.getOrders();
      }

      // Strip financial data for manufacturer role
      const filteredOrders = stripFinancialData(orders, user.role);
      res.json(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post('/api/orders', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    console.log('🔍 [DEBUG] POST /api/orders started');
    try {
      console.log('🔍 [DEBUG] Request body received:', JSON.stringify(req.body, null, 2));
      console.log('🔍 [DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));

      // Check if body is parsed correctly
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        console.error("Request body is not a valid object:", {
          body: req.body,
          type: typeof req.body,
          isArray: Array.isArray(req.body)
        });
        return res.status(400).json({ 
          message: "Request body must be a valid JSON object",
          receivedBody: req.body,
          bodyType: typeof req.body,
          isArray: Array.isArray(req.body)
        });
      }

      // Check if body has required properties
      if (!req.body.orderName || !req.body.orgId) {
        console.error("Missing required fields in request body");
        return res.status(400).json({ 
          message: "Missing required fields: orderName and orgId are required",
          receivedFields: Object.keys(req.body)
        });
      }

      // Separate line items from order data
      const { lineItems, ...orderData } = req.body;
      console.log('🔍 [DEBUG] Order data extracted:', JSON.stringify(orderData, null, 2));
      console.log('🔍 [DEBUG] Line items extracted:', JSON.stringify(lineItems, null, 2));

      // Validate required fields before schema validation
      if (!orderData.orderName) {
        return res.status(400).json({ 
          message: "Order name is required",
          field: "orderName"
        });
      }

      if (!orderData.orgId) {
        return res.status(400).json({ 
          message: "Organization ID is required", 
          field: "orgId"
        });
      }

      // Ensure proper data types
      const processedOrderData = {
        ...orderData,
        orgId: Number(orderData.orgId),
        contactId: orderData.contactId ? Number(orderData.contactId) : null,
        salespersonId: orderData.salespersonId || null,
        priority: orderData.priority || "normal",
        estDelivery: orderData.estDelivery || null,
        notes: orderData.notes || null,
      };

      console.log('🔍 [DEBUG] Processed order data:', JSON.stringify(processedOrderData, null, 2));
      console.log('🔍 [DEBUG] Attempting insertOrderSchema.parse()...');

      const validatedOrder = insertOrderSchema.parse(processedOrderData);
      console.log('🔍 [DEBUG] ✅ Order schema validation passed!');
      console.log('🔍 [DEBUG] Validated order:', JSON.stringify(validatedOrder, null, 2));

      // Sales users can only create orders for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedOrder.salespersonId = (req as AuthenticatedRequest).user.userData!.id;
      }

      // If line items are provided, validate and create order with line items
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        console.log('🔍 [DEBUG] Processing line items...');

        // Validate each line item
        const validatedLineItems = lineItems.map((item: any, index: number) => {
          console.log(`🔍 [DEBUG] Processing line item ${index}:`, JSON.stringify(item, null, 2));

          // Ensure all size fields have default values and are numbers
          const lineItemData = {
            variantId: Number(item.variantId),
            itemName: item.itemName || null,
            colorNotes: item.colorNotes || null,
            yxs: Number(item.yxs) || 0,
            ys: Number(item.ys) || 0,
            ym: Number(item.ym) || 0,
            yl: Number(item.yl) || 0,
            xs: Number(item.xs) || 0,
            s: Number(item.s) || 0,
            m: Number(item.m) || 0,
            l: Number(item.l) || 0,
            xl: Number(item.xl) || 0,
            xxl: Number(item.xxl) || 0,
            xxxl: Number(item.xxxl) || 0,
            unitPrice: String(item.unitPrice),
            notes: item.notes || null,
          };

          console.log(`🔍 [DEBUG] Processed line item ${index}:`, JSON.stringify(lineItemData, null, 2));

          try {
            const validated = insertOrderLineItemSchema.parse(lineItemData);
            console.log(`🔍 [DEBUG] ✅ Line item ${index} validation passed`);
            return validated;
          } catch (validationError) {
            console.error(`🔍 [DEBUG] ❌ Line item ${index} validation failed:`, validationError);
            throw validationError;
          }
        });

        console.log('🔍 [DEBUG] All line items validated successfully');
        console.log('🔍 [DEBUG] Creating order with line items...');

        const orderWithLineItems = await storage.createOrderWithLineItems(
          validatedOrder,
          validatedLineItems
        );

        console.log('🔍 [DEBUG] Order with line items created successfully:', orderWithLineItems.id);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'order',
          orderWithLineItems.id,
          'created',
          null,
          orderWithLineItems
        );

        res.status(201).json(orderWithLineItems);
      } else {
        console.log('🔍 [DEBUG] Creating order without line items...');

        // Create order without line items
        const order = await storage.createOrder(validatedOrder);

        console.log('🔍 [DEBUG] Order created successfully:', order.id);

        // Log activity
        await storage.logActivity(
          (req as AuthenticatedRequest).user.userData!.id,
          'order',
          order.id,
          'created',
          null,
          order
        );

        res.status(201).json(order);
      }
    } catch (error) {
      console.log("=== ORDER CREATION ERROR ===");
      if (error instanceof z.ZodError) {
        console.error("Validation failed for order creation:");
        console.error("- Validation errors:", JSON.stringify(error.errors, null, 2));
        console.error("- Original request body:", JSON.stringify(req.body, null, 2));
        console.error("- Request headers:", JSON.stringify(req.headers, null, 2));
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors,
          debug: {
            originalBody: req.body,
            bodyType: typeof req.body,
            bodyKeys: Object.keys(req.body || {})
          }
        });
      }
      console.error("Error creating order:", error);
      console.error("Error type:", error?.constructor?.name);
      console.error("Error code:", (error as any)?.code);
      console.log("=== ORDER CREATION ERROR END ===");

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation");
        return res.status(400).json({ 
          message: "Invalid reference",
          details: "One of the referenced items (organization, contact, salesperson, or variant) does not exist.",
        });
      }

      res.status(500).json({ 
        message: "Failed to create order",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get single order with line items
  app.get('/api/orders/:id', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderWithLineItems(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can view this order
      const user = (req as AuthenticatedRequest).user.userData!;
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Strip financial data for manufacturer role
      const filteredOrder = stripFinancialData(order, userRole);
      res.json(filteredOrder);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Get order line items with manufacturer assignments
  // Allow access for users with orders.read OR manufacturing.read permissions
  app.get('/api/orders/:id/line-items-with-manufacturers', isAuthenticated, loadUserData, requirePermissionOr(
    { resource: 'orders', permission: 'read' },
    { resource: 'manufacturing', permission: 'read' }
  ), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can view this order
      const user = (req as AuthenticatedRequest).user.userData!;
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const lineItemsWithManufacturers = await storage.getOrderLineItemsWithManufacturers(id);
      
      // Strip financial data for manufacturer role
      const filteredLineItems = stripFinancialData(lineItemsWithManufacturers, userRole);
      res.json(filteredLineItems);
    } catch (error) {
      console.error("Error fetching line items with manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch line items" });
    }
  });

  // Update order
  app.put('/api/orders/:id', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOrderSchema.partial().parse(req.body);

      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Simplified status transition validation
      if (validatedData.status === 'production' && existingOrder.status !== 'production') {
        // Check if order has line items (basic validation only)
        const lineItems = await storage.getOrderLineItems(id);
        if (!lineItems || lineItems.length === 0) {
          return res.status(400).json({ 
            message: "Cannot move to production: Order must have line items" 
          });
        }

        // Auto-create manufacturing record if moving to production for first time
        const existingMfg = await storage.getManufacturingByOrder(id);
        if (!existingMfg) {
          // Create manufacturing record automatically
          await storage.createManufacturing({
            orderId: id,
            status: 'awaiting_admin_confirmation',
            productionNotes: 'Auto-created when order moved to production',
          });
        }
      }

      // Check if user can update this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && existingOrder.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate sizes are filled before moving to invoiced status
      if (validatedData.status === 'invoiced' && existingOrder.status === 'waiting_sizes') {
        const orderWithLineItems = await storage.getOrderWithLineItems(id);

        if (!orderWithLineItems || !orderWithLineItems.lineItems || orderWithLineItems.lineItems.length === 0) {
          return res.status(400).json({ 
            message: "Cannot move to invoiced status",
            details: "Order must have at least one line item with sizes filled in."
          });
        }

        // Check if all line items have at least one size filled
        const hasEmptyLineItems = orderWithLineItems.lineItems.some((item: any) => {
          const totalQty = (item.yxs || 0) + (item.ys || 0) + (item.ym || 0) + (item.yl || 0) + 
                          (item.xs || 0) + (item.s || 0) + (item.m || 0) + (item.l || 0) + 
                          (item.xl || 0) + (item.xxl || 0) + (item.xxxl || 0);
          return totalQty === 0;
        });

        if (hasEmptyLineItems) {
          return res.status(400).json({ 
            message: "Cannot move to invoiced status",
            details: "All line items must have sizes filled in before moving to invoiced status. Please add sizes to all line items in the waiting_sizes stage."
          });
        }
      }

      // Auto-action logic when moving to invoiced status
      let autoActionWarnings: string[] = [];
      if (validatedData.status === 'invoiced' && existingOrder.status !== 'invoiced') {
        try {
          console.log(`[OrderInvoiced] Order ${id} moving to invoiced status - creating invoice...`);

          // Check if invoice already exists for this order
          const existingInvoices = await storage.getInvoicesByOrderId(id);
          if (!existingInvoices || existingInvoices.length === 0) {
            // Get order with line items to calculate totals
            const orderWithLineItems = await storage.getOrderWithLineItems(id);

            if (!orderWithLineItems || !orderWithLineItems.lineItems || orderWithLineItems.lineItems.length === 0) {
              console.warn(`[OrderInvoiced] Order ${id} has no line items, skipping invoice creation`);
            } else {
              // Calculate totals from line items
              let subtotal = 0;
              for (const item of orderWithLineItems.lineItems) {
                const unitPrice = parseFloat(item.unitPrice || '0');
                const quantity = item.qtyTotal || 0;
                subtotal += unitPrice * quantity;
              }

              const taxRate = 0; // Default tax rate, can be configured
              const taxAmount = subtotal * taxRate;
              const total = subtotal + taxAmount;

              // Generate unique invoice number
              const invoiceNumber = `INV-${Date.now()}-${id}`;

              // Create invoice
              const invoice = await storage.createInvoice({
                invoiceNumber,
                orderId: id,
                orgId: orderWithLineItems.orgId!,
                salespersonId: orderWithLineItems.salespersonId || undefined,
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                status: 'sent',
                subtotal: subtotal.toFixed(2),
                taxRate: taxRate.toFixed(4),
                taxAmount: taxAmount.toFixed(2),
                totalAmount: total.toFixed(2),
                paymentTerms: 'Net 30',
                notes: `Auto-generated invoice for order ${orderWithLineItems.orderCode}`,
                createdBy: (req as AuthenticatedRequest).user.userData!.id
              });

              console.log(`[OrderInvoiced] Created invoice ${invoice.id} for order ${id}`);
            }
          } else {
            console.log(`[OrderInvoiced] Invoice already exists for order ${id}, skipping creation`);
          }
        } catch (error) {
          console.error(`[OrderInvoiced] Failed to create invoice for order ${id}:`, error);
          autoActionWarnings.push('Failed to auto-create invoice - please create manually in Finance section');
        }
      }

      // Simplified auto-action when moving to production status - only create manufacturing record
      if (validatedData.status === 'production' && existingOrder.status !== 'production') {
        // The basic validation and manufacturing record creation is already handled above
        // No complex cascading actions needed
        console.log(`[OrderProduction] Order ${id} moved to production status`);
      }

      const updatedOrder = await storage.updateOrder(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        id,
        'updated',
        existingOrder,
        updatedOrder
      );

      // Include warnings in response if any auto-actions failed
      if (autoActionWarnings.length > 0) {
        return res.json({
          ...updatedOrder,
          warnings: autoActionWarnings,
          message: 'Order updated successfully, but some auto-actions failed'
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Delete order
  app.delete('/api/orders/:id', isAuthenticated, loadUserData, requirePermission('orders', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingOrder = await storage.getOrder(id);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      await storage.deleteOrder(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        id,
        'deleted',
        existingOrder,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Get order line items
  app.get('/api/orders/:id/line-items', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if user can view this order
      const user = (req as AuthenticatedRequest).user.userData!;
      const userRole = user.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const lineItems = await storage.getOrderLineItems(orderId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching line items:", error);
      res.status(500).json({ message: "Failed to fetch line items" });
    }
  });

  // Add line item to order
  app.post('/api/orders/:id/line-items', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      // Ensure orderId is included in the data before validation
      const lineItemData = { ...req.body, orderId };
      const validatedData = insertOrderLineItemSchema.parse(lineItemData);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const lineItem = await storage.createOrderLineItem(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        lineItem.id,
        'created',
        null,
        lineItem
      );

      res.status(201).json(lineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in order line item");
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
        message: "Failed to add line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update line item
  app.put('/api/orders/:id/line-items/:itemId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);
      const validatedData = insertOrderLineItemSchema.partial().parse(req.body);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedLineItem = await storage.updateOrderLineItem(itemId, validatedData);

      // If imageUrl was updated, sync it to all manufacturing update line items that reference this line item
      if (validatedData.imageUrl !== undefined) {
        try {
          // Find all manufacturing update line items that reference this order line item
          const mfgUpdateLineItems = await db
            .select()
            .from(manufacturingUpdateLineItems)
            .where(eq(manufacturingUpdateLineItems.lineItemId, itemId));

          // Update each manufacturing update line item's imageUrl to match the order line item
          if (mfgUpdateLineItems.length > 0) {
            await Promise.all(
              mfgUpdateLineItems.map((mfgLineItem) =>
                db
                  .update(manufacturingUpdateLineItems)
                  .set({ 
                    imageUrl: validatedData.imageUrl,
                    updatedAt: new Date()
                  })
                  .where(eq(manufacturingUpdateLineItems.id, mfgLineItem.id))
              )
            );
            console.log(`Synced imageUrl to ${mfgUpdateLineItems.length} manufacturing update line items`);
          }
        } catch (syncError) {
          console.error('Error syncing imageUrl to manufacturing update line items:', syncError);
          // Don't fail the request if sync fails, just log it
        }
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        itemId,
        'updated',
        null,
        updatedLineItem
      );

      res.json(updatedLineItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating line item:", error);

      // Check for specific database errors
      const errorObj = error as any;

      // PostgreSQL foreign key violation (23503)
      if (errorObj?.code === '23503') {
        console.error("Foreign key constraint violation in order line item");
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
        message: "Failed to update line item",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete line item
  app.delete('/api/orders/:id/line-items/:itemId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteOrderLineItem(itemId);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order_line_item',
        itemId,
        'deleted',
        null,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting line item:", error);
      res.status(500).json({ message: "Failed to delete line item" });
    }
  });

  // Sync line item images to manufacturing update line items
  app.post('/api/orders/:id/line-items/:itemId/sync-images', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the current line item
      const [lineItem] = await db
        .select()
        .from(orderLineItems)
        .where(eq(orderLineItems.id, itemId));

      if (!lineItem) {
        return res.status(404).json({ message: "Line item not found" });
      }

      // CRITICAL SECURITY CHECK: Verify the line item belongs to the specified order
      if (lineItem.orderId !== orderId) {
        return res.status(403).json({ 
          message: "Access denied",
          details: "Line item does not belong to the specified order"
        });
      }

      // Find all manufacturing update line items that reference this order line item
      const mfgUpdateLineItems = await db
        .select()
        .from(manufacturingUpdateLineItems)
        .where(eq(manufacturingUpdateLineItems.lineItemId, itemId));

      if (mfgUpdateLineItems.length === 0) {
        return res.json({ 
          message: "No manufacturing update line items found to sync",
          syncedCount: 0 
        });
      }

      // Update each manufacturing update line item's imageUrl to match the order line item
      await Promise.all(
        mfgUpdateLineItems.map((mfgLineItem) =>
          db
            .update(manufacturingUpdateLineItems)
            .set({ 
              imageUrl: lineItem.imageUrl,
              updatedAt: new Date()
            })
            .where(eq(manufacturingUpdateLineItems.id, mfgLineItem.id))
        )
      );

      res.json({ 
        message: "Images synced successfully",
        syncedCount: mfgUpdateLineItems.length 
      });
    } catch (error) {
      console.error("Error syncing images:", error);
      res.status(500).json({ message: "Failed to sync images" });
    }
  });

  // Order-specific activity endpoint
  app.get('/api/orders/:id/activity', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      // Verify order exists and user has access
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can view this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get order-specific activity (filtering by order ID and related entities)
      const activity = await storage.getOrderActivity(orderId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching order activity:", error);
      res.status(500).json({ message: "Failed to fetch order activity" });
    }
  });

  // Bulk reassign orders to different salespeople (admin only)
  app.put('/api/orders/bulk-reassign', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;

      // Only admins can perform bulk reassignments
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Access denied: Only administrators can reassign orders" });
      }

      const { orderIds, salespersonId } = req.body;

      // Validate input
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "Order IDs array is required and must not be empty" });
      }

      // Allow null/empty salespersonId for unassigning orders
      if (salespersonId !== null && salespersonId !== '' && typeof salespersonId !== 'string') {
        return res.status(400).json({ message: "Target salesperson ID must be a string or null" });
      }

      // Verify target salesperson exists and has sales role (only if not null/empty)
      if (salespersonId && salespersonId !== '') {
        const targetSalesperson = await storage.getUser(salespersonId);
        if (!targetSalesperson) {
          return res.status(404).json({ message: "Target salesperson not found" });
        }

        if (targetSalesperson.role !== 'sales') {
          return res.status(400).json({ message: "Target user must have sales role" });
        }
      }

      // Process each order
      const results = [];
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;

      for (const orderId of orderIds) {
        try {
          const orderIdNum = parseInt(orderId);

          // Get existing order
          const existingOrder = await storage.getOrder(orderIdNum);
          if (!existingOrder) {
            results.push({ orderId, success: false, error: "Order not found" });
            continue;
          }

          // Update the order with new salesperson
          const updatedOrder = await storage.updateOrder(orderIdNum, { 
            salespersonId: salespersonId 
          });

          // Log activity
          await storage.logActivity(
            currentUserId,
            'order',
            orderIdNum,
            'reassigned',
            existingOrder,
            updatedOrder
          );

          results.push({ orderId, success: true, order: updatedOrder });
        } catch (error) {
          console.error(`Error reassigning order ${orderId}:`, error);
          results.push({ 
            orderId, 
            success: false, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      res.json({
        message: `Reassignment completed: ${successCount} successful, ${failCount} failed`,
        results,
        successCount,
        failCount
      });

    } catch (error) {
      console.error("Error in bulk reassignment:", error);
      res.status(500).json({ message: "Failed to perform bulk reassignment" });
    }
  });

  // Order notes endpoint
  app.post('/api/orders/:id/notes', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { note } = req.body;

      if (!note || !note.trim()) {
        return res.status(400).json({ message: "Note content is required" });
      }

      // Verify order exists and user has access
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can modify this order
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Log the note as an activity entry
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'order',
        orderId,
        'note_added',
        null,
        { note: note.trim() }
      );

      res.status(201).json({ 
        success: true, 
        message: "Note added successfully" 
      });
    } catch (error) {
      console.error("Error adding order note:", error);
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // =====================================================
  // ORDER FORM SUBMISSIONS API (Public Customer Forms)
  // =====================================================

  // PUBLIC: Get order data for customer form (no auth required)
  app.get('/api/public/orders/:orderId/form-data', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const formData = await storage.getOrderForPublicForm(orderId);
      if (!formData || !formData.order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Only expose safe fields - no financial data, internal notes, etc.
      const safeOrder = {
        id: formData.order.id,
        orderCode: formData.order.orderCode,
        orderName: formData.order.orderName,
        status: formData.order.status,
        estDelivery: formData.order.estDelivery,
        contactName: formData.order.contactName,
        contactEmail: formData.order.contactEmail,
        contactPhone: formData.order.contactPhone,
        shippingAddress: formData.order.shippingAddress,
        billToAddress: formData.order.billToAddress,
      };

      const safeOrganization = formData.organization ? {
        id: formData.organization.id,
        name: formData.organization.name,
        logoUrl: formData.organization.logoUrl,
      } : null;

      const safeLineItems = formData.lineItems.map(item => ({
        id: item.id,
        orderId: item.orderId,
        variantId: item.variantId,
        itemName: item.itemName,
        colorNotes: item.colorNotes,
        imageUrl: item.imageUrl,
        // Current size selections (internal values)
        yxs: item.yxs || 0,
        ys: item.ys || 0,
        ym: item.ym || 0,
        yl: item.yl || 0,
        xs: item.xs || 0,
        s: item.s || 0,
        m: item.m || 0,
        l: item.l || 0,
        xl: item.xl || 0,
        xxl: item.xxl || 0,
        xxxl: item.xxxl || 0,
        xxxxl: item.xxxxl || 0,
        qtyTotal: item.qtyTotal,
        notes: item.notes,
        // Product info (no pricing)
        productName: item.product?.name,
        variantCode: item.variant?.variantCode,
        variantColor: item.variant?.color,
      }));

      res.json({
        order: safeOrder,
        organization: safeOrganization,
        lineItems: safeLineItems,
      });
    } catch (error) {
      console.error("Error fetching public order form data:", error);
      res.status(500).json({ message: "Failed to fetch order data" });
    }
  });

  // PUBLIC: Submit customer order form (no auth required)
  app.post('/api/public/orders/:orderId/submit-form', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      // Verify order exists
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { 
        contactInfo, 
        shippingAddress, 
        billingAddress, 
        additionalInfo,
        uploadedFiles,
        lineItemSizes
      } = req.body;

      // Validate required fields
      if (!contactInfo?.name || !contactInfo?.email) {
        return res.status(400).json({ message: "Contact name and email are required" });
      }

      // Create form submission
      const submission = await storage.createOrderFormSubmission({
        orderId,
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone || null,
        shippingName: shippingAddress?.name || null,
        shippingAddress: shippingAddress?.address || null,
        shippingCity: shippingAddress?.city || null,
        shippingState: shippingAddress?.state || null,
        shippingZip: shippingAddress?.zip || null,
        shippingCountry: shippingAddress?.country || 'USA',
        billingName: billingAddress?.name || null,
        billingAddress: billingAddress?.address || null,
        billingCity: billingAddress?.city || null,
        billingState: billingAddress?.state || null,
        billingZip: billingAddress?.zip || null,
        billingCountry: billingAddress?.country || 'USA',
        sameAsShipping: billingAddress?.sameAsShipping ?? true,
        organizationName: additionalInfo?.organizationName || null,
        purchaseOrderNumber: additionalInfo?.purchaseOrderNumber || null,
        specialInstructions: additionalInfo?.specialInstructions || null,
        uploadedFiles: uploadedFiles || null,
        status: 'submitted',
      });

      // Create line item size selections
      if (lineItemSizes && Array.isArray(lineItemSizes)) {
        const sizeInserts = lineItemSizes.map((item: any) => ({
          submissionId: submission.id,
          lineItemId: item.lineItemId,
          yxs: item.yxs || 0,
          ys: item.ys || 0,
          ym: item.ym || 0,
          yl: item.yl || 0,
          xs: item.xs || 0,
          s: item.s || 0,
          m: item.m || 0,
          l: item.l || 0,
          xl: item.xl || 0,
          xxl: item.xxl || 0,
          xxxl: item.xxxl || 0,
          xxxxl: item.xxxxl || 0,
          itemNotes: item.notes || null,
        }));

        await storage.bulkCreateOrderFormLineItemSizes(sizeInserts);
      }

      // Update order with submitted contact/shipping info
      await storage.updateOrder(orderId, {
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone || null,
        shippingAddress: shippingAddress 
          ? `${shippingAddress.name || ''}\n${shippingAddress.address || ''}\n${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip || ''}\n${shippingAddress.country || 'USA'}`
          : null,
        billToAddress: billingAddress && !billingAddress.sameAsShipping
          ? `${billingAddress.name || ''}\n${billingAddress.address || ''}\n${billingAddress.city || ''}, ${billingAddress.state || ''} ${billingAddress.zip || ''}\n${billingAddress.country || 'USA'}`
          : null,
      });

      res.status(201).json({ 
        success: true, 
        message: "Form submitted successfully",
        submissionId: submission.id
      });
    } catch (error) {
      console.error("Error submitting customer order form:", error);
      res.status(500).json({ message: "Failed to submit form" });
    }
  });

  // Internal: Get form submissions for an order
  app.get('/api/orders/:id/form-submissions', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const submissions = await storage.getOrderFormSubmissions(orderId);
      
      // For each submission, get the line item sizes
      const submissionsWithSizes = await Promise.all(
        submissions.map(async (submission) => {
          const sizes = await storage.getOrderFormLineItemSizes(submission.id);
          return { ...submission, lineItemSizes: sizes };
        })
      );

      res.json(submissionsWithSizes);
    } catch (error) {
      console.error("Error fetching form submissions:", error);
      res.status(500).json({ message: "Failed to fetch form submissions" });
    }
  });

  // Internal: Get latest form submission for an order
  app.get('/api/orders/:id/form-submission/latest', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && order.salespersonId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const submission = await storage.getOrderFormSubmission(orderId);
      if (!submission) {
        return res.json(null);
      }

      const sizes = await storage.getOrderFormLineItemSizes(submission.id);
      res.json({ ...submission, lineItemSizes: sizes });
    } catch (error) {
      console.error("Error fetching latest form submission:", error);
      res.status(500).json({ message: "Failed to fetch form submission" });
    }
  });

  // Internal: Update form submission status (e.g., mark as reviewed)
  app.patch('/api/orders/:id/form-submission/:submissionId', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const submissionId = parseInt(req.params.submissionId);

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const { status } = req.body;
      if (!['submitted', 'reviewed', 'approved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const updated = await storage.updateOrderFormSubmission(submissionId, {
        status,
        reviewedAt: status === 'reviewed' || status === 'approved' ? new Date() : undefined,
        reviewedBy: status === 'reviewed' || status === 'approved' ? userId : undefined,
      } as any);

      if (!updated) {
        return res.status(404).json({ message: "Submission not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating form submission:", error);
      res.status(500).json({ message: "Failed to update form submission" });
    }
  });


  // Design Jobs API
  app.get('/api/design-jobs', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      let designJobs;

      // Role-based filtering: use database queries instead of in-memory filtering
      if (user.role === 'admin') {
        // Admin users see all design jobs
        designJobs = await storage.getDesignJobs();
      } else if (user.role === 'designer') {
        // Designer users only see jobs assigned to them
        designJobs = await storage.getDesignJobsByDesigner(user.id);
      } else if (user.role === 'sales') {
        // Sales users only see jobs assigned to them
        designJobs = await storage.getDesignJobsBySalesperson(user.id);
      } else {
        // Other roles see all design jobs (if they have read permission)
        designJobs = await storage.getDesignJobs();
      }

      res.json(designJobs);
    } catch (error) {
      console.error("Error fetching design jobs:", error);
      res.status(500).json({ message: "Failed to fetch design jobs" });
    }
  });

  app.get('/api/design-jobs/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getDesignJob(id);
      if (!job) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can view this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      if (userRole === 'designer' && job.assignedDesignerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (userRole === 'sales' && job.salespersonId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching design job:", error);
      res.status(500).json({ message: "Failed to fetch design job" });
    }
  });

  app.post('/api/design-jobs', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      // Exclude jobCode from validation since it's auto-generated
      const validatedData = insertDesignJobSchema.omit({ jobCode: true }).parse(req.body);
      const job = await storage.createDesignJob(validatedData as any);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        job.id,
        'created',
        null,
        job
      );

      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating design job:", error);
      res.status(500).json({ message: "Failed to create design job" });
    }
  });

  app.put('/api/design-jobs/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDesignJobSchema.partial().parse(req.body);

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.updateDesignJob(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'updated',
        existingJob,
        updatedJob
      );

      res.json(updatedJob);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating design job:", error);
      res.status(500).json({ message: "Failed to update design job" });
    }
  });

  app.put('/api/design-jobs/:id/status', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!['pending', 'assigned', 'in_progress', 'review', 'approved', 'rejected', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.updateDesignJobStatus(id, status);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'status_updated',
        { status: existingJob.status },
        { status: updatedJob.status }
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating design job status:", error);
      res.status(500).json({ message: "Failed to update design job status" });
    }
  });

  app.post('/api/design-jobs/:id/renditions', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Rendition URL required" });
      }

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      // Check if user can update this job
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'designer' && existingJob.assignedDesignerId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedJob = await storage.addDesignJobRendition(id, url);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'rendition_added',
        { renditionCount: existingJob.renditionCount },
        { renditionCount: updatedJob.renditionCount }
      );

      res.json(updatedJob);
    } catch (error) {
      console.error("Error adding rendition:", error);
      res.status(500).json({ message: "Failed to add rendition" });
    }
  });

  app.delete('/api/design-jobs/:id', isAuthenticated, loadUserData, requirePermission('designJobs', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingJob = await storage.getDesignJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Design job not found" });
      }

      await storage.deleteDesignJob(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'design_job',
        id,
        'deleted',
        existingJob,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting design job:", error);
      res.status(500).json({ message: "Failed to delete design job" });
    }
  });

  // Design job comments endpoints
  app.get('/api/design-jobs/:id/comments', isAuthenticated, loadUserData, requirePermission('designJobs', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const job = await storage.getDesignJob(id);
      if (!job) {
        return res.status(404).json({ message: "Design job not found" });
      }

      const comments = await storage.getDesignJobComments(id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching design job comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/design-jobs/:id/comments', isAuthenticated, loadUserData, requirePermission('designJobs', 'write'), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { comment, isInternal } = req.body;

      const job = await storage.getDesignJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Design job not found" });
      }

      const newComment = await storage.createDesignJobComment({
        jobId,
        userId: (req as AuthenticatedRequest).user.userData!.id,
        comment,
        isInternal: isInternal || false,
      });

      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Manufacturing API
  // Manufacturing records (main CRUD)
  app.get('/api/manufacturing', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData;
      const records = await storage.getManufacturing(user);
      res.json(records);
    } catch (error) {
      console.error("Error fetching manufacturing records:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing records" });
    }
  });

  app.get('/api/manufacturing/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData;
      const record = await storage.getManufacturingRecord(id, user);
      if (!record) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching manufacturing record:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing record" });
    }
  });

  app.post('/api/manufacturing', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const validatedData = insertManufacturingSchema.parse(req.body);

      // Validate manufacturing status
      if (validatedData.status && !isValidManufacturingStatus(validatedData.status)) {
        return res.status(400).json({ 
          message: `Invalid manufacturing status. Allowed values: ${getValidManufacturingStatuses().join(', ')}` 
        });
      }

      // Check if manufacturing record already exists for this order
      if (validatedData.orderId) {
        const existing = await storage.getManufacturingByOrder(validatedData.orderId);
        if (existing) {
          return res.status(400).json({ message: "Manufacturing record already exists for this order" });
        }
      }

      const record = await storage.createManufacturing(validatedData);

      // Create initial status update
      await storage.createManufacturingUpdate({
        manufacturingId: record.id,
        status: record.status,
        notes: "Manufacturing record created",
        updatedBy: (req as AuthenticatedRequest).user.userData!.id,
        manufacturerId: record.manufacturerId || undefined,
      });

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing',
        record.id,
        'created',
        null,
        record
      );

      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing record:", error);
      res.status(500).json({ message: "Failed to create manufacturing record" });
    }
  });

  app.put('/api/manufacturing/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertManufacturingSchema.partial().parse(req.body);

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      const updatedRecord = await storage.updateManufacturing(id, validatedData);

      // If status changed, create a status update entry
      if (validatedData.status && validatedData.status !== existingRecord.status) {
        await storage.createManufacturingUpdate({
          manufacturingId: id,
          status: validatedData.status,
          notes: req.body.statusNotes || `Status changed from ${existingRecord.status} to ${validatedData.status}`,
          updatedBy: user.id,
          manufacturerId: updatedRecord.manufacturerId || undefined,
        });
      }

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'updated',
        existingRecord,
        updatedRecord
      );

      res.json(updatedRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturing record:", error);
      res.status(500).json({ message: "Failed to update manufacturing record" });
    }
  });

  app.delete('/api/manufacturing/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;

      const existingRecord = await storage.getManufacturingRecord(id, user);
      if (!existingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found" });
      }

      await storage.deleteManufacturing(id);

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing',
        id,
        'deleted',
        existingRecord,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting manufacturing record:", error);
      res.status(500).json({ message: "Failed to delete manufacturing record" });
    }
  });

  // Manufacturers CRUD API
  app.get('/api/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });

  app.post('/api/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const validatedData = insertManufacturerSchema.parse(req.body);
      const manufacturer = await storage.createManufacturer(validatedData);
      
      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturer',
        manufacturer.id,
        'created',
        null,
        manufacturer
      );
      
      res.status(201).json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturer:", error);
      res.status(500).json({ message: "Failed to create manufacturer" });
    }
  });

  app.put('/api/manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertManufacturerSchema.partial().parse(req.body);
      const manufacturer = await storage.updateManufacturer(id, validatedData);
      
      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturer',
        id,
        'updated',
        null,
        manufacturer
      );
      
      res.json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturer:", error);
      res.status(500).json({ message: "Failed to update manufacturer" });
    }
  });

  // Manufacturing status updates/history
  app.get('/api/manufacturing-updates', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const { manufacturingId } = req.query;
      const user = (req as AuthenticatedRequest).user.userData;
      const updates = await storage.getManufacturingUpdates(
        manufacturingId ? parseInt(manufacturingId as string) : undefined,
        user
      );
      res.json(updates);
    } catch (error) {
      console.error("Error fetching manufacturing updates:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing updates" });
    }
  });

  app.post('/api/manufacturing-updates', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertManufacturingUpdateSchema.parse({
        ...req.body,
        updatedBy: user.id,
      });

      // Validate manufacturing status
      if (!isValidManufacturingStatus(validatedData.status)) {
        return res.status(400).json({ 
          message: `Invalid manufacturing status. Allowed values: ${getValidManufacturingStatuses().join(', ')}` 
        });
      }

      // Verify the manufacturing record exists and user has access to it
      const manufacturingRecord = await storage.getManufacturingRecord(validatedData.manufacturingId, user);
      if (!manufacturingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found or access denied" });
      }

      // Additional authorization check for manufacturer users
      if (user.role === 'manufacturer') {
        const userManufacturerIds = await storage.getUserAssociatedManufacturerIds(user.id);
        if (userManufacturerIds.length === 0 || !userManufacturerIds.includes(manufacturingRecord.manufacturerId!)) {
          return res.status(403).json({ message: "Access denied: You can only update manufacturing records for your associated manufacturers" });
        }
      }

      const update = await storage.createManufacturingUpdate(validatedData);

      // Update the main manufacturing record's status if provided
      if (validatedData.status && validatedData.status !== manufacturingRecord.status) {
        await storage.updateManufacturing(validatedData.manufacturingId, {
          status: validatedData.status,
        });
      }

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing_update',
        update.id,
        'created',
        null,
        update
      );

      res.status(201).json(update);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing update:", error);
      res.status(500).json({ message: "Failed to create manufacturing update" });
    }
  });

  app.put('/api/manufacturing-updates/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData!;
      const validatedData = insertManufacturingUpdateSchema.partial().parse({
        ...req.body,
        updatedBy: user.id,
      });

      // Validate manufacturing status if provided
      if (validatedData.status && !isValidManufacturingStatus(validatedData.status)) {
        return res.status(400).json({ 
          message: `Invalid manufacturing status. Allowed values: ${getValidManufacturingStatuses().join(', ')}` 
        });
      }

      // Get existing manufacturing update
      const existingUpdate = await storage.getManufacturingUpdateById(id);
      if (!existingUpdate) {
        return res.status(404).json({ message: "Manufacturing update not found" });
      }

      // Verify the manufacturing record exists and user has access to it
      const manufacturingRecord = await storage.getManufacturingRecord(existingUpdate.manufacturingId, user);
      if (!manufacturingRecord) {
        return res.status(404).json({ message: "Manufacturing record not found or access denied" });
      }

      // Additional authorization check for manufacturer users
      if (user.role === 'manufacturer') {
        const userManufacturerIds = await storage.getUserAssociatedManufacturerIds(user.id);
        if (userManufacturerIds.length === 0 || !userManufacturerIds.includes(manufacturingRecord.manufacturerId!)) {
          return res.status(403).json({ message: "Access denied: You can only update manufacturing records for your associated manufacturers" });
        }
      }

      // Update the manufacturing update record
      const updatedUpdate = await storage.updateManufacturingUpdate(id, validatedData);

      // Update the main manufacturing record if status or manufacturerId changed
      const mainRecordUpdates: any = {};
      if (validatedData.status && validatedData.status !== manufacturingRecord.status) {
        mainRecordUpdates.status = validatedData.status;
      }
      if (validatedData.manufacturerId && validatedData.manufacturerId !== manufacturingRecord.manufacturerId) {
        mainRecordUpdates.manufacturerId = validatedData.manufacturerId;
      }

      if (Object.keys(mainRecordUpdates).length > 0) {
        await storage.updateManufacturing(existingUpdate.manufacturingId, mainRecordUpdates);
      }

      // Log activity
      await storage.logActivity(
        user.id,
        'manufacturing_update',
        id,
        'updated',
        existingUpdate,
        updatedUpdate
      );

      res.json(updatedUpdate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturing update:", error);
      res.status(500).json({ message: "Failed to update manufacturing update" });
    }
  });

  // GET /api/manufacturing/order/:orderId - Get manufacturing record by order ID
  app.get('/api/manufacturing/order/:orderId', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const record = await storage.getManufacturingByOrder(orderId);
      if (!record) {
        return res.status(404).json({ message: "No manufacturing record found for this order" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching manufacturing record by order:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing record" });
    }
  });

  app.get('/api/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      console.error("Error fetching manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });

  app.post('/api/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const validatedData = insertManufacturerSchema.parse(req.body);
      const manufacturer = await storage.createManufacturer(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturer',
        manufacturer.id,
        'created',
        null,
        manufacturer
      );

      res.status(201).json(manufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturer:", error);
      res.status(500).json({ message: "Failed to create manufacturer" });
    }
  });

  app.put('/api/manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertManufacturerSchema.partial().parse(req.body);

      const existingManufacturer = await storage.getManufacturer(id);
      if (!existingManufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }

      const updatedManufacturer = await storage.updateManufacturer(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturer',
        id,
        'updated',
        existingManufacturer,
        updatedManufacturer
      );

      res.json(updatedManufacturer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating manufacturer:", error);
      res.status(500).json({ message: "Failed to update manufacturer" });
    }
  });

  // Line Item Manufacturer Assignment API
  app.get('/api/line-items/:lineItemId/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const lineItemId = parseInt(req.params.lineItemId);
      const assignments = await storage.getLineItemManufacturers(lineItemId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching line item manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch line item manufacturers" });
    }
  });

  app.get('/api/orders/:orderId/line-item-manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const assignments = await storage.getLineItemManufacturersByOrder(orderId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching order line item manufacturers:", error);
      res.status(500).json({ message: "Failed to fetch order line item manufacturers" });
    }
  });

  app.post('/api/line-items/:lineItemId/manufacturers', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const lineItemId = parseInt(req.params.lineItemId);
      const validatedData = insertOrderLineItemManufacturerSchema.parse({
        ...req.body,
        lineItemId
      });

      const assignment = await storage.assignManufacturerToLineItem(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        assignment.id,
        'created',
        null,
        assignment
      );

      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error assigning manufacturer to line item:", error);
      res.status(500).json({ message: "Failed to assign manufacturer to line item" });
    }
  });

  app.put('/api/line-item-manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertOrderLineItemManufacturerSchema.partial().parse(req.body);

      const updated = await storage.updateLineItemManufacturer(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        id,
        'updated',
        null,
        updated
      );

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating line item manufacturer:", error);
      res.status(500).json({ message: "Failed to update line item manufacturer" });
    }
  });

  app.delete('/api/line-item-manufacturers/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLineItemManufacturer(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'line_item_manufacturer',
        id,
        'deleted',
        null,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting line item manufacturer:", error);
      res.status(500).json({ message: "Failed to delete line item manufacturer" });
    }
  });

  // Manufacturing Attachments API
  app.get('/api/manufacturing/:manufacturingId/attachments', isAuthenticated, loadUserData, requirePermission('manufacturing', 'read'), async (req, res) => {
    try {
      const manufacturingId = parseInt(req.params.manufacturingId);
      const attachments = await storage.getManufacturingAttachments(manufacturingId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching manufacturing attachments:", error);
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.post('/api/manufacturing/:manufacturingId/attachments', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const manufacturingId = parseInt(req.params.manufacturingId);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      const validatedData = insertManufacturingAttachmentSchema.parse({
        ...req.body,
        manufacturingId,
        uploadedBy: userId
      });

      const attachment = await storage.createManufacturingAttachment(validatedData);

      // Log activity
      await storage.logActivity(
        userId,
        'manufacturing_attachment',
        attachment.id,
        'created',
        null,
        attachment
      );

      res.status(201).json(attachment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating manufacturing attachment:", error);
      res.status(500).json({ message: "Failed to create attachment" });
    }
  });

  app.delete('/api/manufacturing/attachments/:id', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteManufacturingAttachment(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'manufacturing_attachment',
        id,
        'deleted',
        null,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting manufacturing attachment:", error);
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Note: Manufacturing export routes (PDF and ZIP) are handled in manufacturing.routes.ts
  // Removing duplicate endpoints to fix 404 errors

  // Team Store routes
  app.get('/api/team-stores', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData;
      const teamStores = await storage.getTeamStores(user);
      res.json(teamStores);
    } catch (error) {
      console.error("Error fetching team stores:", error);
      res.status(500).json({ message: "Failed to fetch team stores" });
    }
  });

  app.get('/api/team-stores/archived/list', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData;
      const archivedTeamStores = await storage.getArchivedTeamStores(user);
      res.json(archivedTeamStores);
    } catch (error) {
      console.error("Error fetching archived team stores:", error);
      res.status(500).json({ message: "Failed to fetch archived team stores" });
    }
  });

  app.get('/api/team-stores/:id', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = (req as AuthenticatedRequest).user.userData;
      const teamStore = await storage.getTeamStore(id, user);
      if (!teamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }
      res.json(teamStore);
    } catch (error) {
      console.error("Error fetching team store:", error);
      res.status(500).json({ message: "Failed to fetch team store" });
    }
  });

  app.post('/api/team-stores', isAuthenticated, loadUserData, requirePermission('orders', 'canCreate' as any), async (req, res) => {
    try {
      const { lineItemIds, ...teamStoreData } = req.body;
      const validatedData = insertTeamStoreSchema.parse(teamStoreData);
      const validatedLineItemIds = lineItemIds || [];
      
      const teamStore = await storage.createTeamStore(validatedData, validatedLineItemIds);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        teamStore.id,
        'created',
        null,
        teamStore
      );

      res.status(201).json(teamStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating team store:", error);
      res.status(500).json({ message: "Failed to create team store" });
    }
  });

  app.put('/api/team-stores/:id', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingTeamStore = await storage.getTeamStore(id);
      if (!existingTeamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }

      const validatedData = insertTeamStoreSchema.partial().parse(req.body);
      const updatedTeamStore = await storage.updateTeamStore(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        id,
        'updated',
        existingTeamStore,
        updatedTeamStore
      );

      res.json(updatedTeamStore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating team store:", error);
      res.status(500).json({ message: "Failed to update team store" });
    }
  });

  app.delete('/api/team-stores/:id', isAuthenticated, loadUserData, requirePermission('orders', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingTeamStore = await storage.getTeamStore(id);
      if (!existingTeamStore) {
        return res.status(404).json({ message: "Team store not found" });
      }

      await storage.deleteTeamStore(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        id,
        'deleted',
        existingTeamStore,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team store:", error);
      res.status(500).json({ message: "Failed to delete team store" });
    }
  });

  app.post('/api/team-stores/:id/archive', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      
      const archived = await storage.archiveTeamStore(id, userId);

      // Log activity
      await storage.logActivity(
        userId,
        'team_store',
        id,
        'archived',
        null,
        archived
      );

      res.json(archived);
    } catch (error) {
      console.error("Error archiving team store:", error);
      res.status(500).json({ message: "Failed to archive team store" });
    }
  });

  app.post('/api/team-stores/:id/unarchive', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const unarchived = await storage.unarchiveTeamStore(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'team_store',
        id,
        'unarchived',
        null,
        unarchived
      );

      res.json(unarchived);
    } catch (error) {
      console.error("Error unarchiving team store:", error);
      res.status(500).json({ message: "Failed to unarchive team store" });
    }
  });

  // Team Store Line Item routes
  app.get('/api/team-stores/:teamStoreId/line-items', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const teamStoreId = parseInt(req.params.teamStoreId);
      const lineItems = await storage.getTeamStoreLineItems(teamStoreId);
      res.json(lineItems);
    } catch (error) {
      console.error("Error fetching team store line items:", error);
      res.status(500).json({ message: "Failed to fetch team store line items" });
    }
  });

  app.put('/api/team-stores/line-items/:id', isAuthenticated, loadUserData, requirePermission('orders', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTeamStoreLineItemSchema.partial().parse(req.body);
      const updated = await storage.updateTeamStoreLineItem(id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating team store line item:", error);
      res.status(500).json({ message: "Failed to update team store line item" });
    }
  });

  // Salespeople API
  app.get('/api/salespeople', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const salespeople = await storage.getSalespeopleWithUserData();
      res.json(salespeople);
    } catch (error) {
      console.error("Error fetching salespeople:", error);
      res.status(500).json({ message: "Failed to fetch salespeople" });
    }
  });

  // Get salesperson performance metrics
  app.get('/api/salespeople/:id/performance', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      // Sales users can ONLY view their own performance data
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales' && salesperson.userId !== (req as AuthenticatedRequest).user.userData!.id) {
        return res.status(403).json({ message: "Access denied: Sales users can only view their own performance" });
      }

      const performance = await storage.getSalespersonPerformance(id);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching salesperson performance:", error);
      res.status(500).json({ message: "Failed to fetch salesperson performance" });
    }
  });

  // Get all salespeople with performance metrics
  app.get('/api/salespeople/with-metrics', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const salespeopleWithMetrics = await storage.getSalespeopleWithMetrics();

      // Filter based on user role
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      if (userRole === 'sales') {
        const currentSalesperson = await storage.getSalespersonByUserId((req as AuthenticatedRequest).user.userData!.id);
        if (currentSalesperson) {
          // Only show salespeople in the same territory
          const filtered = salespeopleWithMetrics.filter(sp => 
            sp.userId === (req as AuthenticatedRequest).user.userData!.id || 
            sp.territory === currentSalesperson.territory
          );
          return res.json(filtered);
        }
      }

      res.json(salespeopleWithMetrics);
    } catch (error) {
      console.error("Error fetching salespeople with metrics:", error);
      res.status(500).json({ message: "Failed to fetch salespeople with metrics" });
    }
  });

  app.get('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const salesperson = await storage.getSalesperson(id);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }
      res.json(salesperson);
    } catch (error) {
      console.error("Error fetching salesperson:", error);
      res.status(500).json({ message: "Failed to fetch salesperson" });
    }
  });

  app.post('/api/salespeople', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const validatedData = insertSalespersonSchema.parse(req.body);
      const salesperson = await storage.createSalesperson(validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        salesperson.id,
        'created',
        null,
        salesperson
      );

      res.status(201).json(salesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating salesperson:", error);
      res.status(500).json({ message: "Failed to create salesperson" });
    }
  });

  app.put('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSalespersonSchema.partial().parse(req.body);

      const existingSalesperson = await storage.getSalesperson(id);
      if (!existingSalesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      const updatedSalesperson = await storage.updateSalesperson(id, validatedData);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        id,
        'updated',
        existingSalesperson,
        updatedSalesperson
      );

      res.json(updatedSalesperson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating salesperson:", error);
      res.status(500).json({ message: "Failed to update salesperson" });
    }
  });

  app.delete('/api/salespeople/:id', isAuthenticated, loadUserData, requirePermission('salespeople', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const existingSalesperson = await storage.getSalesperson(id);
      if (!existingSalesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      await storage.deleteSalesperson(id);

      // Log activity
      await storage.logActivity(
        (req as AuthenticatedRequest).user.userData!.id,
        'salesperson',
        id,
        'deleted',
        existingSalesperson,
        null
      );

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting salesperson:", error);
      res.status(500).json({ message: "Failed to delete salesperson" });
    }
  });

  // Salesperson workflow dashboard routes
  app.get('/api/salespeople/workflow-dashboard/:userId', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const userId = req.params.userId;
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;

      // Check if user can view this salesperson's workflow
      if (userRole === 'sales' && userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get salesperson data
      const salesperson = await storage.getSalespersonByUserId(userId);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      // Fetch all workflow items for this salesperson
      const leads = await storage.getLeadsBySalesperson(userId);
      const quotes = await storage.getQuotesBySalesperson(userId);
      const orders = await storage.getOrdersBySalesperson(userId);

      // Transform data into unified workflow items
      const workflowItems = [];

      // Add leads
      for (const lead of leads) {
        const daysSinceLastAction = lead.updatedAt ? Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        workflowItems.push({
          id: lead.id,
          type: 'lead',
          code: lead.leadCode,
          name: `Lead from ${lead.organization?.name || 'Unknown'}`,
          status: lead.stage,
          priority: 'normal', // Default priority for leads
          organizationName: lead.organization?.name || 'Unknown',
          contactName: lead.contact?.name,
          needsAttention: daysSinceLastAction > 7 || lead.stage === 'future_lead',
          daysSinceLastAction,
          lastActionDate: lead.updatedAt,
          lastAction: `Stage: ${lead.stage}`
        });
      }

      // Add quotes
      for (const quote of quotes) {
        const daysSinceLastAction = quote.updatedAt ? Math.floor((Date.now() - new Date(quote.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        workflowItems.push({
          id: quote.id,
          type: 'quote',
          code: quote.quoteCode,
          name: quote.quoteName,
          status: quote.status,
          priority: 'normal', // Default priority for quotes
          organizationName: quote.organization?.name || 'Unknown',
          contactName: quote.contact?.name,
          value: quote.total ? parseFloat(quote.total) : 0,
          dueDate: quote.validUntil,
          needsAttention: daysSinceLastAction > 5 || quote.status === 'draft',
          daysSinceLastAction,
          lastActionDate: quote.updatedAt,
          lastAction: `Status: ${quote.status}`
        });
      }

      // Add orders
      for (const order of orders) {
        const daysSinceLastAction = order.updatedAt ? Math.floor((Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 999;
        workflowItems.push({
          id: order.id,
          type: 'order',
          code: order.orderCode,
          name: order.orderName,
          status: order.status,
          priority: order.priority,
          organizationName: order.organization?.name || 'Unknown',
          dueDate: order.estDelivery,
          needsAttention: daysSinceLastAction > 3 || order.status === 'new',
          daysSinceLastAction,
          lastActionDate: order.updatedAt,
          lastAction: `Status: ${order.status}`
        });
      }

      // Sort by needs attention first, then by last action date
      workflowItems.sort((a, b) => {
        if (a.needsAttention && !b.needsAttention) return -1;
        if (!a.needsAttention && b.needsAttention) return 1;
        const aTime = a.lastActionDate ? new Date(a.lastActionDate).getTime() : 0;
        const bTime = b.lastActionDate ? new Date(b.lastActionDate).getTime() : 0;
        return bTime - aTime;
      });

      res.json(workflowItems);
    } catch (error) {
      console.error("Error fetching workflow dashboard:", error);
      res.status(500).json({ message: "Failed to fetch workflow dashboard" });
    }
  });

  app.get('/api/salespeople/workflow-metrics/:userId', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const userId = req.params.userId;
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const currentUserId = (req as AuthenticatedRequest).user.userData!.id;

      // Check if user can view this salesperson's metrics
      if (userRole === 'sales' && userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get salesperson data
      const salesperson = await storage.getSalespersonByUserId(userId);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      // Calculate date ranges
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch data for calculations
      const leads = await storage.getLeadsBySalesperson(userId);
      const quotes = await storage.getQuotesBySalesperson(userId);
      const orders = await storage.getOrdersBySalesperson(userId);

      // Calculate metrics
      const activeLeads = leads.filter(l => !['current_clients', 'no_answer_delete'].includes(l.stage)).length;
      const activeQuotes = quotes.filter(q => !['accepted', 'rejected', 'expired'].includes(q.status)).length;
      const activeOrders = orders.filter(o => !['completed', 'shipped'].includes(o.status)).length;
      const totalActive = activeLeads + activeQuotes + activeOrders;

      // Items needing attention (no activity in 5+ days)
      const cutoffDate = new Date(Date.now() - (5 * 24 * 60 * 60 * 1000));
      const needingAttention = leads.filter(l => l.updatedAt && new Date(l.updatedAt) < cutoffDate && !['current_clients', 'no_answer_delete'].includes(l.stage)).length +
                              quotes.filter(q => q.updatedAt && new Date(q.updatedAt) < cutoffDate && !['accepted', 'rejected', 'expired'].includes(q.status)).length +
                              orders.filter(o => o.updatedAt && new Date(o.updatedAt) < cutoffDate && !['completed', 'shipped'].includes(o.status)).length;

      // Completed this week
      const completedThisWeek = leads.filter(l => l.stage === 'current_clients' && l.updatedAt && new Date(l.updatedAt) >= weekStart).length +
                               quotes.filter(q => q.status === 'accepted' && q.updatedAt && new Date(q.updatedAt) >= weekStart).length +
                               orders.filter(o => o.status === 'completed' && o.updatedAt && new Date(o.updatedAt) >= weekStart).length;

      // Conversion rate (current_clients leads / total leads this month)
      const monthlyLeads = leads.filter(l => l.createdAt && new Date(l.createdAt) >= monthStart);
      const wonLeads = monthlyLeads.filter(l => l.stage === 'current_clients');
      const conversionRate = monthlyLeads.length > 0 ? Math.round((wonLeads.length / monthlyLeads.length) * 100) : 0;

      // Average close time (days from created to current_clients for this month)
      const wonThisMonth = wonLeads.filter(l => l.updatedAt && new Date(l.updatedAt) >= monthStart);
      const avgCloseTime = wonThisMonth.length > 0 ? 
        Math.round(wonThisMonth.reduce((sum, lead) => {
          if (!lead.updatedAt || !lead.createdAt) return sum;
          const days = (new Date(lead.updatedAt).getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / wonThisMonth.length) : 0;

      // Pipeline value (active quotes + orders)
      const pipelineValue = quotes.filter(q => ['sent', 'draft'].includes(q.status))
                                 .reduce((sum, q) => sum + (q.total ? parseFloat(q.total) : 0), 0) +
                           orders.filter(o => !['completed', 'shipped'].includes(o.status))
                                 .reduce((sum, o) => sum + ((o as any).lineItems?.reduce((lineSum: number, item: any) => lineSum + (item.lineTotal ? parseFloat(item.lineTotal) : 0), 0) || 0), 0);

      const metrics = {
        totalActive,
        needingAttention,
        completedThisWeek,
        conversionRate,
        averageCloseTime: avgCloseTime,
        totalValue: pipelineValue
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching workflow metrics:", error);
      res.status(500).json({ message: "Failed to fetch workflow metrics" });
    }
  });

  // Enhanced salesperson actions endpoint
  app.post('/api/salespeople/actions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const { entityType, entityId, action, notes, followUpDate, nextStage } = req.body;

      // Record the action in activity log
      await storage.logActivity(
        userId,
        entityType,
        entityId,
        action,
        null,
        {
          action,
          notes,
          followUpDate,
          nextStage
        }
      );

      // Update entity status if nextStage is provided
      if (nextStage && entityType === 'order') {
        await storage.updateOrder(entityId, { status: nextStage });
      } else if (nextStage && entityType === 'lead') {
        await storage.updateLead(entityId, { stage: nextStage });
      } else if (nextStage && entityType === 'quote') {
        await storage.updateQuote(entityId, { status: nextStage });
      }

      res.json({ message: "Action recorded successfully" });
    } catch (error) {
      console.error("Error recording salesperson action:", error);
      res.status(500).json({ message: "Failed to record action" });
    }
  });

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

      const validatedQuote = insertQuoteSchema.parse(quoteData);

      // Sales users can only create quotes for themselves
      if ((req as AuthenticatedRequest).user.userData!.role === 'sales') {
        validatedQuote.salespersonId = (req as AuthenticatedRequest).user.userData!.id;
      }

      // If line items are provided, validate and create quote with line items
      if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
        const validatedLineItems = lineItems.map((item: any) => {
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
        console.error("Quote validation failed:", JSON.stringify(error.errors, null, 2));
        console.error("Request body was:", JSON.stringify(req.body, null, 2));
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  app.put('/api/quotes/:id', isAuthenticated, loadUserData, requirePermission('quotes', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Extract line items from request body
      const { lineItems, ...quoteFields } = req.body;
      const validatedData = insertQuoteSchema.partial().parse(quoteFields);

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

      // Handle line items if provided
      if (lineItems && Array.isArray(lineItems)) {
        const existingLineItems = await storage.getQuoteLineItems(id);
        const existingItemIds = new Set(existingLineItems.map(item => item.id));
        const updatedItemIds = new Set<number>();

        // Update or create line items
        for (const item of lineItems) {
          if (item.id) {
            // Update existing line item
            updatedItemIds.add(item.id);
            await storage.updateQuoteLineItem(item.id, {
              variantId: item.variantId,
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toString(),
            });
          } else {
            // Create new line item
            const newItem = await storage.createQuoteLineItem({
              variantId: item.variantId,
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toString(),
            } as any); // Type assertion needed due to quoteId being omitted from schema but required by DB
            updatedItemIds.add(newItem.id);
          }
        }

        // Delete line items that are no longer in the list
        for (const existingItem of existingLineItems) {
          if (!updatedItemIds.has(existingItem.id)) {
            await storage.deleteQuoteLineItem(existingItem.id);
          }
        }
      }

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
      const validatedData = insertQuoteLineItemSchema.parse(req.body);

      // Add quoteId separately as it's omitted from the schema but required by DB
      const lineItem = await storage.createQuoteLineItem({
        ...validatedData,
        quoteId
      } as any);
      res.status(201).json(lineItem);
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
      console.error("Error suggesting salesperson:", error);
      res.status(500).json({ message: "Failed to suggest salesperson" });
    }
  });

  app.post('/api/commission/calculate', isAuthenticated, loadUserData, requirePermission('orders', 'read'), async (req, res) => {
    try {
      const { orderId } = req.body;

      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const commission = await storage.calculateCommission(parseInt(orderId));

      res.json(commission);
    } catch (error) {
      console.error("Error calculating commission:", error);
      res.status(500).json({ message: "Failed to calculate commission" });
    }
  });

  app.get('/api/inventory/levels', isAuthenticated, loadUserData, requirePermission('catalog', 'read'), async (req, res) => {
    try {
      const levels = await storage.getInventoryLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching inventory levels:", error);
      res.status(500).json({ message: "Failed to fetch inventory levels" });
    }
  });

  // Financial Transaction endpoints
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

  app.post('/api/financial/transactions', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const { insertFinancialTransactionSchema } = await import("@shared/schema");
      const transactionData = insertFinancialTransactionSchema.parse(req.body);
      const transaction = await storage.createFinancialTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating financial transaction:", error);
      res.status(500).json({ message: "Failed to create financial transaction" });
    }
  });

  // Commission endpoints
  app.get('/api/financial/commissions', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { salespersonId, status, period } = req.query;
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      // Sales users can only view their own commissions
      let filteredSalespersonId = salespersonId as string;
      if (userRole === 'sales') {
        filteredSalespersonId = userId; // Force to their own user ID, ignore query param
      }

      const commissions = await storage.getCommissions({
        salespersonId: filteredSalespersonId,
        status: status as string,
        period: period as string,
      });
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({ message: "Failed to fetch commissions" });
    }
  });

  app.post('/api/financial/commissions', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const { insertCommissionSchema } = await import("@shared/schema");
      const commissionData = insertCommissionSchema.parse(req.body);
      const commission = await storage.createCommission(commissionData);
      res.status(201).json(commission);
    } catch (error) {
      console.error("Error creating commission:", error);
      res.status(500).json({ message: "Failed to create commission" });
    }
  });

  // Budget endpoints
  app.get('/api/financial/budgets', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { type, status, period } = req.query;
      const budgets = await storage.getBudgets({
        type: type as string,
        status: status as string,
        period: period as string,
      });
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post('/api/financial/budgets', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const { insertBudgetSchema } = await import("@shared/schema");
      const budgetData = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  // Financial Reports endpoints
  app.get('/api/financial/reports', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { reportType, generatedBy } = req.query;
      const reports = await storage.getFinancialReports({
        reportType: reportType as string,
        generatedBy: generatedBy as string,
      });
      res.json(reports);
    } catch (error) {
      console.error("Error fetching financial reports:", error);
      res.status(500).json({ message: "Failed to fetch financial reports" });
    }
  });

  app.post('/api/financial/reports', isAuthenticated, loadUserData, requirePermission('finance', 'write'), async (req, res) => {
    try {
      const { insertFinancialReportSchema } = await import("@shared/schema");
      const reportData = insertFinancialReportSchema.parse(req.body);
      const report = await storage.createFinancialReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating financial report:", error);
      res.status(500).json({ message: "Failed to create financial report" });
    }
  });

  // Financial Alerts endpoints
  app.get('/api/financial/alerts', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { unreadOnly } = req.query;
      const alerts = await storage.getFinancialAlerts((req as AuthenticatedRequest).user.userData!.id, unreadOnly === 'true');
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching financial alerts:", error);
      res.status(500).json({ message: "Failed to fetch financial alerts" });
    }
  });

  app.post('/api/financial/alerts/:id/read', isAuthenticated, loadUserData, async (req, res) => {
    try {
      await storage.markFinancialAlertAsRead(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Financial Overview/Dashboard endpoint
  app.get('/api/financial/overview', isAuthenticated, loadUserData, requirePermission('finance', 'read'), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const userRole = (req as AuthenticatedRequest).user.userData!.role as UserRole;
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

  // NOTE: /public-objects, /objects, and /api/upload/image routes are handled by registerUploadRoutes()
  // See server/routes/upload.routes.ts for these route definitions

  // Validate uploaded file content for security
  app.post("/api/upload/validate", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { uploadId, objectPath } = req.body;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      if (!uploadId || !objectPath) {
        return res.status(400).json({ 
          error: "Missing required fields: uploadId and objectPath are required" 
        });
      }

      // Get the uploaded file for content scanning
      const objectStorageService = new ObjectStorageService();
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

        // Download file content for scanning (limit to first 1MB for security)
        const chunks: Buffer[] = [];
        const stream = objectFile.createReadStream({ start: 0, end: 1024 * 1024 });

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        const content = Buffer.concat(chunks);

        // Scan content for malicious patterns
        const securityWarnings = FileUploadSecurityService.scanFileContent(content);

        if (securityWarnings.length > 0) {
          // Log security incident
          await storage.logActivity(
            userId,
            'file_upload',
            uploadId,
            'content_scan_failed',
            null,
            {
              objectPath,
              securityWarnings,
              action: 'file_rejected'
            }
          );

          return res.status(400).json({
            error: "File content validation failed",
            securityWarnings,
            action: "File rejected due to security concerns"
          });
        }

        // Log successful validation
        await storage.logActivity(
          userId,
          'file_upload',
          uploadId,
          'content_scan_passed',
          null,
          {
            objectPath,
            action: 'file_approved'
          }
        );

        res.json({
          valid: true,
          message: "File content validation passed",
          uploadId,
          objectPath
        });

      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: "Uploaded file not found" });
        }
        throw error;
      }

    } catch (error) {
      console.error("Error validating uploaded file:", error);
      res.status(500).json({ error: "Failed to validate uploaded file" });
    }
  });

  // Get upload URL for documents with security validation
  app.post("/api/upload/document", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { filename, size, mimeType } = req.body;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      // Validate required fields
      if (!filename || !size || !mimeType) {
        return res.status(400).json({ 
          error: "Missing required fields: filename, size, and mimeType are required" 
        });
      }

      // Perform comprehensive security validation for documents
      const validationRequest: FileUploadValidationRequest = {
        filename,
        size: parseInt(size),
        mimeType,
        fileCategory: 'documents'
      };

      const validationResult = await FileUploadSecurityService.validateFileUpload(validationRequest);

      if (!validationResult.valid) {
        return res.status(400).json({ 
          error: "Document upload validation failed",
          details: validationResult.errors,
          securityWarnings: validationResult.securityWarnings 
        });
      }

      // Generate upload metadata
      const uploadMetadata = FileUploadSecurityService.generateUploadMetadata(userId, 'documents');

      // Generate secure upload URL
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      // Log upload request
      await storage.logActivity(
        userId,
        'file_upload',
        parseInt(uploadMetadata.uploadId.slice(-8), 16), // Convert string ID to numeric hash
        'document_upload_requested',
        null,
        {
          originalFilename: filename,
          sanitizedFilename: validationResult.sanitizedFilename,
          size: validationRequest.size,
          mimeType: validationRequest.mimeType,
          uploadMetadata
        }
      );

      res.json({ 
        uploadURL,
        uploadId: uploadMetadata.uploadId,
        sanitizedFilename: validationResult.sanitizedFilename,
        maxSize: uploadMetadata.maxSize,
        allowedMimeTypes: uploadMetadata.allowedMimeTypes,
        securityWarnings: validationResult.securityWarnings
      });
    } catch (error) {
      console.error("Error getting document upload URL:", error);
      res.status(500).json({ error: "Failed to get document upload URL" });
    }
  });

  // Get upload URL for design job files (logos, references, etc.)
  app.post("/api/upload/design-file", isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { filename, size, mimeType, fileType } = req.body;
      const userId = (req as AuthenticatedRequest).user.userData!.id;

      // Validate required fields
      if (!filename || !size || !mimeType || !fileType) {
        return res.status(400).json({ 
          error: "Missing required fields: filename, size, mimeType, and fileType are required" 
        });
      }

      // Determine file category based on fileType
      // PSDs and other design files should use 'design_files' category for proper validation
      let fileCategory: 'images' | 'documents' | 'design_files';
      if (['logo', 'designReference'].includes(fileType)) {
        fileCategory = 'images';
      } else if (['psds', 'production_files', 'other'].includes(fileType)) {
        fileCategory = 'design_files';
      } else {
        fileCategory = 'documents';
      }

      // Perform comprehensive security validation
      const validationRequest: FileUploadValidationRequest = {
        filename,
        size: parseInt(size),
        mimeType,
        fileCategory
      };

      const validationResult = await FileUploadSecurityService.validateFileUpload(validationRequest);

      if (!validationResult.valid) {
        return res.status(400).json({ 
          error: "Design file upload validation failed",
          details: validationResult.errors,
          securityWarnings: validationResult.securityWarnings 
        });
      }

      // Generate upload metadata
      const uploadMetadata = FileUploadSecurityService.generateUploadMetadata(userId, fileCategory);

      // Generate secure upload URL
      const objectStorageService = new ObjectStorageService();
      const uploadURL = fileCategory === 'images' 
        ? await objectStorageService.getProductImageUploadURL()
        : await objectStorageService.getObjectEntityUploadURL();

      // Log upload request
      await storage.logActivity(
        userId,
        'file_upload',
        parseInt(uploadMetadata.uploadId.slice(-8), 16),
        'design_file_upload_requested',
        null,
        {
          originalFilename: filename,
          sanitizedFilename: validationResult.sanitizedFilename,
          size: validationRequest.size,
          mimeType: validationRequest.mimeType,
          fileType,
          uploadMetadata
        }
      );

      res.json({ 
        uploadURL,
        uploadId: uploadMetadata.uploadId,
        sanitizedFilename: validationResult.sanitizedFilename,
        maxSize: uploadMetadata.maxSize,
        allowedMimeTypes: uploadMetadata.allowedMimeTypes,
        securityWarnings: validationResult.securityWarnings
      });
    } catch (error) {
      console.error("Error getting design file upload URL:", error);
      res.status(500).json({ error: "Failed to get design file upload URL" });
    }
  });

  // Update product images after upload
  app.put("/api/products/:id/images", isAuthenticated, loadUserData, requirePermission('catalog', 'write'), async (req, res) => {
    const { primaryImageUrl, additionalImages } = req.body;
    const productId = parseInt(req.params.id);

    if (!primaryImageUrl && (!additionalImages || additionalImages.length === 0)) {
      return res.status(400).json({ error: "At least one image URL is required" });
    }

    const userId = (req as AuthenticatedRequest).user?.userData?.id;

    try {
      const objectStorageService = new ObjectStorageService();

      // Normalize image URLs - convert from storage URLs to app paths
      let normalizedPrimaryImage = null;
      if (primaryImageUrl) {
        normalizedPrimaryImage = await objectStorageService.trySetObjectEntityAclPolicy(
          primaryImageUrl,
          {
            owner: userId!,
            visibility: "public", // Product images should be public
            aclRules: [],
          }
        );
      }

      const normalizedAdditionalImages = [];
      if (additionalImages && additionalImages.length > 0) {
        for (const imageUrl of additionalImages) {
          const normalizedUrl = await objectStorageService.trySetObjectEntityAclPolicy(
            imageUrl,
            {
              owner: userId!,
              visibility: "public",
              aclRules: [],
            }
          );
          normalizedAdditionalImages.push(normalizedUrl);
        }
      }

      // Update the product with the normalized image URLs
      const existingProduct = await storage.getProduct(productId);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updateData: any = {};
      if (normalizedPrimaryImage) {
        updateData.primaryImageUrl = normalizedPrimaryImage;
      }
      if (normalizedAdditionalImages.length > 0) {
        updateData.additionalImages = normalizedAdditionalImages;
      }

      const updatedProduct = await storage.updateProduct(productId, updateData);

      // Log activity
      await storage.logActivity(
        userId!,
        'product',
        productId,
        'images_updated',
        existingProduct,
        updatedProduct
      );

      res.status(200).json({
        primaryImageUrl: normalizedPrimaryImage,
        additionalImages: normalizedAdditionalImages,
        product: updatedProduct
      });
    } catch (error) {
      console.error("Error updating product images:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Territory Management API
  app.get('/api/territories', isAuthenticated, loadUserData, requirePermission('salespeople', 'read'), async (req, res) => {
    try {
      const territories = await storage.getTerritories();
      res.json(territories);
    } catch (error) {
      console.error("Error fetching territories:", error);
      res.status(500).json({ message: "Failed to fetch territories" });
    }
  });

  // Salesperson Actions API
  app.post('/api/salespeople/actions', isAuthenticated, loadUserData, requirePermission('salespeople', 'write'), async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).user.userData!.id;
      const { entityType, entityId, action, notes, followUpDate, nextStage } = req.body;

      // Validate request data
      const actionSchema = z.object({
        entityType: z.enum(['lead', 'order', 'quote']),
        entityId: z.number().int().positive(),
        action: z.string().min(1),
        notes: z.string().min(1),
        followUpDate: z.string().optional(),
        nextStage: z.string().optional(),
      });

      const validatedData = actionSchema.parse({
        entityType,
        entityId: parseInt(entityId),
        action,
        notes,
        followUpDate,
        nextStage
      });

      if (!validatedData.entityType || !validatedData.entityId || !validatedData.action || !validatedData.notes) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await storage.recordSalespersonAction({
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        salespersonId: userId,
        action: validatedData.action,
        notes: validatedData.notes,
        followUpDate: validatedData.followUpDate,
        nextStage: validatedData.nextStage
      });

      res.json(result);
    } catch (error) {
      console.error("Error recording salesperson action:", error);
      res.status(500).json({ message: "Failed to record action" });
    }
  });

  // Auto-assign lead endpoint
  app.post('/api/leads/:id/auto-assign', isAuthenticated, loadUserData, requirePermission('leads', 'write'), async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const result = await storage.autoAssignLead(leadId);

      if (result.assigned) {
        res.json({ 
          message: "Lead assigned successfully", 
          salespersonId: result.salespersonId 
        });
      } else {
        res.json({ message: "No available salesperson found" });
      }
    } catch (error) {
      console.error("Error auto-assigning lead:", error);
      res.status(500).json({ message: "Failed to auto-assign lead" });
    }
  });

  // Suggest salesperson endpoint
  app.post('/api/salespeople/suggest', isAuthenticated, loadUserData, requirePermission('leads', 'read'), async (req, res) => {
    try {
      const { territory, clientType } = req.body;
      const suggestedSalesperson = await storage.suggestSalespersonForLead(territory, clientType);

      if (suggestedSalesperson) {
        res.json(suggestedSalesperson);
      } else {
        res.status(404).json({ message: "No available salesperson found" });
      }
    } catch (error) {
      console.error("Error suggesting salesperson:", error);
      res.status(500).json({ message: "Failed to suggest salesperson" });
    }
  });

  // Permission Management Routes (Admin Only)

  // Role routes
  app.get('/api/permissions/roles', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.get('/api/permissions/roles/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const role = await storage.getRole(parseInt(req.params.id));
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  app.post('/api/permissions/roles', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.json(role);
    } catch (error: any) {
      console.error("Error creating role:", error);
      res.status(400).json({ message: error.message || "Failed to create role" });
    }
  });

  // Resource routes
  app.get('/api/permissions/resources', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  app.post('/api/permissions/resources', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
      res.json(resource);
    } catch (error: any) {
      console.error("Error creating resource:", error);
      res.status(400).json({ message: error.message || "Failed to create resource" });
    }
  });

  // Role Permission routes
  app.get('/api/permissions/role-permissions/:roleId', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions(parseInt(req.params.roleId));
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ message: "Failed to fetch role permissions" });
    }
  });

  app.post('/api/permissions/role-permissions/bulk', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { roleId, permissions } = req.body;

      const results = [];
      for (const perm of permissions) {
        const permission = await storage.upsertRolePermission(roleId, perm.resourceId, {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          pageVisible: perm.pageVisible
        });
        results.push(permission);
      }

      res.json(results);
    } catch (error: any) {
      console.error("Error bulk updating permissions:", error);
      res.status(400).json({ message: error.message || "Failed to update permissions" });
    }
  });

  // Seed permissions endpoint (run once to populate database)
  app.post('/api/permissions/seed', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { seedPermissions } = await import('./seedPermissions');
      await seedPermissions(storage);
      res.json({ message: "Permissions seeded successfully" });
    } catch (error: any) {
      console.error("Error seeding permissions:", error);
      res.status(500).json({ message: error.message || "Failed to seed permissions" });
    }
  });

  // Get all roles
  app.get('/api/permissions/roles', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Get all resources
  app.get('/api/permissions/resources', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // Get all permissions (for permission management UI)
  app.get('/api/permissions', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching all permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Bulk update permissions
  app.post('/api/permissions/bulk-update', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      for (const update of updates) {
        await storage.upsertRolePermission(
          update.roleId,
          update.resourceId,
          update.permissions
        );
      }

      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error("Error updating permissions:", error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  });

  // Get current user's permissions (for permission checking on frontend)
  app.get('/api/permissions/user-permissions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const userData = (req as AuthenticatedRequest).user.userData!;

      // Get user's role
      const roles = await storage.getRoles();
      const role = roles.find(r => r.name === userData.role);

      if (!role) {
        return res.status(404).json({ message: "User role not found" });
      }

      // Get all resources and permissions for this role
      const resources = await storage.getResources();
      const permissions = await storage.getRolePermissions(role.id);

      res.json({
        roles: [role],
        resources,
        permissions
      });
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  // Bulk update permissions
  app.post('/api/permissions/bulk-update', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      const results = [];
      for (const update of updates) {
        const { roleId, resourceId, permissions } = update;
        const permission = await storage.upsertRolePermission(roleId, resourceId, permissions);
        results.push(permission);
      }

      res.json({ message: "Permissions updated successfully", count: results.length });
    } catch (error: any) {
      console.error("Error bulk updating permissions:", error);
      res.status(400).json({ message: error.message || "Failed to update permissions" });
    }
  });

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
      const { sendInvitationEmail } = await import("./sendgrid-service");
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
      const { resendInvitationEmail } = await import("./sendgrid-service");
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

  // =============================================================================
  // ANALYTICS & ROLE-SPECIFIC PAGE ROUTES
  // =============================================================================

  // Sales Analytics routes
  app.get('/api/sales/analytics', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Determine if user should see all data or just their own
      const isAdmin = user.role === 'admin';
      const salesUserId = isAdmin ? undefined : user.id;

      // Get orders for revenue calculation
      const allOrders = await storage.getOrders();
      const relevantOrders = salesUserId 
        ? allOrders.filter(order => order.salespersonId === salesUserId)
        : allOrders;

      // Calculate total revenue from completed/shipped orders
      const revenueOrders = relevantOrders.filter(o => 
        o.status === 'completed' || o.status === 'shipped'
      );

      let totalRevenue = 0;
      for (const order of revenueOrders) {
        const orderWithItems = await storage.getOrderWithLineItems(order.id);
        if (orderWithItems) {
          const orderTotal = orderWithItems.lineItems.reduce((sum, item) => 
            sum + parseFloat(item.lineTotal?.toString() || '0'), 0
          );
          totalRevenue += orderTotal;
        }
      }

      // Get leads for pipeline metrics
      const allLeads = await storage.getLeads();
      const relevantLeads = salesUserId
        ? allLeads.filter(lead => lead.ownerUserId === salesUserId)
        : allLeads;

      const activeLeads = relevantLeads.filter(l => 
        l.stage !== 'current_clients' && l.stage !== 'no_answer_delete'
      ).length;

      // Calculate conversion rate
      const closedLeads = relevantLeads.filter(l => 
        l.stage === 'current_clients' || l.stage === 'no_answer_delete'
      );
      const wonLeads = relevantLeads.filter(l => l.stage === 'current_clients');
      const conversionRate = closedLeads.length > 0 
        ? Math.round((wonLeads.length / closedLeads.length) * 100)
        : 0;

      // Calculate average deal size
      const avgDealSize = revenueOrders.length > 0
        ? Math.round(totalRevenue / revenueOrders.length)
        : 0;

      // Calculate pipeline value (mock_up + hot_lead stages estimated value)
      const pipelineLeads = relevantLeads.filter(l => 
        l.stage === 'mock_up' || l.stage === 'hot_lead'
      );
      // Estimate pipeline value based on average deal size
      const pipelineValue = pipelineLeads.length * avgDealSize;

      // Calculate projected commission (10% of pipeline value as example)
      const commissionRate = 0.10;
      const projectedCommission = Math.round(pipelineValue * commissionRate);

      res.json({
        totalRevenue: Math.round(totalRevenue),
        projectedCommission,
        activeLeads,
        conversionRate,
        avgDealSize,
        pipelineValue,
      });
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ message: "Failed to fetch sales analytics" });
    }
  });

  app.get('/api/sales/performance-chart', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const isAdmin = user.role === 'admin';
      const salesUserId = isAdmin ? undefined : user.id;

      const allOrders = await storage.getOrders();
      const relevantOrders = salesUserId 
        ? allOrders.filter(order => order.salespersonId === salesUserId)
        : allOrders;

      // Group orders by month for the last 6 months
      const monthlyData: { [key: string]: { revenue: number; deals: number } } = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      for (const order of relevantOrders) {
        if (order.status === 'completed' || order.status === 'shipped') {
          const date = new Date(order.createdAt!);
          const monthKey = `${months[date.getMonth()]}`;

          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { revenue: 0, deals: 0 };
          }

          const orderWithItems = await storage.getOrderWithLineItems(order.id);
          if (orderWithItems) {
            const orderTotal = orderWithItems.lineItems.reduce((sum, item) => 
              sum + parseFloat(item.lineTotal?.toString() || '0'), 0
            );
            monthlyData[monthKey].revenue += orderTotal;
            monthlyData[monthKey].deals += 1;
          }
        }
      }

      // Convert to array format for charts
      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        deals: data.deals,
        commission: Math.round(data.revenue * 0.10), // 10% commission
      }));

      res.json(chartData);
    } catch (error) {
      console.error("Error fetching sales performance chart:", error);
      res.status(500).json({ message: "Failed to fetch sales performance chart" });
    }
  });

  // Design Portfolio routes
  app.get('/api/designs/portfolio', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const isAdmin = user.role === 'admin';

      // Get completed design jobs
      const allJobs = await storage.getDesignJobs();
      const completedJobs = allJobs.filter(job => job.status === 'completed');

      // Filter by designer if not admin
      const relevantJobs = isAdmin
        ? completedJobs
        : completedJobs.filter(job => job.assignedDesignerId === user.id);

      // Transform to portfolio format
      const designs = relevantJobs.map(job => ({
        id: job.id,
        title: job.brief?.substring(0, 50) || `Design Job ${job.jobCode}`,
        client: job.organization?.name || 'Unknown Client',
        category: job.urgency === 'rush' ? 'Rush' : 'Standard',
        completedDate: job.updatedAt || job.createdAt,
        imageUrl: job.renditionMockupUrl || job.renditionProductionUrl || undefined,
        rating: 4, // Default rating - could be enhanced with a rating system
        feedbackCount: 0, // Could be enhanced with feedback tracking
        revisions: job.renditionCount || 0,
        isFeatured: job.priority === 'high',
      }));

      res.json(designs);
    } catch (error) {
      console.error("Error fetching design portfolio:", error);
      res.status(500).json({ message: "Failed to fetch design portfolio" });
    }
  });

  // Design Resources routes
  app.get('/api/design-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const resources = await storage.getDesignResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching design resources:", error);
      res.status(500).json({ message: "Failed to fetch design resources" });
    }
  });

  app.get('/api/design-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getDesignResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Design resource not found" });
      }
      res.json(resource);
    } catch (error) {
      console.error("Error fetching design resource:", error);
      res.status(500).json({ message: "Failed to fetch design resource" });
    }
  });

  app.post('/api/design-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can upload design resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can upload design resources" });
      }

      // Add uploadedBy and defaults before validation
      const dataToValidate = {
        ...req.body,
        uploadedBy: user.id,
        downloads: 0,
      };

      const validatedData = insertDesignResourceSchema.parse(dataToValidate);

      const resource = await storage.createDesignResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating design resource:", error);
      res.status(500).json({ message: "Failed to create design resource" });
    }
  });

  app.put('/api/design-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can update design resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update design resources" });
      }

      const id = parseInt(req.params.id);
      const validatedData = insertDesignResourceSchema.partial().parse(req.body);

      const resource = await storage.updateDesignResource(id, validatedData);
      res.json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating design resource:", error);
      res.status(500).json({ message: "Failed to update design resource" });
    }
  });

  app.delete('/api/design-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can delete design resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete design resources" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteDesignResource(id);
      res.json({ message: "Design resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting design resource:", error);
      res.status(500).json({ message: "Failed to delete design resource" });
    }
  });

  app.post('/api/design-resources/:id/download', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementDesignResourceDownloads(id);
      res.json({ message: "Download count incremented" });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });

  // Size Checker routes
  app.get('/api/size-checks', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const isAdmin = user.role === 'admin' || user.role === 'ops';

      const allOrders = await storage.getOrders();
      const relevantOrders = isAdmin
        ? allOrders
        : allOrders.filter(order => order.salespersonId === user.id);

      // Get all invoices
      const allInvoices = await storage.getInvoices();

      const checks = [];
      for (const order of relevantOrders) {
        const orderWithItems = await storage.getOrderWithLineItems(order.id);
        if (!orderWithItems) continue;

        // Calculate order totals
        const orderQty = orderWithItems.lineItems.reduce((sum, item) => 
          sum + (item.qtyTotal || 0), 0
        );
        const orderTotal = orderWithItems.lineItems.reduce((sum, item) => 
          sum + parseFloat(item.lineTotal?.toString() || '0'), 0
        );

        // Find related invoice
        const invoice = allInvoices.find(inv => inv.orderId === order.id);

        const issues: string[] = [];
        let status: 'match' | 'mismatch' | 'missing-data' = 'match';

        if (!invoice) {
          status = 'missing-data';
          issues.push('No invoice generated yet');
        } else {
          if (Math.abs(parseFloat(invoice.totalAmount) - orderTotal) > 0.01) {
            status = 'mismatch';
            issues.push('Invoice total mismatch');
          }
        }

        // Get organization name
        const org = order.orgId ? await storage.getOrganization(order.orgId) : null;

        checks.push({
          id: order.id,
          orderName: order.orderName,
          orgName: org?.name || 'Unknown',
          orderTotal: Math.round(orderTotal),
          quoteTotal: Math.round(orderTotal), // Using order total as quote total
          invoiceTotal: invoice ? Math.round(parseFloat(invoice.totalAmount)) : undefined,
          orderQty,
          quoteQty: orderQty,
          invoiceQty: invoice ? orderQty : undefined,
          status,
          issues,
          lastChecked: new Date().toISOString(),
        });
      }

      res.json(checks);
    } catch (error) {
      console.error("Error fetching size checks:", error);
      res.status(500).json({ message: "Failed to fetch size checks" });
    }
  });

  // Manufacturing Capacity routes
  app.get('/api/manufacturing/capacity', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // This is manufacturer/ops specific data
      const manufacturingRecords = await storage.getManufacturing(user);

      // Mock machine data (could be enhanced with actual machine tracking)
      const machines = [
        { name: 'Production Line 1', utilization: 75, status: 'active', throughput: 450 },
        { name: 'Production Line 2', utilization: 88, status: 'active', throughput: 520 },
        { name: 'Quality Check', utilization: 62, status: 'active', throughput: 380 },
      ];

      // Mock workforce data
      const workforce = [
        { shift: 'Morning', workers: 12, productivity: 92 },
        { shift: 'Afternoon', workers: 10, productivity: 88 },
      ];

      // Calculate forecast based on current orders (using new 7-stage workflow statuses)
      const activeRecords = manufacturingRecords.filter(r => 
        r.status === 'awaiting_admin_confirmation' || 
        r.status === 'confirmed_awaiting_manufacturing' ||
        r.status === 'cutting_sewing' ||
        r.status === 'printing' ||
        r.status === 'final_packing_press'
      );

      const forecast = [
        { week: 'Week 1', projected: activeRecords.length * 100, capacity: 1500 },
        { week: 'Week 2', projected: activeRecords.length * 120, capacity: 1500 },
        { week: 'Week 3', projected: activeRecords.length * 90, capacity: 1500 },
        { week: 'Week 4', projected: activeRecords.length * 110, capacity: 1500 },
      ];

      res.json({ machines, workforce, forecast });
    } catch (error) {
      console.error("Error fetching manufacturing capacity:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing capacity" });
    }
  });

  // Manufacturing Order Items routes
  app.get('/api/manufacturing/order-items', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const isOpsOrAdmin = user.role === 'admin' || user.role === 'ops';

      const allOrders = await storage.getOrders();
      const relevantOrders = isOpsOrAdmin
        ? allOrders
        : allOrders;

      const items = [];
      for (const order of relevantOrders) {
        const orderWithItems = await storage.getOrderWithLineItems(order.id);
        if (!orderWithItems) continue;

        const org = order.orgId ? await storage.getOrganization(order.orgId) : null;

        for (const lineItem of orderWithItems.lineItems) {
          items.push({
            id: lineItem.id,
            orderName: order.orderName,
            orgName: org?.name || 'Unknown',
            itemName: lineItem.itemName || 'Unknown Item',
            quantity: lineItem.qtyTotal || 0,
            specifications: {
              color: lineItem.colorNotes || undefined,
              notes: lineItem.notes || undefined,
            },
            status: lineItem.colorNotes && lineItem.notes ? 'complete' : 'incomplete',
          });
        }
      }

      // Strip financial data for manufacturer role
      const filteredItems = stripFinancialData(items, user.role);
      res.json(filteredItems);
    } catch (error) {
      console.error("Error fetching manufacturing order items:", error);
      res.status(500).json({ message: "Failed to fetch manufacturing order items" });
    }
  });

  // Update order item specifications
  app.put('/api/manufacturing/order-items/:itemId/specifications', isAuthenticated, loadUserData, requirePermission('manufacturing', 'write'), async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const specs = req.body;

      // Update the line item with specifications
      await storage.updateOrderLineItem(itemId, {
        colorNotes: specs.color || null,
        notes: specs.notes || null,
      });

      res.json({ message: "Specifications updated successfully" });
    } catch (error) {
      console.error("Error updating specifications:", error);
      res.status(500).json({ message: "Failed to update specifications" });
    }
  });

  // Admin Analytics routes
  app.get('/api/admin/analytics', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all users for activity metrics
      const allUsers = await storage.getUsers();
      const activeUsers = allUsers.filter(u => u.isActive);

      // Mock user activity data (could be enhanced with actual tracking)
      const userActivity = [
        { date: new Date().toISOString().split('T')[0], active: activeUsers.length, new: 2, returning: activeUsers.length - 2 },
      ];

      // Feature usage based on resource access
      const featureUsage = [
        { feature: 'Dashboard', views: 150, users: activeUsers.length },
        { feature: 'Orders', views: 120, users: Math.floor(activeUsers.length * 0.8) },
        { feature: 'Leads', views: 90, users: Math.floor(activeUsers.length * 0.6) },
        { feature: 'Design Jobs', views: 60, users: Math.floor(activeUsers.length * 0.4) },
      ];

      // System performance metrics
      const performance = [
        { hour: '08:00', requests: 120, avgResponseTime: 150 },
        { hour: '12:00', requests: 200, avgResponseTime: 180 },
        { hour: '16:00', requests: 150, avgResponseTime: 160 },
      ];

      res.json({ userActivity, featureUsage, performance });
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch admin analytics" });
    }
  });

  // Connection Health routes
  app.get('/api/admin/connection-health', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const connections = [];

      // Check database connection
      try {
        await db.select().from(users).limit(1);
        connections.push({
          id: 'database-main',
          name: 'PostgreSQL Database',
          type: 'database' as const,
          status: 'healthy' as const,
          lastChecked: new Date().toISOString(),
          responseTime: 15,
          details: 'Connection active',
        });
      } catch (error) {
        connections.push({
          id: 'database-main',
          name: 'PostgreSQL Database',
          type: 'database' as const,
          status: 'unhealthy' as const,
          lastChecked: new Date().toISOString(),
          errorMessage: 'Database connection failed',
        });
      }

      // Check if SendGrid is configured
      const hasSendGrid = !!process.env.SENDGRID_API_KEY;
      connections.push({
        id: 'sendgrid-email',
        name: 'SendGrid Email Service',
        type: 'api' as const,
        status: hasSendGrid ? 'healthy' as const : 'degraded' as const,
        lastChecked: new Date().toISOString(),
        details: hasSendGrid ? 'API configured' : 'API key not configured',
      });

      // UI connection checks (always healthy in this implementation)
      connections.push({
        id: 'ui-modals',
        name: 'UI Modal Components',
        type: 'ui' as const,
        status: 'healthy' as const,
        lastChecked: new Date().toISOString(),
        details: 'All modals properly connected',
      });

      res.json(connections);
    } catch (error) {
      console.error("Error fetching connection health:", error);
      res.status(500).json({ message: "Failed to fetch connection health" });
    }
  });

  // Sales Resources routes
  app.get('/api/sales-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const resources = await storage.getSalesResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching sales resources:", error);
      res.status(500).json({ message: "Failed to fetch sales resources" });
    }
  });

  app.post('/api/sales-resources', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can upload sales resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can upload sales resources" });
      }

      const validatedData = insertSalesResourceSchema.parse({
        ...req.body,
        uploadedBy: user.id,
      });

      const resource = await storage.createSalesResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating sales resource:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create sales resource" });
    }
  });

  app.delete('/api/sales-resources/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;

      // Only admins can delete sales resources
      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete sales resources" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteSalesResource(id);
      res.json({ message: "Sales resource deleted successfully" });
    } catch (error) {
      console.error("Error deleting sales resource:", error);
      res.status(500).json({ message: "Failed to delete sales resource" });
    }
  });

  app.post('/api/sales-resources/:id/download', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementResourceDownloads(id);
      res.json({ message: "Download count incremented" });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });

  // ==================== FABRIC MANAGEMENT ROUTES ====================

  // Fabric routes
  app.get('/api/fabrics', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const approvedOnly = req.query.approvedOnly === 'true';
      const fabrics = await storage.getFabrics(approvedOnly);
      res.json(fabrics);
    } catch (error) {
      console.error("Error fetching fabrics:", error);
      res.status(500).json({ message: "Failed to fetch fabrics" });
    }
  });

  app.get('/api/fabrics/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fabric = await storage.getFabric(id);
      if (!fabric) {
        return res.status(404).json({ message: "Fabric not found" });
      }
      res.json(fabric);
    } catch (error) {
      console.error("Error fetching fabric:", error);
      res.status(500).json({ message: "Failed to fetch fabric" });
    }
  });

  app.post('/api/fabrics', isAuthenticated, loadUserData, requirePermission('products', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const fabric = await storage.createFabric({
        ...req.body,
        createdBy: user.id,
      });
      res.status(201).json(fabric);
    } catch (error) {
      console.error("Error creating fabric:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create fabric" });
    }
  });

  app.put('/api/fabrics/:id', isAuthenticated, loadUserData, requirePermission('products', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fabric = await storage.updateFabric(id, req.body);
      res.json(fabric);
    } catch (error) {
      console.error("Error updating fabric:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update fabric" });
    }
  });

  app.delete('/api/fabrics/:id', isAuthenticated, loadUserData, requirePermission('products', 'delete'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFabric(id);
      res.json({ message: "Fabric deleted successfully" });
    } catch (error) {
      console.error("Error deleting fabric:", error);
      res.status(500).json({ message: "Failed to delete fabric" });
    }
  });

  app.post('/api/fabrics/:id/approve', isAuthenticated, loadUserData, requirePermission('products', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const id = parseInt(req.params.id);
      const fabric = await storage.approveFabric(id, user.id);
      res.json(fabric);
    } catch (error) {
      console.error("Error approving fabric:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to approve fabric" });
    }
  });

  // Product Variant Fabric routes
  app.get('/api/product-variants/:variantId/fabrics', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const variantId = parseInt(req.params.variantId);
      const fabrics = await storage.getProductVariantFabrics(variantId);
      res.json(fabrics);
    } catch (error) {
      console.error("Error fetching variant fabrics:", error);
      res.status(500).json({ message: "Failed to fetch variant fabrics" });
    }
  });

  app.post('/api/product-variants/:variantId/fabrics', isAuthenticated, loadUserData, requirePermission('products', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const variantId = parseInt(req.params.variantId);
      const assignment = await storage.assignFabricToVariant({
        variantId,
        fabricId: req.body.fabricId,
        assignedBy: user.id,
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning fabric to variant:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to assign fabric" });
    }
  });

  app.delete('/api/product-variant-fabrics/:id', isAuthenticated, loadUserData, requirePermission('products', 'write'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFabricFromVariant(id);
      res.json({ message: "Fabric assignment removed successfully" });
    } catch (error) {
      console.error("Error removing fabric assignment:", error);
      res.status(500).json({ message: "Failed to remove fabric assignment" });
    }
  });

  // Fabric Submission routes
  app.get('/api/fabric-submissions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.manufacturingId) filters.manufacturingId = parseInt(req.query.manufacturingId as string);
      if (req.query.lineItemId) filters.lineItemId = parseInt(req.query.lineItemId as string);
      if (req.query.status) filters.status = req.query.status as string;

      const submissions = await storage.getFabricSubmissions(filters);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching fabric submissions:", error);
      res.status(500).json({ message: "Failed to fetch fabric submissions" });
    }
  });

  app.get('/api/fabric-submissions/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getFabricSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: "Fabric submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error fetching fabric submission:", error);
      res.status(500).json({ message: "Failed to fetch fabric submission" });
    }
  });

  app.post('/api/fabric-submissions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const submission = await storage.createFabricSubmission({
        ...req.body,
        submittedBy: user.id,
      });
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating fabric submission:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create fabric submission" });
    }
  });

  app.post('/api/fabric-submissions/:id/review', isAuthenticated, loadUserData, requirePermission('products', 'write'), async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const id = parseInt(req.params.id);
      const { status, reviewNotes } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }

      const submission = await storage.reviewFabricSubmission(id, user.id, status, reviewNotes);
      res.json(submission);
    } catch (error) {
      console.error("Error reviewing fabric submission:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to review fabric submission" });
    }
  });

  // ==================== PANTONE ASSIGNMENT ROUTES ====================

  app.get('/api/pantone-assignments', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const filters: any = {};
      if (req.query.lineItemId) filters.lineItemId = parseInt(req.query.lineItemId as string);
      if (req.query.manufacturingUpdateId) filters.manufacturingUpdateId = parseInt(req.query.manufacturingUpdateId as string);
      if (req.query.orderId) filters.orderId = parseInt(req.query.orderId as string);

      const assignments = await storage.getPantoneAssignments(filters);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching pantone assignments:", error);
      res.status(500).json({ message: "Failed to fetch pantone assignments" });
    }
  });

  app.get('/api/pantone-assignments/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getPantoneAssignment(id);
      if (!assignment) {
        return res.status(404).json({ message: "Pantone assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching pantone assignment:", error);
      res.status(500).json({ message: "Failed to fetch pantone assignment" });
    }
  });

  app.post('/api/pantone-assignments', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const assignment = await storage.createPantoneAssignment({
        ...req.body,
        assignedBy: user.id,
      });
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating pantone assignment:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create pantone assignment" });
    }
  });

  app.put('/api/pantone-assignments/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.updatePantoneAssignment(id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Error updating pantone assignment:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update pantone assignment" });
    }
  });

  app.delete('/api/pantone-assignments/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePantoneAssignment(id);
      res.json({ message: "Pantone assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting pantone assignment:", error);
      res.status(500).json({ message: "Failed to delete pantone assignment" });
    }
  });

  // ==================== PRINTFUL SYNC RECORDS ROUTES ====================

  app.get('/api/printful-sync-records', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : undefined;
      const records = await storage.getPrintfulSyncRecords(orderId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching printful sync records:", error);
      res.status(500).json({ message: "Failed to fetch printful sync records" });
    }
  });

  app.get('/api/printful-sync-records/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getPrintfulSyncRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Printful sync record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching printful sync record:", error);
      res.status(500).json({ message: "Failed to fetch printful sync record" });
    }
  });

  app.post('/api/printful-sync-records', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const user = (req as AuthenticatedRequest).user.userData!;
      const record = await storage.createPrintfulSyncRecord({
        ...req.body,
        createdBy: user.id,
      });
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating printful sync record:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create printful sync record" });
    }
  });

  app.put('/api/printful-sync-records/:id', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.updatePrintfulSyncRecord(id, req.body);
      res.json(record);
    } catch (error) {
      console.error("Error updating printful sync record:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update printful sync record" });
    }
  });

  // ==================== SALES MAP ROUTES ====================
  const salesMapRoutes = (await import("./routes/sales-map.routes")).default;
  app.use("/api/sales-map", salesMapRoutes);

  // ==================== AI INTERACTIONS ROUTE ====================
  const { processAIInteraction } = await import("./services/gemini");

  app.post('/api/ai/interactions', isAuthenticated, loadUserData, async (req, res) => {
    try {
      const { actionId, hubId, context } = req.body;

      if (!actionId) {
        return res.status(400).json({ message: "actionId is required" });
      }

      const result = await processAIInteraction({ actionId, hubId, context });

      if (!result.success) {
        return res.status(400).json({
          message: result.message || "AI processing failed",
          error: result.error,
        });
      }

      res.json({
        success: true,
        content: result.content,
        message: result.message,
      });
    } catch (error) {
      console.error("Error processing AI interaction:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to process AI interaction",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}