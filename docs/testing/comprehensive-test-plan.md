# Comprehensive Test Plan - Wholesale Management Application

## Test Overview
This document outlines every user action across all 5 roles (Admin, Sales, Designer, Ops, Manufacturer) and all automatic system updates that need to be tested.

## 1. AUTHENTICATION TESTS

### Login Flow
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Login with non-existent user
- [ ] Login with wrong password
- [ ] Logout functionality
- [ ] Session persistence after page refresh
- [ ] Session expiration handling

## 2. ADMIN ROLE TESTS

### Dashboard Access
- [ ] View all system metrics
- [ ] View all orders across all salespersons
- [ ] View all leads across all salespersons  
- [ ] View all design jobs across all designers
- [ ] View all manufacturing updates
- [ ] View financial metrics (revenue, commission, profit)

### User Management
- [ ] Create new user (all roles)
- [ ] Edit user details
- [ ] Delete user
- [ ] Change user roles
- [ ] Reset user password
- [ ] View user activity logs

### Organization Management
- [ ] Create new organization
- [ ] Edit organization details
- [ ] Delete organization
- [ ] Add contacts to organization
- [ ] Remove contacts from organization

### Contact Management
- [ ] Create new contact
- [ ] Edit contact details
- [ ] Delete contact
- [ ] Link contact to organization
- [ ] Unlink contact from organization

### Lead Management
- [ ] View all leads (not just own)
- [ ] Create new lead
- [ ] Edit any lead
- [ ] Delete any lead
- [ ] Convert lead to order
- [ ] Reassign lead to different salesperson
- [ ] Bulk reassign multiple leads

### Order Management
- [ ] View all orders (not just own)
- [ ] Create new order
- [ ] Edit order details (all fields)
  - [ ] Order name
  - [ ] Status
  - [ ] Priority  
  - [ ] Est. delivery date
  - [ ] Tracking number
  - [ ] Design approved checkbox
  - [ ] Sizes validated checkbox
  - [ ] Deposit received checkbox
- [ ] Delete order
- [ ] Clone order
- [ ] Recalculate prices
- [ ] Print order
- [ ] Email order
- [ ] Add line items
- [ ] Edit line items
- [ ] Delete line items
- [ ] Upload custom images for line items
- [ ] Assign manufacturers to line items
- [ ] Reassign salesperson
- [ ] Add internal notes
- [ ] Quick status updates (Waiting Sizes, Invoice, Production, Ship)

### Catalog Management
- [ ] Create new category
- [ ] Edit category details
- [ ] Delete category
- [ ] Create new product
- [ ] Edit product details
- [ ] Delete product
- [ ] Create product variant
- [ ] Edit variant details
- [ ] Delete variant
- [ ] Upload product/variant images
- [ ] Set MSRP pricing

### Design Job Management
- [ ] View all design jobs (not just assigned)
- [ ] Create new design job
- [ ] Edit design job details
- [ ] Delete design job
- [ ] Reassign designer
- [ ] Bulk reassign multiple design jobs
- [ ] Update design job status
- [ ] Add design renditions
- [ ] Add comments to design jobs

### Manufacturing Management
- [ ] View all manufacturing records
- [ ] Create manufacturing record
- [ ] Edit manufacturing details
- [ ] Delete manufacturing record
- [ ] Create manufacturing updates
- [ ] Edit manufacturing updates
- [ ] Assign manufacturers to line items
- [ ] Create manufacturing batches
- [ ] Update batch status
- [ ] Add quality checkpoints
- [ ] Update production schedules

### Financial Management
- [ ] View all invoices
- [ ] Create new invoice
- [ ] Edit invoice details
- [ ] Delete invoice
- [ ] Record payments
- [ ] View commission reports
- [ ] Process commission payments
- [ ] View profit margins
- [ ] Export financial reports

### Settings & Configuration
- [ ] Update system settings
- [ ] Configure email templates
- [ ] Manage API keys
- [ ] Configure integrations

## 3. SALES ROLE TESTS

### Dashboard Access
- [ ] View own sales metrics only
- [ ] View own orders only
- [ ] View own leads only
- [ ] View own quotes only
- [ ] View limited financial metrics

### Lead Management
- [ ] View own leads only
- [ ] Create new lead
- [ ] Edit own lead details
- [ ] Cannot delete leads
- [ ] Convert own lead to order
- [ ] Cannot reassign leads

### Order Management  
- [ ] View own orders only
- [ ] Create new order
- [ ] Edit order details (limited fields)
- [ ] Cannot delete orders
- [ ] Clone own orders
- [ ] Add line items
- [ ] Edit line items (before manufacturing)
- [ ] Cannot delete line items after manufacturing
- [ ] Add internal notes
- [ ] Quick status updates

