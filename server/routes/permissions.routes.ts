import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { requirePermission, loadUserData, PERMISSIONS } from "../permissions";
import { insertRolePermissionSchema, insertRoleSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Seed function to populate database with default roles, resources, and permissions
async function seedPermissions() {
  console.log("Starting permissions seed...");
  
  // Define resources with descriptions
  const resourceDefinitions: Array<{name: string; displayName: string; description: string; resourceType: "page" | "modal" | "button" | "feature"}> = [
    { name: "dashboard", displayName: "Dashboard", description: "Main dashboard view", resourceType: "page" },
    { name: "leads", displayName: "Leads", description: "Lead management", resourceType: "page" },
    { name: "organizations", displayName: "Organizations", description: "Organization management", resourceType: "page" },
    { name: "contacts", displayName: "Contacts", description: "Contact management", resourceType: "page" },
    { name: "catalog", displayName: "Catalog", description: "Product catalog management", resourceType: "page" },
    { name: "designJobs", displayName: "Design Jobs", description: "Design job management", resourceType: "page" },
    { name: "orders", displayName: "Orders", description: "Order management", resourceType: "page" },
    { name: "manufacturing", displayName: "Manufacturing", description: "Manufacturing operations", resourceType: "page" },
    { name: "salespeople", displayName: "Salespeople", description: "Sales team management", resourceType: "page" },
    { name: "settings", displayName: "Settings", description: "System settings", resourceType: "page" },
    { name: "users", displayName: "Users", description: "User accounts", resourceType: "page" },
    { name: "designerManagement", displayName: "Designer Management", description: "Designer team management", resourceType: "page" },
    { name: "manufacturerManagement", displayName: "Manufacturer Management", description: "Manufacturer management", resourceType: "page" },
    { name: "userManagement", displayName: "User Management", description: "User and role management", resourceType: "page" },
    { name: "finance", displayName: "Finance", description: "Financial management", resourceType: "page" },
    { name: "quotes", displayName: "Quotes", description: "Quote management", resourceType: "page" },
    { name: "salesAnalytics", displayName: "Sales Analytics", description: "Sales analytics and reports", resourceType: "page" },
    { name: "leadsTracker", displayName: "Leads Tracker", description: "Lead tracking dashboard", resourceType: "page" },
    { name: "designPortfolio", displayName: "Design Portfolio", description: "Design portfolio showcase", resourceType: "page" },
    { name: "designResources", displayName: "Design Resources", description: "Design resources library", resourceType: "page" },
    { name: "sizeChecker", displayName: "Size Checker", description: "Product size checking tool", resourceType: "feature" },
    { name: "capacityDashboard", displayName: "Capacity Dashboard", description: "Production capacity dashboard", resourceType: "page" },
    { name: "orderSpecifications", displayName: "Order Specifications", description: "Order specification management", resourceType: "page" },
    { name: "systemAnalytics", displayName: "System Analytics", description: "System-wide analytics", resourceType: "page" },
    { name: "connectionHealth", displayName: "Connection Health", description: "System connection health monitoring", resourceType: "page" },
    { name: "events", displayName: "Events", description: "Event management", resourceType: "page" },
    { name: "tasks", displayName: "Tasks", description: "Task management", resourceType: "page" },
    { name: "teamStores", displayName: "Team Stores", description: "Team store management", resourceType: "page" },
  ];

  // Define system roles
  const roleDefinitions = [
    { name: "admin", displayName: "Administrator", description: "Full system access", isSystem: true },
    { name: "sales", displayName: "Sales Person", description: "Sales team member", isSystem: true },
    { name: "designer", displayName: "Designer", description: "Design team member", isSystem: true },
    { name: "ops", displayName: "Operations", description: "Operations team member", isSystem: true },
    { name: "manufacturer", displayName: "Manufacturer", description: "Manufacturing partner", isSystem: true },
    { name: "finance", displayName: "Finance", description: "Finance team member", isSystem: true },
  ];

  try {
    // Upsert all resources
    const resourceMap = new Map<string, number>();
    for (const resDef of resourceDefinitions) {
      const existingResource = await storage.getResourceByName(resDef.name);
      if (existingResource) {
        resourceMap.set(resDef.name, existingResource.id);
        console.log(`Resource ${resDef.name} already exists`);
      } else {
        const newResource = await storage.createResource(resDef);
        resourceMap.set(resDef.name, newResource.id);
        console.log(`Created resource: ${resDef.name}`);
      }
    }

    // Upsert all roles
    const roleMap = new Map<string, number>();
    for (const roleDef of roleDefinitions) {
      const roles = await storage.getRoles();
      const existingRole = roles.find(r => r.name === roleDef.name);
      if (existingRole) {
        roleMap.set(roleDef.name, existingRole.id);
        console.log(`Role ${roleDef.name} already exists`);
      } else {
        const newRole = await storage.createRole(roleDef);
        roleMap.set(roleDef.name, newRole.id);
        console.log(`Created role: ${roleDef.name}`);
      }
    }

    // Create permissions from static PERMISSIONS object
    for (const [roleName, rolePermissions] of Object.entries(PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) {
        console.warn(`Role ${roleName} not found in database, skipping...`);
        continue;
      }

      for (const [resourceName, permissions] of Object.entries(rolePermissions)) {
        const resourceId = resourceMap.get(resourceName);
        if (!resourceId) {
          console.warn(`Resource ${resourceName} not found in database, skipping...`);
          continue;
        }

        // Map static permissions to database fields
        const permissionData = {
          canView: 'read' in permissions ? permissions.read : false,
          canCreate: 'write' in permissions ? permissions.write : false,
          canEdit: 'write' in permissions ? permissions.write : false,
          canDelete: 'delete' in permissions ? permissions.delete : false,
          // pageVisible should be true only if viewAll is true (for bulk access)
          // This separates "can see the page/resource" (canView) from "can see ALL records" (pageVisible/viewAll)
          pageVisible: 'viewAll' in permissions ? permissions.viewAll : false,
        };

        await storage.upsertRolePermission(roleId, resourceId, permissionData);
      }
      console.log(`Created permissions for role: ${roleName}`);
    }

    console.log("Permissions seed completed successfully!");
    return { success: true, message: "Permissions seeded successfully" };
  } catch (error) {
    console.error("Error seeding permissions:", error);
    throw error;
  }
}

export function registerPermissionRoutes(app: Express) {
  // POST /api/permissions/seed - Seed database with default permissions (admin only)
  app.post('/api/permissions/seed', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const result = await seedPermissions();
      
      // Clear the resource cache to force reload
      const { clearResourceCache } = await import("../permissions");
      clearResourceCache();
      
      res.json(result);
    } catch (error) {
      console.error("Error seeding permissions:", error);
      res.status(500).json({ message: "Failed to seed permissions" });
    }
  });
  // GET /api/permissions/user-permissions - Get all permissions data for current user
  app.get('/api/permissions/user-permissions', isAuthenticated, async (req, res) => {
    try {
      const [permissions, roles, resources] = await Promise.all([
        storage.getAllRolePermissions(),
        storage.getRoles(),
        storage.getResources()
      ]);

      res.json({
        permissions,
        roles,
        resources
      });
    } catch (error) {
      console.error("Error fetching permissions data:", error);
      res.status(500).json({ message: "Failed to fetch permissions data" });
    }
  });

  // GET /api/permissions/roles - Get all roles (admin only)
  app.get('/api/permissions/roles', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // GET /api/permissions/resources - Get all resources (admin only)
  app.get('/api/permissions/resources', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // GET /api/permissions - Get all role permissions (admin only)
  app.get('/api/permissions', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const permissions = await storage.getAllRolePermissions();
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // POST /api/permissions/bulk-update - Update multiple permissions at once (admin only)
  app.post('/api/permissions/bulk-update', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({ message: "Updates must be an array" });
      }

      // Define schema for bulk update request
      const bulkUpdateSchema = z.object({
        roleId: z.number().int().positive("Role ID must be a positive integer"),
        resourceId: z.number().int().positive("Resource ID must be a positive integer"),
        permissions: z.object({
          canView: z.boolean(),
          canCreate: z.boolean(),
          canEdit: z.boolean(),
          canDelete: z.boolean(),
          pageVisible: z.boolean(),
        }),
      });

      // Validate each update
      const validatedUpdates = [];
      for (let i = 0; i < updates.length; i++) {
        try {
          const validated = bulkUpdateSchema.parse(updates[i]);
          validatedUpdates.push(validated);
        } catch (error: any) {
          const validationError = fromZodError(error);
          return res.status(400).json({ 
            message: `Invalid update at index ${i}: ${validationError.message}`,
            errors: error.errors 
          });
        }
      }

      // Update each permission using upsert
      const results = await Promise.all(
        validatedUpdates.map((update) => {
          const { roleId, resourceId, permissions } = update;
          return storage.upsertRolePermission(roleId, resourceId, permissions);
        })
      );

      // Clear the resource cache to force reload of updated permissions
      const { clearResourceCache } = await import("../permissions");
      clearResourceCache();

      res.json({ 
        message: "Permissions updated successfully", 
        updated: results.length 
      });
    } catch (error) {
      console.error("Error updating permissions:", error);
      res.status(500).json({ message: "Failed to update permissions" });
    }
  });

  // POST /api/permissions/roles - Create a new role (admin only)
  app.post('/api/permissions/roles', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      
      const newRole = await storage.createRole(validatedData);

      // If copyFromRoleId is provided, copy permissions from that role
      if (req.body.copyFromRoleId) {
        const sourcePermissions = await storage.getRolePermissions(req.body.copyFromRoleId);
        await Promise.all(
          sourcePermissions.map(perm => 
            storage.createRolePermission({
              roleId: newRole.id,
              resourceId: perm.resourceId,
              canView: perm.canView,
              canCreate: perm.canCreate,
              canEdit: perm.canEdit,
              canDelete: perm.canDelete,
              pageVisible: perm.pageVisible,
            })
          )
        );
      }

      res.status(201).json(newRole);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message, errors: error.errors });
      }
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  // GET /api/permissions/roles/:id - Get a single role with its permissions (admin only)
  app.get('/api/permissions/roles/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'read'), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: "Invalid role ID" });
      }

      const [role, permissions] = await Promise.all([
        storage.getRole(roleId),
        storage.getRolePermissions(roleId)
      ]);

      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json({ ...role, permissions });
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ message: "Failed to fetch role" });
    }
  });

  // PUT /api/permissions/roles/:id - Update a role (admin only)
  app.put('/api/permissions/roles/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: "Invalid role ID" });
      }

      const validatedData = insertRoleSchema.partial().parse(req.body);
      const updatedRole = await storage.updateRole(roleId, validatedData);

      if (!updatedRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      res.json(updatedRole);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message, errors: error.errors });
      }
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // DELETE /api/permissions/roles/:id - Delete a role (admin only)
  app.delete('/api/permissions/roles/:id', isAuthenticated, loadUserData, requirePermission('userManagement', 'write'), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ message: "Invalid role ID" });
      }

      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Prevent deletion of system roles
      if (role.isSystem) {
        return res.status(403).json({ message: "Cannot delete system role" });
      }

      await storage.deleteRole(roleId);
      res.json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });
}
