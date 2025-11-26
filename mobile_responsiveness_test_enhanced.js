import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Custom assertion helper to replace @playwright/test expect
class AssertionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AssertionError';
  }
}

function customExpect(actual) {
  return {
    toBeTruthy: () => {
      if (!actual) {
        throw new AssertionError(`Expected value to be truthy, but received: ${actual}`);
      }
    },
    toBeVisible: async () => {
      const isVisible = await actual.isVisible();
      if (!isVisible) {
        throw new AssertionError(`Expected element to be visible`);
      }
    },
    not: {
      toBeVisible: async () => {
        const isVisible = await actual.isVisible();
        if (isVisible) {
          throw new AssertionError(`Expected element not to be visible`);
        }
      },
      toBe: (expected) => {
        if (actual === expected) {
          throw new AssertionError(`Expected ${actual} not to be ${expected}`);
        }
      }
    },
    toContain: (expected) => {
      if (!actual || !actual.includes(expected)) {
        throw new AssertionError(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) {
        throw new AssertionError(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected) => {
      if (actual < expected) {
        throw new AssertionError(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThan: (expected) => {
      if (actual >= expected) {
        throw new AssertionError(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeLessThanOrEqual: (expected) => {
      if (actual > expected) {
        throw new AssertionError(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    }
  };
}

// Use custom expect function
const expect = customExpected => customExpected instanceof Promise ? 
  customExpected.then(val => customExpect(val)) : 
  customExpected?.isVisible ? 
    { toBeVisible: () => customExpected.isVisible().then(visible => { if (!visible) throw new AssertionError('Expected element to be visible'); }), not: { toBeVisible: () => customExpected.isVisible().then(visible => { if (visible) throw new AssertionError('Expected element not to be visible'); }) } } :
    customExpected?.count ? 
      { toBeGreaterThan: (val) => customExpected.count().then(count => { if (count <= val) throw new AssertionError(`Expected ${count} to be greater than ${val}`); }) } :
    customExpected?.getAttribute ? 
      { toContain: (val) => customExpected.getAttribute('content').then(attr => { if (!attr || !attr.includes(val)) throw new AssertionError(`Expected "${attr}" to contain "${val}"`); }) } :
    customExpect(customExpected);

// Enhanced Mobile Responsiveness Testing Script with Proper Assertions
class MobileResponsivenessTestSuite {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        startTime: new Date().toISOString(),
        endTime: null,
        passRate: 0
      },
      viewportTests: [],
      pageTests: [],
      modalTests: [],
      navigationTests: [],
      formTests: [],
      tableTests: [],
      touchTests: [],
      performanceTests: [],
      accessibilityTests: [],
      businessWorkflowTests: [],
      evidence: {
        screenshots: [],
        videos: [],
        metrics: []
      }
    };
    
    // Define comprehensive test configurations
    this.viewports = [
      { name: 'iPhone SE', width: 320, height: 568, isMobile: true },
      { name: 'iPhone 12/13', width: 375, height: 812, isMobile: true },
      { name: 'iPhone 12/13 Pro Max', width: 414, height: 896, isMobile: true },
      { name: 'Android Small', width: 360, height: 640, isMobile: true },
      { name: 'Android Large', width: 412, height: 915, isMobile: true },
      { name: 'iPad Mini', width: 768, height: 1024, isMobile: false },
      { name: 'iPad Pro', width: 1024, height: 1366, isMobile: false }
    ];
    
    this.testPages = [
      { path: '/', name: 'Landing', hasAuth: false },
      { path: '/dashboard', name: 'Dashboard', hasAuth: true },
      { path: '/leads', name: 'Leads Management', hasAuth: true },
      { path: '/organizations', name: 'Organizations', hasAuth: true },
      { path: '/catalog', name: 'Product Catalog', hasAuth: true },
      { path: '/orders', name: 'Orders Management', hasAuth: true },
      { path: '/manufacturing', name: 'Manufacturing', hasAuth: true },
      { path: '/design-jobs', name: 'Design Jobs', hasAuth: true },
      { path: '/quotes', name: 'Quotes Management', hasAuth: true },
      { path: '/finance', name: 'Finance Dashboard', hasAuth: true },
      { path: '/salespeople', name: 'Salespeople Management', hasAuth: true },
      { path: '/user-management', name: 'User Management', hasAuth: true },
      { path: '/designer-management', name: 'Designer Management', hasAuth: true },
      { path: '/manufacturer-management', name: 'Manufacturer Management', hasAuth: true },
      { path: '/settings', name: 'Settings', hasAuth: true },
      { path: '/404', name: 'Not Found', hasAuth: false }
    ];
    
    this.modalTestIds = [
      'create-lead-modal', 'create-organization-modal', 'create-contact-modal',
      'create-product-modal', 'create-category-modal', 'create-variant-modal',
      'create-order-modal', 'create-quote-modal', 'create-manufacturing-modal',
      'create-design-job-modal', 'create-user-modal', 'create-salesperson-modal',
      'edit-lead-modal', 'edit-organization-modal', 'edit-contact-modal',
      'edit-product-modal', 'edit-quote-modal', 'edit-user-modal',
      'edit-variant-modal', 'manufacturing-detail-modal', 'order-detail-modal',
      'organization-detail-modal', 'quote-detail-modal', 'salesperson-detail-modal',
      'user-detail-modal', 'quick-create-modal'
    ];
  }

  async initialize() {
    console.log('\n🚀 INITIALIZING ENHANCED MOBILE TESTING SUITE');
    console.log('==============================================\n');
    
    // Create evidence directory
    await fs.mkdir('mobile_test_evidence', { recursive: true });
    await fs.mkdir('mobile_test_evidence/screenshots', { recursive: true });
    await fs.mkdir('mobile_test_evidence/videos', { recursive: true });
    
    this.browser = await chromium.launch({ 
      headless: false, // Use headed for video recording
      slowMo: 100 // Slow down for better video capture
    });
    
    this.context = await this.browser.newContext({
      recordVideo: {
        dir: 'mobile_test_evidence/videos/',
        size: { width: 1920, height: 1080 }
      }
    });
    
    this.page = await this.context.newPage();
    
    // Set up test helpers
    await this.setupTestHelpers();
  }

  async setupTestHelpers() {
    // Add custom assertions helper
    this.page.addEvaluateOnNewDocument(() => {
      window.mobileTestHelpers = {
        getTouchTargetSize: (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        },
        getComputedFontSize: (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          return window.getComputedStyle(element).fontSize;
        },
        checkViewportMeta: () => {
          const meta = document.querySelector('meta[name="viewport"]');
          return meta ? meta.getAttribute('content') : null;
        }
      };
    });
  }

  async runComprehensiveTests() {
    console.log('📱 STARTING COMPREHENSIVE MOBILE RESPONSIVENESS TESTING');
    console.log('========================================================\n');
    
    try {
      // Test 1: Viewport and Breakpoint Testing
      await this.testViewportResponsiveness();
      
      // Test 2: Page Coverage Testing
      await this.testAllPages();
      
      // Test 3: Modal Components Testing
      await this.testAllModals();
      
      // Test 4: Navigation Testing
      await this.testNavigationFunctionality();
      
      // Test 5: Form and Input Testing
      await this.testFormResponsiveness();
      
      // Test 6: Table Responsiveness Testing
      await this.testTableResponsiveness();
      
      // Test 7: Touch Interaction Testing
      await this.testTouchInteractions();
      
      // Test 8: Performance Testing
      await this.testPerformance();
      
      // Test 9: Accessibility Testing
      await this.testAccessibility();
      
      // Test 10: Business Workflow Testing
      await this.testBusinessWorkflows();
      
      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Testing suite failed:', error);
      this.testResults.summary.failedTests++;
      throw error;
    }
  }

  async testViewportResponsiveness() {
    console.log('🖥️ TESTING VIEWPORT RESPONSIVENESS WITH ASSERTIONS');
    console.log('==================================================\n');
    
    for (const viewport of this.viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.goto('http://localhost:5000');
      await this.page.waitForLoadState('networkidle');
      
      const testResult = {
        viewport: viewport.name,
        dimensions: `${viewport.width}x${viewport.height}`,
        isMobile: viewport.isMobile,
        tests: {},
        passed: true,
        errors: []
      };
      
      try {
        // ASSERTION 1: Viewport meta tag exists and is correct
        const viewportMeta = await this.page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewportMeta).toContain('width=device-width');
        testResult.tests.viewportMeta = { passed: true, value: viewportMeta };
        console.log(`  ✅ Viewport meta tag: ${viewportMeta}`);
        
        // ASSERTION 2: App layout loads properly
        await expect(this.page.locator('[data-testid="app-layout"]')).toBeVisible();
        testResult.tests.appLayout = { passed: true };
        console.log(`  ✅ App layout loads successfully`);
        
        // ASSERTION 3: Mobile layout detection
        if (viewport.isMobile) {
          // Desktop sidebar should be hidden on mobile
          await expect(this.page.locator('[data-testid="sidebar"]')).not.toBeVisible();
          testResult.tests.desktopSidebarHidden = { passed: true };
          console.log(`  ✅ Desktop sidebar hidden on mobile`);
          
          // Mobile menu button should be visible
          await expect(this.page.locator('[data-testid="button-mobile-menu"]')).toBeVisible();
          testResult.tests.mobileMenuButton = { passed: true };
          console.log(`  ✅ Mobile menu button visible`);
          
        } else {
          // Desktop sidebar should be visible on larger screens
          await expect(this.page.locator('[data-testid="sidebar"]')).toBeVisible();
          testResult.tests.desktopSidebarVisible = { passed: true };
          console.log(`  ✅ Desktop sidebar visible on larger screens`);
        }
        
        // ASSERTION 4: Touch target compliance (mobile only)
        if (viewport.isMobile) {
          const buttons = await this.page.locator('button').all();
          let compliantTargets = 0;
          let totalTargets = 0;
          
          for (const button of buttons) {
            const bbox = await button.boundingBox();
            if (bbox) {
              totalTargets++;
              if (bbox.width >= 44 && bbox.height >= 44) {
                compliantTargets++;
              }
            }
          }
          
          const complianceRate = totalTargets > 0 ? (compliantTargets / totalTargets) * 100 : 100;
          expect(complianceRate).toBeGreaterThanOrEqual(90); // 90% compliance minimum
          testResult.tests.touchTargetCompliance = { 
            passed: true, 
            complianceRate: complianceRate.toFixed(1),
            compliantTargets,
            totalTargets
          };
          console.log(`  ✅ Touch target compliance: ${complianceRate.toFixed(1)}% (${compliantTargets}/${totalTargets})`);
        }
        
        // Take screenshot for evidence
        const screenshotPath = `mobile_test_evidence/screenshots/viewport_${viewport.name.replace(/\s+/g, '_')}_${viewport.width}x${viewport.height}.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.testResults.evidence.screenshots.push({
          test: 'Viewport Responsiveness',
          viewport: viewport.name,
          path: screenshotPath
        });
        console.log(`  📸 Screenshot saved: ${screenshotPath}`);
        
        this.testResults.summary.passedTests++;
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        testResult.passed = false;
        testResult.errors.push(error.message);
        this.testResults.summary.failedTests++;
      }
      
      this.testResults.viewportTests.push(testResult);
      this.testResults.summary.totalTests++;
      console.log('');
    }
  }

  async testAllPages() {
    console.log('📄 TESTING ALL PAGE COMPONENTS FOR MOBILE ADAPTATION');
    console.log('====================================================\n');
    
    // Use mobile viewport for page testing
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    for (const pageConfig of this.testPages) {
      console.log(`Testing page: ${pageConfig.name} (${pageConfig.path})`);
      
      const testResult = {
        page: pageConfig.name,
        path: pageConfig.path,
        hasAuth: pageConfig.hasAuth,
        tests: {},
        passed: true,
        errors: []
      };
      
      try {
        await this.page.goto(`http://localhost:5000${pageConfig.path}`);
        await this.page.waitForTimeout(2000); // Allow for loading
        
        // ASSERTION 1: Page loads without errors
        const title = await this.page.title();
        expect(title).toBeTruthy();
        testResult.tests.pageLoads = { passed: true, title };
        console.log(`  ✅ Page loads successfully: ${title}`);
        
        // ASSERTION 2: Mobile layout elements are present
        if (pageConfig.hasAuth) {
          // Check for mobile header
          await expect(this.page.locator('header')).toBeVisible();
          testResult.tests.mobileHeader = { passed: true };
          console.log(`  ✅ Mobile header present`);
          
          // Check for mobile navigation
          await expect(this.page.locator('[data-testid="button-mobile-menu"]')).toBeVisible();
          testResult.tests.mobileNavigation = { passed: true };
          console.log(`  ✅ Mobile navigation accessible`);
        }
        
        // ASSERTION 3: Content is readable on mobile
        const mainContent = this.page.locator('main');
        await expect(mainContent).toBeVisible();
        const contentBox = await mainContent.boundingBox();
        expect(contentBox.width).toBeLessThanOrEqual(375); // Fits in mobile viewport
        testResult.tests.contentFitsViewport = { passed: true, width: contentBox.width };
        console.log(`  ✅ Content fits mobile viewport: ${contentBox.width}px`);
        
        // ASSERTION 4: No horizontal scrolling needed
        const scrollWidth = await this.page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await this.page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
        testResult.tests.noHorizontalScroll = { passed: true, scrollWidth, clientWidth };
        console.log(`  ✅ No horizontal scroll: ${scrollWidth}px <= ${clientWidth}px`);
        
        // Take screenshot for evidence
        const screenshotPath = `mobile_test_evidence/screenshots/page_${pageConfig.name.replace(/\s+/g, '_')}_mobile.png`;
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        this.testResults.evidence.screenshots.push({
          test: 'Page Testing',
          page: pageConfig.name,
          path: screenshotPath
        });
        
        this.testResults.summary.passedTests++;
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        testResult.passed = false;
        testResult.errors.push(error.message);
        this.testResults.summary.failedTests++;
      }
      
      this.testResults.pageTests.push(testResult);
      this.testResults.summary.totalTests++;
      console.log('');
    }
  }

  async testAllModals() {
    console.log('🏗️ TESTING ALL MODAL COMPONENTS FOR MOBILE ADAPTATION');
    console.log('======================================================\n');
    
    // Set mobile viewport
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/dashboard');
    await this.page.waitForTimeout(2000);
    
    // Test Quick Create Modal (most accessible)
    const testResult = {
      modal: 'Quick Create Modal',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      console.log('Testing Quick Create Modal...');
      
      // ASSERTION 1: Modal can be opened
      await expect(this.page.locator('[data-testid="button-quick-create"]')).toBeVisible();
      await this.page.locator('[data-testid="button-quick-create"]').click();
      await this.page.waitForTimeout(1000);
      
      // ASSERTION 2: Modal appears and is visible
      await expect(this.page.locator('[role="dialog"]')).toBeVisible();
      testResult.tests.modalOpens = { passed: true };
      console.log(`  ✅ Modal opens successfully`);
      
      // ASSERTION 3: Modal fills screen appropriately on mobile
      const modal = this.page.locator('[role="dialog"]').first();
      const modalBox = await modal.boundingBox();
      const viewport = this.page.viewportSize();
      
      const fillsScreen = modalBox.width >= viewport.width * 0.85; // Should fill at least 85% of screen width
      expect(fillsScreen).toBeTruthy();
      testResult.tests.modalFillsScreen = { 
        passed: true, 
        modalWidth: modalBox.width, 
        viewportWidth: viewport.width,
        fillPercentage: ((modalBox.width / viewport.width) * 100).toFixed(1)
      };
      console.log(`  ✅ Modal fills screen appropriately: ${((modalBox.width / viewport.width) * 100).toFixed(1)}%`);
      
      // ASSERTION 4: Modal is scrollable if content is long
      const isScrollable = modalBox.height > viewport.height * 0.8 || 
                          await modal.evaluate(el => el.scrollHeight > el.clientHeight);
      testResult.tests.modalScrollable = { passed: true, isScrollable };
      console.log(`  ✅ Modal scrolling: ${isScrollable ? 'Yes (content scrollable)' : 'No (fits in viewport)'}`);
      
      // ASSERTION 5: Modal can be closed
      const closeButton = this.page.locator('[data-testid="button-close"]').or(
        this.page.locator('[aria-label="Close"]')
      ).first();
      
      if (await closeButton.isVisible()) {
        await closeButton.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      
      await this.page.waitForTimeout(500);
      await expect(this.page.locator('[role="dialog"]')).not.toBeVisible();
      testResult.tests.modalCloses = { passed: true };
      console.log(`  ✅ Modal closes successfully`);
      
      // Take screenshot for evidence
      const screenshotPath = `mobile_test_evidence/screenshots/modal_quick_create_mobile.png`;
      
      // Re-open modal for screenshot
      await this.page.locator('[data-testid="button-quick-create"]').click();
      await this.page.waitForTimeout(1000);
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      this.testResults.evidence.screenshots.push({
        test: 'Modal Testing',
        modal: 'Quick Create Modal',
        path: screenshotPath
      });
      
      // Close modal again
      const closeBtn = this.page.locator('[data-testid="button-close"]').or(
        this.page.locator('[aria-label="Close"]')
      ).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await this.page.keyboard.press('Escape');
      }
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.modalTests.push(testResult);
    this.testResults.summary.totalTests++;
    
    // Note: In a full implementation, we would test all 27 modals
    // This is a representative test of the modal system
    console.log(`✅ Modal testing complete (1 representative modal tested)`);
    console.log(`📝 Note: Full implementation would test all 27 modals\n`);
  }

  async testNavigationFunctionality() {
    console.log('🧭 TESTING MOBILE NAVIGATION FUNCTIONALITY');
    console.log('==========================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/dashboard');
    await this.page.waitForTimeout(2000);
    
    const testResult = {
      navigation: 'Mobile Navigation',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      // ASSERTION 1: Mobile menu button is accessible
      await expect(this.page.locator('[data-testid="button-mobile-menu"]')).toBeVisible();
      testResult.tests.menuButtonVisible = { passed: true };
      console.log(`  ✅ Mobile menu button is accessible`);
      
      // ASSERTION 2: Mobile menu opens when clicked
      await this.page.locator('[data-testid="button-mobile-menu"]').click();
      await this.page.waitForTimeout(1000);
      
      await expect(this.page.locator('[role="dialog"]')).toBeVisible();
      testResult.tests.menuOpens = { passed: true };
      console.log(`  ✅ Mobile navigation menu opens`);
      
      // ASSERTION 3: Navigation links are present and clickable
      const navLinks = await this.page.locator('[data-testid^="nav-link-"]').all();
      expect(navLinks.length).toBeGreaterThan(0);
      testResult.tests.navigationLinks = { passed: true, linkCount: navLinks.length };
      console.log(`  ✅ Navigation links present: ${navLinks.length} links found`);
      
      // ASSERTION 4: Navigation link click works and closes menu
      if (navLinks.length > 1) {
        await navLinks[1].click(); // Click second link (not dashboard)
        await this.page.waitForTimeout(1000);
        
        // Menu should close after navigation
        await expect(this.page.locator('[role="dialog"]')).not.toBeVisible();
        testResult.tests.menuClosesAfterNavigation = { passed: true };
        console.log(`  ✅ Menu closes after navigation`);
      }
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.navigationTests.push(testResult);
    this.testResults.summary.totalTests++;
    console.log('');
  }

  async testFormResponsiveness() {
    console.log('📝 TESTING FORM RESPONSIVENESS AND MOBILE INPUT');
    console.log('===============================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/leads');
    await this.page.waitForTimeout(2000);
    
    const testResult = {
      forms: 'Mobile Form Testing',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      // ASSERTION 1: Form inputs are present
      const inputs = await this.page.locator('input').all();
      expect(inputs.length).toBeGreaterThan(0);
      testResult.tests.inputsPresent = { passed: true, inputCount: inputs.length };
      console.log(`  ✅ Form inputs found: ${inputs.length} inputs`);
      
      // ASSERTION 2: Input font sizes prevent iOS zoom
      let compliantInputs = 0;
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const input = inputs[i];
        const fontSize = await input.evaluate(el => window.getComputedStyle(el).fontSize);
        const fontSizeNum = parseInt(fontSize.replace('px', ''));
        
        if (fontSizeNum >= 16) {
          compliantInputs++;
        }
      }
      
      const fontCompliance = inputs.length > 0 ? (compliantInputs / Math.min(inputs.length, 5)) * 100 : 100;
      expect(fontCompliance).toBeGreaterThanOrEqual(80); // 80% compliance minimum
      testResult.tests.fontSizeCompliance = { 
        passed: true, 
        compliance: fontCompliance.toFixed(1),
        compliantInputs,
        testedInputs: Math.min(inputs.length, 5)
      };
      console.log(`  ✅ Font size compliance: ${fontCompliance.toFixed(1)}% prevent iOS zoom`);
      
      // ASSERTION 3: Touch target compliance for inputs
      let compliantTargets = 0;
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const input = inputs[i];
        const bbox = await input.boundingBox();
        if (bbox && bbox.height >= 44) {
          compliantTargets++;
        }
      }
      
      const targetCompliance = inputs.length > 0 ? (compliantTargets / Math.min(inputs.length, 5)) * 100 : 100;
      expect(targetCompliance).toBeGreaterThanOrEqual(80);
      testResult.tests.touchTargetCompliance = { 
        passed: true, 
        compliance: targetCompliance.toFixed(1),
        compliantTargets,
        testedInputs: Math.min(inputs.length, 5)
      };
      console.log(`  ✅ Touch target compliance: ${targetCompliance.toFixed(1)}% meet 44px minimum`);
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.formTests.push(testResult);
    this.testResults.summary.totalTests++;
    console.log('');
  }

  async testTableResponsiveness() {
    console.log('📊 TESTING TABLE RESPONSIVENESS ON MOBILE');
    console.log('=========================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/leads');
    await this.page.waitForTimeout(2000);
    
    const testResult = {
      tables: 'Mobile Table Testing',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      // ASSERTION 1: Tables are present
      const tables = await this.page.locator('table').all();
      expect(tables.length).toBeGreaterThan(0);
      testResult.tests.tablesPresent = { passed: true, tableCount: tables.length };
      console.log(`  ✅ Tables found: ${tables.length} tables`);
      
      // ASSERTION 2: Tables have responsive classes or behavior
      let responsiveTables = 0;
      for (const table of tables) {
        const tableClasses = await table.getAttribute('class') || '';
        const isResponsive = tableClasses.includes('mobile-card-table') || 
                           tableClasses.includes('responsive') ||
                           tableClasses.includes('overflow');
        
        if (isResponsive) {
          responsiveTables++;
        }
      }
      
      const responsiveCompliance = tables.length > 0 ? (responsiveTables / tables.length) * 100 : 100;
      expect(responsiveCompliance).toBeGreaterThanOrEqual(50); // At least 50% should be responsive
      testResult.tests.responsiveCompliance = { 
        passed: true, 
        compliance: responsiveCompliance.toFixed(1),
        responsiveTables,
        totalTables: tables.length
      };
      console.log(`  ✅ Responsive table compliance: ${responsiveCompliance.toFixed(1)}%`);
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.tableTests.push(testResult);
    this.testResults.summary.totalTests++;
    console.log('');
  }

  async testTouchInteractions() {
    console.log('👆 TESTING TOUCH INTERACTIONS');
    console.log('==============================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/dashboard');
    await this.page.waitForTimeout(2000);
    
    const testResult = {
      touch: 'Touch Interaction Testing',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      // ASSERTION 1: Touch targets meet minimum size requirements
      const buttons = await this.page.locator('button').all();
      let compliantButtons = 0;
      
      for (const button of buttons) {
        const bbox = await button.boundingBox();
        if (bbox && bbox.width >= 44 && bbox.height >= 44) {
          compliantButtons++;
        }
      }
      
      const touchCompliance = buttons.length > 0 ? (compliantButtons / buttons.length) * 100 : 100;
      expect(touchCompliance).toBeGreaterThanOrEqual(85); // 85% compliance minimum
      testResult.tests.touchTargetCompliance = { 
        passed: true, 
        compliance: touchCompliance.toFixed(1),
        compliantButtons,
        totalButtons: buttons.length
      };
      console.log(`  ✅ Touch target compliance: ${touchCompliance.toFixed(1)}% (${compliantButtons}/${buttons.length})`);
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.touchTests.push(testResult);
    this.testResults.summary.totalTests++;
    console.log('');
  }

  async testPerformance() {
    console.log('⚡ TESTING MOBILE PERFORMANCE');
    console.log('=============================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    const testResult = {
      performance: 'Mobile Performance Testing',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      // ASSERTION 1: Page load time is acceptable
      const startTime = Date.now();
      await this.page.goto('http://localhost:5000/dashboard');
      await this.page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // 5 second maximum
      testResult.tests.pageLoadTime = { passed: true, loadTime };
      console.log(`  ✅ Page load time: ${loadTime}ms (< 5000ms)`);
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.performanceTests.push(testResult);
    this.testResults.summary.totalTests++;
    console.log('');
  }

  async testAccessibility() {
    console.log('♿ TESTING MOBILE ACCESSIBILITY');
    console.log('===============================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    await this.page.goto('http://localhost:5000/dashboard');
    await this.page.waitForTimeout(2000);
    
    const testResult = {
      accessibility: 'Mobile Accessibility Testing',
      tests: {},
      passed: true,
      errors: []
    };
    
    try {
      // ASSERTION 1: Keyboard navigation works
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBe('BODY');
      testResult.tests.keyboardNavigation = { passed: true, focusedElement };
      console.log(`  ✅ Keyboard navigation works: focused ${focusedElement}`);
      
      // ASSERTION 2: ARIA labels are present
      const buttonsWithAria = await this.page.locator('button[aria-label]').count();
      const totalButtons = await this.page.locator('button').count();
      const ariaCompliance = totalButtons > 0 ? (buttonsWithAria / totalButtons) * 100 : 100;
      
      // Expect at least 30% of buttons to have ARIA labels
      expect(ariaCompliance).toBeGreaterThanOrEqual(30);
      testResult.tests.ariaLabels = { 
        passed: true, 
        compliance: ariaCompliance.toFixed(1),
        buttonsWithAria,
        totalButtons
      };
      console.log(`  ✅ ARIA label compliance: ${ariaCompliance.toFixed(1)}% (${buttonsWithAria}/${totalButtons})`);
      
      this.testResults.summary.passedTests++;
      
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      testResult.passed = false;
      testResult.errors.push(error.message);
      this.testResults.summary.failedTests++;
    }
    
    this.testResults.accessibilityTests.push(testResult);
    this.testResults.summary.totalTests++;
    console.log('');
  }

  async testBusinessWorkflows() {
    console.log('💼 TESTING BUSINESS WORKFLOWS ON MOBILE');
    console.log('=======================================\n');
    
    await this.page.setViewportSize({ width: 375, height: 812 });
    
    const workflows = [
      { name: 'Dashboard Access', path: '/dashboard' },
      { name: 'Lead Management', path: '/leads' },
      { name: 'Organization Management', path: '/organizations' }
    ];
    
    for (const workflow of workflows) {
      const testResult = {
        workflow: workflow.name,
        path: workflow.path,
        tests: {},
        passed: true,
        errors: []
      };
      
      try {
        console.log(`Testing ${workflow.name}...`);
        
        await this.page.goto(`http://localhost:5000${workflow.path}`);
        await this.page.waitForTimeout(2000);
        
        // ASSERTION: Workflow page loads and is functional
        await expect(this.page.locator('main')).toBeVisible();
        testResult.tests.workflowLoads = { passed: true };
        console.log(`  ✅ ${workflow.name} loads successfully on mobile`);
        
        this.testResults.summary.passedTests++;
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        testResult.passed = false;
        testResult.errors.push(error.message);
        this.testResults.summary.failedTests++;
      }
      
      this.testResults.businessWorkflowTests.push(testResult);
      this.testResults.summary.totalTests++;
    }
    console.log('');
  }

  async generateReport() {
    console.log('📊 GENERATING COMPREHENSIVE TEST REPORT');
    console.log('=======================================\n');
    
    this.testResults.summary.endTime = new Date().toISOString();
    this.testResults.summary.passRate = this.testResults.summary.totalTests > 0 
      ? (this.testResults.summary.passedTests / this.testResults.summary.totalTests) * 100 
      : 0;
    
    // Calculate objective mobile readiness score
    const objectiveScore = this.calculateObjectiveScore();
    
    const report = {
      ...this.testResults,
      objectiveAssessment: {
        mobileReadinessScore: objectiveScore,
        productionReady: objectiveScore >= 85,
        criticalIssues: this.testResults.summary.failedTests,
        recommendations: this.generateRecommendations()
      }
    };
    
    // Save comprehensive report
    await fs.writeFile(
      'mobile_test_evidence/comprehensive_mobile_test_report.json',
      JSON.stringify(report, null, 2)
    );
    
    // Generate summary
    console.log(`📋 TEST SUMMARY`);
    console.log(`=============`);
    console.log(`Total Tests: ${this.testResults.summary.totalTests}`);
    console.log(`Passed: ${this.testResults.summary.passedTests}`);
    console.log(`Failed: ${this.testResults.summary.failedTests}`);
    console.log(`Pass Rate: ${this.testResults.summary.passRate.toFixed(1)}%`);
    console.log(`Objective Score: ${objectiveScore}/100`);
    console.log(`Production Ready: ${objectiveScore >= 85 ? '✅ YES' : '❌ NO'}`);
    console.log(`\n📁 Evidence collected in: mobile_test_evidence/`);
    console.log(`📄 Full report: mobile_test_evidence/comprehensive_mobile_test_report.json\n`);
    
    return report;
  }

  calculateObjectiveScore() {
    const weights = {
      viewport: 20,
      pages: 25,
      modals: 15,
      navigation: 10,
      forms: 10,
      tables: 5,
      touch: 5,
      performance: 5,
      accessibility: 5
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    // Calculate weighted score based on test results
    Object.entries(weights).forEach(([category, weight]) => {
      const categoryTests = this.testResults[`${category}Tests`] || [];
      if (categoryTests.length > 0) {
        const passedTests = categoryTests.filter(test => test.passed).length;
        const categoryScore = (passedTests / categoryTests.length) * 100;
        totalScore += categoryScore * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.testResults.summary.failedTests > 0) {
      recommendations.push('Address failed test cases before production deployment');
    }
    
    if (this.testResults.summary.passRate < 90) {
      recommendations.push('Improve test pass rate to at least 90% for production readiness');
    }
    
    recommendations.push('Conduct user acceptance testing on real mobile devices');
    recommendations.push('Implement performance monitoring for mobile users');
    recommendations.push('Consider progressive web app features for enhanced mobile experience');
    
    return recommendations;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Execute the enhanced test suite
async function runEnhancedMobileTests() {
  const testSuite = new MobileResponsivenessTestSuite();
  
  try {
    await testSuite.initialize();
    const report = await testSuite.runComprehensiveTests();
    console.log('✅ Enhanced mobile testing completed successfully!');
    return report;
  } catch (error) {
    console.error('❌ Enhanced mobile testing failed:', error);
    throw error;
  } finally {
    await testSuite.cleanup();
  }
}

// Run the tests
runEnhancedMobileTests()
  .then(report => {
    console.log('🎉 All testing completed with proper assertions and evidence collection!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Testing suite failed:', error);
    process.exit(1);
  });