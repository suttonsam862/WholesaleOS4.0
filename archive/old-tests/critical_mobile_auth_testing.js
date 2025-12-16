import { chromium } from 'playwright';
import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * CRITICAL MOBILE AUTHENTICATION TESTING SUITE
 * Final implementation to test all 14 protected routes with real authentication
 * and generate verifiable evidence for production sign-off.
 */
class CriticalMobileAuthSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.authenticatedUser = null;
    this.sessionEstablished = false;
    
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
        authenticationEstablished: false,
        skipProtectedRoutes: false // CRITICAL: No more skipping!
      },
      evidence: {
        screenshots: [],
        videos: [],
        authenticationProof: [],
        executionLogs: []
      },
      testCategories: {
        authenticationTests: [],
        protectedRouteTests: [],
        viewportTests: [],
        mobileLayoutTests: []
      }
    };
    
    // All 14 protected routes that MUST be tested
    this.protectedRoutes = [
      { path: '/dashboard', name: 'Dashboard', role: 'any' },
      { path: '/leads', name: 'Leads', role: 'admin' },
      { path: '/organizations', name: 'Organizations', role: 'admin' },
      { path: '/catalog', name: 'Catalog', role: 'admin' },
      { path: '/orders', name: 'Orders', role: 'admin' },
      { path: '/manufacturing', name: 'Manufacturing', role: 'admin' },
      { path: '/design-jobs', name: 'Design Jobs', role: 'admin' },
      { path: '/quotes', name: 'Quotes', role: 'admin' },
      { path: '/finance', name: 'Finance', role: 'admin' },
      { path: '/salespeople', name: 'Salespeople', role: 'admin' },
      { path: '/user-management', name: 'User Management', role: 'admin' },
      { path: '/designer-management', name: 'Designer Management', role: 'admin' },
      { path: '/manufacturer-management', name: 'Manufacturer Management', role: 'admin' },
      { path: '/settings', name: 'Settings', role: 'admin' }
    ];
    
    // Critical mobile viewports for testing
    this.mobileViewports = [
      { name: 'iPhone SE', width: 320, height: 568 },
      { name: 'iPhone 12/13', width: 375, height: 812 },
      { name: 'iPhone Pro Max', width: 414, height: 896 },
      { name: 'Android Standard', width: 360, height: 640 }
    ];
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    
    this.testResults.evidence.executionLogs.push({
      timestamp,
      level,
      message,
      authenticatedUser: this.authenticatedUser?.email || 'none'
    });
  }

  async assert(condition, errorMessage, testCategory = 'general') {
    this.testResults.summary.totalTests++;
    
    if (!condition) {
      this.testResults.summary.failedTests++;
      this.testResults.summary.criticalFailures.push({
        category: testCategory,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        authenticatedUser: this.authenticatedUser?.email || 'none'
      });
      await this.log(`ASSERTION FAILED: ${errorMessage}`, 'ERROR');
      throw new Error(`CRITICAL ASSERTION FAILED: ${errorMessage}`);
    } else {
      this.testResults.summary.passedTests++;
      await this.log(`ASSERTION PASSED: ${errorMessage.replace('Expected', 'Verified')}`, 'SUCCESS');
    }
  }

  async initialize() {
    await this.log('🚨 INITIALIZING CRITICAL MOBILE AUTHENTICATION TESTING SUITE');
    await this.log('============================================================');
    
    // Create evidence directories
    await fs.mkdir('critical_mobile_evidence', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/auth_testing', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/screenshots', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/videos', { recursive: true });
    await fs.mkdir('critical_mobile_evidence/final_reports', { recursive: true });
    
    // Launch browser with video recording
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
    
    // Set up request logging
    this.page.on('request', request => {
      this.log(`📡 REQUEST: ${request.method()} ${request.url()}`, 'DEBUG');
    });
    
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.log(`❌ RESPONSE ERROR: ${response.status()} ${response.url()}`, 'ERROR');
      }
    });
    
    await this.log('✅ Browser and context initialized');
  }

  /**
   * CRITICAL: Establish DETERMINISTIC authentication for testing
   * NO MORE MANUAL LOGIN OR SESSION DEPENDENCY
   */
  async establishAuthentication() {
    await this.log('🔐 ESTABLISHING DETERMINISTIC AUTHENTICATION FOR PROTECTED ROUTE TESTING');
    await this.log('================================================================================');
    
    try {
      // STEP 1: Set up deterministic authentication using test auth system
      await this.log('📋 Step 1: Setting up test user and session');
      
      // Create test authentication via API call to our test auth endpoint
      const setupResponse = await this.page.request.post('http://localhost:5000/api/test/auth/setup', {
        data: { 
          testMode: true,
          deterministicAuth: true 
        }
      });
      
      if (!setupResponse.ok()) {
        throw new Error(`Failed to setup test authentication: ${setupResponse.status()}`);
      }
      
      const authData = await setupResponse.json();
      
      // STEP 2: Inject session cookie into browser context
      await this.log('📋 Step 2: Injecting authentication session cookie');
      await this.log(`🔐 Cookie value to inject: ${authData.sessionCookie}`);
      
      // CRITICAL FIX: Inject the properly signed session cookie
      await this.page.context().addCookies([{
        name: 'connect.sid',
        value: authData.sessionCookie, // Now contains just the signed session ID
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false // localhost doesn't use HTTPS  
      }]);
      
      await this.log('✅ Session cookie injected successfully');
      
      // STEP 3: Navigate to app and verify authentication
      await this.log('📋 Step 3: Verifying deterministic authentication');
      
      await this.page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
      
      // Verify authentication worked
      const authVerifyResponse = await this.page.request.get('http://localhost:5000/api/auth/user');
      
      if (!authVerifyResponse.ok()) {
        throw new Error(`Authentication verification failed: ${authVerifyResponse.status()}`);
      }
      
      this.authenticatedUser = await authVerifyResponse.json();
      
      // CRITICAL VERIFICATION: Must have admin role for all protected routes
      if (this.authenticatedUser.role !== 'admin') {
        throw new Error(`Test user must have admin role, got: ${this.authenticatedUser.role}`);
      }
      
      this.sessionEstablished = true;
      this.testResults.summary.authenticationEstablished = true;
      this.testResults.summary.authenticatedUser = {
        id: this.authenticatedUser.id,
        email: this.authenticatedUser.email,
        role: this.authenticatedUser.role,
        deterministicAuth: true
      };
      
      await this.log(`✅ DETERMINISTIC AUTHENTICATION SUCCESSFUL: ${this.authenticatedUser.firstName} ${this.authenticatedUser.lastName} (${this.authenticatedUser.role})`);
      
      // Record authentication proof with deterministic verification
      this.testResults.evidence.authenticationProof.push({
        method: 'deterministic_session_injection',
        userId: this.authenticatedUser.id,
        email: this.authenticatedUser.email,
        role: this.authenticatedUser.role,
        sessionData: authData.sessionId,
        timestamp: new Date().toISOString(),
        verified: true,
        deterministicAuth: true
      });
      
      // STEP 4: Final verification that we can access protected content
      await this.log('📋 Step 4: Final authentication verification');
      
      await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('login') || currentUrl.includes('auth')) {
        throw new Error(`Authentication failed - redirected to login page: ${currentUrl}`);
      }
      
      await this.log('✅ DETERMINISTIC AUTHENTICATION FULLY VERIFIED AND READY');
      
      return true;
      
    } catch (error) {
      await this.log(`❌ DETERMINISTIC AUTHENTICATION FAILED: ${error.message}`, 'ERROR');
      this.sessionEstablished = false;
      this.testResults.summary.authenticationEstablished = false;
      
      // FAIL FAST: Cannot proceed without deterministic authentication
      throw new Error(`CRITICAL FAILURE: Deterministic authentication failed - ${error.message}`);
    }
  }

  /**
   * CRITICAL: Verify authentication before each route test
   * Ensures deterministic authentication is maintained
   */
  async verifyAuthenticationBeforeRoute(routeName) {
    await this.log(`🔍 Verifying authentication before testing ${routeName}`);
    
    try {
      // Verify session is still valid
      const authVerifyResponse = await this.page.request.get('http://localhost:5000/api/test/auth/verify');
      
      if (!authVerifyResponse.ok()) {
        throw new Error(`Authentication verification failed with status: ${authVerifyResponse.status()}`);
      }
      
      const authData = await authVerifyResponse.json();
      
      if (!authData.authenticated) {
        throw new Error('Authentication verification failed - not authenticated');
      }
      
      if (!authData.isTestUser) {
        throw new Error('Authentication verification failed - not using test user');
      }
      
      if (!authData.canAccessProtectedRoutes) {
        throw new Error('Authentication verification failed - insufficient permissions for protected routes');
      }
      
      // Verify user data matches expected test user
      if (authData.user.role !== 'admin') {
        throw new Error(`Authentication verification failed - expected admin role, got: ${authData.user.role}`);
      }
      
      await this.log(`✅ Authentication verified for ${routeName} - User: ${authData.user.email} (${authData.user.role})`);
      
      return {
        verified: true,
        user: authData.user,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await this.log(`❌ Authentication verification failed for ${routeName}: ${error.message}`, 'ERROR');
      throw new Error(`CRITICAL AUTHENTICATION FAILURE before ${routeName}: ${error.message}`);
    }
  }

  /**
   * CRITICAL: Test all protected routes with authentication
   * NO SKIPPING - This is the main fix for the architect's concerns
   */
  async testAllProtectedRoutes() {
    await this.log('🛡️  TESTING ALL 14 PROTECTED ROUTES - NO SKIPPING ALLOWED');
    await this.log('===========================================================');
    
    if (!this.sessionEstablished || !this.authenticatedUser) {
      const errorMessage = 'CRITICAL FAILURE: Cannot test protected routes without authentication';
      await this.log(errorMessage, 'ERROR');
      throw new Error(errorMessage);
    }
    
    // Test each protected route on mobile viewport
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    for (const route of this.protectedRoutes) {
      await this.log(`📱 Testing PROTECTED route: ${route.name} (${route.path})`);
      
      const testResult = {
        route: route.name,
        path: route.path,
        requiredRole: route.role,
        userRole: this.authenticatedUser.role,
        assertions: [],
        passed: true,
        evidence: [],
        authenticationVerifications: [],
        timestamp: new Date().toISOString()
      };
      
      try {
        // STEP 1: CRITICAL AUTHENTICATION VERIFICATION before route testing
        await this.log(`🔐 Step 1: Verifying authentication before ${route.name}`);
        const authVerification = await this.verifyAuthenticationBeforeRoute(route.name);
        testResult.authenticationVerifications.push(authVerification);
        
        // STEP 2: Navigate to protected route
        await this.log(`🗺️  Step 2: Navigating to ${route.path}`);
        await this.page.goto(`http://localhost:5000${route.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        await this.page.waitForTimeout(2000); // Allow page to load completely
        
        const currentUrl = this.page.url();
        
        // CRITICAL ASSERTION 1: Must not be redirected to login
        await this.assert(
          !currentUrl.includes('login') && !currentUrl.includes('auth'),
          `Expected ${route.name} to load without auth redirect, got URL: ${currentUrl}`,
          'protected_route'
        );
        testResult.assertions.push('no_auth_redirect');
        
        // CRITICAL ASSERTION 2: Must be on correct route
        await this.assert(
          currentUrl.includes(route.path) || currentUrl === `http://localhost:5000${route.path}`,
          `Expected to be on ${route.path}, got: ${currentUrl}`,
          'protected_route'
        );
        testResult.assertions.push('correct_route');
        
        // CRITICAL ASSERTION 3: Page must load properly
        const title = await this.page.title();
        await this.assert(
          title && title.length > 0,
          `Expected ${route.name} to have a valid title, got: "${title}"`,
          'protected_route'
        );
        testResult.assertions.push('page_loads');
        
        // CRITICAL ASSERTION 4: Authenticated layout must be visible
        const appLayout = await this.page.locator('[data-testid="app-layout"]').isVisible();
        await this.assert(
          appLayout,
          `Expected authenticated app layout to be visible on ${route.name}`,
          'protected_route'
        );
        testResult.assertions.push('authenticated_layout');
        
        // CRITICAL ASSERTION 5: Mobile layout must work
        const viewportWidth = await this.page.evaluate(() => window.innerWidth);
        await this.assert(
          viewportWidth === 375,
          `Expected mobile viewport 375px, got: ${viewportWidth}px`,
          'protected_route'
        );
        testResult.assertions.push('mobile_viewport');
        
        // CRITICAL ASSERTION 6: Mobile menu must be visible on mobile
        const mobileMenuVisible = await this.page.locator('[data-testid="button-mobile-menu"]').isVisible();
        await this.assert(
          mobileMenuVisible,
          `Expected mobile menu to be visible on ${route.name}`,
          'protected_route'
        );
        testResult.assertions.push('mobile_menu_visible');
        
        // STEP 3: CRITICAL POST-NAVIGATION AUTHENTICATION VERIFICATION
        await this.log(`🔐 Step 3: Post-navigation authentication verification for ${route.name}`);
        const postNavAuthVerification = await this.verifyAuthenticationBeforeRoute(`${route.name} (post-navigation)`);
        testResult.authenticationVerifications.push(postNavAuthVerification);
        
        // STEP 4: Capture evidence screenshot for this protected route
        const screenshotPath = `critical_mobile_evidence/screenshots/protected_${route.name.replace(/\s+/g, '_')}_authenticated_375px.png`;
        await this.page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        
        testResult.evidence.push({
          type: 'screenshot',
          path: screenshotPath,
          description: `${route.name} protected route with VERIFIED authentication on mobile viewport`,
          authenticationVerified: true,
          authVerifications: testResult.authenticationVerifications.length
        });
        
        this.testResults.evidence.screenshots.push({
          category: 'protected_route',
          route: route.name,
          path: screenshotPath,
          viewport: '375x812',
          authenticated: true,
          authVerificationCount: testResult.authenticationVerifications.length,
          timestamp: new Date().toISOString()
        });
        
        // Increment protected routes counter
        this.testResults.summary.protectedRoutesTestedCount++;
        
        await this.log(`✅ ${route.name} - PROTECTED ROUTE TEST SUCCESSFUL WITH VERIFIED AUTHENTICATION`);
        await this.log(`   📊 Authentication verifications: ${testResult.authenticationVerifications.length}`);
        await this.log(`   📊 Assertions passed: ${testResult.assertions.length}`);
        
      } catch (error) {
        testResult.passed = false;
        await this.log(`❌ PROTECTED ROUTE FAILURE on ${route.name}: ${error.message}`, 'ERROR');
        
        // FAIL FAST: Critical protected route failure - cannot continue
        throw new Error(`CRITICAL PROTECTED ROUTE FAILURE on ${route.name}: ${error.message}`);
      }
      
      this.testResults.testCategories.protectedRouteTests.push(testResult);
    }
    
    // CRITICAL FINAL VERIFICATION: All protected routes must be tested
    await this.assert(
      this.testResults.summary.protectedRoutesTestedCount === this.testResults.summary.protectedRoutesTotalCount,
      `Expected all ${this.testResults.summary.protectedRoutesTotalCount} protected routes tested, got: ${this.testResults.summary.protectedRoutesTestedCount}`,
      'protected_route_coverage'
    );
    
    await this.log(`🎯 PROTECTED ROUTES COVERAGE: ${this.testResults.summary.protectedRoutesTestedCount}/${this.testResults.summary.protectedRoutesTotalCount} (100%)`);
    await this.log(`🔐 AUTHENTICATION VERIFICATIONS: All routes tested with verified authentication`);
  }

  /**
   * Test mobile viewports on authenticated pages
   */
  async testMobileViewports() {
    await this.log('📱 TESTING MOBILE VIEWPORTS ON AUTHENTICATED DASHBOARD');
    await this.log('=====================================================');
    
    if (!this.sessionEstablished) {
      await this.log('⚠️  Skipping viewport tests - requires authentication');
      return;
    }
    
    for (const viewport of this.mobileViewports) {
      await this.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.goto('http://localhost:5000/dashboard', { waitUntil: 'networkidle' });
      
      // Test authentication persistence across viewport changes
      const authResponse = await this.page.request.get('http://localhost:5000/api/auth/user');
      await this.assert(
        authResponse.ok(),
        `Expected authentication to persist on ${viewport.name} viewport`,
        'viewport'
      );
      
      // Test mobile layout
      if (viewport.width < 768) {
        const mobileMenuVisible = await this.page.locator('[data-testid="button-mobile-menu"]').isVisible();
        await this.assert(
          mobileMenuVisible,
          `Expected mobile menu visible on ${viewport.name}`,
          'viewport'
        );
      }
      
      // Capture viewport evidence
      const screenshotPath = `critical_mobile_evidence/screenshots/viewport_${viewport.name.replace(/\s+/g, '_')}_authenticated.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      
      this.testResults.evidence.screenshots.push({
        category: 'viewport',
        viewport: viewport.name,
        path: screenshotPath,
        authenticated: true,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Generate comprehensive evidence report
   */
  async generateFinalReport() {
    await this.log('📊 GENERATING FINAL EVIDENCE REPORT');
    await this.log('==================================');
    
    this.testResults.summary.endTime = new Date().toISOString();
    
    const totalTime = new Date(this.testResults.summary.endTime) - new Date(this.testResults.summary.startTime);
    const successRate = this.testResults.summary.totalTests > 0 ? 
      (this.testResults.summary.passedTests / this.testResults.summary.totalTests * 100).toFixed(2) : 0;
    
    const finalReport = {
      executionSummary: {
        testSuite: 'Critical Mobile Authentication Testing Suite',
        executionDate: this.testResults.summary.startTime,
        completionDate: this.testResults.summary.endTime,
        totalExecutionTime: `${Math.floor(totalTime / 1000)} seconds`,
        authenticationEstablished: this.testResults.summary.authenticationEstablished,
        authenticatedUser: this.testResults.summary.authenticatedUser
      },
      criticalResults: {
        totalTests: this.testResults.summary.totalTests,
        passedTests: this.testResults.summary.passedTests,
        failedTests: this.testResults.summary.failedTests,
        successRate: `${successRate}%`,
        protectedRoutesCoverage: `${this.testResults.summary.protectedRoutesTestedCount}/${this.testResults.summary.protectedRoutesTotalCount}`,
        protectedRoutesFullyTested: this.testResults.summary.protectedRoutesTestedCount === this.testResults.summary.protectedRoutesTotalCount,
        criticalFailures: this.testResults.summary.criticalFailures
      },
      evidenceArtifacts: {
        totalScreenshots: this.testResults.evidence.screenshots.length,
        protectedRouteScreenshots: this.testResults.evidence.screenshots.filter(s => s.category === 'protected_route').length,
        authenticationProof: this.testResults.evidence.authenticationProof,
        executionLogs: this.testResults.evidence.executionLogs.length,
        screenshotManifest: this.testResults.evidence.screenshots.map(s => ({
          category: s.category,
          path: s.path,
          authenticated: s.authenticated,
          timestamp: s.timestamp
        }))
      },
      productionReadiness: {
        authenticationImplemented: this.testResults.summary.authenticationEstablished,
        protectedRoutesFullyTested: this.testResults.summary.protectedRoutesTestedCount === this.testResults.summary.protectedRoutesTotalCount,
        evidencePackageComplete: this.testResults.evidence.screenshots.length > 0,
        noSkippedProtectedRoutes: this.testResults.summary.skipProtectedRoutes === false,
        criticalFailuresResolved: this.testResults.summary.criticalFailures.length === 0,
        mobileReadinessScore: this.getMobileReadinessScore()
      },
      testCategories: this.testResults.testCategories
    };
    
    // Write final report
    const reportPath = 'critical_mobile_evidence/final_reports/FINAL_AUTHENTICATED_REPORT.json';
    await fs.writeFile(reportPath, JSON.stringify(finalReport, null, 2));
    
    // Write execution logs
    const logsPath = 'critical_mobile_evidence/final_reports/execution_logs.json';
    await fs.writeFile(logsPath, JSON.stringify(this.testResults.evidence.executionLogs, null, 2));
    
    // Write test results data
    const resultsPath = 'critical_mobile_evidence/final_reports/test_results_data.json';
    await fs.writeFile(resultsPath, JSON.stringify(this.testResults, null, 2));
    
    await this.log('📋 FINAL EXECUTION SUMMARY');
    await this.log('==========================');
    await this.log(`✅ Authentication: ${finalReport.executionSummary.authenticationEstablished ? 'ESTABLISHED' : 'FAILED'}`);
    await this.log(`✅ Protected Routes: ${finalReport.criticalResults.protectedRoutesCoverage}`);
    await this.log(`✅ Total Tests: ${finalReport.criticalResults.totalTests}`);
    await this.log(`✅ Success Rate: ${finalReport.criticalResults.successRate}`);
    await this.log(`✅ Screenshots: ${finalReport.evidenceArtifacts.totalScreenshots}`);
    await this.log(`✅ Production Readiness: ${finalReport.productionReadiness.mobileReadinessScore}`);
    
    await this.log('📁 EVIDENCE FILES GENERATED:');
    await this.log(`📊 Final Report: ${reportPath}`);
    await this.log(`📝 Execution Logs: ${logsPath}`);
    await this.log(`📊 Test Results: ${resultsPath}`);
    
    return finalReport;
  }

  getMobileReadinessScore() {
    if (!this.testResults.summary.authenticationEstablished) {
      return 'AUTHENTICATION REQUIRED';
    }
    
    if (this.testResults.summary.protectedRoutesTestedCount < this.testResults.summary.protectedRoutesTotalCount) {
      return 'INCOMPLETE COVERAGE';
    }
    
    if (this.testResults.summary.criticalFailures.length > 0) {
      return 'CRITICAL FAILURES';
    }
    
    return 'PRODUCTION READY';
  }

  async cleanup() {
    await this.log('🧹 CLEANING UP TEST ENVIRONMENT');
    
    if (this.browser) {
      await this.browser.close();
      await this.log('✅ Browser closed');
    }
  }

  async execute() {
    try {
      await this.initialize();
      
      // Critical authentication step
      const authEstablished = await this.establishAuthentication();
      
      if (authEstablished) {
        // Run all protected route tests
        await this.testAllProtectedRoutes();
        
        // Run viewport tests
        await this.testMobileViewports();
      } else {
        await this.log('❌ CRITICAL FAILURE: Cannot complete testing without authentication', 'ERROR');
        throw new Error('Authentication required for protected route testing');
      }
      
      // Generate final report
      const report = await this.generateFinalReport();
      
      await this.log('🎉 AUTHENTICATED MOBILE TESTING COMPLETE!');
      await this.log('All protected routes successfully tested with authentication.');
      
      return report;
      
    } finally {
      await this.cleanup();
    }
  }
}

// Execute the suite
async function runCriticalMobileAuthTests() {
  const suite = new CriticalMobileAuthSuite();
  try {
    const report = await suite.execute();
    console.log('\n🎉 CRITICAL MOBILE AUTHENTICATION TESTING COMPLETE!');
    console.log('===================================================');
    console.log('Evidence package ready for production sign-off.');
    return report;
  } catch (error) {
    console.error('\n💥 CRITICAL TESTING FAILED:', error.message);
    throw error;
  }
}

// Export for use
export { CriticalMobileAuthSuite, runCriticalMobileAuthTests };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCriticalMobileAuthTests().catch(console.error);
}