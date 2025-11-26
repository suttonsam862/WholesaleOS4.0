import { PERMISSIONS, type UserRole, type Resource as PermResource } from "./permissions";
import type { IStorage } from "./storage";

export async function seedPermissions(storage: IStorage): Promise<void> {
  console.log("🌱 Starting permission seeding...");

  // Step 1: Seed Roles
  const roleMap = new Map<string, number>();
  const roles: { name: string; displayName: string; description: string }[] = [
    { name: "admin", displayName: "Administrator", description: "Full system access with all permissions" },
    { name: "sales", displayName: "Sales Person", description: "Manage leads, orders, and quotes" },
    { name: "designer", displayName: "Designer", description: "Manage design jobs and assets" },
    { name: "ops", displayName: "Operations", description: "Manage operations, manufacturing, and fulfillment" },
    { name: "manufacturer", displayName: "Manufacturer", description: "Manage manufacturing processes" },
    { name: "finance", displayName: "Finance", description: "Manage financial operations and invoicing" },
  ];

  for (const roleData of roles) {
    const existing = await storage.getRoleByName(roleData.name);
    if (existing) {
      roleMap.set(roleData.name, existing.id);
      console.log(`  ✓ Role '${roleData.name}' already exists (ID: ${existing.id})`);
    } else {
      const role = await storage.createRole(roleData);
      roleMap.set(roleData.name, role.id);
      console.log(`  ✓ Created role '${roleData.name}' (ID: ${role.id})`);
    }
  }

  // Step 2: Seed Resources (pages/features)
  const resourceMap = new Map<string, number>();
  const resources = [
    { name: "dashboard", displayName: "Dashboard", description: "Main dashboard view", resourceType: "page" as const, path: "/" },
    { name: "leads", displayName: "Leads", description: "Lead management", resourceType: "page" as const, path: "/leads" },
    { name: "organizations", displayName: "Organizations", description: "Organization management", resourceType: "page" as const, path: "/organizations" },
    { name: "contacts", displayName: "Contacts", description: "Contact management", resourceType: "feature" as const, path: null },
    { name: "catalog", displayName: "Catalog", description: "Product catalog", resourceType: "page" as const, path: "/catalog" },
    { name: "designJobs", displayName: "Design Jobs", description: "Design job management", resourceType: "page" as const, path: "/design-jobs" },
    { name: "orders", displayName: "Orders", description: "Order management", resourceType: "page" as const, path: "/orders" },
    { name: "manufacturing", displayName: "Manufacturing", description: "Manufacturing operations", resourceType: "page" as const, path: "/manufacturing" },
    { name: "salespeople", displayName: "Salespeople", description: "Salesperson management", resourceType: "page" as const, path: "/salespeople" },
    { name: "settings", displayName: "Settings", description: "System settings", resourceType: "page" as const, path: "/settings" },
    { name: "users", displayName: "Users", description: "User management", resourceType: "feature" as const, path: null },
    { name: "designerManagement", displayName: "Designer Management", description: "Designer workflow management", resourceType: "page" as const, path: "/designer-management" },
    { name: "manufacturerManagement", displayName: "Manufacturer Management", description: "Manufacturer management", resourceType: "page" as const, path: "/manufacturer-management" },
    { name: "userManagement", displayName: "User Management", resourceType: "page" as const, path: "/user-management" },
    { name: "finance", displayName: "Finance", description: "Financial management", resourceType: "page" as const, path: "/finance" },
    { name: "quotes", displayName: "Quotes", description: "Quote management", resourceType: "page" as const, path: "/quotes" },
    { name: "salesAnalytics", displayName: "Sales Analytics", description: "Sales performance analytics", resourceType: "page" as const, path: "/sales-analytics" },
    { name: "leadsTracker", displayName: "Sales Tracker", description: "Sales tracking and pipeline", resourceType: "page" as const, path: "/sales-tracker" },
    { name: "designPortfolio", displayName: "Design Portfolio", description: "Design portfolio showcase", resourceType: "page" as const, path: "/design-portfolio" },
    { name: "designResources", displayName: "Design Resources", description: "Design resources and assets", resourceType: "page" as const, path: "/design-resources" },
    { name: "sizeChecker", displayName: "Size Checker", description: "Size validation tool", resourceType: "feature" as const, path: null },
    { name: "capacityDashboard", displayName: "Capacity Dashboard", description: "Manufacturing capacity overview", resourceType: "page" as const, path: "/capacity-dashboard" },
    { name: "orderSpecifications", displayName: "Order Specifications", description: "Order specification details", resourceType: "page" as const, path: "/order-specifications" },
    { name: "systemAnalytics", displayName: "System Analytics", description: "System-wide analytics", resourceType: "page" as const, path: "/system-analytics" },
    { name: "connectionHealth", displayName: "Connection Health", description: "System connection monitoring", resourceType: "page" as const, path: "/connection-health" },
    { name: "events", displayName: "Events", description: "Event management system", resourceType: "page" as const, path: "/events" },
    { name: "tasks", displayName: "Tasks", description: "Task management system", resourceType: "page" as const, path: "/tasks" },
  ];

  for (const resourceData of resources) {
    const existing = await storage.getResourceByName(resourceData.name);
    if (existing) {
      // Update existing resource to ensure metadata is current
      const needsUpdate = 
        existing.displayName !== resourceData.displayName ||
        existing.resourceType !== resourceData.resourceType ||
        existing.description !== resourceData.description ||
        existing.path !== resourceData.path;
      
      if (needsUpdate) {
        await storage.updateResource(existing.id, resourceData);
        console.log(`  ✓ Updated resource '${resourceData.name}' (ID: ${existing.id})`);
      } else {
        console.log(`  ✓ Resource '${resourceData.name}' already up to date (ID: ${existing.id})`);
      }
      resourceMap.set(resourceData.name, existing.id);
    } else {
      const resource = await storage.createResource(resourceData);
      resourceMap.set(resourceData.name, resource.id);
      console.log(`  ✓ Created resource '${resourceData.name}' (ID: ${resource.id})`);
    }
  }

  // Step 3: Seed Role Permissions
  let permissionCount = 0;
  for (const [roleName, permissions] of Object.entries(PERMISSIONS)) {
    const roleId = roleMap.get(roleName);
    if (!roleId) {
      console.log(`  ⚠ Skipping permissions for unknown role: ${roleName}`);
      continue;
    }

    for (const [resourceName, perms] of Object.entries(permissions)) {
      const resourceId = resourceMap.get(resourceName);
      if (!resourceId) {
        console.log(`  ⚠ Skipping permission for unknown resource: ${resourceName}`);
        continue;
      }

      await storage.upsertRolePermission(roleId, resourceId, {
        canView: perms.read,
        canCreate: perms.write,
        canEdit: perms.write,
        canDelete: (perms as any).delete || false,
        pageVisible: perms.read, // Set page visibility based on read permission
      });
      permissionCount++;
    }
    console.log(`  ✓ Set permissions for role '${roleName}'`);
  }

  // Explicitly set permissions for salespeople resource based on role
  const salespeopleResourceId = resourceMap.get("salespeople");
  if (salespeopleResourceId) {
    // Admin role gets full access to salespeople management
    const adminRoleId = roleMap.get("admin");
    if (adminRoleId) {
      await storage.upsertRolePermission(adminRoleId, salespeopleResourceId, { canView: true, canCreate: true, canEdit: true, canDelete: true, pageVisible: true });
    }

    // Sales role can view salespeople but not manage them directly
    const salesRoleId = roleMap.get("sales");
    if (salesRoleId) {
      await storage.upsertRolePermission(salesRoleId, salespeopleResourceId, { canView: true, canCreate: false, canEdit: false, canDelete: false, pageVisible: true });
    }

    // Ops role can view salespeople but not manage them directly
    const opsRoleId = roleMap.get("ops");
    if (opsRoleId) {
      await storage.upsertRolePermission(opsRoleId, salespeopleResourceId, { canView: true, canCreate: false, canEdit: false, canDelete: false, pageVisible: true });
    }
  }


  console.log(`🌱 Permission seeding completed! Created/updated ${permissionCount} permissions.`);
}