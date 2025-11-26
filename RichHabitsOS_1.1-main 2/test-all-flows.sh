#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api"
COOKIE_JAR="/tmp/test-cookies.txt"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to log test results
log_test() {
    TESTS_RUN=$((TESTS_RUN + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $2"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Helper function to make authenticated requests
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            -b "$COOKIE_JAR" \
            "${BASE_URL}${endpoint}")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -b "$COOKIE_JAR" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT \
            -b "$COOKIE_JAR" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${BASE_URL}${endpoint}")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE \
            -b "$COOKIE_JAR" \
            "${BASE_URL}${endpoint}")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract body (all but last line)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        log_test 0 "$test_name (Status: $status_code)"
        echo "$body"
    else
        log_test 1 "$test_name (Expected: $expected_status, Got: $status_code)"
        echo "Response body: $body"
        echo ""
    fi
}

echo "================================"
echo "COMPREHENSIVE E2E TEST SUITE"
echo "================================"
echo ""

# First, check if we're authenticated
echo "Checking authentication status..."
auth_response=$(api_request "GET" "/auth/user" "" "401" "Check auth status")

echo ""
echo "================================"
echo "TESTING LEAD TO ORDER FLOW"
echo "================================"
echo ""

# 1. Create an organization first
echo "Creating organization..."
org_data='{"name":"Test Sports Club","sports":"Basketball, Soccer","city":"Austin","state":"TX","shippingAddress":"123 Test St, Austin, TX 78701","notes":"Test organization for E2E testing"}'
org_response=$(api_request "POST" "/organizations" "$org_data" "201" "Create organization")
org_id=$(echo "$org_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created organization ID: $org_id"
echo ""

# 2. Create a contact for the organization
echo "Creating contact..."
contact_data='{"orgId":'$org_id',"name":"John Doe","email":"john@testsportsclub.com","phone":"555-1234","roleTitle":"Team Manager"}'
contact_response=$(api_request "POST" "/contacts" "$contact_data" "201" "Create contact")
contact_id=$(echo "$contact_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created contact ID: $contact_id"
echo ""

# 3. Create a lead
echo "Creating lead..."
lead_data='{"orgId":'$org_id',"contactId":'$contact_id',"stage":"unclaimed","source":"Website","notes":"Interested in team uniforms"}'
lead_response=$(api_request "POST" "/leads" "$lead_data" "201" "Create lead")
lead_id=$(echo "$lead_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created lead ID: $lead_id"
echo ""

# 4. Convert lead to won
echo "Converting lead to won..."
lead_update='{"stage":"won"}'
api_request "PUT" "/leads/$lead_id" "$lead_update" "200" "Convert lead to won"
echo ""

# 5. Create an order for the organization
echo "Creating order with line items..."
order_data='{
  "orgId":'$org_id',
  "leadId":'$lead_id',
  "status":"pending",
  "poNumber":"PO-TEST-001",
  "eventDate":"2025-02-15",
  "inHandsDate":"2025-02-10",
  "shipToAddress":"123 Test St, Austin, TX 78701",
  "billToAddress":"123 Test St, Austin, TX 78701",
  "notes":"Test order for E2E testing",
  "lineItems":[
    {"productId":1,"variantId":1,"quantity":50,"unitPrice":25.99,"totalPrice":1299.50,"customization":"Team logo on front"},
    {"productId":2,"variantId":3,"quantity":100,"unitPrice":15.50,"totalPrice":1550.00,"customization":"Player names"}
  ]
}'
order_response=$(api_request "POST" "/orders" "$order_data" "201" "Create order with line items")
order_id=$(echo "$order_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created order ID: $order_id"
echo ""

# Verify order details
echo "Verifying order details..."
api_request "GET" "/orders/$order_id" "200" "Get order details"
echo ""

echo "================================"
echo "TESTING DESIGN JOB FLOW"
echo "================================"
echo ""

# 1. Create a design job for the order
echo "Creating design job..."
design_data='{
  "orderId":'$order_id',
  "orgId":'$org_id',
  "status":"pending",
  "priority":"high",
  "requirements":"Need team logo centered, player names on back",
  "dueDate":"2025-02-01"
}'
design_response=$(api_request "POST" "/design-jobs" "$design_data" "201" "Create design job")
design_id=$(echo "$design_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created design job ID: $design_id"
echo ""

# 2. Update design job status through workflow
echo "Testing design job status transitions..."
api_request "PUT" "/design-jobs/$design_id/status" '{"status":"assigned"}' "200" "Update to assigned"
api_request "PUT" "/design-jobs/$design_id/status" '{"status":"in_progress"}' "200" "Update to in_progress"
api_request "PUT" "/design-jobs/$design_id/status" '{"status":"review"}' "200" "Update to review"
api_request "PUT" "/design-jobs/$design_id/status" '{"status":"approved"}' "200" "Update to approved"
echo ""

# 3. Add a rendition
echo "Adding design rendition..."
api_request "POST" "/design-jobs/$design_id/renditions" '{"url":"https://example.com/design-v1.png"}' "200" "Add rendition"
echo ""

echo "================================"
echo "TESTING MANUFACTURING FLOW"
echo "================================"
echo ""

# 1. Create manufacturing record
echo "Creating manufacturing record..."
mfg_data='{
  "orderId":'$order_id',
  "manufacturerId":1,
  "status":"pending",
  "estimatedCompletionDate":"2025-02-08",
  "notes":"Rush order - priority production"
}'
mfg_response=$(api_request "POST" "/manufacturing" "$mfg_data" "201" "Create manufacturing record")
mfg_id=$(echo "$mfg_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created manufacturing ID: $mfg_id"
echo ""

# 2. Update manufacturing status
echo "Testing manufacturing status updates..."
api_request "PUT" "/manufacturing/$mfg_id" '{"status":"in_production"}' "200" "Update to in_production"
api_request "PUT" "/manufacturing/$mfg_id" '{"status":"quality_check"}' "200" "Update to quality_check"
api_request "PUT" "/manufacturing/$mfg_id" '{"status":"completed"}' "200" "Update to completed"
echo ""

# 3. Add manufacturing updates
echo "Adding manufacturing updates..."
update_data='{
  "manufacturingId":'$mfg_id',
  "updateType":"progress",
  "description":"50% of items completed",
  "metadata":{"completedItems":50,"totalItems":100}
}'
api_request "POST" "/manufacturing-updates" "$update_data" "201" "Add manufacturing update"
echo ""

echo "================================"
echo "TESTING DASHBOARD METRICS"
echo "================================"
echo ""

# Test dashboard stats endpoint
echo "Testing dashboard statistics..."
api_request "GET" "/dashboard/stats" "200" "Get dashboard stats"
echo ""

# Test dashboard for different query parameters
echo "Testing dashboard with date ranges..."
api_request "GET" "/dashboard/stats?startDate=2025-01-01&endDate=2025-12-31" "200" "Dashboard with date range"
echo ""

echo "================================"
echo "TESTING DATA INTEGRITY"
echo "================================"
echo ""

# 1. Test foreign key constraints
echo "Testing foreign key constraints..."
invalid_order='{"orgId":99999,"leadId":99999,"status":"pending"}'
api_request "POST" "/orders" "$invalid_order" "400" "Create order with invalid foreign keys"
echo ""

# 2. Test unique constraints
echo "Testing unique constraints..."
duplicate_org='{"name":"Test Sports Club","city":"Austin","state":"TX"}'
api_request "POST" "/organizations" "$duplicate_org" "400" "Create duplicate organization (should allow)"
echo ""

# 3. Test cascade deletes
echo "Testing cascade deletes..."
# Create a test order with line items
test_order_data='{
  "orgId":'$org_id',
  "status":"draft",
  "lineItems":[{"productId":1,"variantId":1,"quantity":10,"unitPrice":10.00,"totalPrice":100.00}]
}'
test_order_response=$(api_request "POST" "/orders" "$test_order_data" "201" "Create test order for deletion")
test_order_id=$(echo "$test_order_response" | grep -oP '"id":\K[0-9]+' | head -1)
echo "Created test order ID: $test_order_id"

# Delete the order (should cascade delete line items)
api_request "DELETE" "/orders/$test_order_id" "204" "Delete order (cascade test)"
echo ""

echo "================================"
echo "TESTING CRUD OPERATIONS"
echo "================================"
echo ""

# Test all GET endpoints
echo "Testing all GET endpoints..."
api_request "GET" "/organizations" "200" "GET /organizations"
api_request "GET" "/contacts" "200" "GET /contacts"
api_request "GET" "/leads" "200" "GET /leads"
api_request "GET" "/products" "200" "GET /products"
api_request "GET" "/categories" "200" "GET /categories"
api_request "GET" "/orders" "200" "GET /orders"
api_request "GET" "/design-jobs" "200" "GET /design-jobs"
api_request "GET" "/manufacturing" "200" "GET /manufacturing"
api_request "GET" "/manufacturers" "200" "GET /manufacturers"
api_request "GET" "/salespeople/with-metrics" "200" "GET /salespeople/with-metrics"
api_request "GET" "/variants" "200" "GET /variants"
api_request "GET" "/price-breaks" "200" "GET /price-breaks"
api_request "GET" "/activity/recent" "200" "GET /activity/recent"
echo ""

# Test search endpoint
echo "Testing search functionality..."
api_request "GET" "/search?q=test" "200" "Search for 'test'"
echo ""

echo "================================"
echo "TESTING ERROR HANDLING"
echo "================================"
echo ""

# Test 404 errors
echo "Testing 404 errors..."
api_request "GET" "/organizations/99999" "404" "GET non-existent organization"
api_request "GET" "/orders/99999" "404" "GET non-existent order"
api_request "GET" "/leads/99999" "404" "GET non-existent lead"
echo ""

# Test validation errors
echo "Testing validation errors..."
invalid_lead='{"stage":"invalid_stage"}'
api_request "POST" "/leads" "$invalid_lead" "400" "Create lead with invalid data"

invalid_order='{"status":"invalid_status"}'
api_request "POST" "/orders" "$invalid_order" "400" "Create order with invalid data"
echo ""

echo "================================"
echo "TEST SUMMARY"
echo "================================"
echo ""
echo "Tests run: $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi