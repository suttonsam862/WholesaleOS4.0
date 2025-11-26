import type { User } from "@shared/schema";

// Frontend-safe User type that excludes passwordHash
type FrontendUser = Omit<User, 'passwordHash'>;

// Mirror the server-side permissions structure
export const PERMISSIONS = {
  admin: {
    dashboard: { read: true, write: true },
    leads: { read: true, write: true, delete: true, viewAll: true },
    organizations: { read: true, write: true, delete: true },
    contacts: { read: true, write: true, delete: true },
    catalog: { read: true, write: true, delete: true },
    designJobs: { read: true, write: true, delete: true, viewAll: true },
    orders: { read: true, write: true, delete: true, viewAll: true },
    manufacturing: { read: true, write: true, delete: true, viewAll: true },
    teamStores: { read: true, write: true, delete: true, viewAll: true },
    salespeople: { read: true, write: true, delete: true },
    settings: { read: true, write: true },
    users: { read: true, write: true, delete: true },
    designerManagement: { read: true, write: true, delete: true, viewAll: true },
    manufacturerManagement: { read: true, write: true, delete: true, viewAll: true },
    userManagement: { read: true, write: true, delete: true, viewAll: true },
    finance: { read: true, write: true, delete: false, viewAll: true },
    quotes: { read: true, write: true, delete: true, viewAll: true },
    events: { read: true, write: true, delete: true, viewAll: true },
    tasks: { read: true, write: true, delete: true, viewAll: true },
  },
  sales: {
    dashboard: { read: true, write: false },
    leads: { read: true, write: true, delete: false, viewAll: false },
    organizations: { read: true, write: true, delete: false },
    contacts: { read: true, write: true, delete: false },
    catalog: { read: true, write: false, delete: false },
    designJobs: { read: true, write: true, delete: false, viewAll: false },
    orders: { read: true, write: true, delete: false, viewAll: false },
    manufacturing: { read: false, write: false, delete: false, viewAll: false },
    teamStores: { read: true, write: true, delete: false, viewAll: false },
    salespeople: { read: true, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: false, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: false, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: false, write: false, delete: false, viewAll: false },
    quotes: { read: true, write: true, delete: false, viewAll: false },
    events: { read: true, write: true, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: false },
  },
  designer: {
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false },
    contacts: { read: true, write: false, delete: false },
    catalog: { read: true, write: false, delete: false },
    designJobs: { read: true, write: true, delete: false, viewAll: false },
    orders: { read: true, write: false, delete: false, viewAll: false },
    manufacturing: { read: false, write: false, delete: false, viewAll: false },
    teamStores: { read: false, write: false, delete: false, viewAll: false },
    salespeople: { read: false, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: true, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: false, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: false, write: false, delete: false, viewAll: false },
    quotes: { read: false, write: false, delete: false, viewAll: false },
    events: { read: false, write: false, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: false },
  },
  ops: {
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false },
    contacts: { read: true, write: false, delete: false },
    catalog: { read: true, write: true, delete: true },
    designJobs: { read: true, write: true, delete: false, viewAll: true },
    orders: { read: true, write: true, delete: false, viewAll: true },
    manufacturing: { read: true, write: true, delete: false, viewAll: true },
    teamStores: { read: true, write: true, delete: false, viewAll: true },
    salespeople: { read: true, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: true, write: false, delete: false, viewAll: true },
    manufacturerManagement: { read: true, write: true, delete: false, viewAll: true },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: true, write: false, delete: false, viewAll: true },
    quotes: { read: true, write: false, delete: false, viewAll: true },
    events: { read: true, write: true, delete: false, viewAll: true },
    tasks: { read: true, write: true, delete: false, viewAll: true },
  },
  manufacturer: {
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: false, write: false, delete: false },
    contacts: { read: false, write: false, delete: false },
    catalog: { read: true, write: false, delete: false },
    designJobs: { read: false, write: false, delete: false, viewAll: false },
    orders: { read: true, write: false, delete: false, viewAll: false },
    manufacturing: { read: true, write: true, delete: false, viewAll: false },
    teamStores: { read: false, write: false, delete: false, viewAll: false },
    salespeople: { read: false, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    designerManagement: { read: false, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: true, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: false, write: false, delete: false, viewAll: false },
    quotes: { read: false, write: false, delete: false, viewAll: false },
    events: { read: false, write: false, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: false },
  },
  finance: {
    dashboard: { read: true, write: false },
    leads: { read: false, write: false, delete: false, viewAll: false },
    organizations: { read: true, write: false, delete: false },
    contacts: { read: true, write: false, delete: false },
    catalog: { read: true, write: false, delete: false },
    designJobs: { read: false, write: false, delete: false, viewAll: false },
    orders: { read: true, write: false, delete: false, viewAll: true },
    manufacturing: { read: false, write: false, delete: false, viewAll: false },
    teamStores: { read: true, write: false, delete: false, viewAll: true },
    salespeople: { read: true, write: false, delete: false },
    settings: { read: false, write: false },
    users: { read: true, write: false, delete: false },
    designerManagement: { read: false, write: false, delete: false, viewAll: false },
    manufacturerManagement: { read: false, write: false, delete: false, viewAll: false },
    userManagement: { read: false, write: false, delete: false, viewAll: false },
    finance: { read: true, write: true, delete: false, viewAll: true },
    quotes: { read: true, write: true, delete: false, viewAll: true },
    events: { read: false, write: false, delete: false, viewAll: false },
    tasks: { read: true, write: true, delete: false, viewAll: true },
  },
};

