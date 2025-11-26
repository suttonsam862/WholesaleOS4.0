/**
 * Financial Calculation Testing Suite
 * Tests critical fixes for quote subtotal synchronization and tax calculation
 */

const API_BASE = 'http://localhost:5000/api';

// Test scenarios from requirements
const CRITICAL_TEST_SCENARIOS = {
  subtotalSync: {
    description: "12 line items totaling $1,085.00 should result in quote subtotal of $1,085.00",
    lineItems: [
      { itemName: "Product A", quantity: 2, unitPrice: 75.00 },   // $150.00
      { itemName: "Product B", quantity: 1, unitPrice: 125.00 },  // $125.00
      { itemName: "Product C", quantity: 3, unitPrice: 50.00 },   // $150.00
      { itemName: "Product D", quantity: 4, unitPrice: 45.00 },   // $180.00
      { itemName: "Product E", quantity: 1, unitPrice: 200.00 },  // $200.00
      { itemName: "Product F", quantity: 2, unitPrice: 30.00 },   // $60.00
      { itemName: "Product G", quantity: 1, unitPrice: 85.00 },   // $85.00
      { itemName: "Product H", quantity: 2, unitPrice: 25.00 },   // $50.00
      { itemName: "Product I", quantity: 1, unitPrice: 40.00 },   // $40.00
      { itemName: "Product J", quantity: 3, unitPrice: 15.00 },   // $45.00
      { itemName: "Product K", quantity: 1, unitPrice: 65.00 },   // $65.00
      { itemName: "Product L", quantity: 2, unitPrice: 50.00 }    // $100.00
    ],
    expectedSubtotal: 1085.00,
    taxRate: 0.0875,
    discount: 0,
    expectedTax: 94.94,
    expectedTotal: 1179.94
  },
  
  taxCalculationFix: {
    description: "$500 subtotal with $50 discount and 8.75% tax should = $39.38 tax (not $43.75)",
    lineItems: [
      { itemName: "Test Product", quantity: 10, unitPrice: 50.00 } // $500.00 subtotal
    ],
    expectedSubtotal: 500.00,
    taxRate: 0.0875,
    discount: 50.00,
    expectedTaxableAmount: 450.00, // 500 - 50
    expectedTax: 39.38, // 450 * 0.0875
    expectedTotal: 489.38 // 450 + 39.38
  }
};

class FinancialCalculationTester {
  constructor() {
    this.results = [];
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Request failed'}`);
      }

