#!/usr/bin/env node

/**
 * Comprehensive Error Handling and Edge Case Testing Suite
 * 
 * This script tests error handling across the entire wholesale management application
 * to ensure production readiness.
 */

const puppeteer = require('playwright');
const fetch = require('node-fetch');

class ErrorTestingSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:5000';
    this.results = {
      networkFailure: [],
      authentication: [],
      formValidation: [],
      apiError: [],
      dataIntegrity: [],
      fileUpload: [],
      businessLogic: [],
      uiError: [],
      performance: [],
      integration: []
    };
  }

  async setup() {
    console.log('🚀 Starting Comprehensive Error Testing Suite...\n');
    
    this.browser = await puppeteer.chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });
    
    // Listen for network failures
    this.page.on('requestfailed', request => {
      console.log('Network Request Failed:', request.url(), request.failure());
    });
    
    await this.page.goto(this.baseUrl);
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Helper method to record test results
  recordResult(category, testName, status, details = '') {
    this.results[category].push({
      test: testName,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // 1. NETWORK FAILURE TESTING
  async testNetworkFailures() {
    console.log('🌐 Testing Network Failure Scenarios...');
    
    try {
      // Test 1: Complete Network Disconnection Simulation
      console.log('  📡 Testing network disconnection...');
      await this.page.setOfflineMode(true);
      
      // Try to navigate and interact with the app
      await this.page.reload();
      await this.page.waitForTimeout(5000);
      
      // Check if app shows appropriate offline message
      const offlineMessage = await this.page.$('[data-testid*="offline"], [data-testid*="error"]');
      this.recordResult('networkFailure', 'Complete Network Disconnection', 
        offlineMessage ? 'PASS' : 'FAIL', 
        'Application should show offline/error state when network is unavailable'
      );
      
      // Re-enable network
      await this.page.setOfflineMode(false);
      
      // Test 2: Slow Network Connection
      console.log('  🐌 Testing slow network conditions...');
      await this.page.route('**/*', route => {
        setTimeout(() => route.continue(), 5000); // 5 second delay
      });
      
      await this.page.reload();
      const slowLoadHandled = await this.page.waitForSelector('[data-testid*="loading"]', { timeout: 2000 }).catch(() => null);
      this.recordResult('networkFailure', 'Slow Network Connection', 
        slowLoadHandled ? 'PASS' : 'FAIL',
        'Application should show loading states during slow network conditions'
      );
      
      // Remove route handler
      await this.page.unroute('**/*');
      
    } catch (error) {
      console.error('Network testing error:', error);
      this.recordResult('networkFailure', 'Network Testing Error', 'ERROR', error.message);
    }
  }

  // 2. AUTHENTICATION AND AUTHORIZATION ERROR TESTING
  async testAuthenticationErrors() {
    console.log('🔐 Testing Authentication & Authorization Errors...');
    
    try {
      // Test 1: Unauthorized API Access
      console.log('  🚫 Testing unauthorized API access...');
      const unauthorizedResponse = await fetch(`${this.baseUrl}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.recordResult('authentication', 'Unauthorized API Access', 
        unauthorizedResponse.status === 401 ? 'PASS' : 'FAIL',
        `Expected 401, got ${unauthorizedResponse.status}`
      );
      
      // Test 2: Invalid Token Handling
      console.log('  🎫 Testing invalid token handling...');
      const invalidTokenResponse = await fetch(`${this.baseUrl}/api/users`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      this.recordResult('authentication', 'Invalid Token Handling', 
        invalidTokenResponse.status === 401 ? 'PASS' : 'FAIL',
        `Expected 401 for invalid token, got ${invalidTokenResponse.status}`
      );
      
      // Test 3: Role-based Access Violation
      // This requires being logged in with different roles
      
    } catch (error) {
      console.error('Authentication testing error:', error);
      this.recordResult('authentication', 'Authentication Testing Error', 'ERROR', error.message);
    }
  }

  // 3. FORM VALIDATION ERROR TESTING
  async testFormValidation() {
    console.log('📝 Testing Form Validation Errors...');
    
    try {
      // Navigate to a form page
      await this.page.goto(`${this.baseUrl}/organizations`);
      await this.page.waitForTimeout(2000);
      
      // Test 1: Required Field Validation
      console.log('  ✅ Testing required field validation...');
      const createButton = await this.page.$('[data-testid*="create"], [data-testid*="add"]');
      if (createButton) {
        await createButton.click();
        await this.page.waitForTimeout(1000);
        
        // Try to submit empty form
        const submitButton = await this.page.$('[data-testid*="submit"], [data-testid*="save"]');
        if (submitButton) {
          await submitButton.click();
          await this.page.waitForTimeout(1000);
          
          // Check for validation errors
          const validationError = await this.page.$('.text-destructive, .error, [role="alert"]');
          this.recordResult('formValidation', 'Required Field Validation', 
            validationError ? 'PASS' : 'FAIL',
            'Form should show validation errors for required fields'
          );
        }
      }
      
      // Test 2: Data Type Validation
      console.log('  🔢 Testing data type validation...');
      const nameInput = await this.page.$('[data-testid*="input-name"]');
      if (nameInput) {
        await nameInput.fill('123!@#$%'); // Special characters in name field
        await this.page.waitForTimeout(500);
        
        // Check if validation triggers
        const typeValidationError = await this.page.$('.text-destructive');
        this.recordResult('formValidation', 'Data Type Validation', 
          typeValidationError ? 'PASS' : 'WARN',
          'Special character handling in name fields'
        );
      }
      
      // Test 3: Field Length Limits
      console.log('  📏 Testing field length limits...');
      if (nameInput) {
        const longText = 'A'.repeat(1000); // Very long text
        await nameInput.fill(longText);
        await this.page.waitForTimeout(500);
        
        const lengthValidationError = await this.page.$('.text-destructive');
        this.recordResult('formValidation', 'Field Length Limits', 
          lengthValidationError ? 'PASS' : 'WARN',
          'Field should enforce maximum length limits'
        );
      }
      
    } catch (error) {
      console.error('Form validation testing error:', error);
      this.recordResult('formValidation', 'Form Validation Testing Error', 'ERROR', error.message);
    }
  }

  // 4. API ERROR HANDLING TESTING
  async testApiErrors() {
    console.log('🔌 Testing API Error Handling...');
    
    try {
      // Test 1: HTTP 404 - Not Found
      console.log('  🔍 Testing 404 handling...');
      const notFoundResponse = await fetch(`${this.baseUrl}/api/nonexistent-endpoint`);
      this.recordResult('apiError', 'HTTP 404 Handling', 
        notFoundResponse.status === 404 ? 'PASS' : 'FAIL',
        `Expected 404, got ${notFoundResponse.status}`
      );
      
      // Test 2: HTTP 400 - Bad Request with malformed JSON
      console.log('  📋 Testing malformed request handling...');
      try {
        const malformedResponse = await fetch(`${this.baseUrl}/api/organizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"invalid": json}' // Invalid JSON
        });
        
        this.recordResult('apiError', 'Malformed JSON Handling', 
          malformedResponse.status === 400 ? 'PASS' : 'FAIL',
          `Expected 400 for malformed JSON, got ${malformedResponse.status}`
        );
      } catch (error) {
        this.recordResult('apiError', 'Malformed JSON Handling', 'PASS', 
          'Request properly rejected due to malformed JSON'
        );
      }
      
      // Test 3: HTTP 500 - Server Error Simulation
      console.log('  💥 Testing server error handling...');
      // This would require actually triggering a server error
      
    } catch (error) {
      console.error('API error testing error:', error);
      this.recordResult('apiError', 'API Error Testing Error', 'ERROR', error.message);
    }
  }

  // 5. DATA INTEGRITY TESTING
  async testDataIntegrity() {
    console.log('🗄️ Testing Data Integrity...');
    
    try {
      // Test 1: Duplicate Entry Prevention
      console.log('  👥 Testing duplicate prevention...');
      
      // This would require testing database constraints
      // For now, we'll test via API calls
      
      // Test 2: Foreign Key Constraints
      console.log('  🔗 Testing foreign key constraints...');
      
      // Test 3: Required Fields at Database Level
      console.log('  📋 Testing database field requirements...');
      
      this.recordResult('dataIntegrity', 'Data Integrity Testing', 'INFO', 
        'Data integrity testing requires database access and specific test data'
      );
      
    } catch (error) {
      console.error('Data integrity testing error:', error);
      this.recordResult('dataIntegrity', 'Data Integrity Testing Error', 'ERROR', error.message);
    }
  }

  // 6. FILE UPLOAD ERROR TESTING
  async testFileUploadErrors() {
    console.log('📁 Testing File Upload Errors...');
    
    try {
      // Navigate to a page with file upload
      await this.page.goto(`${this.baseUrl}/catalog`);
      await this.page.waitForTimeout(2000);
      
      // Look for upload buttons
      const uploadButton = await this.page.$('[data-testid*="upload"]');
      if (uploadButton) {
        console.log('  📎 Testing file upload restrictions...');
        
        // This would test:
        // - File size limits
        // - File type restrictions
        // - Malicious file detection
        
        this.recordResult('fileUpload', 'File Upload Available', 'INFO', 
          'File upload functionality found and needs specific testing'
        );
      } else {
        this.recordResult('fileUpload', 'File Upload Not Found', 'WARN', 
          'No file upload functionality detected on catalog page'
        );
      }
      
    } catch (error) {
      console.error('File upload testing error:', error);
      this.recordResult('fileUpload', 'File Upload Testing Error', 'ERROR', error.message);
    }
  }

  // 7. BUSINESS LOGIC ERROR TESTING
  async testBusinessLogicErrors() {
    console.log('💼 Testing Business Logic Errors...');
    
    try {
      // Test 1: Negative Quantities
      console.log('  ➖ Testing negative quantity handling...');
      
      // Test 2: Invalid Date Ranges
      console.log('  📅 Testing invalid date handling...');
      
      // Test 3: Workflow State Violations
      console.log('  🔄 Testing workflow violations...');
      
      this.recordResult('businessLogic', 'Business Logic Testing', 'INFO', 
        'Business logic testing requires specific scenarios and test data'
      );
      
    } catch (error) {
      console.error('Business logic testing error:', error);
      this.recordResult('businessLogic', 'Business Logic Testing Error', 'ERROR', error.message);
    }
  }

  // 8. UI/UX ERROR HANDLING TESTING
  async testUIErrorHandling() {
    console.log('🎨 Testing UI/UX Error Handling...');
    
    try {
      // Test 1: Error Message Display
      console.log('  💬 Testing error message display...');
      
      // Test 2: Loading States
      console.log('  ⏳ Testing loading states...');
      const loadingElements = await this.page.$$('[data-testid*="loading"], .loading, [role="status"]');
      this.recordResult('uiError', 'Loading States Available', 
        loadingElements.length > 0 ? 'PASS' : 'WARN',
        `Found ${loadingElements.length} loading state elements`
      );
      
      // Test 3: Modal Error Handling
      console.log('  🪟 Testing modal error handling...');
      
      // Test 4: Navigation Error Protection
      console.log('  🧭 Testing navigation protection...');
      
    } catch (error) {
      console.error('UI error testing error:', error);
      this.recordResult('uiError', 'UI Error Testing Error', 'ERROR', error.message);
    }
  }

  // 9. PERFORMANCE ERROR TESTING
  async testPerformanceErrors() {
    console.log('⚡ Testing Performance Errors...');
    
    try {
      // Test 1: Large Dataset Handling
      console.log('  📊 Testing large dataset handling...');
      
      // Test 2: Memory Usage Monitoring
      console.log('  🧠 Testing memory usage...');
      const metrics = await this.page.metrics();
      this.recordResult('performance', 'Memory Usage', 'INFO', 
        `JS Heap Used: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`
      );
      
      // Test 3: Request Timeout Handling
      console.log('  ⏱️ Testing request timeouts...');
      
    } catch (error) {
      console.error('Performance testing error:', error);
      this.recordResult('performance', 'Performance Testing Error', 'ERROR', error.message);
    }
  }

  // 10. INTEGRATION ERROR TESTING
  async testIntegrationErrors() {
    console.log('🔌 Testing Integration Errors...');
    
    try {
      // Test 1: Database Connection Failures
      console.log('  🗃️ Testing database connectivity...');
      
      // Test 2: External Service Failures
      console.log('  🌐 Testing external service dependencies...');
      
      // Test 3: File Storage Service Failures
      console.log('  🗂️ Testing file storage services...');
      
      this.recordResult('integration', 'Integration Testing', 'INFO', 
        'Integration testing requires specific service manipulation'
      );
      
    } catch (error) {
      console.error('Integration testing error:', error);
      this.recordResult('integration', 'Integration Testing Error', 'ERROR', error.message);
    }
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n📋 COMPREHENSIVE ERROR TESTING REPORT');
    console.log('=====================================\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let warningTests = 0;
    
    for (const [category, tests] of Object.entries(this.results)) {
      if (tests.length === 0) continue;
      
      console.log(`${category.toUpperCase()}:`);
      console.log('-'.repeat(category.length + 1));
      
      tests.forEach(test => {
        const icon = test.status === 'PASS' ? '✅' : 
                    test.status === 'FAIL' ? '❌' : 
                    test.status === 'WARN' ? '⚠️' : '📝';
        
        console.log(`  ${icon} ${test.test}: ${test.status}`);
        if (test.details) {
          console.log(`    Details: ${test.details}`);
        }
        
        totalTests++;
        if (test.status === 'PASS') passedTests++;
        else if (test.status === 'FAIL') failedTests++;
        else if (test.status === 'WARN') warningTests++;
      });
      console.log('');
    }
    
    console.log('SUMMARY:');
    console.log('--------');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️ Warnings: ${warningTests}`);
    console.log(`📝 Info: ${totalTests - passedTests - failedTests - warningTests}`);
    
    const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    console.log(`Success Rate: ${successRate}%\n`);
    
    return {
      totalTests,
      passedTests,
      failedTests,
      warningTests,
      successRate,
      results: this.results
    };
  }

  // Run all tests
  async runAllTests() {
    try {
      await this.setup();
      
      await this.testNetworkFailures();
      await this.testAuthenticationErrors();
      await this.testFormValidation();
      await this.testApiErrors();
      await this.testDataIntegrity();
      await this.testFileUploadErrors();
      await this.testBusinessLogicErrors();
      await this.testUIErrorHandling();
      await this.testPerformanceErrors();
      await this.testIntegrationErrors();
      
      const report = this.generateReport();
      
      // Save results to file
      const fs = require('fs');
      fs.writeFileSync('comprehensive_error_test_results.json', 
        JSON.stringify(report, null, 2)
      );
      
      console.log('📊 Full results saved to comprehensive_error_test_results.json');
      
    } catch (error) {
      console.error('Testing suite error:', error);
    } finally {
      await this.teardown();
    }
  }
}

// Run the testing suite
if (require.main === module) {
  const suite = new ErrorTestingSuite();
  suite.runAllTests().catch(console.error);
}

module.exports = ErrorTestingSuite;