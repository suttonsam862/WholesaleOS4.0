#!/usr/bin/env node

/**
 * Database Integrity & Business Logic Testing Suite
 * Tests database constraints, data integrity, and business rules
 */

const { spawn } = require('child_process');
const fs = require('fs');

class DatabaseIntegrityTester {
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

  async runSQLQuery(query) {
    return new Promise((resolve, reject) => {
      const psql = spawn('psql', [process.env.DATABASE_URL, '-c', query], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      psql.stdout.on('data', data => stdout += data);
      psql.stderr.on('data', data => stderr += data);
      
      psql.on('close', code => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });
    });
  }

  async testDatabaseConstraints() {
    console.log('\n🗄️ Testing Database Constraints & Data Integrity...');
    
    try {
      // Test 1: Unique constraint violation
      console.log('  🔗 Testing unique constraint violations...');
      try {
        await this.runSQLQuery(`
          INSERT INTO categories (name, description) VALUES ('Test Category', 'Test description');
          INSERT INTO categories (name, description) VALUES ('Test Category', 'Duplicate name');
        `);
        this.recordTest('database', 'Unique Constraint Violation', 'FAIL', 
          'Should have prevented duplicate category names');
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          this.recordTest('database', 'Unique Constraint Violation', 'PASS', 
            'Database properly enforced unique constraint');
        } else {
          this.recordTest('database', 'Unique Constraint Violation', 'ERROR', 
            `Unexpected error: ${error.message}`);
        }
      }

      // Test 2: Foreign key constraint violation
      console.log('  🔗 Testing foreign key constraints...');
      try {
        await this.runSQLQuery(`
          INSERT INTO contacts (org_id, name, email) 
          VALUES (99999, 'Test Contact', 'test@example.com');
        `);
        this.recordTest('database', 'Foreign Key Constraint', 'FAIL', 
          'Should have prevented invalid org_id reference');
      } catch (error) {
        if (error.message.includes('foreign key') || error.message.includes('violates')) {
          this.recordTest('database', 'Foreign Key Constraint', 'PASS', 
            'Database properly enforced foreign key constraint');
        } else {
          this.recordTest('database', 'Foreign Key Constraint', 'ERROR', 
            `Unexpected error: ${error.message}`);
        }
      }

      // Test 3: NOT NULL constraint violation
      console.log('  ❌ Testing NOT NULL constraints...');
      try {
        await this.runSQLQuery(`
          INSERT INTO users (email, name, role) 
          VALUES ('test@example.com', NULL, 'admin');
        `);
        this.recordTest('database', 'NOT NULL Constraint', 'FAIL', 
          'Should have prevented NULL name');
      } catch (error) {
        if (error.message.includes('null') || error.message.includes('NOT NULL')) {
          this.recordTest('database', 'NOT NULL Constraint', 'PASS', 
            'Database properly enforced NOT NULL constraint');
        } else {
          this.recordTest('database', 'NOT NULL Constraint', 'ERROR', 
            `Unexpected error: ${error.message}`);
        }
      }

      // Test 4: Data type constraint violation
      console.log('  🔢 Testing data type constraints...');
      try {
        await this.runSQLQuery(`
          INSERT INTO products (name, category_id, base_price, sku) 
          VALUES ('Test Product', 'invalid_integer', 19.99, 'TEST-001');
        `);
        this.recordTest('database', 'Data Type Constraint', 'FAIL', 
          'Should have prevented invalid integer type');
      } catch (error) {
        if (error.message.includes('invalid input') || error.message.includes('type')) {
          this.recordTest('database', 'Data Type Constraint', 'PASS', 
            'Database properly enforced data type constraint');
        } else {
          this.recordTest('database', 'Data Type Constraint', 'ERROR', 
            `Unexpected error: ${error.message}`);
        }
      }

    } catch (error) {
      this.recordTest('database', 'Database Connection', 'ERROR', 
        `Could not connect to database: ${error.message}`);
    }
  }

  async testBusinessLogicConstraints() {
    console.log('\n💼 Testing Business Logic Constraints...');

    try {
      // Test 1: Check if there are any business logic validations at DB level
      console.log('  💰 Testing price constraints...');
      try {
        await this.runSQLQuery(`
          INSERT INTO products (name, category_id, base_price, sku) 
          VALUES ('Negative Price Product', 1, -10.00, 'NEG-001');
        `);
        this.recordTest('business', 'Negative Price Prevention', 'WARN', 
          'Database allowed negative price - should be validated at application level');
      } catch (error) {
        this.recordTest('business', 'Negative Price Prevention', 'PASS', 
          'Database prevented negative price');
      }

      // Test 2: Check date constraints
      console.log('  📅 Testing date constraints...');
      try {
        await this.runSQLQuery(`
          INSERT INTO quotes (quote_code, org_id, quote_name, valid_until) 
          VALUES ('TEST-QUOTE', 1, 'Test Quote', '1900-01-01');
        `);
        this.recordTest('business', 'Invalid Date Handling', 'WARN', 
          'Database allowed past date for valid_until - consider business rule validation');
      } catch (error) {
        this.recordTest('business', 'Invalid Date Handling', 'INFO', 
          `Date constraint handling: ${error.message}`);
      }

      // Test 3: Quantity constraints
      console.log('  📦 Testing quantity constraints...');
      try {
        await this.runSQLQuery(`
          INSERT INTO order_line_items (order_id, variant_id, unit_price, item_name, s) 
          VALUES (1, 1, 19.99, 'Test Item', -5);
        `);
        this.recordTest('business', 'Negative Quantity Prevention', 'WARN', 
          'Database allowed negative quantity - should validate at application level');
      } catch (error) {
        this.recordTest('business', 'Negative Quantity Prevention', 'INFO', 
          `Quantity constraint: ${error.message}`);
      }

    } catch (error) {
      this.recordTest('business', 'Business Logic Testing', 'ERROR', 
        `Error testing business logic: ${error.message}`);
    }
  }

  async testDataBoundaryConditions() {
    console.log('\n📏 Testing Data Boundary Conditions...');

    try {
      // Test 1: Maximum string lengths
      console.log('  📝 Testing maximum string lengths...');
      const longString = 'A'.repeat(1000);
      try {
        await this.runSQLQuery(`
          INSERT INTO organizations (name) VALUES ('${longString}');
        `);
        this.recordTest('boundary', 'Long String Handling', 'WARN', 
          'Database accepted very long string - consider length limits');
      } catch (error) {
        if (error.message.includes('too long') || error.message.includes('length')) {
          this.recordTest('boundary', 'Long String Handling', 'PASS', 
            'Database enforced string length limits');
        } else {
          this.recordTest('boundary', 'Long String Handling', 'ERROR', 
            `Unexpected error: ${error.message}`);
        }
      }

      // Test 2: Decimal precision limits
      console.log('  💲 Testing decimal precision limits...');
      try {
        await this.runSQLQuery(`
          INSERT INTO products (name, category_id, base_price, sku) 
          VALUES ('Precision Test', 1, 123.123456789, 'PREC-001');
        `);
        this.recordTest('boundary', 'Decimal Precision Handling', 'INFO', 
          'Database handled decimal precision (should check if rounded correctly)');
      } catch (error) {
        this.recordTest('boundary', 'Decimal Precision Handling', 'INFO', 
          `Precision error: ${error.message}`);
      }

      // Test 3: Large numbers
      console.log('  🔢 Testing large number limits...');
      try {
        await this.runSQLQuery(`
          INSERT INTO order_line_items (order_id, variant_id, unit_price, item_name, s) 
          VALUES (1, 1, 19.99, 'Large Quantity Test', 2147483647);
        `);
        this.recordTest('boundary', 'Large Integer Handling', 'INFO', 
          'Database handled large integer (within INTEGER limits)');
      } catch (error) {
        this.recordTest('boundary', 'Large Integer Handling', 'INFO', 
          `Large integer error: ${error.message}`);
      }

    } catch (error) {
      this.recordTest('boundary', 'Boundary Testing', 'ERROR', 
        `Error testing boundaries: ${error.message}`);
    }
  }

  async testConcurrencyAndTransactions() {
    console.log('\n🔄 Testing Concurrency & Transaction Safety...');

    try {
      // Test 1: Basic transaction rollback simulation
      console.log('  🔄 Testing transaction handling...');
      try {
        await this.runSQLQuery(`
          BEGIN;
          INSERT INTO categories (name) VALUES ('Transaction Test 1');
          INSERT INTO categories (name) VALUES ('Transaction Test 1'); -- Duplicate should fail
          COMMIT;
        `);
        this.recordTest('concurrency', 'Transaction Rollback', 'FAIL', 
          'Transaction should have rolled back on constraint violation');
      } catch (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
          this.recordTest('concurrency', 'Transaction Rollback', 'PASS', 
            'Transaction properly rolled back on constraint violation');
        } else {
          this.recordTest('concurrency', 'Transaction Rollback', 'ERROR', 
            `Transaction error: ${error.message}`);
        }
      }

      // Test 2: Check for potential race conditions
      console.log('  🏁 Testing for race condition prevention...');
      this.recordTest('concurrency', 'Race Condition Prevention', 'INFO', 
        'Race condition testing requires specialized concurrent test scenarios');

    } catch (error) {
      this.recordTest('concurrency', 'Concurrency Testing', 'ERROR', 
        `Error testing concurrency: ${error.message}`);
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    try {
      await this.runSQLQuery(`
        DELETE FROM categories WHERE name LIKE '%Test%';
        DELETE FROM products WHERE name LIKE '%Test%' OR name LIKE '%Negative%' OR name LIKE '%Precision%';
        DELETE FROM order_line_items WHERE item_name LIKE '%Test%';
        DELETE FROM organizations WHERE name LIKE '%Test%';
      `);
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log(`⚠️ Cleanup warning: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n📊 DATABASE INTEGRITY TESTING REPORT');
    console.log('=====================================\n');

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
    console.log('🧪 Starting Database Integrity Testing Suite...\n');
    
    await this.testDatabaseConstraints();
    await this.testBusinessLogicConstraints();  
    await this.testDataBoundaryConditions();
    await this.testConcurrencyAndTransactions();
    await this.cleanup();
    
    const report = this.generateReport();
    
    // Save results
    fs.writeFileSync('database_integrity_test_results.json', JSON.stringify(report, null, 2));
    console.log('📁 Results saved to database_integrity_test_results.json');
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new DatabaseIntegrityTester();
  tester.runTests().catch(console.error);
}

module.exports = DatabaseIntegrityTester;