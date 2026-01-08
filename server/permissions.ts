import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

// Define permission structure for each role
export const PERMISSIONS = {
  admin: {
    // Full access to everything
    dashboard: { read: true, write: true },
    leads: { read: true, write: true, delete: true, viewAll: true },
    organizations: { read: true, write: true, delete: true },
    contacts: { read: true, write: true, delete: true },
    catalog: { read: true, write: true, delete: true },
    designJobs: { read: true, write: true, delete: true, viewAll: true },
    orders: { read: true, write: true, delete: true, viewAll: true },
    manufacturing: { read: true, write: true, delete: true, viewAll: true },
    salespeople: { read: true, write: true, delete: true },
    settings: { read: true, write: true },
    users: { read: true, write: true, delete: true },
    designerManagement: { read: true, write: true, delete: true, viewAll: true },
    manufacturerManagement: { read: true, write: true, delete: true, viewAll: true },
    userManagement: { read: true, write: true, delete: true, viewAll: true },
    finance: { read: true, write: true, delete: false, viewAll: true },
    quotes: { read: true, write: true, delete: true, viewAll: true },
    salesAnalytics: { read: true, write: false, delete: false, viewAll: true },
    leadsTracker: { read: true, write: true, delete: false, viewAll: true },
    designPortfolio: { read: true, write: false, delete: false, viewAll: true },
    designResources: { read: true, write: true, delete: false, viewAll: true },
    sizeChecker: { read: true, write: true, delete: false, viewAll: true },
    capacityDashboard: { read: true, write: false, delete: false, viewAll: true },
    orderSpecifications: { read: true, write: true, delete: false, viewAll: true },
    systemAnalytics: { read: true, write: false, delete: false, viewAll: true },
    connectionHealth: { read: true, write: false, delete: false, viewAll: true },
    events: { read: true, write: true, delete: true, viewAll: true },
    tasks: { read: true, write: true, delete: true, viewAll: true },
  },
  sales: {
    // Sales-specific permissions
    dashboard: { read: true, write: false },
    leads: { read: true, write: true, delete: false, viewAll: false }, // Own leads only
    organizations: { read: true, write: true, delete: false },
    contacts: { read: true, write: true, delete: false },
    catalog: { read: true, write: false, delete: false },
    designJobs: { read: true, write: true, delete: false, viewAll: false }, // Can request
    orders: { read: true, write: true, delete: false, viewAll: false }, // Own orders only
    manufacturing: { read: false, write: false, delete: false, viewAll: false }, // No manufacturing access
    salespeople: { read: true, write: false, delete: false }, // Can read own workflow data
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: false, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: false, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: false, write: false, delete: false, viewAll: false }, // No finance page access
    quotes: { read: true, write: true, delete: false, viewAll: false }, // Own quotes only
    salesAnalytics: { read: true, write: false, delete: false, viewAll: false },
    leadsTracker: { read: true, write: true, delete: false, viewAll: false },
    designPortfolio: { read: false, write: false, delete: false, viewAll: false },
    designResources: { read: false, write: false, delete: false, viewAll: false },
    sizeChecker: { read: false, write: false, delete: false, viewAll: false },
    capacityDashboard: { read: false, write: false, delete: false, viewAll: false },
    orderSpecifications: { read: false, write: false, delete: false, viewAll: false },
    systemAnalytics: { read: false, write: false, delete: false, viewAll: false },
    connectionHealth: { read: false, write: false, delete: false, viewAll: false },
    events: { read: true, write: true, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: false },
  },
  designer: {
    // Designer-specific permissions
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false }, // Read-only for context
    contacts: { read: true, write: false, delete: false }, // Read-only for context
    catalog: { read: true, write: false, delete: false },
    designJobs: { read: true, write: true, delete: false, viewAll: false }, // Assigned only
    orders: { read: true, write: false, delete: false, viewAll: false }, // Read-only for context
    manufacturing: { read: false, write: false, delete: false, viewAll: false },
    salespeople: { read: false, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: true, write: false, delete: false, viewAll: false }, // Can see other designers
    manufacturerManagement: { read: false, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: false, write: false, delete: false, viewAll: false },
    quotes: { read: false, write: false, delete: false, viewAll: false },
    salesAnalytics: { read: false, write: false, delete: false, viewAll: false },
    leadsTracker: { read: false, write: false, delete: false, viewAll: false },
    designPortfolio: { read: true, write: true, delete: false, viewAll: true },
    designResources: { read: true, write: false, delete: false, viewAll: true },
    sizeChecker: { read: false, write: false, delete: false, viewAll: false },
    capacityDashboard: { read: false, write: false, delete: false, viewAll: false },
    orderSpecifications: { read: false, write: false, delete: false, viewAll: false },
    systemAnalytics: { read: false, write: false, delete: false, viewAll: false },
    connectionHealth: { read: false, write: false, delete: false, viewAll: false },
    events: { read: false, write: false, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: false },
  },
  ops: {
    // Operations-specific permissions
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false }, // Can't create/delete orgs
    contacts: { read: true, write: false, delete: false },
    catalog: { read: true, write: true, delete: true }, // Can manage products
    designJobs: { read: true, write: true, delete: false, viewAll: true }, // Can manage assignments
    orders: { read: true, write: true, delete: false, viewAll: true }, // Manage all orders
    manufacturing: { read: true, write: true, delete: false, viewAll: true }, // Manage manufacturing
    salespeople: { read: true, write: false, delete: false }, // Can view sales team
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: true, write: false, delete: false, viewAll: true }, // Can see designers
    manufacturerManagement: { read: true, write: true, delete: false, viewAll: true }, // Can manage manufacturers
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: true, write: false, delete: false, viewAll: true }, // Can see financial data
    quotes: { read: true, write: false, delete: false, viewAll: true }, // Can see all quotes
    salesAnalytics: { read: false, write: false, delete: false, viewAll: false },
    leadsTracker: { read: false, write: false, delete: false, viewAll: false },
    designPortfolio: { read: false, write: false, delete: false, viewAll: false },
    designResources: { read: false, write: false, delete: false, viewAll: false },
    sizeChecker: { read: true, write: true, delete: false, viewAll: true },
    capacityDashboard: { read: false, write: false, delete: false, viewAll: false },
    orderSpecifications: { read: false, write: false, delete: false, viewAll: false },
    systemAnalytics: { read: false, write: false, delete: false, viewAll: false },
    connectionHealth: { read: false, write: false, delete: false, viewAll: false },
    events: { read: true, write: true, delete: false, viewAll: true },
    tasks: { read: true, write: true, delete: false, viewAll: true },
  },
  manufacturer: {
    // Manufacturer-specific permissions
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false },
    contacts: { read: true, write: false, delete: false },
    catalog: { read: true, write: false, delete: false }, // View products only
    designJobs: { read: false, write: false, delete: false, viewAll: false },
    orders: { read: true, write: false, delete: false, viewAll: false }, // Limited view
    manufacturing: { read: true, write: true, delete: false, viewAll: false }, // Own facility only
    salespeople: { read: false, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: false, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: true, write: false, delete: false, viewAll: false }, // Can see their own company
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: false, write: false, delete: false, viewAll: false },
    quotes: { read: false, write: false, delete: false, viewAll: false },
    salesAnalytics: { read: false, write: false, delete: false, viewAll: false },
    leadsTracker: { read: false, write: false, delete: false, viewAll: false },
    designPortfolio: { read: false, write: false, delete: false, viewAll: false },
    designResources: { read: false, write: false, delete: false, viewAll: false },
    sizeChecker: { read: false, write: false, delete: false, viewAll: false },
    capacityDashboard: { read: true, write: false, delete: false, viewAll: false },
    orderSpecifications: { read: true, write: true, delete: false, viewAll: false },
    systemAnalytics: { read: false, write: false, delete: false, viewAll: false },
    connectionHealth: { read: false, write: false, delete: false, viewAll: false },
    events: { read: false, write: false, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: false },
  },
  finance: {
    // Finance-specific permissions
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false }, // Can view orgs for invoices
    contacts: { read: true, write: false, delete: false }, // Can view contacts
    catalog: { read: true, write: false, delete: false }, // Can view products/pricing
    designJobs: { read: false, write: false, delete: false, viewAll: false },
    orders: { read: true, write: false, delete: false, viewAll: true }, // Can view all orders for invoicing
    manufacturing: { read: false, write: false, delete: false, viewAll: false },
    salespeople: { read: true, write: false, delete: false }, // Can view sales data for commissions
    settings: { read: false, write: false },
    users: { read: true, write: false, delete: false }, // Can view users for reports
    designerManagement: { read: false, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: false, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: true, write: true, delete: false, viewAll: true }, // Full access to finance
    quotes: { read: true, write: true, delete: false, viewAll: true }, // Can create/edit quotes for billing
    salesAnalytics: { read: true, write: false, delete: false, viewAll: true }, // Can view sales analytics
    leadsTracker: { read: false, write: false, delete: false, viewAll: false },
    designPortfolio: { read: false, write: false, delete: false, viewAll: false },
    designResources: { read: false, write: false, delete: false, viewAll: false },
    sizeChecker: { read: false, write: false, delete: false, viewAll: false },
    capacityDashboard: { read: false, write: false, delete: false, viewAll: false },
    orderSpecifications: { read: false, write: false, delete: false, viewAll: false },
    systemAnalytics: { read: true, write: false, delete: false, viewAll: true }, // Can view system analytics
    connectionHealth: { read: false, write: false, delete: false, viewAll: false },
    events: { read: true, write: false, delete: false, viewAll: true },
    tasks: { read: true, write: true, delete: false, viewAll: true },
  },
};

