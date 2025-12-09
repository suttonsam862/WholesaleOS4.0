import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Leads from "@/pages/leads";
import CompletedLeads from "@/pages/completed-leads";
import Organizations from "@/pages/organizations";
import Contacts from "@/pages/contacts";
import Catalog from "@/pages/catalog";
import CategoryPage from "@/pages/category-page";
import CategoryProducts from "@/pages/category-products";
import ProductVariants from "@/pages/product-variants";
import VariantDesignArchive from "@/pages/variant-design-archive";
import ArchivedCategories from "@/pages/archived-categories";
import ArchivedProducts from "@/pages/archived-products";
import ArchivedVariants from "@/pages/archived-variants";
import DesignJobs from "@/pages/design-jobs";
import DesignJobDetail from "@/pages/design-job-detail";
import Orders from "@/pages/orders";
import Manufacturing from "@/pages/manufacturing";
import TeamStores from "@/pages/team-stores";
import Salespeople from "@/pages/salespeople";
import Settings from "@/pages/settings";
import DesignerManagement from "@/pages/designer-management";
import ManufacturerManagement from "@/pages/manufacturer-management";
import UserManagement from "@/pages/user-management";
import Finance from "@/pages/finance";
import Quotes from "@/pages/quotes";
import TestUsers from "@/pages/test-users";
import PermissionManagement from "@/pages/permission-management";
import AccountSetup from "@/pages/account-setup";
import LocalLogin from "@/pages/local-login";
import Notifications from "@/pages/notifications";
import { TestModeProvider } from "@/contexts/TestModeContext";
import { TestModeBanner } from "@/components/TestModeBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SalesAnalytics } from "@/pages/sales-analytics";
import { SalesTracker } from "@/pages/sales-tracker";
import SalesResources from "@/pages/sales-resources";
import { DesignPortfolio } from "@/pages/design-portfolio";
import { DesignResources } from "@/pages/design-resources";
import { SizeChecker } from "@/pages/production-schedule";
import { CapacityDashboard } from "@/pages/capacity-dashboard";
import { OrderSpecifications } from "@/pages/order-specifications";
import { SystemAnalytics } from "@/pages/system-analytics";
import { ConnectionHealth } from "@/pages/connection-health";
import Events from "@/pages/events";
import EventDetail from "@/pages/event-detail";
import EventWizard from "@/pages/event-wizard";
import { ManufacturerLineItems } from "@/pages/manufacturer-line-items";
import Tasks from "@/pages/tasks";
import OrderForms from "@/pages/order-forms";
import CustomerOrderForm from "@/pages/customer-order-form";
import CustomerPortal from "@/pages/customer-portal";
import OrderMap from "@/pages/order-map";
import PipelineView from "@/pages/pipeline-view";
import FabricManagement from "@/pages/fabric-management";
import { AnimatePresence } from "framer-motion";

