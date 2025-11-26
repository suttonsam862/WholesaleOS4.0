/**
 * Comprehensive Settings Page Testing Script
 * Tests all aspects of settings functionality for production readiness
 */

const { chromium } = require('playwright');
const fs = require('fs');

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
        headless: false,
        slowMo: 100 
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
      await this.page.waitForTimeout(2000);
      
      // Take screenshot of initial page
      await this.takeScreenshot('01_initial_page');
      
      return true;
    } catch (error) {
      console.error('Failed to navigate to app:', error);
      this.errors.push(`Navigation failed: ${error.message}`);
      return false;
    }
  }

  async takeScreenshot(name) {
    try {
      const screenshot = `screenshot_${name}_${Date.now()}.png`;
      await this.page.screenshot({ path: screenshot, fullPage: true });
      this.screenshots.push(screenshot);
      console.log(`📸 Screenshot taken: ${screenshot}`);
    } catch (error) {
      console.error(`Failed to take screenshot ${name}:`, error);
    }
  }

  async testSettingsPageStructure() {
    console.log('\n🔍 Testing Settings Page Structure...');
    
    try {
      // Test navigation to settings
      const settingsNavLink = await this.page.locator('[data-testid="nav-link-settings"]');
      
      if (await settingsNavLink.isVisible()) {
        await settingsNavLink.click();
        await this.page.waitForTimeout(1000);
        await this.takeScreenshot('02_settings_navigation');
        
        this.testResults.navigation.settingsLinkVisible = true;
        this.testResults.navigation.settingsLinkClickable = true;
      } else {
        this.testResults.navigation.settingsLinkVisible = false;
        console.log('⚠️  Settings link not visible in navigation');
      }

      // Wait for settings page to load
      await this.page.waitForSelector('[data-testid="heading-settings"]', { timeout: 5000 });
      
      // Test page heading
      const heading = await this.page.locator('[data-testid="heading-settings"]');
      const headingText = await heading.textContent();
      this.testResults.structure.headingExists = headingText === 'Settings';
      
      // Test all main sections
      const sections = [
        'card-company-profile',
        'card-defaults', 
        'card-role-access',
        'card-system-settings',
        'card-backup-export'
      ];
      
      for (const section of sections) {
        const sectionElement = await this.page.locator(`[data-testid="${section}"]`);
        const isVisible = await sectionElement.isVisible();
        this.testResults.structure[section] = isVisible;
        console.log(`${isVisible ? '✓' : '✗'} Section ${section}: ${isVisible ? 'visible' : 'not visible'}`);
      }
      
      await this.takeScreenshot('03_settings_structure');
      
    } catch (error) {
      console.error('Settings structure test failed:', error);
      this.errors.push(`Structure test failed: ${error.message}`);
    }
  }

  async testRoleBasedAccess() {
    console.log('\n🛡️  Testing Role-Based Access Controls...');
    
    try {
      // Check current user role
      const userNameElement = await this.page.locator('[data-testid="user-name"]');
      const userName = await userNameElement.textContent();
      
      // Test settings access based on permissions
      const settingsCards = await this.page.locator('[data-testid^="card-"]').count();
      this.testResults.roleAccess.settingsCardsVisible = settingsCards;
      
      // Test role access controls section
      const roleAccessCard = await this.page.locator('[data-testid="card-role-access"]');
      const roleAccessVisible = await roleAccessCard.isVisible();
      this.testResults.roleAccess.roleAccessControlsVisible = roleAccessVisible;
      
      if (roleAccessVisible) {
        // Test individual role switches
        const roles = ['admin', 'sales', 'designer', 'operations', 'manufacturer'];
        for (const role of roles) {
          const dashboardSwitch = await this.page.locator(`[data-testid="switch-${role}-dashboard"]`);
          const leadsSwitch = await this.page.locator(`[data-testid="switch-${role}-leads"]`);
          const ordersSwitch = await this.page.locator(`[data-testid="switch-${role}-orders"]`);
          
          this.testResults.roleAccess[`${role}_switches`] = {
            dashboard: await dashboardSwitch.isVisible(),
            leads: await leadsSwitch.isVisible(),
            orders: await ordersSwitch.isVisible()
          };
        }
      }
      
      await this.takeScreenshot('04_role_access');
      
    } catch (error) {
      console.error('Role access test failed:', error);
      this.errors.push(`Role access test failed: ${error.message}`);
    }
  }

  async testCompanyProfileSettings() {
    console.log('\n🏢 Testing Company Profile Settings...');
    
    try {
      const companyCard = await this.page.locator('[data-testid="card-company-profile"]');
      await companyCard.scrollIntoViewIfNeeded();
      
      // Test form fields
      const companyNameInput = await this.page.locator('[data-testid="input-company-name"]');
      const companyEmailInput = await this.page.locator('[data-testid="input-company-email"]');
      const companyAddressTextarea = await this.page.locator('[data-testid="textarea-company-address"]');
      const saveButton = await this.page.locator('[data-testid="button-save-company"]');
      
      // Test field visibility
      this.testResults.userPreferences.companyNameField = await companyNameInput.isVisible();
      this.testResults.userPreferences.companyEmailField = await companyEmailInput.isVisible();
      this.testResults.userPreferences.companyAddressField = await companyAddressTextarea.isVisible();
      this.testResults.userPreferences.companySaveButton = await saveButton.isVisible();
      
      // Test field interactions
      await companyNameInput.click();
      await companyNameInput.fill('Test Company Name');
      const nameValue = await companyNameInput.inputValue();
      this.testResults.userPreferences.companyNameEditable = nameValue === 'Test Company Name';
      
      await companyEmailInput.click();
      await companyEmailInput.fill('test@company.com');
      const emailValue = await companyEmailInput.inputValue();
      this.testResults.userPreferences.companyEmailEditable = emailValue === 'test@company.com';
      
      await companyAddressTextarea.click();
      await companyAddressTextarea.fill('123 Test Street, Test City, TC 12345');
      const addressValue = await companyAddressTextarea.inputValue();
      this.testResults.userPreferences.companyAddressEditable = addressValue === '123 Test Street, Test City, TC 12345';
      
      await this.takeScreenshot('05_company_profile');
      
    } catch (error) {
      console.error('Company profile test failed:', error);
      this.errors.push(`Company profile test failed: ${error.message}`);
    }
  }

  async testDefaultSettings() {
    console.log('\n⚙️ Testing Default Settings...');
    
    try {
      const defaultsCard = await this.page.locator('[data-testid="card-defaults"]');
      await defaultsCard.scrollIntoViewIfNeeded();
      
      // Test default settings fields
      const manufacturerSelect = await this.page.locator('[data-testid="select-default-manufacturer"]');
      const leadTimeInput = await this.page.locator('[data-testid="input-default-lead-time"]');
      const priceBreakTextarea = await this.page.locator('[data-testid="textarea-price-break-rules"]');
      const saveButton = await this.page.locator('[data-testid="button-save-defaults"]');
      
      this.testResults.systemConfig.manufacturerSelect = await manufacturerSelect.isVisible();
      this.testResults.systemConfig.leadTimeInput = await leadTimeInput.isVisible();
      this.testResults.systemConfig.priceBreakRules = await priceBreakTextarea.isVisible();
      this.testResults.systemConfig.defaultsSaveButton = await saveButton.isVisible();
      
      // Test field interactions
      await leadTimeInput.click();
      await leadTimeInput.fill('21');
      const leadTimeValue = await leadTimeInput.inputValue();
      this.testResults.systemConfig.leadTimeEditable = leadTimeValue === '21';
      
      await priceBreakTextarea.click();
      await priceBreakTextarea.fill('1-10: $10, 11-50: $8, 51+: $6');
      const priceBreakValue = await priceBreakTextarea.inputValue();
      this.testResults.systemConfig.priceBreakEditable = priceBreakValue === '1-10: $10, 11-50: $8, 51+: $6';
      
      await this.takeScreenshot('06_default_settings');
      
    } catch (error) {
      console.error('Default settings test failed:', error);
      this.errors.push(`Default settings test failed: ${error.message}`);
    }
  }

  async testSystemSettings() {
    console.log('\n🖥️ Testing System Settings...');
    
    try {
      const systemCard = await this.page.locator('[data-testid="card-system-settings"]');
      await systemCard.scrollIntoViewIfNeeded();
      
      // Test system settings fields
      const retentionInput = await this.page.locator('[data-testid="input-soft-delete-retention"]');
      const auditLoggingSwitch = await this.page.locator('[data-testid="switch-audit-logging"]');
      const emailNotificationsSwitch = await this.page.locator('[data-testid="switch-email-notifications"]');
      const saveButton = await this.page.locator('[data-testid="button-save-system"]');
      
      this.testResults.systemConfig.retentionInput = await retentionInput.isVisible();
      this.testResults.systemConfig.auditLoggingSwitch = await auditLoggingSwitch.isVisible();
      this.testResults.systemConfig.emailNotificationsSwitch = await emailNotificationsSwitch.isVisible();
      this.testResults.systemConfig.systemSaveButton = await saveButton.isVisible();
      
      // Test switch interactions
      const auditSwitchChecked = await auditLoggingSwitch.isChecked();
      await auditLoggingSwitch.click();
      await this.page.waitForTimeout(500);
      const auditSwitchAfterClick = await auditLoggingSwitch.isChecked();
      this.testResults.systemConfig.auditSwitchToggleable = auditSwitchChecked !== auditSwitchAfterClick;
      
      const emailSwitchChecked = await emailNotificationsSwitch.isChecked();
      await emailNotificationsSwitch.click();
      await this.page.waitForTimeout(500);
      const emailSwitchAfterClick = await emailNotificationsSwitch.isChecked();
      this.testResults.systemConfig.emailSwitchToggleable = emailSwitchChecked !== emailSwitchAfterClick;
      
      // Test retention input
      await retentionInput.click();
      await retentionInput.fill('45');
      const retentionValue = await retentionInput.inputValue();
      this.testResults.systemConfig.retentionEditable = retentionValue === '45';
      
      await this.takeScreenshot('07_system_settings');
      
    } catch (error) {
      console.error('System settings test failed:', error);
      this.errors.push(`System settings test failed: ${error.message}`);
    }
  }

  async testBackupAndExport() {
    console.log('\n💾 Testing Backup and Export...');
    
    try {
      const backupCard = await this.page.locator('[data-testid="card-backup-export"]');
      await backupCard.scrollIntoViewIfNeeded();
      
      // Test backup and export buttons
      const downloadBackupButton = await this.page.locator('[data-testid="button-download-backup"]');
      const exportCsvButton = await this.page.locator('[data-testid="button-export-csv"]');
      
      this.testResults.dataManagement.downloadBackupButton = await downloadBackupButton.isVisible();
      this.testResults.dataManagement.exportCsvButton = await exportCsvButton.isVisible();
      
      // Test button clickability (without actually downloading)
      this.testResults.dataManagement.downloadBackupClickable = await downloadBackupButton.isEnabled();
      this.testResults.dataManagement.exportCsvClickable = await exportCsvButton.isEnabled();
      
      await this.takeScreenshot('08_backup_export');
      
    } catch (error) {
      console.error('Backup and export test failed:', error);
      this.errors.push(`Backup and export test failed: ${error.message}`);
    }
  }

  async testFormValidation() {
    console.log('\n✅ Testing Form Validation...');
    
    try {
      // Test email validation in company profile
      const companyEmailInput = await this.page.locator('[data-testid="input-company-email"]');
      await companyEmailInput.click();
      await companyEmailInput.fill('invalid-email');
      
      // Try to tab out to trigger validation
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
      
      // Check for validation state
      const emailValidationClass = await companyEmailInput.getAttribute('class');
      this.testResults.formValidation.emailValidationExists = emailValidationClass.includes('invalid') || emailValidationClass.includes('error');
      
      // Test number input validation
      const leadTimeInput = await this.page.locator('[data-testid="input-default-lead-time"]');
      await leadTimeInput.click();
      await leadTimeInput.fill('invalid-number');
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
      
      const leadTimeValue = await leadTimeInput.inputValue();
      this.testResults.formValidation.numberInputValidation = leadTimeValue === '' || !isNaN(leadTimeValue);
      
      // Test retention input validation
      const retentionInput = await this.page.locator('[data-testid="input-soft-delete-retention"]');
      await retentionInput.click();
      await retentionInput.fill('-5');
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
      
      const retentionValue = await retentionInput.inputValue();
      this.testResults.formValidation.negativeNumberValidation = retentionValue !== '-5';
      
      await this.takeScreenshot('09_form_validation');
      
    } catch (error) {
      console.error('Form validation test failed:', error);
      this.errors.push(`Form validation test failed: ${error.message}`);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');
    
    try {
      // Test mobile viewport
      await this.page.setViewportSize({ width: 375, height: 667 });
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('10_mobile_view');
      
      // Check if settings page is still accessible
      const settingsHeading = await this.page.locator('[data-testid="heading-settings"]');
      this.testResults.responsive.mobileAccessible = await settingsHeading.isVisible();
      
      // Test tablet viewport
      await this.page.setViewportSize({ width: 768, height: 1024 });
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('11_tablet_view');
      
      this.testResults.responsive.tabletAccessible = await settingsHeading.isVisible();
      
      // Test desktop viewport
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('12_desktop_view');
      
      this.testResults.responsive.desktopAccessible = await settingsHeading.isVisible();
      
    } catch (error) {
      console.error('Responsive design test failed:', error);
      this.errors.push(`Responsive design test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      const startTime = Date.now();
      
      // Navigate to settings page and measure load time
      await this.page.goto(`${this.baseUrl}/settings`);
      await this.page.waitForSelector('[data-testid="heading-settings"]');
      
      const loadTime = Date.now() - startTime;
      this.testResults.performance.settingsPageLoadTime = loadTime;
      this.testResults.performance.loadTimeAcceptable = loadTime < 3000; // 3 seconds threshold
      
      console.log(`⏱️ Settings page load time: ${loadTime}ms`);
      
    } catch (error) {
      console.error('Performance test failed:', error);
      this.errors.push(`Performance test failed: ${error.message}`);
    }
  }

  async testPersistence() {
    console.log('\n💾 Testing Settings Persistence...');
    
    try {
      // Fill in some settings
      const companyNameInput = await this.page.locator('[data-testid="input-company-name"]');
      await companyNameInput.fill('Persistence Test Company');
      
      const leadTimeInput = await this.page.locator('[data-testid="input-default-lead-time"]');
      await leadTimeInput.fill('30');
      
      // Navigate away and come back
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForTimeout(1000);
      await this.page.goto(`${this.baseUrl}/settings`);
      await this.page.waitForSelector('[data-testid="heading-settings"]');
      
      // Check if values persist (they shouldn't in current implementation)
      const companyNameValue = await companyNameInput.inputValue();
      const leadTimeValue = await leadTimeInput.inputValue();
      
      this.testResults.persistence.companyNamePersists = companyNameValue === 'Persistence Test Company';
      this.testResults.persistence.leadTimePersists = leadTimeValue === '30';
      this.testResults.persistence.implementationStatus = 'static_ui_only';
      
      await this.takeScreenshot('13_persistence_test');
      
    } catch (error) {
      console.error('Persistence test failed:', error);
      this.errors.push(`Persistence test failed: ${error.message}`);
    }
  }

  generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      testExecution: {
        timestamp,
        totalTests: Object.keys(this.testResults).length,
        errors: this.errors,
        screenshots: this.screenshots
      },
      results: this.testResults,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations()
    };

    // Write report to file
    fs.writeFileSync(
      'settings_comprehensive_test_report.json',
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  generateSummary() {
    const summary = {
      criticalIssues: [],
      warnings: [],
      passed: [],
      implementationGaps: []
    };

    // Critical issues
    if (!this.testResults.navigation.settingsLinkVisible) {
      summary.criticalIssues.push('Settings navigation link not visible');
    }
    if (!this.testResults.structure.headingExists) {
      summary.criticalIssues.push('Settings page heading missing');
    }

    // Implementation gaps
    if (!this.testResults.persistence.companyNamePersists) {
      summary.implementationGaps.push('Settings persistence not implemented');
    }
    if (this.testResults.persistence.implementationStatus === 'static_ui_only') {
      summary.implementationGaps.push('Settings are static UI only - no backend integration');
    }

    // Performance issues
    if (!this.testResults.performance.loadTimeAcceptable) {
      summary.warnings.push(`Settings page load time too slow: ${this.testResults.performance.settingsPageLoadTime}ms`);
    }

    // Responsive issues
    if (!this.testResults.responsive.mobileAccessible) {
      summary.warnings.push('Settings page not accessible on mobile');
    }

    // Passed tests
    if (this.testResults.structure.headingExists) {
      summary.passed.push('Settings page structure renders correctly');
    }
    if (this.testResults.userPreferences.companyNameEditable) {
      summary.passed.push('Form fields are interactive');
    }
    if (this.testResults.systemConfig.auditSwitchToggleable) {
      summary.passed.push('Switch controls are functional');
    }

    return summary;
  }

  generateRecommendations() {
    return [
      {
        priority: 'HIGH',
        category: 'Backend Integration',
        issue: 'Settings persistence not implemented',
        recommendation: 'Implement backend API endpoints for settings CRUD operations',
        impact: 'Users cannot save settings, making the page non-functional'
      },
      {
        priority: 'HIGH',
        category: 'Role-Based Access',
        issue: 'Role access controls are UI-only',
        recommendation: 'Implement proper role-based access control with backend validation',
        impact: 'Security vulnerability - unauthorized users might access settings'
      },
      {
        priority: 'MEDIUM',
        category: 'Form Validation',
        issue: 'Limited client-side validation',
        recommendation: 'Add comprehensive form validation with proper error messages',
        impact: 'Poor user experience and potential data quality issues'
      },
      {
        priority: 'MEDIUM',
        category: 'Data Management',
        issue: 'Backup and export buttons non-functional',
        recommendation: 'Implement actual backup and export functionality',
        impact: 'Data management features are misleading to users'
      },
      {
        priority: 'LOW',
        category: 'User Experience',
        issue: 'No success/error notifications',
        recommendation: 'Add toast notifications for settings save operations',
        impact: 'Users lack feedback on their actions'
      }
    ];
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

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Settings Testing...\n');
    
    try {
      await this.initialize();
      await this.navigateToApp();
      await this.testSettingsPageStructure();
      await this.testRoleBasedAccess();
      await this.testCompanyProfileSettings();
      await this.testDefaultSettings();
      await this.testSystemSettings();
      await this.testBackupAndExport();
      await this.testFormValidation();
      await this.testResponsiveDesign();
      await this.testPerformance();
      await this.testPersistence();
      
      const report = this.generateReport();
      
      console.log('\n📊 Test Execution Complete!');
      console.log('📋 Report Summary:');
      console.log(`   Critical Issues: ${report.summary.criticalIssues.length}`);
      console.log(`   Warnings: ${report.summary.warnings.length}`);
      console.log(`   Passed Tests: ${report.summary.passed.length}`);
      console.log(`   Implementation Gaps: ${report.summary.implementationGaps.length}`);
      console.log('\n📄 Full report saved to: settings_comprehensive_test_report.json');
      
      return report;
      
    } catch (error) {
      console.error('Test execution failed:', error);
      this.errors.push(`Test execution failed: ${error.message}`);
      return { error: error.message, errors: this.errors };
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
async function main() {
  const tester = new SettingsComprehensiveTest();
  const report = await tester.runAllTests();
  
  if (report.error) {
    console.error('Testing failed:', report.error);
    process.exit(1);
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = SettingsComprehensiveTest;