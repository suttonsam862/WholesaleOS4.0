#!/usr/bin/env node

/**
 * Business Logic Error Testing Suite
 * Tests application-level business rules and workflow validations
 */

const fs = require('fs');
const path = require('path');

class BusinessLogicTester {
  constructor() {
    this.results = [];
  }

  recordTest(category, test, status, details) {
    this.results.push({
      category,
      test,
      status,
      details,
      timestamp: new Date().toISOString()
    });
    console.log(`${status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'} ${test}: ${status} - ${details}`);
  }

  async analyzeCodeForBusinessLogic() {
    console.log('\n💼 Analyzing Business Logic Implementation...');
    
    try {
      // Read schema file to understand business constraints
      const schemaPath = path.join(__dirname, 'shared', 'schema.ts');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Check for validation rules in schemas
        const hasMinConstraints = schemaContent.includes('.min(');
        const hasMaxConstraints = schemaContent.includes('.max(');
        const hasPositiveConstraints = schemaContent.includes('.positive(');
        const hasRefineConstraints = schemaContent.includes('.refine(');
        
        this.recordTest('validation', 'Schema Validation Rules Present', 
          hasMinConstraints && hasMaxConstraints ? 'PASS' : 'WARN',
          `Min constraints: ${hasMinConstraints}, Max constraints: ${hasMaxConstraints}, Positive: ${hasPositiveConstraints}, Custom: ${hasRefineConstraints}`);
        
        // Check for price validation
        const hasPriceValidation = schemaContent.includes('basePrice') && schemaContent.includes('.refine(');
        this.recordTest('validation', 'Price Validation Logic', 
          hasPriceValidation ? 'PASS' : 'WARN',
          'Should validate positive prices and proper format');
        
        // Check for date validation
        const hasDateValidation = schemaContent.includes('date') && (schemaContent.includes('.refine(') || schemaContent.includes('.transform('));
        this.recordTest('validation', 'Date Validation Logic', 
          hasDateValidation ? 'PASS' : 'WARN',
          'Should validate date formats and ranges');
        
      } else {
        this.recordTest('validation', 'Schema File Access', 'ERROR', 
          'Could not access schema file for analysis');
      }

      // Check routes file for business logic validation
      const routesPath = path.join(__dirname, 'server', 'routes.ts');
      if (fs.existsSync(routesPath)) {
        const routesContent = fs.readFileSync(routesPath, 'utf8');
        
        // Check for admin protection
        const hasAdminProtection = routesContent.includes('countAdmins') && routesContent.includes('Cannot delete the last admin');
        this.recordTest('business', 'Admin Deletion Protection', 
          hasAdminProtection ? 'PASS' : 'FAIL',
          'Should prevent deletion of last admin user');
        
        // Check for self-deletion protection  
        const hasSelfDeletionProtection = routesContent.includes('Cannot delete your own account');
        this.recordTest('business', 'Self-Deletion Protection', 
          hasSelfDeletionProtection ? 'PASS' : 'FAIL',
          'Should prevent users from deleting their own accounts');
        
        // Check for duplicate email protection
        const hasEmailDuplicationCheck = routesContent.includes('Email already exists');
        this.recordTest('business', 'Duplicate Email Prevention', 
          hasEmailDuplicationCheck ? 'PASS' : 'FAIL',
          'Should prevent duplicate email registrations');
        
        // Check for role validation
        const hasRoleValidation = routesContent.includes('validRoles') && routesContent.includes('Invalid role');
        this.recordTest('business', 'Role Validation', 
          hasRoleValidation ? 'PASS' : 'FAIL',
          'Should validate user roles against allowed values');
        
        // Check for permission checks
        const hasPermissionChecks = routesContent.includes('requirePermission');
        this.recordTest('business', 'Permission Enforcement', 
          hasPermissionChecks ? 'PASS' : 'FAIL',
          'Should enforce role-based permissions on endpoints');
        
      } else {
        this.recordTest('business', 'Routes File Access', 'ERROR', 
          'Could not access routes file for analysis');
      }

    } catch (error) {
      this.recordTest('validation', 'Business Logic Analysis', 'ERROR', 
        `Error analyzing business logic: ${error.message}`);
    }
  }

  async analyzeErrorHandlingPatterns() {
    console.log('\n🛡️ Analyzing Error Handling Patterns...');
    
    try {
      // Check server routes for error handling
      const routesPath = path.join(__dirname, 'server', 'routes.ts');
      if (fs.existsSync(routesPath)) {
        const routesContent = fs.readFileSync(routesPath, 'utf8');
        
        // Check for try-catch blocks
        const tryCatchCount = (routesContent.match(/try\s*{/g) || []).length;
        this.recordTest('errorHandling', 'Try-Catch Block Usage', 
          tryCatchCount > 10 ? 'PASS' : 'WARN',
          `Found ${tryCatchCount} try-catch blocks`);
        
        // Check for Zod error handling
        const hasZodErrorHandling = routesContent.includes('z.ZodError') && routesContent.includes('error.errors');
        this.recordTest('errorHandling', 'Zod Validation Error Handling', 
          hasZodErrorHandling ? 'PASS' : 'FAIL',
          'Should properly handle and format Zod validation errors');
        
        // Check for error logging
        const hasErrorLogging = routesContent.includes('console.error');
        this.recordTest('errorHandling', 'Error Logging', 
          hasErrorLogging ? 'PASS' : 'WARN',
          'Should log errors for debugging and monitoring');
        
        // Check for proper HTTP status codes
        const hasProperStatusCodes = routesContent.includes('400') && 
                                   routesContent.includes('404') && 
                                   routesContent.includes('500');
        this.recordTest('errorHandling', 'HTTP Status Code Usage', 
          hasProperStatusCodes ? 'PASS' : 'WARN',
          'Should use appropriate HTTP status codes for different error types');
        
        // Check for user-friendly error messages
        const hasUserFriendlyMessages = routesContent.includes('message:') && 
                                      !routesContent.includes('error.stack');
        this.recordTest('errorHandling', 'User-Friendly Error Messages', 
          hasUserFriendlyMessages ? 'PASS' : 'WARN',
          'Should provide user-friendly messages without exposing technical details');
      }

      // Check frontend error handling
      const queryClientPath = path.join(__dirname, 'client', 'src', 'lib', 'queryClient.ts');
      if (fs.existsSync(queryClientPath)) {
        const queryClientContent = fs.readFileSync(queryClientPath, 'utf8');
        
        // Check for retry configuration
        const hasRetryConfig = queryClientContent.includes('retry:');
        this.recordTest('errorHandling', 'Frontend Retry Configuration', 
          hasRetryConfig ? 'PASS' : 'WARN',
          'Should configure retry behavior for failed requests');
        
        // Check for error response handling
        const hasErrorResponseHandling = queryClientContent.includes('throwIfResNotOk');
        this.recordTest('errorHandling', 'Error Response Handling', 
          hasErrorResponseHandling ? 'PASS' : 'FAIL',
          'Should properly handle error responses from API');
      }

    } catch (error) {
      this.recordTest('errorHandling', 'Error Handling Analysis', 'ERROR', 
        `Error analyzing error handling: ${error.message}`);
    }
  }

  async analyzeDataFlowValidation() {
    console.log('\n🔄 Analyzing Data Flow Validation...');
    
    try {
      // Check for input sanitization
      const routesPath = path.join(__dirname, 'server', 'routes.ts');
      if (fs.existsSync(routesPath)) {
        const routesContent = fs.readFileSync(routesPath, 'utf8');
        
        // Check for validation before database operations
        const hasPreDbValidation = routesContent.includes('insertSchema.parse') || 
                                 routesContent.includes('validate');
        this.recordTest('dataFlow', 'Pre-Database Validation', 
          hasPreDbValidation ? 'PASS' : 'FAIL',
          'Should validate data before database operations');
        
        // Check for sanitization of user inputs
        const hasSanitization = routesContent.includes('sanitize') || 
                              routesContent.includes('escape') ||
                              routesContent.includes('trim');
        this.recordTest('dataFlow', 'Input Sanitization', 
          hasSanitization ? 'PASS' : 'WARN',
          'Should sanitize user inputs to prevent injection attacks');
        
        // Check for data transformation
        const hasTransformation = routesContent.includes('transform') || 
                                routesContent.includes('map') ||
                                routesContent.includes('filter');
        this.recordTest('dataFlow', 'Data Transformation', 
          hasTransformation ? 'PASS' : 'INFO',
          'Data transformation can help ensure data consistency');
      }

      // Check frontend form validation
      const formPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'form.tsx');
      if (fs.existsSync(formPath)) {
        const formContent = fs.readFileSync(formPath, 'utf8');
        
        // Check for error display components
        const hasErrorDisplay = formContent.includes('FormMessage') && 
                              formContent.includes('error');
        this.recordTest('dataFlow', 'Frontend Error Display', 
          hasErrorDisplay ? 'PASS' : 'FAIL',
          'Should display validation errors to users');
        
        // Check for validation state handling
        const hasValidationState = formContent.includes('formState') && 
                                 formContent.includes('error');
        this.recordTest('dataFlow', 'Validation State Management', 
          hasValidationState ? 'PASS' : 'FAIL',
          'Should manage validation state properly');
      }

    } catch (error) {
      this.recordTest('dataFlow', 'Data Flow Analysis', 'ERROR', 
        `Error analyzing data flow: ${error.message}`);
    }
  }

  async analyzeSecurityMeasures() {
    console.log('\n🔒 Analyzing Security Measures...');
    
    try {
      // Check authentication implementation
      const authPath = path.join(__dirname, 'server', 'replitAuth.ts');
      if (fs.existsSync(authPath)) {
        this.recordTest('security', 'Authentication Implementation', 'PASS',
          'Authentication system implemented with Replit Auth');
      } else {
        this.recordTest('security', 'Authentication Implementation', 'WARN',
          'Could not verify authentication implementation');
      }

      // Check permissions system
      const permissionsPath = path.join(__dirname, 'server', 'permissions.ts');
      if (fs.existsSync(permissionsPath)) {
        const permissionsContent = fs.readFileSync(permissionsPath, 'utf8');
        
        // Check for role-based access control
        const hasRBAC = permissionsContent.includes('PERMISSIONS') && 
                      permissionsContent.includes('requirePermission');
        this.recordTest('security', 'Role-Based Access Control', 
          hasRBAC ? 'PASS' : 'FAIL',
          'Should implement comprehensive role-based access control');
        
        // Check for permission validation
        const hasPermissionValidation = permissionsContent.includes('hasPermission') && 
                                      permissionsContent.includes('Access denied');
        this.recordTest('security', 'Permission Validation', 
          hasPermissionValidation ? 'PASS' : 'FAIL',
          'Should validate permissions before allowing actions');
      }

      // Check for password handling
      const routesPath = path.join(__dirname, 'server', 'routes.ts');
      if (fs.existsSync(routesPath)) {
        const routesContent = fs.readFileSync(routesPath, 'utf8');
        
        // Check for password hashing
        const hasPasswordHashing = routesContent.includes('bcrypt.hash');
        this.recordTest('security', 'Password Hashing', 
          hasPasswordHashing ? 'PASS' : 'WARN',
          'Should hash passwords before storage');
        
        // Check for password exclusion from responses
        const excludesPassword = routesContent.includes('passwordHash') && 
                               routesContent.includes('sanitized');
        this.recordTest('security', 'Password Response Exclusion', 
          excludesPassword ? 'PASS' : 'FAIL',
          'Should exclude password hashes from API responses');
      }

    } catch (error) {
      this.recordTest('security', 'Security Analysis', 'ERROR', 
        `Error analyzing security measures: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 BUSINESS LOGIC TESTING REPORT');
    console.log('=================================\n');

    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = [];
      }
      categories[result.category].push(result);
    });

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const [category, tests] of Object.entries(categories)) {
      console.log(`${category.toUpperCase()}:`);
      console.log('-'.repeat(category.length + 1));
      
      tests.forEach(test => {
        totalTests++;
        if (test.status === 'PASS') passedTests++;
        else if (test.status === 'FAIL') failedTests++;
      });
      console.log('');
    }

    console.log('SUMMARY:');
    console.log('--------');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%\n`);

    return { totalTests, passedTests, failedTests, results: this.results };
  }

  async runTests() {
    console.log('🧪 Starting Business Logic Testing Suite...\n');
    
    await this.analyzeCodeForBusinessLogic();
    await this.analyzeErrorHandlingPatterns();
    await this.analyzeDataFlowValidation();
    await this.analyzeSecurityMeasures();
    
    const report = this.generateReport();
    
    // Save results
    fs.writeFileSync('business_logic_test_results.json', JSON.stringify(report, null, 2));
    console.log('📁 Results saved to business_logic_test_results.json');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new BusinessLogicTester();
  tester.runTests().catch(console.error);
}

module.exports = BusinessLogicTester;