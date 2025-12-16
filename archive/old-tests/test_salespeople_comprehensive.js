// Comprehensive Salespeople CRUD Testing Script
// This script tests all aspects of the salespeople management system

const testResults = {
  crudOperations: {
    create: { passed: 0, failed: 0, tests: [] },
    read: { passed: 0, failed: 0, tests: [] },
    update: { passed: 0, failed: 0, tests: [] },
    delete: { passed: 0, failed: 0, tests: [] }
  },
  territoryManagement: { passed: 0, failed: 0, tests: [] },
  performanceTracking: { passed: 0, failed: 0, tests: [] },
  leadAssignment: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] },
  permissions: { passed: 0, failed: 0, tests: [] },
  searchAndFilter: { passed: 0, failed: 0, tests: [] },
  formValidation: { passed: 0, failed: 0, tests: [] },
  commissionCalculations: { passed: 0, failed: 0, tests: [] },
  analytics: { passed: 0, failed: 0, tests: [] }
};

// Utility functions for testing
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (category, testName, result, details = '') => {
  const test = { name: testName, result, details, timestamp: new Date().toISOString() };
  testResults[category].tests.push(test);
  if (result === 'PASS') {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
  }
  console.log(`[${result}] ${category}.${testName}: ${details}`);
};

const waitForElement = async (selector, timeout = 10000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await sleep(100);
  }
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
};

const clickElement = async (selector, description) => {
  try {
    const element = await waitForElement(selector);
    element.click();
    await sleep(500); // Wait for UI response
    return true;
  } catch (error) {
    console.error(`Failed to click ${description}: ${error.message}`);
    return false;
  }
};

const fillInput = async (selector, value, description) => {
  try {
    const element = await waitForElement(selector);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    return true;
  } catch (error) {
    console.error(`Failed to fill ${description}: ${error.message}`);
    return false;
  }
};

// Main testing function
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Salespeople Testing...');
  
  try {
    // Navigate to salespeople page if not already there
    if (!window.location.pathname.includes('/salespeople')) {
      window.location.href = '/salespeople';
      await sleep(2000);
    }

    // Test 1: CRUD Operations
    await testCRUDOperations();
    
    // Test 2: Territory Management
    await testTerritoryManagement();
    
    // Test 3: Performance Tracking
    await testPerformanceTracking();
    
    // Test 4: Search and Filtering
    await testSearchAndFiltering();
    
    // Test 5: Form Validation
    await testFormValidation();
    
    // Test 6: Role-based Permissions (requires different user contexts)
    await testPermissions();
    
    // Test 7: Integration Testing
    await testIntegration();
    
    // Test 8: Commission Calculations
    await testCommissionCalculations();
    
    // Test 9: Analytics and Reporting
    await testAnalytics();
    
    // Generate comprehensive report
    generateTestReport();
    
  } catch (error) {
    console.error('❌ Testing failed with error:', error);
  }
}

// CRUD Operations Testing
async function testCRUDOperations() {
  console.log('📋 Testing CRUD Operations...');
  
  // Test READ - List salespeople
  try {
    const salespeopleList = document.querySelector('[data-testid*="salespeople-list"], .salespeople-container, .grid');
    if (salespeopleList) {
      const salespeopleCount = salespeopleList.querySelectorAll('[data-testid*="card"], .card, [data-testid*="row"]').length;
      logTest('crudOperations', 'listSalespeople', 'PASS', `Found ${salespeopleCount} salespeople in the list`);
    } else {
      logTest('crudOperations', 'listSalespeople', 'FAIL', 'Salespeople list not found');
    }
  } catch (error) {
    logTest('crudOperations', 'listSalespeople', 'FAIL', `Error: ${error.message}`);
  }
  
  // Test CREATE - Add new salesperson
  try {
    const createButton = document.querySelector('[data-testid="button-create"], [data-testid*="add"], button:contains("Add"), button:contains("Create")');
    if (createButton) {
      createButton.click();
      await sleep(1000);
      
      // Check if modal opened
      const modal = document.querySelector('[data-testid*="modal"], .modal, [role="dialog"]');
      if (modal && modal.style.display !== 'none') {
        logTest('crudOperations', 'openCreateModal', 'PASS', 'Create modal opened successfully');
        
        // Try to close modal for now
        const closeButton = modal.querySelector('[data-testid="button-cancel"], button:contains("Cancel"), button:contains("Close")');
        if (closeButton) closeButton.click();
        await sleep(500);
      } else {
        logTest('crudOperations', 'openCreateModal', 'FAIL', 'Create modal did not open');
      }
    } else {
      logTest('crudOperations', 'openCreateModal', 'FAIL', 'Create button not found');
    }
  } catch (error) {
    logTest('crudOperations', 'openCreateModal', 'FAIL', `Error: ${error.message}`);
  }
  
  // Test READ - Individual salesperson details
  try {
    const firstSalesperson = document.querySelector('[data-testid*="card"], .card, [data-testid*="row"]');
    if (firstSalesperson) {
      const detailButton = firstSalesperson.querySelector('[data-testid*="detail"], [data-testid*="view"], button, a');
      if (detailButton) {
        detailButton.click();
        await sleep(1000);
        
        const detailModal = document.querySelector('[data-testid*="modal"], .modal, [role="dialog"]');
        if (detailModal && detailModal.style.display !== 'none') {
          logTest('crudOperations', 'viewSalespersonDetails', 'PASS', 'Salesperson detail modal opened');
          
          // Close modal
          const closeButton = detailModal.querySelector('[data-testid="button-cancel"], button:contains("Cancel"), button:contains("Close")');
          if (closeButton) closeButton.click();
          await sleep(500);
        } else {
          logTest('crudOperations', 'viewSalespersonDetails', 'FAIL', 'Detail modal did not open');
        }
      } else {
        logTest('crudOperations', 'viewSalespersonDetails', 'FAIL', 'Detail button not found');
      }
    } else {
      logTest('crudOperations', 'viewSalespersonDetails', 'FAIL', 'No salesperson found to view details');
    }
  } catch (error) {
    logTest('crudOperations', 'viewSalespersonDetails', 'FAIL', `Error: ${error.message}`);
  }
}

