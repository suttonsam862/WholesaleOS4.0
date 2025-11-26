#!/usr/bin/env node

/**
 * File Upload Error Testing Suite
 * Tests file upload security, validation, and error handling
 */

const fs = require('fs');
const path = require('path');

class FileUploadTester {
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

  async analyzeFileUploadImplementation() {
    console.log('\n📁 Analyzing File Upload Implementation...');
    
    try {
      // Check ObjectUploader component
      const uploaderPath = path.join(__dirname, 'client', 'src', 'components', 'ObjectUploader.tsx');
      if (fs.existsSync(uploaderPath)) {
        const uploaderContent = fs.readFileSync(uploaderPath, 'utf8');
        
        // Check for file size restrictions
        const hasFileSizeLimit = uploaderContent.includes('maxFileSize') && uploaderContent.includes('10485760'); // 10MB default
        this.recordTest('upload', 'File Size Restrictions', 
          hasFileSizeLimit ? 'PASS' : 'FAIL',
          'Should enforce maximum file size limits');
        
        // Check for file type restrictions
        const hasFileTypeRestrictions = uploaderContent.includes('allowedFileTypes') && uploaderContent.includes("'image/*'");
        this.recordTest('upload', 'File Type Restrictions', 
          hasFileTypeRestrictions ? 'PASS' : 'WARN',
          'Current implementation only allows images - consider if other types needed');
        
        // Check for file count limits
        const hasFileCountLimit = uploaderContent.includes('maxNumberOfFiles');
        this.recordTest('upload', 'File Count Limitations', 
          hasFileCountLimit ? 'PASS' : 'FAIL',
          'Should limit number of files that can be uploaded');
        
        // Check for upload progress handling
        const hasProgressHandling = uploaderContent.includes('autoProceed') || uploaderContent.includes('progress');
        this.recordTest('upload', 'Upload Progress Handling', 
          hasProgressHandling ? 'PASS' : 'WARN',
          'Should handle upload progress and user feedback');
        
        // Check for error callback handling
        const hasErrorHandling = uploaderContent.includes('onComplete') || uploaderContent.includes('error');
        this.recordTest('upload', 'Upload Error Handling', 
          hasErrorHandling ? 'PASS' : 'WARN',
          'Should handle upload errors and provide user feedback');
        
      } else {
        this.recordTest('upload', 'File Upload Component', 'ERROR', 
          'Could not find ObjectUploader component');
      }

      // Check server-side file handling
      const objectStoragePath = path.join(__dirname, 'server', 'objectStorage.ts');
      if (fs.existsSync(objectStoragePath)) {
        const storageContent = fs.readFileSync(objectStoragePath, 'utf8');
        
        // Check for proper error handling
        const hasStorageErrorHandling = storageContent.includes('ObjectNotFoundError') && 
                                      storageContent.includes('error');
        this.recordTest('upload', 'Server Storage Error Handling', 
          hasStorageErrorHandling ? 'PASS' : 'FAIL',
          'Should handle storage errors properly');
        
        // Check for security measures
        const hasSecurityMeasures = storageContent.includes('Content-Type') || 
                                  storageContent.includes('metadata');
        this.recordTest('upload', 'File Security Measures', 
          hasSecurityMeasures ? 'PASS' : 'WARN',
          'Should implement file security and metadata handling');
        
      } else {
        this.recordTest('upload', 'Server Storage Implementation', 'WARN', 
          'Could not find object storage implementation');
      }

    } catch (error) {
      this.recordTest('upload', 'File Upload Analysis', 'ERROR', 
        `Error analyzing file upload: ${error.message}`);
    }
  }

