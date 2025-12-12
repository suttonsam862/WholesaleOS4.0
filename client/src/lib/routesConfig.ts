import { ComponentType, lazy } from "react";
import type { Resource } from "./permissions";

export interface RouteConfig {
  path: string;
  title: string;
  component: ComponentType<any>;
  requiresAuth: boolean;
  requiresLayout: boolean;
  roles?: string[];
  resource?: Resource;
  featureFlag?: string;
}

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Leads = lazy(() => import("@/pages/leads"));
const CompletedLeads = lazy(() => import("@/pages/completed-leads"));
const Organizations = lazy(() => import("@/pages/organizations"));
const Contacts = lazy(() => import("@/pages/contacts"));
const Catalog = lazy(() => import("@/pages/catalog"));
const CategoryPage = lazy(() => import("@/pages/category-page"));
const CategoryProducts = lazy(() => import("@/pages/category-products"));
const ProductVariants = lazy(() => import("@/pages/product-variants"));
const VariantDesignArchive = lazy(() => import("@/pages/variant-design-archive"));
const ArchivedCategories = lazy(() => import("@/pages/archived-categories"));
const ArchivedProducts = lazy(() => import("@/pages/archived-products"));
const ArchivedVariants = lazy(() => import("@/pages/archived-variants"));
const DesignJobs = lazy(() => import("@/pages/design-jobs"));
const DesignJobDetail = lazy(() => import("@/pages/design-job-detail"));
const OrdersHub = lazy(() => import("@/pages/orders-hub"));
const OrdersList = lazy(() => import("@/pages/orders-list"));
const OrderDetail = lazy(() => import("@/pages/order-detail"));
const OrdersLegacy = lazy(() => import("@/pages/orders"));
const Manufacturing = lazy(() => import("@/pages/manufacturing"));
const TeamStores = lazy(() => import("@/pages/team-stores"));
const ManufacturerLineItems = lazy(() => import("@/pages/manufacturer-line-items").then(m => ({ default: m.ManufacturerLineItems })));
const Events = lazy(() => import("@/pages/events"));
const EventWizard = lazy(() => import("@/pages/event-wizard"));
const EventDetail = lazy(() => import("@/pages/event-detail"));
const Salespeople = lazy(() => import("@/pages/salespeople"));
const Settings = lazy(() => import("@/pages/settings"));
const Notifications = lazy(() => import("@/pages/notifications"));
const DesignerManagement = lazy(() => import("@/pages/designer-management"));
const ManufacturerManagement = lazy(() => import("@/pages/manufacturer-management"));
const UserManagement = lazy(() => import("@/pages/user-management"));
const Finance = lazy(() => import("@/pages/finance"));
const Quotes = lazy(() => import("@/pages/quotes"));
const TestUsers = lazy(() => import("@/pages/test-users"));
const PermissionManagement = lazy(() => import("@/pages/permission-management"));
const SalesAnalytics = lazy(() => import("@/pages/sales-analytics").then(m => ({ default: m.SalesAnalytics })));
const SalesTracker = lazy(() => import("@/pages/sales-tracker").then(m => ({ default: m.SalesTracker })));
const SalesResources = lazy(() => import("@/pages/sales-resources"));
const DesignPortfolio = lazy(() => import("@/pages/design-portfolio").then(m => ({ default: m.DesignPortfolio })));
const DesignResources = lazy(() => import("@/pages/design-resources").then(m => ({ default: m.DesignResources })));
const SizeChecker = lazy(() => import("@/pages/production-schedule").then(m => ({ default: m.SizeChecker })));
const CapacityDashboard = lazy(() => import("@/pages/capacity-dashboard").then(m => ({ default: m.CapacityDashboard })));
const OrderSpecifications = lazy(() => import("@/pages/order-specifications").then(m => ({ default: m.OrderSpecifications })));
const SystemAnalytics = lazy(() => import("@/pages/system-analytics").then(m => ({ default: m.SystemAnalytics })));
const ConnectionHealth = lazy(() => import("@/pages/connection-health").then(m => ({ default: m.ConnectionHealth })));
const OrderMap = lazy(() => import("@/pages/order-map"));
const PipelineView = lazy(() => import("@/pages/pipeline-view"));
const Tasks = lazy(() => import("@/pages/tasks"));
const OrderForms = lazy(() => import("@/pages/order-forms"));
const FabricManagement = lazy(() => import("@/pages/fabric-management"));
const ManufacturerPortal = lazy(() => import("@/pages/manufacturer-portal"));

