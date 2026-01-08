import type { Resource, UserRole } from "./permissions";
import { PERMISSIONS } from "./permissions";

export interface PageRegistryEntry {
  id: string;
  label: string;
  path: string;
  groupId: NavigationGroupId;
  isGroupLanding: boolean;
  sortOrderGlobal: number;
  sortOrderInGroup: number;
  resourceKey: Resource | null;
  pageVisibleByRole?: Partial<Record<UserRole, boolean>>;
  hideFromMoreMenu?: boolean;
  featureFlag?: string;
  roles?: UserRole[];
}

export type NavigationGroupId = 
  | "sales-crm"
  | "orders-stores"
  | "production-manufacturing"
  | "design-operations"
  | "catalog-materials"
  | "finance-reporting"
  | "admin-system";

export interface NavigationGroup {
  id: NavigationGroupId;
  title: string;
  landingPathSales?: string;
  landingPathDefault: string;
  sortOrder: number;
  icon: string;
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: "sales-crm",
    title: "Sales & CRM",
    landingPathSales: "/sales-map",
    landingPathDefault: "/leads",
    sortOrder: 1,
    icon: "target"
  },
  {
    id: "orders-stores",
    title: "Orders & Stores",
    landingPathDefault: "/orders",
    sortOrder: 2,
    icon: "shopping-cart"
  },
  {
    id: "production-manufacturing",
    title: "Production & Manufacturing",
    landingPathDefault: "/manufacturing",
    sortOrder: 3,
    icon: "factory"
  },
  {
    id: "design-operations",
    title: "Design Operations",
    landingPathDefault: "/design-jobs",
    sortOrder: 4,
    icon: "palette"
  },
  {
    id: "catalog-materials",
    title: "Catalog & Materials",
    landingPathDefault: "/catalog",
    sortOrder: 5,
    icon: "package"
  },
  {
    id: "finance-reporting",
    title: "Finance & Reporting",
    landingPathDefault: "/finance",
    sortOrder: 6,
    icon: "dollar-sign"
  },
  {
    id: "admin-system",
    title: "Admin & System",
    landingPathDefault: "/user-management",
    sortOrder: 7,
    icon: "shield"
  }
];

export const PAGE_REGISTRY: PageRegistryEntry[] = [
  // ============ Sales & CRM Group ============
  {
    id: "sales-map",
    label: "Sales Map",
    path: "/sales-map",
    groupId: "sales-crm",
    isGroupLanding: true,
    sortOrderGlobal: 100,
    sortOrderInGroup: 1,
    resourceKey: "leads",
    featureFlag: "salesMapEnabled",
    roles: ["admin", "sales", "ops"],
    pageVisibleByRole: { admin: true, sales: true, ops: true }
  },
  {
    id: "leads-hub",
    label: "Leads",
    path: "/leads",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 101,
    sortOrderInGroup: 2,
    resourceKey: "leads",
    roles: ["admin", "sales", "ops"],
    pageVisibleByRole: { admin: true, sales: true, ops: true }
  },
  {
    id: "leads-list",
    label: "Leads List",
    path: "/leads/list",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 102,
    sortOrderInGroup: 3,
    resourceKey: "leads",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "leads-actions",
    label: "Leads Actions",
    path: "/leads/actions",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 103,
    sortOrderInGroup: 4,
    resourceKey: "leads",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "completed-leads",
    label: "Completed Leads",
    path: "/completed-leads",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 104,
    sortOrderInGroup: 5,
    resourceKey: "leads",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "organizations-hub",
    label: "Organizations",
    path: "/organizations",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 110,
    sortOrderInGroup: 10,
    resourceKey: "organizations",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "organizations-list",
    label: "Organizations List",
    path: "/organizations/list",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 111,
    sortOrderInGroup: 11,
    resourceKey: "organizations",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "organizations-actions",
    label: "Organizations Actions",
    path: "/organizations/actions",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 112,
    sortOrderInGroup: 12,
    resourceKey: "organizations",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "contacts-hub",
    label: "Contacts",
    path: "/contacts",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 120,
    sortOrderInGroup: 20,
    resourceKey: "contacts",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "contacts-list",
    label: "Contacts List",
    path: "/contacts/list",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 121,
    sortOrderInGroup: 21,
    resourceKey: "contacts",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "contacts-actions",
    label: "Contacts Actions",
    path: "/contacts/actions",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 122,
    sortOrderInGroup: 22,
    resourceKey: "contacts",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "sales-tracker",
    label: "Sales Tracker",
    path: "/sales-tracker",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 130,
    sortOrderInGroup: 30,
    resourceKey: "leads",
    roles: ["admin", "sales"]
  },
  {
    id: "salespeople-hub",
    label: "Salespeople",
    path: "/salespeople",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 140,
    sortOrderInGroup: 40,
    resourceKey: "salespeople",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "salespeople-list",
    label: "Salespeople List",
    path: "/salespeople/list",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 141,
    sortOrderInGroup: 41,
    resourceKey: "salespeople",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "events-hub",
    label: "Events",
    path: "/events",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 150,
    sortOrderInGroup: 50,
    resourceKey: "events",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "events-list",
    label: "Events List",
    path: "/events/list",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 151,
    sortOrderInGroup: 51,
    resourceKey: "events",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "events-actions",
    label: "Events Actions",
    path: "/events/actions",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 152,
    sortOrderInGroup: 52,
    resourceKey: "events",
    roles: ["admin", "sales", "ops"]
  },
  {
    id: "notifications-hub",
    label: "Notifications",
    path: "/notifications",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 160,
    sortOrderInGroup: 60,
    resourceKey: null
  },
  {
    id: "notifications-list",
    label: "Notifications List",
    path: "/notifications/list",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 161,
    sortOrderInGroup: 61,
    resourceKey: null
  },

  // ============ Orders & Stores Group ============
  {
    id: "orders-hub",
    label: "Order Command Center",
    path: "/orders",
    groupId: "orders-stores",
    isGroupLanding: true,
    sortOrderGlobal: 200,
    sortOrderInGroup: 1,
    resourceKey: "orders"
  },
  {
    id: "orders-list",
    label: "Orders List",
    path: "/orders/list",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 201,
    sortOrderInGroup: 2,
    resourceKey: "orders"
  },
  {
    id: "orders-actions",
    label: "Orders Actions",
    path: "/orders/actions",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 202,
    sortOrderInGroup: 3,
    resourceKey: "orders"
  },
  {
    id: "orders-legacy",
    label: "Orders (Legacy)",
    path: "/orders/legacy",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 203,
    sortOrderInGroup: 4,
    resourceKey: "orders",
    hideFromMoreMenu: true
  },
  {
    id: "order-map",
    label: "Order Map",
    path: "/order-map",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 204,
    sortOrderInGroup: 5,
    resourceKey: "orders"
  },
  {
    id: "pipeline-view",
    label: "Order Pipeline",
    path: "/pipeline",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 205,
    sortOrderInGroup: 6,
    resourceKey: "orders"
  },
  {
    id: "order-forms",
    label: "Order Forms",
    path: "/order-forms",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 206,
    sortOrderInGroup: 7,
    resourceKey: "orders"
  },
  {
    id: "order-specifications",
    label: "Order Specifications",
    path: "/order-specifications",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 207,
    sortOrderInGroup: 8,
    resourceKey: "orders",
    roles: ["admin", "ops"]
  },
  {
    id: "quotes-hub",
    label: "Quotes",
    path: "/quotes",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 210,
    sortOrderInGroup: 10,
    resourceKey: "quotes"
  },
  {
    id: "quotes-list",
    label: "Quotes List",
    path: "/quotes/list",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 211,
    sortOrderInGroup: 11,
    resourceKey: "quotes"
  },
  {
    id: "quotes-actions",
    label: "Quotes Actions",
    path: "/quotes/actions",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 212,
    sortOrderInGroup: 12,
    resourceKey: "quotes"
  },
  {
    id: "team-stores-hub",
    label: "Team Stores",
    path: "/team-stores",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 220,
    sortOrderInGroup: 20,
    resourceKey: "teamStores"
  },
  {
    id: "team-stores-list",
    label: "Team Stores List",
    path: "/team-stores/list",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 221,
    sortOrderInGroup: 21,
    resourceKey: "teamStores"
  },
  {
    id: "team-stores-actions",
    label: "Team Stores Actions",
    path: "/team-stores/actions",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 222,
    sortOrderInGroup: 22,
    resourceKey: "teamStores"
  },

  // ============ Production & Manufacturing Group ============
  {
    id: "manufacturing-hub",
    label: "Manufacturing Control Floor",
    path: "/manufacturing",
    groupId: "production-manufacturing",
    isGroupLanding: true,
    sortOrderGlobal: 300,
    sortOrderInGroup: 1,
    resourceKey: "manufacturing"
  },
  {
    id: "manufacturing-list",
    label: "Manufacturing List",
    path: "/manufacturing/list",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 301,
    sortOrderInGroup: 2,
    resourceKey: "manufacturing"
  },
  {
    id: "manufacturing-actions",
    label: "Manufacturing Actions",
    path: "/manufacturing/actions",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 302,
    sortOrderInGroup: 3,
    resourceKey: "manufacturing"
  },
  {
    id: "manufacturer-line-items",
    label: "Manufacturer Line Items",
    path: "/manufacturer/line-items",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 303,
    sortOrderInGroup: 4,
    resourceKey: "manufacturing"
  },
  {
    id: "manufacturer-portal",
    label: "Manufacturer Portal",
    path: "/manufacturer-portal",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 304,
    sortOrderInGroup: 5,
    resourceKey: "manufacturing"
  },
  {
    id: "manufacturer-queue",
    label: "Manufacturer Queue",
    path: "/manufacturer-queue",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 305,
    sortOrderInGroup: 6,
    resourceKey: "manufacturing"
  },
  {
    id: "capacity-dashboard",
    label: "Capacity Dashboard",
    path: "/capacity-dashboard",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 306,
    sortOrderInGroup: 7,
    resourceKey: "manufacturing",
    roles: ["admin", "ops"]
  },
  {
    id: "size-checker",
    label: "Size Checker",
    path: "/size-checker",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 307,
    sortOrderInGroup: 8,
    resourceKey: "manufacturing",
    roles: ["admin", "ops"]
  },

  // ============ Design Operations Group ============
  {
    id: "design-jobs-hub",
    label: "Design Operations Desk",
    path: "/design-jobs",
    groupId: "design-operations",
    isGroupLanding: true,
    sortOrderGlobal: 400,
    sortOrderInGroup: 1,
    resourceKey: "designJobs"
  },
  {
    id: "design-jobs-list",
    label: "Design Jobs List",
    path: "/design-jobs/list",
    groupId: "design-operations",
    isGroupLanding: false,
    sortOrderGlobal: 401,
    sortOrderInGroup: 2,
    resourceKey: "designJobs"
  },
  {
    id: "design-jobs-actions",
    label: "Design Jobs Actions",
    path: "/design-jobs/actions",
    groupId: "design-operations",
    isGroupLanding: false,
    sortOrderGlobal: 402,
    sortOrderInGroup: 3,
    resourceKey: "designJobs"
  },
  {
    id: "design-portfolio",
    label: "Design Portfolio",
    path: "/design-portfolio",
    groupId: "design-operations",
    isGroupLanding: false,
    sortOrderGlobal: 403,
    sortOrderInGroup: 4,
    resourceKey: "designJobs",
    roles: ["admin", "designer", "ops"]
  },
  {
    id: "design-resources",
    label: "Design Resources",
    path: "/design-resources",
    groupId: "design-operations",
    isGroupLanding: false,
    sortOrderGlobal: 404,
    sortOrderInGroup: 5,
    resourceKey: "designJobs",
    roles: ["admin", "designer", "ops"]
  },

  // ============ Catalog & Materials Group ============
  {
    id: "catalog-hub",
    label: "Catalog Systems Hub",
    path: "/catalog",
    groupId: "catalog-materials",
    isGroupLanding: true,
    sortOrderGlobal: 500,
    sortOrderInGroup: 1,
    resourceKey: "catalog"
  },
  {
    id: "catalog-list",
    label: "Catalog List",
    path: "/catalog/list",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 501,
    sortOrderInGroup: 2,
    resourceKey: "catalog"
  },
  {
    id: "catalog-actions",
    label: "Catalog Actions",
    path: "/catalog/actions",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 502,
    sortOrderInGroup: 3,
    resourceKey: "catalog"
  },
  {
    id: "catalog-admin",
    label: "Catalog Admin",
    path: "/admin/catalog",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 503,
    sortOrderInGroup: 4,
    resourceKey: "catalog",
    roles: ["admin", "ops"]
  },
  {
    id: "archived-categories",
    label: "Archived Categories",
    path: "/catalog/archived/categories",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 504,
    sortOrderInGroup: 5,
    resourceKey: "catalog",
    roles: ["admin", "ops"]
  },
  {
    id: "archived-products",
    label: "Archived Products",
    path: "/catalog/archived/products",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 505,
    sortOrderInGroup: 6,
    resourceKey: "catalog",
    roles: ["admin", "ops"]
  },
  {
    id: "archived-variants",
    label: "Archived Variants",
    path: "/catalog/archived/variants",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 506,
    sortOrderInGroup: 7,
    resourceKey: "catalog",
    roles: ["admin", "ops"]
  },
  {
    id: "fabric-management-hub",
    label: "Fabric Management",
    path: "/fabric-management",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 510,
    sortOrderInGroup: 10,
    resourceKey: "catalog",
    roles: ["admin", "ops"]
  },
  {
    id: "fabric-management-list",
    label: "Fabric Management List",
    path: "/fabric-management/list",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 511,
    sortOrderInGroup: 11,
    resourceKey: "catalog",
    roles: ["admin", "ops"]
  },

  // ============ Finance & Reporting Group ============
  {
    id: "finance-hub",
    label: "Finance & Performance Center",
    path: "/finance",
    groupId: "finance-reporting",
    isGroupLanding: true,
    sortOrderGlobal: 600,
    sortOrderInGroup: 1,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-overview",
    label: "Financial Overview",
    path: "/finance/overview",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 601,
    sortOrderInGroup: 2,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-invoices",
    label: "Invoices",
    path: "/finance/invoices",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 602,
    sortOrderInGroup: 3,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-payments",
    label: "Payments",
    path: "/finance/payments",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 603,
    sortOrderInGroup: 4,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-commissions",
    label: "Commissions",
    path: "/finance/commissions",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 604,
    sortOrderInGroup: 5,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-matching",
    label: "Financial Matching",
    path: "/finance/matching",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 605,
    sortOrderInGroup: 6,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-expenses",
    label: "Expenses",
    path: "/finance/expenses",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 606,
    sortOrderInGroup: 7,
    resourceKey: "finance",
    roles: ["admin", "ops"]
  },
  {
    id: "finance-legacy",
    label: "Finance (Legacy)",
    path: "/finance/legacy",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 607,
    sortOrderInGroup: 8,
    resourceKey: "finance",
    hideFromMoreMenu: true,
    roles: ["admin", "ops"]
  },
  {
    id: "sales-analytics",
    label: "Sales Analytics",
    path: "/sales-analytics",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 610,
    sortOrderInGroup: 10,
    resourceKey: "finance",
    roles: ["admin", "sales"]
  },
  {
    id: "system-analytics",
    label: "System Analytics",
    path: "/system-analytics",
    groupId: "finance-reporting",
    isGroupLanding: false,
    sortOrderGlobal: 611,
    sortOrderInGroup: 11,
    resourceKey: null,
    roles: ["admin"]
  },

  // ============ Admin & System Group ============
  {
    id: "user-management-hub",
    label: "Admin Control Center",
    path: "/user-management",
    groupId: "admin-system",
    isGroupLanding: true,
    sortOrderGlobal: 700,
    sortOrderInGroup: 1,
    resourceKey: "userManagement",
    roles: ["admin"]
  },
  {
    id: "user-management-list",
    label: "User Management List",
    path: "/user-management/list",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 701,
    sortOrderInGroup: 2,
    resourceKey: "userManagement",
    roles: ["admin"]
  },
  {
    id: "designer-management-hub",
    label: "Designer Management",
    path: "/designer-management",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 710,
    sortOrderInGroup: 10,
    resourceKey: "designerManagement",
    roles: ["admin", "ops"]
  },
  {
    id: "designer-management-list",
    label: "Designer Management List",
    path: "/designer-management/list",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 711,
    sortOrderInGroup: 11,
    resourceKey: "designerManagement",
    roles: ["admin", "ops"]
  },
  {
    id: "manufacturer-management-hub",
    label: "Manufacturer Management",
    path: "/manufacturer-management",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 720,
    sortOrderInGroup: 20,
    resourceKey: "manufacturerManagement",
    roles: ["admin", "ops"]
  },
  {
    id: "manufacturer-management-list",
    label: "Manufacturer Management List",
    path: "/manufacturer-management/list",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 721,
    sortOrderInGroup: 21,
    resourceKey: "manufacturerManagement",
    roles: ["admin", "ops"]
  },
  {
    id: "permission-management",
    label: "Permission Management",
    path: "/admin/permissions",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 730,
    sortOrderInGroup: 30,
    resourceKey: "users",
    roles: ["admin"]
  },
  {
    id: "connection-health",
    label: "Connection Health",
    path: "/connection-health",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 731,
    sortOrderInGroup: 31,
    resourceKey: null,
    roles: ["admin"]
  },
  {
    id: "test-users",
    label: "Test Users",
    path: "/admin/test-users",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 732,
    sortOrderInGroup: 32,
    resourceKey: "users",
    roles: ["admin"]
  },
  {
    id: "settings-hub",
    label: "Settings",
    path: "/settings",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 740,
    sortOrderInGroup: 40,
    resourceKey: "settings",
    roles: ["admin", "ops"]
  },
  {
    id: "settings-account",
    label: "Account Settings",
    path: "/settings/account",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 741,
    sortOrderInGroup: 41,
    resourceKey: "settings",
    roles: ["admin", "ops"]
  },
  {
    id: "tasks-hub",
    label: "Tasks",
    path: "/tasks",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 750,
    sortOrderInGroup: 50,
    resourceKey: "tasks",
    roles: ["admin", "ops", "sales", "designer"]
  },
  {
    id: "tasks-list",
    label: "Tasks List",
    path: "/tasks/list",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 751,
    sortOrderInGroup: 51,
    resourceKey: "tasks",
    roles: ["admin", "ops", "sales", "designer"]
  },

  // ============ Additional Pages (Dashboard, Role Homes, Customer Portal, etc.) ============
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 760,
    sortOrderInGroup: 60,
    resourceKey: null,
    roles: ["admin"]
  },
  {
    id: "admin-home",
    label: "Admin Home",
    path: "/admin/home",
    groupId: "admin-system",
    isGroupLanding: false,
    sortOrderGlobal: 761,
    sortOrderInGroup: 61,
    resourceKey: null,
    roles: ["admin"],
    hideFromMoreMenu: true
  },
  {
    id: "sales-home",
    label: "Sales Home",
    path: "/sales/home",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 170,
    sortOrderInGroup: 70,
    resourceKey: "leads",
    roles: ["sales"],
    hideFromMoreMenu: true
  },
  {
    id: "designer-home",
    label: "Designer Home",
    path: "/designer/home",
    groupId: "design-operations",
    isGroupLanding: false,
    sortOrderGlobal: 410,
    sortOrderInGroup: 10,
    resourceKey: "designJobs",
    roles: ["designer"],
    hideFromMoreMenu: true
  },
  {
    id: "ops-home",
    label: "Ops Home",
    path: "/ops/home",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 310,
    sortOrderInGroup: 10,
    resourceKey: "manufacturing",
    roles: ["ops"],
    hideFromMoreMenu: true
  },
  {
    id: "manufacturer-home",
    label: "Manufacturer Home",
    path: "/manufacturer/home",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 311,
    sortOrderInGroup: 11,
    resourceKey: "manufacturing",
    roles: ["manufacturer"],
    hideFromMoreMenu: true
  },
  {
    id: "sales-resources",
    label: "Sales Resources",
    path: "/sales-resources",
    groupId: "sales-crm",
    isGroupLanding: false,
    sortOrderGlobal: 171,
    sortOrderInGroup: 71,
    resourceKey: "leads",
    roles: ["admin", "sales"]
  },
  {
    id: "customer-portal",
    label: "Customer Portal",
    path: "/customer-portal",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 230,
    sortOrderInGroup: 30,
    resourceKey: null,
    hideFromMoreMenu: true
  },
  {
    id: "customer-order-form",
    label: "Customer Order Form",
    path: "/customer-order-form",
    groupId: "orders-stores",
    isGroupLanding: false,
    sortOrderGlobal: 231,
    sortOrderInGroup: 31,
    resourceKey: null,
    hideFromMoreMenu: true
  },
  {
    id: "production-schedule",
    label: "Production Schedule",
    path: "/production-schedule",
    groupId: "production-manufacturing",
    isGroupLanding: false,
    sortOrderGlobal: 308,
    sortOrderInGroup: 9,
    resourceKey: "manufacturing",
    roles: ["admin", "ops"]
  },
  {
    id: "variant-design-archive",
    label: "Variant Design Archive",
    path: "/catalog/variant-design-archive",
    groupId: "catalog-materials",
    isGroupLanding: false,
    sortOrderGlobal: 507,
    sortOrderInGroup: 8,
    resourceKey: "catalog"
  }
];

export interface VisiblePage extends PageRegistryEntry {
  isActive: boolean;
}

export interface NavigationGroupWithPages extends NavigationGroup {
  pages: VisiblePage[];
  landingPage: VisiblePage | null;
  hasVisiblePages: boolean;
}

export function isPageVisibleForRole(
  page: PageRegistryEntry,
  role: UserRole,
  featureFlags: Record<string, boolean>
): boolean {
  // Check feature flag first - all roles must respect feature flags
  if (page.featureFlag && !featureFlags[page.featureFlag]) {
    return false;
  }

  if (page.roles && page.roles.length > 0) {
    if (!page.roles.includes(role)) {
      return false;
    }
  }

  if (page.pageVisibleByRole) {
    const roleVisibility = page.pageVisibleByRole[role];
    if (roleVisibility === false) {
      return false;
    }
    if (roleVisibility === true) {
      return true;
    }
  }

  if (page.resourceKey) {
    const rolePermissions = PERMISSIONS[role];
    if (rolePermissions && rolePermissions[page.resourceKey]) {
      return rolePermissions[page.resourceKey].read === true;
    }
    return false;
  }

  return true;
}

export function buildNavigationForUser(
  role: UserRole,
  currentPath: string,
  featureFlags: Record<string, boolean>
): NavigationGroupWithPages[] {
  const visiblePages = PAGE_REGISTRY.filter(page => 
    isPageVisibleForRole(page, role, featureFlags)
  );

  const groupedNavigation: NavigationGroupWithPages[] = NAVIGATION_GROUPS
    .map(group => {
      const groupPages = visiblePages
        .filter(page => page.groupId === group.id)
        .sort((a, b) => a.sortOrderInGroup - b.sortOrderInGroup)
        .map(page => ({
          ...page,
          isActive: currentPath === page.path || 
            (page.path !== "/" && currentPath.startsWith(page.path))
        }));

      let landingPage = groupPages.find(p => p.isGroupLanding) || null;
      
      if (!landingPage && groupPages.length > 0) {
        const primaryLandingPath = getGroupLandingForRole(group, role, featureFlags);
        let foundPage = groupPages.find(p => p.path === primaryLandingPath);
        
        if (!foundPage) {
          foundPage = groupPages.find(p => p.path === group.landingPathDefault);
        }
        
        landingPage = foundPage || groupPages[0];
      }

      return {
        ...group,
        pages: groupPages,
        landingPage,
        hasVisiblePages: groupPages.length > 0
      };
    })
    .filter(group => group.hasVisiblePages)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return groupedNavigation;
}

export function getSalesDefaultLanding(featureFlags: Record<string, boolean>): string {
  if (featureFlags.salesMapEnabled) {
    return "/sales-map";
  }
  return "/leads";
}

export function getDefaultLandingForRole(role: UserRole, featureFlags: Record<string, boolean>): string {
  if (role === "sales") {
    return getSalesDefaultLanding(featureFlags);
  }
  
  // Only use role-specific home pages if enableRoleHome feature flag is enabled
  if (featureFlags.enableRoleHome) {
    const roleDefaults: Record<UserRole, string> = {
      admin: "/admin/home",
      sales: "/sales-map",
      designer: "/designer/home",
      ops: "/ops/home",
      manufacturer: "/manufacturer/home",
      finance: "/finance"
    };
    
    if (roleDefaults[role]) {
      return roleDefaults[role];
    }
  }
  
  // Fallback to safe defaults when role home is disabled
  const fallbackDefaults: Record<UserRole, string> = {
    admin: "/orders",
    sales: "/leads",
    designer: "/design-jobs",
    ops: "/manufacturing",
    manufacturer: "/manufacturing",
    finance: "/finance"
  };
  
  return fallbackDefaults[role] || "/";
}

export function getGroupLandingForRole(
  group: NavigationGroup,
  role: UserRole,
  featureFlags?: Record<string, boolean>
): string {
  // For sales-crm group, use sales-map if feature flag is enabled
  if (group.id === "sales-crm") {
    const canAccessSalesMap = featureFlags && featureFlags.salesMapEnabled;
    if (canAccessSalesMap && (role === "admin" || role === "ops" || role === "sales")) {
      return "/sales-map";
    }
    return group.landingPathDefault;
  }
  
  if (role === "sales" && group.landingPathSales) {
    if (group.landingPathSales === "/sales-map") {
      if (featureFlags && !featureFlags.salesMapEnabled) {
        return group.landingPathDefault;
      }
    }
    return group.landingPathSales;
  }
  return group.landingPathDefault;
}
