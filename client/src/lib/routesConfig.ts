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
const LeadsHub = lazy(() => import("@/pages/leads-hub"));
const LeadsList = lazy(() => import("@/pages/leads"));
const CompletedLeads = lazy(() => import("@/pages/completed-leads"));
const OrganizationsHub = lazy(() => import("@/pages/organizations-hub"));
const OrganizationsList = lazy(() => import("@/pages/organizations"));
const ContactsHub = lazy(() => import("@/pages/contacts-hub"));
const ContactsList = lazy(() => import("@/pages/contacts"));
const CatalogHub = lazy(() => import("@/pages/catalog-hub"));
const Catalog = lazy(() => import("@/pages/catalog"));
const CategoryPage = lazy(() => import("@/pages/category-page"));
const CategoryProducts = lazy(() => import("@/pages/category-products"));
const ProductVariants = lazy(() => import("@/pages/product-variants"));
const VariantDesignArchive = lazy(() => import("@/pages/variant-design-archive"));
const ArchivedCategories = lazy(() => import("@/pages/archived-categories"));
const ArchivedProducts = lazy(() => import("@/pages/archived-products"));
const ArchivedVariants = lazy(() => import("@/pages/archived-variants"));
const DesignJobsHub = lazy(() => import("@/pages/design-jobs-hub"));
const DesignJobs = lazy(() => import("@/pages/design-jobs"));
const DesignJobDetail = lazy(() => import("@/pages/design-job-detail"));
const OrdersHub = lazy(() => import("@/pages/orders-hub"));
const OrdersList = lazy(() => import("@/pages/orders-list"));
const OrderDetail = lazy(() => import("@/pages/order-detail"));
const OrdersLegacy = lazy(() => import("@/pages/orders"));
const ManufacturingHub = lazy(() => import("@/pages/manufacturing-hub"));
const Manufacturing = lazy(() => import("@/pages/manufacturing"));
const TeamStoresHub = lazy(() => import("@/pages/team-stores-hub"));
const TeamStores = lazy(() => import("@/pages/team-stores"));
const ManufacturerLineItems = lazy(() => import("@/pages/manufacturer-line-items").then(m => ({ default: m.ManufacturerLineItems })));
const EventsHub = lazy(() => import("@/pages/events-hub"));
const EventsList = lazy(() => import("@/pages/events"));
const EventWizard = lazy(() => import("@/pages/event-wizard"));
const EventDetail = lazy(() => import("@/pages/event-detail"));
const SalespeopleHub = lazy(() => import("@/pages/salespeople-hub"));
const SalespeopleList = lazy(() => import("@/pages/salespeople"));
const SettingsHub = lazy(() => import("@/pages/settings-hub"));
const Settings = lazy(() => import("@/pages/settings"));
const ManufacturingCategoriesSettings = lazy(() => import("@/pages/settings-manufacturing-categories"));
const NotificationsHub = lazy(() => import("@/pages/notifications-hub"));
const Notifications = lazy(() => import("@/pages/notifications"));
const DesignerManagementHub = lazy(() => import("@/pages/designer-management-hub"));
const DesignerManagement = lazy(() => import("@/pages/designer-management"));
const ManufacturerManagementHub = lazy(() => import("@/pages/manufacturer-management-hub"));
const ManufacturerManagement = lazy(() => import("@/pages/manufacturer-management"));
const UserManagementHub = lazy(() => import("@/pages/user-management-hub"));
const UserManagement = lazy(() => import("@/pages/user-management"));
const Finance = lazy(() => import("@/pages/finance"));
const FinanceHub = lazy(() => import("@/pages/finance-hub"));
const FinanceOverview = lazy(() => import("@/pages/finance/index").then(m => ({ default: m.FinanceOverview })));
const FinanceInvoices = lazy(() => import("@/pages/finance/index").then(m => ({ default: m.FinanceInvoices })));
const FinancePayments = lazy(() => import("@/pages/finance/index").then(m => ({ default: m.FinancePayments })));
const FinanceCommissions = lazy(() => import("@/pages/finance/index").then(m => ({ default: m.FinanceCommissions })));
const FinanceMatching = lazy(() => import("@/pages/finance/index").then(m => ({ default: m.FinanceMatching })));
const FinanceExpenses = lazy(() => import("@/pages/finance/index").then(m => ({ default: m.FinanceExpenses })));
const QuotesHub = lazy(() => import("@/pages/quotes-hub"));
const QuotesList = lazy(() => import("@/pages/quotes"));
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
const TasksHub = lazy(() => import("@/pages/tasks-hub"));
const TasksList = lazy(() => import("@/pages/tasks"));
const OrderForms = lazy(() => import("@/pages/order-forms"));
const FabricManagementHub = lazy(() => import("@/pages/fabric-management-hub"));
const FabricManagement = lazy(() => import("@/pages/fabric-management"));
const ManufacturerPortal = lazy(() => import("@/pages/manufacturer-portal"));
const ManufacturerQueue = lazy(() => import("@/pages/manufacturer-queue"));
const ManufacturerJobDetail = lazy(() => import("@/pages/manufacturer-job-detail"));