### Quote Management
- [ ] View own quotes only
- [ ] Create new quote
- [ ] Edit own quote details
- [ ] Cannot delete quotes
- [ ] Convert quote to order

### Organization & Contact Access
- [ ] View organizations (read-only)
- [ ] View contacts (read-only)
- [ ] Cannot create/edit/delete organizations
- [ ] Cannot create/edit/delete contacts

### Catalog Access
- [ ] Browse catalog (read-only)
- [ ] View product details
- [ ] View variant details
- [ ] Cannot modify catalog

### Design Job Management
- [ ] Create design jobs for own orders
- [ ] View design jobs for own orders
- [ ] Update design job details
- [ ] Cannot delete design jobs
- [ ] Add comments to design jobs

### Restrictions
- [ ] Cannot access user management
- [ ] Cannot access manufacturing management
- [ ] Cannot access system settings
- [ ] Cannot view other salespeople's data
- [ ] Cannot access admin controls

## 4. DESIGNER ROLE TESTS

### Dashboard Access
- [ ] View design-focused metrics
- [ ] View assigned design jobs only
- [ ] View design job deadlines
- [ ] View design workload

### Design Job Management
- [ ] View assigned design jobs only
- [ ] Update design job status
  - [ ] Pending → Assigned
  - [ ] Assigned → In Progress
  - [ ] In Progress → Review
  - [ ] Review → Approved/Rejected
  - [ ] Approved → Completed
- [ ] Add design renditions
- [ ] Upload mockup files
- [ ] Upload production files
- [ ] Add final links
- [ ] Add internal notes
- [ ] Add client feedback
- [ ] View reference files

### Order Access
- [ ] View orders related to design jobs (read-only)
- [ ] View order details
- [ ] View line items
- [ ] Cannot edit orders

### Catalog Access
- [ ] Browse catalog (read-only)
- [ ] View product details for designs
- [ ] Cannot modify catalog

### Organization Access
- [ ] View organizations related to design jobs
- [ ] Cannot edit organizations

### Restrictions
- [ ] Cannot create design jobs
- [ ] Cannot delete design jobs  
- [ ] Cannot reassign design jobs
- [ ] Cannot access leads
- [ ] Cannot access manufacturing
- [ ] Cannot access financial data
- [ ] Cannot access user management

## 5. OPERATIONS ROLE TESTS

### Dashboard Access
- [ ] View production metrics
- [ ] View all manufacturing records
- [ ] View production schedules
- [ ] View quality metrics

### Manufacturing Management
- [ ] View all manufacturing records
- [ ] Create manufacturing records
- [ ] Edit manufacturing details
- [ ] Update manufacturing status
- [ ] Create manufacturing updates
- [ ] Assign manufacturers to line items
- [ ] Create manufacturing batches
- [ ] Update batch status
- [ ] Manage batch items

### Production Scheduling
- [ ] View production schedules
- [ ] Create production schedules
- [ ] Update schedule details
- [ ] Adjust production timelines
- [ ] Assign resources

### Quality Control
- [ ] Create quality checkpoints
- [ ] Update checkpoint status
- [ ] Record quality issues
- [ ] Approve/reject quality checks

### Order Management
- [ ] View orders in production
- [ ] Update order production status
- [ ] Cannot edit order details
- [ ] View line items and sizes

### Restrictions
- [ ] Cannot access sales data
- [ ] Cannot access financial data
- [ ] Cannot manage users
- [ ] Cannot modify catalog
- [ ] Cannot access design jobs

## 6. MANUFACTURER ROLE TESTS

### Dashboard Access
- [ ] View only assigned manufacturing updates
- [ ] View only line items assigned to them
- [ ] View production deadlines
- [ ] View own workload

### Manufacturing Updates
- [ ] View assigned manufacturing updates only
- [ ] Update status of assigned updates
  - [ ] Pending → In Progress
  - [ ] In Progress → Quality Check
  - [ ] Quality Check → Completed
- [ ] Add notes to updates
- [ ] View order details (read-only)
- [ ] View line item details
- [ ] View size breakdowns

### Restrictions
- [ ] Cannot see unassigned manufacturing updates
- [ ] Cannot see other manufacturers' work
- [ ] Cannot create manufacturing records
- [ ] Cannot delete manufacturing records
- [ ] Cannot access orders directly
- [ ] Cannot access leads
- [ ] Cannot access catalog management
- [ ] Cannot access financial data
- [ ] Cannot access user management
- [ ] Cannot access design jobs