const AdminHome = lazy(() => import("@/pages/admin-home"));
const SalesHome = lazy(() => import("@/pages/sales-home"));
const DesignerHome = lazy(() => import("@/pages/designer-home"));
const OpsHome = lazy(() => import("@/pages/ops-home"));
const ManufacturerHome = lazy(() => import("@/pages/manufacturer-home"));

const Landing = lazy(() => import("@/pages/landing"));
const LocalLogin = lazy(() => import("@/pages/local-login"));
const AccountSetup = lazy(() => import("@/pages/account-setup"));
const CustomerOrderForm = lazy(() => import("@/pages/customer-order-form"));
const CustomerPortal = lazy(() => import("@/pages/customer-portal"));
const NotFound = lazy(() => import("@/pages/not-found"));

export const publicRoutes: RouteConfig[] = [
  { path: "/", title: "Landing", component: Landing, requiresAuth: false, requiresLayout: false },
  { path: "/local-login", title: "Local Login", component: LocalLogin, requiresAuth: false, requiresLayout: false },
  { path: "/setup-account", title: "Account Setup", component: AccountSetup, requiresAuth: false, requiresLayout: false },
  { path: "/customer-order-form/:id", title: "Order Form", component: CustomerOrderForm, requiresAuth: false, requiresLayout: false },
  { path: "/customer-portal/:id", title: "Customer Portal", component: CustomerPortal, requiresAuth: false, requiresLayout: false },
];

export const roleHomeRoutes: RouteConfig[] = [
  { path: "/admin/home", title: "Admin Home", component: AdminHome, requiresAuth: true, requiresLayout: true, roles: ["admin"], featureFlag: "enableRoleHome" },
  { path: "/sales/home", title: "Sales Home", component: SalesHome, requiresAuth: true, requiresLayout: true, roles: ["sales"], featureFlag: "enableRoleHome" },
  { path: "/designer/home", title: "Designer Home", component: DesignerHome, requiresAuth: true, requiresLayout: true, roles: ["designer"], featureFlag: "enableRoleHome" },
  { path: "/ops/home", title: "Ops Home", component: OpsHome, requiresAuth: true, requiresLayout: true, roles: ["ops"], featureFlag: "enableRoleHome" },
  { path: "/manufacturer/home", title: "Manufacturer Home", component: ManufacturerHome, requiresAuth: true, requiresLayout: true, roles: ["manufacturer"], featureFlag: "enableRoleHome" },
];