      return data;
    } catch (error) {
      await this.log(`Request failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testSubtotalSynchronization() {
    await this.log('🧪 TESTING CRITICAL FIX #1: Subtotal Synchronization');
    const scenario = CRITICAL_TEST_SCENARIOS.subtotalSync;

    try {
      // Create a test quote with line items
      const quoteData = {
        quoteName: "Subtotal Sync Test Quote",
        orgId: 1, // Assuming org 1 exists
        taxRate: scenario.taxRate.toString(),
        discount: scenario.discount.toString(),
        lineItems: scenario.lineItems.map(item => ({
          variantId: 1, // Mock variant ID
          ...item
        }))
      };

      await this.log(`Creating quote with ${scenario.lineItems.length} line items...`);
      const quote = await this.makeRequest('/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });

      // Fetch the quote with line items to verify calculations
      const quoteWithDetails = await this.makeRequest(`/quotes/${quote.id}`);

      // Verify line items were created
      const actualLineItemCount = quoteWithDetails.lineItems?.length || 0;
      await this.log(`Created ${actualLineItemCount} line items`);

      // Calculate expected values
      const manualSubtotal = scenario.lineItems.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );

      // Verify subtotal synchronization
      const actualSubtotal = parseFloat(quote.subtotal);
      const subtotalMatch = Math.abs(actualSubtotal - scenario.expectedSubtotal) < 0.01;

      await this.log(`Expected subtotal: $${scenario.expectedSubtotal.toFixed(2)}`);
      await this.log(`Actual subtotal: $${actualSubtotal.toFixed(2)}`);
      await this.log(`Manual calculation: $${manualSubtotal.toFixed(2)}`);

      if (subtotalMatch) {
        await this.log('✅ SUBTOTAL SYNCHRONIZATION FIX VERIFIED', 'success');
        this.testsPassed++;
      } else {
        await this.log('❌ SUBTOTAL SYNCHRONIZATION STILL BROKEN', 'error');
        this.testsFailed++;
      }

      // Verify tax calculation
      const actualTax = parseFloat(quote.taxAmount);
      const taxMatch = Math.abs(actualTax - scenario.expectedTax) < 0.01;

      await this.log(`Expected tax: $${scenario.expectedTax.toFixed(2)}`);
      await this.log(`Actual tax: $${actualTax.toFixed(2)}`);

      if (taxMatch) {
        await this.log('✅ Tax calculation correct for subtotal sync test', 'success');
      } else {
        await this.log('❌ Tax calculation incorrect for subtotal sync test', 'error');
      }

      return { quote, subtotalMatch, taxMatch };

    } catch (error) {
      await this.log(`Subtotal sync test failed: ${error.message}`, 'error');
      this.testsFailed++;
      return { error };
    }
  }

  async testTaxCalculationFix() {
    await this.log('🧪 TESTING CRITICAL FIX #2: Tax Calculation with Discount');
    const scenario = CRITICAL_TEST_SCENARIOS.taxCalculationFix;

    try {
      // Create a test quote with discount
      const quoteData = {
        quoteName: "Tax Calculation Fix Test Quote",
        orgId: 1, // Assuming org 1 exists
        taxRate: scenario.taxRate.toString(),
        discount: scenario.discount.toString(),
        lineItems: scenario.lineItems.map(item => ({
          variantId: 1, // Mock variant ID
          ...item
        }))
      };

      await this.log('Creating quote with discount to test tax calculation...');
      const quote = await this.makeRequest('/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });

      // Verify the critical fix: tax calculated on discounted amount
      const actualSubtotal = parseFloat(quote.subtotal);
      const actualDiscount = parseFloat(quote.discount);
      const actualTax = parseFloat(quote.taxAmount);
      const actualTotal = parseFloat(quote.total);

      const taxableAmount = actualSubtotal - actualDiscount;
      const expectedTax = taxableAmount * scenario.taxRate;
      const expectedTotal = taxableAmount + expectedTax;

      await this.log(`Subtotal: $${actualSubtotal.toFixed(2)}`);
      await this.log(`Discount: $${actualDiscount.toFixed(2)}`);
      await this.log(`Taxable amount: $${taxableAmount.toFixed(2)} (subtotal - discount)`);
      await this.log(`Expected tax: $${expectedTax.toFixed(2)} (${(scenario.taxRate * 100).toFixed(2)}% of taxable amount)`);
      await this.log(`Actual tax: $${actualTax.toFixed(2)}`);

      // Critical test: tax should be $39.38, not $43.75
      const taxMatch = Math.abs(actualTax - scenario.expectedTax) < 0.01;
      const oldIncorrectTax = actualSubtotal * scenario.taxRate; // $43.75 (wrong way)

      await this.log(`Old incorrect tax (on full subtotal): $${oldIncorrectTax.toFixed(2)}`);
      await this.log(`New correct tax (on discounted amount): $${actualTax.toFixed(2)}`);

      if (taxMatch) {
        await this.log('✅ TAX CALCULATION FIX VERIFIED - Tax calculated on discounted amount', 'success');
        this.testsPassed++;
      } else {
        await this.log('❌ TAX CALCULATION STILL BROKEN - Tax not calculated on discounted amount', 'error');
        this.testsFailed++;
      }

      // Verify total calculation
      const totalMatch = Math.abs(actualTotal - scenario.expectedTotal) < 0.01;
      await this.log(`Expected total: $${scenario.expectedTotal.toFixed(2)}`);
      await this.log(`Actual total: $${actualTotal.toFixed(2)}`);

      return { quote, taxMatch, totalMatch };

    } catch (error) {
      await this.log(`Tax calculation test failed: ${error.message}`, 'error');
      this.testsFailed++;
      return { error };
    }
  }

  async testLineItemMutations() {
    await this.log('🧪 TESTING: Line Item Mutations Trigger Recalculation');

    try {
      // Create a basic quote
      const quoteData = {
        quoteName: "Line Item Mutation Test",
        orgId: 1,
        taxRate: "0.08",
        discount: "10.00",
        lineItems: [
          { variantId: 1, itemName: "Initial Item", quantity: 1, unitPrice: 100.00 }
        ]
      };

      const quote = await this.makeRequest('/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      });

      const initialSubtotal = parseFloat(quote.subtotal);
      await this.log(`Initial subtotal: $${initialSubtotal.toFixed(2)}`);

      // Add a line item
      const newLineItem = {
        quoteId: quote.id,
        variantId: 1,
        itemName: "Added Item",
        quantity: 2,
        unitPrice: 50.00
      };

      await this.makeRequest(`/quotes/${quote.id}/line-items`, {
        method: 'POST',
        body: JSON.stringify(newLineItem)
      });

      // Fetch updated quote
      const updatedQuote = await this.makeRequest(`/quotes/${quote.id}`);
      const newSubtotal = parseFloat(updatedQuote.subtotal);

      await this.log(`Updated subtotal: $${newSubtotal.toFixed(2)}`);
      
      // Should be $200.00 (100 + 100)
      const expectedNewSubtotal = 200.00;
      const mutationWorking = Math.abs(newSubtotal - expectedNewSubtotal) < 0.01;

      if (mutationWorking) {
        await this.log('✅ Line item mutations trigger recalculation correctly', 'success');
        this.testsPassed++;
      } else {
        await this.log('❌ Line item mutations do not trigger recalculation', 'error');
        this.testsFailed++;
      }

      return { mutationWorking };

    } catch (error) {
      await this.log(`Line item mutation test failed: ${error.message}`, 'error');
      this.testsFailed++;
      return { error };
    }
  }

  async runAllTests() {
    await this.log('🚀 STARTING FINANCIAL CALCULATION TESTING SUITE');
    await this.log('Testing critical fixes for production readiness...');
    
    const startTime = Date.now();

    // Run all critical tests
    const subtotalResult = await this.testSubtotalSynchronization();
    const taxResult = await this.testTaxCalculationFix();
    const mutationResult = await this.testLineItemMutations();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    await this.log(`\n📊 TESTING COMPLETE (${duration.toFixed(2)}s)`);
    await this.log(`✅ Tests Passed: ${this.testsPassed}`);
    await this.log(`❌ Tests Failed: ${this.testsFailed}`);
    
    if (this.testsFailed === 0) {
      await this.log('🎉 ALL CRITICAL FINANCIAL FIXES VERIFIED - PRODUCTION READY!', 'success');
    } else {
      await this.log('⚠️ SOME TESTS FAILED - NEEDS INVESTIGATION', 'error');
    }

    return {
      passed: this.testsPassed,
      failed: this.testsFailed,
      results: { subtotalResult, taxResult, mutationResult }
    };
  }
}

// Run the tests if this file is executed directly
if (typeof window === 'undefined') {
  const tester = new FinancialCalculationTester();
  tester.runAllTests().catch(console.error);
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinancialCalculationTester;
}