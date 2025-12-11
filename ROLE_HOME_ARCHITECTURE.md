
# Role-Based Home Architecture Design

## Table of Contents
1. [Global Architecture Overview](#global-architecture-overview)
2. [Admin Role Home](#admin-role-home)
3. [Sales Role Home](#sales-role-home)
4. [Designer Role Home](#designer-role-home)
5. [Operations Role Home](#operations-role-home)
6. [Manufacturer Role Home](#manufacturer-role-home)
7. [Finance Role Home](#finance-role-home)
8. [Navigation & Layout](#navigation--layout)

---

## Global Architecture Overview

### Routing Structure
```
/admin/home          - Admin command center
/sales/home          - Sales pipeline hub
/designer/home       - Designer workspace
/ops/home            - Operations control center
/manufacturer/home   - Manufacturing dashboard
/finance/home        - Financial management hub

/admin/dashboard     - Admin KPI analytics
/sales/dashboard     - Sales metrics & reports
/designer/dashboard  - Design performance metrics
/ops/dashboard       - Operations analytics
/manufacturer/dashboard - Manufacturing metrics
/finance/dashboard   - Financial analytics & reports
```

### Layout Components

**AppShell (Consistent Across All Pages)**
- **Top Bar**: Brand logo, page title, global search, quick create button, notifications, user profile
- **Collapsible Sidebar**: 
  - Grouped navigation (Overview, Sales & CRM, Production & Design, Inventory & Catalog, Finance, Admin)
  - Collapsible groups with expand/collapse
  - Active page highlighting
  - Badge notifications on relevant items
  - Role-specific workflow pages (admin only)
- **Main Content Area**: Role-specific home or dashboard content
- **No Bottom Dock**: All functionality moved to sidebar and quick actions

### Post-Login Flow
1. User authenticates → System identifies role
2. Redirect to `/{role}/home` (e.g., `/sales/home`)
3. Home page loads with role-specific workflow tiles and queues
4. User can access dashboard via sidebar or "View Metrics" tile

---

## Admin Role Home

### Route: `/admin/home`

### Hero Section
**Left Side:**
- **Welcome Message**: "Welcome, Admin"
- **Subtitle**: "System control center - Manage all aspects of your business"
- **System Health Indicator**: Real-time status badge (Healthy/Warning/Critical)

**Right Side:**
- **Primary Create Dropdown**: 
  - Create User
  - Create Role
  - Create Product
  - Create Category
  - Create Organization
  - Assign Territory
  - Seed Permissions

### Primary Workflow Tiles (3-column grid)

**1. User & Role Management**
- **Icon**: Users icon with gradient background
- **Title**: "User & Role Management"
- **Sub-actions**:
  - "Manage users" → `/user-management`
  - "Assign roles" → `/user-management?tab=roles`
  - "Send invitations" → Opens invite modal
- **Badge**: Count of pending invitations
- **Open Button**: Navigates to `/user-management`

**2. Permissions & Configuration**
- **Icon**: Shield icon with gradient background
- **Title**: "Permissions & Configuration"
- **Sub-actions**:
  - "Configure RBAC" → `/admin/permissions`
  - "Create custom roles" → `/admin/permissions?tab=roles`
  - "Manage resources" → `/admin/permissions?tab=resources`
- **Badge**: None
- **Open Button**: Navigates to `/admin/permissions`

**3. Product & Catalog Setup**
- **Icon**: Package icon with gradient background
- **Title**: "Product & Catalog Setup"
- **Sub-actions**:
  - "Create product" → Opens create product modal
  - "Manage categories" → `/catalog?view=categories`
  - "Manage variants" → `/catalog?view=variants`
- **Badge**: Count of inactive products
- **Open Button**: Navigates to `/catalog`

**4. System Operations Console**
- **Icon**: Factory icon with gradient background
- **Title**: "System Operations Console"
- **Sub-actions**:
  - "Orders overview" → `/orders`
  - "Manufacturing queue" → `/manufacturing`
  - "Design jobs" → `/design-jobs`
- **Badge**: Count of items needing attention
- **Open Button**: Navigates to `/ops/home`

**5. Financial & Commissions**
- **Icon**: Dollar sign icon with gradient background
- **Title**: "Financial & Commissions"
- **Sub-actions**:
  - "Financial matching" → `/finance?tab=matching`
  - "Review commissions" → `/finance?tab=commissions`
  - "Invoice management" → `/finance?tab=invoices`
- **Badge**: Count of unmatched records
- **Open Button**: Navigates to `/finance`

**6. Analytics & Logs**
- **Icon**: Activity icon with gradient background
- **Title**: "Analytics & Logs"
- **Sub-actions**:
  - "System analytics" → `/system-analytics`
  - "Audit logs" → `/system-analytics?tab=logs`
  - "Connection health" → `/connection-health`
- **Badge**: None
- **Open Button**: Navigates to `/system-analytics`

### My Work / Queues Section

**List/Table Widget with Rows:**
1. **Pending User Invitations**
   - Shows: Email, Name, Role, Sent date
   - Click → Opens invitation detail/resend modal
   - Badge: Count

2. **Recently Failed Jobs / Errors**
   - Shows: Error type, Affected resource, Time
   - Click → Opens error detail with stack trace
   - Badge: Count (red if critical)

3. **Permission Change Requests**
   - Shows: Requestor, Resource, Requested permission, Date
   - Click → Opens approval modal
   - Badge: Count

4. **Manufacturers with Late Jobs**
   - Shows: Manufacturer name, Job code, Days overdue
   - Click → Navigates to `/manufacturing?manufacturer={id}`
   - Badge: Count

5. **Unmatched Financial Records (>30 days)**
   - Shows: Order code, Amount, Days unmatched
   - Click → Opens financial matching modal
   - Badge: Count

### KPI Section (Lower Row or Right Column)
**Option A - Lower Row:**
- 4 metric cards in horizontal row below queues

**Option B - Right Column:**
- Sidebar with stacked metric cards

**Metrics Displayed:**
1. **Total Users**: Count by role (Admin: X, Sales: Y, etc.)
2. **System Revenue**: Total with trend indicator
3. **Active Orders**: Count with status breakdown
4. **System Health**: Health score with details link

**Alternative Approach:**
- Single "View Metrics & KPIs" tile that links to `/admin/dashboard`
- Dashboard contains all detailed analytics and charts

---

## Sales Role Home

### Route: `/sales/home`

### Hero Section
**Left Side:**
- **Welcome Message**: "Welcome, [Salesperson Name]"
- **Subtitle**: "Run your pipeline - Close more deals efficiently"
- **Quick Stats Bar**: 
  - Deals this week
  - Quota progress percentage
  - Conversion rate

**Right Side:**
- **Primary Create Dropdown**:
  - New Deal (lead)
  - New Quote
  - New Organization
  - New Contact
  - Quick Log Activity

### Primary Workflow Tiles (3-column grid)

**1. Run My Pipeline**
- **Icon**: Target icon with gradient background
- **Title**: "Run My Pipeline"
- **Sub-actions**:
  - "View board" → `/leads?view=kanban`
  - "Filter hot leads" → `/leads?stage=hot_lead`
  - "This week's tasks" → `/leads?filter=week`
- **Badge**: Count of hot leads
- **Stats Preview**: Mini pipeline breakdown (Future: X, Lead: Y, Hot: Z)
- **Open Button**: Navigates to `/leads` with deal pipeline board

**2. Work This Week**
- **Icon**: Calendar icon with gradient background
- **Title**: "Work This Week"
- **Sub-actions**:
  - "Deals closing soon" → Filtered list
  - "Follow-ups due" → Task list
  - "Quotes to send" → Quote queue
- **Badge**: Count of items due this week
- **Stats Preview**: "X deals, Y follow-ups, Z quotes"
- **Open Button**: Navigates to filtered view of weekly work

**3. Start a New Deal**
- **Icon**: Plus circle icon with gradient background
- **Title**: "Start a New Deal"
- **Sub-actions**:
  - "From new org" → Create org + lead flow
  - "From existing org" → Lead creation modal
  - "Import from email" → Email integration
- **Badge**: None
- **Quick Action**: Direct button to create lead modal
- **Open Button**: Opens guided deal creation wizard

**4. Client Portal Links**
- **Icon**: Link icon with gradient background
- **Title**: "Client Portal Links"
- **Sub-actions**:
  - "Active portals" → List of live portals
  - "Generate new link" → Portal creation
  - "Portal analytics" → View engagement
- **Badge**: Count of active portals
- **Stats Preview**: "X active, Y pending submission"
- **Open Button**: Navigates to portal management view

**5. My Organizations**
- **Icon**: Building icon with gradient background
- **Title**: "My Organizations"
- **Sub-actions**:
  - "All organizations" → `/organizations`
  - "Add organization" → Create modal
  - "Recent activity" → Activity feed
- **Badge**: None
- **Stats Preview**: "X organizations, Y active this month"
- **Open Button**: Navigates to `/organizations` filtered to user's orgs

**6. Quote Generator**
- **Icon**: FileText icon with gradient background
- **Title**: "Quote Generator"
- **Sub-actions**:
  - "New quote" → Quote creation wizard
  - "Draft quotes" → Unsent quotes
  - "Sent quotes" → Tracking view
- **Badge**: Count of draft quotes
- **Stats Preview**: "X sent this month, Y% acceptance rate"
- **Open Button**: Navigates to `/quotes`

### My Work / Queues Section

**Priority Queue (Always Visible):**
1. **Deals Without a Design Brief**
   - Shows: Deal code, Organization, Days since creation
   - Click → Opens deal detail with brief form
   - Action: "Add Brief" button
   - Badge: Count

2. **Deals Awaiting Client Portal Submission**
   - Shows: Deal code, Organization, Portal sent date
   - Click → Opens portal link + analytics
   - Action: "Send Reminder" button
   - Badge: Count

3. **Quotes Waiting to be Sent**
   - Shows: Quote number, Organization, Created date
   - Click → Opens quote review/send modal
   - Action: "Review & Send" button
   - Badge: Count

4. **Orders with Open Issues**
   - Shows: Order code, Issue type, Days open
   - Click → Opens order detail with issue focus
   - Action: "Resolve" button
   - Badge: Count (red if critical)

5. **Follow-ups Due Today**
   - Shows: Contact name, Organization, Last contact
   - Click → Opens contact detail with activity log
   - Action: "Log Follow-up" button
   - Badge: Count

### Metrics Dashboard Link
- **Tile**: "View My Metrics"
- Links to `/sales/dashboard`
- Preview: Mini charts or key metrics (quota attainment, conversion rate, pipeline value)

---

## Designer Role Home

### Route: `/designer/home`

### Hero Section
**Left Side:**
- **Welcome Message**: "Welcome, [Designer Name]"
- **Subtitle**: "Your creative workspace - Bring ideas to life"
- **Quick Stats Bar**:
  - Active jobs count
  - Approval rate this month
  - Renditions completed this week

**Right Side:**
- **Primary Create Dropdown**:
  - Start Design from Brief
  - Upload Rendition
  - Create Design Portfolio Entry
  - Request Feedback

### Primary Workflow Tiles (2-3 column grid)

**1. My Active Jobs**
- **Icon**: Palette icon with gradient background
- **Title**: "My Active Jobs"
- **Sub-actions**:
  - "In progress" → `/design-jobs?status=in_progress&designer=me`
  - "Pending review" → `/design-jobs?status=review&designer=me`
  - "Start new job" → Available job queue
- **Badge**: Count of in-progress jobs
- **Stats Preview**: "X in progress, Y awaiting review"
- **Visual**: Mini thumbnails of recent designs
- **Open Button**: Navigates to `/design-jobs` filtered to user's jobs

**2. Jobs Needing Attention**
- **Icon**: AlertCircle icon with gradient background
- **Title**: "Jobs Needing Attention"
- **Sub-actions**:
  - "Rush jobs" → Urgent job queue
  - "Revision requests" → Jobs needing changes
  - "Awaiting files" → Jobs blocked by missing assets
- **Badge**: Count of urgent items (red if rush jobs present)
- **Stats Preview**: "X rush, Y revisions, Z blocked"
- **Open Button**: Navigates to filtered urgent jobs view

**3. Design Resources & References**
- **Icon**: BookOpen icon with gradient background
- **Title**: "Design Resources & References"
- **Sub-actions**:
  - "Style guides" → `/design-resources?type=guidelines`
  - "Brand assets" → Organization logos & colors
  - "Templates" → Design templates
- **Badge**: None
- **Stats Preview**: "X style guides, Y brand kits available"
- **Open Button**: Navigates to `/design-resources`

**4. Portfolio & Completed Work**
- **Icon**: Award icon with gradient background
- **Title**: "Portfolio & Completed Work"
- **Sub-actions**:
  - "View portfolio" → `/design-portfolio`
  - "Recent approvals" → Approved designs
  - "Add to portfolio" → Portfolio entry creation
- **Badge**: Count of recent approvals
- **Stats Preview**: "X completed this month"
- **Visual**: Mini grid of portfolio pieces
- **Open Button**: Navigates to `/design-portfolio`

**5. Feedback & Collaboration**
- **Icon**: MessageSquare icon with gradient background
- **Title**: "Feedback & Collaboration"
- **Sub-actions**:
  - "Pending feedback" → Jobs awaiting client response
  - "Internal notes" → Team comments
  - "Request review" → Internal review requests
- **Badge**: Count of unread feedback
- **Stats Preview**: "X pending responses"
- **Open Button**: Navigates to feedback dashboard

### My Work / Queues Section

**Job Queue (Kanban-style or List):**
1. **Assigned to Me - Not Started**
   - Shows: Job code, Organization, Deadline, Urgency
   - Click → Opens job detail with brief
   - Action: "Start Job" button
   - Visual: Brief preview, reference images
   - Badge: Count

2. **In Progress - Update Required**
   - Shows: Job code, Current rendition count, Last update
   - Click → Opens job workspace
   - Action: "Upload Rendition" button
   - Visual: Current design thumbnails
   - Badge: Count

3. **In Review - Awaiting Approval**
   - Shows: Job code, Submitted date, Reviewer
   - Click → Opens review status view
   - Action: "View Feedback" button
   - Badge: Count

4. **Revision Requests**
   - Shows: Job code, Feedback summary, Requested by
   - Click → Opens job with feedback highlighted
   - Action: "Start Revision" button
   - Badge: Count (red if urgent)

5. **Ready for Final Delivery**
   - Shows: Job code, Approved date, Delivery format needed
   - Click → Opens delivery prep view
   - Action: "Prepare Files" button
   - Badge: Count

### Metrics Dashboard Link
- **Tile**: "View Performance Metrics"
- Links to `/designer/dashboard`
- Preview: Approval rate, average turnaround time, jobs completed

---

## Operations Role Home

### Route: `/ops/home`

### Hero Section
**Left Side:**
- **Welcome Message**: "Welcome, Operations Manager"
- **Subtitle**: "Control center - Keep production running smoothly"
- **Quick Stats Bar**:
  - Orders in production
  - On-time delivery rate
  - Capacity utilization

**Right Side:**
- **Primary Create Dropdown**:
  - New Manufacturing Assignment
  - New Event
  - Create Task
  - Schedule Production
  - Add to Catalog

### Primary Workflow Tiles (3-column grid)

**1. Production Queue**
- **Icon**: Factory icon with gradient background
- **Title**: "Production Queue"
- **Sub-actions**:
  - "Active manufacturing" → `/manufacturing?status=active`
  - "Awaiting confirmation" → `/manufacturing?status=awaiting_admin_confirmation`
  - "Assign jobs" → Manufacturer assignment view
- **Badge**: Count of unassigned jobs
- **Stats Preview**: "X in production, Y awaiting assignment"
- **Visual**: Production timeline preview
- **Open Button**: Navigates to `/manufacturing`

**2. Orders Requiring Action**
- **Icon**: ShoppingCart icon with gradient background
- **Title**: "Orders Requiring Action"
- **Sub-actions**:
  - "New orders" → `/orders?status=new`
  - "Waiting sizes" → `/orders?status=waiting_sizes`
  - "Ready for invoice" → Orders ready for invoicing
- **Badge**: Count of orders needing action
- **Stats Preview**: "X new, Y waiting sizes, Z ready"
- **Open Button**: Navigates to filtered orders view

**3. Design Jobs - Ops View**
- **Icon**: Palette icon with gradient background
- **Title**: "Design Jobs Pipeline"
- **Sub-actions**:
  - "Pending assignment" → `/design-jobs?status=pending`
  - "In review" → `/design-jobs?status=review`
  - "Assign designer" → Designer assignment modal
- **Badge**: Count of unassigned jobs
- **Stats Preview**: "X pending, Y in review"
- **Open Button**: Navigates to `/design-jobs?view=assignments`

**4. Manufacturer Management**
- **Icon**: Warehouse icon with gradient background
- **Title**: "Manufacturer Management"
- **Sub-actions**:
  - "Active manufacturers" → `/manufacturer-management`
  - "Performance review" → Manufacturer metrics
  - "Add manufacturer" → Create manufacturer modal
- **Badge**: None
- **Stats Preview**: "X active manufacturers, Y% on-time rate"
- **Open Button**: Navigates to `/manufacturer-management`

**5. Capacity & Scheduling**
- **Icon**: Calendar icon with gradient background
- **Title**: "Capacity & Scheduling"
- **Sub-actions**:
  - "Capacity dashboard" → `/capacity-dashboard`
  - "Production schedule" → `/production-schedule`
  - "Order map" → `/order-map`
- **Badge**: Alert if capacity exceeded
- **Stats Preview**: "X% capacity utilized"
- **Visual**: Mini capacity gauge
- **Open Button**: Navigates to `/capacity-dashboard`

**6. Team Stores & Events**
- **Icon**: Store icon with gradient background
- **Title**: "Team Stores & Events"
- **Sub-actions**:
  - "Active stores" → `/team-stores?status=active`
  - "Upcoming events" → `/events?upcoming=true`
  - "Event wizard" → `/event-wizard`
- **Badge**: Count of stores needing setup
- **Stats Preview**: "X active stores, Y upcoming events"
- **Open Button**: Navigates to `/team-stores`

### My Work / Queues Section

**Operations Queue:**
1. **Manufacturing Jobs Awaiting Confirmation**
   - Shows: Job code, Manufacturer, Submitted date
   - Click → Opens manufacturing detail for approval
   - Action: "Approve" / "Request Changes" buttons
   - Badge: Count

2. **Orders Without Design Approval**
   - Shows: Order code, Organization, Days waiting
   - Click → Opens order detail with design focus
   - Action: "Review Design" button
   - Badge: Count

3. **Size Validations Pending**
   - Shows: Order code, Organization, Submitted date
   - Click → Opens size checker interface
   - Action: "Validate Sizes" button
   - Badge: Count

4. **Production Delays / Issues**
   - Shows: Manufacturing job, Issue type, Days delayed
   - Click → Opens issue resolution interface
   - Action: "Contact Manufacturer" / "Escalate" buttons
   - Badge: Count (red if critical)

5. **Events Needing Coordination**
   - Shows: Event name, Date, Setup status
   - Click → Opens event detail
   - Action: "Update Status" button
   - Badge: Count

### Metrics Dashboard Link
- **Tile**: "View Operations Analytics"
- Links to `/ops/dashboard`
- Preview: Production efficiency, order fulfillment rates, capacity trends

---

## Manufacturer Role Home

### Route: `/manufacturer/home`

### Hero Section
**Left Side:**
- **Welcome Message**: "Welcome, [Manufacturer Name]"
- **Subtitle**: "Your production dashboard - Deliver quality on time"
- **Quick Stats Bar**:
  - Active jobs count
  - Jobs due this week
  - On-time completion rate

**Right Side:**
- **Primary Create Dropdown**:
  - View Today's Jobs
  - Update Job Status
  - Upload Production Photos
  - Report Issue

### Primary Workflow Tiles (2-3 column grid)

**1. My Active Jobs**
- **Icon**: Package icon with gradient background
- **Title**: "My Active Jobs"
- **Sub-actions**:
  - "In production" → Jobs currently being worked on
  - "Quality check" → Jobs ready for QC
  - "Ready to ship" → Completed jobs
- **Badge**: Count of active jobs
- **Stats Preview**: "X in production, Y ready for QC"
- **Visual**: Job status breakdown
- **Open Button**: Navigates to `/manufacturing?manufacturer=me&status=active`

**2. Jobs Due This Week**
- **Icon**: Clock icon with gradient background
- **Title**: "Jobs Due This Week"
- **Sub-actions**:
  - "Due today" → Urgent jobs
  - "Due this week" → Weekly schedule
  - "Overdue" → Late jobs (if any)
- **Badge**: Count with urgency indicator
- **Stats Preview**: "X due today, Y this week"
- **Visual**: Timeline view of due dates
- **Open Button**: Navigates to filtered view by due date

**3. Specifications & Requirements**
- **Icon**: FileText icon with gradient background
- **Title**: "Specifications & Requirements"
- **Sub-actions**:
  - "View all specs" → `/order-specifications`
  - "Fabric requirements" → Fabric details
  - "Size charts" → Size breakdown
- **Badge**: None
- **Stats Preview**: Quick access to common specs
- **Open Button**: Navigates to specifications view

**4. Quality & Completion**
- **Icon**: CheckCircle icon with gradient background
- **Title**: "Quality & Completion"
- **Sub-actions**:
  - "Upload photos" → Production photo upload
  - "Submit for approval" → Completion submission
  - "Report issue" → Issue reporting
- **Badge**: Count of jobs ready to submit
- **Stats Preview**: "X ready for submission"
- **Open Button**: Opens quality submission workflow

### My Work / Queues Section

**Production Queue:**
1. **New Assignments**
   - Shows: Job code, Order details, Deadline, Quantity
   - Click → Opens job detail with full specifications
   - Action: "Accept Job" / "Request Clarification" buttons
   - Badge: Count

2. **In Production - Update Status**
   - Shows: Job code, Current status, Days in production
   - Click → Opens status update interface
   - Action: "Update Status" dropdown
   - Visual: Current stage indicator
   - Badge: Count

3. **Ready for Quality Check**
   - Shows: Job code, Completion date, Next step
   - Click → Opens QC checklist
   - Action: "Submit for QC" button
   - Badge: Count

4. **Awaiting Materials / Information**
   - Shows: Job code, What's needed, Requested date
   - Click → Opens communication thread
   - Action: "Follow Up" button
   - Badge: Count

5. **Completed This Week**
   - Shows: Job code, Completion date, Delivery status
   - Click → Opens completion details
   - Action: "View Receipt" button
   - Badge: None (informational)

### Metrics Dashboard Link
- **Tile**: "View My Performance"
- Links to `/manufacturer/dashboard`
- Preview: On-time rate, jobs completed, quality metrics

---

## Finance Role Home

### Route: `/finance/home`

### Hero Section
**Left Side:**
- **Welcome Message**: "Welcome, Finance Manager"
- **Subtitle**: "Financial control center - Track revenue and expenses"
- **Quick Stats Bar**:
  - Total revenue this month
  - Outstanding invoices
  - Commission payments due

**Right Side:**
- **Primary Create Dropdown**:
  - New Invoice
  - Record Payment
  - Record Commission
  - Create Expense Entry
  - Generate Financial Report

### Primary Workflow Tiles (3-column grid)

**1. Financial Matching**
- **Icon**: Link icon with gradient background
- **Title**: "Financial Matching"
- **Sub-actions**:
  - "Unmatched records" → `/finance?tab=matching&filter=unmatched`
  - "Match by order" → Order-based matching
  - "Match by date" → Date-range matching
- **Badge**: Count of unmatched records (red if over 30 days)
- **Stats Preview**: "X unmatched, Y pending review"
- **Alert**: Highlight if critical unmatched items exist
- **Open Button**: Navigates to `/finance?tab=matching`

**2. Invoice Management**
- **Icon**: FileText icon with gradient background
- **Title**: "Invoice Management"
- **Sub-actions**:
  - "Create invoice" → Invoice creation wizard
  - "Pending invoices" → Unpaid invoices
  - "Overdue invoices" → Late payment tracking
- **Badge**: Count of overdue invoices
- **Stats Preview**: "X pending, Y overdue, $Z total"
- **Open Button**: Navigates to `/finance?tab=invoices`

**3. Payment Processing**
- **Icon**: CreditCard icon with gradient background
- **Title**: "Payment Processing"
- **Sub-actions**:
  - "Record payment" → Payment entry form
  - "Recent payments" → Payment history
  - "Payment methods" → Method breakdown
- **Badge**: None
- **Stats Preview**: "$X received this month"
- **Open Button**: Navigates to `/finance?tab=payments`

**4. Commission Tracking**
- **Icon**: Award icon with gradient background
- **Title**: "Commission Tracking"
- **Sub-actions**:
  - "Pending commissions" → Unpaid commissions
  - "Pay commissions" → Payment processing
  - "Commission reports" → Salesperson breakdown
- **Badge**: Count of unpaid commission entries
- **Stats Preview**: "$X pending, Y salespeople"
- **Open Button**: Navigates to `/finance?tab=commissions`

**5. Expense Management**
- **Icon**: Receipt icon with gradient background
- **Title**: "Expense Management"
- **Sub-actions**:
  - "Record expense" → Expense entry
  - "Expense categories" → Category breakdown
  - "Budget tracking" → Budget vs. actual
- **Badge**: None
- **Stats Preview**: "$X spent this month"
- **Open Button**: Navigates to expense management view

**6. Financial Reports**
- **Icon**: BarChart icon with gradient background
- **Title**: "Financial Reports"
- **Sub-actions**:
  - "Monthly summary" → Month-over-month report
  - "P&L statement" → Profit & loss
  - "Cash flow" → Cash flow analysis
- **Badge**: None
- **Stats Preview**: "Net profit: $X this month"
- **Open Button**: Navigates to `/finance?tab=reports`

### My Work / Queues Section

**Finance Queue:**
1. **Unmatched Financial Records (>30 days)**
   - Shows: Order code, Amount, Type, Days unmatched
   - Click → Opens financial matching modal
   - Action: "Match Now" button
   - Badge: Count (critical alert if any)

2. **Invoices Overdue (>30 days)**
   - Shows: Invoice number, Organization, Amount, Days overdue
   - Click → Opens invoice detail
   - Action: "Send Reminder" / "Follow Up" buttons
   - Badge: Count

3. **Commission Payments Due**
   - Shows: Salesperson name, Period, Amount, Due date
   - Click → Opens commission payment modal
   - Action: "Process Payment" button
   - Badge: Count

4. **Pending Invoices Requiring Review**
   - Shows: Invoice number, Organization, Amount, Created date
   - Click → Opens invoice for approval
   - Action: "Approve" / "Request Changes" buttons
   - Badge: Count

5. **Payment Reconciliation Needed**
   - Shows: Payment reference, Amount, Date, Status
   - Click → Opens reconciliation interface
   - Action: "Reconcile" button
   - Badge: Count

### Metrics Dashboard Link
- **Tile**: "View Financial Analytics"
- Links to `/finance/dashboard`
- Preview: Revenue trends, expense breakdown, profit margins

---

## Navigation & Layout

### Collapsible Sidebar

**Structure (All Roles See Relevant Sections):**

**1. Overview**
- Dashboard (role-specific dashboard)
- Tasks

**2. Sales & CRM** (Visible based on permissions)
- Leads
- Organizations
- Contacts
- Salespeople
- Quotes

**3. Production & Design** (Visible based on permissions)
- Design Jobs
- Orders
- Manufacturing
- Team Stores
- Events

**4. Inventory & Catalog** (Visible based on permissions)
- Catalog
- Manufacturer Management
- Designer Management
- Fabric Management

**5. Finance** (Visible based on permissions)
- Finance

**6. Admin** (Admin only)
- User Management
- Permission Management

**7. Role Workflows** (Admin only, collapsible)
- **Sales Section**:
  - Sales Analytics
  - Sales Tracker
  - Sales Resources
- **Design Section**:
  - Design Portfolio
  - Design Resources
- **Operations Section**:
  - Order Map
  - Pipeline View
  - Size Checker
  - Capacity Dashboard
  - Order Specifications
- **Admin Section**:
  - System Analytics
  - Connection Health

**Bottom Section (Always Visible)**
- Settings
- User Profile with logout

### Quick Create Button (Top Bar)

**Contextual Options Based on Page:**
- If on `/leads` → "New Lead" highlighted
- If on `/orders` → "New Order" highlighted
- Always shows all available create options based on role permissions

**Admin Quick Create:**
- Create User
- Create Lead
- Create Order
- Create Organization
- Create Contact
- Create Product
- Create Design Job

**Sales Quick Create:**
- Create Lead
- Create Quote
- Create Organization
- Create Contact
- Log Activity

**Designer Quick Create:**
- Upload Rendition
- Start Design from Brief
- Add to Portfolio

**Ops Quick Create:**
- Create Manufacturing Assignment
- Create Task
- Create Event

**Manufacturer Quick Create:**
- Update Job Status
- Upload Production Photos
- Report Issue

**Finance Quick Create:**
- Create Invoice
- Record Payment
- Record Commission
- Create Expense Entry

### Global Search (Top Bar)

**Search Across:**
- Pages (navigation items)
- Organizations
- Leads
- Orders
- Products
- Design Jobs
- Manufacturing Jobs
- Contacts

**Search Results Grouped By:**
- Pages (navigation)
- Organizations (with logo)
- Leads (with stage)
- Orders (with status)
- Products (with SKU)

**Click Behavior:**
- Pages → Navigate to page
- Data items → Open in split view or detail modal

### User Flow Examples

**Example 1: Admin Creating a New User**
1. Login → Redirect to `/admin/home`
2. See "User & Role Management" tile
3. Click "Manage users" sub-action OR click "Open" button
4. Navigate to `/user-management`
5. Click "Add User" button
6. Fill out user creation modal
7. User created → Return to `/user-management` with success toast

**Example 2: Sales Rep Working a Lead**
1. Login → Redirect to `/sales/home`
2. See "My Work / Queues" section
3. Click on "Deals Without a Design Brief"
4. See list of deals
5. Click on specific deal → Navigate to `/leads?selected={leadId}`
6. Split view opens with lead detail
7. Add design brief in form
8. Submit → Lead updated, queue count decrements

**Example 3: Designer Completing a Job**
1. Login → Redirect to `/designer/home`
2. See "My Active Jobs" tile with badge count
3. Click "In progress" sub-action
4. Navigate to `/design-jobs?status=in_progress&designer=me`
5. See kanban board or list of active jobs
6. Click on job to open detail
7. Upload new rendition
8. Submit for review
9. Job moves to "In Review" status
10. "My Active Jobs" badge updates

**Example 4: Ops Manager Assigning Manufacturing**
1. Login → Redirect to `/ops/home`
2. See "Production Queue" tile with unassigned badge
3. Click tile to open `/manufacturing`
4. See list of manufacturing jobs
5. Filter to "Awaiting assignment"
6. Click job to open detail
7. Assign to manufacturer from dropdown
8. Manufacturer receives notification
9. Job moves out of unassigned queue

### Data Preservation

**All Current Data Remains Accessible:**
- Every field, every table, every relationship
- No data is hidden or removed
- Only the entry points and workflows change
- Existing detail pages remain intact
- All modals and forms remain functional

**Data Flow:**
- Home → Workflow tile → Existing page/modal
- Home → Queue item → Existing detail view
- Sidebar → Navigation item → Existing page
- All existing functionality preserved

### Mobile Considerations

**Home Page on Mobile:**
- Hero section stacks vertically
- Workflow tiles become single column
- Queues scroll vertically
- Tap targets are 44x44px minimum
- Create dropdown becomes full-screen modal

**Sidebar on Mobile:**
- Hamburger menu opens sidebar as sheet
- Groups expand/collapse
- Active item highlighted
- Close on navigation

This architecture maintains all existing functionality while reorganizing the user experience around role-specific workflows and action-oriented home pages. Each role gets a focused command center that surfaces their most important tasks and provides quick access to all relevant data and functions.