export const authenticatedRoutes: RouteConfig[] = [
  { path: "/", title: "Dashboard", component: Dashboard, requiresAuth: true, requiresLayout: true, resource: "dashboard" },
  { path: "/leads", title: "Leads", component: Leads, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/completed-leads", title: "Completed Leads", component: CompletedLeads, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/organizations", title: "Organizations", component: Organizations, requiresAuth: true, requiresLayout: true, resource: "organizations" },
  { path: "/contacts", title: "Contacts", component: Contacts, requiresAuth: true, requiresLayout: true, resource: "contacts" },
  { path: "/catalog", title: "Catalog", component: Catalog, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/category/:categoryId", title: "Category Products", component: CategoryProducts, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/product/:productId", title: "Product Variants", component: ProductVariants, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/variant/:variantId/designs", title: "Design Archive", component: VariantDesignArchive, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/admin/catalog", title: "Catalog Admin", component: CategoryPage, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"], resource: "catalog" },
  { path: "/catalog/archived/categories", title: "Archived Categories", component: ArchivedCategories, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/archived/products", title: "Archived Products", component: ArchivedProducts, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/archived/variants", title: "Archived Variants", component: ArchivedVariants, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/design-jobs", title: "Design Jobs", component: DesignJobs, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/design-jobs/:id", title: "Design Job Detail", component: DesignJobDetail, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/orders", title: "Orders Hub", component: OrdersHub, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/orders/list", title: "Orders List", component: OrdersList, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/orders/:id", title: "Order Detail", component: OrderDetail, requiresAuth: true, requiresLayout: false, resource: "orders" },
  { path: "/orders/legacy", title: "Orders (Legacy)", component: OrdersLegacy, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/manufacturing", title: "Manufacturing", component: Manufacturing, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/team-stores", title: "Team Stores", component: TeamStores, requiresAuth: true, requiresLayout: true, resource: "teamStores" },
  { path: "/manufacturer/line-items", title: "My Line Items", component: ManufacturerLineItems, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/events", title: "Events", component: Events, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/events/:id/wizard", title: "Event Wizard", component: EventWizard, requiresAuth: true, requiresLayout: false, resource: "events" },
  { path: "/events/:id", title: "Event Detail", component: EventDetail, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/salespeople", title: "Sales Team", component: Salespeople, requiresAuth: true, requiresLayout: true, resource: "salespeople" },
  { path: "/settings", title: "Settings", component: Settings, requiresAuth: true, requiresLayout: true, resource: "settings" },
  { path: "/notifications", title: "Notifications", component: Notifications, requiresAuth: true, requiresLayout: true },
  { path: "/designer-management", title: "Designer Management", component: DesignerManagement, requiresAuth: true, requiresLayout: true, resource: "designerManagement" },
  { path: "/manufacturer-management", title: "Manufacturer Management", component: ManufacturerManagement, requiresAuth: true, requiresLayout: true, resource: "manufacturerManagement" },
  { path: "/user-management", title: "User Management", component: UserManagement, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "userManagement" },
  { path: "/finance", title: "Finance", component: Finance, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/quotes", title: "Quote Generator", component: Quotes, requiresAuth: true, requiresLayout: true, resource: "quotes" },
  { path: "/admin/test-users", title: "Test User Access", component: TestUsers, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "users" },
  { path: "/admin/permissions", title: "Permission Management", component: PermissionManagement, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "users" },
  { path: "/sales-analytics", title: "Sales Analytics", component: SalesAnalytics, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-tracker", title: "Sales Tracker", component: SalesTracker, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-resources", title: "Sales Resources", component: SalesResources, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/design-portfolio", title: "Design Portfolio", component: DesignPortfolio, requiresAuth: true, requiresLayout: true, roles: ["admin", "designer", "ops"] },
  { path: "/design-resources", title: "Design Resources", component: DesignResources, requiresAuth: true, requiresLayout: true, roles: ["admin", "designer", "ops"] },
  { path: "/size-checker", title: "Size Checker", component: SizeChecker, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"] },
  { path: "/capacity-dashboard", title: "Capacity Dashboard", component: CapacityDashboard, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"] },
  { path: "/order-specifications", title: "Order Specifications", component: OrderSpecifications, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"] },
  { path: "/system-analytics", title: "System Analytics", component: SystemAnalytics, requiresAuth: true, requiresLayout: true, roles: ["admin"] },
  { path: "/connection-health", title: "Connection Health", component: ConnectionHealth, requiresAuth: true, requiresLayout: true, roles: ["admin"] },
  { path: "/order-map", title: "Order Map", component: OrderMap, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/pipeline", title: "Pipeline View", component: PipelineView, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/tasks", title: "Tasks", component: Tasks, requiresAuth: true, requiresLayout: true, resource: "tasks" },
  { path: "/order-forms", title: "Order Forms", component: OrderForms, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/fabric-management", title: "Fabric Management", component: FabricManagement, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/manufacturer-portal", title: "Manufacturer Portal", component: ManufacturerPortal, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
];

export const notFoundRoute: RouteConfig = {
  path: "*",
  title: "Not Found",
  component: NotFound,
  requiresAuth: false,
  requiresLayout: false,
};

export function getDefaultRedirectPath(userRole?: string): string {
  return "/";
}

export function getAllRoutes(): RouteConfig[] {
  return [...publicRoutes, ...roleHomeRoutes, ...authenticatedRoutes];
}
