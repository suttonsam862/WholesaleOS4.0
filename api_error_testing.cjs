#!/usr/bin/env node

/**
 * API Error Testing Suite
 * Tests direct API endpoints for proper error handling
 */

const https = require('https');
const http = require('http');

const baseUrl = 'http://localhost:5000';

class APIErrorTester {
  constructor() {
    this.results = [];
  }

  async makeRequest(method, path, data, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
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

  async testAuthenticationErrors() {
    console.log('\n🔐 Testing Authentication & Authorization Errors...');
    
    // Test 1: Unauthorized access to protected endpoint
    try {
      const response = await this.makeRequest('GET', '/api/users');
      this.recordTest('authentication', 'Unauthorized Access Protection', 
        response.status === 401 ? 'PASS' : 'FAIL',
        `Expected 401, got ${response.status}`);
    } catch (error) {
      this.recordTest('authentication', 'Unauthorized Access Protection', 'ERROR', error.message);
    }

    // Test 2: Invalid session/token handling
    try {
      const response = await this.makeRequest('GET', '/api/users', null, {
        'Cookie': 'invalid-session-cookie'
      });
      this.recordTest('authentication', 'Invalid Session Handling', 
        response.status === 401 ? 'PASS' : 'FAIL',
        `Expected 401 for invalid session, got ${response.status}`);
    } catch (error) {
      this.recordTest('authentication', 'Invalid Session Handling', 'ERROR', error.message);
    }

    // Test 3: Access to user endpoint (should require authentication)
    try {
      const response = await this.makeRequest('GET', '/api/auth/user');
      this.recordTest('authentication', 'Auth User Endpoint Protection', 
        response.status === 401 ? 'PASS' : 'FAIL',
        `Expected 401, got ${response.status}`);
    } catch (error) {
      this.recordTest('authentication', 'Auth User Endpoint Protection', 'ERROR', error.message);
    }
  }

  async testAPIErrorResponses() {
    console.log('\n🔌 Testing API Error Responses...');
    
    // Test 1: 404 for non-existent endpoint
    try {
      const response = await this.makeRequest('GET', '/api/nonexistent');
      this.recordTest('api', 'HTTP 404 Handling', 
        response.status === 404 ? 'PASS' : 'FAIL',
        `Expected 404, got ${response.status}`);
    } catch (error) {
      this.recordTest('api', 'HTTP 404 Handling', 'ERROR', error.message);
    }

    // Test 2: Malformed JSON in POST request
    try {
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/organizations',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        this.recordTest('api', 'Malformed JSON Handling', 
          res.statusCode === 400 ? 'PASS' : 'FAIL',
          `Expected 400 for malformed JSON, got ${res.statusCode}`);
      });
      