// Type definitions
export type UserRole = keyof typeof PERMISSIONS;
export type Resource = keyof typeof PERMISSIONS.admin;
export type Permission = "read" | "write" | "delete" | "viewAll";

// Navigation items mapping
export const NAVIGATION_ITEMS = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line", resource: "dashboard" as Resource },
  { name: "Leads", href: "/leads", icon: "fas fa-bullseye", resource: "leads" as Resource },
  { name: "Organizations", href: "/organizations", icon: "fas fa-building", resource: "organizations" as Resource },
  { name: "Contacts", href: "/contacts", icon: "fas fa-address-book", resource: "contacts" as Resource },
  { name: "Catalog", href: "/catalog", icon: "fas fa-box", resource: "catalog" as Resource },
  { name: "Design Jobs", href: "/design-jobs", icon: "fas fa-palette", resource: "designJobs" as Resource },
  { name: "Orders", href: "/orders", icon: "fas fa-shopping-cart", resource: "orders" as Resource },
  { name: "Manufacturing", href: "/manufacturing", icon: "fas fa-industry", resource: "manufacturing" as Resource },
  { name: "Team Stores", href: "/team-stores", icon: "fas fa-store", resource: "teamStores" as Resource },
  { name: "Events", href: "/events", icon: "fas fa-calendar-alt", resource: "events" as Resource },
  { name: "Tasks", href: "/tasks", icon: "fas fa-tasks", resource: "tasks" as Resource },
  { name: "Sales Team", href: "/salespeople", icon: "fas fa-users", resource: "salespeople" as Resource },
  { name: "Designer Management", href: "/designer-management", icon: "fas fa-paint-brush", resource: "designerManagement" as Resource },
  { name: "Manufacturer Management", href: "/manufacturer-management", icon: "fas fa-warehouse", resource: "manufacturerManagement" as Resource },
  { name: "User Management", href: "/user-management", icon: "fas fa-user-cog", resource: "userManagement" as Resource },
  { name: "Finance", href: "/finance", icon: "fas fa-dollar-sign", resource: "finance" as Resource },
  { name: "Quote Generator", href: "/quotes", icon: "fas fa-file-invoice-dollar", resource: "quotes" as Resource },
];

export const BOTTOM_NAVIGATION = [
  { name: "Test Users", href: "/admin/test-users", icon: "fas fa-flask", resource: "users" as Resource, adminOnly: true },
  { name: "Permissions", href: "/admin/permissions", icon: "fas fa-shield-alt", resource: "users" as Resource, adminOnly: true },
  { name: "Settings", href: "/settings", icon: "fas fa-cog", resource: "settings" as Resource },
];

// Check if user has specific permission
export function hasPermission(
  user: FrontendUser | null | undefined,
  resource: Resource,
  permission: Permission
): boolean {
  if (!user?.role) return false;
  
  const rolePermissions = PERMISSIONS[user.role as UserRole];
  if (!rolePermissions) return false;
  
  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions) return false;
  
  return resourcePermissions[permission as keyof typeof resourcePermissions] === true;
}

// Check if user can access a resource at all
export function canAccess(user: FrontendUser | null | undefined, resource: Resource): boolean {
  return hasPermission(user, resource, "read");
}

// Check if user can modify a resource
export function canModify(user: FrontendUser | null | undefined, resource: Resource): boolean {
  return hasPermission(user, resource, "write");
}

