import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../replitAuth";
import { storage } from "../storage";
import { seedPermissions } from "../seedPermissions";

// Import all route modules
import { registerHealthRoutes } from "./health.routes";
import { registerAuthRoutes } from "./auth.routes";
import { registerSystemRoutes } from "./system.routes";
import { registerInvitationRoutes } from "./invitations.routes";
import { registerContactRoutes } from "./contacts.routes";
import { registerSalespeopleRoutes } from "./salespeople.routes";
import { registerOrganizationRoutes } from "./organizations.routes";
import { registerLeadRoutes } from "./leads.routes";
import { registerUserRoutes } from "./users.routes";
import { registerQuoteRoutes } from "./quotes.routes";
import { registerDesignRoutes } from "./design.routes";
import { registerManufacturingRoutes } from "./manufacturing.routes";
import { registerFinanceRoutes } from "./finance.routes";
import { registerAnalyticsRoutes } from "./analytics.routes";
import { registerOrdersRoutes } from "./orders.routes";
import { registerCatalogRoutes } from "./catalog.routes";
import { registerEventRoutes } from "./events.routes";
import { registerManufacturerRoutes } from "./manufacturer.routes";
import { registerTaskRoutes } from "./tasks.routes";
import { registerPermissionRoutes } from "./permissions.routes";
import { registerSalesResourcesRoutes } from "./sales-resources.routes";
import { registerUploadRoutes } from "./upload.routes";
import { registerConfigRoutes } from "./config.routes";
import { registerTeamStoresRoutes } from "./team-stores.routes";
import { registerOrderTrackingRoutes } from "./order-tracking.routes";
import { registerFinancialMatchingRoutes } from "./financial-matching.routes";
import { registerManufacturerPortalRoutes } from "./manufacturer-portal.routes";
import { registerRequestsRoutes } from "./requests.routes";
import { registerAIRoutes } from "./ai.routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware must be set up first
  await setupAuth(app);

  // Auto-seed permissions if roles or resources are missing/outdated
  try {
    const [roles, resources] = await Promise.all([
      storage.getRoles(),
      storage.getResources()
    ]);
    
    // Required system roles that must exist
    const requiredRoles = ['admin', 'sales', 'designer', 'ops', 'manufacturer', 'finance'];
    const existingRoleNames = new Set(roles.map(r => r.name));
    const missingRoles = requiredRoles.filter(r => !existingRoleNames.has(r));
    
    // Expected resources (must match seedPermissions.ts)
    const expectedResources = [
      'dashboard', 'leads', 'organizations', 'contacts', 'catalog', 'designJobs', 'orders',
      'manufacturing', 'salespeople', 'settings', 'users', 'designerManagement',
      'manufacturerManagement', 'userManagement', 'finance', 'quotes', 'salesAnalytics',
      'leadsTracker', 'designPortfolio', 'designResources', 'sizeChecker', 'capacityDashboard',
      'orderSpecifications', 'systemAnalytics', 'connectionHealth', 'events', 'tasks', 'teamStores'
    ];
    const existingResourceNames = new Set(resources.map(r => r.name));
    const missingResources = expectedResources.filter(r => !existingResourceNames.has(r));
    
    const needsSeeding = missingRoles.length > 0 || missingResources.length > 0;
    
    if (needsSeeding) {
      console.log('🌱 Missing or outdated roles/resources - auto-seeding permissions...');
      console.log(`   - Roles: ${roles.length} found (missing: ${missingRoles.join(', ') || 'none'})`);
      console.log(`   - Resources: ${resources.length} found (missing: ${missingResources.join(', ') || 'none'})`);
      await seedPermissions(storage);
      console.log('✅ Permissions seeded successfully');
    } else {
      console.log(`✅ Found ${roles.length} roles and ${resources.length} resources in database`);
    }
  } catch (error) {
    console.error('❌ Error checking/seeding permissions:', error);
  }

  // Register health check routes (BEFORE auth - no authentication required)
  registerHealthRoutes(app);
  
  // Register all route modules
  registerAuthRoutes(app);
  registerSystemRoutes(app);
  registerInvitationRoutes(app);
  registerContactRoutes(app);
  registerSalespeopleRoutes(app);
  registerOrganizationRoutes(app);
  registerLeadRoutes(app);
  registerUserRoutes(app);
  registerQuoteRoutes(app);
  registerDesignRoutes(app);
  registerManufacturingRoutes(app);
  registerFinanceRoutes(app);
  registerAnalyticsRoutes(app);
  registerOrdersRoutes(app);
  registerCatalogRoutes(app);
  registerEventRoutes(app);
  registerManufacturerRoutes(app);
  registerTaskRoutes(app);
  registerPermissionRoutes(app);
  registerSalesResourcesRoutes(app);
  registerUploadRoutes(app);
  registerConfigRoutes(app);
  registerTeamStoresRoutes(app);
  registerOrderTrackingRoutes(app);
  registerFinancialMatchingRoutes(app);
  registerManufacturerPortalRoutes(app);
  registerRequestsRoutes(app);
  registerAIRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
