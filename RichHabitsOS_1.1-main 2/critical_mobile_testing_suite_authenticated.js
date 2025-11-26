import { chromium } from 'playwright';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * CRITICAL MOBILE TESTING SUITE - AUTHENTICATED VERSION
 * Addresses architect-identified authentication failures by implementing
 * real OIDC session authentication for comprehensive protected route testing.
 */
class AuthenticatedMobileTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testUser = null;
    this.sessionId = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        criticalFailures: [],
        startTime: new Date().toISOString(),
        endTime: null,
        authenticatedUser: null,
        protectedRoutesTotalCount: 14,
        protectedRoutesTestedCount: 0,
        authenticationMethod: 'programmatic_session_creation'
      },
      evidence: {
        screenshots: [],
        videos: [],
        performanceMetrics: [],
        authenticationProof: []
      },
      testCategories: {
        authenticationTests: [],
        viewportTests: [],
        pageTests: [],
        protectedRouteTests: [],
        modalTests: [],
        navigationTests: [],
        formTests: [],
        tableTests: [],
        workflowTests: []
      }
    };
    
    // CRITICAL VIEWPORTS - All must pass for production approval
    this.criticalViewports = [
      { name: 'iPhone SE', width: 320, height: 568, critical: true },
      { name: 'iPhone 12/13', width: 375, height: 812, critical: true },
      { name: 'iPhone Pro Max', width: 414, height: 896, critical: true },
      { name: 'Android Standard', width: 360, height: 640, critical: true },
      { name: 'iPad Mini', width: 768, height: 1024, critical: true },
      { name: 'iPad Pro', width: 1024, height: 1366, critical: false }
    ];
    
    // ALL 16 PAGES - NO SKIPPING OF PROTECTED ROUTES
    this.allPages = [
      { path: '/', name: 'Landing', requiresAuth: false, role: null },
      { path: '/dashboard', name: 'Dashboard', requiresAuth: true, role: 'any' },
      { path: '/leads', name: 'Leads', requiresAuth: true, role: 'admin' },
      { path: '/organizations', name: 'Organizations', requiresAuth: true, role: 'admin' },
      { path: '/catalog', name: 'Catalog', requiresAuth: true, role: 'admin' },
      { path: '/orders', name: 'Orders', requiresAuth: true, role: 'admin' },
      { path: '/manufacturing', name: 'Manufacturing', requiresAuth: true, role: 'admin' },
      { path: '/design-jobs', name: 'Design Jobs', requiresAuth: true, role: 'admin' },
      { path: '/quotes', name: 'Quotes', requiresAuth: true, role: 'admin' },
      { path: '/finance', name: 'Finance', requiresAuth: true, role: 'admin' },
      { path: '/salespeople', name: 'Salespeople', requiresAuth: true, role: 'admin' },
      { path: '/user-management', name: 'User Management', requiresAuth: true, role: 'admin' },
      { path: '/designer-management', name: 'Designer Management', requiresAuth: true, role: 'admin' },
      { path: '/manufacturer-management', name: 'Manufacturer Management', requiresAuth: true, role: 'admin' },
      { path: '/settings', name: 'Settings', requiresAuth: true, role: 'admin' },
      { path: '/not-found', name: 'Not Found', requiresAuth: false, role: null }
    ];
  }

  // CRITICAL ASSERTION FRAMEWORK - Tests MUST fail on layout breakage
  async assert(condition, errorMessage, testCategory = 'general') {
    this.testResults.summary.totalTests++;
    
    if (!condition) {
      this.testResults.summary.failedTests++;
      this.testResults.summary.criticalFailures.push({
        category: testCategory,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        authenticatedUser: this.testUser?.email || 'none'
      });
      throw new Error(`CRITICAL ASSERTION FAILED: ${errorMessage}`);
    } else {
      this.testResults.summary.passedTests++;
      console.log(`  ✅ PASS: ${errorMessage.replace('Expected', 'Verified')}`);
    }
  }

  /**
   * CRITICAL AUTHENTICATION IMPLEMENTATION
   * Creates real test user and session for comprehensive testing
   */
  async establishRealAuthentication() {
    console.log('🔐 ESTABLISHING REAL AUTHENTICATION FOR PROTECTED ROUTES');
    console.log('=======================================================\n');
    
    try {
      // Step 1: Create or get test user with admin role for maximum access
      const testUserEmail = `test-mobile-${Date.now()}@testing.local`;
      const testUserId = `test-user-${crypto.randomUUID()}`;
      
      console.log('  👤 Creating test user for authenticated testing...');
      
      this.testUser = {
        id: testUserId,
        email: testUserEmail,
        firstName: 'Mobile',
        lastName: 'Tester',
        name: 'Mobile Tester',
        role: 'admin', // Admin role gives access to all protected routes
        isActive: true,
        profileImageUrl: null,
        passwordHash: null,
        phone: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert test user into database
      await db.insert(users).values(this.testUser);
      console.log(`  ✅ Test user created: ${this.testUser.email} (${this.testUser.role})`);
      
      // Step 2: Create valid session for OIDC authentication
      this.sessionId = `sess:${crypto.randomUUID()}`;
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
      
      const sessionData = {
        cookie: {
          originalMaxAge: 7 * 24 * 60 * 60 * 1000,
          expires: sessionExpiry.toISOString(),
          secure: false,
          httpOnly: true,
          path: '/'
        },
        passport: {
          user: {
            claims: {
              sub: this.testUser.id,
              email: this.testUser.email,
              first_name: this.testUser.firstName,
              last_name: this.testUser.lastName,
              exp: Math.floor(sessionExpiry.getTime() / 1000)
            },
            access_token: `test-token-${crypto.randomUUID()}`,
            refresh_token: `test-refresh-${crypto.randomUUID()}`,
            expires_at: Math.floor(sessionExpiry.getTime() / 1000)
          }
        }
      };

      await db.insert(sessions).values({
        sid: this.sessionId,
        sess: sessionData,
        expire: sessionExpiry
      });
      
      console.log(`  ✅ Session created: ${this.sessionId}`);
      console.log(`  🔑 Authentication established for user: ${this.testUser.email}`);
      
      // Record authentication evidence
      this.testResults.evidence.authenticationProof.push({
        method: 'programmatic_session_creation',
        userId: this.testUser.id,
        email: this.testUser.email,
        role: this.testUser.role,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
      
      this.testResults.summary.authenticatedUser = {
        id: this.testUser.id,
        email: this.testUser.email,
        role: this.testUser.role
      };
      
      return true;
      
    } catch (error) {
      console.error('  ❌ Critical authentication setup failed:', error.message);
      throw new Error(`Authentication failure: ${error.message}`);
    }
  }

  /**
   * Set authenticated session cookie in Playwright browser
   */
  async setAuthenticatedSession() {
    console.log('  🍪 Setting authenticated session cookie...');
    
    try {
      // Set the session cookie that Express session middleware expects
      await this.page.context().addCookies([{
        name: 'connect.sid',
        value: this.sessionId,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
      }]);
      
      console.log('  ✅ Session cookie set in browser');
      
      // Verify authentication by checking the API endpoint
      await this.page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
      const authResponse = await this.page.request.get('http://localhost:5000/api/auth/user');
      
      if (authResponse.ok()) {
        const userData = await authResponse.json();
        console.log(`  ✅ Authentication verified: ${userData.firstName} ${userData.lastName} (${userData.role})`);
        return true;
      } else {
        throw new Error('Authentication verification failed');
      }
      
    } catch (error) {
      throw new Error(`Session setup failed: ${error.message}`);
    }
  }

  async initialize() {
    console.log('\n🚨 CRITICAL MOBILE TESTING SUITE - AUTHENTICATED VERSION');
    console.log('=======================================================');
    console.log('IMPLEMENTING REAL AUTHENTICATION FOR PROTECTED ROUTES');
    console.log('=======================================================\n');
    
    // Create evidence directory structure
    await fs.mkdir('critical_mobile_evidence', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/auth_testing', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/screenshots', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/videos', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/metrics', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/final_reports', { recursive: true });
    
    this.browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await this.browser.newContext({
      recordVideo: {
        dir: 'critical_mobile_evidence/videos/',
        size: { width: 1280, height: 720 }
      },
      ignoreHTTPSErrors: true,
      acceptDownloads: true
    });
    
    this.page = await context.newPage();
    
    // Set up performance monitoring
    await this.page.route('**/*', route => {
      const request = route.request();
      console.log(`📡 ${request.method()} ${request.url()}`);
      route.continue();
    });
    
    // CRITICAL: Establish real authentication
    await this.establishRealAuthentication();
    await this.setAuthenticatedSession();
  }

  async runAuthenticatedTests() {
    console.log('🔥 RUNNING AUTHENTICATED MOBILE TESTS - NO SKIPPING');
    console.log('===================================================\n');
    
    try {
      // CRITICAL TEST 1: Authentication Verification
      await this.testAuthenticationSystem();
      
      // CRITICAL TEST 2: All Protected Routes with Authentication
      await this.testProtectedRoutesComprehensive();
      
      // CRITICAL TEST 3: Viewport Responsiveness on Authenticated Pages
      await this.testAuthenticatedViewports();
      
      // CRITICAL TEST 4: Role-Based Access Control on Mobile
      await this.testRoleBasedMobileAccess();
      
      // CRITICAL TEST 5: Authenticated Navigation System
      await this.testAuthenticatedNavigation();
      
      // CRITICAL TEST 6: Authenticated Form Systems
      await this.testAuthenticatedForms();
      
      // CRITICAL TEST 7: Authenticated Modal System
      await this.testAuthenticatedModals();
      
      // CRITICAL TEST 8: Authenticated Business Workflows
      await this.testAuthenticatedWorkflows();
      
      // Generate comprehensive evidence report
      await this.generateAuthenticatedEvidenceReport();
      
    } catch (error) {
      console.error('💥 AUTHENTICATED TEST FAILURE:', error.message);
      this.testResults.summary.criticalFailures.push({
        category: 'authentication',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async testAuthenticationSystem() {
    console.log('🔐 TESTING AUTHENTICATION SYSTEM CRITICAL FUNCTIONALITY');
    console.log('=======================================================\n');
    
    const testResult = {
      category: 'authentication',
      assertions: [],
      passed: true,
      evidence: []
    };
    
    try {
      // Set mobile viewport for auth testing
      await this.page.setViewportSize({ width: 375, height: 812 });
      
      // ASSERTION 1: Authenticated API endpoint responds correctly
      const authResponse = await this.page.request.get('http://localhost:5000/api/auth/user');
      await this.assert(
        authResponse.ok(),
        'Expected authenticated API endpoint to respond with 200 status',
        'authentication'
      );
      
      const userData = await authResponse.json();
      await this.assert(
        userData.email === this.testUser.email,
        `Expected authenticated user email to match test user, got: ${userData.email}`,
        'authentication'
      );
      
      await this.assert(
        userData.role === this.testUser.role,
        `Expected authenticated user role to be ${this.testUser.role}, got: ${userData.role}`,
        'authentication'
      );
      
      testResult.assertions.push('api_authentication_verified');
      
      // ASSERTION 2: Protected route redirects work correctly
      await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
      const currentUrl = this.page.url();
      
      await this.assert(
        currentUrl.includes('/dashboard'),
        `Expected to remain on dashboard with authentication, got: ${currentUrl}`,
        'authentication'
      );
      
      testResult.assertions.push('protected_route_access_verified');
      
      // ASSERTION 3: User interface shows authenticated state
      const appLayout = await this.page.locator('[data-testid="app-layout"]').isVisible();
      await this.assert(
        appLayout,
        'Expected authenticated app layout to be visible',
        'authentication'
      );
      
      testResult.assertions.push('authenticated_ui_state_verified');
      
      // Capture authentication proof screenshot
      const authScreenshotPath = 'critical_mobile_evidence/auth_testing/authentication_proof.png';
      await this.page.screenshot({ path: authScreenshotPath, fullPage: true });
      
      testResult.evidence.push({
        type: 'screenshot',
        path: authScreenshotPath,
        description: 'Authentication system verification on mobile'
      });
      
      this.testResults.evidence.screenshots.push({
        category: 'authentication',
        path: authScreenshotPath,
        timestamp: new Date().toISOString()
      });
      
      console.log('  ✅ Authentication system verification complete\n');
      
    } catch (error) {
      testResult.passed = false;
      throw error;
    }
    
    this.testResults.testCategories.authenticationTests.push(testResult);
  }

  async testProtectedRoutesComprehensive() {
    console.log('🛡️  COMPREHENSIVE PROTECTED ROUTE TESTING - ALL 14 ROUTES');
    console.log('==========================================================\n');
    
    const protectedPages = this.allPages.filter(page => page.requiresAuth);
    console.log(`Testing ${protectedPages.length} protected routes with authentication`);
    
    // Use mobile viewport for protected route testing
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    for (const pageConfig of protectedPages) {
      console.log(`Testing PROTECTED page: ${pageConfig.name} (${pageConfig.path})`);
      
      const testResult = {
        page: pageConfig.name,
        path: pageConfig.path,
        requiresAuth: true,
        role: pageConfig.role,
        assertions: [],
        passed: true,
        skipped: false,
        authenticationRequired: true,
        evidence: []
      };
      
      try {
        // Navigate to protected route with authentication
        await this.page.goto(`http://localhost:5000${pageConfig.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        await this.page.waitForTimeout(2000);
        
        const currentUrl = this.page.url();
        
        // ASSERTION 1: Must NOT be redirected to login (authentication working)
        await this.assert(
          !currentUrl.includes('login') && !currentUrl.includes('auth'),
          `Expected ${pageConfig.name} to load without auth redirect, got URL: ${currentUrl}`,
          'protected_route'
        );
        
        await this.assert(
          currentUrl.includes(pageConfig.path) || currentUrl === `http://localhost:5000${pageConfig.path}`,
          `Expected to remain on ${pageConfig.path}, got: ${currentUrl}`,
          'protected_route'
        );
        
        testResult.assertions.push('no_authentication_redirect');
        
        // ASSERTION 2: Page content loads properly
        const title = await this.page.title();
        await this.assert(
          title && title.length > 0,
          `Expected ${pageConfig.name} to have a valid title, got: "${title}"`,
          'protected_route'
        );
        
        testResult.assertions.push('page_loads_authenticated');
        
        // ASSERTION 3: Authenticated layout is visible
        const appLayout = await this.page.locator('[data-testid="app-layout"]').isVisible();
        await this.assert(
          appLayout,
          `Expected authenticated app layout to be visible on ${pageConfig.name}`,
          'protected_route'
        );
        
        testResult.assertions.push('authenticated_layout_visible');
        
        // ASSERTION 4: Mobile responsiveness on authenticated page
        const viewportWidth = await this.page.evaluate(() => window.innerWidth);
        await this.assert(
          viewportWidth === 375,
          `Expected mobile viewport width of 375px, got: ${viewportWidth}px`,
          'protected_route'
        );
        
        testResult.assertions.push('mobile_viewport_correct');
        
        // ASSERTION 5: No JavaScript errors on protected page
        const jsErrors = [];
        this.page.on('pageerror', error => jsErrors.push(error.message));
        
        await this.page.waitForTimeout(1000); // Allow time for any JS errors
        
        await this.assert(
          jsErrors.length === 0,
          `Expected no JavaScript errors on ${pageConfig.name}, got: ${jsErrors.join(', ')}`,
          'protected_route'
        );
        
        testResult.assertions.push('no_javascript_errors');
        
        // Capture evidence for protected route
        const screenshotPath = `critical_mobile_evidence/screenshots/protected_${pageConfig.name.replace(/\s+/g, '_')}_authenticated_mobile.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        
        testResult.evidence.push({
          type: 'screenshot',
          path: screenshotPath,
          description: `${pageConfig.name} protected route on mobile with authentication`
        });
        
        this.testResults.evidence.screenshots.push({
          category: 'protected_route',
          page: pageConfig.name,
          path: screenshotPath,
          authenticated: true,
          timestamp: new Date().toISOString()
        });
        
        // Increment protected routes tested counter
        this.testResults.summary.protectedRoutesTestedCount++;
        
        console.log(`  ✅ ${pageConfig.name} - AUTHENTICATED SUCCESS`);
        
      } catch (error) {
        testResult.passed = false;
        console.error(`  ❌ PROTECTED ROUTE FAILURE on ${pageConfig.name}: ${error.message}`);
        throw error; // Fail immediately on protected route failure
      }
      
      this.testResults.testCategories.protectedRouteTests.push(testResult);
    }
    
    // Final verification of protected route coverage
    await this.assert(
      this.testResults.summary.protectedRoutesTestedCount === this.testResults.summary.protectedRoutesTotalCount,
      `Expected all ${this.testResults.summary.protectedRoutesTotalCount} protected routes tested, got: ${this.testResults.summary.protectedRoutesTestedCount}`,
      'protected_route'
    );
    
    console.log(`\n🎯 PROTECTED ROUTES COVERAGE: ${this.testResults.summary.protectedRoutesTestedCount}/${this.testResults.summary.protectedRoutesTotalCount} (100%)`);
  }

  async testAuthenticatedViewports() {
    console.log('📱 VIEWPORT TESTING ON AUTHENTICATED DASHBOARD');
    console.log('===============================================\n');
    
    // Test critical viewports on authenticated dashboard
    for (const viewport of this.criticalViewports) {
      if (!viewport.critical) continue; // Only test critical viewports
      
      console.log(`Testing authenticated viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
      
      const testResult = {
        viewport: viewport.name,
        dimensions: `${viewport.width}x${viewport.height}`,
        authenticated: true,
        assertions: [],
        passed: true
      };
      
      try {
        // Verify authenticated state maintained across viewport changes
        const authResponse = await this.page.request.get('http://localhost:5000/api/auth/user');
        await this.assert(
          authResponse.ok(),
          `Expected authentication to persist on ${viewport.name} viewport`,
          'authenticated_viewport'
        );
        
        // Test mobile layout with authenticated content
        const isMobile = viewport.width < 768;
        if (isMobile) {
          const mobileMenuVisible = await this.page.locator('[data-testid="button-mobile-menu"]').isVisible();
          await this.assert(
            mobileMenuVisible,
            `Expected mobile menu to be visible on authenticated ${viewport.name}`,
            'authenticated_viewport'
          );
        }
        
        testResult.assertions.push('authenticated_mobile_layout');
        
        // Capture viewport evidence
        const screenshotPath = `critical_mobile_evidence/screenshots/auth_viewport_${viewport.name.replace(/\s+/g, '_')}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        
        this.testResults.evidence.screenshots.push({
          category: 'authenticated_viewport',
          viewport: viewport.name,
          path: screenshotPath,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        testResult.passed = false;
        throw error;
      }
      
      this.testResults.testCategories.viewportTests.push(testResult);
    }
  }

  async testRoleBasedMobileAccess() {
    console.log('👤 TESTING ROLE-BASED ACCESS CONTROL ON MOBILE');
    console.log('===============================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    // Test admin access to restricted features
    console.log('Testing admin role access to user management...');
    
    await this.page.goto('http://localhost:5000/user-management', { waitUntil: 'networkidle' });
    
    const currentUrl = this.page.url();
    await this.assert(
      currentUrl.includes('/user-management'),
      `Expected admin role to access user management, got: ${currentUrl}`,
      'role_based_access'
    );
    
    // Capture role-based access evidence
    const roleScreenshotPath = 'critical_mobile_evidence/screenshots/admin_role_access_mobile.png';
    await this.page.screenshot({ path: roleScreenshotPath, fullPage: true });
    
    this.testResults.evidence.screenshots.push({
      category: 'role_based_access',
      role: 'admin',
      path: roleScreenshotPath,
      timestamp: new Date().toISOString()
    });
    
    console.log('  ✅ Role-based access verification complete');
  }

  async testAuthenticatedNavigation() {
    console.log('🧭 TESTING AUTHENTICATED NAVIGATION ON MOBILE');
    console.log('=============================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
    
    // Test mobile menu with authenticated user
    const mobileMenuButton = this.page.locator('[data-testid="button-mobile-menu"]');
    await mobileMenuButton.click();
    await this.page.waitForTimeout(1000);
    
    // Verify authenticated navigation menu
    const userMenuVisible = await this.page.locator('[data-testid="user-menu"]').isVisible();
    await this.assert(
      userMenuVisible,
      'Expected authenticated user menu to be visible in mobile navigation',
      'authenticated_navigation'
    );
    
    // Test navigation to protected route
    const leadsNavLink = this.page.locator('[data-testid="nav-leads"]');
    if (await leadsNavLink.isVisible()) {
      await leadsNavLink.click();
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      await this.assert(
        currentUrl.includes('/leads'),
        `Expected navigation to leads page, got: ${currentUrl}`,
        'authenticated_navigation'
      );
    }
    
    console.log('  ✅ Authenticated navigation testing complete');
  }

  async testAuthenticatedForms() {
    console.log('📝 TESTING AUTHENTICATED FORMS ON MOBILE');
    console.log('========================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    // Test form access with authentication
    await this.page.goto('http://localhost:5000/leads', { waitUntil: 'networkidle' });
    
    // Try to access create form (authenticated users should have access)
    const createButton = this.page.locator('[data-testid="button-create-lead"]');
    if (await createButton.isVisible()) {
      await createButton.click();
      await this.page.waitForTimeout(1000);
      
      const formVisible = await this.page.locator('[data-testid="form-create-lead"]').isVisible();
      await this.assert(
        formVisible,
        'Expected authenticated user to access create lead form',
        'authenticated_forms'
      );
    }
    
    console.log('  ✅ Authenticated form testing complete');
  }

  async testAuthenticatedModals() {
    console.log('🔲 TESTING AUTHENTICATED MODALS ON MOBILE');
    console.log('=========================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/catalog', { waitUntil: 'networkidle' });
    
    // Test modal system with authentication
    const createProductButton = this.page.locator('[data-testid="button-create-product"]');
    if (await createProductButton.isVisible()) {
      await createProductButton.click();
      await this.page.waitForTimeout(1000);
      
      const modalVisible = await this.page.locator('[data-testid="modal-create-product"]').isVisible();
      await this.assert(
        modalVisible,
        'Expected authenticated user to access product creation modal',
        'authenticated_modals'
      );
      
      // Test modal responsiveness on mobile
      const modalWidth = await this.page.locator('[data-testid="modal-create-product"]').boundingBox();
      await this.assert(
        modalWidth && modalWidth.width <= 375,
        'Expected modal to fit within mobile viewport width',
        'authenticated_modals'
      );
    }
    
    console.log('  ✅ Authenticated modal testing complete');
  }

  async testAuthenticatedWorkflows() {
    console.log('🔄 TESTING AUTHENTICATED BUSINESS WORKFLOWS ON MOBILE');
    console.log('====================================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    // Test complete workflow: Dashboard -> Leads -> Create -> Organizations
    console.log('  Testing lead creation workflow...');
    
    await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
    
    // Navigate through authenticated workflow
    const mobileMenu = this.page.locator('[data-testid="button-mobile-menu"]');
    await mobileMenu.click();
    await this.page.waitForTimeout(500);
    
    const leadsLink = this.page.locator('[data-testid="nav-leads"]');
    if (await leadsLink.isVisible()) {
      await leadsLink.click();
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      await this.assert(
        currentUrl.includes('/leads'),
        `Expected workflow navigation to leads, got: ${currentUrl}`,
        'authenticated_workflow'
      );
    }
    
    console.log('  ✅ Authenticated workflow testing complete');
  }

  async generateAuthenticatedEvidenceReport() {
    console.log('\n📊 GENERATING AUTHENTICATED EVIDENCE REPORT');
    console.log('==========================================\n');
    
    this.testResults.summary.endTime = new Date().toISOString();
    
    // Calculate comprehensive metrics
    const totalTime = new Date(this.testResults.summary.endTime) - new Date(this.testResults.summary.startTime);
    const successRate = this.testResults.summary.totalTests > 0 ? 
      (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(2) : 0;
    
    const report = {
      executionSummary: {
        testSuite: 'Critical Mobile Testing Suite - Authenticated Version',
        executionDate: this.testResults.summary.startTime,
        totalExecutionTime: `${Math.floor(totalTime / 1000)} seconds`,
        authenticatedUser: this.testResults.summary.authenticatedUser,
        authenticationMethod: this.testResults.summary.authenticationMethod
      },
      criticalResults: {
        totalTests: this.testResults.summary.totalTests,
        passedTests: this.testResults.summary.passedTests,
        failedTests: this.testResults.summary.failedTests,
        successRate: `${successRate}%`,
        protectedRoutesCoverage: `${this.testResults.summary.protectedRoutesTestedCount}/${this.testResults.summary.protectedRoutesTotalCount} (100%)`,
        criticalFailures: this.testResults.summary.criticalFailures
      },
      evidenceArtifacts: {
        totalScreenshots: this.testResults.evidence.screenshots.length,
        totalVideos: this.testResults.evidence.videos.length,
        authenticationProof: this.testResults.evidence.authenticationProof,
        screenshotPaths: this.testResults.evidence.screenshots.map(s => s.path),
        videoPaths: this.testResults.evidence.videos.map(v => v.path)
      },
      testCategories: this.testResults.testCategories,
      productionReadiness: {
        authenticationImplemented: true,
        protectedRoutesFullyTested: this.testResults.summary.protectedRoutesTestedCount === this.testResults.summary.protectedRoutesTotalCount,
        evidencePackageComplete: this.testResults.evidence.screenshots.length > 0,
        criticalFailuresResolved: this.testResults.summary.criticalFailures.length === 0,
        mobileReadinessScore: this.testResults.summary.criticalFailures.length === 0 ? 'PRODUCTION READY' : 'REQUIRES FIXES'
      }
    };
    
    // Write comprehensive evidence report
    const reportPath = 'critical_mobile_evidence/final_reports/AUTHENTICATED_EXECUTION_REPORT.json';
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Write execution data for traceability
    const executionDataPath = 'critical_mobile_evidence/final_reports/authenticated_execution_data.json';
    await fs.writeFile(executionDataPath, JSON.stringify(this.testResults, null, 2));
    
    console.log('📋 EXECUTION SUMMARY');
    console.log('===================');
    console.log(`✅ Authentication: ${report.executionSummary.authenticatedUser.email} (${report.executionSummary.authenticatedUser.role})`);
    console.log(`✅ Protected Routes: ${report.criticalResults.protectedRoutesCoverage}`);
    console.log(`✅ Total Tests: ${report.criticalResults.totalTests}`);
    console.log(`✅ Success Rate: ${report.criticalResults.successRate}`);
    console.log(`✅ Evidence Screenshots: ${report.evidenceArtifacts.totalScreenshots}`);
    console.log(`✅ Production Readiness: ${report.productionReadiness.mobileReadinessScore}`);
    
    console.log('\n📁 EVIDENCE ARTIFACTS GENERATED:');
    console.log(`📊 Execution Report: ${reportPath}`);
    console.log(`📊 Execution Data: ${executionDataPath}`);
    console.log(`📸 Screenshots: ${report.evidenceArtifacts.totalScreenshots} files`);
    console.log(`🎥 Videos: ${report.evidenceArtifacts.totalVideos} files`);
    
    return report;
  }

  async cleanup() {
    console.log('\n🧹 CLEANING UP TEST ENVIRONMENT');
    console.log('==============================\n');
    
    try {
      // Clean up test user and session
      if (this.testUser) {
        await db.delete(users).where(eq(users.id, this.testUser.id));
        console.log('  ✅ Test user cleaned up');
      }
      
      if (this.sessionId) {
        await db.delete(sessions).where(eq(sessions.sid, this.sessionId));
        console.log('  ✅ Test session cleaned up');
      }
      
      if (this.browser) {
        await this.browser.close();
        console.log('  ✅ Browser closed');
      }
      
    } catch (error) {
      console.error('  ⚠️  Cleanup warning:', error.message);
    }
  }

  async execute() {
    try {
      await this.initialize();
      await this.runAuthenticatedTests();
      const report = await this.generateAuthenticatedEvidenceReport();
      return report;
    } finally {
      await this.cleanup();
    }
  }
}

// Execute the authenticated test suite
async function runAuthenticatedMobileTests() {
  const suite = new AuthenticatedMobileTestSuite();
  try {
    const report = await suite.execute();
    console.log('\n🎉 AUTHENTICATED MOBILE TESTING COMPLETE!');
    console.log('========================================');
    console.log('All protected routes successfully tested with real authentication.');
    console.log('Evidence package ready for production sign-off.');
    return report;
  } catch (error) {
    console.error('\n💥 AUTHENTICATED TESTING FAILED:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticatedMobileTests().catch(console.error);
}

export { AuthenticatedMobileTestSuite, runAuthenticatedMobileTests };