const OrdersActions = lazy(() => import("@/pages/actions/orders-actions"));
const OrdersActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.OrdersActionDetail })));
const SalesAnalyticsActions = lazy(() => import("@/pages/actions/sales-analytics-actions"));
const SalesAnalyticsActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.SalesAnalyticsActionDetail })));
const OrganizationsActions = lazy(() => import("@/pages/actions/organizations-actions"));
const OrganizationsActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.OrganizationsActionDetail })));
const ContactsActions = lazy(() => import("@/pages/actions/contacts-actions"));
const ContactsActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.ContactsActionDetail })));
const LeadsActions = lazy(() => import("@/pages/actions/leads-actions"));
const LeadsActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.LeadsActionDetail })));
const EventsActions = lazy(() => import("@/pages/actions/events-actions"));
const EventsActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.EventsActionDetail })));
const QuotesActions = lazy(() => import("@/pages/actions/quotes-actions"));
const QuotesActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.QuotesActionDetail })));
const ManufacturingActions = lazy(() => import("@/pages/actions/manufacturing-actions"));
const ManufacturingActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.ManufacturingActionDetail })));
const TeamStoresActions = lazy(() => import("@/pages/actions/team-stores-actions"));
const TeamStoresActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.TeamStoresActionDetail })));
const DesignJobsActions = lazy(() => import("@/pages/actions/design-jobs-actions"));
const DesignJobsActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.DesignJobsActionDetail })));
const CatalogActions = lazy(() => import("@/pages/actions/catalog-actions"));
const CatalogActionDetail = lazy(() => import("@/pages/actions/action-detail").then(m => ({ default: m.CatalogActionDetail })));

const AdminHome = lazy(() => import("@/pages/admin-home"));
const SalesHome = lazy(() => import("@/pages/sales-home"));
const DesignerHome = lazy(() => import("@/pages/designer-home"));
const OpsHome = lazy(() => import("@/pages/ops-home"));
const ManufacturerHome = lazy(() => import("@/pages/manufacturer-home"));

const SalesMapShell = lazy(() => import("@/modules/sales-map/SalesMapShell"));