// Type definitions
export type UserRole = keyof typeof PERMISSIONS;
export type Resource = keyof typeof PERMISSIONS.admin;
export type Permission = "read" | "write" | "delete" | "viewAll";

// Extended request type with user
export interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    };
    userData?: User;
  };
}

// Translation layer between legacy permissions and database fields
export function translatePermissionToDb(permission: Permission, dbPermissions: {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  pageVisible: boolean;
}): boolean {
  switch (permission) {
    case 'read':
      // Read requires canView
      return dbPermissions.canView;
    case 'write':
      // Write requires either canCreate OR canEdit
      return dbPermissions.canCreate || dbPermissions.canEdit;
    case 'delete':
      // Delete maps directly
      return dbPermissions.canDelete;
    case 'viewAll':
      // viewAll maps directly to pageVisible
      // pageVisible controls whether user can see ALL records (not just their own)
      // This is separate from canView which controls access to the resource itself
      return dbPermissions.pageVisible;
    default:
      return false;
  }
}

// Map static permission structure to database permission fields
export function mapStaticToDbPermissions(staticPerms: {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  viewAll?: boolean;
}): {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  pageVisible: boolean;
} {
  return {
    canView: staticPerms.read || false,
    canCreate: staticPerms.write || false,
    canEdit: staticPerms.write || false,
    canDelete: staticPerms.delete || false,
    // pageVisible maps to viewAll - controls whether user can see ALL records
    pageVisible: staticPerms.viewAll || false,
  };
}