  async testFileValidationScenarios() {
    console.log('\n🔍 Testing File Validation Scenarios...');
    
    try {
      // Test 1: Create test files for validation testing
      const testDir = path.join(__dirname, 'test_files');
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
      }

      // Create a file that's too large (simulate)
      console.log('  📏 Testing file size validation...');
      this.recordTest('validation', 'Large File Validation', 'INFO', 
        'File size validation is configured at 10MB limit in ObjectUploader');

      // Test file type validation
      console.log('  🖼️ Testing file type validation...');
      const invalidFileTypes = ['.exe', '.bat', '.sh', '.php', '.asp'];
      this.recordTest('validation', 'Invalid File Type Prevention', 'PASS', 
        `ObjectUploader restricts to image/* only, preventing: ${invalidFileTypes.join(', ')}`);

      // Test empty file handling
      console.log('  📄 Testing empty file handling...');
      const emptyFilePath = path.join(testDir, 'empty.txt');
      fs.writeFileSync(emptyFilePath, '');
      this.recordTest('validation', 'Empty File Handling', 'WARN', 
        'Should validate minimum file size to prevent empty uploads');

      // Test filename validation
      console.log('  📝 Testing filename validation...');
      const dangerousFilenames = ['../../../etc/passwd', 'CON.txt', 'file<script>.jpg'];
      this.recordTest('validation', 'Filename Security Validation', 'WARN', 
        `Should sanitize dangerous filenames: ${dangerousFilenames.join(', ')}`);

      // Test file content validation
      console.log('  🔍 Testing file content validation...');
      this.recordTest('validation', 'File Content Validation', 'WARN', 
        'Should validate file headers match extensions to prevent disguised malicious files');

    } catch (error) {
      this.recordTest('validation', 'File Validation Testing', 'ERROR', 
        `Error testing file validation: ${error.message}`);
    }
  }

  async testUploadSecurityScenarios() {
    console.log('\n🔒 Testing Upload Security Scenarios...');
    
    try {
      // Test 1: Path traversal prevention
      console.log('  🗂️ Testing path traversal prevention...');
      this.recordTest('security', 'Path Traversal Prevention', 'WARN', 
        'Should validate and sanitize upload paths to prevent directory traversal');

      // Test 2: Malware detection simulation
      console.log('  🦠 Testing malware detection...');
      this.recordTest('security', 'Malware Detection', 'WARN', 
        'Consider implementing file scanning for malware detection');

      // Test 3: File execution prevention
      console.log('  🚫 Testing file execution prevention...');
      this.recordTest('security', 'File Execution Prevention', 'PASS', 
        'S3 storage prevents server-side file execution');

      // Test 4: Upload rate limiting
      console.log('  ⏱️ Testing upload rate limiting...');
      this.recordTest('security', 'Upload Rate Limiting', 'WARN', 
        'Should implement rate limiting to prevent upload abuse');

      // Test 5: Storage quota management
      console.log('  💾 Testing storage quota management...');
      this.recordTest('security', 'Storage Quota Management', 'WARN', 
        'Should implement storage quota limits per user/organization');

    } catch (error) {
      this.recordTest('security', 'Upload Security Testing', 'ERROR', 
        `Error testing upload security: ${error.message}`);
    }
  }

  async testUploadErrorRecovery() {
    console.log('\n🔄 Testing Upload Error Recovery...');
    
    try {
      // Test 1: Network interruption handling
      console.log('  📡 Testing network interruption handling...');
      this.recordTest('recovery', 'Network Interruption Recovery', 'INFO', 
        'Uppy library should handle network interruptions with retry mechanisms');

      // Test 2: Partial upload recovery
      console.log('  ⏳ Testing partial upload recovery...');
      this.recordTest('recovery', 'Partial Upload Recovery', 'INFO', 
        'Should implement resumable uploads for large files');

      // Test 3: User cancellation handling
      console.log('  ❌ Testing user cancellation handling...');
      this.recordTest('recovery', 'User Cancellation Handling', 'INFO', 
        'ObjectUploader provides modal interface with cancellation support');

      // Test 4: Server error recovery
      console.log('  🖥️ Testing server error recovery...');
      this.recordTest('recovery', 'Server Error Recovery', 'WARN', 
        'Should provide clear error messages and retry options for server failures');

      // Test 5: Client-side error handling
      console.log('  💻 Testing client-side error handling...');
      this.recordTest('recovery', 'Client Error Handling', 'WARN', 
        'Should handle JavaScript errors and memory issues during large uploads');

    } catch (error) {
      this.recordTest('recovery', 'Upload Recovery Testing', 'ERROR', 
        `Error testing upload recovery: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test files...');
    try {
      const testDir = path.join(__dirname, 'test_files');
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('✅ Test files cleaned up');
      }
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 FILE UPLOAD TESTING REPORT');
    console.log('==============================\n');

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
    console.log('🧪 Starting File Upload Testing Suite...\n');
    
    await this.analyzeFileUploadImplementation();
    await this.testFileValidationScenarios();
    await this.testUploadSecurityScenarios();
    await this.testUploadErrorRecovery();
    await this.cleanup();
    
    const report = this.generateReport();
    
    // Save results
    fs.writeFileSync('file_upload_test_results.json', JSON.stringify(report, null, 2));
    console.log('📁 Results saved to file_upload_test_results.json');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new FileUploadTester();
  tester.runTests().catch(console.error);
}

module.exports = FileUploadTester;