const Landing = lazy(() => import("@/pages/landing"));
const LocalLogin = lazy(() => import("@/pages/local-login"));
const AccountSetup = lazy(() => import("@/pages/account-setup"));
const CustomerOrderForm = lazy(() => import("@/pages/customer-order-form"));
const CustomerPortal = lazy(() => import("@/pages/customer-portal"));
const LicenseAgreement = lazy(() => import("@/pages/license-agreement"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const NotFound = lazy(() => import("@/pages/not-found"));

export const publicRoutes: RouteConfig[] = [
  { path: "/", title: "Landing", component: Landing, requiresAuth: false, requiresLayout: false },
  { path: "/local-login", title: "Local Login", component: LocalLogin, requiresAuth: false, requiresLayout: false },
  { path: "/setup-account", title: "Account Setup", component: AccountSetup, requiresAuth: false, requiresLayout: false },
  { path: "/customer-order-form/:id", title: "Order Form", component: CustomerOrderForm, requiresAuth: false, requiresLayout: false },
  { path: "/customer-portal/:id", title: "Customer Portal", component: CustomerPortal, requiresAuth: false, requiresLayout: false },
  { path: "/license", title: "License Agreement", component: LicenseAgreement, requiresAuth: false, requiresLayout: false },
  { path: "/privacy", title: "Privacy Policy", component: PrivacyPolicy, requiresAuth: false, requiresLayout: false },
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
  { path: "/leads", title: "Leads Hub", component: LeadsHub, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/leads/list", title: "Leads List", component: LeadsList, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/leads/actions", title: "Leads Actions", component: LeadsActions, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/leads/actions/:actionId", title: "Lead Action", component: LeadsActionDetail, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/completed-leads", title: "Completed Leads", component: CompletedLeads, requiresAuth: true, requiresLayout: true, resource: "leads" },
  { path: "/organizations", title: "Organizations Hub", component: OrganizationsHub, requiresAuth: true, requiresLayout: true, resource: "organizations" },
  { path: "/organizations/list", title: "Organizations List", component: OrganizationsList, requiresAuth: true, requiresLayout: true, resource: "organizations" },
  { path: "/organizations/actions", title: "Organizations Actions", component: OrganizationsActions, requiresAuth: true, requiresLayout: true, resource: "organizations" },
  { path: "/organizations/actions/:actionId", title: "Organization Action", component: OrganizationsActionDetail, requiresAuth: true, requiresLayout: true, resource: "organizations" },
  { path: "/contacts", title: "Contacts Hub", component: ContactsHub, requiresAuth: true, requiresLayout: true, resource: "contacts" },
  { path: "/contacts/list", title: "Contacts List", component: ContactsList, requiresAuth: true, requiresLayout: true, resource: "contacts" },
  { path: "/contacts/actions", title: "Contacts Actions", component: ContactsActions, requiresAuth: true, requiresLayout: true, resource: "contacts" },
  { path: "/contacts/actions/:actionId", title: "Contact Action", component: ContactsActionDetail, requiresAuth: true, requiresLayout: true, resource: "contacts" },
  { path: "/catalog", title: "Catalog Hub", component: CatalogHub, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/list", title: "Catalog List", component: Catalog, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/actions", title: "Catalog Actions", component: CatalogActions, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/actions/:actionId", title: "Catalog Action", component: CatalogActionDetail, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/category/:categoryId", title: "Category Products", component: CategoryProducts, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/product/:productId", title: "Product Variants", component: ProductVariants, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/variant/:variantId/designs", title: "Design Archive", component: VariantDesignArchive, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/admin/catalog", title: "Catalog Admin", component: CategoryPage, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"], resource: "catalog" },
  { path: "/catalog/archived/categories", title: "Archived Categories", component: ArchivedCategories, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/archived/products", title: "Archived Products", component: ArchivedProducts, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/catalog/archived/variants", title: "Archived Variants", component: ArchivedVariants, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/design-jobs", title: "Design Jobs Hub", component: DesignJobsHub, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/design-jobs/list", title: "Design Jobs List", component: DesignJobs, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/design-jobs/actions", title: "Design Jobs Actions", component: DesignJobsActions, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/design-jobs/actions/:actionId", title: "Design Job Action", component: DesignJobsActionDetail, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/design-jobs/:id", title: "Design Job Detail", component: DesignJobDetail, requiresAuth: true, requiresLayout: true, resource: "designJobs" },
  { path: "/orders", title: "Orders Hub", component: OrdersHub, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/orders/list", title: "Orders List", component: OrdersList, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/orders/actions", title: "Orders Actions", component: OrdersActions, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/orders/actions/:actionId", title: "Order Action", component: OrdersActionDetail, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/orders/:id", title: "Order Detail", component: OrderDetail, requiresAuth: true, requiresLayout: false, resource: "orders" },
  { path: "/orders/legacy", title: "Orders (Legacy)", component: OrdersLegacy, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/manufacturing", title: "Manufacturing Hub", component: ManufacturingHub, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/manufacturing/list", title: "Manufacturing List", component: Manufacturing, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/manufacturing/actions", title: "Manufacturing Actions", component: ManufacturingActions, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/manufacturing/actions/:actionId", title: "Manufacturing Action", component: ManufacturingActionDetail, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/team-stores", title: "Team Stores Hub", component: TeamStoresHub, requiresAuth: true, requiresLayout: true, resource: "teamStores" },
  { path: "/team-stores/list", title: "Team Stores List", component: TeamStores, requiresAuth: true, requiresLayout: true, resource: "teamStores" },
  { path: "/team-stores/actions", title: "Team Stores Actions", component: TeamStoresActions, requiresAuth: true, requiresLayout: true, resource: "teamStores" },
  { path: "/team-stores/actions/:actionId", title: "Team Store Action", component: TeamStoresActionDetail, requiresAuth: true, requiresLayout: true, resource: "teamStores" },
  { path: "/manufacturer/line-items", title: "My Line Items", component: ManufacturerLineItems, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/events", title: "Events Hub", component: EventsHub, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/events/list", title: "Events List", component: EventsList, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/events/actions", title: "Events Actions", component: EventsActions, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/events/actions/:actionId", title: "Event Action", component: EventsActionDetail, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/events/:id/wizard", title: "Event Wizard", component: EventWizard, requiresAuth: true, requiresLayout: false, resource: "events" },
  { path: "/events/:id", title: "Event Detail", component: EventDetail, requiresAuth: true, requiresLayout: true, resource: "events" },
  { path: "/salespeople", title: "Salespeople Hub", component: SalespeopleHub, requiresAuth: true, requiresLayout: true, resource: "salespeople" },
  { path: "/salespeople/list", title: "Salespeople List", component: SalespeopleList, requiresAuth: true, requiresLayout: true, resource: "salespeople" },
  { path: "/settings", title: "Settings Hub", component: SettingsHub, requiresAuth: true, requiresLayout: true, resource: "settings" },
  { path: "/settings/account", title: "Account Settings", component: Settings, requiresAuth: true, requiresLayout: true, resource: "settings" },
  { path: "/settings/manufacturing-categories", title: "Manufacturing Categories", component: ManufacturingCategoriesSettings, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"], resource: "manufacturing" },
  { path: "/notifications", title: "Notifications Hub", component: NotificationsHub, requiresAuth: true, requiresLayout: true },
  { path: "/notifications/list", title: "Notifications", component: Notifications, requiresAuth: true, requiresLayout: true },
  { path: "/designer-management", title: "Designer Management Hub", component: DesignerManagementHub, requiresAuth: true, requiresLayout: true, resource: "designerManagement" },
  { path: "/designer-management/list", title: "Designer Management List", component: DesignerManagement, requiresAuth: true, requiresLayout: true, resource: "designerManagement" },
  { path: "/manufacturer-management", title: "Manufacturer Management Hub", component: ManufacturerManagementHub, requiresAuth: true, requiresLayout: true, resource: "manufacturerManagement" },
  { path: "/manufacturer-management/list", title: "Manufacturer Management List", component: ManufacturerManagement, requiresAuth: true, requiresLayout: true, resource: "manufacturerManagement" },
  { path: "/user-management", title: "User Management Hub", component: UserManagementHub, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "userManagement" },
  { path: "/user-management/list", title: "User Management List", component: UserManagement, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "userManagement" },
  { path: "/finance", title: "Finance Hub", component: FinanceHub, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/overview", title: "Financial Overview", component: FinanceOverview, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/invoices", title: "Invoices", component: FinanceInvoices, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/payments", title: "Payments", component: FinancePayments, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/commissions", title: "Commissions", component: FinanceCommissions, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/matching", title: "Financial Matching", component: FinanceMatching, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/expenses", title: "Expenses", component: FinanceExpenses, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/finance/legacy", title: "Finance (Legacy)", component: Finance, requiresAuth: true, requiresLayout: true, resource: "finance" },
  { path: "/quotes", title: "Quotes Hub", component: QuotesHub, requiresAuth: true, requiresLayout: true, resource: "quotes" },
  { path: "/quotes/list", title: "Quotes List", component: QuotesList, requiresAuth: true, requiresLayout: true, resource: "quotes" },
  { path: "/quotes/actions", title: "Quotes Actions", component: QuotesActions, requiresAuth: true, requiresLayout: true, resource: "quotes" },
  { path: "/quotes/actions/:actionId", title: "Quote Action", component: QuotesActionDetail, requiresAuth: true, requiresLayout: true, resource: "quotes" },
  { path: "/admin/test-users", title: "Test User Access", component: TestUsers, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "users" },
  { path: "/admin/permissions", title: "Permission Management", component: PermissionManagement, requiresAuth: true, requiresLayout: true, roles: ["admin"], resource: "users" },
  { path: "/sales-analytics", title: "Sales Analytics", component: SalesAnalytics, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-analytics/actions", title: "Sales Analytics Actions", component: SalesAnalyticsActions, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-analytics/actions/:actionId", title: "Sales Analytics Action", component: SalesAnalyticsActionDetail, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-tracker", title: "Sales Tracker", component: SalesTracker, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-resources", title: "Sales Resources", component: SalesResources, requiresAuth: true, requiresLayout: true, roles: ["admin", "sales"] },
  { path: "/sales-map", title: "Sales Map", component: SalesMapShell, requiresAuth: true, requiresLayout: false, roles: ["admin", "sales", "ops"], featureFlag: "salesMapEnabled" },
  { path: "/design-portfolio", title: "Design Portfolio", component: DesignPortfolio, requiresAuth: true, requiresLayout: true, roles: ["admin", "designer", "ops"] },
  { path: "/design-resources", title: "Design Resources", component: DesignResources, requiresAuth: true, requiresLayout: true, roles: ["admin", "designer", "ops"] },
  { path: "/size-checker", title: "Size Checker", component: SizeChecker, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"] },
  { path: "/capacity-dashboard", title: "Capacity Dashboard", component: CapacityDashboard, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"] },
  { path: "/order-specifications", title: "Order Specifications", component: OrderSpecifications, requiresAuth: true, requiresLayout: true, roles: ["admin", "ops"] },
  { path: "/system-analytics", title: "System Analytics", component: SystemAnalytics, requiresAuth: true, requiresLayout: true, roles: ["admin"] },
  { path: "/connection-health", title: "Connection Health", component: ConnectionHealth, requiresAuth: true, requiresLayout: true, roles: ["admin"] },
  { path: "/order-map", title: "Order Map", component: OrderMap, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/pipeline", title: "Pipeline View", component: PipelineView, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/tasks", title: "Tasks Hub", component: TasksHub, requiresAuth: true, requiresLayout: true, resource: "tasks" },
  { path: "/tasks/list", title: "Tasks List", component: TasksList, requiresAuth: true, requiresLayout: true, resource: "tasks" },
  { path: "/order-forms", title: "Order Forms", component: OrderForms, requiresAuth: true, requiresLayout: true, resource: "orders" },
  { path: "/fabric-management", title: "Fabric Management Hub", component: FabricManagementHub, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/fabric-management/list", title: "Fabric Management List", component: FabricManagement, requiresAuth: true, requiresLayout: true, resource: "catalog" },
  { path: "/manufacturer-portal", title: "Manufacturer Portal", component: ManufacturerPortal, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/manufacturer-portal/queue", title: "Manufacturer Queue", component: ManufacturerQueue, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
  { path: "/manufacturer-portal/job/:id", title: "Job Detail", component: ManufacturerJobDetail, requiresAuth: true, requiresLayout: true, resource: "manufacturing" },
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