// Check if user has specific permission (synchronous role-only check)
export function hasPermission(
  role: UserRole,
  resource: Resource,
  permission: Permission
): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions[permission as keyof typeof resourcePermissions] === true;
}

// Check permission with user-specific overrides (async, database-first approach)
export async function hasPermissionWithOverrides(
  userId: string,
  role: UserRole | string, // Allow string for custom roles not in static PERMISSIONS
  resource: Resource | string, // Allow string for custom resources
  permission: Permission
): Promise<boolean> {
  try {
    // Import storage to avoid circular dependency
    const { storage } = await import("./storage");
    
    // First, check for user-specific permission overrides
    const userPermissions = await storage.getUserPermissions(userId);
    
    // Try to find resource by name
    let resourceId: number | undefined;
    const dbResource = await storage.getResourceByName(resource as string);
    if (dbResource) {
      resourceId = dbResource.id;
      
      // Check user override first (highest priority)
      const userOverride = userPermissions.find(p => p.resourceId === resourceId);
      if (userOverride) {
        return translatePermissionToDb(permission, {
          canView: userOverride.canView ?? false,
          canCreate: userOverride.canCreate ?? false,
          canEdit: userOverride.canEdit ?? false,
          canDelete: userOverride.canDelete ?? false,
          pageVisible: userOverride.pageVisible ?? false,
        });
      }
    }
    
    // If no user override, check role permissions
    const roles = await storage.getRoles();
    const dbRole = roles.find(r => r.name === role);
    
    if (dbRole && resourceId) {
      // Get role permissions from database
      const rolePermissions = await storage.getRolePermissions(dbRole.id);
      const rolePermission = rolePermissions.find(p => p.resourceId === resourceId);
      
      if (rolePermission) {
        // Use database role permission with proper translation
        return translatePermissionToDb(permission, {
          canView: rolePermission.canView ?? false,
          canCreate: rolePermission.canCreate ?? false,
          canEdit: rolePermission.canEdit ?? false,
          canDelete: rolePermission.canDelete ?? false,
          pageVisible: rolePermission.pageVisible ?? false,
        });
      }
    }
    
    // If role or resource not found in database, fall back to static permissions
    // This is only for system roles that should always work
    if (role in PERMISSIONS && resource in PERMISSIONS.admin) {
      console.warn(`Using static fallback for role ${role}, resource ${resource}. Consider seeding the database.`);
      return hasPermission(role as UserRole, resource as Resource, permission);
    }
    
    // No permission found anywhere, deny access
    console.warn(`Permission check failed: role=${role}, resource=${resource}, permission=${permission}. No database or static permission found.`);
    return false;
  } catch (error) {
    console.error("Error checking permissions from database:", error);
    
    // Emergency fallback to static permissions only for known system roles
    if (role in PERMISSIONS && resource in PERMISSIONS.admin) {
      console.error(`Emergency fallback to static permissions for role ${role}, resource ${resource}`);
      return hasPermission(role as UserRole, resource as Resource, permission);
    }
    
    // Deny access on error for custom roles
    return false;
  }
}

