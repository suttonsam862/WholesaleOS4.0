#!/usr/bin/env node

/**
 * UI/UX Error Handling Testing Suite
 * Tests frontend error handling, user feedback, and recovery mechanisms
 */

const fs = require('fs');
const path = require('path');

class UIErrorTester {
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

  async analyzeErrorDisplayComponents() {
    console.log('\n🎨 Analyzing Error Display Components...');
    
    try {
      // Check Toast implementation
      const toastPath = path.join(__dirname, 'client', 'src', 'hooks', 'use-toast.ts');
      if (fs.existsSync(toastPath)) {
        const toastContent = fs.readFileSync(toastPath, 'utf8');
        
        // Check toast functionality
        const hasToastLimiting = toastContent.includes('TOAST_LIMIT');
        this.recordTest('display', 'Toast Message Limiting', 
          hasToastLimiting ? 'PASS' : 'WARN',
          'Should limit number of simultaneous toast messages');
        
        // Check toast auto-dismiss
        const hasAutoDismiss = toastContent.includes('TOAST_REMOVE_DELAY');
        this.recordTest('display', 'Toast Auto-Dismiss', 
          hasAutoDismiss ? 'PASS' : 'WARN',
          'Should automatically dismiss toast messages after delay');
        
        // Check toast state management
        const hasStateManagement = toastContent.includes('reducer') && toastContent.includes('dispatch');
        this.recordTest('display', 'Toast State Management', 
          hasStateManagement ? 'PASS' : 'FAIL',
          'Should properly manage toast state and lifecycle');
        
      } else {
        this.recordTest('display', 'Toast Implementation', 'ERROR', 
          'Could not find toast implementation');
      }

      // Check Form error display
      const formPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'form.tsx');
      if (fs.existsSync(formPath)) {
        const formContent = fs.readFileSync(formPath, 'utf8');
        
        // Check FormMessage component
        const hasFormMessage = formContent.includes('FormMessage') && formContent.includes('error');
        this.recordTest('display', 'Form Error Messages', 
          hasFormMessage ? 'PASS' : 'FAIL',
          'Should display form validation errors to users');
        
        // Check error styling
        const hasErrorStyling = formContent.includes('text-destructive');
        this.recordTest('display', 'Error Visual Styling', 
          hasErrorStyling ? 'PASS' : 'FAIL',
          'Should visually highlight errors with appropriate styling');
        
        // Check accessibility support
        const hasAccessibility = formContent.includes('aria-invalid') && formContent.includes('aria-describedby');
        this.recordTest('display', 'Error Accessibility Support', 
          hasAccessibility ? 'PASS' : 'FAIL',
          'Should provide accessibility support for error messages');
        
      } else {
        this.recordTest('display', 'Form Component', 'ERROR', 
          'Could not find form component');
      }

      // Check Alert/Status components
      const alertPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'alert.tsx');
      if (fs.existsSync(alertPath)) {
        this.recordTest('display', 'Alert Component Available', 'PASS',
          'Alert component available for system-wide notifications');
      } else {
        this.recordTest('display', 'Alert Component', 'WARN',
          'No dedicated alert component found');
      }

    } catch (error) {
      this.recordTest('display', 'Error Display Analysis', 'ERROR', 
        `Error analyzing error display: ${error.message}`);
    }
  }

  async analyzeLoadingStates() {
    console.log('\n⏳ Analyzing Loading State Handling...');
    
    try {
      // Check React Query loading states
      const queryClientPath = path.join(__dirname, 'client', 'src', 'lib', 'queryClient.ts');
      if (fs.existsSync(queryClientPath)) {
        const queryContent = fs.readFileSync(queryClientPath, 'utf8');
        
        // Check query configuration
        const hasRefetchConfig = queryContent.includes('refetchInterval') && queryContent.includes('refetchOnWindowFocus');
        this.recordTest('loading', 'Query Refetch Configuration', 
          hasRefetchConfig ? 'PASS' : 'WARN',
          'Should configure appropriate refetch behavior');
        
        // Check stale time configuration
        const hasStaleTimeConfig = queryContent.includes('staleTime');
        this.recordTest('loading', 'Stale Time Configuration', 
          hasStaleTimeConfig ? 'PASS' : 'WARN',
          'Should configure stale time to prevent unnecessary requests');
        
      }

      // Check for skeleton/loading components
      const skeletonPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'skeleton.tsx');
      if (fs.existsSync(skeletonPath)) {
        this.recordTest('loading', 'Skeleton Loading Components', 'PASS',
          'Skeleton components available for better loading UX');
      } else {
        this.recordTest('loading', 'Skeleton Loading Components', 'WARN',
          'No skeleton components found - consider adding for better UX');
      }

      // Check for loading indicators
      this.recordTest('loading', 'Loading Indicators', 'INFO',
        'Should implement loading indicators for all async operations');

    } catch (error) {
      this.recordTest('loading', 'Loading State Analysis', 'ERROR', 
        `Error analyzing loading states: ${error.message}`);
    }
  }

  async analyzeModalErrorHandling() {
    console.log('\n🪟 Analyzing Modal Error Handling...');
    
    try {
      // Check dialog component
      const dialogPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'dialog.tsx');
      if (fs.existsSync(dialogPath)) {
        this.recordTest('modal', 'Dialog Component Available', 'PASS',
          'Dialog component available for modal interactions');
      }

      // Check modal files in components/modals directory
      const modalsDir = path.join(__dirname, 'client', 'src', 'components', 'modals');
      if (fs.existsSync(modalsDir)) {
        const modalFiles = fs.readdirSync(modalsDir);
        const modalCount = modalFiles.length;
        
        this.recordTest('modal', 'Modal Components Count', 'INFO',
          `Found ${modalCount} modal components`);
        
        // Check a sample modal for error handling
        if (modalFiles.length > 0) {
          const sampleModalPath = path.join(modalsDir, modalFiles[0]);
          const modalContent = fs.readFileSync(sampleModalPath, 'utf8');
          
          // Check for error state handling
          const hasErrorHandling = modalContent.includes('error') || modalContent.includes('isError');
          this.recordTest('modal', 'Modal Error State Handling', 
            hasErrorHandling ? 'PASS' : 'WARN',
            'Modals should handle error states gracefully');
          
          // Check for loading states in modals
          const hasLoadingStates = modalContent.includes('loading') || modalContent.includes('isLoading') || modalContent.includes('isPending');
          this.recordTest('modal', 'Modal Loading States', 
            hasLoadingStates ? 'PASS' : 'WARN',
            'Modals should show loading states during operations');
          
          // Check for form validation in modals
          const hasFormValidation = modalContent.includes('form') || modalContent.includes('validation');
          this.recordTest('modal', 'Modal Form Validation', 
            hasFormValidation ? 'PASS' : 'INFO',
            'Form modals should implement proper validation');
        }
      } else {
        this.recordTest('modal', 'Modal Components', 'WARN',
          'No modals directory found');
      }

    } catch (error) {
      this.recordTest('modal', 'Modal Analysis', 'ERROR', 
        `Error analyzing modals: ${error.message}`);
    }
  }

  async analyzeNavigationErrorHandling() {
    console.log('\n🧭 Analyzing Navigation Error Handling...');
    
    try {
      // Check App.tsx for route handling
      const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
      if (fs.existsSync(appPath)) {
        const appContent = fs.readFileSync(appPath, 'utf8');
        
        // Check for error boundary
        const hasErrorBoundary = appContent.includes('ErrorBoundary') || appContent.includes('error');
        this.recordTest('navigation', 'Error Boundary Implementation', 
          hasErrorBoundary ? 'PASS' : 'WARN',
          'Should implement error boundary to catch React errors');
        
        // Check for 404 handling
        const has404Handling = appContent.includes('not-found') || appContent.includes('NotFound');
        this.recordTest('navigation', '404 Page Handling', 
          has404Handling ? 'PASS' : 'WARN',
          'Should handle 404 errors with user-friendly page');
        
        // Check for route protection
        const hasRouteProtection = appContent.includes('auth') || appContent.includes('protect');
        this.recordTest('navigation', 'Route Protection', 
          hasRouteProtection ? 'PASS' : 'WARN',
          'Should protect routes that require authentication');
        
      } else {
        this.recordTest('navigation', 'App Component', 'ERROR',
          'Could not find App component');
      }

      // Check for not-found page
      const notFoundPath = path.join(__dirname, 'client', 'src', 'pages', 'not-found.tsx');
      if (fs.existsSync(notFoundPath)) {
        this.recordTest('navigation', 'Not Found Page', 'PASS',
          'Dedicated 404 page implemented');
      } else {
        this.recordTest('navigation', 'Not Found Page', 'WARN',
          'No dedicated 404 page found');
      }

    } catch (error) {
      this.recordTest('navigation', 'Navigation Analysis', 'ERROR', 
        `Error analyzing navigation: ${error.message}`);
    }
  }

  async analyzeUserFeedbackMechanisms() {
    console.log('\n📢 Analyzing User Feedback Mechanisms...');
    
    try {
      // Check for success feedback
      this.recordTest('feedback', 'Success Feedback Mechanisms', 'INFO',
        'Should provide success feedback for completed actions');
        
      // Check for progress indicators
      const progressPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'progress.tsx');
      if (fs.existsSync(progressPath)) {
        this.recordTest('feedback', 'Progress Indicators', 'PASS',
          'Progress component available for long-running operations');
      } else {
        this.recordTest('feedback', 'Progress Indicators', 'WARN',
          'No progress component found');
      }
      
      // Check for confirmation dialogs
      const alertDialogPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'alert-dialog.tsx');
      if (fs.existsSync(alertDialogPath)) {
        this.recordTest('feedback', 'Confirmation Dialogs', 'PASS',
          'Alert dialog available for confirmations');
      } else {
        this.recordTest('feedback', 'Confirmation Dialogs', 'WARN',
          'No confirmation dialog component found');
      }
      
      // Check for contextual help
      const tooltipPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'tooltip.tsx');
      if (fs.existsSync(tooltipPath)) {
        this.recordTest('feedback', 'Contextual Help (Tooltips)', 'PASS',
          'Tooltip component available for contextual help');
      } else {
        this.recordTest('feedback', 'Contextual Help', 'WARN',
          'No tooltip component found');
      }

    } catch (error) {
      this.recordTest('feedback', 'Feedback Analysis', 'ERROR', 
        `Error analyzing feedback mechanisms: ${error.message}`);
    }
  }

  async analyzePerformanceErrorHandling() {
    console.log('\n⚡ Analyzing Performance Error Handling...');
    
    try {
      // Check for virtualization in tables
      this.recordTest('performance', 'List Virtualization', 'WARN',
        'Consider implementing virtual scrolling for large datasets');
      
      // Check for pagination components
      const paginationPath = path.join(__dirname, 'client', 'src', 'components', 'ui', 'pagination.tsx');
      if (fs.existsSync(paginationPath)) {
        this.recordTest('performance', 'Pagination Implementation', 'PASS',
          'Pagination component available for large datasets');
      } else {
        this.recordTest('performance', 'Pagination Implementation', 'WARN',
          'No pagination component found');
      }
      
      // Check for debouncing in search
      this.recordTest('performance', 'Search Debouncing', 'WARN',
        'Should implement debouncing for search inputs to reduce API calls');
      
      // Check for memory leak prevention
      this.recordTest('performance', 'Memory Leak Prevention', 'INFO',
        'Should implement proper cleanup in useEffect hooks');
      
      // Check for error recovery from performance issues
      this.recordTest('performance', 'Performance Error Recovery', 'WARN',
        'Should provide graceful degradation for performance issues');

    } catch (error) {
      this.recordTest('performance', 'Performance Analysis', 'ERROR', 
        `Error analyzing performance handling: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 UI/UX ERROR HANDLING REPORT');
    console.log('===============================\n');

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
    console.log('🧪 Starting UI/UX Error Handling Testing Suite...\n');
    
    await this.analyzeErrorDisplayComponents();
    await this.analyzeLoadingStates();
    await this.analyzeModalErrorHandling();
    await this.analyzeNavigationErrorHandling();
    await this.analyzeUserFeedbackMechanisms();
    await this.analyzePerformanceErrorHandling();
    
    const report = this.generateReport();
    
    // Save results
    fs.writeFileSync('ui_error_test_results.json', JSON.stringify(report, null, 2));
    console.log('📁 Results saved to ui_error_test_results.json');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new UIErrorTester();
  tester.runTests().catch(console.error);
}

module.exports = UIErrorTester;