## 7. AUTOMATIC UPDATES & TRIGGERS

### Order Status Triggers
- [ ] When order status → "production":
  - [ ] Automatically create manufacturing update in "pending" status
  - [ ] Lock line items from editing
  - [ ] Show "Line Items Locked" warning
  - [ ] Disable manufacturer assignment dropdown
  - [ ] Send notification to assigned manufacturers
  - [ ] Update activity log

### Line Item Locking
- [ ] Line items become read-only when manufacturing updates exist
- [ ] Edit buttons disabled for line items
- [ ] Delete buttons disabled for line items
- [ ] Quantity inputs disabled
- [ ] Cannot add new line items after manufacturing starts

### Notification System
- [ ] Real-time notifications created for:
  - [ ] New manufacturing assignments
  - [ ] Status changes
  - [ ] Design job assignments
  - [ ] Order updates
  - [ ] Payment received
- [ ] Navbar bell icon shows unread count
- [ ] Notifications poll every 30 seconds
- [ ] Mark as read functionality
- [ ] Mark all as read functionality

### Activity Logging
- [ ] All create operations logged
- [ ] All update operations logged
- [ ] All delete operations logged
- [ ] User who performed action recorded
- [ ] Timestamp recorded
- [ ] Previous and new values stored

### Data Integrity
- [ ] Cascade deletes for related records
- [ ] Foreign key constraints enforced
- [ ] Unique constraints enforced
- [ ] Required fields validated
- [ ] Data type validation

### Session Management
- [ ] Session persistence across page refreshes
- [ ] Session timeout handling
- [ ] Concurrent session handling
- [ ] Role-based filtering applied consistently

### Email Triggers
- [ ] Order confirmation emails
- [ ] Status update notifications
- [ ] Manufacturing assignment notifications
- [ ] Design job assignment notifications

## 8. CROSS-ROLE INTERACTIONS

### Data Visibility
- [ ] Admin sees all data
- [ ] Sales sees only own data
- [ ] Designer sees only assigned data
- [ ] Ops sees all production data
- [ ] Manufacturer sees only assigned data

### Permission Boundaries
- [ ] Users cannot access unauthorized endpoints
- [ ] API returns 403 for unauthorized actions
- [ ] UI hides unauthorized buttons/actions
- [ ] Cannot bypass permissions via direct API calls

### Workflow Integration
- [ ] Sales creates order → Designer assigned → Production starts → Manufacturer completes
- [ ] Status changes propagate correctly
- [ ] Notifications sent to correct roles
- [ ] Activity logs capture all changes

## 9. ERROR HANDLING

### Form Validation
- [ ] Required fields show error messages
- [ ] Invalid data formats rejected
- [ ] Duplicate entries prevented
- [ ] Business logic validation enforced

### API Error Handling
- [ ] Network errors show toast notifications
- [ ] Validation errors display field-specific messages
- [ ] Server errors show user-friendly messages
- [ ] Retry logic for transient failures

### Edge Cases
- [ ] Handle empty states gracefully
- [ ] Handle large datasets with pagination
- [ ] Handle concurrent updates
- [ ] Handle deleted related records

## 10. PERFORMANCE & LOAD TESTING

### Response Times
- [ ] Dashboard loads < 2 seconds
- [ ] List views load < 1 second
- [ ] Form submissions < 1 second
- [ ] Search results < 500ms

### Concurrent Users
- [ ] System handles 10+ concurrent users
- [ ] No race conditions in updates
- [ ] Proper locking mechanisms
- [ ] Session management scales

### Data Volume
- [ ] Handle 1000+ orders
- [ ] Handle 10000+ line items
- [ ] Handle 5000+ products
- [ ] Pagination works correctly

## Test Execution Strategy

1. **Phase 1**: Authentication & Basic Access
   - Test login/logout for all roles
   - Verify dashboard access per role
   - Confirm navigation restrictions

2. **Phase 2**: CRUD Operations by Role
   - Test all create operations
   - Test all read operations
   - Test all update operations
   - Test all delete operations

3. **Phase 3**: Workflow Testing
   - Test complete order lifecycle
   - Test manufacturing workflow
   - Test design job workflow
   - Test automatic triggers

4. **Phase 4**: Edge Cases & Error Handling
   - Test validation rules
   - Test error scenarios
   - Test concurrent updates
   - Test data integrity

5. **Phase 5**: Performance & Load
   - Test with production-like data volumes
   - Test concurrent user scenarios
   - Measure response times
   - Identify bottlenecks