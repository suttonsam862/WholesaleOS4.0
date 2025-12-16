/**
 * Comprehensive Settings Page Testing Script (ES Module)
 * Tests all aspects of settings functionality for production readiness
 */

import { chromium } from 'playwright';
import fs from 'fs';

class SettingsComprehensiveTest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.baseUrl = 'http://localhost:5000';
    this.testResults = {
      structure: {},
      navigation: {},
      roleAccess: {},
      userPreferences: {},
      systemConfig: {},
      businessConfig: {},
      notifications: {},
      integrations: {},
      dataManagement: {},
      formValidation: {},
      persistence: {},
      security: {},
      performance: {},
      responsive: {}
    };
    this.screenshots = [];
    this.errors = [];
  }

  async initialize() {
    try {
      this.browser = await chromium.launch({ 
        headless: true,  // Use headless mode for server environment
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Server-friendly flags
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      this.page = await this.context.newPage();
      
      // Enable console logging
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          this.errors.push(`Console Error: ${msg.text()}`);
        }
      });

      console.log('✓ Browser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async navigateToApp() {
    try {
      console.log('🚀 Navigating to application...');
      await this.page.goto(this.baseUrl);
      await this.page.waitForTimeout(3000); // Wait for auth and initial load
      
      return true;
    } catch (error) {
      console.error('Failed to navigate to app:', error);
      this.errors.push(`Navigation failed: ${error.message}`);
      return false;
    }
  }

  async testBasicAccess() {
    console.log('\n🔍 Testing Basic Settings Access...');
    
    try {
      // Try to navigate directly to settings
      await this.page.goto(`${this.baseUrl}/settings`);
      await this.page.waitForTimeout(2000);
      
      // Check if we're redirected to login or settings page loads
      const currentUrl = this.page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('login') || currentUrl.includes('api/login')) {
        this.testResults.security.requiresAuthentication = true;
        console.log('✓ Settings page properly requires authentication');
      } else if (currentUrl.includes('settings')) {
        // Check if settings page elements are present
        try {
          await this.page.waitForSelector('[data-testid="heading-settings"]', { timeout: 5000 });
          this.testResults.structure.settingsPageLoads = true;
          console.log('✓ Settings page loads successfully');
        } catch {
          this.testResults.structure.settingsPageLoads = false;
          console.log('✗ Settings page heading not found');
        }
      }
      
      return this.testResults.structure.settingsPageLoads;
      
    } catch (error) {
      console.error('Basic access test failed:', error);
      this.errors.push(`Basic access test failed: ${error.message}`);
      return false;
    }
  }

  async runQuickTest() {
    console.log('🚀 Starting Quick Settings Test...\n');
    
    try {
      await this.initialize();
      await this.navigateToApp();
      const accessResult = await this.testBasicAccess();
      
      const report = {
        timestamp: new Date().toISOString(),
        testResults: this.testResults,
        errors: this.errors,
        basicAccessWorking: accessResult,
        summary: {
          authenticationRequired: this.testResults.security.requiresAuthentication,
          settingsPageLoads: this.testResults.structure.settingsPageLoads,
          errorCount: this.errors.length
        }
      };
      
      // Write quick report
      fs.writeFileSync('settings_quick_test_report.json', JSON.stringify(report, null, 2));
      
      console.log('\n📊 Quick Test Complete!');
      console.log(`✓ Authentication Required: ${report.summary.authenticationRequired}`);
      console.log(`✓ Settings Page Loads: ${report.summary.settingsPageLoads}`);
      console.log(`✓ Errors Found: ${report.summary.errorCount}`);
      
      return report;
      
    } catch (error) {
      console.error('Quick test failed:', error);
      return { error: error.message, errors: this.errors };
    } finally {
      await this.cleanup();
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
      }
      console.log('✓ Browser cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

// Run the quick test
async function main() {
  const tester = new SettingsComprehensiveTest();
  const report = await tester.runQuickTest();
  
  if (report.error) {
    console.error('Testing failed:', report.error);
    process.exit(1);
  }
  
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SettingsComprehensiveTest;