// Check if user can delete from a resource
export function canDelete(user: FrontendUser | null | undefined, resource: Resource): boolean {
  return hasPermission(user, resource, "delete");
}

// Check if user can view all records (not just their own)
export function canViewAll(user: FrontendUser | null | undefined, resource: Resource): boolean {
  return hasPermission(user, resource, "viewAll");
}

// Get filtered navigation items based on user permissions
export function getFilteredNavigation(user: FrontendUser | null | undefined) {
  if (!user) return { main: [], bottom: [] };
  
  const main = NAVIGATION_ITEMS.filter(item => 
    canAccess(user, item.resource)
  );
  
  const bottom = BOTTOM_NAVIGATION.filter(item => {
    // Check if item has access permission
    if (!canAccess(user, item.resource)) return false;
    // If item is admin-only, only show to admins
    if ((item as any).adminOnly && user.role !== 'admin') return false;
    return true;
  });
  
  return { main, bottom };
}

// Check if user owns a resource
export function isOwner(user: FrontendUser | null | undefined, resourceOwnerId: string | null | undefined): boolean {
  if (!user || !resourceOwnerId) return false;
  return user.id === resourceOwnerId;
}

// Check if user is admin
export function isAdmin(user: FrontendUser | null | undefined): boolean {
  return user?.role === "admin";
}

// Check if user is sales
export function isSales(user: FrontendUser | null | undefined): boolean {
  return user?.role === "sales";
}

// Check if user is designer
export function isDesigner(user: FrontendUser | null | undefined): boolean {
  return user?.role === "designer";
}

// Check if user is ops
export function isOps(user: FrontendUser | null | undefined): boolean {
  return user?.role === "ops";
}

// Check if user is manufacturer
export function isManufacturer(user: FrontendUser | null | undefined): boolean {
  return user?.role === "manufacturer";
}

// Get permission-based UI hints
export function getPermissionHints(user: FrontendUser | null | undefined, resource: Resource) {
  return {
    canRead: canAccess(user, resource),
    canWrite: canModify(user, resource),
    canDelete: canDelete(user, resource),
    canViewAll: canViewAll(user, resource),
    isReadOnly: canAccess(user, resource) && !canModify(user, resource),
  };
}

// Filter data on frontend based on permissions
export function filterByPermissions<T extends { ownerUserId?: string; assignedDesignerId?: string; salespersonUserId?: string }>(
  data: T[],
  user: FrontendUser | null | undefined,
  resource: Resource
): T[] {
  if (!user) return [];
  
  // Admin sees everything
  if (isAdmin(user)) return data;
  
  // If user can view all, return all data
  if (canViewAll(user, resource)) return data;
  
  // Filter based on ownership or assignment
  switch (resource) {
    case "leads":
      if (isSales(user)) {
        return data.filter(item => item.ownerUserId === user.id);
      }
      break;
      
    case "orders":
      if (isSales(user)) {
        return data.filter(item => item.salespersonUserId === user.id);
      }
      break;
      
    case "designJobs":
      if (isDesigner(user)) {
        return data.filter(item => item.assignedDesignerId === user.id);
      }
      break;
  }
  
  // Default: return data as-is if no specific filter applies
  return data;
}

// Check if a specific action is allowed
export function canPerformAction(
  user: FrontendUser | null | undefined,
  action: string,
  resource: Resource,
  resourceData?: any
): boolean {
  if (!user) return false;
  
  switch (action) {
    case "create":
      return canModify(user, resource);
      
    case "edit":
    case "update":
      // Check if user can modify and either owns the resource or can view all
      if (!canModify(user, resource)) return false;
      if (canViewAll(user, resource)) return true;
      if (resourceData?.ownerUserId && isOwner(user, resourceData.ownerUserId)) return true;
      if (resourceData?.assignedDesignerId && user.id === resourceData.assignedDesignerId) return true;
      if (resourceData?.salespersonUserId && user.id === resourceData.salespersonUserId) return true;
      return false;
      
    case "delete":
      return canDelete(user, resource);
      
    case "view":
    case "read":
      // Check if user can read and either owns the resource or can view all
      if (!canAccess(user, resource)) return false;
      if (canViewAll(user, resource)) return true;
      if (resourceData?.ownerUserId && isOwner(user, resourceData.ownerUserId)) return true;
      if (resourceData?.assignedDesignerId && user.id === resourceData.assignedDesignerId) return true;
      if (resourceData?.salespersonUserId && user.id === resourceData.salespersonUserId) return true;
      return false;
      
    default:
      return false;
  }
}