// Cache for resource IDs (to avoid repeated database queries)
let resourceIdCache: Map<string, number> | null = null;
let resourceIdCachePromise: Promise<void> | null = null;

// Function to clear the resource cache (call this when permissions are updated)
export function clearResourceCache() {
  resourceIdCache = null;
  resourceIdCachePromise = null;
}

// Helper to get resource ID by name from database
async function getResourceId(resourceName: Resource): Promise<number> {
  try {
    // Initialize cache if needed
    if (!resourceIdCache) {
      // If another request is already loading, wait for it
      if (!resourceIdCachePromise) {
        resourceIdCachePromise = (async () => {
          try {
            // Load all resources from database
            const { storage } = await import("./storage");
            const resources = await storage.getResources();
            
            // Create and populate cache
            const cache = new Map<string, number>();
            for (const resource of resources) {
              cache.set(resource.name, resource.id);
            }
            
            // Assign cache only after it's fully populated
            resourceIdCache = cache;
            // Clear promise after successful load to allow future retries if needed
            resourceIdCachePromise = null;
          } catch (error) {
            // Reset promise on error to allow retry
            resourceIdCachePromise = null;
            throw error;
          }
        })();
      }
      
      // Wait for cache to be populated
      await resourceIdCachePromise;
    }
    
    // Return cached ID (cache is guaranteed to be populated now or error was thrown)
    return resourceIdCache?.get(resourceName) || 0;
  } catch (error) {
    console.error("Error getting resource ID:", error);
    return 0;
  }
}

// Check if user can access a resource at all
export function canAccess(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, "read");
}

// Check if user can modify a resource
export function canModify(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, "write");
}

// Check if user can delete from a resource
export function canDelete(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, "delete");
}

// Check if user can view all records (not just their own)
export function canViewAll(role: UserRole, resource: Resource): boolean {
  return hasPermission(role, resource, "viewAll");
}