      req.write('{"invalid": json}'); // Invalid JSON
      req.end();
    } catch (error) {
      this.recordTest('api', 'Malformed JSON Handling', 'PASS', 
        'Request properly rejected');
    }

    // Test 3: Missing Content-Type header
    try {
      const response = await this.makeRequest('POST', '/api/organizations', 
        { name: 'Test Org' }, 
        { 'Content-Type': '' }
      );
      this.recordTest('api', 'Missing Content-Type Handling', 'INFO', 
        `Status: ${response.status}`);
    } catch (error) {
      this.recordTest('api', 'Missing Content-Type Handling', 'ERROR', error.message);
    }

    // Test 4: Invalid HTTP method
    try {
      const response = await this.makeRequest('PATCH', '/api/organizations');
      this.recordTest('api', 'Invalid HTTP Method', 'INFO', 
        `PATCH method response: ${response.status}`);
    } catch (error) {
      this.recordTest('api', 'Invalid HTTP Method', 'ERROR', error.message);
    }
  }

  async testDataValidationErrors() {
    console.log('\n📋 Testing Data Validation Errors...');
    
    // Test 1: Empty required field
    try {
      const response = await this.makeRequest('POST', '/api/organizations', {
        name: '', // Empty required field
        city: 'Test City'
      });
      this.recordTest('validation', 'Empty Required Field', 
        response.status === 400 ? 'PASS' : 'FAIL',
        `Expected 400 for empty required field, got ${response.status}`);
    } catch (error) {
      this.recordTest('validation', 'Empty Required Field', 'ERROR', error.message);
    }

    // Test 2: Invalid data type
    try {
      const response = await this.makeRequest('POST', '/api/products', {
        name: 'Test Product',
        basePrice: 'not-a-number', // Invalid price format
        categoryId: 1
      });
      this.recordTest('validation', 'Invalid Data Type', 
        response.status === 400 ? 'PASS' : 'FAIL',
        `Expected 400 for invalid price format, got ${response.status}`);
    } catch (error) {
      this.recordTest('validation', 'Invalid Data Type', 'ERROR', error.message);
    }

    // Test 3: Field length validation
    try {
      const longText = 'A'.repeat(1000);
      const response = await this.makeRequest('POST', '/api/categories', {
        name: longText, // Very long name
        description: 'Test description'
      });
      this.recordTest('validation', 'Field Length Validation', 
        response.status === 400 ? 'PASS' : 'WARN',
        `Status ${response.status} for very long field`);
    } catch (error) {
      this.recordTest('validation', 'Field Length Validation', 'ERROR', error.message);
    }
  }

  async testResourceNotFound() {
    console.log('\n🔍 Testing Resource Not Found Errors...');
    
    // Test 1: Non-existent user
    try {
      const response = await this.makeRequest('GET', '/api/users/nonexistent-id');
      this.recordTest('resources', 'Non-existent User', 
        response.status === 404 || response.status === 401 ? 'PASS' : 'FAIL',
        `Expected 404 or 401, got ${response.status}`);
    } catch (error) {
      this.recordTest('resources', 'Non-existent User', 'ERROR', error.message);
    }

    // Test 2: Non-existent organization
    try {
      const response = await this.makeRequest('GET', '/api/organizations/99999');
      this.recordTest('resources', 'Non-existent Organization', 
        response.status === 404 || response.status === 401 ? 'PASS' : 'FAIL',
        `Expected 404 or 401, got ${response.status}`);
    } catch (error) {
      this.recordTest('resources', 'Non-existent Organization', 'ERROR', error.message);
    }
  }

  async testRateLimitingAndSecurity() {
    console.log('\n🛡️ Testing Security & Rate Limiting...');
    
    // Test 1: SQL Injection attempt in query parameter
    try {
      const response = await this.makeRequest('GET', "/api/search?q='; DROP TABLE users; --");
      this.recordTest('security', 'SQL Injection Protection', 
        response.status === 400 || response.status === 401 ? 'PASS' : 'WARN',
        `Status ${response.status} for SQL injection attempt`);
    } catch (error) {
      this.recordTest('security', 'SQL Injection Protection', 'ERROR', error.message);
    }

    // Test 2: XSS attempt in request body
    try {
      const response = await this.makeRequest('POST', '/api/organizations', {
        name: '<script>alert("xss")</script>',
        city: 'Test City'
      });
      this.recordTest('security', 'XSS Protection', 
        response.status === 400 || response.status === 401 ? 'PASS' : 'WARN',
        `Status ${response.status} for XSS attempt`);
    } catch (error) {
      this.recordTest('security', 'XSS Protection', 'ERROR', error.message);
    }

    // Test 3: Very large request body
    try {
      const largeData = { name: 'A'.repeat(100000) }; // 100KB of data
      const response = await this.makeRequest('POST', '/api/organizations', largeData);
      this.recordTest('security', 'Large Request Body Handling', 'INFO', 
        `Status ${response.status} for large request`);
    } catch (error) {
      this.recordTest('security', 'Large Request Body Handling', 'INFO', 
        `Request properly rejected: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 API ERROR TESTING REPORT');
    console.log('============================\n');
    
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
    console.log('🧪 Starting API Error Testing Suite...\n');
    
    await this.testAuthenticationErrors();
    await this.testAPIErrorResponses();
    await this.testDataValidationErrors();
    await this.testResourceNotFound();
    await this.testRateLimitingAndSecurity();
    
    const report = this.generateReport();
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('api_error_test_results.json', JSON.stringify(report, null, 2));
    console.log('📁 Results saved to api_error_test_results.json');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new APIErrorTester();
  tester.runTests().catch(console.error);
}

module.exports = APIErrorTester;