function Router() {
  const { isAuthenticated, isLoading, isError, error } = useAuth();
  const [location] = useLocation();

  // Development mode logging for router state
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 [Router] Auth state:', {
      isAuthenticated,
      isLoading,
      isError,
      errorMessage: error?.message,
      timestamp: new Date().toISOString()
    });
  }

  // Show loading animation while checking authentication
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // Show landing page if not authenticated or if auth check failed
  if (!isAuthenticated || isError) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/local-login" component={LocalLogin} /> {/* Add local login route */}
        <Route path="/setup-account" component={AccountSetup} />
        <Route path="/admin/test-users" component={TestUsers} /> {/* Test mode access without auth */}
        <Route path="/customer-order-form/:id" component={CustomerOrderForm} /> {/* Public order form for customers */}
        <Route path="/customer-portal/:id" component={CustomerPortal} /> {/* Public customer portal */}
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated routes with layout
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/">
          <AppLayout title="Dashboard">
            <Dashboard />
          </AppLayout>
        </Route>

        <Route path="/leads">
          <AppLayout title="Leads">
            <Leads />
          </AppLayout>
        </Route>

        <Route path="/completed-leads">
          <AppLayout title="Completed Leads">
            <CompletedLeads />
          </AppLayout>
        </Route>

        <Route path="/organizations">
          <AppLayout title="Organizations">
            <Organizations />
          </AppLayout>
        </Route>

        <Route path="/contacts">
          <AppLayout title="Contacts">
            <Contacts />
          </AppLayout>
        </Route>

        <Route path="/catalog">
          <AppLayout title="Catalog">
            <Catalog />
          </AppLayout>
        </Route>

        <Route path="/catalog/category/:categoryId">
          <AppLayout title="Category Products">
            <CategoryProducts />
          </AppLayout>
        </Route>

        <Route path="/catalog/product/:productId">
          <AppLayout title="Product Variants">
            <ProductVariants />
          </AppLayout>
        </Route>

        <Route path="/catalog/variant/:variantId/designs">
          <AppLayout title="Design Archive">
            <VariantDesignArchive />
          </AppLayout>
        </Route>

        <Route path="/admin/catalog">
          <AppLayout title="Catalog Admin">
            <CategoryPage />
          </AppLayout>
        </Route>

        <Route path="/catalog/archived/categories">
          <AppLayout title="Archived Categories">
            <ArchivedCategories />
          </AppLayout>
        </Route>

        <Route path="/catalog/archived/products">
          <AppLayout title="Archived Products">
            <ArchivedProducts />
          </AppLayout>
        </Route>

        <Route path="/catalog/archived/variants">
          <AppLayout title="Archived Variants">
            <ArchivedVariants />
          </AppLayout>
        </Route>

        <Route path="/design-jobs">
          <AppLayout title="Design Jobs">
            <DesignJobs />
          </AppLayout>
        </Route>
        <Route path="/design-jobs/:id">
          <AppLayout title="Design Job Detail">
            <DesignJobDetail />
          </AppLayout>
        </Route>

        <Route path="/orders">
          <AppLayout title="Orders">
            <Orders />
          </AppLayout>
        </Route>

        <Route path="/manufacturing">
          <AppLayout title="Manufacturing">
            <Manufacturing />
          </AppLayout>
        </Route>

        <Route path="/team-stores">
          <AppLayout title="Team Stores">
            <TeamStores />
          </AppLayout>
        </Route>

        <Route path="/manufacturer/line-items">
          <AppLayout title="My Line Items">
            <ManufacturerLineItems />
          </AppLayout>
        </Route>

        {/* Event Routes */}
        <Route path="/events">
          <AppLayout title="Events">
            <Events />
          </AppLayout>
        </Route>

        <Route path="/events/:id/wizard">
          <EventWizard />
        </Route>

        <Route path="/events/:id">
          <AppLayout title="Event Detail">
            <EventDetail />
          </AppLayout>
        </Route>

        <Route path="/salespeople">
          <AppLayout title="Sales Team">
            <Salespeople />
          </AppLayout>
        </Route>

        <Route path="/settings">
          <AppLayout title="Settings">
            <Settings />
          </AppLayout>
        </Route>

        <Route path="/notifications">
          <AppLayout title="Notifications">
            <Notifications />
          </AppLayout>
        </Route>

        <Route path="/designer-management">
          <AppLayout title="Designer Management">
            <DesignerManagement />
          </AppLayout>
        </Route>

        <Route path="/manufacturer-management">
          <AppLayout title="Manufacturer Management">
            <ManufacturerManagement />
          </AppLayout>
        </Route>

        <Route path="/user-management">
          <AppLayout title="User Management">
            <UserManagement />
          </AppLayout>
        </Route>

        <Route path="/finance">
          <AppLayout title="Finance">
            <Finance />
          </AppLayout>
        </Route>

        <Route path="/quotes">
          <AppLayout title="Quote Generator">
            <Quotes />
          </AppLayout>
        </Route>

        <Route path="/admin/test-users">
          <AppLayout title="Test User Access">
            <TestUsers />
          </AppLayout>
        </Route>

        <Route path="/admin/permissions">
          <AppLayout title="Permission Management">
            <PermissionManagement />
          </AppLayout>
        </Route>

        {/* Sales Role Pages */}
        <Route path="/sales-analytics">
          <AppLayout title="Sales Analytics">
            <SalesAnalytics />
          </AppLayout>
        </Route>

        <Route path="/sales-tracker">
          <AppLayout title="Sales Tracker">
            <SalesTracker />
          </AppLayout>
        </Route>

        <Route path="/sales-resources">
          <AppLayout title="Sales Resources">
            <SalesResources />
          </AppLayout>
        </Route>

        {/* Designer Role Pages */}
        <Route path="/design-portfolio">
          <AppLayout title="Design Portfolio">
            <DesignPortfolio />
          </AppLayout>
        </Route>

        <Route path="/design-resources">
          <AppLayout title="Design Resources">
            <DesignResources />
          </AppLayout>
        </Route>

        {/* Ops Role Pages */}
        <Route path="/size-checker">
          <AppLayout title="Size Checker">
            <SizeChecker />
          </AppLayout>
        </Route>

        {/* Manufacturer Role Pages */}
        <Route path="/capacity-dashboard">
          <AppLayout title="Capacity Dashboard">
            <CapacityDashboard />
          </AppLayout>
        </Route>

        <Route path="/order-specifications">
          <AppLayout title="Order Specifications">
            <OrderSpecifications />
          </AppLayout>
        </Route>

        {/* Admin Role Pages */}
        <Route path="/system-analytics">
          <AppLayout title="System Analytics">
            <SystemAnalytics />
          </AppLayout>
        </Route>

        <Route path="/connection-health">
          <AppLayout title="Connection Health">
            <ConnectionHealth />
          </AppLayout>
        </Route>

        {/* Stream Layer / Pipeline System (Admin & Ops) */}
        <Route path="/order-map">
          <AppLayout title="Order Map">
            <OrderMap />
          </AppLayout>
        </Route>

        <Route path="/pipeline">
          <AppLayout title="Pipeline View">
            <PipelineView />
          </AppLayout>
        </Route>

        <Route path="/tasks">
          <AppLayout title="Tasks">
            <Tasks />
          </AppLayout>
        </Route>

        <Route path="/order-forms">
          <AppLayout title="Order Forms">
            <OrderForms />
          </AppLayout>
        </Route>

        <Route path="/customer-order-form/:id">
          <CustomerOrderForm />
        </Route>

        <Route path="/fabric-management">
          <AppLayout title="Fabric Management">
            <FabricManagement />
          </AppLayout>
        </Route>

        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TestModeProvider>
          <TooltipProvider>
            <TestModeBanner />
            <Toaster />
            <Router />
          </TooltipProvider>
        </TestModeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;