// Middleware to check permissions with user-specific overrides (database-driven)
export function requirePermission(resource: Resource | string, permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user role from database
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user?.userData?.role) {
        return res.status(403).json({ 
          message: "Access denied: User role not found" 
        });
      }

      const userRole = authReq.user.userData.role; // Can be any string (custom role)
      const userId = authReq.user.userData.id;
      
      // Check permission with user-specific overrides (database-first)
      const hasAccess = await hasPermissionWithOverrides(userId, userRole, resource, permission);
      
      if (!hasAccess) {
        console.log(`Permission denied for user ${userId} with role ${userRole} trying to ${permission} on ${resource}`);
        return res.status(403).json({ 
          message: `Access denied: Insufficient permissions for ${resource}` 
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

// Middleware to check multiple permission alternatives (OR logic) with user overrides
export function requirePermissionOr(...permissionChecks: Array<{ resource: Resource | string; permission: Permission }>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user role from database
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user?.userData?.role) {
        return res.status(403).json({ 
          message: "Access denied: User role not found" 
        });
      }

      const userRole = authReq.user.userData.role; // Can be any string (custom role)
      const userId = authReq.user.userData.id;
      
      // Check if user has any of the required permissions (with overrides)
      const hasAnyPermission = await Promise.all(
        permissionChecks.map(check => 
          hasPermissionWithOverrides(userId, userRole, check.resource, check.permission)
        )
      ).then(results => results.some(hasAccess => hasAccess));
      
      if (!hasAnyPermission) {
        const permissionStrings = permissionChecks.map(check => `${check.permission} on ${check.resource}`).join(' OR ');
        console.log(`Permission denied for user ${userId} with role ${userRole} - requires: ${permissionStrings}`);
        return res.status(403).json({ 
          message: `Access denied: Insufficient permissions` 
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

// Middleware to load user data and attach to request
export async function loadUserData(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Import storage here to avoid circular dependency
    const { storage } = await import("./storage");
    const userData = await storage.getUser(authReq.user.claims.sub);
    
    if (!userData) {
      return res.status(401).json({ message: "User not found" });
    }
    
    if (!userData.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }
    
    // Attach user data to request
    authReq.user.userData = userData;
    next();
  } catch (error) {
    console.error("Error loading user data:", error);
    res.status(500).json({ message: "Failed to load user data" });
  }
}

// Helper to filter data based on user permissions
export function filterDataByRole(
  data: any[],
  userRole: UserRole,
  userId: string,
  resource: Resource
): any[] {
  // Admin sees everything
  if (userRole === "admin") {
    return data;
  }
  
  // Check if user can view all records
  if (canViewAll(userRole, resource)) {
    return data;
  }
  
  // Filter based on ownership or assignment
  switch (resource) {
    case "leads":
      if (userRole === "sales") {
        return data.filter((item) => item.ownerUserId === userId);
      }
      break;
      
    case "orders":
      if (userRole === "sales") {
        return data.filter((item) => item.salespersonId === userId || item.salespersonId === null);
      }
      break;
      
    case "designJobs":
      if (userRole === "sales") {
        return data.filter((item) => item.salespersonId === userId || item.salespersonId === null);
      }
      if (userRole === "designer") {
        return data.filter((item) => item.assignedDesignerId === userId);
      }
      break;
      
    case "manufacturing":
      if (userRole === "manufacturer") {
        // Filter by manufacturer's facility (would need manufacturerId on user)
        return data.filter((item) => item.manufacturerId === userId);
      }
      break;
  }
  
  // Default: return data as-is if no specific filter applies
  return data;
}

// Get accessible navigation items for a role
export function getAccessibleNavItems(role: UserRole): string[] {
  const accessibleItems: string[] = ["dashboard"]; // Everyone can see dashboard
  
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return accessibleItems;
  
  // Map resources to navigation paths
  const resourceToPath: Record<string, string> = {
    leads: "/leads",
    organizations: "/organizations",
    catalog: "/catalog",
    designJobs: "/design-jobs",
    orders: "/orders",
    manufacturing: "/manufacturing",
    salespeople: "/salespeople",
    settings: "/settings",
    salesAnalytics: "/sales-analytics",
    leadsTracker: "/sales-tracker",
    designPortfolio: "/design-portfolio",
    designResources: "/design-resources",
    sizeChecker: "/size-checker",
    capacityDashboard: "/capacity-dashboard",
    orderSpecifications: "/order-specifications",
    systemAnalytics: "/system-analytics",
    connectionHealth: "/connection-health",
  };
  
  for (const [resource, permissions] of Object.entries(rolePermissions)) {
    if (permissions.read && resourceToPath[resource]) {
      accessibleItems.push(resourceToPath[resource]);
    }
  }
  
  return accessibleItems;
}