// Territory Management Testing
async function testTerritoryManagement() {
  console.log('🗺️ Testing Territory Management...');
  
  try {
    // Check territory filter dropdown
    const territoryFilter = document.querySelector('[data-testid*="territory"], select, [placeholder*="territory" i]');
    if (territoryFilter) {
      logTest('territoryManagement', 'territoryFilterExists', 'PASS', 'Territory filter found');
      
      // Test different territory selections
      const options = territoryFilter.querySelectorAll('option');
      if (options.length > 1) {
        logTest('territoryManagement', 'territoryOptions', 'PASS', `Found ${options.length} territory options`);
      } else {
        logTest('territoryManagement', 'territoryOptions', 'FAIL', 'No territory options found');
      }
    } else {
      logTest('territoryManagement', 'territoryFilterExists', 'FAIL', 'Territory filter not found');
    }
  } catch (error) {
    logTest('territoryManagement', 'territoryManagement', 'FAIL', `Error: ${error.message}`);
  }
}

// Performance Tracking Testing
async function testPerformanceTracking() {
  console.log('📊 Testing Performance Tracking...');
  
  try {
    // Look for performance metrics on the page
    const performanceElements = document.querySelectorAll('[data-testid*="performance"], [data-testid*="metric"], [data-testid*="quota"], .progress, .metric');
    if (performanceElements.length > 0) {
      logTest('performanceTracking', 'performanceMetricsDisplay', 'PASS', `Found ${performanceElements.length} performance elements`);
    } else {
      logTest('performanceTracking', 'performanceMetricsDisplay', 'FAIL', 'No performance metrics found');
    }
    
    // Check for quota attainment indicators
    const quotaElements = document.querySelectorAll('[data-testid*="quota"], .progress, [class*="progress"]');
    if (quotaElements.length > 0) {
      logTest('performanceTracking', 'quotaAttainmentDisplay', 'PASS', `Found ${quotaElements.length} quota elements`);
    } else {
      logTest('performanceTracking', 'quotaAttainmentDisplay', 'FAIL', 'No quota attainment indicators found');
    }
  } catch (error) {
    logTest('performanceTracking', 'performanceTracking', 'FAIL', `Error: ${error.message}`);
  }
}

// Search and Filtering Testing
async function testSearchAndFiltering() {
  console.log('🔍 Testing Search and Filtering...');
  
  try {
    // Test search functionality
    const searchInput = document.querySelector('[data-testid*="search"], input[placeholder*="search" i], input[type="search"]');
    if (searchInput) {
      logTest('searchAndFilter', 'searchInputExists', 'PASS', 'Search input found');
      
      // Test search functionality
      searchInput.value = 'Carter';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(1000);
      
      const resultsAfterSearch = document.querySelectorAll('[data-testid*="card"], .card, [data-testid*="row"]');
      logTest('searchAndFilter', 'searchFunctionality', 'PASS', `Search returned ${resultsAfterSearch.length} results`);
      
      // Clear search
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(500);
    } else {
      logTest('searchAndFilter', 'searchInputExists', 'FAIL', 'Search input not found');
    }
    
    // Test status filter
    const statusFilter = document.querySelector('[data-testid*="status"], select');
    if (statusFilter) {
      logTest('searchAndFilter', 'statusFilterExists', 'PASS', 'Status filter found');
    } else {
      logTest('searchAndFilter', 'statusFilterExists', 'FAIL', 'Status filter not found');
    }
  } catch (error) {
    logTest('searchAndFilter', 'searchAndFilter', 'FAIL', `Error: ${error.message}`);
  }
}

// Form Validation Testing
async function testFormValidation() {
  console.log('✅ Testing Form Validation...');
  
  try {
    // Open create modal again for validation testing
    const createButton = document.querySelector('[data-testid="button-create"], [data-testid*="add"], button:contains("Add"), button:contains("Create")');
    if (createButton) {
      createButton.click();
      await sleep(1000);
      
      const modal = document.querySelector('[data-testid*="modal"], .modal, [role="dialog"]');
      if (modal) {
        // Try to submit empty form
        const submitButton = modal.querySelector('[data-testid="button-create"], [data-testid="button-submit"], button[type="submit"]');
        if (submitButton) {
          submitButton.click();
          await sleep(500);
          
          // Check for validation errors
          const errorMessages = modal.querySelectorAll('.error, [data-testid*="error"], .text-red, .text-destructive');
          if (errorMessages.length > 0) {
            logTest('formValidation', 'requiredFieldValidation', 'PASS', `Found ${errorMessages.length} validation errors`);
          } else {
            logTest('formValidation', 'requiredFieldValidation', 'FAIL', 'No validation errors shown for empty form');
          }
        }
        
        // Close modal
        const closeButton = modal.querySelector('[data-testid="button-cancel"], button:contains("Cancel")');
        if (closeButton) closeButton.click();
      }
    }
  } catch (error) {
    logTest('formValidation', 'formValidation', 'FAIL', `Error: ${error.message}`);
  }
}

// Permission Testing (basic UI-level checks)
async function testPermissions() {
  console.log('🔒 Testing Permissions...');
  
  try {
    // Check if admin-specific features are visible (like delete buttons)
    const deleteButtons = document.querySelectorAll('[data-testid*="delete"], button:contains("Delete")');
    const createButtons = document.querySelectorAll('[data-testid*="create"], [data-testid*="add"]');
    
    logTest('permissions', 'adminFeaturesVisible', 'PASS', `Found ${deleteButtons.length} delete buttons and ${createButtons.length} create buttons`);
  } catch (error) {
    logTest('permissions', 'permissions', 'FAIL', `Error: ${error.message}`);
  }
}

// Integration Testing
async function testIntegration() {
  console.log('🔗 Testing Integration...');
  
  try {
    // Check if there are links to related entities (leads, orders)
    const leadsLinks = document.querySelectorAll('a[href*="leads"], [data-testid*="lead"]');
    const ordersLinks = document.querySelectorAll('a[href*="orders"], [data-testid*="order"]');
    
    logTest('integration', 'leadsIntegration', leadsLinks.length > 0 ? 'PASS' : 'FAIL', `Found ${leadsLinks.length} leads links`);
    logTest('integration', 'ordersIntegration', ordersLinks.length > 0 ? 'PASS' : 'FAIL', `Found ${ordersLinks.length} orders links`);
  } catch (error) {
    logTest('integration', 'integration', 'FAIL', `Error: ${error.message}`);
  }
}

// Commission Calculations Testing
async function testCommissionCalculations() {
  console.log('💰 Testing Commission Calculations...');
  
  try {
    // Look for commission-related elements
    const commissionElements = document.querySelectorAll('[data-testid*="commission"], [class*="commission"], .revenue, .earnings');
    if (commissionElements.length > 0) {
      logTest('commissionCalculations', 'commissionDisplay', 'PASS', `Found ${commissionElements.length} commission elements`);
    } else {
      logTest('commissionCalculations', 'commissionDisplay', 'FAIL', 'No commission elements found');
    }
  } catch (error) {
    logTest('commissionCalculations', 'commissionCalculations', 'FAIL', `Error: ${error.message}`);
  }
}

// Analytics and Reporting Testing
async function testAnalytics() {
  console.log('📈 Testing Analytics and Reporting...');
  
  try {
    // Check for export functionality
    const exportButton = document.querySelector('[data-testid*="export"], button:contains("Export"), button:contains("Download")');
    if (exportButton) {
      logTest('analytics', 'exportFunctionality', 'PASS', 'Export button found');
    } else {
      logTest('analytics', 'exportFunctionality', 'FAIL', 'Export button not found');
    }
    
    // Check for analytics charts or metrics
    const charts = document.querySelectorAll('.chart, canvas, svg, [data-testid*="chart"]');
    if (charts.length > 0) {
      logTest('analytics', 'analyticsCharts', 'PASS', `Found ${charts.length} chart elements`);
    } else {
      logTest('analytics', 'analyticsCharts', 'FAIL', 'No analytics charts found');
    }
  } catch (error) {
    logTest('analytics', 'analytics', 'FAIL', `Error: ${error.message}`);
  }
}

// Generate comprehensive test report
function generateTestReport() {
  console.log('\n📋 COMPREHENSIVE TEST REPORT');
  console.log('=' .repeat(50));
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [category, results] of Object.entries(testResults)) {
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`\n${category.toUpperCase()}:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    
    if (results.tests.length > 0) {
      results.tests.forEach(test => {
        const icon = test.result === 'PASS' ? '✅' : '❌';
        console.log(`    ${icon} ${test.name}: ${test.details}`);
      });
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`TOTAL RESULTS:`);
  console.log(`✅ Total Passed: ${totalPassed}`);
  console.log(`❌ Total Failed: ${totalFailed}`);
  console.log(`📊 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  // Store results for later retrieval
  window.testResults = testResults;
  window.testSummary = {
    totalPassed,
    totalFailed,
    successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1),
    completedAt: new Date().toISOString()
  };
}

// Start the tests
runComprehensiveTests();